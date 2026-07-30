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

export function keywordClassify(description, hazardLabel) {
  const text = `${description || ''} ${hazardLabel || ''}`.toLowerCase();
  for (const item of HAZARD_CLASSIFICATION) {
    for (const kw of item.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return { category: item.category, categoryCN: item.cn, confidence: 'medium', method: 'keyword' };
      }
    }
  }
  return { category: 'Others', categoryCN: '其他', confidence: 'low', method: 'keyword' };
}
