/**
 * API Vercel — Webhook Mercado Pago
 * POST /api/webhooks/mercadopago
 * Recebe notificações de pagamento e atualiza o pedido no Firestore
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializa Firebase Admin — reutiliza instância existente em ambiente serverless
let db;
try {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  };
  const app = getApps().length === 0
    ? initializeApp({ credential: cert(firebaseConfig) })
    : getApp();
  db = getFirestore(app);
} catch (error) {
  console.error('Erro ao inicializar Firebase Admin:', error);
}

export default async function handler(req, res) {
  // Diagnóstico de variáveis de ambiente
  console.log('ENV check — PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID, '| CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL, '| PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY, '| MP_TOKEN:', !!process.env.MERCADO_PAGO_ACCESS_TOKEN);
  console.log('DB disponível:', !!db);

  // Habilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responde a preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic } = req.query;
    const body = req.body;

    // Suporta formato IPN v2 (body.type) e legacy (topic query param)
    const isPaymentNotification =
      topic === 'payment' ||
      (body && body.type === 'payment') ||
      (body && body.action && body.action.startsWith('payment'));

    if (!isPaymentNotification) {
      console.log('Webhook ignorado — tipo:', topic || body?.type || 'desconhecido');
      return res.status(200).json({ received: true });
    }

    // Extrai payment ID — IPN v2 usa body.data.id, legacy usa body.id
    const paymentId = (body.data && body.data.id) || body.id || body.resource;

    if (!paymentId) {
      console.warn('Webhook sem paymentId:', JSON.stringify(body));
      return res.status(400).json({ error: 'Payment ID não fornecido' });
    }

    // Consulta pagamento via API REST do MP (sem dependência de SDK)
    console.log('Consultando pagamento MP:', paymentId);
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
    });

    if (!mpRes.ok) {
      console.error('Erro ao consultar pagamento MP:', mpRes.status);
      return res.status(500).json({ error: 'Erro ao consultar pagamento' });
    }

    const paymentData = await mpRes.json();

    // Obtém o external_reference (ID do pedido no Firestore)
    const orderId = paymentData.external_reference;

    if (!orderId) {
      console.log('Pagamento sem external_reference:', paymentId);
      return res.status(200).json({ received: true });
    }

    const paymentStatus = paymentData.status;
    console.log(`Pagamento MP ${paymentId}: status=${paymentStatus}`);

    // Atualiza o pedido no Firestore
    if (db) {
      const orderRef = db.collection('pedidos').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        console.warn(`Pedido ${orderId} não encontrado no Firestore`);
        return res.status(200).json({ received: true });
      }

      const currentStatus = orderDoc.data().status || 'pix_pendente';

      // Ordem de progressão: nunca rebaixa status já avançado
      const STATUS_ORDER = ['pix_pendente', 'aguardando_pix', 'pendente', 'producao', 'pronto', 'entrega', 'entregue'];
      const currentIdx = STATUS_ORDER.indexOf(currentStatus);

      // Só atualiza status para aprovado/cancelado/reembolsado
      let newStatus = currentStatus; // padrão: mantém atual
      if (paymentStatus === 'approved') {
        // PIX aprovado: avança de pix_pendente ou aguardando_pix para pendente
        if (currentStatus === 'pix_pendente' || currentStatus === 'aguardando_pix') {
          newStatus = 'pendente';
        }
        // Se já está em status mais avançado, mantém
      } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
        // Só cancela se ainda não foi processado
        if (currentStatus === 'pix_pendente' || currentStatus === 'aguardando_pix') {
          newStatus = 'cancelado';
        }
      } else if (paymentStatus === 'refunded') {
        newStatus = 'reembolsado';
      }
      // pending / in_process: não faz nada (mantém status atual)

      const updateData = {
        paymentId: String(paymentId),
        paymentStatus: paymentStatus,
        paymentDetails: {
          payment_method: paymentData.payment_method_id,
          payment_type: paymentData.payment_type_id,
          transaction_amount: paymentData.transaction_amount,
          date_approved: paymentData.date_approved,
          date_created: paymentData.date_created
        },
        atualizadoEm: new Date()
      };

      // Só atualiza o campo status se de fato mudou
      if (newStatus !== currentStatus) {
        updateData.status = newStatus;
        console.log(`Pedido ${orderId}: ${currentStatus} → ${newStatus} (MP: ${paymentStatus})`);
      } else {
        console.log(`Pedido ${orderId}: status mantido em ${currentStatus} (MP: ${paymentStatus})`);
      }

      await orderRef.update(updateData);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Erro no webhook Mercado Pago:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
}
