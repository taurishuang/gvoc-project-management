import { ConfigProvider } from 'antd';
import ProjectList from './pages/ProjectList';
import './index.css';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#4b5563',
            rowHoverBg: '#f0f7ff',
          },
          Modal: {
            titleFontSize: 16,
          },
        },
      }}
    >
      <ProjectList />
    </ConfigProvider>
  );
}

export default App;
