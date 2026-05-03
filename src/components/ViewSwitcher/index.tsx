import React from 'react';
import { useViewStore } from '../../store/viewStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Calendar, CalendarDays, List, Clock, ArrowLeft, ArrowRight, Home } from 'lucide-react';

const ViewSwitcher: React.FC = () => {
  const { currentView, switchView, navigatePrevious, navigateNext, navigateToToday, selectedDate } = useViewStore();
  const { settings } = useSettingsStore();
  const isDark = settings.theme === 'dark';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (currentView) {
      case 'day':
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
      case 'schedule':
        return '全部任务';
      default:
        return '';
    }
  };

  const viewItems = [
    { id: 'day', icon: Clock, label: '日' },
    { id: 'week', icon: CalendarDays, label: '周' },
    { id: 'month', icon: Calendar, label: '月' },
    { id: 'schedule', icon: List, label: '日程' },
  ];

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* 视图切换按钮 - 毛玻璃风格 */}
      <div className={`p-1.5 rounded-3xl ${isDark ? 'bg-gray-800/60 border border-gray-700/40' : 'glass'}`}>
        <div className="flex items-center gap-1">
          {viewItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => switchView(item.id as any)}
                className={`flex-1 px-3 py-3 rounded-2xl text-sm font-bold transition-all duration-300 btn-press ${
                  isActive
                    ? `${isDark ? 'bg-gray-700/80 text-rose-400 shadow-lg' : 'bg-white/60 text-rose-600 shadow-lg'}`
                    : `${isDark ? 'text-rose-400/50 hover:bg-gray-700/30' : 'text-rose-400/70 hover:bg-white/30'}`
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 分页控件 - 毛玻璃风格 */}
      <div className={`rounded-3xl p-3 flex items-center justify-between gap-2 ${isDark ? 'bg-gray-800/60 border border-gray-700/40' : 'glass'}`}>
        <button
          onClick={navigatePrevious}
          className={`p-3 rounded-2xl transition-all duration-300 btn-press ${isDark ? 'bg-gray-700/60 text-rose-400 hover:bg-gray-700/90' : 'bg-white/40 text-rose-500 hover:bg-white/60 hover:text-rose-600'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={navigateToToday}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 btn-press ${isDark ? 'bg-gray-700/60 text-rose-400 hover:bg-gray-700/90' : 'bg-white/40 text-rose-600 hover:bg-white/60'}`}
        >
          <Home size={18} />
          <span>今天</span>
        </button>
        <div className={`flex-1 px-4 py-2.5 rounded-2xl text-sm font-bold text-center truncate ${isDark ? 'bg-gray-700/60 text-rose-400' : 'bg-white/40 text-rose-600'}`}>
          {formatDate(selectedDate)}
        </div>
        <button
          onClick={navigateNext}
          className={`p-3 rounded-2xl transition-all duration-300 btn-press ${isDark ? 'bg-gray-700/60 text-rose-400 hover:bg-gray-700/90' : 'bg-white/40 text-rose-500 hover:bg-white/60 hover:text-rose-600'}`}
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ViewSwitcher;
