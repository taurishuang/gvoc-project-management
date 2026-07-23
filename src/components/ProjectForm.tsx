import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Upload,
  Button,
  Divider,
  Row,
  Col,
  Typography,
  Space,
  Tag,
} from 'antd';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import type {
  Project,
  ExecutionType,
} from '../types/project';
import {
  SALES_REGION_OPTIONS,
  EXECUTION_TYPE_OPTIONS,
  RESEARCH_TYPE_OPTIONS,
  BUSINESS_UNIT_OPTIONS,
  BUSINESS_UNIT_CATEGORY_MAP,
} from '../types/project';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Dragger } = Upload;

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Project;
  mode?: 'create' | 'edit';
}

const QUALITATIVE_TYPES: ExecutionType[] = ['定性', '定量', '体验测评'];

const ACCEPT_FILE_TYPES = [
  '.ppt', '.pptx',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.txt',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.mp4', '.mov', '.avi', '.mkv', '.wmv',
].join(',');

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    pdf: '📄', ppt: '📊', pptx: '📊',
    doc: '📝', docx: '📝', xls: '📈', xlsx: '📈',
    txt: '📃', jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
    gif: '🖼️', mp4: '🎬', mov: '🎬', avi: '🎬',
  };
  return iconMap[ext || ''] || '📎';
};

// 触发本地文件下载
const downloadFile = (file: UploadFile) => {
  if (file.originFileObj) {
    const url = URL.createObjectURL(file.originFileObj);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  } else if (file.url) {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.target = '_blank';
    a.click();
  }
};

