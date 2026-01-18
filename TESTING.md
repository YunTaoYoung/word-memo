# Word Memo - 测试清单

## ✅ 构建验证

- [ ] `npm run build` 成功执行
- [ ] `dist/` 目录包含以下文件：
  - [ ] `manifest.json`
  - [ ] `background.js`
  - [ ] `content.js`
  - [ ] `content.css`
  - [ ] `sidepanel.js`
  - [ ] `sidepanel.css`
  - [ ] `icons/icon16.png`
  - [ ] `icons/icon48.png`
  - [ ] `icons/icon128.png`

## ✅ 浏览器加载

- [ ] Edge扩展页面能识别 `dist/` 为有效扩展
- [ ] 无"清单文件错误"提示
- [ ] 插件出现在扩展列表中
- [ ] 工具栏显示插件图标（即使是临时SVG图标）

## ✅ Service Worker

打开 `edge://extensions/` → 找到 Word Memo → 点击"Service Worker"

- [ ] Service Worker 成功启动
- [ ] Console 显示 `[Word Memo] Service Worker started`
- [ ] 无错误信息

## ✅ 右键菜单

在任意网页上：

- [ ] 选中文本后右键能看到"📚 添加到词库"
- [ ] 点击菜单项不报错（需先配置LLM API）

## ✅ 侧边栏

- [ ] 点击插件图标能打开侧边栏
- [ ] 侧边栏显示欢迎页
- [ ] 能看到"快速开始"说明
- [ ] 点击折叠按钮（◀）能折叠侧边栏

## ✅ Content Script（可选，需在控制台查看）

在任意网页打开开发者工具 → Console：

- [ ] 看到 `[Word Memo] Content script initialized`
- [ ] 看到 `[Word Memo] Loaded X words`（初次为0）
- [ ] 无错误信息

## 🔧 下一步测试（需要配置LLM API）

配置完成后测试：

- [ ] 添加单词功能
- [ ] LLM释义生成
- [ ] 页面单词高亮
- [ ] 记忆反馈功能

## 🐛 已知限制

当前MVP版本暂不支持：
- 设置页面（UI未实现）
- 单词卡片展示（UI未实现）
- 词库浏览（UI未实现）
- 可视区域检测（使用全页扫描）
- 虚拟滚动优化

这些功能将在后续迭代中实现。

## 📝 测试笔记

记录测试过程中发现的问题：

```
日期: ____
测试人: ____
浏览器版本: Edge ____

问题1:
  描述:
  重现步骤:
  预期:
  实际:

问题2:
  ...
```
