# 图标说明

## 当前状态

当前使用的是 SVG 临时占位符图标。虽然文件扩展名是 `.png`，但实际内容是 SVG 格式。

Edge 浏览器可能会接受 SVG 格式，但如果遇到图标显示问题，请按照以下步骤创建真正的 PNG 图标：

## 创建真正的 PNG 图标

### 方法 1：使用在线工具转换

1. 打开 [CloudConvert](https://cloudconvert.com/svg-to-png) 或类似工具
2. 上传 `public/icons/icon.svg`
3. 分别转换为 16x16、48x48、128x128 三种尺寸
4. 下载并重命名为：
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
5. 放入 `public/icons/` 目录
6. 重新运行 `npm run build`

### 方法 2：使用设计工具

使用 Figma、Sketch、或 Photoshop 等工具：
1. 打开 `public/icons/icon.svg`
2. 导出为 PNG，尺寸分别为 16x16、48x48、128x128
3. 保存到 `public/icons/` 目录

### 方法 3：使用 ImageMagick（命令行）

如果安装了 ImageMagick：

```bash
cd public/icons
magick icon.svg -resize 16x16 icon16.png
magick icon.svg -resize 48x48 icon48.png
magick icon.svg -resize 128x128 icon128.png
```

## 临时解决方案

如果现在就想测试插件功能而不关心图标：

1. 当前的 SVG 占位符在大多数情况下可以工作
2. 如果浏览器报错，可以下载任意 PNG 图片并重命名为相应尺寸

## 未来改进

正式发布前应该设计专业的品牌图标。
