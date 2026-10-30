/**
 * Strips HTML tags, entities, and excess whitespace from raw crawled text.
 * Clamps to max character limit (API requires <= 50,000 characters).
 */
function cleanAndClampText(text, maxChars = 50000) {
  if (!text || typeof text !== 'string') return '';
  const cleaned = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > maxChars ? cleaned.slice(0, maxChars) : cleaned;
}

module.exports = { cleanAndClampText };

