import 'dotenv/config';
import { prisma } from '../src/database';

/**
 * Seed com 12 registros variados de cafés do mundo.
 * Cobre diferentes origens, torras, sabores e faixas de preço.
 */
async function seedCoffees(): Promise<void> {
  const coffees = [
    {
      name: 'Bourbon Amarelo do Cerrado',
      origin: 'Brazil',
      roast: 'MEDIUM',
      flavor: 'Chocolate, Caramelo, Nozes',
      price: 32.9,
      available: true,
      tags: ['especial', 'chocolate', 'premiado', 'brasil'],
    },
    {
      name: 'Yirgacheffe Natural',
      origin: 'Ethiopia',
      roast: 'LIGHT',
      flavor: 'Frutas Vermelhas, Jasmim, Bergamota',
      price: 58.5,
      available: true,
      tags: ['floral', 'citrico', 'etiopea', 'acidez-alta'],
    },
    {
      name: 'Sumatra Mandheling',
      origin: 'Indonesia',
      roast: 'DARK',
      flavor: 'Terra, Especiarias, Cedro',
      price: 47.0,
      available: true,
      tags: ['intenso', 'especiarias', 'encorpado', 'indonesia'],
    },
    {
      name: 'Colombian Huila Washed',
      origin: 'Colombia',
      roast: 'MEDIUM',
      flavor: 'Maçã Verde, Mel, Caramelo',
      price: 42.0,
      available: true,
      tags: ['doce', 'caramelo', 'balanceado', 'colombia'],
    },
    {
      name: 'Jamaican Blue Mountain',
      origin: 'Jamaica',
      roast: 'LIGHT',
      flavor: 'Suave, Floral, Leve Acidez',
      price: 149.9,
      available: false,
      tags: ['raro', 'suave', 'exclusivo', 'caro'],
    },
    {
      name: 'Robusta Ugandense',
      origin: 'Uganda',
      roast: 'DARK',
      flavor: 'Intenso, Amargo, Cereais',
      price: 21.5,
      available: true,
      tags: ['forte', 'amargo', 'cafeina', 'uganda'],
    },
    {
      name: 'Gesha Panamenho',
      origin: 'Panama',
      roast: 'LIGHT',
      flavor: 'Pêssego, Baunilha, Chá Branco',
      price: 220.0,
      available: true,
      tags: ['raro', 'exotico', 'floral', 'premium'],
    },
    {
      name: 'Vietnam Robusta Dark',
      origin: 'Vietnam',
      roast: 'DARK',
      flavor: 'Chocolate Amargo, Tabaco, Madeira',
      price: 18.9,
      available: true,
      tags: ['intenso', 'madeira', 'vietnam', 'forte'],
    },
    {
      name: 'Kenya AA',
      origin: 'Kenya',
      roast: 'MEDIUM',
      flavor: 'Groselha, Cítrico, Vinho',
      price: 65.0,
      available: true,
      tags: ['citrico', 'vinho', 'kenya', 'frutado'],
    },
    {
      name: 'Guatemala Antigua',
      origin: 'Guatemala',
      roast: 'MEDIUM',
      flavor: 'Cacau, Açúcar Mascavo, Notas Defumadas',
      price: 38.75,
      available: true,
      tags: ['cacau', 'defumado', 'guatemala', 'tradicional'],
    },
    {
      name: 'Costa Rica Tarrazú',
      origin: 'Costa Rica',
      roast: 'LIGHT',
      flavor: 'Mel, Pera, Caramelo',
      price: 52.0,
      available: true,
      tags: ['doce', 'pera', 'costarica', 'suave'],
    },
    {
      name: 'Moka Harrar',
      origin: 'Ethiopia',
      roast: 'MEDIUM',
      flavor: 'Mirtilo, Especiarias, Vinho Tinto',
      price: 71.0,
      available: false,
      tags: ['frutado', 'vinho', 'etiopea', 'encorpado'],
    },
  ];

  await prisma.coffee.deleteMany();
  await prisma.coffee.createMany({ data: coffees });

  console.log(`✅ Seed concluído: ${coffees.length} cafés inseridos.`);
}

seedCoffees()
  .catch((error: unknown) => {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
