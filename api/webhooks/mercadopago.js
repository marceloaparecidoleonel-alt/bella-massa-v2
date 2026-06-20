/**
 * API Vercel — Webhook Mercado Pago
 * POST /api/webhooks/mercadopago
 * Recebe notificações de pagamento e atualiza o pedido no Firestore
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import mercadopago from 'mercadopago';

// Inicializa Firebase Admin (usando variáveis de ambiente do Vercel)
let db;
try {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  };
  const app = initializeApp({
    credential: cert(firebaseConfig)
  });
  db = getFirestore(app);
} catch (error) {
  console.error('Erro ao inicializar Firebase Admin:', error);
}

export default async function handler(req, res) {
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
    const { topic, resource } = req.query;
    const body = req.body;

    // Mercado Pago envia notificações via topic
    if (topic === 'payment') {
      const paymentId = body.id || body.data?.id;

      if (!paymentId) {
        return res.status(400).json({ error: 'Payment ID não fornecido' });
      }

      // Configura Mercado Pago
      mercadopago.configure({
        access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
      });

      const payment = await mercadopago.payment.findById(paymentId);
      const paymentData = payment.body;

      // Obtém o external_reference (ID do pedido no Firestore)
      const orderId = paymentData.external_reference;

      if (!orderId) {
        console.log('Pagamento sem external_reference:', paymentId);
        return res.status(200).json({ received: true });
      }

      // Atualiza o pedido no Firestore
      if (db) {
        const orderRef = db.collection('pedidos').doc(orderId);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
          const statusMap = {
            'approved': 'pago',
            'pending': 'pendente',
            'rejected': 'cancelado',
            'cancelled': 'cancelado',
            'refunded': 'reembolsado'
          };

          const paymentStatus = paymentData.status;
          const newStatus = statusMap[paymentStatus] || paymentStatus;

          await orderRef.update({
            paymentId: paymentId,
            paymentStatus: paymentStatus,
            status: newStatus,
            paymentDetails: {
              payment_method: paymentData.payment_method_id,
              payment_type: paymentData.payment_type,
              transaction_amount: paymentData.transaction_amount,
              date_approved: paymentData.date_approved,
              date_created: paymentData.date_created
            },
            atualizadoEm: new Date()
          });

          console.log(`Pedido ${orderId} atualizado: ${newStatus}`);
        } else {
          console.log(`Pedido ${orderId} não encontrado no Firestore`);
        }
      }

      return res.status(200).json({ received: true });
    }

    // Outros tipos de notificação (merchant_order, etc.)
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Erro no webhook Mercado Pago:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
}
