import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
const MODEL_NAME = 'gemini-2.5-flash';

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
    return { category: 'Others', categoryCN: '其他', confidence: 'low', reasoning: 'Gemini API key not configured' };
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const imageParts = [];

  for (const url of imageUrls) {
    if (imageParts.length >= 4) break;
    try {
      imageParts.push(await urlToGeminiPart(url));
    } catch (err) {
      console.warn(`[gemini] Failed to load image: ${err.message}`);
    }
  }

  if (imageParts.length === 0) {
    return { category: 'Others', categoryCN: '其他', confidence: 'low', reasoning: 'No readable images' };
  }

  const prompt = buildPrompt(description, hazardLabel);

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    return parseResponse(result.response.text());
  } catch (err) {
    console.error(`[gemini] API error: ${err.message}`);
    return { category: 'Others', categoryCN: '其他', confidence: 'low', reasoning: `API error: ${err.message}` };
  }
}

function buildPrompt(description, hazardLabel) {
  return `You are a construction site safety inspector AI. Classify into EXACTLY ONE category:

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

Hazard label: ${hazardLabel || '(none)'}
Description: ${description || '(none)'}

Trust PHOTOS over text. Return JSON:
{"category":"...","categoryCN":"...","confidence":"high"|"medium"|"low","reasoning":"Brief Chinese explanation"}`;
}

function parseResponse(text) {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'Others';
    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low';
    return { category, categoryCN: CATEGORY_CN_MAP[category], confidence, reasoning: parsed.reasoning || '' };
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'Others';
        return { category, categoryCN: CATEGORY_CN_MAP[category], confidence: 'low', reasoning: parsed.reasoning || '' };
      } catch {}
    }
  }
  return { category: 'Others', categoryCN: '其他', confidence: 'low', reasoning: 'Failed to parse response' };
}
