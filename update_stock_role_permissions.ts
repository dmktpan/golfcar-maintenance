
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const stockUsers = await prisma.user.findMany({
        where: { role: 'stock' },
    });

    console.log(`Found ${stockUsers.length} users with role 'stock'.`);

    if (stockUsers.length === 0) {
        // Determine if we should create a test stock user?
        // For now, let's just list roles to see what exists
        console.log("No stock users found. Listing all roles...");
        const allUsers = await prisma.user.findMany({
            select: { username: true, role: true }
        });
        console.log(allUsers);
    }

    for (const user of stockUsers) {
        const currentPermissions = user.permissions || [];
        if (!currentPermissions.includes('stock:edit')) {
            const newPermissions = [...currentPermissions, 'stock:edit'];
            await prisma.user.update({
                where: { id: user.id },
                data: { permissions: newPermissions },
            });
            console.log(`Granted stock:edit to ${user.username}`);
        } else {
            console.log(`${user.username} already has stock:edit`);
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
