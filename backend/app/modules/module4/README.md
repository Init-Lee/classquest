<!--
文件说明：模块 4 后端域说明。
职责：说明模块 4 后端的运行时流程、职责和当前骨架状态。
更新触发：模块 4 后端业务流程、router、service 或状态流变化时，需要同步更新本文件。
-->

# Backend Module 4

模块 4 后端支持「AI 信息侦探」运行时流程。

## 目标流程

```text
学生提交题卡包
→ 教师审核
→ 题卡进入试答池
→ 教师开启试答轮次
→ 匿名学生答题
→ 学生快速评分
→ 教师计算统计并开放反馈
→ 学生提交 V3 修订
→ 导出最终题库/画廊
```

## 当前状态

当前已提供课时 3 题卡自检助手后端壳，并在阶段 B0 新增课时 4 同伴互审 SQLite 基座；B1~B7 已实现送审、状态、撤回、审查者收件箱、claim、submit、pull 与 `moderate-text` 文字审核。课时 5 已完成 Phase 0 后端地基、C1a 账号/班级权限、C2a 学生 V2 题池提交与教师题池 overview、C3a 教师 session 后端控制（建会话、列会话、设置、锁池冻结当前 V2、phase 顺序状态机和 session overview）、C4a 学生 active-session、participant attach、session state 与 assignment 生成/读取、C5a 学生 answer/rating 写入和教师 progress 聚合、C6a compute-stats/analytics/my-report 后端能力，以及 C7a V3 修订提交、completion-summary 与教师 revision-plans 后端能力。当前停在 C7a 后端人机验证点，学生 Step4 UI、本地快照/HTML 与教师修订面板前端仍待 C7b。

课时 4 后续端点实现时，后端必须重新校验完整 4 位班学号、同班约束和自送拦截；前端只输入后两位只是交互约束，不是安全边界。

## 非职责

- 完整学生登录
- 完整 LMS 进度追踪
- Moodle 替代
- 实时协作
- WebSocket

