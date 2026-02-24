
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const supervisorId = '69806eec10c4160016dfb382'

    // Wait a bit for async notification creation
    await new Promise(resolve => setTimeout(resolve, 2000))

    const notifications = await prisma.notification.findMany({
        where: {
            userId: supervisorId,
            createdAt: { gt: new Date(Date.now() - 60000) } // Created in last minute
        }
    })

    console.log('Notifications:', JSON.stringify(notifications, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
