
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        take: 5,
        select: {
            id: true,
            name: true,
            code: true,
            role: true,
            golf_course_name: true
        }
    })
    console.log(JSON.stringify(users, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
