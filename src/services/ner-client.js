const fs = require('fs');
const path = require('path');
const env = require('../config/env.config');
const logger = require('../utils/logger');
const { cleanAndClampText } = require('../utils/text-cleaner');

const PAYLOAD_FILE_PATH = path.resolve(process.cwd(), 'ner_payload.json');
const RESPONSE_FILE_PATH = path.resolve(process.cwd(), 'ner_response.json');

function buildNerPayload(rawData) {
  const texts = [];

  if (rawData.title) {
    const title = cleanAndClampText(rawData.title);
    if (title) texts.push(title);
  }

  if (rawData.description) {
    const desc = cleanAndClampText(rawData.description);
    if (desc) texts.push(desc);
  }

  if (rawData.aboutPage) {
    const about = cleanAndClampText(rawData.aboutPage);
    if (about) texts.push(about);
  }

  if (rawData.homeContent) {
    const home = cleanAndClampText(rawData.homeContent);
    if (home) texts.push(home);
  }

  if (texts.length === 0) {
    if (rawData.companyName) {
      texts.push(cleanAndClampText(rawData.companyName));
    } else if (rawData.domain_name) {
      texts.push(rawData.domain_name);
    } else {
      texts.push('No content extracted');
    }
  }

  const cappedTexts = texts.slice(0, 100);
  return cappedTexts.length === 1 ? { text: cappedTexts[0] } : { texts: cappedTexts };
}

function writeJsonFileSync(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    logger.error({ filePath, err: err.message }, 'Failed to write JSON inspection file');
  }
}

async function extractEntitiesWithNer(rawData) {
  if (!env.ner.enabled) {
    logger.info('[NER Client] Disabled via NER_ENABLED=false');
    return null;
  }

  const domain = rawData.domain_name || rawData.normalizedDomain || 'unknown-domain';
  const payload = buildNerPayload(rawData);

  // Write inspection payload
  writeJsonFileSync(PAYLOAD_FILE_PATH, payload);

  let endpoint = env.ner.baseUrl || 'https://avagama.co/v1/extract';
  if (!endpoint.endsWith('/v1/extract')) {
    endpoint = `${endpoint.replace(/\/+$/, '')}/v1/extract`;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (env.ner.apiKey) {
    headers['Authorization'] = env.ner.apiKey.startsWith('Bearer ')
      ? env.ner.apiKey
      : `Bearer ${env.ner.apiKey}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(env.ner.timeoutMs),
    });

    const responseText = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', responseText);

    let parsedBody;
    try {
      parsedBody = JSON.parse(responseText);
    } catch {
      parsedBody = { rawText: responseText };
    }

    writeJsonFileSync(RESPONSE_FILE_PATH, parsedBody);
    return parsedBody;
  } catch (error) {
    console.error('Fetch error:', error);
    console.error('Error cause:', error.cause);

    const errorResponse = {
      error: error.message,
      cause: error.cause ? String(error.cause) : null,
      name: error.name,
      domain,
      timestamp: new Date().toISOString(),
    };

    writeJsonFileSync(RESPONSE_FILE_PATH, errorResponse);
    return errorResponse;
  }
}

module.exports = {
  buildNerPayload,
  extractEntitiesWithNer,
  PAYLOAD_FILE_PATH,
  RESPONSE_FILE_PATH,
};

