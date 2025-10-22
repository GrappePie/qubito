// Seed example products for a given tenantId (owner)
// Usage:
//   node scripts/seed-tenant-items.mjs --tenant <TENANT_ID>
// or
//   npm run seed:products -- --tenant <TENANT_ID>

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI env');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if ((a === '--tenant' || a === '-t') && args[i + 1]) {
      out.tenant = args[i + 1];
      i++;
    }
  }
  return out;
}

const { tenant } = parseArgs();
if (!tenant) {
  console.error('Please provide --tenant <TENANT_ID>');
  process.exit(1);
}

const ItemSchema = new mongoose.Schema({
  barCode: { type: String, required: true },
  categories: { type: [String], required: true },
  cost: { type: Number, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  isAvailableForSale: { type: Boolean, default: false },
  lowStock: { type: Number, default: 0 },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  price: { type: Number, required: true },
  sku: { type: String, required: true },
  stock: { type: Number, default: 0 },
  variants: [
    {
      type: { type: String, required: true },
      productIds: { type: [String], required: true },
    },
  ],
  supplier: { type: String, required: true },
}, { timestamps: true });

const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: 'inventoryApp' });
  const samples = [
    {
      name: 'Café Americano', sku: 'CAF-AMER', price: 35, cost: 12,
      stock: 50, lowStock: 10, categories: ['Bebidas'], imageUrl: 'https://placehold.co/300x200?text=Cafe',
      barCode: '750000000001', owner: tenant, description: 'Café negro', supplier: 'Casa Café',
      variants: [], isAvailableForSale: true,
    },
    {
      name: 'Croissant', sku: 'CROIS-01', price: 28, cost: 9,
      stock: 40, lowStock: 8, categories: ['Panadería'], imageUrl: 'https://placehold.co/300x200?text=Croissant',
      barCode: '750000000002', owner: tenant, description: 'Hojaldre mantequilla', supplier: 'Pan Feliz',
      variants: [], isAvailableForSale: true,
    },
    {
      name: 'Jugo Naranja', sku: 'JUG-NAR', price: 32, cost: 10,
      stock: 30, lowStock: 6, categories: ['Bebidas'], imageUrl: 'https://placehold.co/300x200?text=Jugo',
      barCode: '750000000003', owner: tenant, description: 'Natural exprimido', supplier: 'Frutal',
      variants: [], isAvailableForSale: true,
    },
  ];

  const ops = samples.map((s) => ({ updateOne: { filter: { owner: s.owner, sku: s.sku }, update: { $set: s }, upsert: true } }));
  const res = await Item.bulkWrite(ops);
  console.log('Seed complete for tenant', tenant, res.result || res);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

