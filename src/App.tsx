import { ConfigProvider } from 'antd';
import { useState } from 'react';
import ProjectList from './pages/ProjectList';
import AIInterviewPage from './pages/AIInterviewPage';
import { mockProjects } from './data/mockData';
import type { Project, ProjectFile, ExecutionType, AIInterviewFileRef } from './types/project';
import { generateProjectNo } from './types/project';

// 从 AI访谈 MOCK_PROJECTS 提取初始文件列表（定性/定量）
// 直接内联初始数据，避免循环依赖
const INITIAL_AI_FILES: AIInterviewFileRef[] = [
  { id: 'ft101', ftNo: 'FT101', filename: '访谈指南V2.0.docx',           execType: '定性', projectId: 'YY-2024-1001', projectName: '2024年空调新人群需求洞察研究' },
  { id: 'ft102', ftNo: 'FT102', filename: '定量问卷数据报告.xlsx',         execType: '定量', projectId: 'YY-2024-1001', projectName: '2024年空调新人群需求洞察研究' },
  { id: 'ft201', ftNo: 'FT201', filename: '概念测试_深访_上海01.docx',     execType: '定性', projectId: 'YY-2023-1003', projectName: '洗衣机新品概念测试' },
  { id: 'ft202', ftNo: 'FT202', filename: '概念测试_深访_广州01.docx',     execType: '定性', projectId: 'YY-2023-1003', projectName: '洗衣机新品概念测试' },
  { id: 'ft203', ftNo: 'FT203', filename: '概念测试_深访_上海02.docx',     execType: '定性', projectId: 'YY-2023-1003', projectName: '洗衣机新品概念测试' },
  { id: 'ft445', ftNo: 'FT445', filename: '美妆冰箱 彭叶玲.docx',          execType: '定性', projectId: 'YY-2022-0043', projectName: '22年 壁挂式美妆冰箱 创新项目' },
  { id: 'ft444', ftNo: 'FT444', filename: '美妆冰箱 陈娟.doc',             execType: '定性', projectId: 'YY-2022-0043', projectName: '22年 壁挂式美妆冰箱 创新项目' },
  { id: 'ft443', ftNo: 'FT443', filename: '甘丽.docx',                    execType: '定性', projectId: 'YY-2022-0043', projectName: '22年 壁挂式美妆冰箱 创新项目' },
  { id: 'ft442', ftNo: 'FT442', filename: '美妆冰箱 汪佳丽.docx',          execType: '定性', projectId: 'YY-2022-0043', projectName: '22年 壁挂式美妆冰箱 创新项目' },
  { id: 'ft439', ftNo: 'FT439', filename: '风管机购买决策_用户访谈01.docx', execType: '定性', projectId: 'YY-2026-0036', projectName: '风管机购买项目' },
  { id: 'ft438', ftNo: 'FT438', filename: '风管机购买意向_问卷汇总.xlsx',   execType: '定量', projectId: 'YY-2026-0036', projectName: '风管机购买项目' },
  { id: 'ft436', ftNo: 'FT436', filename: '护理柜CDOC_用户需求_问卷.xlsx',  execType: '定量', projectId: 'YY-2024-0040', projectName: '2024年护理柜CDOC' },
];

import './index.css';

function App() {
  const [page, setPage] = useState<'list' | 'interview'>('list');
  // 共享项目列表状态
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  // AI访谈洞察文件列表（供编辑项目时选择）
  const [aiFiles, setAiFiles] = useState<AIInterviewFileRef[]>(INITIAL_AI_FILES);

  const handleSyncFromInterview = (
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
  ) => {
    const now = new Date().toISOString();
    if (action === 'addFile' && payload.projectNo && payload.filename) {
      setProjects(prev => prev.map(p => {
        if (p.projectNo !== payload.projectNo) return p;
        const newFile: ProjectFile = {
          uid: `ai_${Date.now()}`,
          name: payload.filename!,
          status: 'done',
          category: payload.executionType ?? '定性',
        };
        return { ...p, files: [...p.files, newFile], updatedAt: now };
      }));
    } else if (action === 'addProject' && payload.newProjectName) {
      const exTypes = (payload.newExecutionTypes ?? ['定性']) as ExecutionType[];
      const newProject: Project = {
        id: String(Date.now()),
        projectNo: generateProjectNo(),
        projectName: payload.newProjectName,
        salesRegion: ['中国大陆'],
        projectTime: payload.newProjectYear ?? String(new Date().getFullYear()),
        businessUnit: '—',
        category: payload.newProjectCategory ? [payload.newProjectCategory] : [],
        brand: [],
        researchType: '其他专题研究',
        executionType: exTypes,
        projectBackground: { mode: 'manual', value: '' },
        projectPurpose: { mode: 'manual', value: '' },
        mainConclusion: { mode: 'manual', value: '' },
        followUpDirection: { mode: 'manual', value: '' },
        files: payload.filename
          ? [{ uid: `ai_${Date.now()}`, name: payload.filename, status: 'done', category: payload.executionType ?? '定性' }]
          : [],
        createdAt: now,
        updatedAt: now,
        createdBy: '当前用户',
      };
      setProjects(prev => [newProject, ...prev]);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Table: { headerBg: '#f8fafc', headerColor: '#4b5563', rowHoverBg: '#f0f7ff' },
          Modal: { titleFontSize: 16 },
        },
      }}
    >
      {page === 'list' ? (
        <ProjectList
          projects={projects}
          setProjects={setProjects}
          aiFiles={aiFiles}
          onNavigateInterview={() => setPage('interview')}
        />
      ) : (
        <AIInterviewPage
          onBack={() => setPage('list')}
          onSyncToProjectList={handleSyncFromInterview}
          onFilesChange={setAiFiles}
        />
      )}
    </ConfigProvider>
  );
}

export default App;
