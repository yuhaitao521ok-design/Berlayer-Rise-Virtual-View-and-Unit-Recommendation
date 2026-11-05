# 原始素材 / Source materials

这里存放楼盘的**原始素材**（仅存于仓库，**不会**发布到网站）。网页展示用的图片会在处理后放入 [`assets/images/`](../assets/images/)。

## 目录

| 目录 | 放什么 | 数量 |
| --- | --- | --- |
| [`pdf/`](pdf/) | 楼盘详细信息 PDF（建筑商 / 开发商原始文件） | 1 份 |
| [`photos/`](photos/) | 建筑商真实沙盘照片 | 7 张 |

## 上传方式与命名建议

- **上传位置**：把 8 个文件分别拖进上面对应文件夹（GitHub 网页端：进入文件夹 → **Add file → Upload files** → 提交到 `main`；或直接发给我，由我按流程提交）
- **命名建议**（保留原文件名也可以，我来规范化）：
  - `pdf/berlayer-rise-brochure.pdf`
  - `photos/sandbox-01.jpg` … `photos/sandbox-07.jpg`
- **大小 / 格式**：单个文件建议 ≤ 50MB（GitHub 硬限制 100MB）；照片 JPG / PNG / HEIC 均可，手机原图直接传即可，网页版由我压缩生成
- 如果 PDF 超过 50MB，请先告诉我，我会先压缩再入库

## 拿到素材后的处理流程（照例：Issue → PR → Merge）

1. 解析 PDF 中的房源详细信息 → 更新 [`data/units.json`](../data/units.json)（户型 / 面积 / 朝向 / 价格等）与页面文案
2. 7 张沙盘照片 → 挑选、压缩、规范命名后放入 `assets/images/`，替换占位效果图，并在「云端看房 / 小区布局」版块展示
3. 跑测试 + 线上截图验收后发布

> 隐私说明：本目录不随站点发布（部署工作流只发布 `index.html`、`css`、`js`、`data`、`assets`），原始素材仅在代码仓库中留存。
