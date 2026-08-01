// =========================================================================
// Frontend Configuration
// Migrated from js/config.js — ESM format for React
// =========================================================================

// --- Chart color palette (macOS Sonoma / Apple HIG) ---
export const CHART_COLORS = [
  '#007AFF', '#34C759', '#FF9F0A', '#FF453A',
  '#5856D6', '#8E8E93', '#FF6B35', '#00C7BE',
  '#AF52DE', '#FF2D55', '#30B0C7', '#FFD60A',
  '#32D74B', '#BF5AF2', '#64D2FF', '#AEAEB2',
];

// --- Apple semantic colors ---
export const COLORS = {
  SAFE: '#34C759', DANGER: '#FF453A', WARN: '#FF9F0A', NEUTRAL: '#8E8E93',
};

// --- Status pie colors ---
export const STATUS_COLORS = {
  'Closed': '#34C759', '已关闭': '#34C759', 'Done': '#34C759',
  'Open': '#FF9F0A', 'In Progress': '#007AFF',
  'Overdue': '#FF453A', 'Pending': '#8E8E93',
};

// --- Excel/Firestore column key mapping ---
// The system uses these keywords to auto-detect columns across different table formats
export const COL_KEYS = {
  id: ['序号', 'No', 'id', 'ID', '编号', '单据流水号'],
  hazard: ['Type of hazard', '隐患分类', '观察项目', '问题类型'],
  status: ['Status of the finding', '观察项状态', 'Status', '状态', 'Finding Status', '情况', '观察状态', '处理进度'],
  dept: ['Company', 'Department', '单位', '部门', '单位/部门'],
  desc: ['Description', '观察项描述', '观察描述'],
  time: ['提交时间', 'Time', 'Date', '日期', '发起时间'],
  name: ['Created by', 'Submitter', '填报人', '提交人', '1.', 'NAME', '姓名', 'Name', '观察人姓名'],
  obsType: ['Type of the observation', '观察项分类', '观察者类型'],
  area: ['Where', 'Area', '区域', '具体位置'],
  who: ['Who', 'Personnel', 'involved', '当事人', '涉及人员', '责任人'],
  photo: ['Photo', '图片', '现场照片'],
};

// --- Hazard classification (OSHA / ISO 45001) ---
// Ordered by priority — first match wins. More specific categories come first.
// NOTE: Must stay in sync with server/src/lib/classifier.js HAZARD_CLASSIFICATION
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

// --- AI confidence level colors ---
export const AI_CONFIDENCE_COLORS = { high: '#34C759', medium: '#FF9F0A', low: '#FF453A' };

// --- Keyword-based hazard classification fallback ---

/**
 * Pre-process hazard name: extract real content from bracket/paren annotations.
 * "其他[地面有油污]" → "地面有油污"
 * "其他 - 电线裸露"  → "电线裸露"
 */
function processHazardName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '其他';
  let name = rawName.trim();
  if (!name) return '其他';
  const match = name.match(/^(?:other|其他|其它)[\s\-:：\(\)\[\]]+\s*(.+)/i);
  if (match && match[1]) {
    let extracted = match[1].trim();
    if (name.includes('(') || name.includes('（')) {
      extracted = extracted.replace(/[\)）]$/, '');
    }
    return extracted || '其他';
  }
  if (/^(other|其他|其它)$/i.test(name)) return '其他';
  return name;
}

export function classifyHazard(description, hazardLabel) {
  const cleaned = hazardLabel ? processHazardName(hazardLabel) : '';
  const text = `${description || ''} ${cleaned}`.toLowerCase();
  for (const item of HAZARD_CLASSIFICATION) {
    for (const kw of item.keywords) {
      if (text.includes(kw.toLowerCase())) return item;
    }
  }
  return HAZARD_CLASSIFICATION[HAZARD_CLASSIFICATION.length - 1]; // Others
}
