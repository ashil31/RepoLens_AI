import { prisma } from "./database/prisma"

async function deleteRepo() {
    const id = "cmmkse0lp0001xcvahi2g8ccd"
    console.log(`Deleting repository ${id}...`)

    try {
        const deleted = await prisma.repository.delete({
            where: { id }
        })
        console.log(`✅ Successfully deleted repository: ${deleted.owner}/${deleted.name}`)
    } catch (err) {
        console.error("❌ Failed to delete repository or it was already deleted:", err.message)
    } finally {
        await prisma.$disconnect()
    }
}

deleteRepo()
