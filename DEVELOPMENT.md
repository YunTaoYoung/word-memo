# Word Memo 开发指南

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev
```

这将启动开发服务器,代码会实时编译但不会自动重载到浏览器。

### 3. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 4. 加载到浏览器

1. 打开 Edge 浏览器
2. 访问 `edge://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载解压缩的扩展"
5. 选择项目的 `dist/` 文件夹

### 5. 调试

- **Background Service Worker**: `edge://extensions/` → 找到插件 → 点击"Service Worker"链接
- **Content Script**: 在页面上右键 → 检查元素 → Console标签
- **Side Panel**: 打开侧边栏后右键 → 检查元素

## 📁 项目结构

```
src/
├── background/          # Background Service Worker
│   ├── service-worker.ts       # 入口文件
│   ├── context-menu.ts         # 右键菜单处理
│   ├── llm-client.ts           # LLM API调用
│   ├── alarm-handler.ts        # 定时任务（遗忘曲线）
│   └── message-handler.ts      # 消息路由
│
├── content/             # Content Script
│   ├── index.ts                # 页面扫描和高亮
│   ├── toast.ts                # Toast通知
│   └── styles.css              # 高亮样式
│
├── sidepanel/           # Side Panel UI
│   ├── index.html              # HTML入口
│   ├── main.tsx                # React入口
│   ├── App.tsx                 # 主应用组件
│   ├── components/             # UI组件
│   │   ├── WordCard.tsx        # 单词卡片（支持折叠/展开）
│   │   ├── WordList.tsx        # 单词列表
│   │   ├── WordDetail.tsx      # 单词详情页
│   │   ├── VocabularyManagement.tsx  # 词库管理
│   │   └── Settings.tsx        # 设置页
│   ├── hooks/                  # Custom Hooks
│   │   ├── useWordStore.ts     # 词库状态管理
│   │   └── useSettings.ts      # 设置状态管理
│   └── styles/
│       └── index.css           # Tailwind CSS
│
├── lib/                 # 共享工具库
│   ├── storage.ts              # chrome.storage封装
│   ├── memory-algorithm.ts     # 遗忘曲线算法
│   ├── word-normalizer.ts      # 词形还原
│   ├── search.ts               # 模糊搜索
│   ├── utils.ts                # 通用工具
│   └── constants.ts            # 常量定义
│
└── types/               # TypeScript类型
    ├── index.ts                # 核心类型
    ├── messages.ts             # 消息类型
    └── storage.ts              # 存储类型
```

## 🔧 核心功能实现状态

### ✅ 已完成功能

#### 核心架构
- [x] 项目脚手架和Vite构建配置
- [x] TypeScript类型系统（types/）
- [x] Chrome Extension Manifest V3配置
- [x] React 18 + Tailwind CSS UI框架

#### 数据层
- [x] chrome.storage.local封装层（lib/storage.ts）
- [x] 遗忘曲线算法实现（lib/memory-algorithm.ts）
- [x] 词形还原功能（compromise.js集成）
- [x] 模糊搜索功能（Fuse.js集成）

#### Background Service Worker
- [x] Service Worker基础框架
- [x] 右键菜单注册与处理
- [x] LLM API调用客户端（支持OpenAI兼容接口）
- [x] 定时任务（遗忘曲线检查）
- [x] 消息路由与处理

#### Content Script
- [x] 页面单词扫描
- [x] 单词高亮渲染（基于记忆等级的不同样式）
- [x] 可视区域检测（IntersectionObserver）
- [x] 实时滚动更新（Debounce优化）
- [x] 计数器机制（支持页面多处出现同一单词）
- [x] Toast通知系统

#### Side Panel UI
- [x] 主应用框架（App.tsx）
- [x] 单词卡片组件（WordCard.tsx）
  - [x] 折叠/展开功能
  - [x] 记忆反馈按钮交互
  - [x] 单词朗读功能
  - [x] 删除单词功能
- [x] 词库列表展示（WordList.tsx）
- [x] 词库管理页面（VocabularyManagement.tsx）
  - [x] 搜索功能
  - [x] 排序功能（字母序、掌握程度）
  - [x] 词性过滤
