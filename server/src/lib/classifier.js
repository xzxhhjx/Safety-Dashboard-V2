// Whitelist of valid work areas on site (13 canonical areas)
export const VALID_AREAS = [
  'HRSG', 'GTST', 'CCW/ACW', 'GSUT', 'ECB', 'FGA',
  'FOP', 'TP-03', 'ECP', 'CWP', 'Live Plant', 'Lay Down', 'Work Shop',
];

/**
 * Area keyword map — mirrors the original Safety-Dashboard's matching strategy.
 *
 * Each entry has:
 *   area   — canonical area name
 *   en     — English abbreviation/keyword triggers (word-boundary regex match)
 *   cn     — Chinese keyword triggers (substring includes match)
 *
 * Priority: first-match-wins, so more specific categories come first.
 * EN keywords are tested before CN keywords within each entry.
 */
const AREA_KEYWORD_MAP = [
  {
    area: 'HRSG',
    en: ['HRSG'],
    cn: ['余热锅炉', '热回收', '锅炉', '炉内', '炉顶', '炉底', '前烟道', '烟囱'],
  },
  {
    area: 'GSUT',
    en: ['GSUT', 'GSU'],
    cn: ['升压变压器', '主变'],
  },
  {
    area: 'GTST',
    en: ['GTST', 'GT/ST', 'GT.ST'],
    cn: ['燃机', '汽机', '气机', '燃气轮机', '蒸汽轮机', '汽机厂房', '汽机区域', '汽机附跨'],
  },
  {
    area: 'CCW/ACW',
    en: ['CCW', 'ACW'],
    cn: ['化水', '化学水'],
  },
  {
    area: 'FOP',
    en: ['FOP', 'FOPS'],
    cn: ['燃油泵', '燃油'],
  },
  {
    area: 'FGA',
    en: ['FGA'],
    cn: ['烟气', '管廊', '管架'],
  },
  {
    area: 'ECB',
    en: ['ECB'],
    cn: ['电气楼', '电控楼', '配电楼', '配电室', '配电'],
  },
  {
    area: 'TP-03',
    en: ['TP03', 'TP-03', 'FGS'],
    cn: ['燃气站', '燃料气', '天然气'],
  },
  {
    area: 'CWP',
    en: ['CWP'],
    cn: ['冷却水泵', '循环水泵', '循环水', '海水泵', '海水'],
  },
  {
    area: 'ECP',
    en: ['ECP'],
    cn: ['制氯'],
  },
  {
    area: 'Live Plant',
    en: ['Live Plant'],
    cn: ['运行区', '老厂'],
  },
  {
    area: 'Lay Down',
    en: ['Laydown', 'Lay Down'],
    cn: ['堆场', '材料堆场', '库房', '仓库'],
  },
  {
    area: 'Work Shop',
    en: ['Workshop', 'Work Shop', 'Warehouse'],
    cn: ['加工车间', '加工棚', '焊工棚', '焊工', '板房', '预制棚', '预制场', '加工'],
  },
];

/**
 * Normalize a raw area string to a canonical valid area, or "Others".
 *
 * Uses the same strategy as the original Safety-Dashboard:
 *   1. Strip [...] bracket content as sub-area detail
 *   2. Match English keywords via word-boundary regex on the main text
 *   3. Match Chinese keywords via substring includes on the main text
 *   4. First match wins (AREA_KEYWORD_MAP order), fallback = "Others"
 *
 * Examples from real data:
 *   "HRSG (Heat Recovery Steam Generator) 余热锅炉"       → HRSG
 *   "GT/ST (Gas Turbine/...) 燃机房/汽机房[FGA]"         → GTST
 *   "FGA 管廊"                                            → FGA
 *   "FOPS"                                                → FOP
 *   "ECB (Electrical Building) 配电楼"                    → ECB
 *   "FGS (Fuel Gas Compressor Shed) 燃气站 TP03"          → TP-03
 *   "Laydown Area-Main Site 主现场材料堆场"                → Lay Down
 *   "锅炉顶部"                                             → HRSG
 *   "汽机厂房"                                             → GTST
 *   "主变"                                                 → GSUT
 *   "焊工棚"                                               → Work Shop
 *   "SINOTCC Office Area 办公室区域"                       → Others
 */
