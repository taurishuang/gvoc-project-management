import React from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Typography,
  Divider,
  Space,
  List,
  Button,
} from 'antd';
import { FileOutlined, PictureOutlined, VideoCameraOutlined, DownloadOutlined } from '@ant-design/icons';
import type { Project, ProjectFile } from '../types/project';

const { Text, Title } = Typography;

interface ProjectDetailProps {
  project: Project | null;
  open: boolean;
  onClose: () => void;
}

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

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const videoTypes = ['mp4', 'mov', 'avi', 'mkv', 'wmv'];
  if (imageTypes.includes(ext || '')) return <PictureOutlined style={{ color: '#52c41a' }} />;
  if (videoTypes.includes(ext || '')) return <VideoCameraOutlined style={{ color: '#ff4d4f' }} />;
  return <FileOutlined style={{ color: '#1677ff' }} />;
};

const downloadProjectFile = (file: ProjectFile) => {
  if (file.url) {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.target = '_blank';
    a.click();
  } else {
    // Mock 场景：无真实 URL，提示用户
    alert(`文件"${file.name}"为演示数据，暂无真实下载地址。`);
  }
};

const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <Title level={5} style={{
      color: '#1677ff',
      borderLeft: '3px solid #1677ff',
      paddingLeft: 8,
      margin: '0 0 12px',
    }}>
      {title}
    </Title>
    {children}
  </div>
);

const LabelValue: React.FC<{ label: string; value?: React.ReactNode; empty?: string }> = ({
  label,
  value,
  empty = '暂未填写',
}) => (
  <div style={{ marginBottom: 12 }}>
    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</Text>
    <div style={{ color: value ? '#1a1a2e' : '#bfbfbf', lineHeight: 1.6 }}>
      {value || empty}
    </div>
  </div>
);

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, open, onClose }) => {
  if (!project) return null;

  const hasQualitativeType = project.executionType.some(t =>
    ['定性', '定量', '体验测评'].includes(t)
  );
  const hasBigDataType = project.executionType.includes('大数据');

  return (
    <Modal
      title={
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>
            {project.projectName}
          </div>
          <Space size={4} wrap>
            {project.executionType.map(t => (
              <Tag key={t} color={EXECUTION_TYPE_COLORS[t]}>{t}</Tag>
            ))}
            <Tag color={RESEARCH_TYPE_COLORS[project.researchType] || 'default'}>
              {project.researchType}
            </Tag>
          </Space>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      styles={{
        body: { maxHeight: '75vh', overflowY: 'auto', padding: '20px 24px' },
      }}
    >
      {/* 基础信息 */}
      <InfoSection title="基础信息">
        <Descriptions column={3} size="small" bordered={false} colon={false}
          labelStyle={{ color: '#8c8c8c', fontSize: 12, width: 100 }}
          contentStyle={{ fontSize: 14 }}
        >
          <Descriptions.Item label="项目时间">{project.projectTime} 年</Descriptions.Item>
          <Descriptions.Item label="所属事业部">
            <Tag color="purple">{project.businessUnit}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="所属品类">
            <Tag color="processing">{project.category}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(project.createdAt).toLocaleDateString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="内外销/地区" span={3}>
            <Space size={4} wrap>
              {project.salesRegion.map(r => (
                <Tag key={r}>{r}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </InfoSection>

      <Divider style={{ margin: '8px 0 20px' }} />

      {/* 项目背景信息 */}
      <InfoSection title="项目背景信息">
        <LabelValue label="项目背景" value={project.projectBackground} />
        <LabelValue label="项目目的" value={project.projectPurpose} />
        <LabelValue label="主要结论/价值提炼" value={project.mainConclusion} />
        <LabelValue label="后续工作方向" value={project.followUpDirection} />
      </InfoSection>

      <Divider style={{ margin: '8px 0 20px' }} />

      {/* 执行详情 */}
      <InfoSection title="执行详情">
        {hasQualitativeType && project.qualitativeFields && (
          <div style={{
            background: '#f0f7ff',
            border: '1px solid #91caff',
            borderRadius: 8,
            padding: '16px',
            marginBottom: hasBigDataType ? 16 : 0,
          }}>
            <Text strong style={{ color: '#1677ff', display: 'block', marginBottom: 12 }}>
              定性/定量/体验测评 详细信息
            </Text>
            <LabelValue label="执行方法" value={project.qualitativeFields.executionMethod} />
            <LabelValue label="样本量" value={project.qualitativeFields.sampleSize} />
            <LabelValue label="招募条件简述" value={project.qualitativeFields.recruitmentConditions} />
            <LabelValue label="样本分布（地理位置等）" value={project.qualitativeFields.sampleDistribution} />
            <LabelValue label="原始笔录内容" value={project.qualitativeFields.rawRecordContent} />
          </div>
        )}
        {hasBigDataType && project.bigDataFields && (
          <div style={{
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 8,
            padding: '16px',
          }}>
            <Text strong style={{ color: '#52c41a', display: 'block', marginBottom: 12 }}>
              大数据 详细信息
            </Text>
            <LabelValue label="数据源" value={project.bigDataFields.dataSource} />
            <LabelValue label="数据获取方式" value={project.bigDataFields.dataAcquisitionMethod} />
            <LabelValue label="数据范围及清洗规则" value={project.bigDataFields.dataRangeAndCleaning} />
            <LabelValue label="数据量" value={project.bigDataFields.dataVolume} />
          </div>
        )}
      </InfoSection>

      {/* 附件 - 支持下载 */}
      {project.files.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0 20px' }} />
          <InfoSection title={`附件（${project.files.length}个）`}>
            <List
              size="small"
              dataSource={project.files}
              renderItem={(file) => (
                <List.Item
                  style={{
                    padding: '8px 12px',
                    background: '#fafafa',
                    borderRadius: 6,
                    marginBottom: 6,
                    border: '1px solid #f0f0f0',
                    cursor: 'pointer',
                  }}
                  actions={[
                    <Button
                      key="download"
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadProjectFile(file)}
                      style={{ padding: '0 4px' }}
                    >
                      下载
                    </Button>,
                  ]}
                >
                  <Space>
                    {getFileIcon(file.name)}
                    <Text
                      style={{ cursor: 'pointer', color: '#1677ff' }}
                      onClick={() => downloadProjectFile(file)}
                    >
                      {file.name}
                    </Text>
                    {file.size && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          </InfoSection>
        </>
      )}
    </Modal>
  );
};

export default ProjectDetail;
