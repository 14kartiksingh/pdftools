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
          storagePath: outputPath,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
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
    } else if (job.name === 'TO_IMAGE') {
      const { inputPath, outputPath, userId, originalName, newFileName } = job.data;
      
      const { pdfToImage } = require('./lib/tools/pdfToImage');
      
      await pdfToImage(inputPath, outputPath, (progress: number) => {
        job.updateProgress(progress);
        prisma.job.update({
          where: { id: job.opts.jobId },
          data: { progress }
        }).catch(console.error);
      });
      
      const stats = fs.statSync(outputPath);
      const outputFileSize = stats.size;

      const zipFile = await prisma.file.create({
        data: {
          userId,
          fileName: newFileName,
          originalName: `${originalName.replace(/\.pdf$/i, '')}-images.zip`,
          fileSize: outputFileSize,
          mimeType: 'application/zip',
          storagePath: outputPath,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        }
      });

      resultPayload = { 
        outputPath, 
        fileId: zipFile.id,
        newSize: outputFileSize
      };

      await prisma.job.update({
        where: { id: job.opts.jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          fileId: zipFile.id,
          result: JSON.stringify(resultPayload)
        }
      });
    } else if (job.name === 'PROTECT') {
      const { sourcePath, password, userId, originalName } = job.data;
      const { spawn } = require('child_process');
      const { v4: uuidv4 } = require('uuid');
      const path = require('path');
      
      const newFileName = `${uuidv4()}.pdf`;
      const outputPath = path.join(process.cwd(), 'storage', 'processed', newFileName);

      await new Promise<void>((resolve, reject) => {
        // Ghostscript Path Logic Inline for simplicity
        let gsExec = 'gswin64c.exe';
        const commonPaths = [
          "C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe",
          "C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe",
          "C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe",
          "C:\\Program Files\\gs\\gs10.07.1\\bin\\gswin64c.exe",
        ];
        for (const p of commonPaths) {
          if (fs.existsSync(p)) { gsExec = p; break; }
        }

        const args = [
          "-q", "-dNOPAUSE", "-dBATCH", "-sDEVICE=pdfwrite",
          `-sOutputFile=${outputPath}`,
          `-sOwnerPassword=${password}`,
          `-sUserPassword=${password}`,
          "-dEncryptionR=3",
          "-dKeyLength=128",
          sourcePath
        ];
        
        job.updateProgress(50);
        
        const proc = spawn(gsExec, args, { stdio: "pipe" });
        let stderr = "";
        proc.stderr.on("data", (d: any) => stderr += d.toString());
        
        proc.on("close", (code: number) => {
          if (code === 0) resolve();
          else reject(new Error(`Ghostscript exited with ${code}: ${stderr}`));
        });
        proc.on("error", reject);
      });

      const stats = fs.statSync(outputPath);
      const newFile = await prisma.file.create({
        data: {
          userId,
          fileName: newFileName,
          originalName: `protected-${originalName}`,
          fileSize: stats.size,
          mimeType: 'application/pdf',
          storagePath: outputPath,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        }
      });

      resultPayload = { outputPath, fileId: newFile.id, newSize: stats.size };

      await prisma.job.update({
        where: { id: job.opts.jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          fileId: newFile.id,
          result: JSON.stringify(resultPayload)
        }
      });
    } else if (job.name === 'UNLOCK') {
      const { sourcePath, password, userId, originalName } = job.data;
      const { spawn } = require('child_process');
      const { v4: uuidv4 } = require('uuid');
      const path = require('path');
      
      const newFileName = `${uuidv4()}.pdf`;
      const outputPath = path.join(process.cwd(), 'storage', 'processed', newFileName);

      await new Promise<void>((resolve, reject) => {
        let gsExec = 'gswin64c.exe';
        const commonPaths = [
          "C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe",
          "C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe",
          "C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe",
          "C:\\Program Files\\gs\\gs10.07.1\\bin\\gswin64c.exe",
        ];
        for (const p of commonPaths) {
          if (fs.existsSync(p)) { gsExec = p; break; }
        }

        const args = [
          "-q", "-dNOPAUSE", "-dBATCH", "-sDEVICE=pdfwrite",
          `-sOutputFile=${outputPath}`,
          `-sPDFPassword=${password}`,
          sourcePath
        ];
        
        job.updateProgress(50);
        
        const proc = spawn(gsExec, args, { stdio: "pipe" });
        let stderr = "";
        proc.stderr.on("data", (d: any) => stderr += d.toString());
        
        proc.on("close", (code: number) => {
          if (code === 0) resolve();
          else reject(new Error(`Ghostscript exited with ${code}: ${stderr}`));
        });
        proc.on("error", reject);
      });

      const stats = fs.statSync(outputPath);
      const newFile = await prisma.file.create({
        data: {
          userId,
          fileName: newFileName,
          originalName: `unlocked-${originalName}`,
          fileSize: stats.size,
          mimeType: 'application/pdf',
          storagePath: outputPath,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        }
      });

      resultPayload = { outputPath, fileId: newFile.id, newSize: stats.size };

      await prisma.job.update({
        where: { id: job.opts.jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          fileId: newFile.id,
          result: JSON.stringify(resultPayload)
        }
      });
    } else if (job.name === 'CLEANUP_EXPIRED') {
      console.log('Running cleanup of expired files...');
      const expiredFiles = await prisma.file.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      
      let deletedCount = 0;
      for (const file of expiredFiles) {
        try {
          if (fs.existsSync(file.storagePath)) {
            fs.unlinkSync(file.storagePath);
          }
          await prisma.file.delete({ where: { id: file.id } });
          deletedCount++;
        } catch (e: any) {
          console.error(`Failed to delete expired file ${file.id}: ${e.message}`);
        }
      }
      console.log(`Cleanup finished. Deleted ${deletedCount} files.`);
      return { deletedCount };
    } else {
      throw new Error(`Unsupported job type: ${job.name}`);
    }

    return resultPayload;
  } catch (error: any) {
    console.error(`Job ${job.id} failed:`, error.message);
    
    // Failure (only update job if it has a jobId in opts, CLEANUP_EXPIRED doesn't have a prisma job)
    if (job.opts.jobId) {
      await prisma.job.update({
        where: { id: job.opts.jobId },
        data: {
          status: 'FAILED',
          error: error.message || 'Unknown error'
        }
      }).catch(console.error);
    }
    
    throw error;
  }
}, { connection: connection as any });

import { Queue } from 'bullmq';
const pdfQueue = new Queue('pdf-jobs', { connection: connection as any });

worker.on('ready', async () => {
  console.log('PDF Worker is listening for jobs...');
  // Register cleanup job to run every 5 minutes
  await pdfQueue.add('CLEANUP_EXPIRED', {}, {
    repeat: {
      pattern: '*/5 * * * *'
    }
  });
  console.log('Registered CLEANUP_EXPIRED repeatable job (every 5 mins).');
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
