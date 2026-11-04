import {createWeatherService} from './weather.js'
import {isBirthday,isValidCalendarTask} from './birthdays.js'
import {createCalendarSync} from './calendar.js'
import {mergeContacts,projectPeople,synchronizeCollaborators,reconcileCollaborators} from './contacts.js'
import {createRecognitionService} from './recognition.js'
/**
 * dsh-life-workbench —— Host 半边。
 *
 * 职责：工作台数据的唯一权威（结构归一 / 每日事项跨天归档 / 落盘），
 * 并通过 webServer 暴露 4 个同源 JSON 端点供浏览器半边调用。
 *
 * 数据位置：`$DSH_HOME/life-workbench/`（DSH_HOME 未设时回退 `~/.dsh`）。
 * 正式插件的 Host 半边是普通 Node 模块，可直接使用 node:fs —— 不需要动态
 * 插件那套 `ctx.fs` + `sandboxPolicy` 绕行（沙箱约束的是 agent 的工具调用，
 * 不是宿主插件代码）。
 *
 * 为什么用 HTTP 而不是包内 RPC：动态 Cordis 插件有 harness.handle + host.call，
 * 正式插件没有这层，浏览器半边只能走同源 HTTP。
 */

import {execFile} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROUTE_PREFIX = '/life-workbench'
const HISTORY_LIMIT = 90
const STATE_FILE = 'state.json'
const BLOB_PREFIX = 'blob-'

/** 本插件只依赖宿主 HTTP 载体，其余自给自足。 */
export const inject = ['webServer']

/* ------------------------------ 路径 ------------------------------ */

function dshHome() {
  const fromEnv = process.env.DSH_HOME
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') return fromEnv
  return path.join(os.homedir(), '.dsh')
}

/** 本插件的数据目录（与 dsh-task-board 的 `~/.dsh/task-board/` 同级）。 */
export function dataDir() {
  return path.join(dshHome(), 'life-workbench')
}

const statePath = () => path.join(dataDir(), STATE_FILE)
const sanitizeId = (id) => String(id).replace(/[^a-zA-Z0-9_-]/g, '')
const blobPath = (id) => path.join(dataDir(), BLOB_PREFIX + sanitizeId(id) + '.b64')

/* ------------------------------ 工具 ------------------------------ */

const pad = (n) => (String(n).length < 2 ? '0' + String(n) : String(n))
const stamp = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const asArray = (value) => (Array.isArray(value) ? value : [])
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const messageOf = (error) => String(error !== null && error !== undefined && error.message ? error.message : error)

function defaultBoards() {
  return [
    { id: 'work', title: '工作', cards: [] },
    { id: 'life', title: '生活', cards: [] },
    { id: 'daily', title: '每日事项', kind: 'daily', cards: [] },
  ]
}

function trimHistory(history) {
  const keys = Object.keys(history).sort()
  if (keys.length <= HISTORY_LIMIT) return history
  const keep = {}
  keys.slice(keys.length - HISTORY_LIMIT).forEach((key) => { keep[key] = history[key] })
  return keep
}

/**
 * 补齐结构；「每日事项」跨天时先把当天逐条明细归档进 history，再重置勾选。
 */
