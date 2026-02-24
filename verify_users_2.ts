
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const courses = await prisma.golfCourse.findMany()
    const supervisors = await prisma.user.findMany({
        where: { role: 'supervisor' },
        select: {
            id: true,
            name: true,
            code: true,
            managed_golf_courses: true
        }
    })

    console.log('Courses:', JSON.stringify(courses, null, 2))
    console.log('Supervisors:', JSON.stringify(supervisors, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
