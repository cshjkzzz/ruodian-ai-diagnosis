# 第一阶段验证记录

验证日期：2026-10-28。环境：Linux 云端，Node.js 24.19.0、npm 11.9.0、Python 3.12.14、系统 Chromium。所有结果均指当前实例，未声称 GitHub Actions、商店发布或其他新实例已执行成功。

## 实际执行结果

| 检查 | 结果 | 覆盖与限制 |
| --- | --- | --- |
| `npm ci` | 通过 | 从 npm 锁文件重建移动端依赖 |
| `npm run typecheck` | 通过 | Expo Router 页面、组件、领域逻辑与测试 TypeScript |
| `npm test` | 5 项通过 | 分类搜索、解决状态判定、返回修改清除旧答案、损坏存储校验、跳过项目的统计 |
| `npm run export:web` | 通过 | 网页生产资源导出，动态记录路由采用 SPA 回退 |
| Playwright / 系统 Chromium | 3 项通过 | 搜索/空状态/文章详情；六步排障/返回/异常/跳过/保存/编辑/刷新持久化/删除；资料持久化/会员占位/未配后端提示 |
| `expo export --platform android --platform ios` | 两平台通过 | Android 与 iOS Hermes / JS 资源打包；不是原生编译 |
| `pip install -r requirements.lock.txt` | 通过 | Python 完整锁定依赖可安装 |
| `pytest -q` | 5 项通过 | 健康与能力；文章；记录 CRUD/校验；会话顺序/返回/跳过/保存/重启持久化；扩展能力不伪装可用 |
| Expo localhost 实时开发预览 | 通过 | 启动开发服务器并由 Chromium 验证首页真实渲染，无页面异常 |
| Uvicorn + 真实 HTTP | 通过 | `/health`、网络分类文章查询；浏览器跨域 PUT 预检返回 200 |
| 实际页面截图 | 4 张 | 手机首页/排障/知识库、桌面首页；截图运行无 JS 页面异常 |
| Expo 内置版本兼容检查 | 通过 | `EXPO_OFFLINE=1 npx expo install --check` 显示依赖为推荐版本；未完成远程 React Native Directory/Expo 在线元数据校验 |
| Android 原生编译与真机 | 未运行 | 当前无 Android SDK/模拟器；未生成 APK/AAB |
| iOS 原生编译与真机 | 未运行 | Linux 无 macOS/Xcode；未配置 Apple/Expo 签名账号，未生成 IPA |
| EAS 云构建、TestFlight、商店发布 | 未运行 | README 提供后续步骤，未声称账号已配置或已发布 |

浏览器最初的完整流程测试发现图标字符混入按钮的无障碍名称，已修复为明确的中文按钮名称并重新通过。截图检查发现底部标签裁切，已修正导航高度、文字行高与安全区处理。首次 Metro 构建不能读取 checkout 外层的共享演示资料，已在 `metro.config.js` 显式声明共享目录并通过三平台打包。

## 仍需处理的事项

- 当前前端为本机演示，后端为无认证的开发 API。二者没有维修记录同步；后端能力检查是独立的可选功能。不可作为正式商业服务部署。
- 只有固定摄像头离线演示流程；另外三类设备只有入口，不提供针对性诊断。品牌和型号用于记录，不改变固定流程。
- `npm audit --omit=dev --audit-level=high` 报告 **8 项间接依赖告警（5 low、3 high）**，来自 Expo 工具链依赖的 `deepmerge` 与 `zod`。当前上游 CLI 仍声明 `zod ^3.25.76`，扫描器建议的 `--force` 会回退 Expo 到 51，未采用不兼容的强制修改。此结果不是零漏洞声明；正式发布前需跟进上游兼容修复并重新扫描。
- pytest 有 1 条来自 Starlette 测试客户端使用 AnyIO 旧别名的弃用警告，不影响这次 5 项断言执行。
- 受限网络禁止可选的 Expo 在线元数据域名，因此构建使用 SDK 随附的版本表（`EXPO_OFFLINE=1`）。依赖从允许的 npm/PyPI 通过正常 TLS 安装，未关闭完整性或证书验证。
- 原生的安全区、键盘、导航返回、AsyncStorage、弱网与权限仍需 Android/iOS 真机验收。网页结果不能代替这些验收。

## 截图

- [手机首页](screenshots/home.png)
- [现场排障](screenshots/diagnosis.png)
- [知识库](screenshots/knowledge.png)
- [桌面首页](screenshots/home-desktop.png)
