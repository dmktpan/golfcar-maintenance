
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            name: true,
            role: true,
            permissions: true,
        },
    });

    console.log('User Permissions:');
    users.forEach(user => {
        console.log(`User: ${user.name} (${user.username})`);
        console.log(`Role: ${user.role}`);
        console.log(`Permissions: ${user.permissions}`);
        console.log('Has stock:edit?', user.permissions?.includes('stock:edit') ? 'YES' : 'NO');
        console.log('---');
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
