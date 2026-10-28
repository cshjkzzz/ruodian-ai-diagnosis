# 弱电智诊

面向弱电安装、维修及运维人员的跨平台排障助手。第一阶段基础版本，使用 **React Native + Expo SDK 58 + TypeScript + Expo Router**，后端为 **Python FastAPI**。

> 当前为明确标记的演示版本：无真实 AI、图片识别、用户认证、支付或订阅。文章与排障建议为人工编写的示例，不是厂商官方技术资料。不要用于存储密码、客户个人信息或敏感现场数据。

## 已实现

- 首页：监控、网络、门禁、电脑四类入口，故障搜索与常见故障文章。
- AI 诊断入口：故障描述、分类、品牌选择/自填、型号输入。**仅启动固定演示，不会按品牌或描述生成 AI 结论**。
- 现场排障：摄像头能搜索到但录像机添加后离线，包含安全与现象、供电链路、地址、认证、协议、恢复验证六步。
- 每步可选择通过/异常、查看对应提示、返回和跳过；可中途保存。修改前序结果会清除后续答案，避免过时结论。
- 知识库：监控与网络共四篇示例文章，支持搜索、分类、详情及无结果状态；门禁与电脑暂显示空状态。
- 维修记录：本机持久化、列表搜索、状态过滤、详情、编辑及二次确认删除。重复保存同一次排障会更新同一记录。
- 个人中心：可编辑本机资料、维修统计、会员权益规划和设置；会员无价格、无支付入口。
- FastAPI：健康、能力声明、知识库、演示排障会话、SQLite 记录 CRUD、扩展占位接口。
- CI：类型检查、领域测试、网页构建、浏览器交互测试及后端接口测试。

## 目录

```text
mobile/                 Expo APP、网页预览、EAS 配置和前端测试
  app/                  Expo Router 页面与五个主标签
  src/                  UI、领域逻辑、本地存储与扩展接口
  e2e/                  Playwright 浏览器交互测试
backend/                FastAPI、SQLite 及 pytest 接口测试
shared/demo.json        前后端共用的明确标记演示资料
.github/workflows/      GitHub Actions 检查
```

## 启动 APP 与网页预览

需要 Node.js 24（本次验证版本 24.19.0）、npm 11。请在现有 checkout 中操作，不需要创建额外 worktree。

```bash
cd mobile
npm ci
npm run web
```

网页开发命令默认仅绑定 localhost。在自己的开发机浏览器中打开 Expo 终端显示的本地地址，可使用浏览器移动设备模式预览。云环境需通过平台提供的端口预览能力访问 8081；本仓库不包含公网部署地址。

也可以预览生产构建（包含动态路由的 SPA 回退）：

```bash
cd mobile
npm run export:web
npm run preview:web
```

截图见 [首页](docs/screenshots/home.png)、[现场排障](docs/screenshots/diagnosis.png) 和 [知识库](docs/screenshots/knowledge.png)。截图来自真实浏览器运行，不是设计稿。

在 Android / iPhone 上预览：

```bash
cd mobile
npm start
```

安装支持 SDK 58 的 Expo Go，用终端二维码打开。手机需能访问开发机。若商店 Expo Go 与 SDK 不匹配，使用对应版本的开发构建；`npm run android` 需要可用的 Android 模拟器，`npm run ios` 需要 macOS + Xcode 模拟器。本次云环境未执行 Expo Go 真机验证。

受限云环境无法访问 Expo 可选的在线版本元数据时，可以 `EXPO_OFFLINE=1 npm run web` 或 `EXPO_OFFLINE=1 npm run export:web`。包安装仍需通过受信任的 npm registry；不关闭 TLS 校验。

## 启动后端

需要 Python 3.12。Linux / macOS：

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.lock.txt
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Windows：将 `.venv/bin/` 替换为 `.venv\Scripts\`。接口交互文档路径为 `/docs`，健康检查为 `/health`。

数据库默认在忽略目录 `backend/.data/ruodian.sqlite3`，服务重启后保留数据。可用 `RUODIAN_DB_PATH` 指定其他路径。**这是未接入认证的开发 API，不应直接暴露公网或承载真实客户数据。**

APP 的内容和记录默认完全在本机运行，不依赖后端。可选地配置公开的后端地址以在设置页检查能力：

```bash
cd mobile
cp .env.example .env
# 将 EXPO_PUBLIC_API_URL 改成该设备可访问的开发机地址，再重启 Expo。
```

- `EXPO_PUBLIC_API_URL` 是公开配置，会进入 APP 包；**不允许在其中放密钥**。
- 真机中的 localhost 指手机自己，须改为开发机局域网地址；Android 模拟器通常使用 `10.0.2.2`。开发环境 HTTP 仅用于本地调试，正式环境使用 HTTPS。
- 浏览器默认只允许 `http://localhost:8081` 和 `http://127.0.0.1:8081` 跨域。其他网页域名需通过后端 `RUODIAN_CORS_ORIGINS` 配置逗号分隔的显式来源。
- 当前前端只通过后端检查接口能力，**不会同步前端维修记录**。后端 SQLite 与 APP 本地存储彼此独立。登录和同步是下一阶段工作。
- 本机记录/资料未加密，卸载 APP 或清理浏览器数据可能丢失；目前没有云端备份。