export function normalize(raw) {
  const today = stamp(new Date())
  const source = isObject(raw) ? {...raw} : {}
  Object.assign(source,reconcileCollaborators(asArray(source.projects),asArray(source.contacts)))
  const boards = asArray(source.boards)
  const next = {
    version: 7,
    sortPreferences: isObject(source.sortPreferences)?source.sortPreferences:{},
    deletedItems: asArray(source.deletedItems).filter(isObject),
    projectTrash: asArray(source.projectTrash).filter(isObject),
    calendarEvents: asArray(source.calendarEvents).filter(isValidCalendarTask),
    calendarSync: isObject(source.calendarSync)?source.calendarSync:{},
    projects: asArray(source.projects).filter(isObject),
    contacts: mergeContacts(source.contacts,asArray(source.projects).flatMap(projectPeople),false),
    dailyStamp: typeof source.dailyStamp === 'string' ? source.dailyStamp : '',
    boards: boards.length > 0 ? boards : defaultBoards(),
    files: asArray(source.files),
    notes: asArray(source.notes),
    schedule: asArray(source.schedule),
    history: isObject(source.history) ? source.history : {},
  }

  if (!Array.isArray(source.projects)) {
    for (const board of next.boards) {
      for (const card of asArray(board?.cards)) {
        if (card?.title === 'Example Project' && card.done !== true) {
          const id = 'project-' + card.id
          next.projects.push({ id, title: card.title, kind: 'paper', status: 'active',
            collaborators: '', background: '', nextStep: '', plannedDate: '', startDate: '',
            targetDate: '', endDate: '', links: [], references: '', milestones: [], updates: [],
            createdAt: card.createdAt || today, sourceCardId: card.id })
          card.projectId = id
        }
      }
    }
  }
  const rolled = next.dailyStamp !== today
  if (rolled) {
    if (next.dailyStamp !== '') {
      let dailyDone = 0
      let dailyTotal = 0
      const items = []
      next.boards.forEach((board) => {
        if (!isObject(board) || board.kind !== 'daily') return
        asArray(board.cards).forEach((card) => {
          if (!isObject(card) || (card.date && card.date !== next.dailyStamp)) return
          const done = card.done === true
          dailyTotal += 1
          if (done) dailyDone += 1
          items.push({ title: String(card.title || ''), done })
        })
      })
      next.history[next.dailyStamp] = { dailyDone, dailyTotal, items }
    }
    next.boards = next.boards.map((board) => {
      if (!isObject(board) || board.kind !== 'daily') return board
      return {
        ...board,
        cards: asArray(board.cards).map((card) => {
          if (!isObject(card) || card.done !== true || card.date) return card
          return { ...card, done: false, doneAt: null }
        }),
      }
    })
    next.dailyStamp = today
  }

  next.history = trimHistory(next.history)
  return { state: next, rolled, today }
}

/* --------------------------- 文件读写 --------------------------- */

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), 'utf8'))
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.error('[life-workbench] 读取状态失败，改用默认值', error)
    }
    return null
  }
}

/** 先写临时文件再 rename，避免半截文件覆盖掉好数据。 */
function writeFileAtomic(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true })
  const tmp = `${target}.${process.pid}.tmp`
  fs.writeFileSync(tmp, content, 'utf8')
  fs.renameSync(tmp, target)
}

function writeState(state) {
  writeFileAtomic(statePath(), JSON.stringify(state, null, 2))
}

/* ---------------------------- 业务处理 ---------------------------- */

async function handleLoad() {
  const raw = readState()
  const result = normalize(raw)
  if (raw === null || result.rolled || raw.version !== 7) {
    try {
      writeState(result.state)
    } catch (error) {
      console.error('[life-workbench] 初始化写入失败', error)
    }
  }
  return {
    ok: true,
    state: result.state,
    today: result.today,
    rolled: result.rolled,
    path: statePath(),
    storage: 'dsh-home',
  }
}

