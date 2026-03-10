import { Queue, Worker } from "bullmq"
import { redisConfig } from "./config/redis.config"

async function debugQueue() {
    const queueName = "repository-analysis"
    const queue = new Queue(queueName, { connection: redisConfig })

    console.log(`--- Debugging Queue: ${queueName} ---`)

    const count = await queue.getJobCounts()
    console.log("Job Counts:", JSON.stringify(count, null, 2))

    const waitingJobs = await queue.getWaiting()
    console.log(`Waiting Jobs: ${waitingJobs.length}`)
    if (waitingJobs.length > 0) {
        console.log("Sample Waiting Job Data:", JSON.stringify(waitingJobs[0].data, null, 2))
    }

    const activeJobs = await queue.getActive()
    console.log(`Active Jobs: ${activeJobs.length}`)

    const completedJobs = await queue.getCompleted()
    console.log(`Completed Jobs: ${completedJobs.length}`)

    const failedJobs = await queue.getFailed()
    console.log(`Failed Jobs: ${failedJobs.length}`)
    if (failedJobs.length > 0) {
        console.log("Last Failed Job Error:", failedJobs[0].failedReason)
    }

    // Check for workers
    // Unfortunately BullMQ doesn't have a direct "getWorkers" on the Queue object easily, 
    // but we can check if there are active jobs.

    await queue.close()
    process.exit(0)
}

debugQueue().catch(err => {
    console.error("Error debugging queue:", err)
    process.exit(1)
})