## 基础接口

| 方法与路径 | 用途 |
| --- | --- |
| `GET /health` | 数据库可访问性与服务健康 |
| `GET /v1/capabilities` | 演示模式与未接入能力声明 |
| `GET /v1/categories` | 四大设备分类 |
| `GET /v1/articles?q=离线&category=camera` | 搜索和分类过滤 |
| `GET /v1/articles/{id}` | 文章详情与演示来源 |
| `POST /v1/diagnoses` | 创建固定摄像头演示会话 |
| `GET /v1/diagnoses/{id}` | 会话与检查历史 |
| `PUT /v1/diagnoses/{id}/answers/{step_id}` | 回答或跳过；返回修改会清除后续结果 |
| `POST /v1/diagnoses/{id}/record` | 保存/更新同一会话对应记录 |
| `GET/POST /v1/records` | 记录列表/创建 |
| `GET/PATCH/DELETE /v1/records/{id}` | 查看/编辑/删除 |
| `POST /v1/ai/diagnose` | 501，明确未接入 AI |
| `POST /v1/images/analyze` | 501，不接收或保存图片 |
| `GET /v1/subscription` | 无有效订阅、无扣费 |

例如创建演示会话：

```bash
curl -X POST http://127.0.0.1:8000/v1/diagnoses \
  -H 'Content-Type: application/json' \
  -d '{"description":"摄像头能搜索到，但录像机添加后显示离线","category":"camera"}'
```

扩展入口位于 `mobile/src/api.ts` 的 Provider 接口和后端 `/v1` 命名空间。未来模型密钥只能由服务端安全配置注入；专业知识需增加授权来源、版本与审核；订阅必须先接入登录、服务端权益验证、Apple/Google 应用内订阅及回调校验，不依赖客户端声明。

## 验证与测试

```bash
cd mobile
npm run typecheck
npm test
npm run export:web
npx playwright install --with-deps chromium
npm run test:e2e

cd ../backend
.venv/bin/python -m pytest -q
```

已安装系统 Chromium 时，可用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`。Playwright 读取当前构建 `dist/`，所以修改页面后先重新导出。测试中的持久化覆盖浏览器刷新；原生 AsyncStorage 仍需真机验证。

双平台 JS 资源打包检查（**不是 APK/IPA 原生编译**）：

```bash
cd mobile
npx expo export --platform android --platform ios --output-dir dist-native
```

完整执行结果、已知限制与依赖扫描说明见 [验证记录](docs/validation.md)。

## Android 和 iOS 后续打包

项目提供 `mobile/eas.json`，应用 ID 暂定 `com.ruodian.diagnosis`，商业发布前需确认唯一包名、商标、图标、隐私政策与商店资料。尚未关联 EAS 项目，不包含任何签名或账号凭据。

```bash
cd mobile
npx eas-cli login
npx eas-cli build:configure
# Android 内测 APK
npx eas-cli build --platform android --profile preview
# Android 商店 AAB
npx eas-cli build --platform android --profile production
# iOS TestFlight / App Store 构建，需要 Apple Developer 账号与签名
npx eas-cli build --platform ios --profile production
```

如需 `development` profile，先执行 `npx expo install expo-dev-client` 并提交依赖变更，再运行对应的 EAS 开发构建。上述 EAS 命令属于后续账号配置与打包步骤，**本次未运行，未产生 APK、AAB 或 IPA**。

iOS 原生本地编译需要 macOS 与 Xcode；当前 Linux 云环境无法验证 iOS 原生编译。EAS 可在云端 macOS 构建，但需要另外配置 Expo / Apple 账号。Android 原生构建和两平台真机测试也尚未验证，不能用网页测试或 JS 打包结果代替。

## 下一阶段

1. Android/iOS 真机验收：键盘、安全区、触控、弱网、本地存储、崩溃恢复与无障碍。
2. 用户认证、数据权限、记录同步、冲突处理与可导出备份。
3. 经授权和审核的专业资料，按品牌/型号/固件建立可追溯来源。
4. 服务端 AI 网关、引用证据、风险提示、反馈闭环及图片上传授权。
5. 最后接入应用内订阅、服务端权益与购买恢复；上线前完成隐私与计费审核。
