import React, { useState, useEffect, useRef } from 'react';
import { Repeat, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Task } from '../../types';
import { getLocalDateStr } from '../../utils/recurrenceUtils';

interface RecurrenceSettingsProps {
  recurrence: Task['recurrence'];
  onUpdateRecurrence: (recurrence: Task['recurrence']) => void;
  onCancel: () => void;
  onSave: () => void;
}

const RecurrenceSettings: React.FC<RecurrenceSettingsProps> = ({
  recurrence,
  onUpdateRecurrence,
  onCancel,
  onSave
}) => {
  const [localRecurrence, setLocalRecurrence] = useState(recurrence);
  const [activeTab, setActiveTab] = useState<'recurrence' | 'end' | 'exceptions'>('recurrence');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exceptionDate, setExceptionDate] = useState('');
  const exceptionDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalRecurrence(recurrence);
  }, [recurrence]);

  const handleEnabledChange = (enabled: boolean) => {
    setLocalRecurrence(prev => ({
      ...prev,
      enabled
    }));
  };

  const handleFrequencyChange = (type: Task['recurrence']['type']) => {
    setLocalRecurrence(prev => ({
      ...prev,
      type
    }));
  };

  const handleIntervalChange = (interval: number) => {
    setLocalRecurrence(prev => ({
      ...prev,
      interval
    }));
  };

  const handleDaysChange = (day: number) => {
    setLocalRecurrence(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort()
    }));
  };

  const handleEndTypeChange = (type: Task['recurrence']['end']['type']) => {
    setLocalRecurrence(prev => ({
      ...prev,
      end: {
        type,
        count: type === 'after' ? (prev.end.count || 1) : undefined,
        date: type === 'on' ? (prev.end.date || new Date().toISOString()) : undefined
      } as any
    }));
  };

  const handleEndCountChange = (count: number) => {
    setLocalRecurrence(prev => ({
      ...prev,
      end: {
        ...prev.end,
        count
      }
    }));
  };

  const handleEndDateChange = (date: string) => {
    setLocalRecurrence(prev => ({
      ...prev,
      end: {
        ...prev.end,
        date
      }
    }));
  };

  const handleAddException = (date: string) => {
    setLocalRecurrence(prev => ({
      ...prev,
      exceptions: [...prev.exceptions, date]
    }));
  };

  const handleRemoveException = (date: string) => {
    setLocalRecurrence(prev => ({
      ...prev,
      exceptions: prev.exceptions.filter(ex => ex !== date)
    }));
  };

  const handleSave = () => {
    onUpdateRecurrence(localRecurrence);
    onSave();
  };

  const weekDays = [
    { value: 0, label: '周日' },
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' }
  ];

  return (
    <div className="bg-white rounded-[28px] p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Repeat size={24} className="text-pink-400" />
          <h2 className="text-2xl font-semibold text-gray-800">重复设置</h2>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* 重复开关 */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <span className="text-lg font-medium text-gray-700">重复</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localRecurrence.enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
        </label>
      </div>

      {localRecurrence.enabled && (
        <>
          {/* 选项卡 */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('recurrence');
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'recurrence'
                  ? 'text-pink-500 border-b-2 border-pink-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              重复规则
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('end');
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'end'
                  ? 'text-pink-500 border-b-2 border-pink-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >结束条件</button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('exceptions');
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'exceptions'
                  ? 'text-pink-500 border-b-2 border-pink-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              例外日期
            </button>
          </div>

          {/* 重复规则 */}
          {activeTab === 'recurrence' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">频率</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'daily', label: '每天' },
                    { value: 'weekly', label: '每周' },
                    { value: 'monthly', label: '每月' },
                    { value: 'yearly', label: '每年' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFrequencyChange(option.value as Task['recurrence']['type']);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        localRecurrence.type === option.value
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">间隔</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={localRecurrence.interval}
                    onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  <span className="text-gray-600">
                    {localRecurrence.type === 'daily' ? '天' :
                     localRecurrence.type === 'weekly' ? '周' :
                     localRecurrence.type === 'monthly' ? '月' : '年'}
                  </span>
                </div>
              </div>

              {localRecurrence.type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择星期</label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDaysChange(day.value);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          localRecurrence.days.includes(day.value)
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAdvanced(!showAdvanced);
                }}
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 transition-colors"
              >
                {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>高级设置</span>
              </button>

              {showAdvanced && (
                <div className="pl-4 border-l-2 border-gray-100 py-2">
                  {/* 这里可以添加更多高级设置 */}
                  <p className="text-sm text-gray-500">高级设置功能即将推出</p>
                </div>
              )}

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">预览</p>
                <p className="text-gray-600">
                  {localRecurrence.type === 'daily' && `每 ${localRecurrence.interval} 天重复`}
                  {localRecurrence.type === 'weekly' && `每 ${localRecurrence.interval} 周的 ${localRecurrence.days.map(d => weekDays[d].label).join('、')} 重复`}
                  {localRecurrence.type === 'monthly' && `每 ${localRecurrence.interval} 个月重复`}
                  {localRecurrence.type === 'yearly' && `每 ${localRecurrence.interval} 年重复`}
                </p>
              </div>
            </div>
          )}

          {/* 结束条件 */}
          {activeTab === 'end' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">结束方式</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="end-never"
                      name="end-type"
                      checked={localRecurrence.end.type === 'never'}
                      onChange={() => handleEndTypeChange('never')}
                      className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300"
                    />
                    <label htmlFor="end-never" className="ml-2 text-sm text-gray-700">
                      永不结束
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="end-after"
                      name="end-type"
                      checked={localRecurrence.end.type === 'after'}
                      onChange={() => handleEndTypeChange('after')}
                      className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300"
                    />
                    <label htmlFor="end-after" className="ml-2 text-sm text-gray-700">
                      重复指定次数后结束
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="end-on"
                      name="end-type"
                      checked={localRecurrence.end.type === 'on'}
                      onChange={() => handleEndTypeChange('on')}
                      className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300"
                    />
                    <label htmlFor="end-on" className="ml-2 text-sm text-gray-700">
                      在指定日期结束
                    </label>
                  </div>
                </div>
              </div>

              {localRecurrence.end.type === 'after' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">重复次数</label>
                  <input
                    type="number"
                    min="1"
                    value={localRecurrence.end.count || 1}
                    onChange={(e) => handleEndCountChange(parseInt(e.target.value) || 1)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              )}

              {localRecurrence.end.type === 'on' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
                  <input
                    type="date"
                    value={localRecurrence.end.date ? new Date(localRecurrence.end.date).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleEndDateChange(new Date(e.target.value).toISOString())}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              )}

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">预览</p>
                <p className="text-gray-600">
                  {localRecurrence.end.type === 'never' && '永不结束'}
                  {localRecurrence.end.type === 'after' && `重复 ${localRecurrence.end.count} 次后结束`}
                  {localRecurrence.end.type === 'on' && `在 ${localRecurrence.end.date ? new Date(localRecurrence.end.date).toLocaleDateString() : ''} 结束`}
                </p>
              </div>
            </div>
          )}

          {/* 例外日期 */}
          {activeTab === 'exceptions' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">例外日期</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    ref={exceptionDateRef}
                    value={exceptionDate}
                    onChange={(e) => setExceptionDate(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (exceptionDate) {
                        handleAddException(getLocalDateStr(new Date(exceptionDate)));
                        setExceptionDate('');
                      }
                    }}
                    className="px-4 py-2 bg-pink-400 text-white rounded-lg text-sm hover:bg-pink-500 transition-colors"
                  >
                    添加
                  </button>
                </div>
              </div>

              {localRecurrence.exceptions.length > 0 ? (
                <div className="space-y-2">
                  {localRecurrence.exceptions.map((date, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{new Date(date).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveException(date);
                        }}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">暂无例外日期</p>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }}
              className="flex-1 px-6 py-3 rounded-[20px] bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-all duration-300"
            >
              取消
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              className="flex-1 px-6 py-3 rounded-[20px] bg-gradient-to-r from-pink-400 to-orange-400 text-white font-medium hover:from-pink-500 hover:to-orange-500 transition-all duration-300"
            >
              保存
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RecurrenceSettings;