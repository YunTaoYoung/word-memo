# 📚 Word Memo

<div align="center">

**非侵入式英文阅读辅助与AI驱动的词汇记忆管理工具**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

## 🎯 产品简介

Word Memo 是一款专为职场技术人员设计的浏览器扩展,通过智能侧边栏和 AI 驱动的释义生成,在不干扰原文阅读的前提下,提供高效的词汇学习和记忆管理体验。

### 核心特性

- ✨ **非侵入式阅读** - 保持原文完整性,通过侧边栏辅助而非翻译覆盖
- 🎯 **主动式学习** - 用户自主选择生词,避免被动推送干扰
- 🧠 **科学记忆管理** - 基于遗忘曲线的多级记忆状态自适应系统
- 🤖 **AI智能释义** - 支持任何 OpenAI 兼容的 LLM API,生成场景化释义
- 🎨 **视觉化记忆等级** - 不同颜色下划线标识单词掌握程度
- 📊 **智能词库管理** - 搜索、排序、过滤,轻松管理学习进度

---

## 🚀 快速开始

### 前提条件

- Node.js 16+
- npm 或 yarn
- Edge 或 Chrome 浏览器

### 从源码安装

#### 1. 克隆仓库并安装依赖

```bash
# 克隆仓库（如果从GitHub）
# git clone https://github.com/yourname/word-memo.git
# cd word-memo

# 安装依赖
npm install
```

#### 2. 构建扩展

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

#### 3. 加载到浏览器

1. 打开 Edge 浏览器
2. 访问 `edge://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载解压缩的扩展"
5. 选择项目的 `dist/` 文件夹

### 初次配置

#### 配置 LLM API（必需）

1. 点击浏览器工具栏的 Word Memo 图标打开侧边栏
2. 点击右上角 ⚙️ 进入设置页面
3. 配置 LLM API:
   - **API 端点**: `https://api.openai.com/v1/chat/completions`（或其他兼容接口）
   - **API Key**: 你的 API 密钥
   - **模型**: 推荐 `gpt-3.5-turbo-0125`（性价比最优）
   - **Temperature**: 0.3（默认值）
4. 点击"测试连接"验证配置
5. 点击"保存设置"

#### 开始使用

