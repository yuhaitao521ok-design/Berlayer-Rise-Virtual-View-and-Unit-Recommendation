# 启用 GitHub Pages 发布 / Enable GitHub Pages

本站为纯静态站点（无构建步骤），可直接用 GitHub Pages 发布。以下两种方式任选其一，均为**一次性**操作，需要仓库管理员权限：

## 方式 A：Deploy from a branch（最快，推荐首次使用）

1. 打开仓库 **Settings → Pages**
2. **Build and deployment → Source** 选择 **Deploy from a branch**
3. Branch 选 **`main`**、目录选 **`/ (root)`**，点击 **Save**
4. 约 1 分钟后访问：<https://yuhaitao521ok-design.github.io/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/>

站点根目录含 `.nojekyll`，GitHub 将原样发布静态文件（跳过 Jekyll 构建）。以后每次合并到 `main` 都会自动更新站点。

## 方式 B：GitHub Actions 自动部署（测试 + 发布全自动）

1. 把 [`ci/deploy.yml`](../ci/deploy.yml) 放到 **`.github/workflows/deploy.yml`**（网页端新建文件粘贴内容，或本地 git 提交均可）
2. 打开 **Settings → Pages**，**Source** 选择 **GitHub Actions**
3. 以后 push / 合并到 `main` 会自动运行推荐逻辑测试并发布；也可在 **Actions → Deploy to GitHub Pages → Run workflow** 手动触发

> **为什么需要这一步？**
> 当前仓库的自动化集成（GitHub App 令牌）没有 `workflows` 与 `pages`/`administration` 权限——GitHub 平台规定：GitHub App 提交 `.github/workflows/**` 文件与启用 Pages 必须拥有对应权限。因此这两项只能由仓库管理员操作一次；完成后即为全自动「push main → 自动部署」。
>
> 对应任务记录：Issue [#1](https://github.com/yuhaitao521ok-design/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/issues/1)（项目初始化）、Issue [#2](https://github.com/yuhaitao521ok-design/Berlayer-Rise-Virtual-View-and-Unit-Recommendation/issues/2)（启用发布）。
