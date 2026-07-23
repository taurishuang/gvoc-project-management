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
export type SalesRegion =
  | '中国大陆'
  | '中国香港'
  | '中国澳门'
  | '中国台湾'
  | '美国'
  | '英国'
  | '德国'
  | '法国'
  | '日本'
  | '韩国'
  | '澳大利亚'
  | '加拿大'
  | '巴西'
  | '印度'
  | '俄罗斯'
  | '东南亚'
  | '中东'
  | '其他';

// 定性/定量/体验测评 详细字段
export interface QualitativeQuantitativeFields {
  executionMethod: string;       // 执行方法
  sampleSize: string;            // 样本量
  recruitmentConditions: string; // 招募条件简述
  sampleDistribution: string;    // 样本分布（地理位置等）
  rawRecordContent: string;      // 原始笔录内容
}

// 大数据 详细字段
export interface BigDataFields {
  dataSource: string;            // 数据源
  dataAcquisitionMethod: string; // 数据获取方式
  dataRangeAndCleaning: string;  // 数据范围及清洗规则
  dataVolume: string;            // 数据量
}

// 上传文件
export interface ProjectFile {
  uid: string;
  name: string;
  url?: string;
  size?: number;
  type?: string;
  status?: 'uploading' | 'done' | 'error';
}

// 项目数据模型
export interface Project {
  id: string;
  projectName: string;              // 项目名称
  salesRegion: SalesRegion[];       // 内外销（国家/地区，可多选）
  projectTime: string;              // 项目时间（年份）
  businessUnit: string;             // 所属事业部
  category: string;                 // 所属品类
  executionType: ExecutionType[];   // 项目执行类型（可多选）
  researchType: ResearchType;       // 项目研究类型

  // 执行类型详细字段 - 定性/定量/体验测评（多个执行类型共用）
  qualitativeFields?: QualitativeQuantitativeFields;

  // 执行类型详细字段 - 大数据
  bigDataFields?: BigDataFields;

  // 项目背景信息（列表展示字段）
  projectBackground: string;        // 项目背景
  projectPurpose: string;           // 项目目的
  mainConclusion: string;           // 主要结论/价值提炼
  followUpDirection: string;        // 该项目后续工作方向总结

  // 上传文件
  files: ProjectFile[];

  // 元数据
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// 表单数据类型（新增时使用）
export type ProjectFormData = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

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

// 所属品类选项（兼容旧代码，展平所有品类）
export const CATEGORY_OPTIONS = Object.values(BUSINESS_UNIT_CATEGORY_MAP).flat();

// 国家/地区选项（带分组）
export const SALES_REGION_OPTIONS: { label: string; value: SalesRegion; group: string }[] = [
  { label: '中国大陆', value: '中国大陆', group: '中国' },
  { label: '中国香港', value: '中国香港', group: '中国' },
  { label: '中国澳门', value: '中国澳门', group: '中国' },
  { label: '中国台湾', value: '中国台湾', group: '中国' },
  { label: '美国', value: '美国', group: '北美洲' },
  { label: '加拿大', value: '加拿大', group: '北美洲' },
  { label: '英国', value: '英国', group: '欧洲' },
  { label: '德国', value: '德国', group: '欧洲' },
  { label: '法国', value: '法国', group: '欧洲' },
  { label: '俄罗斯', value: '俄罗斯', group: '欧洲' },
  { label: '日本', value: '日本', group: '亚太' },
  { label: '韩国', value: '韩国', group: '亚太' },
  { label: '澳大利亚', value: '澳大利亚', group: '亚太' },
  { label: '东南亚', value: '东南亚', group: '亚太' },
  { label: '印度', value: '印度', group: '南亚' },
  { label: '巴西', value: '巴西', group: '南美洲' },
  { label: '中东', value: '中东', group: '中东' },
  { label: '其他', value: '其他', group: '其他' },
];

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
