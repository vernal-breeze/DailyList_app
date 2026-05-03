# UI基础重构（v1.1版本）执行方案

## 一、重构目标与核心原则

### 1. 视觉目标
通过统一的设计语言，让产品"看起来更高级"，重点关注：
- 克制的色彩搭配
- 一致的圆角和阴影
- 舒适的间距系统

### 2. 技术目标
建立可维护的design-tokens体系，替换硬编码，为后续功能迭代打基础：
- 统一的CSS变量系统
- 标准化的组件库
- 可扩展的主题系统

### 3. 兼容性原则
确保深色/浅色主题自动适配，不破坏现有业务逻辑：
- 基于`prefers-color-scheme`的自动切换
- 手动主题切换的预留接口
- 向后兼容现有代码

## 二、详细任务拆解与交付物

### 任务1：建立Design-Tokens体系

#### 核心内容
- **颜色tokens**：品牌主色、辅助色、中性色（灰度阶梯）、功能色（成功/警告/错误），包含浅色/深色两套值
- **圆角tokens**：统一的圆角阶梯，明确不同组件的圆角应用场景
- **间距tokens**：统一的间距阶梯，明确布局、组件内边距/外边距的应用规则
- **阴影tokens**：分层阴影体系，提升视觉层次感
- **过渡tokens**：统一的动画过渡时长，确保交互一致性

#### 交付物
- 完整的tokens变量表（含名称、值、使用场景说明）
- CSS变量定义代码（`:root`与`[data-theme="dark"]`两套）

#### 技术方案

**Design-Tokens变量表**

| 类别 | 名称 | 浅色值 | 深色值 | 使用场景 |
|------|------|--------|--------|----------|
| **品牌色** | `--color-primary` | `#4B6BFB` | `#5B7BFF` | 主按钮、链接、重点元素 |
| | `--color-secondary` | `#FF6B6B` | `#FF7B7B` | 次要按钮、强调元素 |
| | `--color-accent` | `#4ECDC4` | `#5EDDD4` | 强调色、特殊状态 |
| **功能色** | `--color-success` | `#4ECDC4` | `#5EDDD4` | 成功状态、完成标记 |
| | `--color-warning` | `#FFD166` | `#FFE176` | 警告状态、提醒 |
| | `--color-error` | `#FF6B6B` | `#FF7B7B` | 错误状态、删除操作 |
| | `--color-info` | `#4B6BFB` | `#5B7BFF` | 信息提示、链接 |
| **中性色** | `--color-background` | `#FFFFFF` | `#1A1A1A` | 页面背景 |
| | `--color-surface` | `#F5F5F5` | `#2D2D2D` | 卡片、面板背景 |
| | `--color-text-primary` | `#333333` | `#E0E0E0` | 主要文字 |
| | `--color-text-secondary` | `#666666` | `#B0B0B0` | 次要文字 |
| | `--color-text-tertiary` | `#999999` | `#808080` | 辅助文字、占位符 |
| | `--color-border` | `#E0E0E0` | `#404040` | 边框、分隔线 |
| **圆角** | `--radius-xs` | `4px` | `4px` | 小型按钮、输入框 |
| | `--radius-sm` | `8px` | `8px` | 中型按钮、卡片 |
| | `--radius-md` | `12px` | `12px` | 大型卡片、弹窗 |
| | `--radius-lg` | `16px` | `16px` | 面板、容器 |
| | `--radius-xl` | `20px` | `20px` | 特殊容器、大面板 |
| **间距** | `--spacing-xs` | `4px` | `4px` | 组件内部小间距 |
| | `--spacing-sm` | `8px` | `8px` | 组件内部间距 |
| | `--spacing-md` | `16px` | `16px` | 组件间间距、布局间距 |
| | `--spacing-lg` | `24px` | `24px` | 大布局间距 |
| | `--spacing-xl` | `32px` | `32px` | 页面级间距 |
| **阴影** | `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.05)` | `0 2px 4px rgba(0,0,0,0.2)` | 小型组件 |
| | `--shadow-md` | `0 4px 8px rgba(0,0,0,0.1)` | `0 4px 8px rgba(0,0,0,0.3)` | 卡片、弹窗 |
| | `--shadow-lg` | `0 8px 16px rgba(0,0,0,0.15)` | `0 8px 16px rgba(0,0,0,0.4)` | 大型容器 |
| | `--shadow-xl` | `0 12px 24px rgba(0,0,0,0.2)` | `0 12px 24px rgba(0,0,0,0.5)` | 悬浮面板 |
| **过渡** | `--transition-fast` | `0.15s ease` | `0.15s ease` | 快速状态变化 |
| | `--transition-normal` | `0.25s ease` | `0.25s ease` | 普通过渡 |
| | `--transition-slow` | `0.35s ease` | `0.35s ease` | 复杂动画 |

