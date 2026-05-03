import { create } from 'zustand';

interface ViewStore {
  // 视图状态
  currentView: 'week' | 'day' | 'month' | 'list' | 'schedule';
  selectedDate: string; // ISO 日期字符串
  selectedTimeRange: {
    start: string;
    end: string;
  };
  
  // 视图切换方法
  switchView: (view: 'week' | 'day' | 'month' | 'list' | 'schedule') => void;
  setSelectedDate: (date: string) => void;
  setSelectedTimeRange: (start: string, end: string) => void;
  
  // 日期导航方法
  navigateToToday: () => void;
  navigateToDate: (date: Date) => void;
  navigatePrevious: () => void;
  navigateNext: () => void;
}

export const useViewStore = create<ViewStore>((set, get) => ({
  // 初始状态
  currentView: 'week',
  selectedDate: new Date().toISOString(),
  selectedTimeRange: {
    start: new Date().toISOString(),
    end: new Date().toISOString()
  },
  
  // 视图切换
  switchView: (view) => set({ currentView: view }),
  
  // 设置选中日期
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  // 设置选中时间范围
  setSelectedTimeRange: (start, end) => set({
    selectedTimeRange: { start, end }
  }),
  
  // 导航到今天
  navigateToToday: () => {
    const today = new Date();
    set({
      selectedDate: today.toISOString(),
      selectedTimeRange: {
        start: today.toISOString(),
        end: today.toISOString()
      }
    });
  },
  
  // 导航到指定日期
  navigateToDate: (date) => {
    set({
      selectedDate: date.toISOString(),
      selectedTimeRange: {
        start: date.toISOString(),
        end: date.toISOString()
      }
    });
  },
  
  // 导航到上一个时间单位
  navigatePrevious: () => {
    const { currentView, selectedDate } = get();
    const date = new Date(selectedDate);
    
    switch (currentView) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      default:
        break;
    }
    
    set({
      selectedDate: date.toISOString(),
      selectedTimeRange: {
        start: date.toISOString(),
        end: date.toISOString()
      }
    });
  },
  
  // 导航到下一个时间单位
  navigateNext: () => {
    const { currentView, selectedDate } = get();
    const date = new Date(selectedDate);
    
    switch (currentView) {
      case 'day':
        date.setDate(date.getDate() + 1);
        break;
      case 'week':
        date.setDate(date.getDate() + 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;
      default:
        break;
    }
    
    set({
      selectedDate: date.toISOString(),
      selectedTimeRange: {
        start: date.toISOString(),
        end: date.toISOString()
      }
    });
  }
}));
