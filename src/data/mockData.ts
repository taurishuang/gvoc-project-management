import type { Project } from '../types/project';

export const mockProjects: Project[] = [
  {
    id: '1',
    projectNo: 'YY-2024-1001',
    projectName: '2024年空调新人群需求洞察研究',
    salesRegion: ['中国大陆', '东南亚'],
    projectTime: '2024',
    businessUnit: '家用空调事业部',
    category: ['家用空调'],
    brand: ['Midea（美的）', 'COLMO'],
    researchType: '新人群新场景新需求',
    executionType: ['定性', '定量'],
    qualFields: {
      定性: {
        executionMethod: '焦点小组访谈（FGD）',
        sampleSize: '20人（4组，每组5人）',
        targetAudience: '18-35岁，Z世代，已购或计划购买空调',
        sampleDistribution: '北京10人，上海10人',
        recruitmentConditions: '18-35岁，已购或计划购买空调，居住一二线城市',
        rawRecordContent: '已完成4场FGD录音转录，共计80小时访谈记录',
      },
      定量: {
        executionMethod: '在线结构化问卷',
        sampleSize: '1200人',
        sampleDistribution: '北京、上海、广州、成都、武汉各240人',
        recruitmentConditions: '18-45岁，近1年内有空调购买意向',
        rawRecordContent: '1200份有效问卷，完成率92%',
      },
    },
    projectBackground: {
      mode: 'manual',
      value: '随着Z世代成为消费主力，传统空调功能诉求已无法满足年轻消费者的个性化需求，需深入了解新人群对空调的使用场景和功能期望。',
    },
    projectPurpose: {
      mode: 'manual',
      value: '1. 明确Z世代空调核心需求优先级；2. 识别未被满足的使用场景；3. 为新品开发提供方向指引',
    },
    mainConclusion: {
      mode: 'manual',
      value: '1. 年轻消费者更关注睡眠模式和噪音控制；2. 智能联动是重要差异化需求；3. 外观设计权重显著提升',
    },
    followUpDirection: {
      mode: 'manual',
      value: '建议研发团队重点投入睡眠优化技术和智能家居协议兼容性开发，同时启动外观设计专项研究',
    },
    files: [
      { uid: 'f1', name: '访谈指南V2.0.docx', type: 'application/msword', status: 'done', category: '定性' },
      { uid: 'f2', name: '定量问卷数据报告.xlsx', type: 'application/vnd.ms-excel', status: 'done', category: '定量' },
      { uid: 'f3', name: '项目最终报告PPT.pptx', type: 'application/vnd.ms-powerpoint', status: 'done', category: '综合' },
    ],
    createdAt: '2024-03-15T08:00:00Z',
    updatedAt: '2024-06-20T10:30:00Z',
    createdBy: '张研究员',
  },
  {
    id: '2',
    projectNo: 'YY-2024-1002',
    projectName: '美国市场冰箱产品竞品分析',
    salesRegion: ['美国', '加拿大'],
    projectTime: '2024',
    businessUnit: '冰箱事业部',
    category: ['家用冰箱'],
    brand: ['Midea（美的）', 'TOSHIBA（东芝）'],
    researchType: '现有人群未满足需求',
    executionType: ['大数据'],
    bigDataFields: {
      dataSource: 'Amazon评论数据、Best Buy用户评价、社交媒体Twitter/Reddit',
      dataAcquisitionMethod: '网络爬虫抓取 + API接口',
      dataRangeAndCleaning: '2022-2024年，过滤非英文内容、广告内容，去重处理',
      dataVolume: '约50万条评论数据',
    },
    projectBackground: {
      mode: 'ai',
      value: '美国冰箱市场竞争激烈，需要通过大数据分析了解消费者对竞品的评价，发现市场机会。',
    },
    projectPurpose: {
      mode: 'ai',
      value: '分析美国市场主要竞品优劣势，识别消费者痛点，为产品功能优化和市场策略提供数据支撑',
    },
    mainConclusion: {
      mode: 'ai',
      value: '1. 消费者最关注能耗和容量；2. 制冷效果和噪音是核心投诉点；3. 北美消费者对冰水机功能需求强烈',
    },
    followUpDirection: {
      mode: 'ai',
      value: '建议重点提升制冷系统稳定性，并将冰水机功能作为北美产品标配纳入研发计划',
    },
    files: [
      { uid: 'f4', name: '竞品大数据分析报告.pdf', type: 'application/pdf', status: 'done', category: '大数据' },
    ],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-04-05T14:20:00Z',
    createdBy: '李分析师',
  },
  {
    id: '3',
    projectNo: 'YY-2023-1003',
    projectName: '洗衣机新品概念测试',
    salesRegion: ['中国大陆'],
    projectTime: '2023',
    businessUnit: '洗衣机事业部',
    category: ['滚筒洗衣机'],
    brand: ['Little Swan（小天鹅）'],
    researchType: '开发过程中的测评',
    executionType: ['体验测评'],
    qualFields: {
      体验测评: {
        executionMethod: '中心位测试（CLT）+ 深度访谈',
        sampleSize: '60人',
        sampleDistribution: '上海30人，广州30人',
        recruitmentConditions: '25-45岁，家庭主要洗衣决策者，近3年内使用过滚筒洗衣机',
        rawRecordContent: '60份完整测评问卷 + 20份深度访谈录音',
      },
    },
    projectBackground: {
      mode: 'manual',
      value: '公司正在开发新一代大容量洗衣机，需要在量产前验证消费者对新功能和交互设计的接受度。',
    },
    projectPurpose: {
      mode: 'manual',
      value: '1. 验证蒸汽除菌功能的感知价值；2. 评估新操控界面的易用性；3. 测试定价敏感度',
    },
    mainConclusion: {
      mode: 'manual',
      value: '1. 蒸汽除菌功能获得82%消费者正向评价，是强势卖点；2. 新界面学习成本偏高，需简化；3. 建议售价区间3999-4599元',
    },
    followUpDirection: {
      mode: 'manual',
      value: '需针对操控界面进行二轮优化设计后再次测试，蒸汽功能可作为主要传播诉求',
    },
    files: [
      { uid: 'f5', name: '概念测试报告.pptx', type: 'application/vnd.ms-powerpoint', status: 'done', category: '体验测评' },
      { uid: 'f6', name: '测评现场照片.zip', type: 'application/zip', status: 'done', category: '综合' },
    ],
    createdAt: '2023-08-20T10:00:00Z',
    updatedAt: '2023-10-15T16:45:00Z',
    createdBy: '王研究员',
  },
];
