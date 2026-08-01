import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { normalizeArea } from './classifier.js';

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const VALID_CATEGORIES = new Set([
  'Confined Space', 'Excavation & Trenching', 'Lifting & Rigging',
  'Scaffolding', 'Electrical Safety', 'Fire & Hot Work',
  'Working at Height', 'Equipment, Tools & Machinery', 'PPE',
  'Barricade, Signage & Isolation', 'Housekeeping & Slip/Trip',
  'Permits, Procedures & Competency', 'Traffic & Vehicle Safety',
  'Emergency Preparedness', 'Environmental', 'Others',
]);

const CATEGORY_CN_MAP = {
  'Confined Space': '有限空间', 'Excavation & Trenching': '开挖与沟槽',
  'Lifting & Rigging': '起重与吊装', 'Scaffolding': '脚手架',
  'Electrical Safety': '电气安全', 'Fire & Hot Work': '火灾与动火',
  'Working at Height': '高处作业', 'Equipment, Tools & Machinery': '设备工具机械',
  'PPE': '个人防护用品', 'Barricade, Signage & Isolation': '围护标识隔离',
  'Housekeeping & Slip/Trip': '文明施工防滑倒',
  'Permits, Procedures & Competency': '许可程序资质',
  'Traffic & Vehicle Safety': '交通车辆安全',
  'Emergency Preparedness': '应急准备', 'Environmental': '环境', 'Others': '其他',
};

async function urlToGeminiPart(url) {
  if (url.startsWith('gs://')) {
    return { fileData: { fileUri: url, mimeType: 'image/jpeg' } };
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return { inlineData: { data: buffer.toString('base64'), mimeType: contentType } };
}

export async function classifyWithGemini(imageUrls, description, hazardLabel) {
  if (!genAI) {
    return null; // No API key — caller should fall back to keyword
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // Try loading images
  let imageParts = [];
  if (imageUrls && imageUrls.length > 0) {
    for (const url of imageUrls) {
      if (imageParts.length >= 4) break;
      try {
        imageParts.push(await urlToGeminiPart(url));
      } catch (err) {
        console.warn(`[gemini] Failed to load image: ${err.message}`);
      }
    }
  }

  const hasImages = imageParts.length > 0;
  const prompt = buildPrompt(description, hazardLabel, hasImages);

  try {
    const parts = hasImages ? [prompt, ...imageParts] : [prompt];
    const result = await model.generateContent(parts);
    return parseResponse(result.response.text());
  } catch (err) {
    const msg = err.message || String(err);
    console.error(`[gemini] API error: ${msg}`);

    // 429 = rate limit or quota exhausted — wait and retry once
    if (msg.includes('429') || msg.includes('quota') || msg.includes('depleted')) {
      console.warn('[gemini] Rate limited, waiting 10s before retry...');
      await sleep(10000);
      try {
        const parts2 = hasImages ? [prompt, ...imageParts] : [prompt];
        const result2 = await model.generateContent(parts2);
        return parseResponse(result2.response.text());
      } catch (retryErr) {
        console.error(`[gemini] Retry also failed: ${retryErr.message}`);
      }
    }

    return null;
  }
}

function buildPrompt(description, hazardLabel, hasImages) {
  const imageNote = hasImages
    ? 'You are provided with photos of the observation. Trust PHOTOS over text description.'
    : 'No photos are available — classify based on the description and hazard label alone.';

  return `You are a construction site safety inspector AI.

## Task 1: Classify hazard category into EXACTLY ONE:

1. Confined Space (有限空间)
2. Excavation & Trenching (开挖与沟槽)
3. Lifting & Rigging (起重与吊装)
4. Scaffolding (脚手架)
5. Electrical Safety (电气安全)
6. Fire & Hot Work (火灾与动火)
7. Working at Height (高处作业)
8. Equipment, Tools & Machinery (设备工具机械)
9. PPE (个人防护用品)
10. Barricade, Signage & Isolation (围护标识隔离)
11. Housekeeping & Slip/Trip (文明施工防滑倒)
12. Permits, Procedures & Competency (许可程序资质)
13. Traffic & Vehicle Safety (交通车辆安全)
14. Emergency Preparedness (应急准备)
15. Environmental (环境)
16. Others (其他)

## Task 2: Identify the work area from the description/photos.

Valid areas: HRSG, GTST, CCW/ACW, GSUT, ECB, FGA, FOPS, TP-03, ECP, CWP, Live Plant, Laydown

If the area cannot be determined or doesn't match any valid area, use "Others".

${imageNote}

Hazard label: ${hazardLabel || '(none)'}
Description: ${description || '(none)'}

Return JSON:
{"category":"...","categoryCN":"...","confidence":"high"|"medium"|"low","area":"valid area or Others","reasoning":"Brief Chinese explanation of why this category fits"}`;
}

function parseResponse(text) {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'Others';
    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low';
    const area = normalizeArea(parsed.area) || null;
    return { category, categoryCN: CATEGORY_CN_MAP[category], confidence, area, reasoning: parsed.reasoning || '' };
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'Others';
        const area = normalizeArea(parsed.area) || null;
        return { category, categoryCN: CATEGORY_CN_MAP[category], confidence: 'low', area, reasoning: parsed.reasoning || '' };
      } catch {}
    }
  }
  return { category: 'Others', categoryCN: '其他', confidence: 'low', area: null, reasoning: 'Failed to parse response' };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
