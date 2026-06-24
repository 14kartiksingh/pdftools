import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { compressPdf } from './lib/tools/compressor';
import fs from 'fs';

const prisma = new PrismaClient();
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

const worker = new Worker('pdf-jobs', async (job: Job) => {
  console.log(`Processing job ${job.id} of type ${job.name}`);
  
  await prisma.job.update({
    where: { id: job.opts.jobId },
    data: { status: 'PROCESSING' }
  });

  try {
    let resultPayload: any = null;

    if (job.name === 'COMPRESS') {
      const { inputPath, outputPath, level, userId, originalName, newFileName } = job.data;
      
      // Execute ghostscript
      await compressPdf(inputPath, outputPath, level, (progress) => {
        job.updateProgress(progress);
        prisma.job.update({
          where: { id: job.opts.jobId },
          data: { progress }
        }).catch(console.error); // don't await progress updates to prevent blocking
      });
      
      const stats = fs.statSync(outputPath);
      const optimizedFileSize = stats.size;

      const optimizedFile = await prisma.file.create({
        data: {
          userId,
          fileName: newFileName,
          originalName: `optimized-${originalName}`,
          fileSize: optimizedFileSize,
          mimeType: 'application/pdf',
          storagePath: outputPath
        }
      });

      resultPayload = { 
        outputPath, 
        fileId: optimizedFile.id,
        newSize: optimizedFileSize
      };

      await prisma.job.update({
        where: { id: job.opts.jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          fileId: optimizedFile.id,
          result: JSON.stringify(resultPayload)
        }
      });
    } else {
      throw new Error(`Unsupported job type: ${job.name}`);
    }

    return resultPayload;
  } catch (error: any) {
    console.error(`Job ${job.id} failed:`, error.message);
    
    // Failure
    await prisma.job.update({
      where: { id: job.opts.jobId },
      data: {
        status: 'FAILED',
        error: error.message || 'Unknown error'
      }
    });
    
    throw error;
  }
}, { connection });

worker.on('ready', () => {
  console.log('PDF Worker is listening for jobs...');
});

worker.on('error', err => {
  console.error('Worker Error:', err);
});

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