async function handleSave(args) {
  const incoming = isObject(args?.state) ? args.state : null
  if (incoming === null) return { ok: false, error: '缺少 state' }

  // history 由 Host 权威维护：以磁盘已有为准再合并，避免旧快照覆盖当天归档。
  const current = readState()
  const disk = isObject(current?.history) ? current.history : {}
  const merged = {
    ...incoming,
    calendarEvents: current?.calendarEvents,
    calendarSync: current?.calendarSync,
    contacts: mergeContacts(current?.contacts,asArray(incoming.projects).filter(p=>JSON.stringify(p)!==JSON.stringify(asArray(current?.projects).find(old=>old.id===p.id))).flatMap(projectPeople)),
    projects: Array.isArray(incoming.projects) ? incoming.projects : current?.projects,
    history: { ...disk, ...(isObject(incoming.history) ? incoming.history : {}) },
  }
  Object.assign(merged,synchronizeCollaborators(asArray(current?.projects),asArray(merged.projects),current?.contacts || []))
  const result = normalize(merged)
  try {
    writeState(result.state)
    return { ok: true, today: result.today, rolled: result.rolled, storage: 'dsh-home' }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

async function handleUpload(args) {
  const name = typeof args?.name === 'string' && args.name !== '' ? args.name : '未命名'
  const mime = typeof args?.mime === 'string' ? args.mime : ''
  const base64 = typeof args?.base64 === 'string' ? args.base64 : ''
  const size = typeof args?.size === 'number' ? args.size : 0
  if (base64 === '') return { ok: false, error: '文件内容为空' }

  const id = 'f' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1679616).toString(36)
  try {
    writeFileAtomic(blobPath(id), base64)
  } catch (error) {
    return { ok: false, error: '写入失败：' + messageOf(error) }
  }
  return {
    ok: true,
    file: {
      id,
      name,
      mime,
      size,
      kind: mime.indexOf('image/') === 0 ? 'image' : 'file',
      addedAt: new Date().toISOString(),
    },
  }
}

async function handleReadFile(args) {
  const id = typeof args?.id === 'string' ? args.id : ''
  if (id === '') return { ok: false, error: '缺少 id' }
  try {
    return { ok: true, base64: fs.readFileSync(blobPath(id), 'utf8') }
  } catch (error) {
    if (error?.code === 'ENOENT') return { ok: false, error: '文件不存在' }
    return { ok: false, error: messageOf(error) }
  }
}

/* --------------------------- HTTP 路由 --------------------------- */

function send(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (chunks.length === 0) return {}
  const text = Buffer.concat(chunks).toString('utf8')
  return text === '' ? {} : JSON.parse(text)
}

export function apply(ctx) {
  const weather=createWeatherService()
  const recognition = createRecognitionService(ctx)
  const syncCalendar = createCalendarSync({dataDir,readState,normalize,writeState})
  const webServer = ctx.get('webServer')
  if (webServer === undefined) {
    console.error('[life-workbench] 缺少 webServer 服务，Host 半边未激活')
    return
  }

  const disposeRoute = webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: async (req, res) => {
      const url = req.url ?? ''
      const action = url.slice(ROUTE_PREFIX.length).split('?')[0].replace(/^\//, '')
      if (req.method !== 'POST') {
        send(res, 405, { ok: false, error: '只接受 POST' })
        return
      }
      try {
        const args = await readJsonBody(req)
        if (action === 'syncCalendar') return send(res,200,await syncCalendar(args))
        if (action === 'weather') return send(res,200,await weather({force:args.force===true}))
        if (action === 'models') return send(res,200,await recognition.models())
        if (action === 'recognize') {
          const controller=new AbortController(),cancel=()=>{if(!res.writableEnded)controller.abort()}
          res.on?.('close',cancel)
          try{return send(res,200,await recognition.recognize(args,controller.signal))}finally{res.off?.('close',cancel)}
        }
        if (action === 'load') return send(res, 200, await handleLoad())
        if (action === 'save') return send(res, 200, await handleSave(args))
        if (action === 'upload') return send(res, 200, await handleUpload(args))
        if (action === 'openExternal') {
          const url=new URL(String(args.url || ''))
          if(!['http:','https:'].includes(url.protocol))throw Error('仅支持网页链接')
          if(process.platform!=='darwin')throw Error('当前系统不支持此打开方式')
          await new Promise((resolve,reject)=>execFile('/usr/bin/open',[url.href],error=>error?reject(error):resolve()))
          return send(res,200,{ok:true})
        }
        if (action === 'readFile') return send(res, 200, await handleReadFile(args))
        return send(res, 404, { ok: false, error: '未知端点：' + action })
      } catch (error) {
        // 统一以 200 + ok:false 返回业务错误，客户端只处理一种形状
        return send(res, 200, { ok: false, error: ['models','recognize'].includes(action)?recognition.publicError(error):messageOf(error) })
      }
    },
  })

  ctx.effect(() => disposeRoute)
}