**CSS变量定义代码**

```css
/* Design Tokens - 设计变量系统 */

/* 浅色主题 */
:root {
  /* 品牌色 */
  --color-primary: #4B6BFB;
  --color-secondary: #FF6B6B;
  --color-accent: #4ECDC4;
  
  /* 功能色 */
  --color-success: #4ECDC4;
  --color-warning: #FFD166;
  --color-error: #FF6B6B;
  --color-info: #4B6BFB;
  
  /* 中性色 */
  --color-background: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-border: #E0E0E0;
  
  /* 圆角 */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  
  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* 阴影 */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.1);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.15);
  --shadow-xl: 0 12px 24px rgba(0,0,0,0.2);
  
  /* 过渡 */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-slow: 0.35s ease;
}

/* 深色主题 */
[data-theme="dark"],
@media (prefers-color-scheme: dark) {
  :root {
    /* 品牌色 */
    --color-primary: #5B7BFF;
    --color-secondary: #FF7B7B;
    --color-accent: #5EDDD4;
    
    /* 功能色 */
    --color-success: #5EDDD4;
    --color-warning: #FFE176;
    --color-error: #FF7B7B;
    --color-info: #5B7BFF;
    
    /* 中性色 */
    --color-background: #1A1A1A;
    --color-surface: #2D2D2D;
    --color-text-primary: #E0E0E0;
    --color-text-secondary: #B0B0B0;
    --color-text-tertiary: #808080;
    --color-border: #404040;
    
    /* 阴影 */
    --shadow-sm: 0 2px 4px rgba(0,0,0,0.2);
    --shadow-md: 0 4px 8px rgba(0,0,0,0.3);
    --shadow-lg: 0 8px 16px rgba(0,0,0,0.4);
    --shadow-xl: 0 12px 24px rgba(0,0,0,0.5);
  }
}
```

### 任务2：全局CSS变量替换硬编码

#### 核心内容
- 制定硬编码颜色替换规则（如何快速定位、如何映射到对应tokens）
- 提供批量替换的建议方案（如IDE正则匹配、CSSLint规则配置）
- 确保替换后无视觉回归（重点：渐变、边框、文字颜色）

#### 交付物
- 替换操作步骤指南
- 常见问题与解决方案（如特殊场景下的颜色覆盖）

#### 技术方案

**替换操作步骤指南**

1. **准备工作**
   - 备份现有代码
   - 确保design-tokens.css已正确引入到项目中

2. **定位硬编码值**
   - 使用IDE的全局搜索功能，搜索常见的颜色值、尺寸值
   - 使用正则表达式匹配CSS中的颜色值：`#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})`
   - 搜索固定的像素值：`\d+px`

3. **映射到tokens**
   - 颜色值：对照Design-Tokens变量表，找到最接近的token
   - 尺寸值：根据使用场景，映射到对应的spacing或radius token
   - 阴影值：映射到对应的shadow token

4. **批量替换**
   - 使用IDE的查找替换功能，批量替换硬编码值
   - 对于复杂场景，编写脚本辅助替换

5. **验证与测试**
   - 检查替换后的代码是否正确
   - 在不同主题下测试视觉效果
   - 确保无视觉回归

