const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
  await prisma.admin.updateMany({
    where: { email: 'admin@novastore.com' },
    data: { mustSetPassword: false }
  });
  console.log("DB Fixed.");
}
fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
