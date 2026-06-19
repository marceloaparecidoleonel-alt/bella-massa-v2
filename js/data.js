/**
 * data.js — Bella Massa
 * Base de dados centralizada de produtos, categorias e configurações.
 * Futuramente substituída por chamadas ao Firebase Firestore.
 */

const BM_CONFIG = {
  storeName: 'Bella Massa',
  // Número do WhatsApp no formato exigido pelo wa.me (apenas dígitos, sem + ou espaços)
  whatsapp: '554396624762',
  // Endereço informado pelo cliente
  address: 'Rua Dr Xavier da Silva, Centro — Ribeirão Claro/PR',
  openHours: 'Seg–Sex 7h–20h · Sáb–Dom 7h–18h',
  minOrderDelivery: 30,
  deliveryFee: 8,
  freeDeliveryAbove: 80,
};

const BM_CATEGORIES = [
  { id: 'paes',     name: 'Pães',     icon: 'fas fa-bread-slice',        color: '#c8963e' },
  { id: 'bolos',    name: 'Bolos',    icon: 'fas fa-cake-candles',        color: '#b05e3c' },
  { id: 'doces',    name: 'Doces',    icon: 'fas fa-cookie-bite',         color: '#c8963e' },
  { id: 'salgados', name: 'Salgados', icon: 'fas fa-burger',              color: '#6b8f52' },
  { id: 'bebidas',  name: 'Bebidas',  icon: 'fas fa-mug-hot',             color: '#5c4a3a' },
];

