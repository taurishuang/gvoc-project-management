import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Tag,
  Button,
  Input,
  Typography,
  Space,
  Badge,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  DownOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { Project, ProjectFile, ExecutionType } from '../types/project';

const { Text, Title } = Typography;

// ─── 执行类型标签颜色 ────────────────────────────────────────────────
const EXEC_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  定性:   { bg: '#e6f4ff', color: '#1677ff', border: '#91caff' },
  定量:   { bg: '#f0f0ff', color: '#4B5EE4', border: '#adb4f0' },
  体验测评: { bg: '#f9f0ff', color: '#722ed1', border: '#d3adf7' },
  大数据: { bg: '#f6ffed', color: '#52c41a', border: '#b7eb8f' },
  综合:   { bg: '#fff7e6', color: '#fa8c16', border: '#ffd591' },
};

const getExecColor = (type: string) =>
  EXEC_COLORS[type] || { bg: '#f5f5f5', color: '#595959', border: '#d9d9d9' };

// ─── 文件扩展名图标 ──────────────────────────────────────────────────
const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: '📄', ppt: '📊', pptx: '📊',
    doc: '📝', docx: '📝', xls: '📈', xlsx: '📈',
    txt: '📃', jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
    gif: '🖼️', mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬', wmv: '🎬',
    mp3: '🎵', wav: '🎵', aac: '🎵', m4a: '🎵',
  };
  return map[ext || ''] || '📎';
};

// ─── 组件 Props ──────────────────────────────────────────────────────
interface AIInterviewInsightProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
}

// ─── 单条文件行 ──────────────────────────────────────────────────────
const FileRow: React.FC<{ file: ProjectFile; execTypes: ExecutionType[] }> = ({ file, execTypes }) => {
  const category = file.category || '综合';
  const c = getExecColor(category);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px 8px 48px',
        borderBottom: '1px solid #f5f5f5',
        transition: 'background 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* file icon */}
      <span style={{ fontSize: 16, flexShrink: 0 }}>{getFileIcon(file.name)}</span>

      {/* filename */}
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#1a1a2e',
        }}
      >
        {file.name}
      </Text>

      {/* category tag */}
      <Tag
        style={{
          background: c.bg,
          color: c.color,
          border: `1px solid ${c.border}`,
          borderRadius: 4,
          fontSize: 11,
          lineHeight: '18px',
          padding: '0 6px',
          flexShrink: 0,
        }}
      >
        {category}
      </Tag>

      {/* execution type tags inherited from project */}
      {execTypes.map(t => {
        const ec = getExecColor(t);
        return (
          <Tag
            key={t}
            style={{
              background: ec.bg,
              color: ec.color,
              border: `1px solid ${ec.border}`,
              borderRadius: 4,
              fontSize: 11,
              lineHeight: '18px',
              padding: '0 6px',
              flexShrink: 0,
            }}
          >
            {t}
          </Tag>
        );
      })}
    </div>
  );
};

