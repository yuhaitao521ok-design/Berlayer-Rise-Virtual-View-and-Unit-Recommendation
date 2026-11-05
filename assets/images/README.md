# 图片素材 / Image assets

等待上传的楼盘素材请放到本目录。命名规范：小写字母、数字、连字符，优先 WebP/JPG，单张建议 ≤ 500KB、长边 ≥ 1600px。

| 建议文件名 | 用途 | 用在哪里 |
| --- | --- | --- |
| `hero.jpg` / `hero.webp` | 首页主视觉效果图 | `index.html` 中 `.hero-art img`（替换 `hero-placeholder.svg`） |
| `site-plan.jpg` | 总平面图 | 可扩展「小区布局」版块 |
| `unit-type-a.jpg` … | 各户型样板间 / 平面图 | 户型卡片或户型详情 |
| `view-south.jpg` 等 | 景观 / 朝向照片 | 「购房指导」版块配图 |

## 接入方式 / How to wire up

1. 把图片放入本目录（文件名按上表）；
2. 在 `index.html` / `js/main.js` 中把占位图路径（`assets/images/hero-placeholder.svg`）替换为新文件名；
3. 走 **Issue → PR → Merge** 流程提交（见 [docs/WORKFLOW.md](../../docs/WORKFLOW.md)）。

`favicon.svg` 为站点图标；`hero-placeholder.svg` 为占位效果图，可随时删除替换。
