# 自律打卡 App

Vue 3 + Ionic Vue + Capacitor 的本地优先安卓 MVP 骨架。

## MVP 阶段

1. 项目骨架、路由、基础页面、Android 工程。
2. 任务 CRUD，经由 repository/storage 层保存。
3. 每日打卡和防重复打卡。
4. streak、失败次数、完成率统计规则。
5. 奖励、惩罚提示规则。
6. Capacitor Local Notifications 本地提醒。
7. Android 真机安装测试。

## 常用命令

```bash
corepack pnpm install
corepack pnpm run dev
corepack pnpm run build
corepack pnpm run android:add
corepack pnpm run android:sync
```

Android 本地构建环境见 [docs/android-setup.md](docs/android-setup.md)。
