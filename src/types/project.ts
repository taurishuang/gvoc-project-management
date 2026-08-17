// 项目执行类型
export type ExecutionType = '定性' | '定量' | '体验测评' | '大数据';

// 项目研究类型
export type ResearchType =
  | '新人群新场景新需求'
  | '现有人群未满足需求'
  | '开发过程中的测评'
  | '上市后产品优化'
  | '其他专题研究';

// 内外销 - 国家/地区枚举
export type SalesRegion = string;

// 大洲/地区分组树
export interface RegionGroup {
  key: string;
  label: string;
  countries: { label: string; value: string }[];
}

export const REGION_TREE: RegionGroup[] = [
  {
    key: 'asia_china',
    label: '亚洲（中国大陆）',
    countries: [
      { label: '中国大陆', value: '中国大陆' },
    ],
  },
  {
    key: 'asia_non_china',
    label: '亚洲（非中国大陆）',
    countries: [
      { label: '中国香港', value: '中国香港' },
      { label: '中国澳门', value: '中国澳门' },
      { label: '中国台湾', value: '中国台湾' },
      { label: '日本', value: '日本' },
      { label: '韩国', value: '韩国' },
      { label: '泰国', value: '泰国' },
      { label: '印度', value: '印度' },
      { label: '越南', value: '越南' },
      { label: '菲律宾', value: '菲律宾' },
      { label: '印度尼西亚', value: '印度尼西亚' },
      { label: '马来西亚', value: '马来西亚' },
      { label: '新加坡', value: '新加坡' },
      { label: '缅甸', value: '缅甸' },
      { label: '柬埔寨', value: '柬埔寨' },
      { label: '土库曼斯坦', value: '土库曼斯坦' },
      { label: '格鲁吉亚', value: '格鲁吉亚' },
      { label: '伊朗', value: '伊朗' },
      { label: '东南亚其他', value: '东南亚其他' },
    ],
  },
  {
    key: 'europe',
    label: '欧洲',
    countries: [
      { label: '英国', value: '英国' },
      { label: '德国', value: '德国' },
      { label: '法国', value: '法国' },
      { label: '意大利', value: '意大利' },
      { label: '西班牙', value: '西班牙' },
      { label: '荷兰', value: '荷兰' },
      { label: '比利时', value: '比利时' },
      { label: '瑞典', value: '瑞典' },
      { label: '挪威', value: '挪威' },
      { label: '丹麦', value: '丹麦' },
      { label: '俄罗斯', value: '俄罗斯' },
      { label: '波兰', value: '波兰' },
      { label: '捷克', value: '捷克' },
      { label: '罗马尼亚', value: '罗马尼亚' },
    ],
  },
  {
    key: 'americas',
    label: '美洲',
    countries: [
      { label: '美国', value: '美国' },
      { label: '加拿大', value: '加拿大' },
      { label: '墨西哥', value: '墨西哥' },
      { label: '巴西', value: '巴西' },
      { label: '阿根廷', value: '阿根廷' },
      { label: '智利', value: '智利' },
      { label: '哥伦比亚', value: '哥伦比亚' },
    ],
  },
  {
    key: 'africa',
    label: '非洲',
    countries: [
      { label: '南非', value: '南非' },
      { label: '尼日利亚', value: '尼日利亚' },
      { label: '埃及', value: '埃及' },
      { label: '肯尼亚', value: '肯尼亚' },
      { label: '埃塞俄比亚', value: '埃塞俄比亚' },
      { label: '非洲其他', value: '非洲其他' },
    ],
  },
  {
    key: 'oceania',
    label: '大洋洲',
    countries: [
      { label: '澳大利亚', value: '澳大利亚' },
      { label: '新西兰', value: '新西兰' },
    ],
  },
  {
    key: 'middle_east',
    label: '中东',
    countries: [
      { label: '沙特阿拉伯', value: '沙特阿拉伯' },
      { label: '阿联酋', value: '阿联酋' },
      { label: '卡塔尔', value: '卡塔尔' },
      { label: '科威特', value: '科威特' },
      { label: '以色列', value: '以色列' },
      { label: '土耳其', value: '土耳其' },
      { label: '中东其他', value: '中东其他' },
    ],
  },
];

// 定性/定量/体验测评 详细字段（每种执行类型各自独立）
export interface QualQtyFields {
  executionMethod: string;        // 提炼总结执行方法
  sampleSize: string;             // 样本量
  targetAudience?: string;        // 目标人群（仅定性有）
  targetAudienceFile?: ProjectFile; // 人群清单附件（仅定性有）
  sampleDistribution: string;     // 样本分布（地理位置等）
  recruitmentConditions: string;  // 招募条件简述
  rawRecordContent: string;       // 原始笔录内容
}

// 大数据 详细字段
export interface BigDataFields {
  dataSource: string;
  dataAcquisitionMethod: string;
  dataRangeAndCleaning: string;
  dataVolume: string;
}

// 上传文件（含执行类型归属）
export interface ProjectFile {
  uid: string;
  name: string;
  url?: string;
  size?: number;
  type?: string;
  status?: 'uploading' | 'done' | 'error';
  category?: string; // 归属：'定性'|'定量'|'体验测评'|'大数据'|'综合'
}

