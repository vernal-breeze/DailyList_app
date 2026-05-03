# UI基础重构（v1.1版本）执行方案

## 一、重构目标与核心原则

### 1.1 视觉目标
- 通过统一的设计语言，让产品"看起来更高级"
- 重点：克制的色彩、一致的圆角/阴影、舒适的间距
- 风格：现代、简约、有层次感

### 1.2 技术目标
- 建立可维护的design-tokens体系
- 替换硬编码颜色和尺寸
- 为后续功能迭代打基础

### 1.3 兼容性原则
- 确保深色/浅色主题自动适配
- 不破坏现有业务逻辑
- 渐进式改造，降低风险

## 二、详细任务拆解与交付物

### 任务1：建立Design-Tokens体系

#### 2.1.1 核心内容

**颜色tokens**：
- **品牌主色**：#4B6BFB（蓝色系，代表专注与效率）
- **辅助色**：#FF6B6B（红色系，用于重要任务标记）、#4ECDC4（青色系，用于完成状态）
- **中性色**：
  - 浅色模式：#FFFFFF（背景）、#F5F5F5（卡片）、#333333（文字）
  - 深色模式：#1A1A1A（背景）、#2D2D2D（卡片）、#E0E0E0（文字）
- **功能色**：
  - 成功：#4ECDC4
  - 警告：#FFD166
  - 错误：#FF6B6B
  - 信息：#4B6BFB

**圆角tokens**：
- xs: 4px（小按钮、输入框）
- sm: 8px（按钮、卡片）
- md: 12px（弹窗、模态框）
- lg: 16px（大卡片、面板）
- xl: 20px（特殊容器）

**间距tokens**：
- xs: 4px（组件内元素间距）
- sm: 8px（组件间距）
- md: 16px（布局间距）
- lg: 24px（大区域间距）
- xl: 32px（页面级间距）

**阴影tokens**：
- sm: 0 2px 4px rgba(0,0,0,0.05)
- md: 0 4px 8px rgba(0,0,0,0.1)
- lg: 0 8px 16px rgba(0,0,0,0.15)
- xl: 0 12px 24px rgba(0,0,0,0.2)

#### 2.1.2 交付物

**完整的tokens变量表**：
| 名称 | 浅色模式值 | 深色模式值 | 使用场景 |
|------|------------|------------|----------|
| --color-primary | #4B6BFB | #5B7BFF | 主按钮、强调色 |
| --color-secondary | #FF6B6B | #FF7B7B | 辅助色、警告 |
| --color-success | #4ECDC4 | #5EDDD4 | 成功状态 |
| --color-warning | #FFD166 | #FFE176 | 警告状态 |
| --color-error | #FF6B6B | #FF7B7B | 错误状态 |
| --color-info | #4B6BFB | #5B7BFF | 信息状态 |
| --color-background | #FFFFFF | #1A1A1A | 页面背景 |
| --color-surface | #F5F5F5 | #2D2D2D | 卡片背景 |
| --color-text-primary | #333333 | #E0E0E0 | 主要文字 |
| --color-text-secondary | #666666 | #B0B0B0 | 次要文字 |
| --color-text-tertiary | #999999 | #808080 |  tertiary文字 |
| --radius-xs | 4px | 4px | 小元素 |
| --radius-sm | 8px | 8px | 按钮、卡片 |
| --radius-md | 12px | 12px | 弹窗 |
| --radius-lg | 16px | 16px | 大卡片 |
| --radius-xl | 20px | 20px | 特殊容器 |
| --spacing-xs | 4px | 4px | 组件内间距 |
| --spacing-sm | 8px | 8px | 组件间距 |
| --spacing-md | 16px | 16px | 布局间距 |
| --spacing-lg | 24px | 24px | 大区域间距 |
| --spacing-xl | 32px | 32px | 页面级间距 |
| --shadow-sm | 0 2px 4px rgba(0,0,0,0.05) | 0 2px 4px rgba(0,0,0,0.2) | 小阴影 |
| --shadow-md | 0 4px 8px rgba(0,0,0,0.1) | 0 4px 8px rgba(0,0,0,0.3) | 中等阴影 |
| --shadow-lg | 0 8px 16px rgba(0,0,0,0.15) | 0 8px 16px rgba(0,0,0,0.4) | 大阴影 |
| --shadow-xl | 0 12px 24px rgba(0,0,0,0.2) | 0 12px 24px rgba(0,0,0,0.5) | 超大阴影 |

**CSS变量定义代码**：

```css
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

#### 2.2.1 核心内容

**硬编码颜色替换规则**：
1. **定位硬编码**：使用IDE的全局搜索功能，搜索常见的颜色值（如#FFFFFF、#000000等）
2. **映射到tokens**：将找到的颜色值映射到对应的design tokens
3. **批量替换**：使用IDE的批量替换功能进行替换

**批量替换建议方案**：
- **VS Code**：使用正则表达式搜索 `#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})` 找到所有颜色值
- **CSSLint**：配置规则，禁止使用硬编码颜色
- **逐步替换**：先替换主要颜色，再替换次要颜色，最后替换边框和背景色

