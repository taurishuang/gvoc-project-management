import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Upload,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Steps,
  Alert,
  Divider,
  Segmented,
} from 'antd';
import {
  InboxOutlined,
  DownloadOutlined,
  RobotOutlined,
  EditOutlined,
  SearchOutlined,
  CheckOutlined,
  FileTextOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import type {
  Project,
  ExecutionType,
  QualQtyFields,
  BigDataFields,
  AIField,
  RegionGroup,
  AIInterviewFileRef,
} from '../types/project';
import {
  REGION_TREE,
  EXECUTION_TYPE_OPTIONS,
  RESEARCH_TYPE_OPTIONS,
  BUSINESS_UNIT_OPTIONS,
  BUSINESS_UNIT_CATEGORY_MAP,
  BRAND_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  generateProjectNo,
  defaultAIField,
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
  aiFiles?: AIInterviewFileRef[];       // AI访谈洞察已上传的文件
  usedAIFileIds?: Set<string>;          // 已归属到其他项目的文件id，不允许再次添加
}

const QUAL_TYPES: ExecutionType[] = ['定性', '定量'];

// 各执行类型允许的文件格式
const EXEC_TYPE_ACCEPT: Record<string, string> = {
  定性: '.mp3,.wav,.aac,.m4a,.mp4,.mov,.avi,.mkv,.wmv,.flac',
  定量: '.doc,.docx,.xls,.xlsx',
  大数据: '.doc,.docx,.xls,.xlsx',
};
const EXEC_TYPE_HINT: Record<string, string> = {
  定性: '支持音频（MP3/WAV/AAC/M4A/FLAC）、视频（MP4/MOV/AVI/MKV）',
  定量: '支持 Word、Excel',
  大数据: '仅支持按模版上传（Excel）',
};
// 综合文件格式
const GENERAL_ACCEPT = '.ppt,.pptx,.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif';
const GENERAL_HINT = '支持 PPT、PDF、Word、Excel、TXT、图片（JPG/PNG/GIF）等格式';

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    pdf: '📄', ppt: '📊', pptx: '📊',
    doc: '📝', docx: '📝', xls: '📈', xlsx: '📈',
    txt: '📃', jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
    gif: '🖼️', mp4: '🎬', mov: '🎬', avi: '🎬',
    mp3: '🎵', wav: '🎵', aac: '🎵', m4a: '🎵',
  };
  return iconMap[ext || ''] || '📎';
};

const downloadFile = (file: UploadFile) => {
  if (file.originFileObj) {
    const url = URL.createObjectURL(file.originFileObj);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; a.click();
    URL.revokeObjectURL(url);
  } else if (file.url) {
    const a = document.createElement('a');
    a.href = file.url; a.download = file.name; a.target = '_blank'; a.click();
  }
};

// ─── 必填 label 帮助函数 ─────────────────────────────────────────────
const ReqLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span>
    <span style={{ color: '#ff4d4f', marginRight: 4, fontFamily: 'SimSun, sans-serif' }}>*</span>
    {children}
  </span>
);

// ─── 级联面板选择器 ──────────────────────────────────────────────────
interface CascadePanelItem { value: string; label: string; }
interface CascadePanelGroup { key: string; label: string; items: CascadePanelItem[]; }

interface CascadePanelProps {
  groups: CascadePanelGroup[];
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** 品牌模式：左侧列表+右侧已选，无左右联动 */
  flatMode?: boolean;
  /** 品类模式：左侧仅作为组标题，条目直接在右侧，不显示组名 */
  categoryMode?: boolean;
  hasError?: boolean;
}

