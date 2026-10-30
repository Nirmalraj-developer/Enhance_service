# AI Extraction & NER Service (Microservice 2)

Entity identification & text structuring pipeline (Stage 2 of the 3-stage pipeline).
- Consumes raw crawl results from `ai_queue` in Redis.
- Strips boilerplate HTML, tags, and formatting noise.
- Dispatches extracted text to the Avagama Company NER API to identify organizations, companies, and character offsets.
- Structures results into unified `profile` and `staging` records.
- Forwards cleaned data downstream to `db_queue`.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy and fill in `.env`:
```bash
cp .env.example .env
```
Ensure `NER_API_BASE_URL` and `NER_API_KEY` are populated.

### 3. Run Standalone NER Test
```bash
npm run test:ner
```

### 4. Start Worker
```bash
npm start
```

### Docker
```bash
docker build -t ai-extraction-service .
docker run -d --name ai-extraction-service --network host --env-file .env ai-extraction-service
```
