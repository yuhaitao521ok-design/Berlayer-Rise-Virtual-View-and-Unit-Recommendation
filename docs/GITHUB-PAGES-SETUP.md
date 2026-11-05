# 启用 GitHub Pages 发布 / Enable GitHub Pages

本站为纯静态站点（无构建步骤），可直接用 GitHub Pages 发布。以下两种方式任选其一，均为**一次性**操作，需要仓库管理员权限：

## 方式 A：Deploy from a branch（最快，推荐首次使用）

1. 打开仓库 **Settings → Pages**
2. **Build and deployment → Source** 选择 **Deploy from a branch**
3. Branch 选 **`main`**、目录选 **`/ (root)`**，点击 **Save**
4. 约 1 分钟后访问：<https://yuhaitao521ok-design.github.io/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/>

站点根目录含 `.nojekyll`，GitHub 将原样发布静态文件（跳过 Jekyll 构建）。以后每次合并到 `main` 都会自动更新站点。

## 方式 B：GitHub Actions 自动部署（测试 + 发布全自动）

### Q：仓库里找不到 `.github/workflows/` 文件夹？

对，**这个文件夹默认不存在，需要新建一次**（自动化集成没有创建 workflow 文件的权限，属 GitHub 平台限制）。在 GitHub 网页端新建文件时，**在文件名框里输入带 `/` 的路径，GitHub 会自动把文件夹创建出来**，不需要你手动建文件夹。

### 网页端分步操作（约 2 分钟）

1. 打开仓库首页，确认左上角分支选择器是 **`main`**
2. 点击 **Add file** ▾ → **Create new file**
3. 在文件名输入框（"Name your file..."）里输入：`.github/workflows/deploy.yml`
   - 每输入一个 `/` GitHub 都会自动生成一层文件夹，最终路径就是 `.github/workflows/deploy.yml`
4. 把 [`ci/deploy.yml`](../ci/deploy.yml) 的内容复制进编辑框：
   - 打开该文件 → 点右上角 **Copy raw file** 按钮；或直接复制下方「deploy.yml 全文」
5. 点右上角 **Commit changes...** → 选 **Commit directly to the `main` branch** → **Commit changes**
6. 打开 **Settings → Pages** → Build and deployment → Source 选 **GitHub Actions**
7. 打开 **Actions** 页签 → **Deploy to GitHub Pages** → **Run workflow** 手动跑一次
   - 若第 5 步提交时 Pages 还没启用，首次运行会报错；完成第 6 步后重跑即可。以后 push / 合并到 `main` 都是全自动

<details>
<summary>点开查看 deploy.yml 全文（与 ci/deploy.yml 相同）</summary>

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run recommendation logic tests
        run: node tests/recommend.test.mjs

      - name: Assemble site
        run: |
          mkdir -p _site
          cp index.html .nojekyll _site/
          cp -r css js data assets _site/

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload site artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

</details>

> **为什么需要这一步？**
> 当前仓库的自动化集成（GitHub App 令牌）没有 `workflows` 与 `pages`/`administration` 权限——GitHub 平台规定：GitHub App 提交 `.github/workflows/**` 文件与启用 Pages 必须拥有对应权限。因此这两项只能由仓库管理员操作一次；完成后即为全自动「push main → 自动部署」。
>
> 对应任务记录：Issue [#1](https://github.com/yuhaitao521ok-design/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/issues/1)（项目初始化）、Issue [#3](https://github.com/yuhaitao521ok-design/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/issues/3)（启用发布）。
