import React, { useState, useRef, useEffect } from 'react';
import { Button, Typography, Drawer, Spin } from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  SearchOutlined,
  BulbOutlined,
  FileTextOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { Project } from '../types/project';

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'search-result' | 'insight';
  relatedProjects?: { name: string; year: string; conclusion: string }[];
  timestamp: Date;
}

interface AIAgentDrawerProps {
  open: boolean;
  onClose: () => void;
  projects?: Project[];
}

// ─── 快捷指令 ─────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: '🔍', label: '检索空调用户研究报告', query: '检索近3年空调用户研究报告，总结主要结论' },
  { icon: '📊', label: '分析冰箱品类洞察', query: '分析所有冰箱品类用研报告，提炼核心用户需求洞察' },
  { icon: '🧠', label: '洗衣机用户痛点汇总', query: '汇总洗衣机品类所有用研项目中提到的用户痛点' },
  { icon: '💡', label: '最近3年研究趋势', query: '最近3年用研项目的研究趋势和关注重点是什么？' },
];

// ─── Mock AI 回复逻辑 ─────────────────────────────────────────────────
const getMockReply = (query: string, projects: Project[]): Omit<Message, 'id' | 'timestamp'> => {
  const kw = query.toLowerCase();

  // 检索命中的项目
  const matched = projects.filter(p => {
    const text = `${p.projectName} ${p.category?.join(' ')} ${p.businessUnit} ${p.researchType}`.toLowerCase();
    return (
      kw.split(/\s+/).some(w => w.length > 1 && text.includes(w)) ||
      text.includes(kw.slice(0, 4))
    );
  }).slice(0, 4);

  if (kw.includes('空调') || kw.includes('冰箱') || kw.includes('洗衣机') || kw.includes('检索') || kw.includes('汇总') || kw.includes('分析')) {
    const relatedProjects = matched.length > 0
      ? matched.map(p => ({
          name: p.projectName,
          year: p.projectTime,
          conclusion: p.mainConclusion?.value
            ? p.mainConclusion.value.slice(0, 60) + (p.mainConclusion.value.length > 60 ? '…' : '')
            : '（暂无主要结论，可点击项目查看详情）',
        }))
      : [
          { name: '2024年空调新人群需求洞察研究', year: '2024', conclusion: 'Z世代对空调智能化、个性化需求显著，传统功能诉求弱化…' },
          { name: '洗衣机新品概念测试', year: '2023', conclusion: '蒸汽除菌功能获82%正向评价，建议作为主要传播诉求…' },
        ];

    return {
      role: 'assistant',
      type: 'search-result',
      content: `已检索过往用研知识库，为您匹配到 **${relatedProjects.length} 份** 相关报告。以下是 AI 提炼的核心洞察：\n\n${
        relatedProjects.map((p, i) => `**${i + 1}. ${p.name}（${p.year}）**\n${p.conclusion}`).join('\n\n')
      }\n\n**综合结论建议：**\n基于以上报告交叉分析，用户对产品的核心诉求集中在智能化体验、使用便利性和能效比三个维度。建议在下一阶段产品规划中重点关注场景化功能设计。`,
      relatedProjects,
    };
  }

  if (kw.includes('趋势') || kw.includes('重点')) {
    return {
      role: 'assistant',
      type: 'insight',
      content: `**近3年用研项目趋势分析：**\n\n📈 **研究主题变化**\n• 2022年：以产品功能测评、概念测试为主\n• 2023年：转向用户场景深度洞察、新人群研究\n• 2024年：聚焦智能化体验、跨品类协同需求\n\n🎯 **高频研究方向**\n• Z世代/新人群用户行为研究（↑ 显著增长）\n• 智能家居场景整合需求\n• 海外市场用户差异化研究\n\n💡 **建议关注**\n• 跨品类联动场景（厨电 × 生活电器）\n• 老龄化人群的简易操控诉求\n• 以旧换新政策下的购买决策因素`,
    };
  }

  if (kw.includes('项目') && (kw.includes('多少') || kw.includes('几个') || kw.includes('数量'))) {
    return {
      role: 'assistant',
      type: 'text',
      content: `当前用研体验项目库共有 **${projects.length} 个**项目。\n\n按执行类型分布：\n• 定性研究：${projects.filter(p => p.executionType?.includes('定性')).length} 个\n• 定量研究：${projects.filter(p => p.executionType?.includes('定量')).length} 个\n• 大数据分析：${projects.filter(p => p.executionType?.includes('大数据')).length} 个`,
    };
  }

  // 默认回复
  return {
    role: 'assistant',
    type: 'text',
    content: `收到您的指令「${query}」。\n\n我正在检索过往10年用研报告知识库，包含全品类用研报告、用户数据及洞察文档。请稍等片刻，或您可以尝试更具体的检索指令，例如：\n• 「检索 [品类] 近3年用户需求报告」\n• 「分析 [品类] 用户痛点并给出建议」\n• 「对比 [品类A] 和 [品类B] 的用户差异」`,
  };
};

