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
│   └── styles.css              # 高亮样式
│
├── sidepanel/           # Side Panel UI
│   ├── index.html              # HTML入口
│   ├── main.tsx                # React入口
│   ├── App.tsx                 # 主应用组件
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

### ✅ 已完成（MVP基础）

- [x] 项目脚手架和构建配置
- [x] TypeScript类型系统
- [x] chrome.storage封装层
- [x] 遗忘曲线算法实现
- [x] 词形还原功能
- [x] Background Service Worker基础框架
- [x] 右键菜单注册
- [x] LLM API调用客户端
- [x] 定时任务（遗忘曲线检查）
- [x] Content Script页面扫描
- [x] 单词高亮渲染
- [x] Side Panel基础UI

### 🚧 待实现（按优先级）

#### 高优先级（MVP必需）
- [ ] Side Panel - 单词卡片组件
- [ ] Side Panel - 词库列表展示
- [ ] Side Panel - 记忆反馈按钮交互
- [ ] Side Panel - 设置页面
- [ ] Content Script - 可视区域检测
- [ ] Content Script - 实时滚动更新

#### 中优先级（V1.0功能）
- [ ] Side Panel - 虚拟滚动优化
- [ ] Side Panel - 词库浏览Tab
- [ ] Side Panel - 模糊搜索功能
- [ ] Side Panel - 侧边栏宽度调整
- [ ] Side Panel - 待复习提醒
- [ ] 编辑单词功能
- [ ] 删除单词功能

#### 低优先级（增强功能）
- [ ] 单词发音功能
- [ ] 数据导入/导出
- [ ] 统计面板
- [ ] 深色模式

## 🎨 样式指南

### Tailwind CSS类名

项目使用Tailwind CSS,主要配色定义在 `tailwind.config.js`:

```javascript
colors: {
  'memory-new': '#EF4444',      // 红色 - 新词
  'memory-familiar': '#F59E0B',  // 橙色 - 有印象
  'memory-learning': '#EAB308',  // 黄色 - 学习中
  'memory-mastered': '#22C55E',  // 绿色 - 已掌握
  'memory-archived': '#9CA3AF',  // 灰色 - 已归档
}
```

### 组件样式约定

- 使用Tailwind CSS工具类优先
- 自定义组件类使用 `@layer components`
- 避免内联样式,除非动态计算

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
Content Script → Background: { type: 'ADD_WORD', payload: { word } }
Background → Content Script: { type: 'WORD_ADDING', payload: { word } }
Background → Content Script: { type: 'WORD_ADDED', payload: { word } }
Background → Side Panel: { type: 'VOCABULARY_UPDATED' }
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

## 📝 开发注意事项

### 1. Service Worker生命周期

- Service Worker可能随时被终止,不要依赖全局变量
- 使用chrome.storage持久化数据
- 使用chrome.alarms而非setTimeout

### 2. Content Script注入时机

- 使用 `run_at: "document_idle"` 确保DOM加载完成
- 监听动态内容变化（MutationObserver）

### 3. 类型安全

- 所有chrome API调用都应有类型定义
- 使用 `@types/chrome` 包
- 消息传递使用强类型接口

### 4. 性能优化

- Content Script避免阻塞主线程
- 使用Debounce处理高频事件
- Side Panel使用虚拟滚动处理大列表

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

## 🔗 相关资源

- [Chrome Extension Manifest V3文档](https://developer.chrome.com/docs/extensions/mv3/)
- [React官方文档](https://react.dev/)
- [Tailwind CSS文档](https://tailwindcss.com/)
- [Zustand状态管理](https://github.com/pmndrs/zustand)

## 📞 获取帮助

遇到问题时:
1. 查看浏览器Console错误信息
2. 检查Background Service Worker日志
3. 参考技术实现方案文档
4. 提交GitHub Issue

---

**Happy Coding! 🎉**
