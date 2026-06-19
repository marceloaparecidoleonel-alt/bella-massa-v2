# Firebase Setup — Bella Massa

---

## ⚠️ AÇÃO OBRIGATÓRIA — Corrigir erro "Missing or insufficient permissions"

O erro ocorre porque o Firestore ainda está com as **regras padrão bloqueadas**.

### Passos para corrigir (2 minutos):

1. Acesse: **https://console.firebase.google.com**
2. Selecione o projeto **bella-massa-82faf**
3. No menu esquerdo: **Firestore Database** → aba **Regras**
4. Substitua TODO o conteúdo pelo bloco abaixo:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /produtos/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /pedidos/{id} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /config/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

5. Clique em **Publicar**
6. Volte ao painel e tente salvar novamente — funcionará.

> **Sem este passo, NENHUMA escrita funciona**, independente do código.

---

## Coleções necessárias no Firestore

### `produtos`
Campos por documento:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `nome` | string | Nome do produto |
| `categoria` | string | `paes`, `bolos`, `doces`, `salgados`, `bebidas` |
| `preco` | number | Preço em reais (ex: 32.90) |
| `descricao` | string | Descrição longa |
| `descCurta` | string | Descrição curta para card |
| `imagem` | string | URL da imagem |
| `peso` | string | Peso/volume (ex: "800g") |
| `destaque` | boolean | Aparece em destaque na Home |
| `ativo` | boolean | Visível no cardápio público |
| `ordem` | number | Posição de exibição |
| `criadoEm` | timestamp | Auto preenchido |
| `atualizadoEm` | timestamp | Auto preenchido |

### `pedidos`
Campos por documento:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cliente.nome` | string | Nome do cliente |
| `cliente.telefone` | string | Telefone (chave de agrupamento de clientes) |
| `cliente.email` | string | E-mail (opcional) |
| `itens` | array | Lista de produtos pedidos |
| `total` | number | Valor total em reais |
| `taxaEntrega` | number | Taxa de entrega cobrada |
| `pagamento` | string | `cartao`, `debito`, `pix`, `dinheiro` |
| `status` | string | `novo`, `producao`, `pronto`, `entrega`, `entregue`, `cancelado` |
| `criadoEm` | timestamp | Timestamp do pedido |
| `atualizadoEm` | timestamp | Última atualização de status |

### `config`
Documentos fixos (IDs):
- `config/empresa` — nome, telefone, whatsapp, endereco, horario
- `config/entrega` — taxaFixa, pedidoMinimo, raio
- `config/social` — instagram, facebook, tiktok
- `config/operacional` — aceitarPedidos, notificacoes, delivery, bannerPromo

---

## Regras de Segurança (Firestore Rules)

Cole estas regras no [Firebase Console](https://console.firebase.google.com) → Firestore → Regras:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Produtos: leitura pública (cardápio), escrita apenas autenticado
    match /produtos/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Pedidos: qualquer um pode criar (site público), leitura/edição apenas autenticado
    match /pedidos/{id} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    // Config: leitura pública (site lê configurações), escrita apenas autenticado
    match /config/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Índices compostos necessários

O Firestore exige índice composto para `orderBy` com múltiplos campos.

### Coleção `produtos`
Crie no Firebase Console → Firestore → Índices → Composto:
- Coleção: `produtos`
- Campos: `ordem ASC`, `nome ASC`

### Coleção `produtos` (cardápio público)
- Coleção: `produtos`
- Campos: `ativo ASC`, `ordem ASC`, `nome ASC`

> **Alternativa rápida:** Ao abrir o painel admin e o console do navegador mostrar um erro com link direto para criar o índice, clique no link — o Firebase cria automaticamente.

---

## Como popular dados iniciais

1. Acesse o Firebase Console → Firestore → Adicionar documento
2. Coleção: `produtos`
3. Preencha os campos conforme a tabela acima
4. Ou use o painel admin em `admin/produtos.html` para cadastrar

---

## Autenticação

O painel admin requer login via Firebase Authentication (Email/Senha).

1. Acesse Firebase Console → Authentication → Usuários
2. Adicione um usuário com e-mail e senha
3. Use `admin/admin-login.html` para fazer login
