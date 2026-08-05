import React, { useState, useMemo, useEffect } from 'react';
import type { AIInterviewFileRef } from '../types/project';
import {
  Button,
  Input,
  Tag,
  Typography,
  Space,
  Modal,
  Descriptions,
  message,
  Select,
  Upload,
  Radio,
  Form,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  RightOutlined,
  DownOutlined,
  EyeOutlined,
  EditOutlined,
  ArrowRightOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';

const { Text, Title } = Typography;
const { Dragger } = Upload;

// ─── Types ──────────────────────────────────────────────────────────
type InterviewType = '定性' | '定量';
type InterviewStatus = '已完成' | '进行中' | '待开始';

interface InterviewFile {
  id: string;
  ftNo: string;
  filename: string;
  category: string;
  type: InterviewType;
  creator: string;       // 姓名
  creatorId: string;
  updatedAt: string;
  duration: string;
  status: InterviewStatus;
  outline?: string;
  speakers: string[];    // 访谈人员姓名列表（头像数量=人员数量）
}

interface InterviewProject {
  id: string;
  projectId: string;     // 与用研体验项目同一ID
  projectName: string;
  year: string;
  category: string;
  types: InterviewType[];
  creator: string;
  creatorId: string;
  updatedAt: string;
  duration: string;
  status: InterviewStatus;
  outline?: string;      // 项目统一访谈提纲（唯一）
  interviews: InterviewFile[];
}

// ─── Mock Data ─── projectId 与 mockProjects 中 projectNo 对齐 ────────
// 用研体验项目中的ID: 1→YY-2024-1001, 2→YY-2024-1002, 3→YY-2023-1003
// AI访谈页仅展示含定性/定量的项目
const MOCK_PROJECTS: InterviewProject[] = [
  {
    id: 'p1',
    projectId: 'YY-2024-1001',
    projectName: '2024年空调新人群需求洞察研究',
    year: '2024',
    category: '家用空调',
    types: ['定性', '定量'],
    creator: '张研究员',
    creatorId: 'zhangyj',
    updatedAt: '2024-06-20 10:30:00',
    duration: '80:00',
    status: '已完成',
    outline: 'Z世代空调使用访谈提纲V2.0',
    interviews: [
      {
        id: 'ft101',
        ftNo: 'FT101',
        filename: '访谈指南V2.0.docx',
        category: '家用空调',
        type: '定性',
        creator: '张研究员',
        creatorId: 'zhangyj',
        updatedAt: '2024-06-18 09:00:00',
        duration: '42:30',
        status: '已完成',
        outline: 'Z世代空调使用访谈提纲V2.0',
        speakers: ['程芳', '用户A'],
      },
      {
        id: 'ft102',
        ftNo: 'FT102',
        filename: '定量问卷数据报告.xlsx',
        category: '家用空调',
        type: '定量',
        creator: '张研究员',
        creatorId: 'zhangyj',
        updatedAt: '2024-06-20 10:00:00',
        duration: '0:00',
        status: '已完成',
        outline: '空调需求定量调研问卷',
        speakers: ['张研究员'],
      },
    ],
  },
  {
    id: 'p3',
    projectId: 'YY-2023-1003',
    projectName: '洗衣机新品概念测试',
    year: '2023',
    category: '滚筒洗衣机',
    types: ['定性'],
    creator: '王研究员',
    creatorId: 'wangyj',
    updatedAt: '2023-10-15 16:45:00',
    duration: '60:00',
    status: '已完成',
    outline: '洗衣机概念测试访谈提纲',
    interviews: [
      {
        id: 'ft201',
        ftNo: 'FT201',
        filename: '概念测试_深访_上海01.docx',
        category: '滚筒洗衣机',
        type: '定性',
        creator: '王研究员',
        creatorId: 'wangyj',
        updatedAt: '2023-10-12 14:00:00',
        duration: '–',
        status: '已完成',
        outline: '洗衣机概念测试访谈提纲',
        speakers: ['李明'],
      },
      {
        id: 'ft202',
        ftNo: 'FT202',
        filename: '概念测试_深访_广州01.docx',
        category: '滚筒洗衣机',
        type: '定性',
        creator: '王研究员',
        creatorId: 'wangyj',
        updatedAt: '2023-10-13 10:30:00',
        duration: '–',
        status: '已完成',
        outline: '洗衣机概念测试访谈提纲',
        speakers: ['陈梅', '用户B'],
      },
      {
        id: 'ft203',
        ftNo: 'FT203',
        filename: '概念测试_深访_上海02.docx',
        category: '滚筒洗衣机',
        type: '定性',
        creator: '王研究员',
        creatorId: 'wangyj',
        updatedAt: '2023-10-14 16:20:00',
        duration: '–',
        status: '已完成',
        outline: '洗衣机概念测试访谈提纲',
        speakers: ['刘芳', '赵磊', '用户C'],
      },
    ],
  },
  // 额外演示数据
  {
    id: 'pd43',
    projectId: 'YY-2022-0043',
    projectName: '22年 壁挂式美妆冰箱 创新项目',
    year: '2022',
    category: '冰箱',
    types: ['定性'],
    creator: '罗艺青',
    creatorId: 'luoyq9',
    updatedAt: '2026-07-29 05:10:00',
    duration: '0:00',
    status: '已完成',
    outline: '美妆冰箱用户访谈提纲V2.0',
    interviews: [
      {
        id: 'ft445',
        ftNo: 'FT445',
        filename: '美妆冰箱 彭叶玲.docx',
        category: '冰箱',
        type: '定性',
        creator: '罗艺青',
        creatorId: 'luoyq9',
        updatedAt: '2026-07-28 16:35:00',
        duration: '–',
        status: '已完成',
        outline: '美妆冰箱用户访谈提纲V2.0',
        speakers: ['彭叶玲'],
      },
      {
        id: 'ft444',
        ftNo: 'FT444',
        filename: '美妆冰箱 陈娟.doc',
        category: '冰箱',
        type: '定性',
        creator: '罗艺青',
        creatorId: 'luoyq9',
        updatedAt: '2026-07-28 16:15:00',
        duration: '–',
        status: '已完成',
        outline: '美妆冰箱用户访谈提纲V2.0',
        speakers: ['陈娟'],
      },
      {
        id: 'ft443',
        ftNo: 'FT443',
        filename: '甘丽.docx',
        category: '冰箱',
        type: '定性',
        creator: '罗艺青',
        creatorId: 'luoyq9',
        updatedAt: '2026-07-28 16:00:00',
        duration: '–',
        status: '已完成',
        outline: '美妆冰箱用户访谈提纲V2.0',
        speakers: ['甘丽'],
      },
      {
        id: 'ft442',
        ftNo: 'FT442',
        filename: '美妆冰箱 汪佳丽.docx',
        category: '冰箱',
        type: '定性',
        creator: '罗艺青',
        creatorId: 'luoyq9',
        updatedAt: '2026-07-28 15:40:00',
        duration: '–',
        status: '已完成',
        outline: '美妆冰箱用户访谈提纲V2.0',
        speakers: ['汪佳丽'],
      },
    ],
  },
  {
    id: 'pd36',
    projectId: 'YY-2026-0036',
    projectName: '风管机购买项目',
    year: '2026',
    category: '家用',
    types: ['定性', '定量'],
    creator: '李欣',
    creatorId: 'lixin',
    updatedAt: '2026-07-28 15:53:19',
    duration: '0:00',
    status: '已完成',
    outline: '风管机购买决策访谈提纲',
    interviews: [
      {
        id: 'ft439',
        ftNo: 'FT439',
        filename: '风管机购买决策_用户访谈01.docx',
        category: '家用',
        type: '定性',
        creator: '李欣',
        creatorId: 'lixin',
        updatedAt: '2026-07-28 15:00:00',
        duration: '–',
        status: '已完成',
        outline: '风管机购买决策访谈提纲',
        speakers: ['王雷', '用户D'],
      },
      {
        id: 'ft438',
        ftNo: 'FT438',
        filename: '风管机购买意向_问卷汇总.xlsx',
        category: '家用',
        type: '定量',
        creator: '李欣',
        creatorId: 'lixin',
        updatedAt: '2026-07-27 11:30:00',
        duration: '0:00',
        status: '已完成',
        outline: '风管机购买意向定量问卷',
        speakers: ['李欣'],
      },
    ],
  },
  {
    id: 'pd40',
    projectId: 'YY-2024-0040',
    projectName: '2024年护理柜CDOC',
    year: '2024',
    category: '洗衣机',
    types: ['定量'],
    creator: '金玲',
    creatorId: 'jinling9',
    updatedAt: '2026-07-27 21:25:01',
    duration: '0:00',
    status: '已完成',
    outline: '护理柜用户需求定量调研',
    interviews: [
      {
        id: 'ft436',
        ftNo: 'FT436',
        filename: '护理柜CDOC_用户需求_问卷.xlsx',
        category: '洗衣机',
        type: '定量',
        creator: '金玲',
        creatorId: 'jinling9',
        updatedAt: '2026-07-27 21:00:00',
        duration: '0:00',
        status: '已完成',
        outline: '护理柜用户需求定量调研',
        speakers: ['金玲'],
      },
    ],
  },
];

// ─── 颜色配置 ────────────────────────────────────────────────────────
const TYPE_STYLE: Record<InterviewType, { bg: string; color: string; border: string }> = {
  定性: { bg: '#e8f4ff', color: '#1677ff', border: '#91caff' },
  定量: { bg: '#f0f5ff', color: '#4B5EE4', border: '#adc6ff' },
};

// ─── 说话人头像（姓名缩写，圆形）────────────────────────────────────
const SpeakerAvatar: React.FC<{ name: string }> = ({ name }) => {
  // 取姓名前1-2字作缩写
  const abbr = name.length >= 2 ? name.slice(0, 2) : name;
  // 根据首字确定颜色
  const colors = [
    ['#e8f4ff', '#1677ff'],
    ['#f9f0ff', '#722ed1'],
    ['#fff7e6', '#fa8c16'],
    ['#f6ffed', '#52c41a'],
    ['#fff1f0', '#f5222d'],
    ['#e6fffb', '#13c2c2'],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const [bg, color] = colors[idx];
  return (
    <div
      style={{
        width: 28, height: 28, borderRadius: '50%',
        background: bg, border: `1.5px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color, fontWeight: 700, flexShrink: 0,
        letterSpacing: 0,
      }}
    >
      {abbr}
    </div>
  );
};

// Creator cell (name + id text only)
const CreatorCell: React.FC<{ name: string; id: string }> = ({ name, id }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <span style={{ fontSize: 13, color: '#1a1a2e', whiteSpace: 'nowrap' }}>
      {name}
      <span style={{ color: '#8c8c8c', fontSize: 11 }}>({id})</span>
    </span>
  </div>
);

// ─── Type tag: 只显示「定性」/「定量」文字，简洁pill ────────────────
const TypeTag: React.FC<{ type: InterviewType }> = ({ type }) => {
  const s = TYPE_STYLE[type];
  return (
    <span
      style={{
        display: 'inline-block',
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 12,
        fontSize: 11, padding: '1px 8px',
        fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap',
      }}
    >
      {type}
    </span>
  );
};

// Category tag
const CatTag: React.FC<{ label: string }> = ({ label }) => (
  <Tag
    style={{
      background: '#f0f5ff', color: '#1677ff', border: '1px solid #adc6ff',
      borderRadius: 4, fontSize: 11, margin: 0, padding: '0 6px', flexShrink: 0,
    }}
  >
    {label}
  </Tag>
);

// ─── Column widths ───────────────────────────────────────────────────
const COL = {
  creator: 200,
  updatedAt: 170,
  duration: 80,
  status: 80,
  action: 110,
};

// Table header
const TableHeader: React.FC = () => (
  <div
    style={{
      display: 'flex', alignItems: 'center',
      padding: '10px 16px',
      background: '#f8fafc',
      borderBottom: '1px solid #e8ecf0',
      fontSize: 13, color: '#6b7280', fontWeight: 500,
      userSelect: 'none',
      position: 'sticky', top: 0, zIndex: 10,
    }}
  >
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
      项目/任务名称/数量
      <span style={{ color: '#bfbfbf', fontSize: 11 }}>●</span>
    </div>
    <div style={{ width: COL.creator, flexShrink: 0 }}>创建人 ↑</div>
    <div style={{ width: COL.updatedAt, flexShrink: 0 }}>更新时间 ↕</div>
    <div style={{ width: COL.duration, flexShrink: 0 }}>时长(分) ↕</div>
    <div style={{ width: COL.status, flexShrink: 0 }}>状态 ▼</div>
    <div style={{ width: COL.action, flexShrink: 0 }}>操作</div>
  </div>
);

// Status cell
const StatusCell: React.FC<{ status: InterviewStatus }> = ({ status }) => (
  <span style={{ fontSize: 12, color: status === '已完成' ? '#52c41a' : status === '进行中' ? '#1677ff' : '#8c8c8c' }}>
    {status}
    {status === '已完成' && <span style={{ marginLeft: 3 }}>◻</span>}
  </span>
);

// ─── Interview file row ───────────────────────────────────────────────
const InterviewRow: React.FC<{
  file: InterviewFile;
  onView: (f: InterviewFile) => void;
  onDelete: (id: string) => void;
}> = ({ file, onView, onDelete }) => (
  <div
    style={{
      display: 'flex', alignItems: 'center',
      padding: '8px 16px',
      borderBottom: '1px solid #f5f5f5',
      background: '#fafeff',
      fontSize: 13,
      transition: 'background 0.12s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
    onMouseLeave={e => (e.currentTarget.style.background = '#fafeff')}
  >
    {/* name col — indent + ftNo + filename + speaker avatars */}
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, paddingLeft: 28 }}>
      <FileTextOutlined style={{ color: '#1677ff', fontSize: 13, flexShrink: 0 }} />
      <span style={{ color: '#1677ff', fontWeight: 500, flexShrink: 0, fontSize: 12, whiteSpace: 'nowrap' }}>
        {file.ftNo}
      </span>
      {/* filename + speaker avatars inline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
        <span
          style={{
            color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', fontSize: 13, flexShrink: 1,
          }}
        >
          {file.filename}
        </span>
        {/* Speaker avatars: one per speaker, stacked with negative margin, right after filename */}
        {file.speakers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {file.speakers.map((name, i) => (
              <div key={name} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                <SpeakerAvatar name={name} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    {/* creator */}
    <div style={{ width: COL.creator, flexShrink: 0 }}>
      <CreatorCell name={file.creator} id={file.creatorId} />
    </div>
    {/* updatedAt */}
    <div style={{ width: COL.updatedAt, flexShrink: 0, fontSize: 12, color: '#595959' }}>
      {file.updatedAt}
    </div>
    {/* duration */}
    <div style={{ width: COL.duration, flexShrink: 0, fontSize: 12, color: '#595959' }}>
      {file.duration}
    </div>
    {/* status */}
    <div style={{ width: COL.status, flexShrink: 0 }}>
      <StatusCell status={file.status} />
    </div>
    {/* action */}
    <div style={{ width: COL.action, flexShrink: 0 }}>
      <Space size={0}>
        <Button type="link" size="small" style={{ padding: '0 6px', fontSize: 12 }} onClick={() => onView(file)}>查看</Button>
        <Button type="link" size="small" danger style={{ padding: '0 6px', fontSize: 12 }} onClick={() => onDelete(file.id)}>删除</Button>
      </Space>
    </div>
  </div>
);

// ─── Project row ─────────────────────────────────────────────────────
const ProjectRowItem: React.FC<{
  project: InterviewProject;
  onViewProject: (p: InterviewProject) => void;
  onInfoProject: (p: InterviewProject) => void;
  onEditProject: (p: InterviewProject) => void;
  onViewInterview: (f: InterviewFile) => void;
  onDeleteInterview: (id: string) => void;
}> = ({ project, onViewProject, onInfoProject, onEditProject, onViewInterview, onDeleteInterview }) => {
  const [expanded, setExpanded] = useState(false);
  const count = project.interviews.length;

  return (
    <div style={{ borderBottom: '1px solid #f0f0f0' }}>
      {/* Project header */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 16px',
          background: expanded ? '#f8faff' : '#fff',
          cursor: 'pointer',
          fontSize: 13,
          transition: 'background 0.12s',
          userSelect: 'none',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = '#fafafa'; }}
        onMouseLeave={e => { e.currentTarget.style.background = expanded ? '#f8faff' : '#fff'; }}
      >
        {/* name col */}
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
          onClick={() => setExpanded(e => !e)}
        >
          <span style={{ color: '#8c8c8c', fontSize: 11, width: 12, flexShrink: 0 }}>
            {expanded ? <DownOutlined /> : <RightOutlined />}
          </span>
          <span style={{ color: '#1a1a2e', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); onInfoProject(project); }}
            title="点击查看项目详情"
          >
            {project.projectName}
            <span style={{ color: '#8c8c8c', fontWeight: 400, marginLeft: 4 }}>（{count}份）</span>
          </span>
          <CatTag label={project.category} />
          <span style={{ color: '#8c8c8c', fontSize: 12, flexShrink: 0, whiteSpace: 'nowrap' }}>
            项目ID:{project.projectId}
          </span>
          {/* 项目可有多个类型 tag */}
          {project.types.map(t => <TypeTag key={t} type={t} />)}
        </div>
        {/* creator */}
        <div style={{ width: COL.creator, flexShrink: 0 }}>
          <CreatorCell name={project.creator} id={project.creatorId} />
        </div>
        {/* updatedAt */}
        <div style={{ width: COL.updatedAt, flexShrink: 0, fontSize: 12, color: '#595959' }}>
          {project.updatedAt}
        </div>
        {/* duration */}
        <div style={{ width: COL.duration, flexShrink: 0, fontSize: 12, color: '#595959' }}>
          {project.duration}
        </div>
        {/* status */}
        <div style={{ width: COL.status, flexShrink: 0 }}>
          <StatusCell status={project.status} />
        </div>
        {/* action */}
        <div style={{ width: COL.action, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <Space size={0}>
            <Button type="link" size="small" style={{ padding: '0 6px', fontSize: 12 }} onClick={() => onViewProject(project)}>查看</Button>
            <Button type="link" size="small" style={{ padding: '0 6px', fontSize: 12 }} onClick={() => onEditProject(project)}>编辑</Button>
          </Space>
        </div>
      </div>

      {expanded && project.interviews.map(f => (
        <InterviewRow
          key={f.id}
          file={f}
          onView={onViewInterview}
          onDelete={onDeleteInterview}
        />
      ))}
    </div>
  );
};

// ─── 导入访谈弹窗 ──────────────────────────────────────────────────────
type ImportMode = 'project' | 'interview';
type UploadMode = 'audio' | 'text';
type ProjectLinkMode = 'existing' | 'new' | 'none';

// 音视频扩展名判断
const isAudioFile = (filename: string) => /\.(mp3|wav|m4a|aac|avi|mov|mp4|flac|ogg)$/i.test(filename);

// 访谈提纲选项（全局复用）
const OUTLINE_OPTIONS = [
  { label: '美妆冰箱用户访谈提纲V2.0', value: 'outline1' },
  { label: 'Z世代空调使用访谈提纲V2.0', value: 'outline2' },
  { label: '洗衣机概念测试访谈提纲', value: 'outline3' },
  { label: '风管机购买决策访谈提纲', value: 'outline4' },
];

// 音频语言（含粤语）；文本语言（不含粤语）
const AUDIO_LANGUAGE_OPTIONS = [
  { label: '中文(普通话)', value: 'zh-CN' },
  { label: '中文(粤语)', value: 'zh-HK' },
  { label: 'English', value: 'en' },
];
const TEXT_LANGUAGE_OPTIONS = [
  { label: '中文(普通话)', value: 'zh-CN' },
  { label: 'English', value: 'en' },
];

const SPEAKER_OPTIONS = [
  { label: '自动识别', value: 'auto' },
  { label: '1人', value: '1' },
  { label: '2人', value: '2' },
  { label: '3人及以上', value: '3+' },
];

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    mode: ImportMode;
    projectId?: string;
    projectOutline?: string;
    projectLanguage?: string;
    fileConfigs?: Record<string, { speakerCount: string }>;
    uploadMode?: UploadMode;
    files?: UploadFile[];
    language?: string;
    speakerCount?: string;
    outline?: string;
    interviewType?: string;
    projectLinkMode?: ProjectLinkMode;
    relatedProject?: string;
    newProjectName?: string;
  }) => void;
  projectOptions: { label: string; value: string }[];
}

const ImportModal: React.FC<ImportModalProps> = ({ open, onClose, onSubmit, projectOptions }) => {
  // ── 顶层模式 ──
  const [importMode, setImportMode] = useState<ImportMode>('project');

  // ── 按项目洞察 ──
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [projectOutline, setProjectOutline] = useState<string | undefined>();
  const [projectLanguage, setProjectLanguage] = useState('zh-CN'); // 统一语言
  // 每文件仅存 speakerCount（语言统一，提纲统一）
  const [fileConfigs, setFileConfigs] = useState<Record<string, { speakerCount: string }>>({});

  const updateFileConfig = (fileId: string, patch: Partial<{ speakerCount: string }>) => {
    setFileConfigs(prev => {
      const existing = prev[fileId] ?? { speakerCount: 'auto' };
      return { ...prev, [fileId]: { ...existing, ...patch } };
    });
  };

  // ── 按访谈洞察 ──
  const [uploadMode, setUploadMode] = useState<UploadMode>('audio');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [language, setLanguage] = useState('zh-CN');
  const [speakerCount, setSpeakerCount] = useState('auto'); // 音频说话人数量
  const [outline, setOutline] = useState<string | undefined>();
  const [interviewType, setInterviewType] = useState<string>('定性');
  // 关联项目
  const [projectLinkMode, setProjectLinkMode] = useState<ProjectLinkMode>('none');
  const [relatedProject, setRelatedProject] = useState<string | undefined>();
  const [newProjectName, setNewProjectName] = useState('');

  // 同步文件列表（按项目模式）
  const syncedFiles = useMemo(() => {
    if (importMode !== 'project' || !selectedProject) return [];
    const proj = MOCK_PROJECTS.find(p => p.projectId === selectedProject);
    if (!proj) return [];
    return proj.interviews.filter(f => f.type === '定性' || f.type === '定量');
  }, [importMode, selectedProject]);

  // 文本模式：定量只能上传1份，超出时截断
  const handleTextBeforeUpload = (file: Parameters<NonNullable<React.ComponentProps<typeof Dragger>['beforeUpload']>>[0]) => {
    const newFile = { uid: file.uid, name: file.name, status: 'done' as const, size: file.size, type: file.type, originFileObj: file };
    if (interviewType === '定量') {
      setFileList([newFile]); // 定量：替换，只保留1份
    } else {
      setFileList(prev => [...prev, newFile]);
    }
    return false;
  };

  const reset = () => {
    setImportMode('project');
    setSelectedProject(undefined);
    setProjectOutline(undefined);
    setProjectLanguage('zh-CN');
    setFileConfigs({});
    setUploadMode('audio');
    setFileList([]);
    setLanguage('zh-CN');
    setSpeakerCount('auto');
    setOutline(undefined);
    setInterviewType('定性');
    setProjectLinkMode('none');
    setRelatedProject(undefined);
    setNewProjectName('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    onSubmit({
      mode: importMode,
      projectId: selectedProject,
      projectOutline,
      projectLanguage,
      fileConfigs,
      uploadMode,
      files: fileList,
      language,
      speakerCount,
      outline,
      interviewType,
      projectLinkMode,
      relatedProject,
      newProjectName,
    });
    reset();
    onClose();
  };

  // 文本语言选项（按 uploadMode 区分，保留供后续扩展）
  // const langOptions = uploadMode === 'audio' ? AUDIO_LANGUAGE_OPTIONS : TEXT_LANGUAGE_OPTIONS;

  return (
    <Modal
      open={open}
      title={<span style={{ fontSize: 16, fontWeight: 600 }}>AI访谈洞察</span>}
      onCancel={handleClose}
      width={700}
      footer={null}
      destroyOnClose
    >
      {/* ── 顶层模式切换 ── */}
      <div style={{ marginBottom: 20 }}>
        <Radio.Group
          value={importMode}
          onChange={e => setImportMode(e.target.value)}
          style={{ display: 'flex', gap: 0 }}
        >
          <Radio.Button
            value="project"
            style={{ flex: 1, textAlign: 'center', borderRadius: '6px 0 0 6px', fontWeight: importMode === 'project' ? 600 : 400 }}
          >
            按项目导入
          </Radio.Button>
          <Radio.Button
            value="interview"
            style={{ flex: 1, textAlign: 'center', borderRadius: '0 6px 6px 0', fontWeight: importMode === 'interview' ? 600 : 400 }}
          >
            按访谈导入
          </Radio.Button>
        </Radio.Group>
      </div>

      {/* ════════════════════════════════════
          按项目洞察导入
          ════════════════════════════════════ */}
      {importMode === 'project' && (
        <div>
          <Form layout="vertical">
            {/* 选择项目 */}
            <Form.Item label={<span><span style={{ color: '#ff4d4f', marginRight: 3 }}>*</span>选择项目</span>} style={{ marginBottom: 12 }}>
              <Select
                placeholder="请选择已有项目（自动同步定性+定量文件）"
                style={{ width: '100%' }}
                value={selectedProject}
                onChange={v => { setSelectedProject(v); setFileConfigs({}); }}
                options={projectOptions}
                showSearch
                filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>

            {selectedProject && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                {/* 访谈提纲：整个项目统一 */}
                <Form.Item
                  label={<span><span style={{ color: '#ff4d4f', marginRight: 3 }}>*</span>访谈提纲（整个项目统一）</span>}
                  style={{ marginBottom: 12 }}
                >
                  <Select
                    placeholder="请选择访谈提纲"
                    value={projectOutline}
                    onChange={setProjectOutline}
                    style={{ width: '100%' }}
                    options={OUTLINE_OPTIONS}
                  />
                </Form.Item>
                {/* 文件语言：整个项目统一 */}
                <Form.Item
                  label={<span>文件语言（整个项目统一）</span>}
                  style={{ marginBottom: 12 }}
                >
                  <Select
                    value={projectLanguage}
                    onChange={setProjectLanguage}
                    style={{ width: '100%' }}
                    options={TEXT_LANGUAGE_OPTIONS}
                  />
                </Form.Item>
              </div>
            )}
          </Form>

          {/* 同步文件列表 */}
          {selectedProject && syncedFiles.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 13, color: '#595959', marginBottom: 8 }}>
                已自动同步 <span style={{ color: '#1677ff', fontWeight: 600 }}>{syncedFiles.length}</span> 个定性/定量访谈文件
                {syncedFiles.some(f => isAudioFile(f.filename)) && '，音视频文件请配置说话人数量'}：
              </div>
              <div style={{ border: '1px solid #e8ecf0', borderRadius: 8, overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                {/* 表头 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', background: '#f8fafc',
                  borderBottom: '1px solid #e8ecf0',
                  fontSize: 12, color: '#6b7280', fontWeight: 500,
                }}>
                  <span style={{ flex: 1 }}>文件</span>
                  <span style={{ width: 110, flexShrink: 0 }}>说话人数量</span>
                </div>
                {syncedFiles.map((f, i) => {
                  const cfg = fileConfigs[f.id] ?? { speakerCount: 'auto' };
                  const audio = isAudioFile(f.filename);
                  return (
                    <div
                      key={f.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px',
                        borderBottom: i < syncedFiles.length - 1 ? '1px solid #f0f0f0' : 'none',
                        background: i % 2 === 0 ? '#fff' : '#fafafa',
                      }}
                    >
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <FileTextOutlined style={{ color: '#1677ff', fontSize: 12, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#1677ff', fontWeight: 500, flexShrink: 0 }}>{f.ftNo}</span>
                        <span style={{ fontSize: 12, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {f.filename}
                        </span>
                        <TypeTag type={f.type} />
                      </div>
                      {/* 说话人数量：仅音视频 */}
                      {audio ? (
                        <Select
                          size="small"
                          value={cfg.speakerCount}
                          onChange={v => updateFileConfig(f.id, { speakerCount: v })}
                          style={{ width: 110, flexShrink: 0 }}
                          options={SPEAKER_OPTIONS}
                        />
                      ) : (
                        <span style={{ width: 110, flexShrink: 0, fontSize: 12, color: '#bfbfbf', paddingLeft: 4 }}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedProject && syncedFiles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#bfbfbf', fontSize: 13 }}>
              该项目暂无定性/定量访谈文件
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════
          按访谈洞察导入
          ════════════════════════════════════ */}
      {importMode === 'interview' && (
        <div>
          {/* Audio / Text tab */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            {(['audio', 'text'] as UploadMode[]).map(m => (
              <div
                key={m}
                onClick={() => {
                  setUploadMode(m);
                  setInterviewType('定性');
                  setFileList([]);
                  // 文本切到音频时重置语言到普通话（粤语不在文本选项里）
                  setLanguage('zh-CN');
                }}
                style={{
                  padding: '6px 20px', cursor: 'pointer', fontSize: 13,
                  fontWeight: uploadMode === m ? 600 : 400,
                  color: uploadMode === m ? '#1677ff' : '#595959',
                  borderBottom: uploadMode === m ? '2px solid #1677ff' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'audio' ? '导入音频' : '导入文本'}
              </div>
            ))}
          </div>

          {/* ── 音频 tab ── */}
          {uploadMode === 'audio' && (
            <div>
              {/* 筛选条件优先展示（在上传区上方）顺序：访谈类型 → 语言 → 提纲 → 说话人数量 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 14 }}>
                <Form.Item label={<span style={{ fontSize: 13 }}>访谈类型</span>} style={{ margin: 0 }}>
                  <div style={{
                    height: 32, display: 'flex', alignItems: 'center',
                    padding: '0 11px', background: '#f5f5f5', borderRadius: 6,
                    border: '1px solid #d9d9d9', color: '#8c8c8c', fontSize: 13,
                  }}>
                    定性（音频固定）
                  </div>
                </Form.Item>
                <Form.Item label={<span style={{ fontSize: 13 }}>音频语言</span>} style={{ margin: 0 }}>
                  <Select value={language} onChange={setLanguage} style={{ width: '100%' }} options={AUDIO_LANGUAGE_OPTIONS} />
                </Form.Item>
                <Form.Item label={<span style={{ fontSize: 13 }}><span style={{ color: '#ff4d4f', marginRight: 2 }}>*</span>访谈提纲</span>} style={{ margin: 0 }}>
                  <Select placeholder="请选择访谈提纲" value={outline} onChange={setOutline} style={{ width: '100%' }} options={OUTLINE_OPTIONS} />
                </Form.Item>
                <Form.Item label={<span style={{ fontSize: 13 }}>说话人数量</span>} style={{ margin: 0 }}>
                  <Select value={speakerCount} onChange={setSpeakerCount} style={{ width: '100%' }} options={SPEAKER_OPTIONS} />
                </Form.Item>
              </div>

              {/* 上传区 */}
              <Dragger
                fileList={fileList}
                multiple
                accept=".mp3,.wav,.m4a,.aac,.avi,.mov"
                beforeUpload={file => {
                  setFileList(prev => [...prev, { uid: file.uid, name: file.name, status: 'done', size: file.size, type: file.type, originFileObj: file }]);
                  return false;
                }}
                onRemove={file => setFileList(prev => prev.filter(f => f.uid !== file.uid))}
              >
                <div style={{ padding: '20px 0' }}>
                  <CloudUploadOutlined style={{ fontSize: 32, color: '#1677ff', marginBottom: 6 }} />
                  <p style={{ fontSize: 13, color: '#1a1a2e', marginBottom: 4 }}>点击或拖拽文件到此区域以上传</p>
                  <p style={{ fontSize: 12, color: '#8c8c8c', margin: 0 }}>
                    大小限制800m，时长为3小时内，支持MP3、WAV、M4A、ACC、AVI、MOV等格式，同一批最多支持上传20份
                  </p>
                </div>
              </Dragger>
            </div>
          )}

          {/* ── 文本 tab ── */}
          {uploadMode === 'text' && (
            <div>
              {/* 访谈类型 + 语言 + 提纲 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 12 }}>
                <Form.Item label={<span style={{ fontSize: 13 }}>访谈类型</span>} style={{ margin: 0 }}>
                  <Select
                    value={interviewType}
                    onChange={v => { setInterviewType(v); setFileList([]); }}
                    style={{ width: '100%' }}
                    options={[
                      { label: '定性', value: '定性' },
                      { label: '定量', value: '定量' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label={<span style={{ fontSize: 13 }}>文本语言</span>} style={{ margin: 0 }}>
                  <Select value={language} onChange={setLanguage} style={{ width: '100%' }} options={TEXT_LANGUAGE_OPTIONS} />
                </Form.Item>
                <Form.Item
                  label={<span style={{ fontSize: 13 }}><span style={{ color: '#ff4d4f', marginRight: 2 }}>*</span>访谈提纲</span>}
                  style={{ margin: 0 }}
                >
                  <Select placeholder="请选择访谈提纲" value={outline} onChange={setOutline} style={{ width: '100%' }} options={OUTLINE_OPTIONS} />
                </Form.Item>
              </div>

              {/* 上传区 */}
              <Dragger
                fileList={fileList}
                multiple={interviewType === '定性'}
                maxCount={interviewType === '定量' ? 1 : undefined}
                accept=".doc,.docx,.txt,.xls,.xlsx"
                beforeUpload={handleTextBeforeUpload}
                onRemove={file => setFileList(prev => prev.filter(f => f.uid !== file.uid))}
                style={{ marginBottom: 6 }}
              >
                <div style={{ padding: '20px 0' }}>
                  <CloudUploadOutlined style={{ fontSize: 32, color: '#1677ff', marginBottom: 6 }} />
                  <p style={{ fontSize: 13, color: '#1a1a2e', marginBottom: 4 }}>点击或拖拽文件到此区域以上传</p>
                  <p style={{ fontSize: 12, color: '#8c8c8c', margin: 0 }}>
                    {interviewType === '定量'
                      ? '定量文件仅支持上传1份 · 支持 xls、xlsx、doc、docx、txt 格式，大小限制100m'
                      : '定性支持上传多份 · 支持 doc、docx、txt 格式，同一批最多20份，大小限制100m'}
                  </p>
                </div>
              </Dragger>
              {interviewType === '定量' && fileList.length > 0 && (
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8, textAlign: 'right' }}>
                  已上传 1 份定量文件（如需替换请先删除当前文件）
                </div>
              )}

              {/* 下载模板 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                <Button size="small" icon={<DownloadOutlined />} style={{ fontSize: 12 }}>下载模板</Button>
              </div>
            </div>
          )}

          {/* 关联项目 */}
          <Divider style={{ margin: '12px 0 10px' }} />
          <div style={{ fontSize: 13, color: '#595959', marginBottom: 10, fontWeight: 500 }}>导入后关联项目</div>
          <Radio.Group
            value={projectLinkMode}
            onChange={e => { setProjectLinkMode(e.target.value); setRelatedProject(undefined); setNewProjectName(''); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}
          >
            <Radio value="none" style={{ fontSize: 13 }}>暂不关联</Radio>
            <Radio value="existing" style={{ fontSize: 13 }}>关联已有项目</Radio>
            <Radio value="new" style={{ fontSize: 13 }}>新增项目</Radio>
          </Radio.Group>

          {projectLinkMode === 'existing' && (
            <Select
              placeholder="请选择已有项目"
              value={relatedProject}
              onChange={setRelatedProject}
              style={{ width: '100%', marginBottom: 4 }}
              options={projectOptions}
              allowClear showSearch
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          )}
          {projectLinkMode === 'new' && (
            <Input
              placeholder="请输入新项目名称"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              style={{ width: '100%', marginBottom: 4 }}
            />
          )}
        </div>
      )}

      <Divider style={{ margin: '16px 0 12px' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={handleClose}>取消</Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          disabled={importMode === 'project' ? !selectedProject : false}
        >
          提交
        </Button>
      </div>
    </Modal>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────
interface AIInterviewPageProps {
  onBack: () => void;
  onSyncToProjectList?: (
    action: 'addFile' | 'addProject',
    payload: {
      projectNo?: string;
      filename?: string;
      fileType?: string;
      executionType?: string;
      newProjectName?: string;
      newProjectYear?: string;
      newProjectCategory?: string;
      newExecutionTypes?: string[];
      newOutline?: string;
    }
  ) => void;
  onFilesChange?: (files: AIInterviewFileRef[]) => void;
}

const AIInterviewPage: React.FC<AIInterviewPageProps> = ({ onBack, onSyncToProjectList, onFilesChange }) => {
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [projects, setProjects] = useState<InterviewProject[]>(MOCK_PROJECTS);
  const [viewModal, setViewModal] = useState<{ open: boolean; interview: InterviewFile | null }>({ open: false, interview: null });
  const [viewProjectModal, setViewProjectModal] = useState<{ open: boolean; project: InterviewProject | null }>({ open: false, project: null });
  const [editProjectModal, setEditProjectModal] = useState<{ open: boolean; project: InterviewProject | null }>({ open: false, project: null });
  const [importOpen, setImportOpen] = useState(false);
  // 报告详情全屏展示
  const [reportProject, setReportProject] = useState<InterviewProject | null>(null);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const projectOptions = useMemo(
    () => projects.map(p => ({ label: `${p.projectName}（${p.projectId}）`, value: p.projectId })),
    [projects]
  );

  const filtered = useMemo(() => {
    if (!searchText.trim()) return projects;
    const q = searchText.toLowerCase();
    return projects.filter(p =>
      p.projectName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.creator.toLowerCase().includes(q) ||
      p.projectId.toLowerCase().includes(q) ||
      p.interviews.some(f => f.filename.toLowerCase().includes(q) || f.ftNo.toLowerCase().includes(q))
    );
  }, [projects, searchText]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // 每次 projects 变化，上报扁平文件列表（仅定性/定量）给父层
  useEffect(() => {
    if (!onFilesChange) return;
    const refs: AIInterviewFileRef[] = projects.flatMap(proj =>
      proj.interviews
        .filter(f => f.type === '定性' || f.type === '定量')
        .map(f => ({
          id: f.id,
          ftNo: f.ftNo,
          filename: f.filename,
          execType: f.type as '定性' | '定量',
          projectId: proj.projectId,
          projectName: proj.projectName,
        }))
    );
    onFilesChange(refs);
  }, [projects, onFilesChange]);

  const handleDeleteInterview = (id: string) => {
    setProjects(prev => prev.map(p => ({ ...p, interviews: p.interviews.filter(f => f.id !== id) })));
    message.success('已删除');
  };

  const handleImportSubmit = (data: Parameters<ImportModalProps['onSubmit']>[0]) => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');

    if (data.mode === 'interview' && data.files && data.files.length > 0) {
      // 按访谈导入 —— 将上传的每个文件构造成 InterviewFile
      const newFiles: InterviewFile[] = data.files.map((f, i) => {
        const ftNum = 900 + Math.floor(Math.random() * 90) + i;
        return {
          id: `ft_new_${Date.now()}_${i}`,
          ftNo: `FT${ftNum}`,
          filename: f.name,
          category: '—',
          type: (data.interviewType as InterviewType) ?? '定性',
          creator: '当前用户',
          creatorId: 'me',
          updatedAt: now,
          duration: '–',
          status: '进行中',
          outline: data.outline
            ? OUTLINE_OPTIONS.find(o => o.value === data.outline)?.label
            : undefined,
          speakers: [],
        };
      });

      if (data.projectLinkMode === 'existing' && data.relatedProject) {
        // 关联已有项目 → 追加到该项目 (AI访谈列表)
        setProjects(prev => prev.map(p =>
          p.projectId === data.relatedProject
            ? { ...p, interviews: [...p.interviews, ...newFiles], updatedAt: now }
            : p
        ));
        // 同步到用研体验项目列表：每个文件追加一次
        newFiles.forEach(f => {
          onSyncToProjectList?.('addFile', {
            projectNo: data.relatedProject,
            filename: f.filename,
            executionType: f.type,
          });
        });
        message.success(`已将 ${newFiles.length} 个文件导入项目`);
      } else if (data.projectLinkMode === 'new' && data.newProjectName?.trim()) {
        // 新增项目
        const outlineLabel = data.outline
          ? OUTLINE_OPTIONS.find(o => o.value === data.outline)?.label
          : undefined;
        const newProject: InterviewProject = {
          id: `p_new_${Date.now()}`,
          projectId: `YY-${new Date().getFullYear()}-NEW`,
          projectName: data.newProjectName.trim(),
          year: String(new Date().getFullYear()),
          category: '—',
          types: [(data.interviewType as InterviewType) ?? '定性'],
          creator: '当前用户',
          creatorId: 'me',
          updatedAt: now,
          duration: '0:00',
          status: '进行中',
          outline: outlineLabel,
          interviews: newFiles,
        };
        setProjects(prev => [newProject, ...prev]);
        // 同步到用研体验项目列表：新建项目（取第一个文件代表）
        onSyncToProjectList?.('addProject', {
          newProjectName: newProject.projectName,
          newProjectYear: newProject.year,
          newExecutionTypes: newProject.types,
          newOutline: outlineLabel,
          filename: newFiles[0]?.filename,
          executionType: newFiles[0]?.type,
        });
        message.success(`已新建项目「${newProject.projectName}」并导入 ${newFiles.length} 个文件`);
      } else {
        // 暂不关联 → 不挂项目，只提示
        message.success(`已导入 ${newFiles.length} 个访谈文件（未关联项目）`);
      }
    } else if (data.mode === 'project' && data.projectId) {
      // 按项目导入 —— 更新项目的统一提纲和语言
      if (data.projectOutline) {
        setProjects(prev => prev.map(p =>
          p.projectId === data.projectId
            ? {
                ...p,
                outline: OUTLINE_OPTIONS.find(o => o.value === data.projectOutline)?.label ?? p.outline,
                updatedAt: now,
              }
            : p
        ));
      }
      message.success(`已同步项目 ${data.projectId} 下的定性/定量访谈文件`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>

      {/* ── 报告详情全屏覆盖层 ── */}
      {reportProject && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          {/* 返回栏 */}
          <div style={{
            height: 48, background: '#fff', borderBottom: '1px solid #e8ecf0',
            display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0,
          }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setReportProject(null)}
              style={{ borderRadius: 6 }}
            >
              返回列表
            </Button>
            <span style={{ fontSize: 14, color: '#1a1a2e', fontWeight: 500 }}>{reportProject.projectName}</span>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>项目ID: {reportProject.projectId}</span>
          </div>
          {/* 报告 iframe */}
          <iframe
            src="/report-view.html"
            style={{ flex: 1, border: 'none', width: '100%' }}
            title="报告详情"
          />
        </div>
      )}

      {/* ── TOP HEADER ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8ecf0', padding: '0 32px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', gap: 0 }}>
            <Button
              type="text" icon={<ArrowLeftOutlined />} onClick={onBack}
              style={{ color: '#8c8c8c', marginRight: 8, padding: '4px 8px' }}
            />
            <div
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginRight: 10, flexShrink: 0,
                boxShadow: '0 3px 10px rgba(22,119,255,0.3)',
              }}
            >
              🤖
            </div>
            <Title level={4} style={{ margin: '0 28px 0 0', fontSize: 18, color: '#1a1a2e', whiteSpace: 'nowrap' }}>
              AI访谈洞察
            </Title>
            {/* Flow steps — 新流程：音频路径 & 文本路径 → AI转文本 → 在线修订 → AI生成报告 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, flexWrap: 'nowrap', overflow: 'hidden' }}>
              {/* 步骤1：两条上传入口（上下堆叠） */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                {[
                  { label: '上传访谈录音', icon: '🎙️' },
                  { label: '上传访谈文本', icon: '📄' },
                ].map((s, i) => (
                  <div key={s.label} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#e6f4ff', border: '1px solid #91caff',
                    borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#1677ff',
                    fontWeight: 500,
                  }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#1677ff', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</span>
                    <span>{s.icon}</span><span>{s.label}</span>
                  </div>
                ))}
              </div>

              <ArrowRightOutlined style={{ fontSize: 11, color: '#bfbfbf', margin: '0 8px', flexShrink: 0 }} />

              {/* 步骤2：AI语音转文本 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                background: 'linear-gradient(135deg,#f9f0ff,#efe8ff)',
                border: '1px solid #d3adf7', borderRadius: 20,
                padding: '5px 14px', fontSize: 12, color: '#722ed1', fontWeight: 500,
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#722ed1', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, flexShrink: 0,
                }}>3</span>
                <span>✨</span><span>AI语音转文本</span>
              </div>

              <ArrowRightOutlined style={{ fontSize: 11, color: '#bfbfbf', margin: '0 8px', flexShrink: 0 }} />

              {/* 步骤3：在线修订 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                background: 'linear-gradient(135deg,#f9f0ff,#efe8ff)',
                border: '1px solid #d3adf7', borderRadius: 20,
                padding: '5px 14px', fontSize: 12, color: '#722ed1', fontWeight: 500,
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#722ed1', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, flexShrink: 0,
                }}>4</span>
                <span>✏️</span><span>在线修订</span>
              </div>

              <ArrowRightOutlined style={{ fontSize: 11, color: '#bfbfbf', margin: '0 8px', flexShrink: 0 }} />

              {/* 步骤4：AI生成洞察报告 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                background: 'linear-gradient(135deg,#fff7e6,#fff1e0)',
                border: '1px solid #ffd591', borderRadius: 20,
                padding: '5px 14px', fontSize: 12, color: '#d46b08', fontWeight: 600,
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fa8c16', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, flexShrink: 0,
                }}>5</span>
                <span>📊</span><span>AI生成洞察报告</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8ecf0', padding: '12px 32px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onPressEnter={() => { setSearchText(searchInput); setPage(1); }}
            placeholder="请输入关键词搜索任务"
            style={{ width: 480, borderRadius: 6 }}
          />
          <Button
            type="primary" icon={<SearchOutlined />}
            onClick={() => { setSearchText(searchInput); setPage(1); }}
            style={{ borderRadius: 6 }}
          >
            搜索
          </Button>
          <Button style={{ borderRadius: 6 }}>访谈提纲</Button>
          <Button
            type="primary" icon={<PlusOutlined />}
            onClick={() => setImportOpen(true)}
            style={{ borderRadius: 6, background: '#1677ff' }}
          >
            新增访谈洞察
          </Button>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, maxWidth: 1600, width: '100%', margin: '16px auto', padding: '0 32px', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: '#fff', borderRadius: 10, border: '1px solid #e8ecf0',
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <TableHeader />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {paginated.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#bfbfbf' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 14 }}>未找到匹配的项目</div>
              </div>
            ) : (
              paginated.map(p => (
                <ProjectRowItem
                  key={p.id}
                  project={p}
                  onViewProject={proj => setReportProject(proj)}
                  onInfoProject={proj => setViewProjectModal({ open: true, project: proj })}
                  onEditProject={proj => setEditProjectModal({ open: true, project: proj })}
                  onViewInterview={f => setViewModal({ open: true, interview: f })}
                  onDeleteInterview={handleDeleteInterview}
                />
              ))
            )}
          </div>

          {/* PAGINATION */}
          <div
            style={{
              borderTop: '1px solid #f0f0f0', padding: '10px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0,
            }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>共 {filtered.length} 条</Text>
            <Select
              size="small" value={PAGE_SIZE} style={{ width: 90 }}
              options={[{ label: '10条/页', value: 10 }, { label: '20条/页', value: 20 }]}
            />
            <Button size="small" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ borderRadius: 4 }}>{'<'}</Button>
            {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map(n => (
              <Button
                key={n} size="small"
                type={page === n ? 'primary' : 'default'}
                onClick={() => setPage(n)}
                style={{ borderRadius: 4, minWidth: 28 }}
              >{n}</Button>
            ))}
            {totalPages > 4 && <span style={{ color: '#8c8c8c' }}>...</span>}
            <Button size="small" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ borderRadius: 4 }}>{'>'}</Button>
            <Text type="secondary" style={{ fontSize: 13 }}>前往</Text>
            <Input
              size="small" style={{ width: 40, borderRadius: 4, textAlign: 'center' }} defaultValue="1"
              onPressEnter={e => {
                const v = parseInt((e.target as HTMLInputElement).value);
                if (v >= 1 && v <= totalPages) setPage(v);
              }}
            />
            <Text type="secondary" style={{ fontSize: 13 }}>页</Text>
          </div>
        </div>
      </div>

      {/* ── 导入访谈弹窗 ── */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSubmit={handleImportSubmit}
        projectOptions={projectOptions}
      />

      {/* ── VIEW INTERVIEW MODAL ── */}
      <Modal
        open={viewModal.open}
        title={<Space><FileTextOutlined style={{ color: '#1677ff' }} /><span>访谈详情</span>{viewModal.interview && <TypeTag type={viewModal.interview.type} />}</Space>}
        onCancel={() => setViewModal({ open: false, interview: null })}
        footer={[<Button key="close" onClick={() => setViewModal({ open: false, interview: null })}>关闭</Button>]}
        width={560}
      >
        {viewModal.interview && (
          <Descriptions column={2} size="small" bordered style={{ marginTop: 8 }}>
            <Descriptions.Item label="FT编号">{viewModal.interview.ftNo}</Descriptions.Item>
            <Descriptions.Item label="文件名">{viewModal.interview.filename}</Descriptions.Item>
            <Descriptions.Item label="访谈类型"><TypeTag type={viewModal.interview.type} /></Descriptions.Item>
            <Descriptions.Item label="品类"><CatTag label={viewModal.interview.category} /></Descriptions.Item>
            <Descriptions.Item label="创建人"><CreatorCell name={viewModal.interview.creator} id={viewModal.interview.creatorId} /></Descriptions.Item>
            <Descriptions.Item label="更新时间">{viewModal.interview.updatedAt}</Descriptions.Item>
            <Descriptions.Item label="时长(分)">{viewModal.interview.duration}</Descriptions.Item>
            <Descriptions.Item label="状态"><StatusCell status={viewModal.interview.status} /></Descriptions.Item>
            {viewModal.interview.outline && (
              <Descriptions.Item label="关联访谈提纲" span={2}>
                <Space><FileTextOutlined style={{ color: '#1677ff' }} /><Text style={{ color: '#1677ff' }}>{viewModal.interview.outline}</Text></Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* ── VIEW PROJECT MODAL ── */}
      <Modal
        open={viewProjectModal.open}
        title={<Space><EyeOutlined style={{ color: '#1677ff' }} /><span>项目详情</span></Space>}
        onCancel={() => setViewProjectModal({ open: false, project: null })}
        footer={[<Button key="close" onClick={() => setViewProjectModal({ open: false, project: null })}>关闭</Button>]}
        width={600}
      >
        {viewProjectModal.project && (
          <Descriptions column={2} size="small" bordered style={{ marginTop: 8 }}>
            <Descriptions.Item label="项目名称" span={2}>{viewProjectModal.project.projectName}</Descriptions.Item>
            <Descriptions.Item label="项目ID" span={1}>{viewProjectModal.project.projectId}</Descriptions.Item>
            <Descriptions.Item label="年份">{viewProjectModal.project.year}年</Descriptions.Item>
            <Descriptions.Item label="品类"><CatTag label={viewProjectModal.project.category} /></Descriptions.Item>
            <Descriptions.Item label="执行类型">
              <Space size={4}>{viewProjectModal.project.types.map(t => <TypeTag key={t} type={t} />)}</Space>
            </Descriptions.Item>
            <Descriptions.Item label="创建人"><CreatorCell name={viewProjectModal.project.creator} id={viewProjectModal.project.creatorId} /></Descriptions.Item>
            <Descriptions.Item label="更新时间">{viewProjectModal.project.updatedAt}</Descriptions.Item>
            <Descriptions.Item label="访谈数量">{viewProjectModal.project.interviews.length} 份</Descriptions.Item>
            <Descriptions.Item label="状态"><StatusCell status={viewProjectModal.project.status} /></Descriptions.Item>
            {viewProjectModal.project.outline && (
              <Descriptions.Item label="访谈提纲" span={2}>
                <Space>
                  <FileTextOutlined style={{ color: '#1677ff' }} />
                  <Text style={{ color: '#1677ff' }}>{viewProjectModal.project.outline}</Text>
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* ── EDIT PROJECT MODAL ── */}
      <Modal
        open={editProjectModal.open}
        title={<Space><EditOutlined style={{ color: '#1677ff' }} /><span>编辑项目</span></Space>}
        onCancel={() => setEditProjectModal({ open: false, project: null })}
        onOk={() => { setEditProjectModal({ open: false, project: null }); message.success('保存成功'); }}
        okText="保存" cancelText="取消" width={500}
      >
        {editProjectModal.project && (
          <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label="项目名称">{editProjectModal.project.projectName}</Descriptions.Item>
            <Descriptions.Item label="项目ID">{editProjectModal.project.projectId}</Descriptions.Item>
            <Descriptions.Item label="执行类型">
              <Space size={4}>{editProjectModal.project.types.map(t => <TypeTag key={t} type={t} />)}</Space>
            </Descriptions.Item>
          </Descriptions>
        )}
        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>完整编辑功能请前往项目管理页面操作。</div>
      </Modal>
    </div>
  );
};

export default AIInterviewPage;
