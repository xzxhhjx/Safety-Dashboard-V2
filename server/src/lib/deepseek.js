import { config } from '../config.js';

const DEEPSEEK_BASE = 'https://api.deepseek.com';
const MODEL_NAME = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

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

const SYSTEM_PROMPT = `You are a construction site safety inspector AI. Classify the observation into EXACTLY ONE category.

Available categories:
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

Return ONLY valid JSON, no other text:
{"category":"Category Name","categoryCN":"中文名","confidence":"high|medium|low","reasoning":"Brief Chinese explanation of why"}`;

export async function classifyWithDeepSeek(description, hazardLabel) {
  if (!config.deepseekApiKey) {
    return null;
  }

  const userMessage = `Hazard label: ${hazardLabel || '(none)'}
Description: ${description || '(none)'}

Classify this safety observation.`;

  try {
    const response = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 256,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[deepseek] HTTP ${response.status}: ${errText.slice(0, 200)}`);

      // 429 / rate limit — wait and retry once
      if (response.status === 429) {
        console.warn('[deepseek] Rate limited, waiting 10s before retry...');
        await sleep(10000);
        const retryResp = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.deepseekApiKey}`,
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.1,
            max_tokens: 256,
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!retryResp.ok) {
          console.error(`[deepseek] Retry also failed: ${retryResp.status}`);
          return null;
        }
        return parseResponse(await retryResp.json());
      }

      return null;
    }

    const data = await response.json();
    return parseResponse(data);
  } catch (err) {
    console.error(`[deepseek] API error: ${err.message}`);
    return null;
  }
}

function parseResponse(data) {
  try {
    const content = data.choices?.[0]?.message?.content || '';
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'Others';
    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low';
    return {
      category,
      categoryCN: CATEGORY_CN_MAP[category],
      confidence,
      reasoning: parsed.reasoning || '',
      method: 'deepseek',
    };
  } catch {
    // Try regex extraction
    const raw = data.choices?.[0]?.message?.content || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'Others';
        return {
          category,
          categoryCN: CATEGORY_CN_MAP[category],
          confidence: 'low',
          reasoning: parsed.reasoning || '',
          method: 'deepseek',
        };
      } catch {}
    }
  }
  return { category: 'Others', categoryCN: '其他', confidence: 'low', reasoning: 'Failed to parse DeepSeek response', method: 'deepseek' };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