const CascadePanel: React.FC<CascadePanelProps> = ({
  groups, value, onChange, placeholder = '请选择', disabled,
  flatMode = false, categoryMode = false, hasError = false,
}) => {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>(groups[0]?.key || '');
  const [searchText, setSearchText] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // measure trigger width so dropdown matches it
  useEffect(() => {
    if (open && triggerRef.current) {
      setPanelWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const allItems = groups.flatMap(g => g.items);
  // de-duplicate by value
  const uniqueItems = allItems.filter((item, idx, arr) => arr.findIndex(x => x.value === item.value) === idx);
  const selectedSet = new Set(value);

  // ─── 互斥逻辑（仅国家面板使用）──────────────────────────────────
  // asia_china 组与其他所有组互斥
  const CHINA_GROUP_KEY = 'asia_china';
  const chinaGroup = groups.find(g => g.key === CHINA_GROUP_KEY);
  const chinaValues = new Set((chinaGroup?.items || []).map(i => i.value));
  const isChinaValue = (v: string) => chinaValues.has(v);
  const hasNonChinaSelected = value.some(v => !isChinaValue(v));
  const hasChinaSelected = value.some(v => isChinaValue(v));

  // When selecting an item: if it's china, clear all non-china; if non-china, clear all china
  const toggleItem = (v: string) => {
    const next = new Set(selectedSet);
    if (next.has(v)) {
      next.delete(v);
    } else {
      if (!flatMode && !categoryMode) {
        // mutual exclusion for region panel
        if (isChinaValue(v)) {
          // clear all non-china selections
          value.filter(x => !isChinaValue(x)).forEach(x => next.delete(x));
        } else {
          // clear all china selections
          value.filter(x => isChinaValue(x)).forEach(x => next.delete(x));
        }
      }
      next.add(v);
    }
    onChange(Array.from(next));
  };

  const activeGroupObj = groups.find(g => g.key === activeGroup) || groups[0];

  // search filtering
  const filteredGroups = searchText
    ? groups.filter(g => g.label.includes(searchText) || g.items.some(i => i.label.includes(searchText)))
    : groups;

  const getFilteredItems = (items: CascadePanelItem[]) =>
    searchText ? items.filter(i => i.label.includes(searchText)) : items;

  const rightItems = categoryMode
    ? getFilteredItems(activeGroupObj?.items || [])
    : flatMode
      ? getFilteredItems(uniqueItems)
      : getFilteredItems(activeGroupObj?.items || []);

  const groupSelectedCount = (g: CascadePanelGroup) => g.items.filter(i => selectedSet.has(i.value)).length;

  const toggleGroup = (g: CascadePanelGroup) => {
    const allSel = g.items.every(i => selectedSet.has(i.value));
    const next = new Set(selectedSet);
    if (allSel) {
      // deselect all in this group
      g.items.forEach(i => next.delete(i.value));
    } else {
      // select all in this group — apply mutual exclusion for region panel
      if (!flatMode && !categoryMode) {
        if (g.key === CHINA_GROUP_KEY) {
          // clear all non-china
          value.filter(v => !isChinaValue(v)).forEach(v => next.delete(v));
        } else {
          // clear all china
          value.filter(v => isChinaValue(v)).forEach(v => next.delete(v));
        }
      }
      g.items.forEach(i => next.add(i.value));
    }
    onChange(Array.from(next));
  };

  const clearAll = () => onChange([]);
  const selectAll = () => onChange(uniqueItems.map(i => i.value));

  // For region panel: show mutual-exclusion hint in left panel
  const isRegionMode = !flatMode && !categoryMode;

  const selectedLabels = value.map(v => uniqueItems.find(i => i.value === v)?.label || v);

  // Dropdown always matches the trigger width exactly (measured on open)
  const dropdownWidth = panelWidth > 0 ? panelWidth : (flatMode ? 320 : 400);

  const FileItemRow: React.FC<{ item: CascadePanelItem }> = ({ item }) => (
    <div
      onClick={() => toggleItem(item.value)}
      style={{
        padding: '7px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        background: selectedSet.has(item.value) ? '#f0f7ff' : 'transparent',
        transition: 'background 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      <Checkbox checked={selectedSet.has(item.value)} style={{ pointerEvents: 'none' }} />
      <span>{item.label}</span>
    </div>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          minHeight: 32,
          border: `1px solid ${hasError ? '#ff4d4f' : open ? '#1677ff' : '#d9d9d9'}`,
          borderRadius: 6,
          padding: '3px 8px 3px 8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#f5f5f5' : '#fff',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 4,
          boxShadow: open ? '0 0 0 2px rgba(22,119,255,0.1)' : undefined,
          transition: 'border-color 0.2s',
        }}
      >
        {selectedLabels.length === 0 ? (
          <span style={{ color: '#bfbfbf', fontSize: 14, lineHeight: '24px' }}>{placeholder}</span>
        ) : (
          <>
            {selectedLabels.slice(0, 3).map((l, i) => (
              <Tag
                key={value[i]}
                closable
                onClose={e => { e.stopPropagation(); toggleItem(value[i]); }}
                style={{ margin: 0, fontSize: 12 }}
              >
                {l}
              </Tag>
            ))}
            {selectedLabels.length > 3 && (
              <Tag style={{ margin: 0, fontSize: 12 }}>+{selectedLabels.length - 3}</Tag>
            )}
          </>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          zIndex: 9999,
          top: '100%',
          left: 0,
          marginTop: 4,
          background: '#fff',
          border: '1px solid #e8ecf0',
          borderRadius: 8,
          boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
          width: dropdownWidth,
          overflow: 'hidden',
        }}>
          {/* Search bar */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入关键字搜索"
              size="small"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </div>

          {flatMode ? (
            /* ── 品牌：左列表 + 右已选 ── */
            <div style={{ display: 'flex', height: 260 }}>
              <div style={{ width: '55%', borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
                <div style={{ padding: '6px 12px 4px', fontSize: 12, color: '#8c8c8c', fontWeight: 600 }}>
                  品牌 {value.length} / {uniqueItems.length}
                </div>
                {rightItems.map(item => <FileItemRow key={item.value} item={item} />)}
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '6px 12px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>已选 {value.length} 项</span>
                  {value.length > 0 && (
                    <Button type="link" size="small" onClick={clearAll} style={{ padding: 0, fontSize: 12 }}>清空</Button>
                  )}
                </div>
                {value.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: '#bfbfbf' }}>
                    <div style={{ fontSize: 36 }}>📦</div>
                    <div style={{ fontSize: 12, marginTop: 8 }}>暂无数据</div>
                  </div>
                ) : (
                  value.map(v => {
                    const label = uniqueItems.find(i => i.value === v)?.label || v;
                    return (
                      <div key={v} style={{ padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span>{label}</span>
                        <CheckOutlined style={{ color: '#1677ff', fontSize: 12 }} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : categoryMode ? (
            /* ── 品类：左侧事业部导航 + 右侧品类 ── */
            <div style={{ display: 'flex', height: 280 }}>
              <div style={{ width: '42%', borderRight: '1px solid #f0f0f0', overflowY: 'auto', flexShrink: 0 }}>
                {filteredGroups.map(g => {
                  const sel = groupSelectedCount(g);
                  const tot = g.items.length;
                  const isActive = g.key === activeGroup;
                  return (
                    <div
                      key={g.key}
                      onClick={() => setActiveGroup(g.key)}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: isActive ? '#f0f7ff' : 'transparent',
                        borderLeft: `3px solid ${isActive ? '#1677ff' : 'transparent'}`,
                        fontSize: 13,
                        color: isActive ? '#1677ff' : '#1a1a2e',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <Checkbox
                        checked={sel === tot && tot > 0}
                        indeterminate={sel > 0 && sel < tot}
                        onClick={e => { e.stopPropagation(); toggleGroup(g); }}
                        style={{ pointerEvents: 'none' }}
                      />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.label.replace('事业部', '').replace('中国区域', '中国区域')}
                      </span>
                      <span style={{ color: '#bfbfbf', fontSize: 11 }}>›</span>
                    </div>
                  );
                })}
              </div>
              {/* Right: 品类，单列 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                {rightItems.map(item => <FileItemRow key={item.value} item={item} />)}
              </div>
            </div>
          ) : (
            /* ── 国家：左侧大洲 + 右侧国家 2列 ── */
            <div style={{ display: 'flex', height: 300 }}>
              <div style={{ width: 200, borderRight: '1px solid #f0f0f0', overflowY: 'auto', flexShrink: 0 }}>
                {filteredGroups.map(g => {
                  const sel = groupSelectedCount(g);
                  const tot = g.items.length;
                  const isActive = g.key === activeGroup;
                  // mutual exclusion: china group disabled when non-china selected, and vice versa
                  const isChinaGroup = g.key === CHINA_GROUP_KEY;
                  const isDisabled = isRegionMode && (
                    (isChinaGroup && hasNonChinaSelected) ||
                    (!isChinaGroup && hasChinaSelected)
                  );
                  return (
                    <div
                      key={g.key}
                      onClick={() => { if (!isDisabled) { setActiveGroup(g.key); toggleGroup(g); } }}
                      style={{
                        padding: '8px 12px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: isActive && !isDisabled ? '#f0f7ff' : 'transparent',
                        borderLeft: `3px solid ${isActive && !isDisabled ? '#1677ff' : 'transparent'}`,
                        fontSize: 13,
                        color: isDisabled ? '#d9d9d9' : isActive ? '#1677ff' : '#1a1a2e',
                        fontWeight: isActive && !isDisabled ? 600 : 400,
                        opacity: isDisabled ? 0.45 : 1,
                      }}
                    >
                      <Checkbox
                        checked={sel === tot && tot > 0}
                        indeterminate={sel > 0 && sel < tot}
                        disabled={isDisabled}
                        onClick={e => { e.stopPropagation(); if (!isDisabled) toggleGroup(g); }}
                        style={{ pointerEvents: 'none' }}
                      />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label}</span>
                      <span style={{ color: '#bfbfbf', fontSize: 11 }}>›</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0', display: 'grid', gridTemplateColumns: '1fr', alignContent: 'start' }}>
                {rightItems.map(item => {
                  const isChinaItem = isChinaValue(item.value);
                  const itemDisabled = isRegionMode && (
                    (isChinaItem && hasNonChinaSelected) ||
                    (!isChinaItem && hasChinaSelected)
                  );
                  return (
                    <div
                      key={item.value}
                      onClick={() => !itemDisabled && toggleItem(item.value)}
                      style={{
                        padding: '7px 12px',
                        cursor: itemDisabled ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        background: selectedSet.has(item.value) ? '#f0f7ff' : 'transparent',
                        opacity: itemDisabled ? 0.35 : 1,
                        transition: 'background 0.15s',
                      }}
                    >
                      <Checkbox checked={selectedSet.has(item.value)} disabled={itemDisabled} style={{ pointerEvents: 'none' }} />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #f0f0f0', padding: '8px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Space size={12}>
              {!flatMode && !isRegionMode && (
                <Checkbox
                  checked={value.length === uniqueItems.length && uniqueItems.length > 0}
                  indeterminate={value.length > 0 && value.length < uniqueItems.length}
                  onChange={() => value.length === uniqueItems.length ? clearAll() : selectAll()}
                >
                  <span style={{ fontSize: 12 }}>全选</span>
                </Checkbox>
              )}
              <Button type="link" size="small" onClick={clearAll} style={{ padding: 0, fontSize: 12 }}>清空</Button>
            </Space>
            <Space size={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>已选：{value.length} 项</Text>
              <Button type="primary" size="small" onClick={() => setOpen(false)}>确定</Button>
            </Space>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AI Field 组件 ───────────────────────────────────────────────────
const AIFieldInput: React.FC<{ label: string; value: AIField; onChange: (v: AIField) => void }> = ({
  label, value, onChange,
}) => {
  const isAI = value.mode === 'ai';
  return (
    <div style={{
      marginBottom: 16,
      background: '#fafafa',
      border: '1px solid #f0f0f0',
      borderRadius: 8,
      padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text strong style={{ fontSize: 14 }}>{label}</Text>
        <Segmented
          size="small"
          value={isAI ? 'ai' : 'manual'}
          onChange={(v) => {
            const mode = v as 'ai' | 'manual';
            onChange({ mode, value: mode === 'ai' ? '' : value.value });
          }}
          options={[
            { label: <Space size={4}><RobotOutlined /><span>AI提炼</span></Space>, value: 'ai' },
            { label: <Space size={4}><EditOutlined /><span>手动填写</span></Space>, value: 'manual' },
          ]}
        />
      </div>
      {isAI ? (
        <Alert
          type="info" showIcon icon={<RobotOutlined />}
          message="提交后AI将自动从上传的文件中提炼该字段内容"
          style={{ borderRadius: 6, fontSize: 13 }}
        />
      ) : (
        <TextArea
          rows={3} maxLength={500} showCount
          placeholder={`请填写${label}...`}
          value={value.value}
          onChange={(e) => onChange({ mode: 'manual', value: e.target.value })}
        />
      )}
    </div>
  );
};

// ─── 执行类型详细字段子表单 ──────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  定性: { bg: '#f0f7ff', border: '#91caff', text: '#1677ff' },
  定量: { bg: '#fff7e6', border: '#ffd591', text: '#fa8c16' },
};

const QualFieldsForm: React.FC<{
  execType: '定性' | '定量';
  value: Partial<QualQtyFields>;
  onChange: (val: Partial<QualQtyFields>) => void;
  audienceFile: UploadFile | null;
  onAudienceFileChange: (file: UploadFile | null) => void;
}> = ({ execType, value, onChange, audienceFile, onAudienceFileChange }) => {
  const colors = COLOR_MAP[execType];
  const set = (key: keyof QualQtyFields, v: string) => onChange({ ...value, [key]: v });
  return (
    <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
      <Text strong style={{ color: colors.text, display: 'block', marginBottom: 12 }}>「{execType}」详细信息</Text>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="执行方法" style={{ marginBottom: 12 }}>
            <TextArea rows={2} placeholder="如：焦点小组访谈、在线问卷等"
              value={value.executionMethod || ''} onChange={e => set('executionMethod', e.target.value)} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="样本量" style={{ marginBottom: 12 }}>
            <Input placeholder="如：1200人" value={value.sampleSize || ''} onChange={e => set('sampleSize', e.target.value)} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="样本分布" style={{ marginBottom: 12 }}>
            <TextArea rows={2} placeholder="如：北上广深各250人"
              value={value.sampleDistribution || ''} onChange={e => set('sampleDistribution', e.target.value)} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="招募条件" style={{ marginBottom: 12 }}>
            <TextArea rows={2} placeholder="如年龄、职业、使用习惯等"
              value={value.recruitmentConditions || ''} onChange={e => set('recruitmentConditions', e.target.value)} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="原始笔录内容" style={{ marginBottom: execType === '定性' ? 12 : 0 }}>
        <TextArea rows={2} placeholder="请填写原始笔录内容说明"
          value={value.rawRecordContent || ''} onChange={e => set('rawRecordContent', e.target.value)} />
      </Form.Item>
      {execType === '定性' && (
        <>
          <Form.Item label="目标人群" style={{ marginBottom: 12 }}>
            <TextArea rows={2} placeholder="请描述目标人群特征..."
              value={value.targetAudience || ''} onChange={e => set('targetAudience', e.target.value)} />
          </Form.Item>
          <Form.Item
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                人群清单附件（指定模板）
                <Button
                  type="link" size="small"
                  icon={<DownloadOutlined />}
                  style={{ fontSize: 12, padding: 0, height: 'auto' }}
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = '/audience-template.xlsx';
                    a.download = '人群清单模版.xlsx';
                    a.click();
                  }}
                >
                  下载模版
                </Button>
              </span>
            }
            style={{ marginBottom: 0 }}
          >
            <Upload maxCount={1} accept=".xlsx,.xls,.csv"
              fileList={audienceFile ? [audienceFile] : []}
              beforeUpload={(file) => {
                onAudienceFileChange({ uid: file.uid, name: file.name, status: 'done', size: file.size, type: file.type, originFileObj: file });
                return false;
              }}
              onRemove={() => onAudienceFileChange(null)}
            >
              <Button size="small">上传人群清单（Excel/CSV）</Button>
            </Upload>
          </Form.Item>
        </>
      )}
    </div>
  );
};

// ─── 大数据字段子表单 ────────────────────────────────────────────────
const BigDataForm: React.FC<{ value: Partial<BigDataFields>; onChange: (v: Partial<BigDataFields>) => void }> = ({ value, onChange }) => {
  const set = (key: keyof BigDataFields, v: string) => onChange({ ...value, [key]: v });
  return (
    <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
      <Text strong style={{ color: '#52c41a', display: 'block', marginBottom: 12 }}>「大数据」详细信息</Text>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="数据源" style={{ marginBottom: 12 }}>
            <TextArea rows={2} placeholder="如：电商评论、社交媒体等"
              value={value.dataSource || ''} onChange={e => set('dataSource', e.target.value)} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="获取方式" style={{ marginBottom: 12 }}>
            <Input placeholder="如：API接口、爬虫等"
              value={value.dataAcquisitionMethod || ''} onChange={e => set('dataAcquisitionMethod', e.target.value)} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="范围及清洗规则" style={{ marginBottom: 0 }}>
            <TextArea rows={2} placeholder="请填写数据时间范围及清洗处理规则"
              value={value.dataRangeAndCleaning || ''} onChange={e => set('dataRangeAndCleaning', e.target.value)} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="数据量" style={{ marginBottom: 0 }}>
            <Input placeholder="如：50万条" value={value.dataVolume || ''} onChange={e => set('dataVolume', e.target.value)} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

// ─── 文件上传区块（带格式限制）──────────────────────────────────────
const FileUploadBlock: React.FC<{
  catKey: string;
  fileList: UploadFile[];
  onAdd: (file: UploadFile) => void;
  onRemove: (uid: string) => void;
  aiFiles?: AIInterviewFileRef[];   // 仅定性/定量时传入
  usedAIFileIds?: Set<string>;      // 已归属到其他项目的文件id
  isBigData?: boolean;              // 大数据：仅 .xlsx，显示模版下载
}> = ({ catKey, fileList, onAdd, onRemove, aiFiles = [], usedAIFileIds = new Set(), isBigData = false }) => {
  const accept = isBigData ? '.xlsx' : (catKey === '综合' ? GENERAL_ACCEPT : (EXEC_TYPE_ACCEPT[catKey] || GENERAL_ACCEPT));
  const hint = catKey === '综合' ? GENERAL_HINT : (EXEC_TYPE_HINT[catKey] || GENERAL_HINT);

  // 已从AI访谈选入的文件uid集合（用于显示高亮）
  const selectedAIUids = new Set(fileList.filter(f => f.uid.startsWith('ai_')).map(f => f.uid));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  // 过滤：当前类型 + 搜索关键字
  const filteredAIFiles = aiFiles.filter(af => {
    const kw = searchText.trim().toLowerCase();
    if (!kw) return true;
    return af.filename.toLowerCase().includes(kw) || af.ftNo.toLowerCase().includes(kw) || af.projectName.toLowerCase().includes(kw);
  });

  const handleSelectAIFile = (af: AIInterviewFileRef) => {
    // 已在 fileList 中则不重复添加
    if (fileList.some(f => f.uid === `ai_${af.id}`)) return;
    onAdd({ uid: `ai_${af.id}`, name: af.filename, status: 'done' });
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Text strong style={{ fontSize: 13 }}>
          {catKey === '综合' ? '综合文件' : `「${catKey}」相关文件`}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>（{hint}）</Text>
        {isBigData && (
          <Button
            size="small"
            icon={<DownloadOutlined />}
            style={{ marginLeft: 'auto', fontSize: 12 }}
            onClick={() => {
              const a = document.createElement('a');
              a.href = '/bigdata-template.xlsx';
              a.download = '大数据上传模版.xlsx';
              a.click();
            }}
          >
            下载模版
          </Button>
        )}
      </div>
      <Dragger
        fileList={fileList.filter(f => !f.uid.startsWith('ai_'))}
        multiple
        accept={accept}
        beforeUpload={(file) => {
          onAdd({ uid: file.uid, name: file.name, status: 'done', size: file.size, type: file.type, originFileObj: file });
          return false;
        }}
        onRemove={(file) => onRemove(file.uid)}
        itemRender={(_, file) => (
          <div key={file.uid} style={{
            display: 'flex', alignItems: 'center', padding: '4px 10px',
            background: '#fafafa', borderRadius: 6, marginTop: 4,
            border: '1px solid #f0f0f0',
          }}>
            <span style={{ marginRight: 8, fontSize: 14 }}>{getFileIcon(file.name)}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{file.name}</span>
            {file.size && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 8, flexShrink: 0 }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            )}
            <Button type="text" size="small" icon={<DownloadOutlined />}
              style={{ marginLeft: 8, color: '#1677ff', flexShrink: 0 }}
              onClick={() => downloadFile(file)} />
            <Button type="text" size="small" danger style={{ marginLeft: 4, flexShrink: 0 }}
              onClick={() => onRemove(file.uid)}>
              删除
            </Button>
          </div>
        )}
        style={{ padding: '6px 0' }}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#1677ff', fontSize: 22 }} /></p>
        <p className="ant-upload-text" style={{ fontSize: 13 }}>点击或拖拽文件上传</p>
      </Dragger>

      {/* 已从AI访谈添加的文件单独展示 */}
      {fileList.filter(f => f.uid.startsWith('ai_')).map(f => {
        // 从 uid 反查 ftNo（uid 格式为 ai_${af.id}）
        const afId = f.uid.replace(/^ai_/, '');
        const ftNo = aiFiles.find(af => af.id === afId)?.ftNo || '';
        return (
          <div key={f.uid} style={{
            display: 'flex', alignItems: 'center', padding: '4px 10px',
            background: '#f0f7ff', borderRadius: 6, marginTop: 4,
            border: '1px solid #91caff',
          }}>
            <LinkOutlined style={{ marginRight: 8, fontSize: 13, color: '#1677ff', flexShrink: 0 }} />
            {ftNo && (
              <span style={{ fontSize: 11, color: '#1677ff', fontWeight: 600, marginRight: 6, flexShrink: 0, background: '#e6f4ff', borderRadius: 4, padding: '0 5px' }}>
                {ftNo}
              </span>
            )}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{f.name}</span>
            <Button type="text" size="small" danger style={{ marginLeft: 8, flexShrink: 0 }}
              onClick={() => onRemove(f.uid)}>
              删除
            </Button>
          </div>
        );
      })}

      {/* 搜索添加访谈文件（仅定性/定量显示） */}
      {(catKey === '定性' || catKey === '定量') && (
        <div style={{ marginTop: 8 }}>
          <Button
            size="small"
            icon={<LinkOutlined />}
            style={{ fontSize: 12, color: '#1677ff', borderColor: '#91caff', background: '#f0f7ff' }}
            onClick={() => { setPickerOpen(v => !v); setSearchText(''); }}
          >
            搜索添加访谈文件{aiFiles.length > 0 ? `（${aiFiles.length}个可选）` : ''}
          </Button>

          {pickerOpen && (
            <div style={{
              marginTop: 8, border: '1px solid #d9d9d9', borderRadius: 8,
              background: '#fafcff', overflow: 'hidden',
            }}>
              {/* 搜索框 */}
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                <Input
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="搜索文件名、访谈编号"
                  size="small"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                />
              </div>
              {/* 表头 */}
              <div style={{
                padding: '6px 12px', background: '#f0f7ff',
                borderBottom: '1px solid #d9d9d9',
                fontSize: 12, color: '#6b7280', fontWeight: 500,
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <span style={{ width: 72, flexShrink: 0 }}>访谈编号</span>
                <span style={{ flex: 1 }}>文件名</span>
                <span style={{ width: 52, flexShrink: 0 }}>操作</span>
              </div>
              {filteredAIFiles.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#bfbfbf', fontSize: 13 }}>
                  暂无匹配的访谈文件
                </div>
              ) : (
                filteredAIFiles.map(af => {
                  const alreadyAdded = selectedAIUids.has(`ai_${af.id}`);
                  const isUsed = usedAIFileIds.has(af.id);
                  const disabled = isUsed && !alreadyAdded;
                  return (
                    <div key={af.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 12px', borderBottom: '1px solid #f0f0f0',
                      fontSize: 12,
                      background: disabled ? '#fafafa' : 'transparent',
                      opacity: disabled ? 0.5 : 1,
                    }}
                      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#e8f4ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = disabled ? '#fafafa' : ''; }}
                    >
                      <span style={{ width: 72, flexShrink: 0, color: '#1677ff', fontWeight: 500 }}>{af.ftNo}</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <FileTextOutlined style={{ color: '#1677ff', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a1a2e' }}>
                          {af.filename}
                        </span>
                        {/* 已归属项目的显示项目名标签 */}
                        {af.projectName && isUsed && !alreadyAdded && (
                          <span style={{ fontSize: 11, color: '#8c8c8c', background: '#f5f5f5', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
                            {af.projectName}
                          </span>
                        )}
                      </div>
                      <div style={{ width: 52, flexShrink: 0 }}>
                        {alreadyAdded ? (
                          <span style={{ fontSize: 11, color: '#52c41a' }}>已添加</span>
                        ) : disabled ? (
                          <span style={{ fontSize: 11, color: '#bfbfbf' }}>已归属</span>
                        ) : (
                          <Button
                            type="link" size="small"
                            style={{ padding: 0, fontSize: 12 }}
                            onClick={() => handleSelectAIFile(af)}
                          >
                            添加
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── 主表单组件 ──────────────────────────────────────────────────────
const ProjectForm: React.FC<ProjectFormProps> = ({
  open, onClose, onSubmit, initialData, mode = 'create', aiFiles = [], usedAIFileIds = new Set(),
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBU, setSelectedBU] = useState<string>(initialData?.businessUnit || '');
  const [selectedExecutionTypes, setSelectedExecutionTypes] = useState<ExecutionType[]>(initialData?.executionType || []);
  const [qualFieldsMap, setQualFieldsMap] = useState<Partial<Record<'定性' | '定量', Partial<QualQtyFields>>>>(initialData?.qualFields || {});
  const [bigDataFields, setBigDataFields] = useState<Partial<BigDataFields>>(initialData?.bigDataFields || {});
  const [audienceFileMap, setAudienceFileMap] = useState<Record<string, UploadFile | null>>({});
  const [fileListMap, setFileListMap] = useState<Record<string, UploadFile[]>>({ 定性: [], 定量: [], 大数据: [], 综合: [] });
  const [projectTypeVal, setProjectTypeVal] = useState<string[]>(initialData?.projectType || []);
  const [aiFields, setAiFields] = useState({
    projectBackground: initialData?.projectBackground || defaultAIField('ai'),
    projectPurpose: initialData?.projectPurpose || defaultAIField('ai'),
    mainConclusion: initialData?.mainConclusion || defaultAIField('ai'),
    followUpDirection: initialData?.followUpDirection || defaultAIField('ai'),
  });
  const [salesRegionVal, setSalesRegionVal] = useState<string[]>(initialData?.salesRegion || []);
  const [categoryVal, setCategoryVal] = useState<string[]>(initialData?.category || []);
  const [brandVal, setBrandVal] = useState<string[]>(initialData?.brand || []);
  const [salesRegionError, setSalesRegionError] = useState(false);
  const [execTypeError, setExecTypeError] = useState(false);

  useEffect(() => {
    if (open) {
      setSalesRegionVal(initialData?.salesRegion || []);
      setCategoryVal(initialData?.category || []);
      setBrandVal(initialData?.brand || []);
      setSelectedBU(initialData?.businessUnit || '');
      setSelectedExecutionTypes(initialData?.executionType || []);
      setQualFieldsMap(initialData?.qualFields || {});
      setBigDataFields(initialData?.bigDataFields || {});
      setProjectTypeVal(initialData?.projectType || []);
      setSalesRegionError(false);
      setExecTypeError(false);
      setAiFields({
        projectBackground: initialData?.projectBackground || defaultAIField('ai'),
        projectPurpose: initialData?.projectPurpose || defaultAIField('ai'),
        mainConclusion: initialData?.mainConclusion || defaultAIField('ai'),
        followUpDirection: initialData?.followUpDirection || defaultAIField('ai'),
      });
      if (initialData?.files) {
        const newMap: Record<string, UploadFile[]> = { 定性: [], 定量: [], 大数据: [], 综合: [] };
        initialData.files.forEach(f => {
          const cat = f.category || '综合';
          if (!newMap[cat]) newMap[cat] = [];
          newMap[cat].push({ uid: f.uid, name: f.name, status: 'done', url: f.url });
        });
        setFileListMap(newMap);
      } else {
        setFileListMap({ 定性: [], 定量: [], 大数据: [], 综合: [] });
      }
    }
  }, [open, initialData]);

  const regionGroups: CascadePanelGroup[] = REGION_TREE.map((g: RegionGroup) => ({
    key: g.key,
    label: g.label,
    items: g.countries,
  }));

  const categoryGroups: CascadePanelGroup[] = Object.entries(BUSINESS_UNIT_CATEGORY_MAP).map(([bu, cats]) => ({
    key: bu,
    label: bu,
    items: cats.map(c => ({ label: c, value: c })),
  }));

  const brandGroups: CascadePanelGroup[] = [
    { key: 'brand', label: '品牌', items: BRAND_OPTIONS.map(b => ({ label: b, value: b })) },
  ];

  const handleBUChange = (bu: string) => {
    setSelectedBU(bu);
    setCategoryVal([]);
  };

  const allFiles = Object.entries(fileListMap).flatMap(([cat, files]) =>
    files.map(f => ({ ...f, category: cat }))
  );

  const addFile = (catKey: string, file: UploadFile) =>
    setFileListMap(prev => ({ ...prev, [catKey]: [...(prev[catKey] || []), file] }));

  const removeFile = (catKey: string, uid: string) =>
    setFileListMap(prev => ({ ...prev, [catKey]: (prev[catKey] || []).filter(f => f.uid !== uid) }));

  const validateStep1 = async () => {
    await form.validateFields(['projectName', 'projectTime', 'businessUnit', 'researchType']);
    if (salesRegionVal.length === 0) {
      setSalesRegionError(true);
      throw new Error('请选择国家');
    }
    setSalesRegionError(false);
  };

  const validateStep2 = () => {
    if (selectedExecutionTypes.length === 0) {
      setExecTypeError(true);
      throw new Error('请至少选择一种执行类型');
    }
    setExecTypeError(false);
  };

  const handleNext = async () => {
    try {
      if (currentStep === 0) await validateStep1();
      if (currentStep === 1) validateStep2();
      setCurrentStep(s => s + 1);
    } catch { /* errors shown inline */ }
  };

  const handleSubmit = () => {
    form.validateFields(['projectName', 'projectTime', 'businessUnit', 'researchType']).then(values => {
      const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
        projectNo: initialData?.projectNo || generateProjectNo(),
        projectName: values.projectName,
        salesRegion: salesRegionVal,
        projectTime: values.projectTime ? dayjs(values.projectTime).format('YYYY') : '',
        businessUnit: values.businessUnit,
        category: categoryVal,
        brand: brandVal,
        researchType: values.researchType,
        projectType: projectTypeVal.length > 0 ? projectTypeVal : undefined,
        executionType: selectedExecutionTypes,
        qualFields: Object.keys(qualFieldsMap).length > 0
          ? (qualFieldsMap as Partial<Record<'定性' | '定量', QualQtyFields>>)
          : undefined,
        bigDataFields: selectedExecutionTypes.includes('大数据') ? (bigDataFields as BigDataFields) : undefined,
        projectBackground: aiFields.projectBackground,
        projectPurpose: aiFields.projectPurpose,
        mainConclusion: aiFields.mainConclusion,
        followUpDirection: aiFields.followUpDirection,
        files: [
          ...allFiles.map(f => ({
            uid: f.uid, name: f.name, url: f.url as string | undefined,
            size: f.size, type: f.type, status: 'done' as const,
            category: (f as { category?: string }).category || '综合',
          })),
        ],
      };
      onSubmit(projectData);
      handleClose();
    }).catch(() => { /* stay */ });
  };

  const handleClose = () => {
    form.resetFields();
    setCurrentStep(0);
    setSelectedBU('');
    setSelectedExecutionTypes([]);
    setQualFieldsMap({});
    setBigDataFields({});
    setAudienceFileMap({});
    setFileListMap({ 定性: [], 定量: [], 大数据: [], 综合: [] });
    setProjectTypeVal([]);
    setSalesRegionVal([]);
    setCategoryVal([]);
    setBrandVal([]);
    setSalesRegionError(false);
    setExecTypeError(false);
    setAiFields({
      projectBackground: defaultAIField('ai'),
      projectPurpose: defaultAIField('ai'),
      mainConclusion: defaultAIField('ai'),
      followUpDirection: defaultAIField('ai'),
    });
    onClose();
  };

  const steps = [{ title: '基础信息' }, { title: '执行信息' }, { title: '背景信息' }];

  // ─── Step 1 ───────────────────────────────────────────────────────
  const Step1 = (
    <div>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="projectName"
            label={<ReqLabel>项目名称</ReqLabel>}
            rules={[{ required: true, message: '请输入项目名称' }, { max: 100, message: '最多100字' }]}
          >
            <Input placeholder="请输入项目名称（最多100字）" showCount maxLength={100} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="projectTime"
            label={<ReqLabel>项目时间</ReqLabel>}
            rules={[{ required: true, message: '请选择项目时间' }]}
          >
            <DatePicker picker="year" placeholder="请选择年份" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label={<ReqLabel>国家</ReqLabel>}>
            <CascadePanel
              groups={regionGroups}
              value={salesRegionVal}
              onChange={v => { setSalesRegionVal(v); if (v.length > 0) setSalesRegionError(false); }}
              placeholder="请选择国家（可多选）"
              hasError={salesRegionError}
            />
            {salesRegionError && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>请选择国家</div>
            )}
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="researchType"
            label={<ReqLabel>研究类型</ReqLabel>}
            rules={[{ required: true, message: '请选择研究类型' }]}
          >
            <Select placeholder="请选择研究类型">
              {RESEARCH_TYPE_OPTIONS.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>
                  <Space>
                    {opt.label}
                    {opt.description && (
                      <Text type="secondary" style={{ fontSize: 12 }}>（{opt.description}）</Text>
                    )}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="businessUnit"
            label={<ReqLabel>所属事业部</ReqLabel>}
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
          <Form.Item label="所属品类">
            <CascadePanel
              groups={categoryGroups}
              value={categoryVal}
              onChange={setCategoryVal}
              placeholder={selectedBU ? '请选择品类（可多选）' : '请先选择事业部'}
              disabled={!selectedBU}
              categoryMode
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label="品牌">
            <CascadePanel
              groups={brandGroups}
              value={brandVal}
              onChange={setBrandVal}
              placeholder="请选择品牌（可多选，选填）"
              flatMode
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="项目类型">
            <Checkbox.Group
              options={PROJECT_TYPE_OPTIONS}
              value={projectTypeVal}
              onChange={v => setProjectTypeVal(v as string[])}
            />
          </Form.Item>
        </Col>
      </Row>

      {mode === 'edit' && initialData?.projectNo && (
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label="项目编号">
              <Input value={initialData.projectNo} disabled />
            </Form.Item>
          </Col>
        </Row>
      )}
    </div>
  );

  // ─── Step 2 ───────────────────────────────────────────────────────
  const Step2 = (
    <div>
      <Form.Item label={<ReqLabel>项目执行类型（多选）</ReqLabel>}>
        <Checkbox.Group
          value={selectedExecutionTypes}
          onChange={(vals) => {
            setSelectedExecutionTypes(vals as ExecutionType[]);
            if ((vals as ExecutionType[]).length > 0) setExecTypeError(false);
          }}
        >
          <Space size={16}>
            {EXECUTION_TYPE_OPTIONS.map(opt => (
              <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
        {execTypeError && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>请至少选择一种执行类型</div>
        )}
        {selectedExecutionTypes.length > 0 && (
          <Space size={4} wrap style={{ marginTop: 8 }}>
            {selectedExecutionTypes.map(t => <Tag key={t} color="blue">{t}</Tag>)}
          </Space>
        )}
      </Form.Item>

      {QUAL_TYPES.filter(t => selectedExecutionTypes.includes(t)).map(t => (
        <QualFieldsForm
          key={t}
          execType={t as '定性' | '定量'}
          value={qualFieldsMap[t as '定性' | '定量'] || {}}
          onChange={(val) => setQualFieldsMap(prev => ({ ...prev, [t]: val }))}
          audienceFile={audienceFileMap[t] || null}
          onAudienceFileChange={(file) => setAudienceFileMap(prev => ({ ...prev, [t]: file }))}
        />
      ))}

      {selectedExecutionTypes.includes('大数据') && (
        <BigDataForm value={bigDataFields} onChange={setBigDataFields} />
      )}

      <Divider style={{ margin: '8px 0 16px' }} />

      <Title level={5} style={{ color: '#1677ff', borderLeft: '3px solid #1677ff', paddingLeft: 8, margin: '0 0 12px' }}>
        附件上传
      </Title>

      {selectedExecutionTypes.map(cat => (
        <FileUploadBlock
          key={cat}
          catKey={cat}
          fileList={fileListMap[cat] || []}
          onAdd={(f) => addFile(cat, f)}
          onRemove={(uid) => removeFile(cat, uid)}
          aiFiles={aiFiles.filter(af => af.execType === cat)}
          usedAIFileIds={usedAIFileIds}
          isBigData={cat === '大数据'}
        />
      ))}

      <FileUploadBlock
        catKey="综合"
        fileList={fileListMap['综合'] || []}
        onAdd={(f) => addFile('综合', f)}
        onRemove={(uid) => removeFile('综合', uid)}
      />
    </div>
  );

  // ─── Step 3 ───────────────────────────────────────────────────────
  const Step3 = (
    <div>
      <Alert
        type="info" showIcon icon={<RobotOutlined />}
        message='默认「AI提炼」模式，提交后自动从文件中提炼内容。可切换为「手动填写」。'
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <AIFieldInput label="项目背景" value={aiFields.projectBackground}
        onChange={(v) => setAiFields(prev => ({ ...prev, projectBackground: v }))} />
      <AIFieldInput label="项目目的" value={aiFields.projectPurpose}
        onChange={(v) => setAiFields(prev => ({ ...prev, projectPurpose: v }))} />
      <AIFieldInput label="主要结论/价值提炼" value={aiFields.mainConclusion}
        onChange={(v) => setAiFields(prev => ({ ...prev, mainConclusion: v }))} />
      <AIFieldInput label="后续工作方向" value={aiFields.followUpDirection}
        onChange={(v) => setAiFields(prev => ({ ...prev, followUpDirection: v }))} />
    </div>
  );

  const stepContents = [Step1, Step2, Step3];

  return (
    <Modal
      title={
        <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e' }}>
          {mode === 'create' ? '新增用研体验项目' : '编辑用研体验项目'}
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {currentStep > 0 && <Button onClick={() => setCurrentStep(s => s - 1)}>上一步</Button>}
          </div>
          <Space>
            <Button onClick={handleClose}>取消</Button>
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>下一步</Button>
            ) : (
              <Button type="primary" onClick={handleSubmit}>{mode === 'create' ? '提交' : '保存'}</Button>
            )}
          </Space>
        </div>
      }
      width={920}
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto', padding: '16px 24px 0' } }}
    >
      <Steps current={currentStep} items={steps} size="small" style={{ marginBottom: 24 }} />
      <Form
        form={form}
        layout="vertical"
        initialValues={initialData ? {
          projectName: initialData.projectName,
          projectTime: initialData.projectTime ? dayjs(initialData.projectTime, 'YYYY') : undefined,
          businessUnit: initialData.businessUnit,
          researchType: initialData.researchType,
        } : {}}
        requiredMark={false}
      >
        {stepContents[currentStep]}
      </Form>
    </Modal>
  );
};

export default ProjectForm;