- [x] 单词详情页（WordDetail.tsx）
- [x] 设置页面（Settings.tsx）
  - [x] LLM API配置
  - [x] 显示选项设置
  - [x] 数据统计信息
- [x] Tab切换（当前页生词 / 词库管理）
- [x] 高亮单词点击定位到侧边栏

#### 交互优化
- [x] 卡片折叠/展开动画
- [x] 点击页面高亮词滚动到卡片
- [x] 卡片展开/折叠状态管理
- [x] 折叠状态下释义内联显示（2行限制）
- [x] 仅左上角箭头可触发展开/折叠

### 🚧 待实现功能

#### 中优先级（用户体验优化）
- [ ] 虚拟滚动优化（当前未使用react-window）
- [ ] 待复习提醒UI组件
- [ ] 编辑单词功能（WordEditModal.tsx）
- [ ] 数据导入/导出功能
- [ ] 侧边栏宽度调整（ResizablePanel.tsx）

#### 低优先级（增强功能）
- [ ] 统计面板（学习曲线、掌握度分布）
- [ ] 深色模式
- [ ] 批量操作（批量删除、批量标记）
- [ ] 词根词缀联想网络可视化
- [ ] 游戏化学习功能

### 📊 实现进度

**整体完成度**: ~85%（MVP核心功能已完成）

- ✅ 数据层: 100%
- ✅ Background: 100%
- ✅ Content Script: 100%
- ✅ Side Panel: 90%（缺少虚拟滚动、编辑功能）
- ✅ UI交互: 95%（主要功能已实现）

## 🎨 样式指南

### Tailwind CSS类名

项目使用Tailwind CSS,主要配色定义在 `src/lib/constants.ts`:

```typescript
export const MEMORY_COLORS = {
  [MemoryLevel.NEW]: '#EF4444',      // 红色 - 新词
  [MemoryLevel.FAMILIAR]: '#F59E0B',  // 橙色 - 有印象
  [MemoryLevel.LEARNING]: '#EAB308',  // 黄色 - 学习中
  [MemoryLevel.MASTERED]: '#22C55E',  // 绿色 - 已掌握
  [MemoryLevel.ARCHIVED]: '#9CA3AF',  // 灰色 - 已归档
};
```

### 组件样式约定

- 使用Tailwind CSS工具类优先
- 自定义组件类使用 `@layer components`
- 避免内联样式,除非动态计算（如`style={{ borderColor: levelColor }}`）

## 🔌 API设计

### Chrome Storage结构

```typescript
{
  "vocabulary": {
    "word1": WordDataSerialized,
    "word2": WordDataSerialized,
    // ...
  },
  "settings": UserSettings,
  "sidebarWidth": number
}
```

### 消息传递协议

Background ↔ Content Script ↔ Side Panel

```typescript
// 添加单词流程
Content Script → Background: 右键菜单点击
Background → Content Script: { type: 'WORD_ADDING', payload: { word } }
Background → Content Script: { type: 'WORD_ADDED', payload: { word } }
Background → Side Panel: { type: 'VOCABULARY_UPDATED' }

// 可见单词更新
Content Script → Side Panel: { type: 'VISIBLE_WORDS_UPDATED', payload: { words } }

// 高亮词点击定位
Content Script → Side Panel: { type: 'SCROLL_TO_CARD', payload: { word } }

// 单词样式更新
Background → Content Script: { type: 'UPDATE_WORD_STYLE', payload: { word, level } }
```

## 🧪 测试建议

### 手动测试流程

1. **添加单词测试**
   - 打开英文页面（如MDN文档）
   - 选中单词 "async" → 右键 → "添加到词库"
   - 检查LLM是否正确生成释义
   - 检查侧边栏是否显示新单词

2. **记忆管理测试**
   - 点击"记住了"，检查卡片颜色是否变化
   - 检查下次复习时间是否正确计算
   - 等待30分钟，检查定时任务是否降级过期单词

