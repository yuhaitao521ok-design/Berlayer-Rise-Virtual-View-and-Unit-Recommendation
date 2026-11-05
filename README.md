# Berlayer Rise · Virtual View & Unit Recommendation

面向未来房主的 **云端 3D 看房（Virtual View）+ 户型推荐（Unit Recommendation）** 网站：在浏览器里 360° 浏览楼盘模型、查看户型，并根据预算与需求获得推荐与购房指导。

**线上预览（GitHub Pages）**：<https://yuhaitao521ok-design.github.io/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/>

## 功能 / Features

- **云端三维看房**：Three.js 实时渲染楼盘模型，支持拖拽旋转、滚轮缩放、点击户型高亮并查看详情
- **户型一览**：户型卡片展示面积、朝向、指导价、销售状态与卖点
- **智能推荐**：按家庭人数、预算、选房重点（采光 / 安静 / 景观 / 无障碍 / 户外空间）打分排序，并给出可读的推荐理由
- **购房指导**：朝向、楼层、总预算、未来需求、噪音景观、转售价值等实用建议
- **自动部署**：push 到 `main` 自动运行测试并发布到 GitHub Pages

## 目录结构 / Structure

```text
index.html            页面入口（导航 / 户型 / 推荐 / 指导）
css/styles.css        样式（含移动端适配）
js/main.js            页面交互与渲染
js/viewer.js          3D 虚拟看房（Three.js，CDN 加载）
js/recommend.js       户型推荐纯逻辑（无依赖，可单测）
data/units.json       户型数据（示例占位，待官方房源资料替换）
assets/images/        图片素材（待上传，命名规范见其 README）
tests/                推荐逻辑单元测试
ci/deploy.yml         GitHub Pages 部署工作流（启用方式见 docs/GITHUB-PAGES-SETUP.md）
docs/WORKFLOW.md      任务记录规范（Issue → PR → Merge）
docs/GITHUB-PAGES-SETUP.md  发布启用指南
.nojekyll             跳过 Jekyll 构建，静态文件原样发布
```

## 本地运行 / Run locally

无需构建步骤，任意静态服务器即可：

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000

# 运行推荐逻辑测试
node tests/recommend.test.mjs   # 或 npm test
```

## 部署 / Deployment

站点为纯静态、无构建步骤，可直接发布到 GitHub Pages。启用是一次性操作，两种方式任选其一（详见 [docs/GITHUB-PAGES-SETUP.md](docs/GITHUB-PAGES-SETUP.md)）：

- **方式 A（推荐）**：Settings → Pages → Source 选 **Deploy from a branch** → `main` / root
- **方式 B**：把 `ci/deploy.yml` 放到 `.github/workflows/`，并在 Settings → Pages 选 **GitHub Actions**；之后 push `main` 自动运行测试并发布（也可手动 Run workflow）

启用后地址：<https://yuhaitao521ok-design.github.io/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/>

## 内容更新 / Updating content

- **房源图片**：放入 `assets/images/`，命名规范见 [assets/images/README.md](assets/images/README.md)；上传后把 `index.html` 中的 `hero-placeholder.svg` 等占位图路径替换即可
- **房源详细信息**：编辑 [`data/units.json`](data/units.json)

### `units.json` 字段说明

| 字段 | 说明 |
| --- | --- |
| `id` / `type` / `name` | 户型编号、类型、展示名称 |
| `bedrooms` / `bathrooms` / `areaSqm` | 卧室数、卫生间数、建筑面积（㎡） |
| `floor` / `aspect` | 楼层（从 0 起）、朝向（N/S/E/W） |
| `priceFrom` / `status` | 指导价（GBP）、状态（`available` / `reserved` / `sold`） |
| `tags` | 推荐引擎匹配标签（如 `step-free` / `balcony` / `quiet` / `views` / `sunlight`） |
| `features` | 卡片展示的卖点列表 |
| `grid` | 3D 模型中的位置：`col` 列、`floor` 层（需与 `floor` 一致） |

## 项目记录 / Work log（每个任务：Issue → PR → Merge）

| 日期 | 任务 | Issue | Pull Request |
| --- | --- | --- | --- |
| 2026-11-05 | 项目初始化：站点脚手架 + 3D 看房 + GitHub Pages 部署配置 | [#1](https://github.com/yuhaitao521ok-design/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/issues/1) | [#2](https://github.com/yuhaitao521ok-design/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/pull/2) |
| 2026-11-05 | 修正发布启用指南 Issue 引用（#2 → #3） | [#4](https://github.com/yuhaitao521ok-design/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/issues/4) | [#5](https://github.com/yuhaitao521ok-design/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/pull/5) |
| 2026-11-05 | 补充网页端创建 deploy.yml 的分步指引 | [#6](https://github.com/yuhaitao521ok-design/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/issues/6) | [#7](https://github.com/yuhaitao521ok-design/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/pull/7) |

## 后续计划 / Next

- [ ] 接入上传的楼盘图片素材（效果图 / 样板间 / 总平面图）
- [ ] 用官方房源详细信息替换 `data/units.json` 示例数据
- [ ] 增加楼栋 / 楼层切换与室内 360° 全景看房
- [ ] 推荐结果导出与分享
