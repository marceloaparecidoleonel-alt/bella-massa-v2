/**
 * API Vercel — Criar preferência de pagamento Mercado Pago
 * POST /api/create-payment
 * Usa fetch direto à API REST do MP (mais confiável que SDK v1 em serverless)
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items, payer, orderId, metadata, deliveryFee } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items inválidos' });
    }

    // Itens do carrinho
    const mpItems = items.map(item => ({
      title: String(item.name),
      quantity: Number(item.qty),
      unit_price: Number(item.price),
      currency_id: 'BRL'
    }));

    // Taxa de entrega como item separado
    const fee = Number(deliveryFee || 0);
    if (fee > 0) {
      mpItems.push({
        title: 'Taxa de entrega',
        quantity: 1,
        unit_price: fee,
        currency_id: 'BRL'
      });
    }

    const email = payer?.email?.includes('@') ? payer.email : 'cliente@bellamassa.com';

    console.log('Criando preferência MP — items:', mpItems.length, '| orderId:', orderId, '| fee:', fee);

    const preference = {
      items: mpItems,
      payer: {
        name: String(payer?.name || 'Cliente'),
        email: email
      },
      back_urls: {
        success: `${process.env.SITE_URL}/pedido-confirmado.html?status=success`,
        failure: `${process.env.SITE_URL}/pedido-confirmado.html?status=failure`,
        pending: `${process.env.SITE_URL}/pedido-confirmado.html?status=pending`
      },
      auto_return: 'all',
      payment_methods: {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' },
          { id: 'atm' },
          { id: 'prepaid_card' },
          { id: 'account_money' }
        ]
      },
      external_reference: orderId || '',
      metadata: metadata || {}
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      console.error('Erro MP status:', mpRes.status, '| body:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Erro ao criar pagamento',
        details: data.message || data.error || JSON.stringify(data)
      });
    }

    console.log('Preferência criada:', data.id);
    return res.status(200).json({
      init_point: data.init_point,
      preference_id: data.id,
      sandbox_init_point: data.sandbox_init_point
    });

  } catch (error) {
    console.error('Exceção em create-payment:', error?.message, error?.stack);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
