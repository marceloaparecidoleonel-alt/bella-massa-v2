# Configuração Mercado Pago — Bella Massa

## Variáveis de Ambiente (Vercel)

Adicione as seguintes variáveis de ambiente no painel do Vercel (Settings > Environment Variables):

### Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Token de acesso do Mercado Pago (Production ou Sandbox) | `APP_USR-1234567890-abcdef...` |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase | `bella-massa-padaria` |
| `FIREBASE_PRIVATE_KEY` | Chave privada do Firebase (service account) | `-----BEGIN PRIVATE KEY-----\n...` |
| `FIREBASE_CLIENT_EMAIL` | Email do cliente Firebase | `firebase-adminsdk-...@bella-massa-padaria.iam.gserviceaccount.com` |
| `SITE_URL` | URL do site em produção | `https://bella-massa.vercel.app` |

### Opcionais

| Variável | Descrição | Valor padrão |
|----------|-----------|-------------|
| `NODE_ENV` | Ambiente (production/development) | `production` |

## Como obter o ACCESS_TOKEN do Mercado Pago

1. Acesse [Mercado Pago Developers](https://developers.mercadopago.com.br/)
2. Faça login com sua conta
3. Vá em "Suas integrações" > "Credenciais"
4. Copie o `Access Token` de produção (ou sandbox para testes)

## Como obter as credenciais do Firebase Admin

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em Configurações do projeto > Contas de serviço
4. Clique em "Gerar nova chave privada"
5. Baixe o arquivo JSON
6. Use os valores do arquivo para as variáveis de ambiente:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (substitua `\n` por quebras de linha reais)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## Configuração do Webhook

1. No painel do Mercado Pago, vá em "Webhooks"
2. Adicione um novo webhook com a URL:
   - Produção: `https://seu-dominio.vercel.app/api/webhooks/mercadopago`
   - Sandbox: `https://seu-dominio.vercel.app/api/webhooks/mercadopago`
3. Selecione os eventos:
   - `payment`
   - `merchant_orders` (opcional)

## Fluxo de Pagamento

1. Cliente finaliza pedido no checkout
2. Frontend envia dados para `/api/create-payment`
3. Backend cria preferência no Mercado Pago
4. Frontend redireciona para `init_point` (Checkout Pro)
5. Cliente paga (PIX, cartão ou boleto)
6. Mercado Pago envia webhook para `/api/webhooks/mercadopago`
7. Backend atualiza o pedido no Firestore com status `pago`
8. Pedido aparece no painel admin com status atualizado

## Status de Pagamento

| Status Mercado Pago | Status Firestore |
|---------------------|-----------------|
| `approved` | `pago` |
| `pending` | `pendente` |
| `rejected` | `cancelado` |
| `cancelled` | `cancelado` |
| `refunded` | `reembolsado` |

## Testes em Sandbox

Para testar em ambiente de sandbox:
1. Use o `sandbox_init_point` retornado pela API
2. Use cartões de teste do Mercado Pago:
   - Aprovado: `5031 4332 1540 6351`
   - Rejeitado: `5115 4222 2222 1111`
