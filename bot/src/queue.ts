import Queue from 'bull';
import { config } from './config';
import { logger } from './logger';

// Rate limiting queue for Twitter API
export const twitterQueue = new Queue('twitter', config.REDIS_URL);

// Rain processing queue
export const rainQueue = new Queue('rain', config.REDIS_URL);

// Configure rate limiting
twitterQueue.process('tweet', 5, async (job) => {
  logger.info(`Processing tweet job: ${job.id}`);
  // Actual processing handled in twitter.ts
  return job.data;
});

rainQueue.process('distribute', 3, async (job) => {
  logger.info(`Processing rain distribution: ${job.id}`);
  // Actual distribution handled in rain.ts
  return job.data;
});

// Error handling
twitterQueue.on('failed', (job, err) => {
  logger.error(`Twitter job failed: ${job.id}`, err);
});

rainQueue.on('failed', (job, err) => {
  logger.error(`Rain job failed: ${job.id}`, err);
});

export async function addTweetJob(data: any) {
  return twitterQueue.add('tweet', data, {
    delay: 1000, // Rate limit: 1 second between tweets
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

export async function addRainJob(data: any) {
  return rainQueue.add('distribute', data, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
}