**视觉回归保障**：
- 建立视觉测试基准
- 替换后进行全面视觉检查
- 重点检查：渐变、边框、文字颜色

#### 2.2.2 交付物

**替换操作步骤指南**：
1. **准备阶段**：
   - 备份当前CSS文件
   - 建立颜色映射表
   - 配置IDE的替换规则

2. **执行阶段**：
   - 替换品牌色和功能色
   - 替换中性色和背景色
   - 替换边框和分隔线颜色
   - 替换阴影值

3. **验证阶段**：
   - 检查所有页面的视觉效果
   - 测试深色/浅色主题切换
   - 确认无视觉回归

**常见问题与解决方案**：
| 问题 | 解决方案 |
|------|----------|
| 特殊场景下的颜色覆盖 | 使用CSS变量的级联特性，在局部作用域中覆盖 |
| 渐变颜色处理 | 将渐变的颜色值替换为CSS变量 |
| 第三方库样式 | 使用CSS变量重新定义第三方库的主题变量 |

### 任务3：组件标准化

#### 2.3.1 按钮组件

**设计规范**：
- **尺寸**：
  - 小按钮：32px高度，12px padding
  - 中按钮：40px高度，16px padding
  - 大按钮：48px高度，20px padding
- **类型**：
  - 主按钮：填充主色，白色文字
  - 次要按钮：白色背景，主色边框和文字
  - 文字按钮：无背景，主色文字
- **状态**：
  - 默认：正常样式
  - hover：轻微阴影和颜色变化
  - active：缩放效果
  - 禁用：半透明，无交互

**代码模板**：

```css
/* 按钮基础样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: var(--transition-normal);
  cursor: pointer;
  font-family: inherit;
}

/* 按钮尺寸 */
.btn-sm {
  height: 32px;
  padding: 0 12px;
  font-size: 14px;
}

.btn-md {
  height: 40px;
  padding: 0 16px;
  font-size: 16px;
}

.btn-lg {
  height: 48px;
  padding: 0 20px;
  font-size: 16px;
}

/* 按钮类型 */
.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-secondary {
  background: var(--color-background);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-secondary:hover {
  background: var(--color-primary);
  color: white;
}

.btn-text {
  background: transparent;
  color: var(--color-primary);
}

.btn-text:hover {
  background: var(--color-surface);
}

/* 禁用状态 */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:disabled:hover {
  box-shadow: none;
  transform: none;
}
```

#### 2.3.2 输入框组件

**设计规范**：
- **尺寸**：40px高度，16px padding
- **状态**：
  - 默认：浅灰色边框
  - 聚焦：主色边框，轻微阴影
  - 错误：红色边框
  - 禁用：半透明，无交互
- **样式**：圆角8px，清晰的占位符样式

**代码模板**：

```css
/* 输入框基础样式 */
.input {
  width: 100%;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 16px;
  font-family: inherit;
  background: var(--color-background);
  color: var(--color-text-primary);
  transition: var(--transition-normal);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(75, 107, 251, 0.1);
}

.input::placeholder {
  color: var(--color-text-tertiary);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input.error {
  border-color: var(--color-error);
}

.input.error:focus {
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}
```

#### 2.3.3 卡片组件

**设计规范**：
- **圆角**：12px
- **阴影**：根据层级使用不同阴影
- **内边距**：16px
- **变体**：
  - 标准卡片：白色背景，中等阴影
  - 强调卡片：浅色背景，较大阴影
  - 紧凑卡片：较小内边距

**代码模板**：

```css
/* 卡片基础样式 */
.card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-md);
  transition: var(--transition-normal);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* 卡片变体 */
.card-compact {
  padding: var(--spacing-sm);
}

.card-emphasis {
  background: linear-gradient(135deg, var(--color-surface), var(--color-background));
  box-shadow: var(--shadow-lg);
}

.card-flat {
  box-shadow: none;
  border: 1px solid var(--color-border);
}
```

#### 2.3.4 弹窗组件

**设计规范**：
- **遮罩层**：半透明黑色背景
- **圆角**：16px
- **间距**：
  - 标题到内容：16px
  - 内容到底部按钮：24px
  - 按钮之间：12px
- **关闭按钮**：右上角，圆形，40x40px

**代码模板**：

```css
/* 弹窗遮罩 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 弹窗容器 */
.modal {
  background: var(--color-background);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  position: relative;
  min-width: 300px;
}

/* 弹窗标题 */
.modal-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

/* 弹窗内容 */
.modal-content {
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-secondary);
}

/* 弹窗底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

/* 关闭按钮 */
.modal-close {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-surface);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-normal);
}

.modal-close:hover {
  background: var(--color-border);
}
```

