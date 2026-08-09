import { prisma } from '../lib/prisma';

async function main() {
  const fields = Object.keys(prisma.pengajuanAnggaran.fields);
  const required = ['mainAnggaranId', 'alokasiLama', 'alokasiBaru'];
  for (const f of required) {
    if (!fields.includes(f)) throw new Error(`missing field ${f}`);
  }
  if ((prisma as any).pengajuanAnggaranItem) {
    throw new Error('pengajuanAnggaranItem should be removed');
  }
  console.log('schema-ok');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
