const logger = require('../utils/logger');
const { extractEntitiesWithNer } = require('./ner-client');

async function cleanWithAI(rawData) {
  if (!rawData) {
    logger.warn('AI extractor received null/undefined rawData');
    return null;
  }

  // 1. Company NER Extraction (Avagama API)
  const nerResult = await extractEntitiesWithNer(rawData);

  // 2. Table 1: company_profile_global mapping
  const profile = {
    domain_name:            rawData.domain_name || rawData.normalizedDomain || null,
    normalized_domain:      rawData.normalizedDomain || rawData.domain_name || null,
    company_name:           rawData.companyName || null,
    website:                rawData.domain_name ? `https://${rawData.domain_name}` : null,
    logo:                   rawData.imageUrl || null,
    title:                  rawData.title || null,
    description:            rawData.description || null,
    language:               rawData.language || null,
    country:                rawData.ipCountry || null,
    phone:                  rawData.phone || null,
    email:                  rawData.email || null,
    about_link:             Array.isArray(rawData.aboutLinks) && rawData.aboutLinks.length > 0 ? rawData.aboutLinks[0] : (typeof rawData.aboutLinks === 'string' ? rawData.aboutLinks : null),
    contact_link:           Array.isArray(rawData.contactLinks) && rawData.contactLinks.length > 0 ? rawData.contactLinks[0] : (typeof rawData.contactLinks === 'string' ? rawData.contactLinks : null),
    privacy_link:           Array.isArray(rawData.privacyLinks) && rawData.privacyLinks.length > 0 ? rawData.privacyLinks[0] : (typeof rawData.privacyLinks === 'string' ? rawData.privacyLinks : null),
    terms_link:             Array.isArray(rawData.termsLinks) && rawData.termsLinks.length > 0 ? rawData.termsLinks[0] : (typeof rawData.termsLinks === 'string' ? rawData.termsLinks : null),
    home_alllinks:          Array.isArray(rawData.homeLinks) ? JSON.stringify(rawData.homeLinks) : (rawData.homeLinks || null),
    about_alllinks:         Array.isArray(rawData.aboutLinks) ? JSON.stringify(rawData.aboutLinks) : (rawData.aboutLinks || null),
    contact_alllinks:       Array.isArray(rawData.contactLinks) ? JSON.stringify(rawData.contactLinks) : (rawData.contactLinks || null),
    privacy_alllinks:       Array.isArray(rawData.privacyLinks) ? JSON.stringify(rawData.privacyLinks) : (rawData.privacyLinks || null),
    terms_alllinks:         Array.isArray(rawData.termsLinks) ? JSON.stringify(rawData.termsLinks) : (rawData.termsLinks || null),
    response_code:          typeof rawData.responseCode === 'number' ? rawData.responseCode : (parseInt(rawData.responseCode, 10) || null),
    load_time_ms:           typeof rawData.loadTimeMs === 'number' ? rawData.loadTimeMs : (parseInt(rawData.loadTimeMs, 10) || null),
    host_ip:                rawData.hostIp || null,
    web_server:             rawData.webServer ? String(rawData.webServer).slice(0, 100) : null,
    linkedin_url:           rawData.socialLinks?.linkedin || rawData.domainMatchedSocialLinks?.linkedin || null,
    facebook_url:           rawData.socialLinks?.facebook || null,
    twitter_url:            rawData.socialLinks?.twitter || null,
    instagram_url:          rawData.socialLinks?.instagram || null,
    youtube_url:            rawData.socialLinks?.youtube || null,
    github_url:             rawData.socialLinks?.github || null,
    medium_url:             rawData.socialLinks?.medium || null,
    tiktok_url:             rawData.socialLinks?.tiktok || null,
    context_extract_status: rawData.domainStatus || rawData.comments || 'active',
  };

  // 3. Table 2: domain_content_staging mapping
  const staging = {
    domain_name:     profile.domain_name,
    content:         rawData.homeContent || null,
    about_content:   rawData.aboutPage || null,
    contact_content: rawData.contactPage || null,
    privacy_content: rawData.privacyPage || null,
    terms_content:   rawData.termsPage || null,
  };

  const cleaned = {
    domain_name: profile.domain_name,
    profile,
    staging,
    ner: nerResult,
    ...profile,
    ...staging,
  };

  logger.debug({ domain: cleaned.domain_name }, 'AI mapping & NER complete');
  return cleaned;
}

module.exports = { cleanWithAI };

