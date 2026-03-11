const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.analysisJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      repository: {
        select: {
          owner: true,
          name: true
        }
      }
    }
  });

  console.log("LAST_JOBS_START");
  jobs.forEach(j => {
    console.log(`ID: ${j.id} | Repo: ${j.repository.owner}/${j.repository.name} | Status: ${j.status} | Created: ${j.createdAt}`);
  });
  console.log("LAST_JOBS_END");
}

main().finally(() => prisma.$disconnect());