**常见问题与解决方案**

| 问题 | 解决方案 |
|------|----------|
| 特殊渐变颜色 | 使用CSS变量定义渐变的起止颜色 |
| 复杂阴影效果 | 组合多个shadow token或创建新的token |
| 第三方组件样式 | 使用CSS变量覆盖第三方组件的默认样式 |
| 响应式尺寸 | 使用CSS变量结合媒体查询 |

### 任务3：组件标准化（按钮/输入框/卡片/弹窗）

#### 核心内容
- **按钮**：统一尺寸（大/中/小）、类型（主按钮/次要按钮/文字按钮）、状态（默认/hover/active/禁用）的样式规范与代码模板
- **输入框**：统一尺寸、状态（默认/聚焦/错误/禁用）、边框/内边距/占位符样式的规范与模板
- **卡片**：统一圆角、阴影（分层阴影体系）、内边距的规范与模板，明确不同场景下的卡片变体
- **弹窗**：统一遮罩层、圆角、标题/内容/底部区域间距、关闭按钮样式的规范与模板

#### 交付物
- 每个组件的**设计规范图（文字描述版）** + **CSS/React/Vue代码模板**
- 组件使用指南（什么场景用什么变体）

#### 技术方案

**按钮组件**

**设计规范**
- 尺寸：
  - 大按钮：48px高度，16px文字
  - 中按钮：40px高度，14px文字
  - 小按钮：32px高度，12px文字
- 类型：
  - 主按钮：使用`--color-primary`背景
  - 次要按钮：使用`--color-surface`背景，`--color-primary`边框
  - 文字按钮：无背景，仅`--color-primary`文字
- 状态：
  - 默认：正常样式
  - Hover：轻微变暗或加亮
  - Active：轻微缩小或加深阴影
  - 禁用：降低透明度，禁止交互

**代码模板（React）**

```tsx
import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children
}) => {
  const baseClasses = `
    rounded-md
    font-medium
    transition-all
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90 active:scale-95'}
  `;

  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-white',
    secondary: 'bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-primary)]',
    text: 'bg-transparent text-[var(--color-primary)]'
  };

  const sizeClasses = {
    small: 'px-3 py-1 text-sm h-8',
    medium: 'px-4 py-2 text-base h-10',
    large: 'px-6 py-3 text-lg h-12'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
```

**输入框组件**

**设计规范**
- 尺寸：统一40px高度，14px文字
- 状态：
  - 默认：`--color-border`边框
  - 聚焦：`--color-primary`边框，轻微阴影
  - 错误：`--color-error`边框
  - 禁用：降低透明度，禁止交互
- 内边距：左右16px
- 占位符：`--color-text-tertiary`颜色

**代码模板（React）**

```tsx
import React, { useState } from 'react';

interface InputProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  type?: string;
}

const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  type = 'text'
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const baseClasses = `
    w-full
    h-10
    px-4
    rounded-md
    border
    font-medium
    transition-all
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
  `;

  const borderClasses = error
    ? 'border-[var(--color-error)]'
    : isFocused
    ? 'border-[var(--color-primary)] shadow-sm'
    : 'border-[var(--color-border)]';

  return (
    <div className="w-full">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`${baseClasses} ${borderClasses}`}
        style={{
          color: 'var(--color-text-primary)',
          backgroundColor: 'var(--color-surface)',
          placeholderColor: 'var(--color-text-tertiary)'
        } as React.CSSProperties}
      />
      {error && <p className="text-[var(--color-error)] text-xs mt-1">{error}</p>}
    </div>
  );
};

export default Input;
```

**卡片组件**

**设计规范**
- 圆角：`--radius-md`（12px）
- 阴影：`--shadow-md`
- 内边距：`--spacing-md`（16px）
- 变体：
  - 基础卡片：默认样式
  - 强调卡片：`--shadow-lg`，轻微提升
  - 简洁卡片：无阴影，仅边框

**代码模板（React）**

