# 项目架构说明

本文档描述这个仓库在 2026-04-28 的真实架构状态，重点区分“当前运行态”和“目标重构态”。

## 1. 一句话结论

这个项目不是“已经完成分层重构”，而是“已有一套可运行旧实现，同时搭建了一套待接管的新架构骨架”。

## 2. 当前运行态

当前入口：

- [src/main.tsx](/Users/fanqie/Desktop/list_finished/src/main.tsx:1)
- [src/app/App.tsx](/Users/fanqie/Desktop/list_finished/src/app/App.tsx:1)

当前主引用链大致是：

```text
main.tsx
  -> app/App.tsx
    -> app/AppShell.tsx
    -> app/routes.tsx
    -> app/layout/BottomNav.tsx
    -> app/hooks/useAppInitialization.ts
    -> presentation/pages/*
    -> src/store/*
    -> src/services/notificationService.ts
    -> src/components/*
    -> src/utils/*
    -> src/types/*
```

这意味着下面这些目录目前仍然是主干代码：

- `src/components`
- `src/store`
- `src/services`
- `src/utils`
- `src/types`

## 3. 目标重构态

仓库已经搭建了目标分层目录：

- `src/presentation/pages`
- `src/domain`
- `src/infrastructure`
- `src/data`
- `src/app`

其中最接近目标分层的方向是：

```text
presentation -> services -> domain -> infrastructure
```

但这套结构目前还没有完全接管业务层，因为：

- `src/presentation/pages` 已接管路由，但仍复用 `src/components` 和 `src/store`
- `src/app/` 已接管入口装配
- 旧 store 和未来的 domain/service 目录仍并存

## 4. 当前主要架构问题

### 4.1 新旧目录并存

以下目录表达的职责有明显重叠：

- `src/components`
- `src/store`
- `src/utils`
- `src/services`

结果是：

- 新人难以判断应该改哪里
- 文档与实际运行路径不一致
- 迁移进度无法被明确验收

### 4.2 业务逻辑还集中在 store

例如任务新增、重复任务、通知调度等逻辑仍主要放在 store 中，而不是服务层。这会导致：

- store 体积持续膨胀
- UI 状态与业务规则耦合
- 单元测试粒度不够稳定

### 4.3 文档把“目标设计”与“当前事实”混写

之前的部分文档更偏“设计稿”或“实施计划”，但没有清楚标明哪些已经生效，哪些还只是目标。这会误导后续开发。

## 5. 建议采用的最终结构

建议继续收敛到下面这套结构，并停止新增平行目录：

```text
src/
  main.tsx
  app/                       # 应用装配、Provider、路由、布局
  presentation/              # 页面、组件、交互 hooks、视图状态
  services/                  # 用例编排、应用服务
  domain/                    # 实体、值对象、仓储接口、领域规则
  infrastructure/            # 仓储实现、通知实现、时间/存储工具
  lib/                       # 第三方工具薄封装
  styles/                    # 设计令牌与全局样式
```

如果不打算保留 `src/app` 作为独立层，也可以进一步简化为：

```text
src/
  main.tsx
  presentation/
  services/
  domain/
  infrastructure/
  lib/
  styles/
```

关键是二选一，不要继续同时维护 `app` 与 `presentation` 两套 UI 根目录。

## 6. 分层职责约定

### presentation

负责：

- 页面
- 组件
- 路由渲染
- 交互态
- 视图态 store

不负责：

- 直接访问 `localStorage`
- 编排通知底层 API
- 实现领域规则

### services

负责：

- 用例编排
- 任务增删改查流程
- 通知触发策略
- 组合多个仓储或外部能力

不负责：

- 具体 UI 展示
- 具体存储实现细节

### domain

负责：

- `Task`、`SubTask` 等核心实体
- 仓储接口
- 不依赖框架的业务规则

不负责：

- 浏览器 API
- Capacitor API
- Zustand

### infrastructure

负责：

- `localStorage` 仓储实现
- 通知插件封装
- 日期与存储工具

不负责：

- 页面状态
- 路由

## 7. 迁移边界规则

重构期间建议遵循下面几条硬规则：

1. 新功能优先写到目标分层目录，不继续向 `src/components`、`src/store` 扩散。
2. 删除旧目录前，先确认运行入口和所有 import 已切换完成。
3. 每迁移一个模块，就补一条“当前已接管范围”说明，避免再次失真。
4. 如果业务逻辑仍在旧 store，优先抽 service，再迁 UI。

## 8. 推荐迁移顺序

1. 先统一唯一入口。
   目标是继续收敛 `src/app`，并逐步让旧页面目录彻底退出历史职责。
2. 再抽离任务用例到 service。
   尤其是任务创建、完成、重复任务生成、通知调度。
3. 再迁页面和组件引用。
   按页面维度逐个切换，而不是整仓库一次性替换。
4. 最后删除旧目录。
   只有在测试和运行入口都确认稳定后再做清理。

## 9. 当前文档之间的关系

- [README.md](/Users/fanqie/Desktop/list_finished/README.md): 面向首次进入仓库的人，说明现状与入口
- [docs/ARCHITECTURE.md](/Users/fanqie/Desktop/list_finished/docs/ARCHITECTURE.md): 面向开发者，说明真实架构与迁移边界
- [MIGRATION_GUIDE.md](/Users/fanqie/Desktop/list_finished/MIGRATION_GUIDE.md): 面向重构执行
- [ARCHITECTURE_REFACTORING_SUMMARY.md](/Users/fanqie/Desktop/list_finished/ARCHITECTURE_REFACTORING_SUMMARY.md): 历史总结，适合作为背景，不应单独视为现状说明

## 10. 现在最重要的判断标准

以后凡是讨论“项目架构”，都建议先回答三个问题：

1. 当前运行入口在哪里？
2. 当前功能实际落在哪一层？
3. 这次改动是在收敛目录，还是在继续制造并行目录？

只要这三个问题始终明确，后续重构就不会再失焦。