1. 浏览任意英文页面（如 [MDN Web Docs](https://developer.mozilla.org/)）
2. 选中生词（如 "asynchronous"）
3. 右键选择 "📚 添加到词库"
4. 等待 AI 生成释义（通常 3-5 秒）
5. 在侧边栏查看单词详情
6. 点击"记住了"或"还不熟"进行记忆反馈

---

## 📖 使用指南

### 记忆管理系统

系统根据你的反馈自动管理记忆等级:

| 等级 | 颜色 | 下划线样式 | 复习间隔（记住/不熟） |
|------|------|-----------|---------------------|
| **新词** | 🔴 红色 | 波浪下划线 | 1天 / 12小时 |
| **有印象** | 🟠 橙色 | 实线下划线 | 3天 / 1天 |
| **学习中** | 🟡 黄色 | 虚线下划线 | 7天 / 3天 |
| **已掌握** | 🟢 绿色 | 点状下划线 | 30天 / 7天 |
| **已归档** | ⚪ 灰色 | 无下划线 | 不再显示 |

**点击"记住了"**: 等级 +1,延长复习间隔
**点击"还不熟"**: 等级不变,缩短复习间隔

### 词库管理功能

- 🔍 **搜索**: 按单词或释义搜索
- 🔤 **排序**:
  - 字母序（A-Z / Z-A）
  - 掌握程度（高→低 / 低→高）
- 🏷️ **词性过滤**: 名词、动词、形容词、副词等
- 📝 **详情页**: 完整释义、例句、词根、学习统计

### 卡片交互

- **折叠/展开**: 点击卡片左上角的 ▶/▼ 箭头
- **折叠状态**: 显示简略释义（最多2行）
- **展开状态**: 显示完整释义、例句、词根
- **页面定位**: 点击页面中的高亮单词,侧边栏自动定位到对应卡片

---

## 🎨 核心功能

### 1. 页面高亮系统

- **智能扫描**: 自动识别页面中的词库单词
- **可见性检测**: 仅高亮当前可视区域的单词（性能优化）
- **计数器机制**: 支持同一单词在页面多处出现
- **实时更新**: 滚动页面时自动更新侧边栏显示

### 2. 侧边栏UI

- **当前页生词**: 显示当前可视区域内的词库单词
- **词库管理**: 浏览全部单词,支持搜索/排序/过滤
- **双视图模式**:
  - 列表视图: 快速浏览和筛选
  - 详情视图: 查看完整单词信息

### 3. 遗忘曲线算法

基于 SuperMemo SM-2 简化版:
- **自适应复习**: 根据记忆强度动态调整复习时间
- **自动降级**: 后台定时检查(每30分钟),超期未复习的单词自动降级
- **数据统计**: 复习次数、正确次数、下次复习时间

### 4. LLM 集成

- **灵活配置**: 支持任何 OpenAI 兼容的 API
  - OpenAI 官方
  - Azure OpenAI
  - 国内大模型（智谱、百川、DeepSeek、Moonshot等）
- **成本优化**: 推荐使用 gpt-3.5-turbo-0125（约 $0.0005/单词）
- **技术场景**: 优先生成编程/技术领域的例句
- **结构化输出**: JSON 格式返回音标、释义、例句、词根

---

## 🛠️ 技术栈

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | React | 18.2 | UI开发 |
| **语言** | TypeScript | 5.3 | 类型安全 |
| **构建** | Vite | 5.0 | 快速构建与热更新 |
| **扩展插件** | @crxjs/vite-plugin | 2.3 | Chrome扩展支持 |
| **状态管理** | Zustand | 4.4 | 轻量级状态管理 |
| **样式** | Tailwind CSS | 3.4 | 实用优先的CSS |
| **词形还原** | compromise.js | 14.11 | running → run |
| **模糊搜索** | Fuse.js | 7.0 | 智能搜索 |
| **虚拟滚动** | react-window | 1.8 | 大列表优化（待实现） |

---

## 📂 项目结构

```
word-memo/
├── src/
│   ├── background/         # Background Service Worker
│   │   ├── service-worker.ts
│   │   ├── llm-client.ts   # LLM API调用
│   │   ├── context-menu.ts # 右键菜单
│   │   ├── alarm-handler.ts # 定时任务
│   │   └── message-handler.ts
│   │
│   ├── content/            # Content Script
│   │   ├── index.ts        # 页面扫描与高亮
│   │   ├── toast.ts        # Toast通知
│   │   └── styles.css
│   │
│   ├── sidepanel/          # Side Panel UI
│   │   ├── App.tsx
│   │   ├── components/     # UI组件
│   │   │   ├── WordCard.tsx
│   │   │   ├── WordList.tsx
│   │   │   ├── WordDetail.tsx
│   │   │   ├── VocabularyManagement.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/          # Custom Hooks
│   │   │   ├── useWordStore.ts
│   │   │   └── useSettings.ts
│   │   └── styles/
│   │
│   ├── lib/                # 共享工具库
│   │   ├── storage.ts      # chrome.storage封装
│   │   ├── memory-algorithm.ts # 遗忘曲线
│   │   ├── word-normalizer.ts  # 词形还原
│   │   └── search.ts       # 模糊搜索
│   │
│   └── types/              # TypeScript类型
│       ├── index.ts
│       ├── messages.ts
│       └── storage.ts
│
├── public/
│   └── icons/              # 扩展图标
│
├── docs/                   # 文档
│   ├── PRD.md              # 产品需求
│   ├── 技术实现方案.md
│   └── DEVELOPMENT.md       # 开发指南
│
├── manifest.json
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## ⚠️ 已知问题与限制

### 当前限制

- 虚拟滚动优化尚未实现（大词库可能影响性能）
- 暂不支持编辑单词释义
- 暂不支持数据导入/导出
- 暂不支持侧边栏宽度调整

### 浏览器兼容性

- ✅ Microsoft Edge（推荐）
- ✅ Google Chrome
- ❌ Firefox（需要适配）
- ❌ Safari（不支持Side Panel API）

### LLM API 配置

确保配置正确的 API 端点和 Key,否则无法添加新单词。不同服务商的端点格式可能不同:

- **OpenAI**: `https://api.openai.com/v1/chat/completions`
- **Azure OpenAI**: `https://{resource}.openai.azure.com/openai/deployments/{model}/chat/completions?api-version=2023-05-15`
- **其他兼容服务**: 查阅服务商文档

---

## 🤝 贡献指南

我们欢迎任何形式的贡献!

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 遵循 TypeScript 最佳实践
- 使用 Prettier 格式化代码
- 编写清晰的注释
- 遵循 React Hooks 规则

详细开发指南请参阅 [DEVELOPMENT.md](DEVELOPMENT.md)

---

## 📝 文档

- [产品需求文档 (PRD)](PRD.md) - 完整的产品规划和功能说明
- [技术实现方案](技术实现方案.md) - 详细的架构和实现细节
- [开发指南](DEVELOPMENT.md) - 开发环境搭建和调试指南

---

## 🐛 问题反馈

遇到问题或有建议?

- 提交 Issue（推荐）
- 查看[常见问题](DEVELOPMENT.md#-常见问题)

---

## 📄 许可证

本项目采用 MIT 许可证

---

## 🙏 致谢

- 感谢 [OpenAI](https://openai.com/) 提供强大的 LLM API
- 感谢所有开源项目的贡献者

---

<div align="center">

**如果觉得有帮助,请给个 ⭐️ Star 支持一下!**

</div>