```tsx
import React from 'react';

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className = ''
}) => {
  const baseClasses = `
    rounded-[var(--radius-md)]
    p-[var(--spacing-md)]
    bg-[var(--color-surface)]
    transition-all
  `;

  const variantClasses = {
    default: 'shadow-[var(--shadow-md)]',
    elevated: 'shadow-[var(--shadow-lg)]',
    outlined: 'border border-[var(--color-border)]'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
```

**弹窗组件**

**设计规范**
- 遮罩层：半透明黑色，`backdrop-filter: blur(4px)`
- 圆角：`--radius-lg`（16px）
- 内边距：标题24px，内容16px，底部24px
- 关闭按钮：右上角，24x24px，`--color-text-tertiary`颜色

**代码模板（React）**

```tsx
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] w-full max-w-md">
        <div className="flex items-center justify-between p-[var(--spacing-lg)] border-b border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-[var(--spacing-md)]">
          {children}
        </div>
        <div className="flex justify-end p-[var(--spacing-lg)] border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90 transition-opacity"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
```

**组件使用指南**

| 组件 | 变体 | 使用场景 |
|------|------|----------|
| 按钮 | 主按钮 | 主要操作，如提交、确认 |
| | 次要按钮 | 次要操作，如取消、返回 |
| | 文字按钮 | 辅助操作，如链接、更多选项 |
| 输入框 | 默认 | 一般表单输入 |
| | 错误状态 | 表单验证失败时 |
| | 禁用状态 | 不可编辑的输入字段 |
| 卡片 | 基础卡片 | 一般内容展示 |
| | 强调卡片 | 重要信息、推荐内容 |
| | 简洁卡片 | 内嵌内容、次要信息 |
| 弹窗 | 默认 | 确认操作、信息展示 |

### 任务4：深色/浅色主题统一与自动适配

#### 核心内容
- 基于`prefers-color-scheme`的自动主题切换方案
- 手动切换主题的预留接口（为后续功能做准备）
- 深色模式下的特殊处理（如阴影减弱、图片亮度调整、文字对比度保障）

#### 交付物
- 主题切换的完整CSS代码 + JavaScript逻辑示例
- 深色模式视觉检查清单（确保对比度、可读性）

#### 技术方案

**主题切换代码**

**CSS代码**（已包含在design-tokens.css中）

**JavaScript逻辑示例**

```javascript
// 主题管理工具
class ThemeManager {
  constructor() {
    this.theme = this.getSavedTheme() || this.getSystemTheme();
    this.applyTheme(this.theme);
  }

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  getSavedTheme() {
    return localStorage.getItem('theme');
  }

  saveTheme(theme) {
    localStorage.setItem('theme', theme);
  }

  applyTheme(theme) {
    this.theme = theme;
    this.saveTheme(theme);
    
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    return newTheme;
  }

  // 监听系统主题变化
  listenSystemThemeChanges(callback) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      callback(newTheme);
    });
  }
}

// 使用示例
const themeManager = new ThemeManager();

// 手动切换主题
function handleThemeToggle() {
  const newTheme = themeManager.toggleTheme();
  console.log('Theme changed to:', newTheme);
}

// 监听系统主题变化
themeManager.listenSystemThemeChanges((newTheme) => {
  // 当系统主题变化时，可以选择自动跟随或提示用户
  console.log('System theme changed to:', newTheme);
});
```

**深色模式视觉检查清单**

| 检查项 | 要求 | 验证方法 |
|--------|------|----------|
| 文字对比度 | 文本与背景对比度至少4.5:1 | 使用对比度检查工具 |
| 色彩一致性 | 品牌色在深色模式下仍然清晰可辨 | 视觉检查 |
| 阴影效果 | 阴影在深色背景下适当减弱 | 视觉检查 |
| 图片适配 | 图片在深色模式下亮度适当 | 视觉检查 |
| 边框清晰度 | 边框在深色背景下仍然可见 | 视觉检查 |
| 交互状态 | 所有交互状态在深色模式下清晰 | 交互测试 |

