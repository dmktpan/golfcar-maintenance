
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Supervisor: batt001
    const supervisor = await prisma.user.findUnique({
        where: { code: 'batt001' }
    })

    if (!supervisor) throw new Error('Supervisor not found')

    const courseId = supervisor.managed_golf_courses[0]

    const vehicle = await prisma.vehicle.findFirst({
        where: { golf_course_id: courseId }
    })

    const staff = await prisma.user.findFirst({
        where: { role: 'staff' }
    })

    console.log('Test Data:', JSON.stringify({
        supervisorId: supervisor.id,
        courseId,
        vehicle,
        staffId: staff?.id
    }, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
