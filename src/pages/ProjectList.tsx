import React, { useState, useMemo } from 'react';
import {
  Button,
  Table,
  Tag,
  Space,
  Input,
  Select,
  Typography,
  Tooltip,
  Popconfirm,
  Card,
  Row,
  Col,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  HomeOutlined,
  CalendarOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Project, ExecutionType, ProjectFile } from '../types/project';
import type { AIInterviewFileRef } from '../types/project';
import { RESEARCH_TYPE_OPTIONS, BUSINESS_UNIT_OPTIONS, BUSINESS_UNIT_CATEGORY_MAP, generateProjectNo } from '../types/project';
import ProjectForm from '../components/ProjectForm';
import ProjectDetail from '../components/ProjectDetail';

interface ProjectListProps {
  onNavigateInterview?: () => void;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  aiFiles?: AIInterviewFileRef[];
}

const { Text } = Typography;
const { Search } = Input;

const EXECUTION_TYPE_COLORS: Record<string, string> = {
  定性: 'blue',
  定量: 'geekblue',
  体验测评: 'purple',
  大数据: 'green',
};

const RESEARCH_TYPE_COLORS: Record<string, string> = {
  新人群新场景新需求: 'cyan',
  现有人群未满足需求: 'orange',
  开发过程中的测评: 'red',
  上市后产品优化: 'gold',
  其他专题研究: 'default',
};

const getFileEmoji = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: '📄', ppt: '📊', pptx: '📊',
    doc: '📝', docx: '📝', xls: '📈', xlsx: '📈',
    txt: '📃', jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
    gif: '🖼️', mp4: '🎬', mov: '🎬', avi: '🎬',
  };
  return map[ext || ''] || '📎';
};

const downloadFile = (file: ProjectFile) => {
  if (file.url) {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.target = '_blank';
    a.click();
  } else {
    alert(`文件"${file.name}"为演示数据，暂无真实下载地址。`);
  }
};

const FileTooltipContent: React.FC<{ files: ProjectFile[] }> = ({ files }) => (
  <div style={{ maxWidth: 280 }}>
    {files.map(f => (
      <div
        key={f.uid}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
        }}
        onClick={() => downloadFile(f)}
      >
        <span style={{ fontSize: 14, flexShrink: 0 }}>{getFileEmoji(f.name)}</span>
        <span style={{
          flex: 1, fontSize: 12, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: '#e6f4ff', textDecoration: 'underline',
        }}>{f.name}</span>
        <DownloadOutlined style={{ fontSize: 11, color: '#91caff', flexShrink: 0 }} />
      </div>
    ))}
    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 6 }}>点击文件名可下载</div>
  </div>
);

// ─── 统计标签卡片组件 ───────────────────────────────────────────────
interface StatCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, count, icon, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      background: active ? '#f0f7ff' : '#fff',
      border: `1.5px solid ${active ? '#1677ff' : '#e8ecf0'}`,
      borderRadius: 10,
      cursor: 'pointer',
      transition: 'all 0.18s',
      minWidth: 120,
      flex: 1,
      userSelect: 'none',
    }}
  >
    <div>
      <div style={{
        fontSize: 13,
        color: active ? '#1677ff' : '#8c8c8c',
        marginBottom: 4,
        fontWeight: active ? 600 : 400,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 26,
        fontWeight: 700,
        color: active ? '#1677ff' : '#1a1a2e',
        lineHeight: 1,
      }}>
        {count}
      </div>
    </div>
    <div style={{
      width: 36,
      height: 36,
      borderRadius: 8,
      background: active ? '#1677ff' : '#f0f5ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      color: active ? '#fff' : '#1677ff',
      flexShrink: 0,
      transition: 'all 0.18s',
    }}>
      {icon}
    </div>
  </div>
);

