import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Verifying Repository columns...")
    const repos = await prisma.repository.findMany({
        take: 1,
        select: {
            id: true,
            totalFiles: true,
            mainLanguage: true,
            documentation: true,
            architecture: true
        }
    })
    console.log("Repository check successful!")

    console.log("Verifying AnalysisJob model...")
    const jobs = await prisma.analysisJob.findMany({ take: 1 })
    console.log("AnalysisJob check successful!")
}

main()
    .catch((e) => {
        console.error("Verification failed:", e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
