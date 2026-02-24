
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const allUsers = await prisma.user.findMany({
        select: { id: true, username: true, role: true, permissions: true }
    });

    console.log("All Users:");
    allUsers.forEach(u => {
        console.log(`- ${u.username} (${u.role}) [${u.permissions}]`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