const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
}) => {
  const [form] = Form.useForm();
  const [selectedExecutionTypes, setSelectedExecutionTypes] = useState<ExecutionType[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedBU, setSelectedBU] = useState<string>('');

  // 每次弹窗打开时同步 initialData 到表单和本地状态
  useEffect(() => {
    if (open) {
      if (initialData) {
        const executionTypes = initialData.executionType || [];
        setSelectedExecutionTypes(executionTypes);
        setSelectedBU(initialData.businessUnit || '');
        setFileList(
          (initialData.files || []).map(f => ({
            uid: f.uid,
            name: f.name,
            status: 'done' as const,
            url: f.url,
          }))
        );
        form.setFieldsValue({
          projectName: initialData.projectName,
          salesRegion: initialData.salesRegion,
          projectTime: initialData.projectTime ? dayjs(initialData.projectTime, 'YYYY') : undefined,
          businessUnit: initialData.businessUnit,
          category: initialData.category,
          researchType: initialData.researchType,
          projectBackground: initialData.projectBackground,
          projectPurpose: initialData.projectPurpose,
          mainConclusion: initialData.mainConclusion,
          followUpDirection: initialData.followUpDirection,
          // 执行类型子字段
          ...(initialData.qualitativeFields || {}),
          ...(initialData.bigDataFields || {}),
        });
      } else {
        // 新增模式：清空所有
        form.resetFields();
        setSelectedExecutionTypes([]);
        setSelectedBU('');
        setFileList([]);
      }
    }
  }, [open, initialData, form]);

  const hasQualitativeType = selectedExecutionTypes.some(t =>
    QUALITATIVE_TYPES.includes(t)
  );
  const hasBigDataType = selectedExecutionTypes.includes('大数据');

  const handleExecutionTypeChange = (checkedValues: ExecutionType[]) => {
    setSelectedExecutionTypes(checkedValues);
    form.setFieldsValue({ executionType: checkedValues });
  };

  const handleBUChange = (bu: string) => {
    setSelectedBU(bu);
    form.setFieldsValue({ category: undefined }); // 清空品类
  };

  const categoryOptions = selectedBU
    ? (BUSINESS_UNIT_CATEGORY_MAP[selectedBU] || []).map(c => ({ label: c, value: c }))
    : [];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
        projectName: values.projectName,
        salesRegion: values.salesRegion,
        projectTime: values.projectTime ? dayjs(values.projectTime).format('YYYY') : '',
        businessUnit: values.businessUnit,
        category: values.category,
        executionType: selectedExecutionTypes,
        researchType: values.researchType,
        projectBackground: values.projectBackground || '',
        projectPurpose: values.projectPurpose || '',
        mainConclusion: values.mainConclusion || '',
        followUpDirection: values.followUpDirection || '',
        files: fileList.map(f => ({
          uid: f.uid,
          name: f.name,
          url: f.url as string | undefined,
          size: f.size,
          type: f.type,
          status: 'done' as const,
        })),
      };

      if (hasQualitativeType) {
        projectData.qualitativeFields = {
          executionMethod: values.executionMethod || '',
          sampleSize: values.sampleSize || '',
          recruitmentConditions: values.recruitmentConditions || '',
          sampleDistribution: values.sampleDistribution || '',
          rawRecordContent: values.rawRecordContent || '',
        };
      }

      if (hasBigDataType) {
        projectData.bigDataFields = {
          dataSource: values.dataSource || '',
          dataAcquisitionMethod: values.dataAcquisitionMethod || '',
          dataRangeAndCleaning: values.dataRangeAndCleaning || '',
          dataVolume: values.dataVolume || '',
        };
      }

      onSubmit(projectData);
      handleClose();
    } catch (_err) {
      // Validation failed
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedExecutionTypes([]);
    setFileList([]);
    setSelectedBU('');
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e' }}>
          {mode === 'create' ? '新增企划项目' : '编辑企划项目'}
        </div>
      }
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText={mode === 'create' ? '提交' : '保存'}
      cancelText="取消"
      width={900}
      styles={{
        body: { maxHeight: '75vh', overflowY: 'auto', padding: '24px 24px 0' },
      }}
      okButtonProps={{ style: { background: '#1677ff' } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          initialData
            ? {
                ...initialData,
                projectTime: initialData.projectTime
                  ? dayjs(initialData.projectTime, 'YYYY')
                  : undefined,
                ...initialData.qualitativeFields,
                ...initialData.bigDataFields,
              }
            : {}
        }
        requiredMark="optional"
      >
        {/* 基础信息 */}
        <Title level={5} style={{ color: '#1677ff', borderLeft: '3px solid #1677ff', paddingLeft: 8, margin: '0 0 16px' }}>
          基础信息
        </Title>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="projectName"
              label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="请输入项目名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="projectTime"
              label="项目时间"
              rules={[{ required: true, message: '请选择项目时间' }]}
            >
              <DatePicker picker="year" placeholder="请选择年份" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="salesRegion"
              label="内外销（国家/地区）"
              rules={[{ required: true, message: '请选择国家/地区' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择国家/地区（可多选）"
                maxTagCount="responsive"
                options={SALES_REGION_OPTIONS.map(opt => ({ label: opt.label, value: opt.value }))}
                filterOption={(input, option) =>
                  String(option?.label || '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="researchType"
              label="项目研究类型"
              rules={[{ required: true, message: '请选择项目研究类型' }]}
            >
              <Select placeholder="请选择项目研究类型">
                {RESEARCH_TYPE_OPTIONS.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Space>
                      {opt.label}
                      {opt.description && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          （{opt.description}）
                        </Text>
                      )}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 所属品类 - 二级联动 */}
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="businessUnit"
              label="所属事业部"
              rules={[{ required: true, message: '请选择事业部' }]}
            >
              <Select
                placeholder="请选择事业部"
                onChange={handleBUChange}
                options={BUSINESS_UNIT_OPTIONS.map(bu => ({ label: bu, value: bu }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="category"
              label="所属品类"
              rules={[{ required: true, message: '请选择品类' }]}
            >
              <Select
                placeholder={selectedBU ? '请选择品类' : '请先选择事业部'}
                disabled={!selectedBU}
                options={categoryOptions}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 项目背景信息 */}
        <Divider />
        <Title level={5} style={{ color: '#1677ff', borderLeft: '3px solid #1677ff', paddingLeft: 8, margin: '0 0 16px' }}>
          项目背景信息
        </Title>

        <Form.Item name="projectBackground" label="项目背景">
          <TextArea rows={3} placeholder="请描述项目背景..." />
        </Form.Item>
        <Form.Item name="projectPurpose" label="项目目的">
          <TextArea rows={3} placeholder="请描述项目目的..." />
        </Form.Item>
        <Form.Item name="mainConclusion" label="主要结论/价值提炼">
          <TextArea rows={3} placeholder="请填写主要结论和价值提炼..." />
        </Form.Item>
        <Form.Item name="followUpDirection" label="该项目后续工作方向总结">
          <TextArea rows={3} placeholder="请填写后续工作方向..." />
        </Form.Item>

        {/* 项目执行类型 */}
        <Divider />
        <Title level={5} style={{ color: '#1677ff', borderLeft: '3px solid #1677ff', paddingLeft: 8, margin: '0 0 16px' }}>
          项目执行类型
        </Title>

        <Form.Item
          label="执行类型（可多选）"
          required
          help={
            selectedExecutionTypes.length === 0 ? (
              <Text type="danger" style={{ fontSize: 12 }}>请至少选择一种执行类型</Text>
            ) : (
              <Space size={4} wrap style={{ marginTop: 4 }}>
                {selectedExecutionTypes.map(t => (
                  <Tag key={t} color="blue">{t}</Tag>
                ))}
              </Space>
            )
          }
        >
          <Checkbox.Group
            value={selectedExecutionTypes}
            onChange={(vals) => handleExecutionTypeChange(vals as ExecutionType[])}
          >
            <Space size={16}>
              {EXECUTION_TYPE_OPTIONS.map(opt => (
                <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Form.Item>

        {/* 定性/定量/体验测评 详细字段 */}
        {hasQualitativeType && (
          <div style={{
            background: '#f0f7ff',
            border: '1px solid #91caff',
            borderRadius: 8,
            padding: '16px 20px',
            marginBottom: 16,
          }}>
            <Text strong style={{ color: '#1677ff', display: 'block', marginBottom: 12 }}>
              定性/定量/体验测评 详细信息
            </Text>
            <Form.Item name="executionMethod" label="执行方法">
              <TextArea rows={2} placeholder="请填写执行方法，如：焦点小组访谈、在线问卷等" />
            </Form.Item>
            <Form.Item name="sampleSize" label="样本量">
              <Input placeholder="请填写样本量，如：1200人" />
            </Form.Item>
            <Form.Item name="recruitmentConditions" label="招募条件简述">
              <TextArea rows={2} placeholder="请填写招募条件，如年龄、职业、使用习惯等" />
            </Form.Item>
            <Form.Item name="sampleDistribution" label="样本分布（地理位置等）">
              <TextArea rows={2} placeholder="请填写样本地理分布，如：北上广深各250人" />
            </Form.Item>
            <Form.Item name="rawRecordContent" label="原始笔录内容" style={{ marginBottom: 0 }}>
              <TextArea rows={3} placeholder="请填写原始笔录内容说明" />
            </Form.Item>
          </div>
        )}

        {/* 大数据 详细字段 */}
        {hasBigDataType && (
          <div style={{
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 8,
            padding: '16px 20px',
            marginBottom: 16,
          }}>
            <Text strong style={{ color: '#52c41a', display: 'block', marginBottom: 12 }}>
              大数据 详细信息
            </Text>
            <Form.Item name="dataSource" label="数据源">
              <TextArea rows={2} placeholder="请填写数据来源，如：电商评论、社交媒体等" />
            </Form.Item>
            <Form.Item name="dataAcquisitionMethod" label="数据获取方式">
              <Input placeholder="请填写数据获取方式，如：API接口、爬虫等" />
            </Form.Item>
            <Form.Item name="dataRangeAndCleaning" label="数据范围及清洗规则">
              <TextArea rows={2} placeholder="请填写数据时间范围及清洗处理规则" />
            </Form.Item>
            <Form.Item name="dataVolume" label="数据量" style={{ marginBottom: 0 }}>
              <Input placeholder="请填写数据量，如：50万条" />
            </Form.Item>
          </div>
        )}

        {/* 文件上传 */}
        <Divider />
        <Title level={5} style={{ color: '#1677ff', borderLeft: '3px solid #1677ff', paddingLeft: 8, margin: '0 0 8px' }}>
          附件上传
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
          支持 PPT、PDF、Word、Excel、TXT、图片（JPG/PNG/GIF）、视频（MP4/MOV）等格式
        </Text>

        <Dragger
          fileList={fileList}
          multiple
          accept={ACCEPT_FILE_TYPES}
          beforeUpload={(file) => {
            setFileList(prev => [
              ...prev,
              {
                uid: file.uid,
                name: file.name,
                status: 'done',
                size: file.size,
                type: file.type,
                originFileObj: file,
              },
            ]);
            return false;
          }}
          onRemove={(file) => {
            setFileList(prev => prev.filter(f => f.uid !== file.uid));
          }}
          itemRender={(_, file) => (
            <div
              key={file.uid}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                background: '#fafafa',
                borderRadius: 6,
                marginTop: 6,
                border: '1px solid #f0f0f0',
              }}
            >
              <span style={{ marginRight: 8, fontSize: 16 }}>{getFileIcon(file.name)}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
              {file.size && (
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8, flexShrink: 0 }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              )}
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                style={{ marginLeft: 8, color: '#1677ff', flexShrink: 0 }}
                onClick={() => downloadFile(file)}
                title="下载"
              />
              <Button
                type="text"
                size="small"
                danger
                style={{ marginLeft: 4, flexShrink: 0 }}
                onClick={() => setFileList(prev => prev.filter(f => f.uid !== file.uid))}
              >
                删除
              </Button>
            </div>
          )}
          style={{ marginBottom: 8 }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: '#1677ff', fontSize: 32 }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint" style={{ color: '#999', fontSize: 12 }}>
            支持 PPT、PDF、Word、Excel、TXT、图片、视频等格式，可批量上传
          </p>
        </Dragger>
        <div style={{ height: 24 }} />
      </Form>
    </Modal>
  );
};

export default ProjectForm;
