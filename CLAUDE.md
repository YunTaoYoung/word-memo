# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述
**Word Memo** - 非侵入式英文阅读辅助与AI驱动的词汇记忆浏览器插件（Edge扩展）

- 技术栈：React 18 + TypeScript + Vite + Tailwind CSS
- 架构：Chrome Extension (Manifest V3)
- 状态管理：Zustand
- 构建工具：Vite + @crxjs/vite-plugin

## 语言设置
**重要：请在整个会话中使用简体中文进行交流和生成文档。**

- 所有对话使用中文
- 所有生成的文档使用中文
- 代码注释使用英文
- 变量和函数名使用英文（遵循编程规范）

## 项目结构
```
src/
├── background/         # Service Worker（API调用、存储、定时任务）
│   ├── service-worker.ts    # 主入口
│   ├── llm-client.ts        # LLM API客户端
│   ├── context-menu.ts      # 右键菜单
│   ├── message-handler.ts   # 消息路由
│   └── alarm-handler.ts     # 定时任务
├── content/            # Content Script（页面扫描、高亮）
│   ├── index.ts        # 主入口
│   └── styles.css      # 高亮样式
├── sidepanel/          # 侧边栏UI（React）
│   ├── App.tsx         # 主应用
│   ├── components/     # 组件
│   │   ├── WordList.tsx          # 单词列表（当前页）
│   │   ├── WordCard.tsx          # 单词卡片
│   │   ├── WordDetail.tsx        # 单词详情（编辑）
│   │   ├── VocabularyManagement.tsx # 词库管理
│   │   ├── PracticeMode.tsx      # 练习模式
│   │   └── Settings.tsx          # 设置
│   └── hooks/          # 自定义Hooks
│       ├── useWordStore.ts       # 词库状态
│       ├── useSettings.ts        # 设置状态
│       └── usePractice.ts        # 练习模式
├── lib/                # 共享工具库
│   ├── storage.ts              # 存储抽象层
│   ├── memory-algorithm.ts     # 遗忘曲线算法
│   ├── word-normalizer.ts      # 词形还原
│   ├── search.ts               # 模糊搜索
│   ├── utils.ts                # 工具函数
│   └── constants.ts            # 常量定义
├── types/              # TypeScript类型
│   ├── index.ts        # 核心类型
│   ├── messages.ts     # 消息类型
│   └── storage.ts      # 存储类型
└── manifest.ts         # Manifest配置
```

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS
- 导入路径使用 `@/` 别名（基于 src 目录）

### 命名规范
- 组件文件：大写开头 PascalCase（`WordCard.tsx`）
- 工具文件：小写开头 camelCase（`storage.ts`）
- Hooks：以 `use` 开头（`useWordStore.ts`）
- 类型接口：以大写开头（`WordData`、`PracticeQuestion`）

### 消息类型定义
- Content Script ↔ Background ↔ SidePanel 使用 `chrome.runtime.onMessage`
- 消息类型定义在 `src/types/messages.ts`
- 常用类型：`VOCABULARY_UPDATED`、`VISIBLE_WORDS_UPDATED`、`WORD_ADDED` 等

### 存储键定义
- 使用 `STORAGE_KEYS` 常量（`src/lib/constants.ts`）
- 避免硬编码存储键名

## 常用命令
```bash
npm run dev       # 开发模式（watch）
npm run build     # 生产构建
npm run preview   # 预览构建结果
npm run type-check # 类型检查
```