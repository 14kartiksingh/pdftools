import { Queue } from 'bullmq';
import Redis from 'ioredis';

const q = new Queue('pdf-jobs', { connection: new Redis() });

q.add('TO_IMAGE', { 
  inputPath: 'test.pdf', 
  outputPath: 'test.zip', 
  userId: '1', 
  originalName: 'test.pdf', 
  newFileName: 'test.zip' 
}, { jobId: 'test-job-2' }).then(() => { 
  console.log('Job queued'); 
  process.exit(0); 
});
