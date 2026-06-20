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
    const { items, payer, orderId, metadata } = req.body;

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

    // Cria preferência de pagamento
    const preference = {
      items: mpItems,
      payer: {
        name: payer.name,
        email: payer.email || '',
        phone: {
          number: payer.phone || ''
        }
      },
      back_urls: {
        success: `${process.env.SITE_URL}/pedido-confirmado.html?status=success`,
        failure: `${process.env.SITE_URL}/pedido-confirmado.html?status=failure`,
        pending: `${process.env.SITE_URL}/pedido-confirmado.html?status=pending`
      },
      auto_return: 'approved',
      external_reference: orderId, // ID do pedido no Firestore
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
    console.error('Erro ao criar preferência Mercado Pago:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento', details: error.message });
  }
}
