const { Queue } = require('bullmq');
const { redisConnection } = require('../config/redis.config');
const logger = require('../utils/logger');

const defaultJobOptions = {
  removeOnComplete: { age: 60, count: 500 },
  removeOnFail: { age: 7 * 24 * 3600, count: 5000 },
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000,
  },
};

const aiQueue = new Queue('ai_queue', {
  connection: redisConnection,
  defaultJobOptions,
});

const dbQueue = new Queue('db_queue', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

logger.info('BullMQ queues initialized: ai_queue, db_queue');

async function closeQueues() {
  logger.info('Closing AI Extraction Service BullMQ queues...');
  await aiQueue.close();
  await dbQueue.close();
  logger.info('AI Extraction Service queues closed.');
}

module.exports = {
  aiQueue,
  dbQueue,
  closeQueues,
};

