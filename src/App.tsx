
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './presentation/pages/Home';
import Schedule from './presentation/pages/Schedule';
import Settings from './presentation/pages/Settings';
import TaskDetail from './presentation/pages/TaskDetail';
import { Home as HomeIcon, CalendarDays, Settings as SettingsIcon } from 'lucide-react';
import { useSettingsStore } from './store/settingsStore';
import { useTaskStore } from './store/taskStore';
import { useEffect } from 'react';
import {
  initializeNotificationChannel,
  requestNotificationPermission,
  registerNotificationListeners
} from './services/notificationService';

/* ==============================
   毛玻璃底部导航组件
   ============================== */
const BottomNav = () => {
  const location = useLocation();
  const { settings } = useSettingsStore();
  
  const navItems = [
    { path: '/', icon: HomeIcon, label: '首页' },
    { path: '/schedule', icon: CalendarDays, label: '日程' },
    { path: '/settings', icon: SettingsIcon, label: '设置' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-inset-bottom">
      <div className={`glass rounded-3xl px-2 py-3 mx-auto max-w-md ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`}>
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? (settings.theme === 'dark' ? 'bg-gray-700/50 scale-105' : 'bg-white/40 scale-105')
                    : (settings.theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-white/20')
                }`}
              >
                <Icon
                  size={24}
                  className={`transition-all duration-300 ${
                    isActive
                      ? 'text-rose-400 drop-shadow-lg'
                      : (settings.theme === 'dark' ? 'text-gray-400 hover:text-rose-400' : 'text-gray-400 hover:text-rose-400')
                  }`}
                />
                <span className={`text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'text-rose-400'
                    : (settings.theme === 'dark' ? 'text-gray-400 hover:text-rose-400' : 'text-gray-400 hover:text-rose-400')
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ==============================
   主应用组件
   ============================== */
export default function App() {
  const { loadSettings, settings } = useSettingsStore();
  const { loadTasks } = useTaskStore();

  useEffect(() => {
    // 兼容性：清理 zustand persist 中间件产生的旧格式（v4→v5 迁移）
    // 新版已改为手动 localStorage 管理
    loadSettings();
    loadTasks();
    
    // 初始化通知
    const initNotifications = async () => {
      try {
        // 初始化通知渠道
        await initializeNotificationChannel();
        
        // 请求通知权限
        await requestNotificationPermission();
        
        // 注册通知监听器
        registerNotificationListeners((taskId) => {
          // 通知点击时的处理逻辑
          console.log('通知点击:', taskId);
          // 可以在这里添加跳转到任务详情页的逻辑
        });
      } catch (error) {
        console.error('初始化通知失败:', error);
      }
    };
    
    initNotifications();
  }, [loadSettings, loadTasks]);
  
  return (
    <Router>
      <div className={`min-h-screen pb-32 relative z-10 transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/task/:id" element={<TaskDetail />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}
