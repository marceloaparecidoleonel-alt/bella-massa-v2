/**
 * products.js
 * Bella Massa — Padaria Artesanal
 *
 * Dados dos produtos e categorias.
 * Preparado para futura integração com Firestore / REST API.
 */

// ─── Categorias ────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'paes',
    name: 'Pães',
    icon: 'fas fa-bread-slice',
    description: 'Artesanais e quentinhos',
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&q=80',
    color: '#c8a97e',
  },
  {
    id: 'bolos',
    name: 'Bolos',
    icon: 'fas fa-cake-candles',
    description: 'Receitas da vovó',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
    color: '#b07d62',
  },
  {
    id: 'salgados',
    name: 'Salgados',
    icon: 'fas fa-drumstick-bite',
    description: 'Frescos e crocantes',
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80',
    color: '#8b6348',
  },
  {
    id: 'doces',
    name: 'Doces',
    icon: 'fas fa-cookie-bite',
    description: 'Irresistíveis finos',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80',
    color: '#c4956a',
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    icon: 'fas fa-mug-hot',
    description: 'Cafés especiais',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
    color: '#6f4e37',
  },
];

// ─── Produtos ───────────────────────────────────────────────────────────────
const PRODUCTS = [
  // Pães
  {
    id: 1,
    category: 'paes',
    name: 'Pão de Fermentação Natural',
    description: 'Fermentado por 18 horas com levain natural, casca crocante e miolo aerado.',
    price: 24.90,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&q=80',
    badge: 'Mais Vendido',
    badgeType: 'bestseller',
    featured: true,
  },
  {
    id: 2,
    category: 'paes',
    name: 'Ciabatta Artesanal',
    description: 'Pão italiano clássico com estrutura aberta, levemente crocante e muito saboroso.',
    price: 18.50,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
    badge: null,
    badgeType: null,
    featured: true,
  },
  {
    id: 3,
    category: 'paes',
    name: 'Pão de Queijo Mineiro',
    description: 'Receita autêntica de Minas Gerais, crocante por fora e cremoso por dentro.',
    price: 8.90,
    image: 'https://images.unsplash.com/photo-1620188467120-5042ed1eb5da?w=600&q=80',
    badge: 'Novo',
    badgeType: 'new',
    featured: false,
  },

  // Bolos
  {
    id: 4,
    category: 'bolos',
    name: 'Bolo de Chocolate Belga',
    description: 'Massa úmida de cacau, ganache de chocolate belga 70% e raspas de chocolate.',
    price: 89.90,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
    badge: 'Premium',
    badgeType: 'premium',
    featured: true,
  },
  {
    id: 5,
    category: 'bolos',
    name: 'Bolo de Limão Siciliano',
    description: 'Massa fofa com raspas de limão fresco, cobertura de cream cheese e calda cítrica.',
    price: 74.90,
    image: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=600&q=80',
    badge: null,
    badgeType: null,
    featured: true,
  },

  // Salgados
  {
    id: 6,
    category: 'salgados',
    name: 'Croissant de Presunto e Queijo',
    description: 'Massa folhada francesa com presunto premium e queijo gruyère derretido.',
    price: 12.90,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
    badge: 'Mais Vendido',
    badgeType: 'bestseller',
    featured: true,
  },
  {
    id: 7,
    category: 'salgados',
    name: 'Coxinha de Frango Trufado',
    description: 'Recheio cremoso de frango desfiado com toque de trufas, empanada e frita na hora.',
    price: 9.50,
    image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80',
    badge: 'Novo',
    badgeType: 'new',
    featured: true,
  },

  // Doces
  {
    id: 8,
    category: 'doces',
    name: 'Éclair de Baunilha Bourbon',
    description: 'Massa choux crocante, creme pâtissière de baunilha bourbon e cobertura de fondant.',
    price: 14.90,
    image: 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=600&q=80',
    badge: 'Premium',
    badgeType: 'premium',
    featured: true,
  },
  {
    id: 9,
    category: 'doces',
    name: 'Macaron Sortido (caixa 6un)',
    description: 'Seis sabores exclusivos: framboesa, pistache, caramelo, chocolate, lavanda e limão.',
    price: 38.90,
    image: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=600&q=80',
    badge: 'Mais Vendido',
    badgeType: 'bestseller',
    featured: true,
  },

  // Bebidas
  {
    id: 10,
    category: 'bebidas',
    name: 'Café Coado Especial',
    description: 'Blend exclusivo Bella Massa, torra média, notas de caramelo e frutas vermelhas.',
    price: 11.90,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
    badge: null,
    badgeType: null,
    featured: false,
  },
  {
    id: 11,
    category: 'bebidas',
    name: 'Cappuccino Italiano',
    description: 'Espresso duplo com leite vaporizado, espuma cremosa e toque de canela.',
    price: 14.90,
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=600&q=80',
    badge: 'Favorito',
    badgeType: 'bestseller',
    featured: false,
  },
];

