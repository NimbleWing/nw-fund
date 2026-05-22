---
description: Generate conventional commit message suggestions
agent: general
---

分析 git 暂存区内容，严格遵循以下规则给出多条 commit message 候选：

## 规则

- 类型 (type): feat / fix / docs / style / refactor / test / chore / perf / ci / build / revert
- 格式: <type>(<scope>): <subject>
- scope（可选）: 当改动限定在特定模块时添加，如 backend / ui / config / db
- subject: sentence-case（首字母大写），句末不加句号
- header 不超过 100 字符

## 约束

- 只读操作：不修改文件、不暂存、不提交、不运行 git 写命令
- 暂存区为空时回复："没有内容暂存，先暂存"
- 输出 2-3 条候选，按推荐优先级排列
- 仅输出消息本身，不加额外说明或 emoji
