const { extractEntitiesWithNer, PAYLOAD_FILE_PATH, RESPONSE_FILE_PATH } = require('../services/ner-client');
const fs = require('fs');

async function testNer() {
  const sample = {
    domain_name: 'infynd.com',
    companyName: 'InFynd Group',
    title: 'InFynd – B2B Data & Marketing Solutions for Growth',
    description: 'Drive sales with clean B2B data, automated outreach, and real-time reporting.',
    aboutPage: 'InFynd Group provides verified B2B and healthcare contact data. Sequoia Capital and partners collaborate with top tech entities.',
    homeContent: 'Welcome to InFynd. Smarter data platforms for modern enterprise growth.',
  };

  console.log('\n--- Running Standalone NER Test ---');
  await extractEntitiesWithNer(sample);

  console.log(`\nPayload saved to:  ${PAYLOAD_FILE_PATH}`);
  console.log(`Response saved to: ${RESPONSE_FILE_PATH}\n`);

  if (fs.existsSync(RESPONSE_FILE_PATH)) {
    console.log(fs.readFileSync(RESPONSE_FILE_PATH, 'utf-8'));
  }
}

testNer();