// ─── Processo Artesanal ──────────────────────────────────────────────────────
const PROCESS_STEPS = [
  {
    num: '01',
    icon: 'fas fa-wheat-awn',
    title: 'Seleção dos Grãos',
    desc: 'Escolhemos a dedo as melhores farinhas, com origem controlada e certificação de qualidade.',
  },
  {
    num: '02',
    icon: 'fas fa-flask',
    title: 'Fermentação Natural',
    desc: 'Nosso levain artesanal fermenta lentamente por até 18 horas, desenvolvendo sabor e textura únicos.',
  },
  {
    num: '03',
    icon: 'fas fa-hands',
    title: 'Modelagem à Mão',
    desc: 'Cada peça é moldada manualmente por nossos artesãos com técnicas aprendidas ao longo de anos.',
  },
  {
    num: '04',
    icon: 'fas fa-fire-flame-curved',
    title: 'Forno Artesanal',
    desc: 'Assados na temperatura ideal, cada fornada sai com a casca perfeita e o aroma inconfundível.',
  },
];

// ─── Depoimentos ────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    id: 1,
    name: 'Ana Claudia Ferreira',
    role: 'Cliente há 5 anos',
    avatar: 'https://i.pravatar.cc/80?img=5',
    rating: 5,
    text: 'O pão de fermentação natural da Bella Massa mudou minha vida! Nunca mais consegui comer outro igual. A casca crocante e o miolo aerado são perfeitos. Recomendo demais!',
  },
  {
    id: 2,
    name: 'Rafael Mendes',
    role: 'Gourmet & Foodie',
    avatar: 'https://i.pravatar.cc/80?img=12',
    rating: 5,
    text: 'Encomendar o bolo de chocolate para o aniversário da minha esposa foi a melhor decisão. Todos os convidados perguntaram onde compramos. Qualidade de confeitaria europeia!',
  },
  {
    id: 3,
    name: 'Juliana Costa',
    role: 'Cliente fiel',
    avatar: 'https://i.pravatar.cc/80?img=9',
    rating: 5,
    text: 'Assino a cesta semanal de pães há 2 anos. A qualidade é sempre impecável, a entrega é pontual e o atendimento pelo WhatsApp é super atencioso. Simplesmente perfeito!',
  },
  {
    id: 4,
    name: 'Pedro Alves',
    role: 'Empresário',
    avatar: 'https://i.pravatar.cc/80?img=15',
    rating: 5,
    text: 'Contratei a Bella Massa para servir no café da manhã do meu escritório toda semana. Minha equipe adora os croissants e os macarons. Profissionalismo e sabor sem igual!',
  },
  {
    id: 5,
    name: 'Camila Rodrigues',
    role: 'Mãe de família',
    avatar: 'https://i.pravatar.cc/80?img=1',
    rating: 5,
    text: 'Meus filhos só comem o pão de queijo da Bella Massa agora! A receita é autêntica, faz lembrar aquela viagem a Minas Gerais. Chegam sempre quentinhos e fresquinhos.',
  },
  {
    id: 6,
    name: 'Lucas Tavares',
    role: 'Chef de cozinha',
    avatar: 'https://i.pravatar.cc/80?img=68',
    rating: 5,
    text: 'Como chef, sou muito exigente com ingredientes. A Bella Massa utiliza insumos de altíssima qualidade. Os éclairs de baunilha bourbon são dignos das melhores confeitarias de Paris.',
  },
];
