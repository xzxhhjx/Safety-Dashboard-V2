// =========================================================================
// Frontend Configuration
// Migrated from js/config.js — ESM format for React
// =========================================================================

// --- Chart color palette (16 colors, WCAG AA compliant for graphics) ---
export const CHART_COLORS = [
  '#2563EB', '#DC2626', '#D97706', '#059669', '#7C3AED', '#0891B2', '#DB2777', '#EA580C',
  '#4F46E5', '#4D7C0F', '#0D9488', '#0284C7', '#C026D3', '#A16207', '#E11D48', '#64748B',
];

// --- Semantic colors ---
export const COLORS = {
  SAFE: '#059669', DANGER: '#DC2626', WARN: '#D97706', NEUTRAL: '#64748B',
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
export const AI_CONFIDENCE_COLORS = { high: '#059669', medium: '#D97706', low: '#DC2626' };

// --- Keyword-based hazard classification fallback ---
export function classifyHazard(description, hazardLabel) {
  const text = `${description || ''} ${hazardLabel || ''}`.toLowerCase();
  for (const item of HAZARD_CLASSIFICATION) {
    for (const kw of item.keywords) {
      if (text.includes(kw.toLowerCase())) return item;
    }
  }
  return HAZARD_CLASSIFICATION[HAZARD_CLASSIFICATION.length - 1]; // Others
}
