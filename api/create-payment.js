/**
 * API Vercel — Criar preferência de pagamento Mercado Pago
 * POST /api/create-payment
 */

import mercadopago from 'mercadopago';

// Configura Mercado Pago com ACCESS_TOKEN do ambiente
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

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
    const { items, payer, orderId, metadata, deliveryFee } = req.body;

    // Validação básica
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items inválidos' });
    }

    // Constrói array de itens para Mercado Pago
    const mpItems = items.map(item => ({
      title: item.name,
      quantity: item.qty,
      unit_price: Number(item.price),
      currency_id: 'BRL'
    }));

    // Adiciona taxa de entrega como item separado se houver
    const fee = Number(deliveryFee || 0);
    if (fee > 0) {
      mpItems.push({
        title: 'Taxa de entrega',
        quantity: 1,
        unit_price: fee,
        currency_id: 'BRL'
      });
    }

    // Valida e normaliza email
    const email = payer.email && payer.email.includes('@') ? payer.email : 'cliente@bellamassa.com';

    // Limpa telefone removendo tudo que não for número
    const cleanPhone = String(payer.phone || '').replace(/\D/g, '');

    // Logs para depuração
    console.log('PAYER RECEBIDO:', payer);
    console.log('EMAIL ENVIADO:', email);
    console.log('PHONE ENVIADO:', cleanPhone);

    // Cria preferência de pagamento
    const preference = {
      items: mpItems,
      payer: {
        name: payer.name,
        email: email,
        phone: {
          number: Number(cleanPhone)
        }
      },
      back_urls: {
        success: `${process.env.SITE_URL}/pedido-confirmado.html?status=success`,
        failure: `${process.env.SITE_URL}/pedido-confirmado.html?status=failure`,
        pending: `${process.env.SITE_URL}/pedido-confirmado.html?status=pending`
      },
      payment_methods: {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' },
          { id: 'atm' },
          { id: 'prepaid_card' },
          { id: 'account_money' }
        ],
        excluded_payment_methods: [
          { id: 'master' },
          { id: 'visa' },
          { id: 'amex' },
          { id: 'hipercard' },
          { id: 'elo' },
          { id: 'bolbradesco' },
          { id: 'pec' }
        ],
        installments: 1
      },
      auto_return: 'all',
      external_reference: orderId,
      metadata: metadata || {}
    };

    const result = await mercadopago.preferences.create(preference);

    // Retorna init_point e preference_id
    res.status(200).json({
      init_point: result.body.init_point,
      preference_id: result.body.id,
      sandbox_init_point: result.body.sandbox_init_point
    });

  } catch (error) {
    const mpError = error?.cause || error?.response?.data || error?.message || String(error);
    console.error('Erro MP completo:', JSON.stringify(mpError));
    console.error('Stack:', error?.stack);
    res.status(500).json({
      error: 'Erro ao criar pagamento',
      details: error.message,
      mp_error: typeof mpError === 'object' ? JSON.stringify(mpError) : mpError
    });
  }
}
