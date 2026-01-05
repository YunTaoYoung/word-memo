# Word Memo - 词汇记忆助手

> 非侵入式英文阅读辅助与AI驱动的词汇记忆管理工具

## 🎯 核心功能

- ✨ **非侵入式阅读**: 保持原文完整性，通过侧边栏辅助而非翻译覆盖
- 🎯 **主动式学习**: 用户自主选择生词，避免被动推送干扰
- 🧠 **科学记忆管理**: 基于遗忘曲线的多级记忆状态自适应系统
- 🤖 **AI智能释义**: LLM生成场景化释义，支持OpenAI API兼容接口

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 加载到浏览器

#### 步骤 1: 构建项目

```bash
npm run build
```

构建成功后，`dist/` 目录将包含所有必需文件。

#### 步骤 2: 加载扩展

1. 打开 Edge 浏览器
2. 访问 `edge://extensions/`
3. 在右上角启用"**开发者模式**"
4. 点击"**加载解压缩的扩展**"
5. 选择项目的 `dist/` 文件夹
6. 确认加载成功，插件图标应该出现在工具栏

#### 步骤 3: 配置 LLM API（首次使用）

1. 点击插件图标打开侧边栏
2. 点击右上角设置按钮 ⚙️
3. 配置以下信息：
   - **API 端点**: `https://api.openai.com/v1/chat/completions`（或其他兼容接口）
   - **API Key**: 你的 OpenAI API Key
   - **模型**: `gpt-3.5-turbo-0125`（推荐）
4. 点击"测试连接"验证配置
5. 保存设置

#### 步骤 4: 开始使用

1. 访问任意英文网页（如 [MDN Web Docs](https://developer.mozilla.org/)）
2. 选中一个生词（如 "asynchronous"）
3. 右键选择"📚 添加到词库"
4. 等待几秒，侧边栏将显示单词释义
5. 点击"记住了"或"还不熟"进行记忆反馈

## ⚠️ 已知问题

### 图标显示

当前使用的是 SVG 临时占位符图标。如果图标无法显示，请参考 [public/icons/README.md](public/icons/README.md) 创建真正的 PNG 图标文件。

### 首次加载可能遇到的问题

如果加载扩展时提示"清单文件丢失或不可读取"：
1. 确保已运行 `npm run build`
2. 检查 `dist/` 目录是否包含 `manifest.json`
3. 尝试删除 `dist/` 并重新构建

## 📚 文档

- [产品需求文档 (PRD)](./PRD.md)
- [技术实现方案](./技术实现方案.md)

## 🛠️ 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **文本处理**: compromise.js
- **搜索**: Fuse.js

## 📝 License

MIT
