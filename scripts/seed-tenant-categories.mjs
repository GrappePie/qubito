// Seed example categories for a given tenant (owner)
// Usage:
//   node scripts/seed-tenant-categories.mjs --tenant <TENANT_ID>
// or
//   npm run seed:categories -- --tenant <TENANT_ID>

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

const CategorySchema = new mongoose.Schema({
  categoryId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  parentCategoryId: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  owner: { type: String, index: true },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

function slugify(input) {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: 'inventoryApp' });
  const names = ['General', 'Bebidas', 'Panadería'];
  const ops = names.map((name) => {
    const id = `${slugify(name)}`;
    const doc = {
      categoryId: `${id}-${tenant}`,
      name,
      description: `Categoría ${name}`,
      imageUrl: 'https://placehold.co/96x96/e2e8f0/475569?text=CAT',
      parentCategoryId: null,
      isActive: true,
      products: [],
      owner: tenant,
    };
    return { updateOne: { filter: { owner: tenant, name }, update: { $set: doc }, upsert: true } };
  });
  const res = await Category.bulkWrite(ops);
  console.log('Seed categories for tenant', tenant, res.result || res);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

