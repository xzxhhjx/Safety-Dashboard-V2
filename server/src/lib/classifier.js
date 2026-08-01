// Whitelist of valid work areas on site
export const VALID_AREAS = [
  'HRSG', 'GTST', 'CCW/ACW', 'GSUT', 'ECB', 'FGA',
  'FOPS', 'TP-03', 'ECP', 'CWP', 'Live Plant', 'Laydown',
];

/**
 * Normalize a raw area string to a canonical valid area, or "Others".
 *
 * Handles patterns like:
 *   "HRSG"        → "HRSG"
 *   "hrsg area"   → "HRSG"
 *   "Others[GSUT]"  → "GSUT"
 *   "其他[GSUT]"    → "GSUT"
 *   "Building CWP"  → "CWP"
 *   "Unknown XYZ"   → "Others"
 */
export function normalizeArea(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;

  const lower = text.toLowerCase();

  // 1. "Others[xxx]" or "其他[xxx]" → extract bracket content
  const bracketMatch = text.match(/^(?:other|其他|其它)\s*[\[\(（](.+?)[\]\)）]\s*$/i);
  if (bracketMatch) {
    const inner = bracketMatch[1].trim();
    for (const area of VALID_AREAS) {
      if (inner.toLowerCase() === area.toLowerCase()) return area;
    }
    return 'Others';
  }

  // 2. Exact match (case-insensitive)
  for (const area of VALID_AREAS) {
    if (lower === area.toLowerCase()) return area;
  }

  // 3. Starts with a valid area name (e.g. "HRSG Area", "CWP Building")
  for (const area of VALID_AREAS) {
    if (lower.startsWith(area.toLowerCase() + ' ') || lower.startsWith(area.toLowerCase() + '-') || lower.startsWith(area.toLowerCase() + '/')) {
      return area;
    }
  }

  // 4. Contains a valid area as a distinct word
  for (const area of VALID_AREAS) {
    // Only apply for multi-char areas to avoid false matches
    if (area.length >= 3) {
      const idx = lower.indexOf(area.toLowerCase());
      if (idx !== -1) {
        // Check word boundary on both sides
        const beforeOk = idx === 0 || /[\s\-/,]/.test(text[idx - 1]);
        const afterOk = idx + area.length === text.length || /[\s\-/,]/.test(text[idx + area.length]);
        if (beforeOk && afterOk) return area;
      }
    }
  }

  return 'Others';
}

export const HAZARD_CLASSIFICATION = [
  { category: 'Confined Space', cn: '有限空间', keywords: ['confined space', '有限空间'] },
  { category: 'Excavation & Trenching', cn: '开挖与沟槽', keywords: ['excavation', '开挖', '基坑', '沟', '井'] },
  { category: 'Lifting & Rigging', cn: '起重与吊装', keywords: ['lifting', 'crane', '起重', '吊车', '吊索具', 'mewp', 'rigging'] },
  { category: 'Scaffolding', cn: '脚手架', keywords: ['scaffold', '脚手架'] },
  { category: 'Electrical Safety', cn: '电气安全', keywords: ['electrical', 'loto', '用电', '电气', '挂牌上锁'] },
  { category: 'Fire & Hot Work', cn: '火灾与动火', keywords: ['hot work', '动火', 'fire extinguisher', '灭火器'] },
  { category: 'Working at Height', cn: '高处作业', keywords: ['working at height', '高处作业', 'falling hazard', 'falling object', '坠落危险', '高处落物'] },
  { category: 'Equipment, Tools & Machinery', cn: '设备工具机械', keywords: ['equipment', 'tools without inspection', 'defective tool', 'defective tools', '机具', '设备', '有缺陷的工具'] },
  { category: 'PPE', cn: '个人防护用品', keywords: ['ppe', '劳保用品', '个人劳保', '个人防护'] },
  { category: 'Barricade, Signage & Isolation', cn: '围护标识隔离', keywords: ['barricade', 'signage', '标识', '标牌', '安全防护措施', '孔洞防护'] },
  { category: 'Housekeeping & Slip/Trip', cn: '文明施工防滑倒', keywords: ['housekeeping', 'slip', 'trip', 'house keeping', '文明施工', '尖锐物', '滑倒', '绊倒', '材料存放', 'materials management'] },
  { category: 'Permits, Procedures & Competency', cn: '许可程序资质', keywords: ['swp', 'tbm', 'ptw', 'certificate', '程序遵守', '班前会', '作业票', '资格', 'violation', '违章'] },
  { category: 'Traffic & Vehicle Safety', cn: '交通车辆安全', keywords: ['traffic', '交通', '运输', 'vehicle'] },
  { category: 'Emergency Preparedness', cn: '应急准备', keywords: ['first aid', 'emergency', '急救', '应急', 'emergency equipment'] },
  { category: 'Environmental', cn: '环境', keywords: ['environmental', '环境', 'soil erosion', 'hygiene', 'mosquito', '水土'] },
  { category: 'Others', cn: '其他', keywords: ['other', '其他', '其它'] },
];

/**
 * Pre-process hazard name: extract real content from bracket/paren annotations.
 * "其他[地面有油污]" → "地面有油污"
 * "其他 - 电线裸露"  → "电线裸露"
 * "其他"             → "其他"
 */
export function processHazardName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '其他';
  let name = rawName.trim();
  if (!name) return '其他';
  // "其他[xxx]" / "其他 - xxx" / "其他(xxx)" → extract the real content
  const match = name.match(/^(?:other|其他|其它)[\s\-:：\(\)\[\]]+\s*(.+)/i);
  if (match && match[1]) {
    let extracted = match[1].trim();
    // Strip trailing closing bracket/paren
    if (name.includes('(') || name.includes('（')) {
      extracted = extracted.replace(/[\)）]$/, '');
    }
    return extracted || '其他';
  }
  if (/^(other|其他|其它)$/i.test(name)) return '其他';
  return name;
}

export function keywordClassify(description, hazardLabel) {
  // Pre-process hazard name to extract real content from bracket format
  const cleaned = hazardLabel ? processHazardName(hazardLabel) : '';
  const text = `${description || ''} ${cleaned}`.toLowerCase();
  for (const item of HAZARD_CLASSIFICATION) {
    for (const kw of item.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return { category: item.category, categoryCN: item.cn, confidence: 'medium', method: 'keyword', area: null };
      }
    }
  }
  return { category: 'Others', categoryCN: '其他', confidence: 'low', method: 'keyword', area: null };
}
