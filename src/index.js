/**
 * ──────────────────────────────────────────────────────────────────
 * Service 2: AI Extraction & NER Microservice
 * ──────────────────────────────────────────────────────────────────
 * Consumes raw crawl results from `ai_queue`, strips boilerplate,
 * calls Avagama Company NER API to extract entities, structures
 * profile & staging data, and forwards jobs to `db_queue`.
 */

const env = require('./config/env.config');
const logger = require('./utils/logger');
const { closeQueues, aiQueue, dbQueue } = require('./queues/ai.queues');
const { startAIWorker, stopAIWorker } = require('./workers/ai-extractor.worker');

logger.info('═══════════════════════════════════════════════════════');
logger.info('AI Extraction & NER Service (Stage 2) — Starting Up');
logger.info('═══════════════════════════════════════════════════════');
logger.info({
  aiConcurrency: env.ai.concurrency,
  nerApiUrl: env.ner.baseUrl,
  nerEnabled: env.ner.enabled,
  backpressure: env.backpressure,
  nodeEnv: env.nodeEnv,
}, 'Configuration loaded');

startAIWorker();

const statsInterval = setInterval(async () => {
  try {
    const [aiWaiting, aiActive, dbWaiting] = await Promise.all([
      aiQueue.getWaitingCount(),
      aiQueue.getActiveCount(),
      dbQueue.getWaitingCount(),
    ]);

    logger.info({
      ai: { waiting: aiWaiting, active: aiActive },
      downstream_db_queue_waiting: dbWaiting,
    }, 'AI Extraction Service Stats');
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to fetch queue stats');
  }
}, 30000);

let isShuttingDown = false;
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal} — Gracefully shutting down AI Service...`);
  clearInterval(statsInterval);

  await stopAIWorker();
  await closeQueues();

  logger.info('AI Extraction Service shut down cleanly.');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

