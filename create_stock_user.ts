
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await hash('123456', 10);

    const golfCourse = await prisma.golfCourse.findFirst();
    if (!golfCourse) {
        console.error("No golf course found");
        process.exit(1);
    }

    const user = await prisma.user.upsert({
        where: { username: 'stocktest' },
        update: {
            role: 'stock',
            permissions: ['stock:edit'],
            password: hashedPassword
        },
        create: {
            username: 'stocktest',
            password: hashedPassword,
            name: 'Stock User Test',
            code: 'STK001',
            role: 'stock',
            golf_course_id: golfCourse.id,
            golf_course_name: golfCourse.name,
            permissions: ['stock:edit']
        },
    });

    console.log(`User created/updated: ${user.username} with role ${user.role}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
