
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: { role: 'admin' },
    });

    console.log(`Found ${admins.length} admins.`);

    for (const admin of admins) {
        const currentPermissions = admin.permissions || [];
        if (!currentPermissions.includes('stock:edit')) {
            const newPermissions = [...currentPermissions, 'stock:edit'];
            await prisma.user.update({
                where: { id: admin.id },
                data: { permissions: newPermissions },
            });
            console.log(`Granted stock:edit to ${admin.username}`);
        } else {
            console.log(`${admin.username} already has stock:edit`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