### 任务4：深色/浅色主题统一与自动适配

#### 2.4.1 核心内容

**自动主题切换方案**：
- 基于 `prefers-color-scheme` 媒体查询
- 支持手动切换主题
- 主题状态持久化

**深色模式特殊处理**：
- 阴影减弱，避免过于沉重
- 图片亮度调整，确保可读性
- 文字对比度保障，符合WCAG标准

#### 2.4.2 交付物

**主题切换的完整代码**：

```css
/* 主题切换CSS（已包含在Design-Tokens中） */

/* 主题切换JavaScript */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // 触发主题切换事件
  document.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
}

// 初始化主题
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
  }
});

// 初始化
initTheme();
```

**深色模式视觉检查清单**：
- [ ] 文字对比度 ≥ 4.5:1
- [ ] 阴影效果适度，不过于沉重
- [ ] 图片显示正常，无过度暗化
- [ ] 所有UI元素都有深色模式适配
- [ ] 交互状态反馈清晰
- [ ] 滚动条样式适配

### 任务5：Logo SVG优化

#### 2.5.1 核心内容

**SVG代码精简**：
- 去除冗余代码
- 统一 viewBox
- 优化路径

**可访问性优化**：
- 添加 `aria-label`
- 添加 `title` 元素
- 确保语义化结构

**响应式适配**：
- 确保在不同尺寸下清晰显示
- 深色模式下的颜色适配

#### 2.5.2 交付物

**优化后的SVG代码示例**：

```svg
<svg 
  width="120" 
  height="40" 
  viewBox="0 0 120 40" 
  fill="none" 
  xmlns="http://www.w3.org/2000/svg"
  aria-label="WeekToDo Logo"
  role="img"
>
  <title>WeekToDo</title>
  <rect 
    x="0" 
    y="0" 
    width="120" 
    height="40" 
    rx="8" 
    fill="var(--color-primary)"
  />
  <path 
    d="M20 20H30M30 20V10M30 20V30M45 20H55M55 20V10M55 20V30M70 20H80M80 20V10M80 20V30M95 20H105M105 20V10M105 20V30" 
    stroke="white" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  />
</svg>
```

**Logo使用规范**：
- **最小尺寸**：80x27px
- **安全距离**：Logo周围至少8px空白
- **颜色变体**：
  - 标准：使用主色填充
  - 白色：白色填充，透明背景
  - 深色模式：使用浅色主色填充

## 三、工期规划与里程碑

### 3.1 第1周

**Day 1-2**：
- 建立Design-Tokens体系
- 定义颜色、圆角、间距、阴影tokens
- 编写CSS变量代码

**Day 3-4**：
- 全局硬编码替换
- 批量替换颜色值
- 验证视觉效果

**Day 5**：
- Logo SVG优化
- 可访问性优化
- 响应式适配

### 3.2 第2周

**Day 1-2**：
- 按钮组件标准化
- 输入框组件标准化
- 卡片组件标准化

**Day 3-4**：
- 弹窗组件标准化
- 深色/浅色主题适配
- 主题切换功能实现

**Day 5**：
- 整体视觉走查
- 回归测试
- 文档整理

## 四、最终产出物清单

1. **《Design-Tokens设计变量表》**
   - 完整的tokens变量定义
   - 使用场景说明
   - 深色/浅色主题值

2. **《组件标准化规范与代码库》**
   - 按钮、输入框、卡片、弹窗的设计规范
   - 完整的CSS代码模板
   - 使用指南

3. **《深色/浅色主题适配方案》**
   - 主题切换代码
   - 深色模式视觉检查清单
   - 实现指南

4. **优化后的Logo SVG文件**
   - 精简后的SVG代码
   - 可访问性优化
   - 深色模式适配

5. **《重构后视觉验收清单》**
   - 视觉回归检查项
   - 响应式测试项
   - 主题切换测试项

## 五、执行建议

### 5.1 技术实施
- **渐进式改造**：先从核心组件开始，逐步扩展
- **版本控制**：使用Git分支管理重构过程
- **代码审查**：确保所有变更符合设计规范

### 5.2 团队协作
- **设计规范培训**：向团队成员介绍新的设计系统
- **组件库文档**：建立详细的组件使用文档
- **代码规范**：制定CSS变量使用规范

### 5.3 质量保障
- **视觉测试**：建立视觉测试基准
- **兼容性测试**：确保在不同浏览器中正常显示
- **性能测试**：确保重构后性能不下降

## 六、结语

通过本次UI基础重构，我们将建立一套统一、可维护的设计系统，为产品带来更高级的视觉体验，同时为后续的功能迭代打下坚实的基础。重构过程中，我们将严格遵循设计规范，确保视觉一致性和技术可维护性，最终交付一套高质量的UI系统。