const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function deleteRepo() {
    const id = "cmmkse0lp0001xcvahi2g8ccd"
    console.log(`Deleting repository ${id}...`)
    
    try {
        const deleted = await prisma.repository.delete({
            where: { id }
        })
        console.log(`Successfully deleted repository: ${deleted.owner}/${deleted.name}`)
    } catch (err) {
        console.error("Failed to delete repository:", err.message)
    } finally {
        await prisma.$disconnect()
    }
}

deleteRepo()
