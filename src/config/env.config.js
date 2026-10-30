require('dotenv').config();

const requiredVars = ['REDIS_HOST', 'REDIS_PORT'];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`FATAL: Missing required environment variable in AI Service: ${varName}`);
    process.exit(1);
  }
}

module.exports = {
  ai: {
    concurrency: parseInt(process.env.AI_CONCURRENCY || '20', 10),
  },

  ner: {
    baseUrl: process.env.NER_API_BASE_URL || 'https://avagama.co/v1/extract',
    apiKey: process.env.NER_API_KEY || '',
    timeoutMs: parseInt(process.env.NER_TIMEOUT_MS || '30000', 10),
    enabled: process.env.NER_ENABLED !== 'false',
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  backpressure: {
    dbQueueMax: parseInt(process.env.BACKPRESSURE_DB_QUEUE_MAX || '200', 10),
    pauseMs: parseInt(process.env.BACKPRESSURE_PAUSE_MS || '2000', 10),
  },

  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'production',
};