// ─── 单个项目折叠行 ──────────────────────────────────────────────────
const ProjectRow: React.FC<{ project: Project; defaultExpanded?: boolean }> = ({
  project,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const files = project.files || [];
  const fileCount = files.length;

  // 展示执行类型（定性/定量 才算"访谈"文件，但我们把所有文件都列出，按category标注）
  const execTypes = project.executionType;

  return (
    <div style={{ borderBottom: '1px solid #f0f0f0' }}>
      {/* Project header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          cursor: 'pointer',
          background: expanded ? '#f8faff' : '#fff',
          transition: 'background 0.15s',
          userSelect: 'none',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = '#fafafa'; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = '#fff'; }}
      >
        {/* expand icon */}
        <span style={{ fontSize: 12, color: '#8c8c8c', width: 14, flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          <DownOutlined />
        </span>

        {/* year badge */}
        <Tag
          style={{
            background: '#f0f5ff',
            color: '#1677ff',
            border: '1px solid #adc6ff',
            borderRadius: 4,
            fontSize: 12,
            flexShrink: 0,
            margin: 0,
          }}
        >
          {project.projectTime}年
        </Tag>

        {/* project name */}
        <Text strong style={{ flex: 1, fontSize: 13, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.projectName}
        </Text>

        {/* execution type tags */}
        <Space size={4} style={{ flexShrink: 0 }}>
          {execTypes.map(t => {
            const ec = getExecColor(t);
            return (
              <Tag
                key={t}
                style={{
                  background: ec.bg,
                  color: ec.color,
                  border: `1px solid ${ec.border}`,
                  borderRadius: 4,
                  fontSize: 11,
                  lineHeight: '18px',
                  padding: '0 6px',
                  margin: 0,
                }}
              >
                {t}
              </Tag>
            );
          })}
        </Space>

        {/* file count badge */}
        <Tooltip title={`共 ${fileCount} 个文件`}>
          <Badge
            count={fileCount}
            showZero
            style={{
              background: fileCount > 0 ? '#1677ff' : '#d9d9d9',
              fontSize: 11,
              flexShrink: 0,
            }}
          />
        </Tooltip>
      </div>

      {/* Expanded file list */}
      {expanded && (
        <div style={{ background: '#fafeff' }}>
          {fileCount === 0 ? (
            <div style={{ padding: '12px 48px', color: '#bfbfbf', fontSize: 12 }}>
              暂无访谈文件
            </div>
          ) : (
            files.map(f => (
              <FileRow key={f.uid} file={f} execTypes={execTypes} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── 主组件 ──────────────────────────────────────────────────────────
const AIInterviewInsight: React.FC<AIInterviewInsightProps> = ({ open, onClose, projects }) => {
  const [searchText, setSearchText] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchText.trim()) return projects;
    const q = searchText.toLowerCase();
    return projects.filter(
      p =>
        p.projectName.toLowerCase().includes(q) ||
        p.projectTime.includes(q) ||
        p.businessUnit.toLowerCase().includes(q) ||
        (p.category || []).some(c => c.toLowerCase().includes(q)) ||
        p.executionType.some(t => t.includes(q)) ||
        (p.files || []).some(f => f.name.toLowerCase().includes(q))
    );
  }, [projects, searchText]);

  const totalFiles = useMemo(
    () => filteredProjects.reduce((sum, p) => sum + (p.files || []).length, 0),
    [filteredProjects]
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="80vw"
      styles={{
        header: { padding: 0, border: 'none' },
        body: { padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
      title={null}
      closable={false}
    >
      {/* ── 顶部 Header ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #e8f4ff 0%, #f0e8ff 100%)',
          padding: '16px 24px 12px',
          borderBottom: '1px solid #e0e8ff',
          flexShrink: 0,
        }}
      >
        {/* Logo + title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(22,119,255,0.3)',
              }}
            >
              <span style={{ fontSize: 22 }}>🤖</span>
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#1a1a2e', fontSize: 18 }}>
                AI访谈洞察
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                智能分析访谈内容，提炼用研洞察
              </Text>
            </div>
          </div>
          <Button onClick={onClose} style={{ borderRadius: 6 }}>关闭</Button>
        </div>

        {/* Flow steps */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 10,
            padding: '10px 16px',
            flexWrap: 'wrap',
            rowGap: 8,
          }}
        >
          {/* Step 1 has two sub-items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: '1. 上传访谈录音', icon: '🎙️' },
              { label: '1. 上传访谈文本', icon: '📄' },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#e6f4ff', border: '1px solid #91caff',
                  borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#1677ff',
                }}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {[
            { label: '2. AI语音转文本', icon: '✨' },
            { label: '3. 在线修订', icon: '✏️' },
            { label: '4. AI生成报告', icon: '📊' },
          ].map((step) => (
            <React.Fragment key={step.label}>
              <ArrowRightOutlined style={{ fontSize: 12, color: '#8c8c8c', margin: '0 6px', flexShrink: 0 }} />
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#f5f0ff', border: '1px solid #d3adf7',
                  borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#722ed1',
                }}
              >
                <span>{step.icon}</span>
                <span>{step.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── 搜索栏 ── */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="搜索项目名称、文件名、执行类型..."
          allowClear
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 400, borderRadius: 6 }}
        />
        <Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
          共{' '}
          <Text strong style={{ color: '#1677ff' }}>{filteredProjects.length}</Text>
          {' '}个项目 /{' '}
          <Text strong style={{ color: '#1677ff' }}>{totalFiles}</Text>
          {' '}个访谈文件
        </Text>
      </div>

      {/* ── 列表表头 ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12, flex: 1, paddingLeft: 24 }}>
          项目 / 访谈文件
        </Text>
        <Text type="secondary" style={{ fontSize: 12, width: 80, textAlign: 'right' }}>执行类型</Text>
        <Text type="secondary" style={{ fontSize: 12, width: 60, textAlign: 'right' }}>文件数</Text>
      </div>

      {/* ── 项目列表 ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#bfbfbf' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14 }}>未找到匹配的项目</div>
          </div>
        ) : (
          filteredProjects.map(p => (
            <ProjectRow key={p.id} project={p} />
          ))
        )}
      </div>
    </Drawer>
  );
};

export default AIInterviewInsight;