// ─── 消息气泡 ─────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
        <div style={{
          maxWidth: '75%', background: '#1677ff', color: '#fff',
          borderRadius: '16px 16px 4px 16px', padding: '10px 14px',
          fontSize: 13, lineHeight: 1.6,
        }}>
          {msg.content}
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#e6f4ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <UserOutlined style={{ fontSize: 14, color: '#1677ff' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <RobotOutlined style={{ fontSize: 15, color: '#fff' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 检索结果卡片 */}
        {msg.relatedProjects && msg.relatedProjects.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {msg.relatedProjects.map((p, i) => (
              <div key={i} style={{
                background: '#f8fafc', border: '1px solid #e8ecf0',
                borderRadius: 8, padding: '8px 12px', marginBottom: 6,
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <FileTextOutlined style={{ color: '#1677ff', flexShrink: 0, marginTop: 2 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', marginBottom: 2 }}>
                    {p.name}
                    <span style={{ fontWeight: 400, color: '#8c8c8c', marginLeft: 6 }}>{p.year}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.5 }}>{p.conclusion}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* 文本内容（支持简单 markdown 加粗） */}
        <div style={{
          background: msg.type === 'insight' ? 'linear-gradient(135deg, #f9f0ff 0%, #e8f4ff 100%)' : '#f5f7fa',
          border: `1px solid ${msg.type === 'insight' ? '#d3adf7' : '#e8ecf0'}`,
          borderRadius: '4px 16px 16px 16px', padding: '10px 14px',
          fontSize: 13, lineHeight: 1.8, color: '#1a1a2e',
          whiteSpace: 'pre-wrap',
        }}>
          {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={i}>{part.slice(2, -2)}</strong>
              : <span key={i}>{part}</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 4, paddingLeft: 2 }}>
          {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

// ─── 主组件 ──────────────────────────────────────────────────────────
const AIAgentDrawer: React.FC<AIAgentDrawerProps> = ({ open, onClose, projects = [] }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      type: 'text',
      content: '你好！我是 GVOC 用研 AI 助手 🤖\n\n我可以帮你：\n• **检索知识** — 一句话检索过往10年所有用研报告\n• **AI洞察分析** — 跨报告提炼核心结论，触类旁通\n• **总结历史** — 快速汇总历史报告的用户数据与建议\n\n请直接输入你的检索指令，或点击下方快捷指令开始。',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = (query: string) => {
    if (!query.trim() || loading) return;
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    // 模拟 AI 思考延迟
    setTimeout(() => {
      const reply = getMockReply(query, projects);
      const aiMsg: Message = {
        id: `a_${Date.now()}`,
        timestamp: new Date(),
        ...reply,
      };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 900 + Math.random() * 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      closeIcon={null}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
      title={null}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
        background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RobotOutlined style={{ fontSize: 18, color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>GVOC 用研 AI 助手</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>检索知识 · AI洞察分析 · 历史报告总结</div>
        </div>
        <Button
          type="text" icon={<CloseOutlined />}
          onClick={onClose}
          style={{ color: 'rgba(255,255,255,0.8)', border: 'none', background: 'transparent' }}
        />
      </div>

      {/* ── 消息列表 ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RobotOutlined style={{ fontSize: 15, color: '#fff' }} />
            </div>
            <div style={{
              background: '#f5f7fa', border: '1px solid #e8ecf0',
              borderRadius: '4px 16px 16px 16px', padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Spin size="small" />
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>正在检索知识库并分析…</Text>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── 快捷指令 ── */}
      <div style={{ padding: '10px 16px 0', borderTop: '1px solid #f5f5f5', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: '#bfbfbf', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <BulbOutlined style={{ fontSize: 11 }} /> 快捷指令
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {QUICK_PROMPTS.map(p => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.query)}
              disabled={loading}
              style={{
                fontSize: 12, padding: '4px 10px', borderRadius: 16,
                border: '1px solid #e8ecf0', background: '#f8fafc',
                color: '#595959', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = '#1677ff'; (e.currentTarget as HTMLButtonElement).style.color = '#1677ff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8ecf0'; (e.currentTarget as HTMLButtonElement).style.color = '#595959'; }}
            >
              <span>{p.icon}</span>{p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 输入框 ── */}
      <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          border: '1px solid #d9d9d9', borderRadius: 10,
          padding: '8px 10px', background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'border-color 0.2s',
        }}
          onFocus={e => (e.currentTarget.style.borderColor = '#1677ff')}
          onBlur={e => (e.currentTarget.style.borderColor = '#d9d9d9')}
        >
          <SearchOutlined style={{ color: '#bfbfbf', fontSize: 16, marginTop: 4, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入一句话指令，检索用研知识库…"
            disabled={loading}
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 13,
              background: 'transparent', resize: 'none', lineHeight: 1.6,
              color: '#1a1a2e', minWidth: 0,
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            size="small"
            shape="circle"
            disabled={!inputValue.trim() || loading}
            onClick={() => sendMessage(inputValue)}
            style={{ flexShrink: 0 }}
          />
        </div>
        <div style={{ fontSize: 11, color: '#bfbfbf', textAlign: 'center', marginTop: 6 }}>
          Enter 发送 · Shift+Enter 换行 · 涵盖过往10年所有用研报告
        </div>
      </div>
    </Drawer>
  );
};

export default AIAgentDrawer;
