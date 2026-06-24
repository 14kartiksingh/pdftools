import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const pdfJobQueue = new Queue('pdf-jobs', { connection });

export async function addPdfJob(jobId: string, type: string, data: any) {
  return await pdfJobQueue.add(type, data, {
    jobId, // Use the Prisma Job ID
    removeOnComplete: true,
    removeOnFail: false,
  });
}
