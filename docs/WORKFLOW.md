# 任务记录规范 / Task Workflow

本仓库的每个任务都按 **Issue → Pull Request → Merge** 三步留痕，方便日后翻看：

1. **Issue**：任务开工前创建，写明背景、目标（checklist）、验收标准
2. **Pull Request**：在任务分支完成改动后创建，描述改了什么、如何验证；正文用 `Closes #<issue>` 关联
3. **Merge**：验证通过后合并 PR，Issue 自动关闭，并在 [README 项目记录表](../README.md) 追加一行

## 命名约定 / Naming

- 分支：`type/short-description`，如 `chore/initial-scaffold-pages`、`feat/unit-gallery`
- Issue 标题：`[类型] 简述`，类型可用 `Setup` / `Feat` / `Fix` / `Docs`
- Commit：Conventional Commits，如 `feat: add unit gallery`

## 模板 / Templates

### Issue 模板

```markdown
## 背景 / Background
## 目标 / Goals
- [ ] ...
## 验收 / Acceptance
- [ ] ...
```

### PR 模板

```markdown
## 改动内容 / Changes
## 验证方式 / Verification
- [ ] `node tests/recommend.test.mjs` 通过
- [ ] 页面/部署验证说明

Closes #<issue>
```