const BM_PRODUCTS = [
  // ── Pães ──────────────────────────────────────────────────────
  {
    id: 1, category: 'paes',
    name: 'Pão de Fermentação Natural',
    description: 'Feito com levain artesanal e fermentação lenta de 18h. Casca crocante, miolo aerado e sabor levemente ácido.',
    shortDesc: 'Levain artesanal, 18h de fermentação.',
    price: 32.90,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    badge: 'Mais Vendido', badgeType: 'bestseller',
    featured: true, available: true,
    tags: ['artesanal', 'levain', 'integral'],
    weight: '800g',
  },
  {
    id: 2, category: 'paes',
    name: 'Ciabatta com Azeitonas',
    description: 'Ciabatta de fermentação natural com azeitonas pretas importadas e azeite extra-virgem. Crocante por fora, macia por dentro.',
    shortDesc: 'Azeitonas pretas e azeite extra-virgem.',
    price: 22.90,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&q=80',
    badge: 'Novo', badgeType: 'new',
    featured: true, available: true,
    tags: ['italiano', 'azeitonas'],
    weight: '400g',
  },
  {
    id: 3, category: 'paes',
    name: 'Baguete Francesa',
    description: 'Baguete clássica de farinha importada, casca dourada e crocante com miolo leve e alveolado.',
    shortDesc: 'Farinha importada, casca dourada.',
    price: 12.90,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=800&q=80',
    badge: null, badgeType: null,
    featured: false, available: true,
    tags: ['francês', 'clássico'],
    weight: '250g',
  },
  {
    id: 4, category: 'paes',
    name: 'Pão Integral com Sementes',
    description: 'Rica mistura de farinhas integrais com sementes de girassol, linhaça, chia e gergelim. Nutritivo e saboroso.',
    shortDesc: 'Sementes de girassol, linhaça e chia.',
    price: 28.90,
    image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=800&q=80',
    badge: 'Saudável', badgeType: 'healthy',
    featured: true, available: true,
    tags: ['integral', 'sementes', 'saudável'],
    weight: '600g',
  },
  {
    id: 5, category: 'paes',
    name: 'Focaccia de Alecrim',
    description: 'Focaccia macia com azeite generoso, alecrim fresco, flor de sal e tomates-cereja. Perfeita como entrada ou acompanhamento.',
    shortDesc: 'Alecrim fresco e flor de sal.',
    price: 24.90,
    image: 'https://images.unsplash.com/photo-1571919743851-5ded7cb0b57f?w=800&q=80',
    badge: null, badgeType: null,
    featured: false, available: true,
    tags: ['italiano', 'alecrim', 'entrada'],
    weight: '350g',
  },

  // ── Bolos ─────────────────────────────────────────────────────
  {
    id: 6, category: 'bolos',
    name: 'Bolo de Limão Siciliano',
    description: 'Massa úmida de limão siciliano com calda cítrica e cobertura de cream cheese levíssimo. Refrescante e sofisticado.',
    shortDesc: 'Calda cítrica e cream cheese.',
    price: 58.90,
    image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&q=80',
    badge: 'Favorito', badgeType: 'bestseller',
    featured: true, available: true,
    tags: ['limão', 'premium'],
    weight: '1kg',
  },
  {
    id: 7, category: 'bolos',
    name: 'Bolo de Cenoura com Ganache',
    description: 'Receita tradicional com cenouras frescas, óleo de girassol e cobertura de ganache de chocolate 70% cacau.',
    shortDesc: 'Ganache de chocolate 70% cacau.',
    price: 52.90,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
    badge: null, badgeType: null,
    featured: true, available: true,
    tags: ['cenoura', 'chocolate'],
    weight: '1kg',
  },
  {
    id: 8, category: 'bolos',
    name: 'Cheesecake de Frutas Vermelhas',
    description: 'Base de biscoito amanteigado, recheio cremoso de cream cheese e cobertura de coulis de frutas vermelhas frescas.',
    shortDesc: 'Coulis de frutas vermelhas frescas.',
    price: 72.90,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
    badge: 'Premium', badgeType: 'premium',
    featured: true, available: true,
    tags: ['cheesecake', 'frutas', 'premium'],
    weight: '1,2kg',
  },
  {
    id: 9, category: 'bolos',
    name: 'Bolo de Chocolate Belga',
    description: 'Três camadas de massa de chocolate belga intercaladas com mousse leve de cacau e decoradas com raspas de chocolate.',
    shortDesc: 'Chocolate belga + mousse de cacau.',
    price: 68.90,
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&q=80',
    badge: 'Novo', badgeType: 'new',
    featured: false, available: true,
    tags: ['chocolate', 'belga'],
    weight: '1,1kg',
  },

  // ── Doces ─────────────────────────────────────────────────────
  {
    id: 10, category: 'doces',
    name: 'Croissant de Manteiga',
    description: 'Croissant laminado com 32 camadas de manteiga presidente. Folhado, crocante por fora e cremoso por dentro.',
    shortDesc: '32 camadas, manteiga presidente.',
    price: 14.90,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
    badge: 'Mais Vendido', badgeType: 'bestseller',
    featured: true, available: true,
    tags: ['francês', 'manteiga', 'folhado'],
    weight: '90g',
  },
  {
    id: 11, category: 'doces',
    name: 'Éclair de Baunilha',
    description: 'Massa choux recheada com creme de baunilha de Madagascar e cobertura de fondant branco.',
    shortDesc: 'Creme de baunilha de Madagascar.',
    price: 16.90,
    image: 'https://images.unsplash.com/photo-1519915028121-7d3463d5b1ff?w=800&q=80',
    badge: 'Premium', badgeType: 'premium',
    featured: true, available: true,
    tags: ['francês', 'baunilha'],
    weight: '80g',
  },
  {
    id: 12, category: 'doces',
    name: 'Macaron Sortido (cx 6)',
    description: 'Caixa com 6 macarons artesanais nos sabores: framboesa, pistache, chocolate, lavanda, baunilha e caramelo.',
    shortDesc: '6 unidades, 6 sabores artesanais.',
    price: 42.90,
    image: 'https://images.unsplash.com/photo-1612811661337-62e24f56b7a5?w=800&q=80',
    badge: 'Premium', badgeType: 'premium',
    featured: true, available: true,
    tags: ['francês', 'premium', 'presente'],
    weight: '180g',
  },
  {
    id: 13, category: 'doces',
    name: 'Brownie de Chocolate',
    description: 'Brownie denso e fudgy com chocolate 70% cacau, nozes pecan e flor de sal. Servido morno.',
    shortDesc: 'Chocolate 70%, nozes pecan, flor de sal.',
    price: 18.90,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80',
    badge: null, badgeType: null,
    featured: false, available: true,
    tags: ['chocolate', 'brownie'],
    weight: '120g',
  },

  // ── Salgados ──────────────────────────────────────────────────
  {
    id: 14, category: 'salgados',
    name: 'Quiche Lorraine',
    description: 'Massa amanteigada recheada com creme de ovos, bacon defumado, queijo gruyère e alho-poró caramelizado.',
    shortDesc: 'Bacon defumado e gruyère.',
    price: 26.90,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
    badge: 'Favorito', badgeType: 'bestseller',
    featured: true, available: true,
    tags: ['francês', 'queijo', 'bacon'],
    weight: '200g',
  },
  {
    id: 15, category: 'salgados',
    name: 'Folhado de Frango com Catupiry',
    description: 'Massa folhada crocante recheada com frango desfiado temperado e catupiry original. Assado na hora.',
    shortDesc: 'Frango desfiado e catupiry original.',
    price: 18.90,
    image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&q=80',
    badge: 'Novo', badgeType: 'new',
    featured: false, available: true,
    tags: ['folhado', 'frango'],
    weight: '150g',
  },
  {
    id: 16, category: 'salgados',
    name: 'Coxinha Artesanal',
    description: 'Massa de batata caseira, recheio generoso de frango desfiado com requeijão e temperos frescos. Crocante e dourada.',
    shortDesc: 'Massa de batata, frango e requeijão.',
    price: 12.90,
    image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800&q=80',
    badge: 'Mais Vendido', badgeType: 'bestseller',
    featured: true, available: true,
    tags: ['tradicional', 'frango'],
    weight: '130g',
  },

  // ── Bebidas ───────────────────────────────────────────────────
  {
    id: 17, category: 'bebidas',
    name: 'Cappuccino Italiano',
    description: 'Espresso duplo com leite vaporizado, espuma cremosa e toque de canela. Grão selecionado da Serra da Mantiqueira.',
    shortDesc: 'Espresso duplo, grão Serra da Mantiqueira.',
    price: 14.90,
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=800&q=80',
    badge: 'Favorito', badgeType: 'bestseller',
    featured: true, available: true,
    tags: ['café', 'italiano', 'quente'],
    weight: '240ml',
  },
  {
    id: 18, category: 'bebidas',
    name: 'Chá Artesanal Gelado',
    description: 'Cold brew de chá preto com frutas vermelhas, hortelã fresca e mel artesanal. Refrescante e sofisticado.',
    shortDesc: 'Frutas vermelhas, hortelã e mel.',
    price: 16.90,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
    badge: 'Novo', badgeType: 'new',
    featured: false, available: true,
    tags: ['chá', 'gelado', 'refrescante'],
    weight: '350ml',
  },
  {
    id: 19, category: 'bebidas',
    name: 'Suco de Laranja Espremido',
    description: 'Laranja pera espremida na hora, sem adição de açúcar ou conservantes. Fresco e natural.',
    shortDesc: 'Espremido na hora, sem conservantes.',
    price: 12.90,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80',
    badge: null, badgeType: null,
    featured: false, available: true,
    tags: ['suco', 'natural', 'laranja'],
    weight: '400ml',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function getProductById(id) {
  return BM_PRODUCTS.find(p => p.id === Number(id)) || null;
}

function getProductsByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return BM_PRODUCTS;
  return BM_PRODUCTS.filter(p => p.category === categoryId);
}

function getFeaturedProducts(limit = 8) {
  return BM_PRODUCTS.filter(p => p.featured).slice(0, limit);
}

function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function badgeLabel(type) {
  const map = { bestseller: 'Mais Vendido', new: 'Novo', premium: 'Premium', healthy: 'Saudável' };
  return map[type] || '';
}
