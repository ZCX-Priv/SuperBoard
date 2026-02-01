## 开发阶段规划

### Phase 1: 项目初始化与基础架构 (当前阶段)
1. 创建 package.json 配置
2. 设置 TypeScript 配置
3. 配置 electron-vite 构建工具
4. 创建项目入口文件
5. 设置 ESLint 和 Prettier

### Phase 2: 核心画布引擎
1. 实现 CanvasEngine 类
2. 实现坐标转换系统
3. 实现视口控制（缩放、平移）
4. 实现基础渲染管线

### Phase 3: 输入处理系统
1. 实现 InputManager
2. 支持鼠标精确指针
3. 支持触摸屏粗略指针
4. 实现手势识别

### Phase 4: 工具系统
1. 实现 ToolManager
2. 实现画笔工具 (PenTool)
3. 实现板擦工具 (EraserTool)
4. 实现选择工具 (SelectTool)

### Phase 5: UI 组件
1. 实现工具栏 (Toolbar)
2. 实现灵动岛 (DynamicIsland)
3. 实现页面浏览器 (PageBrowser)
4. 实现缩放控制

### Phase 6: 页面管理与历史记录
1. 实现 PageManager
2. 实现 HistoryManager
3. 实现撤销/重做功能
4. 实现页面切换

### Phase 7: 桌面端集成
1. 配置 Electron 主进程
2. 实现 IPC 通信
3. 实现文件保存/打开
4. 构建 Windows/Mac 应用

### Phase 8: 优化与完善
1. 性能优化
2. 添加 AI 助教功能
3. 完善错误处理
4. 编写测试

## 当前任务：Phase 1 - 项目初始化

将创建以下文件：
- package.json - 项目配置和依赖
- tsconfig.json - TypeScript 配置
- electron.vite.config.ts - electron-vite 构建配置
- src/main/index.ts - Electron 主进程入口
- src/preload/index.ts - 预加载脚本
- src/renderer/index.html - 渲染进程 HTML
- src/renderer/main.ts - 渲染进程入口
- .eslintrc.cjs - ESLint 配置
- .prettierrc - Prettier 配置

请确认后开始执行！