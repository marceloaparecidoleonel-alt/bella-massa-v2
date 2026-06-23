/**
 * API Vercel — Verifica status de pagamento PIX
 * GET /api/check-pix-status?payment_id=xxx
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { payment_id } = req.query;

  if (!payment_id) {
    return res.status(400).json({ error: 'payment_id obrigatório' });
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
      }
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      return res.status(500).json({ error: 'Erro ao consultar pagamento' });
    }

    return res.status(200).json({
      status: data.status,
      status_detail: data.status_detail
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
