# dsh-life-workbench-custom

DSH（DeepSeek Harness）Web GUI 的个人工作台插件：把研究项目、教学课程、日程、联系人与每日事项收进一个面板。

本仓库是 [life-workbench](https://github.com/meihaoyidian/life-workbench)（作者 chendb，MIT）的本地深度定制版快照。界面、数据模型和交互经过大量调整，已与原版有较大差异。发布前已移除个人署名、机构标识、地理坐标等个人信息。

## 功能

### 总览

- 顶部统计：今日完成 / 今日待办 / 累计完成 / 近七天 / 资料数量
- 今日安排：今天与明天的日程、课程、待办合并展示
- 研究项目与教学任务卡片：状态（进行中 / 计划中 / 暂缓 / 已完成）、合作者、关键时间节点
- 完成趋势图与看板进度；点击柱子可回看当天逐条明细
- 天气徽标（Open-Meteo，可选）

### 研究项目

- 项目档案：问题背景、当前阶段、下一步、文献与资料、相关链接
- 合作者：姓名、单位、邮箱、备注；与全局联系人自动合并、去重
- 阶段节点与推进记录（带日期）
- 项目时间轴 / 甘特视图：年 / 月 / 周视图，支持适应宽度
- 关联工作区与对话，可设为主要关联
- 附件、回收站、彻底删除

### 教学课程

- 课程信息：学期、地点、授课年级、教材、教学目标、进度
- 每周固定课 + 单次课；按第一周起算日与总周数自动推算首末次课
- 每周教学计划（主题、日期区间、教学内容、链接、完成状态）
- 课程日历：月视图、节假日标注、当天授课安排、标记已讲完
- 课程资料与附件

### 日程与日历

- 今日 / 明日 / 后续安排，支持按日期筛选
- 同步 macOS 日历（EventKit，只读），自动排除生日、节气与节假日
- 时间轴与课程日历可在标题栏一键显示或隐藏

### 看板与每日事项

- 多列看板，可增删分类、拖拽排序、按状态筛选
- 事项支持日期、时间、附件、完成状态与回收站
- 每日事项跨天自动归档（保留 90 天），可回看某天的逐条明细

### 智能识别

- 用当前 Harness 已配置的模型，从文字或最多 3 张截图提取「研究项目 / 教学课程 / 待办」
- 先确认识别结果再填入，可撤销上次填入；识别截图需要支持图片输入的模型

### 其他

- 资料库：上传文件与图片（单个 ≤ 8 MB），可关联项目或事项，支持预览与读取
- 联系人与合作者自动对账
- 回收站与最近删除，支持还原与彻底删除
- 主题跟随 DSH，适配窄屏

## 安装

要求：DSH ≥ 0.1.5-rc.1，Node.js ≥ 20。

```bash
# 以本地目录链接方式安装（推荐，便于修改）
dsh plugin --profile desktop add link:/absolute/path/to/dsh-life-workbench-custom

# 或先打包再安装
npm pack
dsh plugin --profile desktop add file:/absolute/path/to/dsh-life-workbench-1.1.0-local.research.163.tgz
```

安装后重启 dsh host 并刷新客户端，侧边栏出现「工作台」入口。

## 配置

### 天气（可选）

默认关闭。启用方式二选一：

```bash
export LIFE_WORKBENCH_LOCATION='{"name":"北京","latitude":39.90,"longitude":116.40}'
```

或编辑 `lib/weather-location.json`：

```json
{"name": "北京", "latitude": 39.90, "longitude": 116.40}
```

坐标只会发送给 Open-Meteo 用于查询天气。

### 日历同步

仅 macOS 14+。首次点击「同步 Mac 日历」时系统会请求日历读取权限；授权后由 `lib/WorkbenchCalendar.app`（Swift + EventKit）读取，不修改任何日历。

重新编译日历助手：

```bash
swiftc -O lib/calendar-bridge.swift -o lib/WorkbenchCalendar.app/Contents/MacOS/WorkbenchCalendar
codesign --force --sign - lib/WorkbenchCalendar.app
```

### 智能识别

识别使用 Harness 已配置的模型服务，插件本身不保存任何 API 密钥。截图识别要求所选模型支持图片输入。

## 数据

存放在 `$DSH_HOME/life-workbench/`（未设置 `DSH_HOME` 时为 `~/.dsh/life-workbench/`）：

```
state.json      看板 / 项目 / 课程 / 日程 / 联系人 / 归档
blob-<id>.b64   上传的文件与图片
calendar-jobs/  日历同步的临时结果（用完即删）
```

- 写入采用「临时文件 + rename」，避免半截文件覆盖好数据
- 从资料库移除条目不会删除磁盘文件
- 插件不收集遥测；除天气与日历外不主动访问网络，智能识别经由 Harness 模型服务
- 本仓库不包含 `state.json` 或任何个人数据

## 目录结构

```
lib/index.js             Host：状态归一、持久化、HTTP 端点
lib/client.js            Client：面板 UI（打包产物）
lib/recognition.js       智能识别（调用 Harness 模型）
lib/contacts.js          联系人与合作者对账
lib/calendar.js          日历同步调度
lib/calendar-bridge.swift EventKit 助手源码
lib/weather.js           Open-Meteo 天气
lib/polish.css           细节样式
cordis.patch.yml         插件行声明
```

## 开发

零构建：宿主半边是普通 ESM，浏览器半边是已打包的 `lib/client.js`。修改后重启 dsh host 即可生效。

## 许可与致谢

MIT，见 [LICENSE](LICENSE)。原项目：[meihaoyidian/life-workbench](https://github.com/meihaoyidian/life-workbench)，作者 chendb。本仓库的定制部分同样以 MIT 发布。