// AI 提炼字段模式
export type AIFieldMode = 'ai' | 'manual';

// AI 提炼字段（支持双模式）
export interface AIField {
  mode: AIFieldMode;   // 'ai' = 提交后AI提炼, 'manual' = 用户自己输入
  value: string;
}

// 项目数据模型
export interface Project {
  id: string;
  projectNo: string;              // 项目编号（系统自动生成）
  projectName: string;            // 项目名称
  salesRegion: SalesRegion[];     // 内外销（国家/地区，多选）
  projectTime: string;            // 项目时间（年份）
  businessUnit: string;           // 所属事业部
  category: string[];             // 所属品类（多选）
  brand: string[];                // 品牌（多选，选填）
  researchType: ResearchType;     // 项目研究类型
  executionType: ExecutionType[]; // 项目执行类型（多选）

  // 执行类型详细字段（每个执行类型独立一份，key为执行类型名）
  qualFields?: Partial<Record<'定性' | '定量' | '体验测评', QualQtyFields>>;
  bigDataFields?: BigDataFields;

  // 项目背景信息（支持AI提炼）
  projectBackground: AIField;
  projectPurpose: AIField;
  mainConclusion: AIField;
  followUpDirection: AIField;

  // 上传文件
  files: ProjectFile[];

  // 元数据
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// ─── 静态选项数据 ────────────────────────────────────────────────────

// 事业部 + 品类 二级联动
export const BUSINESS_UNIT_CATEGORY_MAP: Record<string, string[]> = {
  '家用空调事业部': ['家用空调', '中央空调（家用）', '空气净化器', '空调配件'],
  '冰箱事业部': ['家用冰箱', '冷柜', '酒柜', '嵌入式冰箱'],
  '洗衣机事业部': ['滚筒洗衣机', '波轮洗衣机', '洗烘一体机', '干衣机'],
  '厨房和热水事业部': ['燃气热水器', '电热水器', '空气能热水器', '油烟机', '燃气灶', '蒸烤箱一体机'],
  '小家电事业部': ['电饭煲', '电磁炉', '电水壶', '豆浆机', '破壁机', '空气炸锅', '吸尘器', '洗碗机'],
  '微波和烤箱事业部': ['微波炉', '烤箱', '微烤一体机', '蒸烤箱'],
  '中国区域': ['区域定制产品', '渠道专供产品', '工程机', '其他区域产品'],
};

export const BUSINESS_UNIT_OPTIONS = Object.keys(BUSINESS_UNIT_CATEGORY_MAP);

// 品牌选项（与GVOC本品品牌保持一致）
export const BRAND_OPTIONS = [
  '美的', '小天鹅', '其他', '华凌', '海尔',
  'COLMO', '小米', '苏泊尔', 'TOSHIBA（东芝）', 'Comfee',
  'Bugu（布谷）', 'AEG', 'Eureka',
];

// 平铺国家列表（兼容旧代码）
export const SALES_REGION_OPTIONS = REGION_TREE.flatMap(g =>
  g.countries.map(c => ({ label: c.label, value: c.value, group: g.label }))
);

// 执行类型选项
export const EXECUTION_TYPE_OPTIONS: { label: string; value: ExecutionType }[] = [
  { label: '定性', value: '定性' },
  { label: '定量', value: '定量' },
  { label: '体验测评', value: '体验测评' },
  { label: '大数据', value: '大数据' },
];

// 研究类型选项
export const RESEARCH_TYPE_OPTIONS: { label: string; value: ResearchType; description: string }[] = [
  { label: '新人群新场景新需求', value: '新人群新场景新需求', description: '特定人群研究' },
  { label: '现有人群未满足需求', value: '现有人群未满足需求', description: '品类需求扫描、人群细分、心智研究' },
  { label: '开发过程中的测评', value: '开发过程中的测评', description: '新品体验测评、概念测试' },
  { label: '上市后产品优化', value: '上市后产品优化', description: '老品回访' },
  { label: '其他专题研究', value: '其他专题研究', description: '' },
];

// 生成项目编号
let _projectNoCounter = 1000;
export const generateProjectNo = () => {
  _projectNoCounter += 1;
  const year = new Date().getFullYear();
  return `YY-${year}-${String(_projectNoCounter).padStart(4, '0')}`;
};

// 默认 AIField 工厂
export const defaultAIField = (mode: AIFieldMode = 'ai'): AIField => ({ mode, value: '' });

// 兼容旧代码（展平所有品类）
export const CATEGORY_OPTIONS = Object.values(BUSINESS_UNIT_CATEGORY_MAP).flat();

// ─── AI访谈洞察文件引用（跨页面共享）─────────────────────────────────
export interface AIInterviewFileRef {
  id: string;          // InterviewFile.id
  ftNo: string;        // e.g. 'FT101'
  filename: string;
  execType: '定性' | '定量';  // 只传定性/定量
  projectId: string;   // InterviewProject.projectId
  projectName: string;
}
