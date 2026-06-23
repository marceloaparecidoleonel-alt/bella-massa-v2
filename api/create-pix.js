/**
 * API Vercel — Criar pagamento PIX via Mercado Pago
 * POST /api/create-pix
 * Retorna QR Code (base64) e código copia-e-cola para exibir no site
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items, payer, orderId, deliveryFee } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items inválidos' });
    }

    // Calcula total
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
    const fee = Number(deliveryFee || 0);
    const total = subtotal + fee;

    if (total <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    // Descrição dos itens
    const description = items.map(i => `${i.qty}x ${i.name}`).join(', ');

    const email = payer?.email?.includes('@') ? payer.email : 'cliente@bellamassa.com';

    console.log('Criando PIX — total:', total, '| orderId:', orderId, '| email:', email);

    const payload = {
      transaction_amount: Number(total.toFixed(2)),
      description: description.slice(0, 60),
      payment_method_id: 'pix',
      payer: {
        email: email,
        first_name: String(payer?.name || 'Cliente').split(' ')[0],
        last_name: String(payer?.name || 'Cliente').split(' ').slice(1).join(' ') || 'Cliente',
        identification: {
          type: 'CPF',
          number: '00000000000'
        }
      },
      external_reference: orderId || '',
      notification_url: `${(process.env.SITE_URL || 'https://bella-massa-app.vercel.app').replace(/\/$/, '')}/api/webhooks/mercadopago`
    };

    console.log('Payload PIX:', JSON.stringify(payload));

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `${orderId}-${Date.now()}`
      },
      body: JSON.stringify(payload)
    });

    const data = await mpRes.json();
    console.log('Resposta MP status:', mpRes.status, '| id:', data.id, '| status:', data.status);

    if (!mpRes.ok) {
      console.error('Erro MP:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Erro ao gerar PIX',
        details: data.message || data.error || JSON.stringify(data)
      });
    }

    const pixData = data.point_of_interaction?.transaction_data;

    if (!pixData?.qr_code) {
      console.error('PIX sem QR Code:', JSON.stringify(data));
      return res.status(500).json({ error: 'PIX não disponível para esta conta' });
    }

    return res.status(200).json({
      payment_id: data.id,
      status: data.status,
      qr_code: pixData.qr_code,
      qr_code_base64: pixData.qr_code_base64,
      ticket_url: pixData.ticket_url || null
    });

  } catch (error) {
    console.error('Exceção em create-pix:', error?.message, error?.stack);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