export function normalizeArea(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;

  // Skip obvious skip markers
  if (/^[\(（]?跳过[\)）]?$/.test(text)) return 'Others';

  // 1. Strip [...] bracket content as sub-area, keep main text for matching
  let mainText = text;
  const bracketMatch = text.match(/\[(.+?)\]/);
  if (bracketMatch) {
    mainText = text.replace(/\[.*?\]/g, '').trim();
  }

  const upper = mainText.toUpperCase();

  // 2. Keyword match — first wins (same as original Safety-Dashboard)
  for (const item of AREA_KEYWORD_MAP) {
    // English keywords: word-boundary regex (prevents partial matches like "ECB" in "ECBHRSG")
    for (const kw of item.en) {
      const esc = kw.replace(/[.*+?^{}()|[\]\\\/]/g, '\\$&');
      if (new RegExp('(^|[^a-zA-Z])' + esc + '($|[^a-zA-Z])', 'i').test(upper)) {
        return item.area;
      }
    }
    // Chinese keywords: substring includes
    for (const kw of item.cn) {
      if (mainText.includes(kw)) return item.area;
    }
  }

  return 'Others';
}

// =========================================================================
// Submitter Name Normalization
// Mirrors the original Safety-Dashboard's NAME_MAPPINGS + cleaning logic.
// =========================================================================

/**
 * Known name variants → canonical display name.
 * Key is the lowercase, whitespace-normalized raw input.
 */
export const NAME_MAPPINGS = {
  'liuhexin': '刘合信',
  'liu hexin': '刘合信',
  'p.guna': 'P.Guna',
  'p. guna': 'P.Guna',
  'p guna': 'P.Guna',
  'guna': 'P.Guna',
  'tankaichun': '谭开春',
  'tan kaichun': '谭开春',
  '2025.11.21 ytl': '胡佳玺',
  '2025.11.21': '胡佳玺',
  'dsa ashik': 'Das Ashik',
  'wang ming': '汪明',
  'wang qi': '王琦',
  'rajuludhileephan': 'Rajuludhileephan Prasanth',
  'hao shuaiyuan': '郝帅渊',
  'rajendirran jay': 'Rajendiran Jaiganesh',
  'rajendiran jay': 'Rajendiran Jaiganesh',
  'rajendiran jaiganesh was': 'Rajendiran Jaiganesh',
  'rajendirran jaiganesh': 'Rajendiran Jaiganesh',
  'rajendiran jaigenesh': 'Rajendiran Jaiganesh',
  'zhou lingen': '周灵恩',
  'fahad abdul aziz': 'Fahad Md Abdul Aziz',
  'chiinnu veerappan': 'Chinnu Veerappan',
  'chinnu veerappan': 'Chinnu Veerappan',
};

/**
 * Normalize a raw submitter name to its canonical form.
 *
 * Steps (same as original Safety-Dashboard):
 *   1. Skip invalid/placeholder values → "Unknown"
 *   2. Check NAME_MAPPINGS for known variants
 *   3. Fallback: title-case (capitalize first letter of each word)
 */
export function normalizeSubmitter(raw) {
  if (!raw || typeof raw !== 'string') return 'Unknown';
  let name = String(raw).trim();

  // Skip obvious junk values
  const invalid = new Set(['(跳过)', '跳过', '(空)', 'nan', '-', 'NAN', 'NULL', 'unknown', 'nil', '0', '']);
  if (invalid.has(name.toLowerCase())) return 'Unknown';

  // Normalize whitespace
  name = name.replace(/\s+/g, ' ');

  // Check known mappings (case-insensitive)
  const lower = name.toLowerCase();
  if (NAME_MAPPINGS[lower]) return NAME_MAPPINGS[lower];

  // Title-case: capitalize first letter of each word/segment
  return name.toLowerCase().replace(/(?:^|\s|-|\.)\S/g, c => c.toUpperCase());
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