### 任务5：Logo SVG优化

#### 核心内容
- SVG代码精简（去除冗余代码、统一 viewBox）
- 可访问性优化（添加`aria-label`、`title`）
- 响应式适配（确保在不同尺寸下清晰显示）
- 深色模式下的Logo颜色适配（通过CSS变量控制填充色）

#### 交付物
- 优化后的SVG代码示例
- Logo使用规范（最小尺寸、安全距离、颜色变体）

#### 技术方案

**优化后的SVG代码示例**

```svg
<svg 
  width="100" 
  height="100" 
  viewBox="0 0 100 100" 
  fill="none" 
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="Schedule App Logo"
>
  <title>Schedule App Logo</title>
  <circle cx="50" cy="50" r="45" fill="var(--color-primary)"/>
  <path 
    d="M30 40L45 60L70 35" 
    stroke="white" 
    stroke-width="4" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  />
  <circle cx="30" cy="40" r="3" fill="white"/>
  <circle cx="70" cy="35" r="3" fill="white"/>
</svg>
```

**Logo使用规范**

| 规范 | 要求 |
|------|------|
| 最小尺寸 | 32x32px |
| 安全距离 | Logo周围至少保留10px空白 |
| 颜色变体 | 主色版本：使用`--color-primary`填充<br>白色版本：使用白色填充（适用于深色背景） |
| 响应式使用 | 使用`width`和`height`属性控制尺寸，保持 aspect ratio |
| 可访问性 | 始终添加`aria-label`和`title`属性 |

## 三、工期规划与里程碑

### 第1周

| 日期 | 任务 | 交付物 |
|------|------|--------|
| 第1天 | 建立Design-Tokens体系 | 完整的tokens变量表和CSS文件 |
| 第2-3天 | 全局CSS变量替换硬编码 | 替换操作步骤指南和完成的代码修改 |
| 第4-5天 | Logo SVG优化 | 优化后的SVG代码和使用规范 |

### 第2周

| 日期 | 任务 | 交付物 |
|------|------|--------|
| 第1-2天 | 按钮和输入框组件标准化 | 组件代码模板和使用指南 |
| 第3天 | 卡片和弹窗组件标准化 | 组件代码模板和使用指南 |
| 第4天 | 深色/浅色主题统一与自动适配 | 主题切换代码和视觉检查清单 |
| 第5天 | 整体视觉走查与回归测试 | 视觉验收清单和修复报告 |

## 四、最终产出物清单

1.  **《Design-Tokens设计变量表》**：包含所有设计变量的定义、值和使用场景
2.  **《组件标准化规范与代码库》**：包含按钮、输入框、卡片、弹窗的设计规范和代码模板
3.  **《深色/浅色主题适配方案》**：包含主题切换的CSS代码和JavaScript逻辑
4.  **优化后的Logo SVG文件**：精简、可访问、响应式的SVG代码
5.  **《重构后视觉验收清单》**：确保所有视觉元素符合设计规范

## 五、执行注意事项

1.  **兼容性**：确保所有修改向后兼容，不破坏现有业务逻辑
2.  **性能**：优化CSS变量的使用，避免过度使用导致性能问题
3.  **可维护性**：保持代码结构清晰，添加必要的注释
4.  **一致性**：严格按照Design-Tokens体系使用变量，确保视觉一致性
5.  **测试**：在不同设备、浏览器和主题模式下进行充分测试

## 六、后续扩展建议

1.  **组件库扩展**：基于标准化组件，逐步扩展更多UI组件
2.  **主题系统增强**：支持更多自定义主题选项
3.  **设计系统文档**：建立完整的设计系统文档，包含所有组件和使用规范
4.  **自动化工具**：开发自动化工具，确保代码符合设计规范
5.  **性能优化**：持续优化CSS和组件性能

---

本执行方案旨在通过建立统一的设计语言和技术体系，提升产品的视觉质量和可维护性，为后续功能迭代打下坚实基础。执行过程中应严格按照规范进行，确保最终产出符合设计要求。