3. **页面扫描测试**
   - 添加单词后刷新页面
   - 检查单词是否被高亮
   - 点击高亮单词，检查侧边栏是否定位

4. **折叠/展开测试**
   - 点击卡片左上角箭头，检查折叠/展开动画
   - 点击页面高亮词，检查卡片展开
   - 再次点击同一高亮词，检查卡片折叠

5. **词库管理测试**
   - 切换到"词库管理"Tab
   - 测试搜索功能（输入单词或释义）
   - 测试排序功能（字母序、掌握程度）
   - 测试词性过滤
   - 点击单词查看详情页

## 📝 开发注意事项

### 1. Service Worker生命周期

- Service Worker可能随时被终止,不要依赖全局变量
- 使用chrome.storage持久化数据
- 使用chrome.alarms而非setTimeout

### 2. Content Script注入时机

- 使用 `run_at: "document_idle"` 确保DOM加载完成
- 监听动态内容变化（MutationObserver）
- 注意计数器机制避免重复高亮

### 3. 类型安全

- 所有chrome API调用都应有类型定义
- 使用 `@types/chrome` 包
- 消息传递使用强类型接口

### 4. 性能优化

- Content Script避免阻塞主线程
- 使用Debounce处理高频事件（滚动、输入）
- Side Panel大列表考虑虚拟滚动
- IntersectionObserver监听可见性

### 5. 最新实现特性

- **计数器机制**: 使用Map跟踪单词在页面中的多个实例
- **Fragment构建**: 一次性构建完整文档片段再替换,避免DOM操作导致的偏移问题
- **函数式setState**: 避免useEffect依赖循环
- **条件延迟**: 首次打开无延迟,切换卡片时150ms延迟
- **内联释义**: 折叠状态下使用inline + line-clamp-2

## 🐛 常见问题

### Q: Service Worker无法启动?
**A**: 检查 `manifest.json` 中的 `background.service_worker` 路径是否正确,确保构建后文件存在。

### Q: Content Script样式不生效?
**A**: 检查CSS文件是否在 `manifest.json` 的 `content_scripts.css` 中声明。

### Q: LLM API调用失败?
**A**:
1. 检查API Key是否正确
2. 检查网络连接
3. 查看Background Service Worker控制台的错误信息
4. 确认API端点格式正确

### Q: Tailwind样式不生效?
**A**: 确保在 `sidepanel/styles/index.css` 中导入了Tailwind指令,并且构建时正确处理了CSS。

### Q: 卡片会疯狂展开/折叠?
**A**: 这是由于useEffect依赖导致的无限循环。解决方案：
1. 从依赖数组中移除`focusedWord`
2. 使用函数式`setState`来访问当前值

### Q: 折叠状态下释义换行太多?
**A**: 使用以下CSS类组合：
- 容器: `line-clamp-2`（限制2行）
- 子元素: `inline`（内联布局）
- 分隔符: `•`（bullet点）

## 🔗 相关资源

- [Chrome Extension Manifest V3文档](https://developer.chrome.com/docs/extensions/mv3/)
- [React官方文档](https://react.dev/)
- [Tailwind CSS文档](https://tailwindcss.com/)
- [compromise.js文档](https://github.com/spencermountain/compromise)
- [Fuse.js文档](https://fusejs.io/)

## 📞 获取帮助

遇到问题时:
1. 查看浏览器Console错误信息
2. 检查Background Service Worker日志
3. 参考PRD和技术实现方案文档
4. 检查相关GitHub Issue

## 📦 依赖说明

### 核心依赖
- **React 18**: UI框架
- **TypeScript 5.3**: 类型安全
- **Tailwind CSS 3.4**: 样式方案
- **Zustand 4.4**: 轻量级状态管理

### 功能库
- **compromise 14.11**: 词形还原（running→run）
- **Fuse.js 7.0**: 模糊搜索
- **react-window 1.8**: 虚拟滚动（待实现）

### 构建工具
- **Vite 5.0**: 快速构建工具
- **@crxjs/vite-plugin 2.3**: Chrome扩展Vite插件

---

**Happy Coding! 🎉**