// ─── 主组件 ───────────────────────────────────────────────────────────
const ProjectList: React.FC<ProjectListProps> = ({
  onNavigateInterview,
  projects,
  setProjects,
  aiFiles = [],
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterBU, setFilterBU] = useState<string | undefined>();
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterResearch, setFilterResearch] = useState<string | undefined>();
  const [filterExecution, setFilterExecution] = useState<string | undefined>();

  // 统计标签选中态（null = 全部）
  const [activeStatKey, setActiveStatKey] = useState<string | null>(null);

  const currentYear = String(new Date().getFullYear());

  // 统计数据定义
  const statCards = useMemo(() => [
    {
      key: null,
      label: '全部',
      count: projects.length,
      icon: <AppstoreOutlined />,
      filter: () => true,
    },
    {
      key: 'domestic',
      label: '国内市场',
      count: projects.filter(p => p.salesRegion.includes('中国大陆')).length,
      icon: <HomeOutlined />,
      filter: (p: Project) => p.salesRegion.includes('中国大陆'),
    },
    {
      key: 'overseas',
      label: '海外市场',
      count: projects.filter(p => p.salesRegion.some(r => !r.startsWith('中国'))).length,
      icon: <GlobalOutlined />,
      filter: (p: Project) => p.salesRegion.some(r => !r.startsWith('中国')),
    },
    {
      key: 'thisYear',
      label: `${currentYear}年`,
      count: projects.filter(p => p.projectTime === currentYear).length,
      icon: <CalendarOutlined />,
      filter: (p: Project) => p.projectTime === currentYear,
    },
    {
      key: 'qualitative',
      label: '定性/定量',
      count: projects.filter(p => p.executionType.some(t => ['定性', '定量'].includes(t))).length,
      icon: <ExperimentOutlined />,
      filter: (p: Project) => p.executionType.some(t => ['定性', '定量'].includes(t)),
    },
    {
      key: 'bigdata',
      label: '大数据',
      count: projects.filter(p => p.executionType.includes('大数据')).length,
      icon: <BarChartOutlined />,
      filter: (p: Project) => p.executionType.includes('大数据'),
    },
  ], [projects, currentYear]);

  const categoryFilterOptions = useMemo(() => {
    if (!filterBU) return [];
    return (BUSINESS_UNIT_CATEGORY_MAP[filterBU] || []).map(c => ({ label: c, value: c }));
  }, [filterBU]);

  // 当前激活的统计卡片过滤函数
  const activeStatFilter = useMemo(() => {
    const card = statCards.find(c => c.key === activeStatKey);
    return card ? card.filter : () => true;
  }, [activeStatKey, statCards]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchStat = activeStatFilter(p);
      const matchSearch =
        !searchText ||
        p.projectName.toLowerCase().includes(searchText.toLowerCase()) ||
        (p.category || []).some(c => c.toLowerCase().includes(searchText.toLowerCase())) ||
        (p.businessUnit || '').includes(searchText) ||
        p.salesRegion.some(r => r.includes(searchText));
      const matchBU = !filterBU || p.businessUnit === filterBU;
      const matchCategory = !filterCategory || (p.category || []).includes(filterCategory);
      const matchResearch = !filterResearch || p.researchType === filterResearch;
      const matchExecution = !filterExecution || p.executionType.includes(filterExecution as ExecutionType);
      return matchStat && matchSearch && matchBU && matchCategory && matchResearch && matchExecution;
    });
  }, [projects, activeStatFilter, searchText, filterBU, filterCategory, filterResearch, filterExecution]);

  const handleAddProject = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...data,
      id: String(Date.now()),
      projectNo: data.projectNo || generateProjectNo(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const handleUpdateProject = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingProject) return;
    setProjects(prev =>
      prev.map(p =>
        p.id === editingProject.id
          ? { ...p, ...data, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const handleFormSubmit = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (formMode === 'edit') {
      handleUpdateProject(data);
    } else {
      handleAddProject(data);
    }
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingProject(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setFormMode('edit');
    setEditingProject(project);
    setFormOpen(true);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleViewDetail = (project: Project) => {
    setSelectedProject(project);
    setDetailOpen(true);
  };

  const handleBUFilterChange = (bu: string | undefined) => {
    setFilterBU(bu);
    setFilterCategory(undefined);
  };

  const columns: ColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      fixed: 'left',
      width: 220,
      render: (text, record) => (
        <div>
          <Button
            type="link"
            style={{ padding: 0, fontSize: 14, fontWeight: 500, textAlign: 'left', height: 'auto' }}
            onClick={() => handleViewDetail(record)}
          >
            {text}
          </Button>
          {record.projectNo && (
            <div style={{ fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace', marginTop: 2 }}>
              {record.projectNo}
            </div>
          )}
          <div style={{ marginTop: 4 }}>
            <Space size={4} wrap>
              {record.executionType.map(t => (
                <Tag key={t} color={EXECUTION_TYPE_COLORS[t]} style={{ fontSize: 11, lineHeight: '16px' }}>
                  {t}
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: '内外销/地区',
      dataIndex: 'salesRegion',
      key: 'salesRegion',
      width: 150,
      render: (regions: string[]) => (
        <Space size={4} wrap>
          {regions.slice(0, 2).map(r => <Tag key={r}>{r}</Tag>)}
          {regions.length > 2 && (
            <Tooltip title={regions.slice(2).join('、')}>
              <Tag>+{regions.length - 2}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '项目时间',
      dataIndex: 'projectTime',
      key: 'projectTime',
      width: 90,
      sorter: (a, b) => Number(a.projectTime) - Number(b.projectTime),
      render: (year: string) => <Text>{year} 年</Text>,
    },
    {
      title: '事业部',
      dataIndex: 'businessUnit',
      key: 'businessUnit',
      width: 140,
      render: (bu: string) => <Tag color="purple" style={{ whiteSpace: 'normal' }}>{bu}</Tag>,
    },
    {
      title: '所属品类',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (cats: string[]) => (
        <Space size={4} wrap>
          {(cats || []).slice(0, 2).map(c => <Tag key={c} color="processing" style={{ fontSize: 11 }}>{c}</Tag>)}
          {(cats || []).length > 2 && (
            <Tooltip title={(cats || []).slice(2).join('、')}>
              <Tag style={{ fontSize: 11 }}>+{(cats || []).length - 2}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '研究类型',
      dataIndex: 'researchType',
      key: 'researchType',
      width: 160,
      render: (type: string) => (
        <Tag color={RESEARCH_TYPE_COLORS[type] || 'default'} style={{ whiteSpace: 'normal', maxWidth: 150 }}>
          {type}
        </Tag>
      ),
    },
    {
      title: '项目背景',
      dataIndex: 'projectBackground',
      key: 'projectBackground',
      width: 200,
      render: (field: { mode: string; value: string } | string) => {
        const text = typeof field === 'string' ? field : field?.value;
        const isAI = typeof field === 'object' && field?.mode === 'ai' && !field?.value;
        if (isAI) return <Text type="secondary" style={{ fontSize: 12 }}>AI提炼中...</Text>;
        return text ? (
          <Tooltip title={text} placement="topLeft">
            <Text ellipsis style={{ maxWidth: 180, display: 'block' }}>{text}</Text>
          </Tooltip>
        ) : <Text type="secondary">-</Text>;
      },
    },
    {
      title: '项目目的',
      dataIndex: 'projectPurpose',
      key: 'projectPurpose',
      width: 200,
      render: (field: { mode: string; value: string } | string) => {
        const text = typeof field === 'string' ? field : field?.value;
        const isAI = typeof field === 'object' && field?.mode === 'ai' && !field?.value;
        if (isAI) return <Text type="secondary" style={{ fontSize: 12 }}>AI提炼中...</Text>;
        return text ? (
          <Tooltip title={text} placement="topLeft">
            <Text ellipsis style={{ maxWidth: 180, display: 'block' }}>{text}</Text>
          </Tooltip>
        ) : <Text type="secondary">-</Text>;
      },
    },
    {
      title: '主要结论',
      dataIndex: 'mainConclusion',
      key: 'mainConclusion',
      width: 200,
      render: (field: { mode: string; value: string } | string) => {
        const text = typeof field === 'string' ? field : field?.value;
        const isAI = typeof field === 'object' && field?.mode === 'ai' && !field?.value;
        if (isAI) return <Text type="secondary" style={{ fontSize: 12 }}>AI提炼中...</Text>;
        return text ? (
          <Tooltip title={text} placement="topLeft">
            <Text ellipsis style={{ maxWidth: 180, display: 'block' }}>{text}</Text>
          </Tooltip>
        ) : <Text type="secondary">-</Text>;
      },
    },
    {
      title: '后续工作方向',
      dataIndex: 'followUpDirection',
      key: 'followUpDirection',
      width: 200,
      render: (field: { mode: string; value: string } | string) => {
        const text = typeof field === 'string' ? field : field?.value;
        const isAI = typeof field === 'object' && field?.mode === 'ai' && !field?.value;
        if (isAI) return <Text type="secondary" style={{ fontSize: 12 }}>AI提炼中...</Text>;
        return text ? (
          <Tooltip title={text} placement="topLeft">
            <Text ellipsis style={{ maxWidth: 180, display: 'block' }}>{text}</Text>
          </Tooltip>
        ) : <Text type="secondary">-</Text>;
      },
    },
    {
      title: '附件',
      dataIndex: 'files',
      key: 'files',
      width: 70,
      render: (files: ProjectFile[]) =>
        files.length > 0 ? (
          <Tooltip
            title={<FileTooltipContent files={files} />}
            placement="left"
            overlayStyle={{ maxWidth: 320 }}
            overlayInnerStyle={{ background: '#1a1a2e', padding: '10px 14px', borderRadius: 8 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <PaperClipOutlined style={{ fontSize: 16, color: '#1677ff' }} />
              <span style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>{files.length}</span>
            </div>
          </Tooltip>
        ) : (
          <PaperClipOutlined style={{ fontSize: 16, color: '#d9d9d9' }} />
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>{new Date(date).toLocaleDateString('zh-CN')}</Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} style={{ color: '#1677ff' }} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} style={{ color: '#52c41a' }} />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除该项目吗？此操作不可恢复。"
            onConfirm={() => handleDeleteProject(record.id)}
            okText="删除" cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>

      {/* ── 顶部 Header ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e8ecf0',
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1600, margin: '0 auto' }}>
          {/* 标题行 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 0 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AppstoreOutlined style={{ fontSize: 18, color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>
                  用研体验项目
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                  集中管理用研体验项目，沉淀知识资产
                </div>
              </div>
            </div>
            <Space size={8}>
              <Button
                icon={<RobotOutlined />}
                onClick={() => onNavigateInterview?.()}
                style={{
                  borderRadius: 8,
                  fontWeight: 500,
                  height: 36,
                  paddingInline: 20,
                  background: 'linear-gradient(135deg, #f0e8ff 0%, #e8f4ff 100%)',
                  borderColor: '#d3adf7',
                  color: '#722ed1',
                }}
              >
                AI访谈洞察
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenCreate()}
                style={{
                  background: '#1677ff',
                  borderRadius: 8,
                  fontWeight: 500,
                  height: 36,
                  paddingInline: 20,
                }}
              >
                新增项目
              </Button>
            </Space>
          </div>

          {/* ── 统计标签卡片行 ── */}
          <div style={{
            display: 'flex',
            gap: 10,
            paddingBottom: 0,
            overflowX: 'auto',
          }}>
            {statCards.map(card => (
              <StatCard
                key={String(card.key)}
                label={card.label}
                count={card.count}
                icon={card.icon}
                active={activeStatKey === card.key}
                onClick={() => setActiveStatKey(activeStatKey === card.key ? null : card.key)}
              />
            ))}
          </div>

          {/* 激活卡片底部指示线 */}
          <div style={{ display: 'flex', gap: 10, marginTop: 0 }}>
            {statCards.map(card => (
              <div
                key={String(card.key)}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: activeStatKey === card.key ? '#1677ff' : 'transparent',
                  transition: 'background 0.18s',
                  marginTop: 6,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 主内容区 ── */}
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px 32px' }}>

        {/* 筛选栏 */}
        <Card
          style={{ marginBottom: 16, borderRadius: 10, border: '1px solid #e8ecf0' }}
          styles={{ body: { padding: '14px 20px' } }}
        >
          <Row gutter={[10, 10]} align="middle">
            <Col flex="auto">
              <Search
                placeholder="搜索项目名称、品类、事业部、地区..."
                allowClear
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ maxWidth: 340 }}
              />
            </Col>
            <Col>
              <Space size={8} wrap>
                <Select
                  placeholder="事业部"
                  allowClear
                  style={{ width: 160 }}
                  onChange={handleBUFilterChange}
                  options={BUSINESS_UNIT_OPTIONS.map(bu => ({ label: bu, value: bu }))}
                />
                <Select
                  placeholder={filterBU ? '筛选品类' : '请先选事业部'}
                  allowClear
                  disabled={!filterBU}
                  value={filterCategory}
                  style={{ width: 140 }}
                  onChange={setFilterCategory}
                  options={categoryFilterOptions}
                />
                <Select
                  placeholder="研究类型"
                  allowClear
                  style={{ width: 180 }}
                  onChange={setFilterResearch}
                  options={RESEARCH_TYPE_OPTIONS.map(r => ({ label: r.label, value: r.value }))}
                />
                <Select
                  placeholder="执行类型"
                  allowClear
                  style={{ width: 120 }}
                  onChange={setFilterExecution}
                  options={[
                    { label: '定性', value: '定性' },
                    { label: '定量', value: '定量' },
                    { label: '体验测评', value: '体验测评' },
                    { label: '大数据', value: '大数据' },
                  ]}
                />
                <Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                  共 <Text strong style={{ color: '#1677ff' }}>{filteredProjects.length}</Text> 个项目
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 表格 */}
        <Card
          style={{ borderRadius: 10, border: '1px solid #e8ecf0' }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={columns}
            dataSource={filteredProjects}
            rowKey="id"
            scroll={{ x: 1800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              style: { padding: '12px 20px' },
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      暂无项目数据，
                      <Button type="link" onClick={() => handleOpenCreate()} style={{ padding: 0 }}>
                        立即新增
                      </Button>
                    </span>
                  }
                />
              ),
            }}
            rowClassName={(_, index) =>
              index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
            }
          />
        </Card>
      </div>

      {/* 新增/编辑弹窗 */}
      <ProjectForm
        open={formOpen}
        mode={formMode}
        initialData={editingProject ?? undefined}
        aiFiles={aiFiles}
        onClose={() => {
          setFormOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* 详情弹窗 */}
      <ProjectDetail
        project={selectedProject}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedProject(null);
        }}
      />
    </div>
  );
};

export default ProjectList;
