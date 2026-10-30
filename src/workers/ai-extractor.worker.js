const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis.config');
const { dbQueue } = require('../queues/ai.queues');
const { cleanWithAI } = require('../services/ai-extractor');
const env = require('../config/env.config');
const logger = require('../utils/logger');

let aiWorker = null;

function startAIWorker() {
  aiWorker = new Worker(
    'ai_queue',
    async (job) => {
      const { domain, rawData, crawledAt } = job.data;

      if (!domain || !rawData) {
        logger.warn({ jobId: job.id }, 'Skipping AI job with missing data');
        return;
      }

      // Backpressure Check: wait if downstream db_queue is overloaded
      const dbWaitingCount = await dbQueue.getWaitingCount();
      if (dbWaitingCount > env.backpressure.dbQueueMax) {
        logger.warn(
          { dbWaitingCount, threshold: env.backpressure.dbQueueMax },
          'Backpressure: DB queue overloaded, pausing AI worker'
        );
        await new Promise((r) => setTimeout(r, env.backpressure.pauseMs));
      }

      // Process via AI & NER
      const cleanedData = await cleanWithAI(rawData);

      if (!cleanedData) {
        logger.warn({ domain }, 'AI returned null — skipping domain');
        return;
      }

      // Forward to Change Detection Service (db_queue)
      await dbQueue.add(
        'db_reconcile',
        {
          domain,
          cleanedData,
          crawledAt,
        },
        { removeOnComplete: true }
      );

      logger.info({ domain, jobId: job.id }, 'AI extracted & NER parsed -> pushed to db_queue');
    },
    {
      connection: redisConnection,
      concurrency: env.ai.concurrency,
    }
  );

  aiWorker.on('failed', (job, err) => {
    logger.error(
      { domain: job?.data?.domain, jobId: job?.id, err: err.message, attempt: job?.attemptsMade },
      'AI worker job failed'
    );
  });

  aiWorker.on('error', (err) => {
    logger.error({ err: err.message }, 'AI worker error');
  });

  logger.info({ concurrency: env.ai.concurrency }, 'AI Extraction worker started');
  return aiWorker;
}

async function stopAIWorker() {
  if (aiWorker) {
    logger.info('Stopping AI worker...');
    await aiWorker.close();
    logger.info('AI worker stopped.');
  }
}

module.exports = { startAIWorker, stopAIWorker };

