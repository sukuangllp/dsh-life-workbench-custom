/**
 * dsh-life-workbench —— 浏览器半边。
 *
 * 加载协议：DSH 的 web 插件以 window.__ModuleLoader__.load({ id, factory }) 形式
 * 装载，factory 收到的 require 能解析宿主内置模块（react / react-dom 等）。
 *
 * 与动态 Cordis 插件的两处差异（已在本文件内替换）：
 *   1. host.call(method, args)  → hostCall()：走同源 HTTP，由 Host 半边的 webServer 路由应答
 *   2. styles.insert(css)       → insertStyles(css)：直接创建 <style>，由 ctx.effect 管理清理
 */

window.__ModuleLoader__.load({
  id: 'dsh-life-workbench',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')

    const SLOT_ID = 'life-workbench'
    const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

    /** 同源 HTTP RPC：与 Host 半边 webServer 注册的端点一一对应。 */
    async function hostCall(method, args, signal) {
      const res = await fetch('/life-workbench/' + method, {
        method: 'POST', signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(args === undefined ? {} : args),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return await res.json()
    }

    /** 包内样式：随插件卸载一起移除。 */
    function insertStyles(css) {
      const el = document.createElement('style')
      el.setAttribute('data-dsh-life-workbench', '')
      el.textContent = css
      document.head.appendChild(el)
      return () => { el.remove() }
    }

    const CSS = `
.lwb-root{--p-radius:18px;--p-pad:18px 20px;--p-gap:14px;--p-bg:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 62%,transparent);--p-border:color-mix(in srgb,var(--dsw-alias-border-l1) 55%,transparent);--p-divider:color-mix(in srgb,var(--dsw-alias-border-l1) 55%,transparent);--p-shadow:0 14px 44px -22px rgba(0,0,0,.30),inset 0 1px 0 0 color-mix(in srgb,#fff 45%,transparent);--p-blur:blur(22px) saturate(150%);--mono-font:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);background-image:radial-gradient(120% 80% at 10% -5%,color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent),transparent 55%),radial-gradient(95% 70% at 95% 4%,color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,transparent),transparent 52%),radial-gradient(80% 60% at 60% 100%,color-mix(in srgb,var(--dsw-alias-state-warn-primary) 8%,transparent),transparent 55%);color:var(--dsw-alias-label-primary);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',system-ui,sans-serif;font-size:13px;line-height:1.5;-webkit-font-smoothing:antialiased;--ease:cubic-bezier(0.22,1,0.36,1)}
html[data-platform=darwin] [data-sidebar-collapsed] .lwb-root{padding-top:var(--dsh-frame-top-clearance,48px);box-sizing:border-box}
.lwb-head{display:flex;align-items:center;gap:12px;padding:13px 20px;border-bottom:1px solid var(--p-divider);flex:none;background:transparent}
.lwb-title{font-size:14px;font-weight:600;letter-spacing:-.01em;display:flex;align-items:center;gap:9px}
.lwb-dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent)}
.lwb-spacer{flex:1;min-width:0}
.lwb-tabs{display:flex;gap:3px;padding:7px 20px 0;border-bottom:1px solid var(--p-divider);flex:none;background:transparent}
.lwb-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;padding:9px 15px;cursor:pointer;position:relative;font-family:inherit;border-radius:10px 10px 0 0;transition:color .18s var(--ease),background .18s var(--ease)}
.lwb-tab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.lwb-tab-on{color:var(--dsw-alias-label-primary);font-weight:600;background:var(--dsw-alias-bg-base)}
.lwb-tab-on:after{content:'';position:absolute;left:12px;right:12px;bottom:-1px;height:2.5px;background:var(--dsw-alias-brand-primary);border-radius:3px}
.lwb-body{flex:1;min-height:0;overflow:auto;padding:18px 20px 36px}
.lwb-hero{position:relative;overflow:hidden;padding:var(--p-pad);border:1px solid var(--p-border);border-radius:var(--p-radius);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 56%,transparent);box-shadow:var(--p-shadow);backdrop-filter:var(--p-blur);-webkit-backdrop-filter:var(--p-blur);margin-bottom:var(--p-gap)}
.lwb-hero-in{position:relative;z-index:1}
.lwb-eyebrow{font-family:var(--mono-font);font-size:10.5px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}
.lwb-hero-hi{font-size:25px;font-weight:650;letter-spacing:-.03em;line-height:1.15;margin-top:6px}
.lwb-hero-stats{display:flex;margin-top:18px;flex-wrap:wrap;row-gap:14px}
.lwb-stat{display:flex;flex-direction:column;gap:2px;padding-right:26px;margin-right:26px;border-right:1px solid var(--p-divider)}
.lwb-stat:last-child{border-right:0;margin-right:0;padding-right:0}
.lwb-stat-num{font-family:var(--mono-font);font-size:24px;font-weight:500;letter-spacing:-.05em;font-variant-numeric:tabular-nums;line-height:1.15}
.lwb-stat-label{font-family:var(--mono-font);font-size:10px;color:var(--dsw-alias-label-secondary);letter-spacing:.1em;text-transform:uppercase}
.lwb-sec{margin-top:22px}
.lwb-sec-head{display:flex;align-items:center;gap:12px;margin-bottom:11px}
.lwb-sec-name{font-family:var(--mono-font);font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;gap:8px}
.lwb-sec-name:before{content:'';width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-brand-primary);opacity:.85;flex:none}
.lwb-sec-line{flex:1;height:1px;background:var(--p-divider)}
.lwb-sec-count{font-family:var(--mono-font);font-size:10px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;letter-spacing:.04em}
.lwb-wide{background:var(--p-bg);border:1px solid var(--p-border);border-radius:var(--p-radius);box-shadow:var(--p-shadow);backdrop-filter:var(--p-blur);-webkit-backdrop-filter:var(--p-blur);overflow:hidden}
.lwb-wide+.lwb-wide{margin-top:var(--p-gap)}
.lwb-split{display:grid;grid-template-columns:1fr 1fr}
.lwb-pane{min-width:0;padding:var(--p-pad)}
.lwb-pane+.lwb-pane{border-left:1px solid var(--p-divider)}
.lwb-pane-full{padding:var(--p-pad)}
@media (max-width:880px){.lwb-split{grid-template-columns:1fr}.lwb-pane+.lwb-pane{border-left:0;border-top:1px solid var(--p-divider)}}
.lwb-pane-title{font-family:var(--mono-font);font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);margin-bottom:11px;display:flex;align-items:center;gap:8px}
.lwb-pane-title:before{content:'';width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-brand-primary);opacity:.85;flex:none}
.lwb-btn{appearance:none;border:1px solid var(--p-border);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);color:var(--dsw-alias-label-primary);border-radius:9px;padding:7px 14px;font-size:12.5px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:background .16s var(--ease),border-color .16s var(--ease),transform .12s var(--ease)}
.lwb-btn:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-overlay)}
.lwb-btn:active{transform:scale(.97)}
.lwb-btn-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:#fff}
.lwb-btn-primary:hover{background:var(--dsw-alias-brand-primary);opacity:.9}
.lwb-btn-danger{border-color:transparent;background:var(--dsw-alias-state-error-primary);color:#fff}
.lwb-mini{font-size:11.5px;padding:5px 11px}
.lwb-err{font-family:var(--mono-font);font-size:11px;color:var(--dsw-alias-state-error-primary);border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;padding:4px 10px}
.lwb-icon-btn{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:15px;line-height:1;padding:5px 8px;border-radius:8px;font-family:inherit;transition:background .16s var(--ease),color .16s var(--ease)}
.lwb-icon-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.lwb-list{display:flex;flex-direction:column;max-height:236px;overflow:auto}
.lwb-item{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:10px;transition:background .14s var(--ease)}
.lwb-item:hover{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 70%,transparent)}
.lwb-item+.lwb-item{border-top:1px solid var(--p-divider)}
.lwb-item-text{flex:1;min-width:0;font-size:13px;word-break:break-word;cursor:text}
.lwb-item-done{text-decoration:line-through;color:var(--dsw-alias-label-secondary)}
.lwb-check{width:15px;height:15px;flex:none;accent-color:var(--dsw-alias-brand-primary);cursor:pointer;margin:0}
.lwb-time{font-family:var(--mono-font);font-size:11px;color:var(--dsw-alias-label-secondary);width:48px;flex:none;font-variant-numeric:tabular-nums}
.lwb-tag{font-family:var(--mono-font);font-size:9.5px;color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);border-radius:7px;padding:3px 7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:118px;letter-spacing:.04em}
.lwb-input{flex:1;min-width:0;background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);border:1px solid var(--p-border);border-radius:9px;color:inherit;font:inherit;font-size:12.5px;padding:7px 11px;outline:none;font-family:inherit;transition:border-color .16s var(--ease)}
.lwb-input:focus{border-color:var(--dsw-alias-brand-primary)}
.lwb-select{background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);border:1px solid var(--p-border);border-radius:9px;color:inherit;font:inherit;font-size:12px;padding:7px 8px;outline:none;font-family:inherit;cursor:pointer;max-width:112px}
.lwb-textarea{width:100%;min-height:64px;resize:vertical;background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);border:1px solid var(--p-border);border-radius:11px;color:inherit;font:inherit;font-size:12.5px;padding:11px 13px;outline:none;font-family:inherit;box-sizing:border-box;line-height:1.55;transition:border-color .16s var(--ease)}
.lwb-textarea:focus{border-color:var(--dsw-alias-brand-primary)}
.lwb-row{display:flex;gap:8px;align-items:center;margin-top:11px}
.lwb-bar{flex:1;height:6px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);overflow:hidden;min-width:36px}
.lwb-bar-fill{height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);transition:width .35s var(--ease)}
.lwb-brow{display:flex;align-items:center;gap:10px;padding:7px 0}
.lwb-brow+.lwb-brow{border-top:1px solid var(--p-divider)}
.lwb-brow-name{width:74px;flex:none;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.lwb-brow-name:hover{color:var(--dsw-alias-brand-primary)}
.lwb-count{font-family:var(--mono-font);font-size:10.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.lwb-chart{display:flex;align-items:flex-end;gap:6px;height:92px;padding-top:4px}
.lwb-chart-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;height:100%;min-width:0;cursor:pointer;border-radius:8px;transition:background .18s var(--ease)}
.lwb-chart-col:hover{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 70%,transparent)}
.lwb-chart-col-on{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 70%,transparent)}
.lwb-chart-num{font-family:var(--mono-font);font-size:10px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.lwb-chart-bar{width:100%;max-width:22px;border-radius:5px;background:var(--dsw-alias-label-primary);opacity:.22;min-height:2px;transition:height .35s var(--ease),opacity .2s var(--ease),background .2s var(--ease)}
.lwb-chart-col:hover .lwb-chart-bar,.lwb-chart-col-on .lwb-chart-bar{opacity:1;background:var(--dsw-alias-brand-primary)}
.lwb-chart-bar-zero{opacity:.09}
.lwb-chart-label{font-family:var(--mono-font);font-size:9.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;font-variant-numeric:tabular-nums}
.lwb-review{margin-top:11px;padding-top:11px;border-top:1px solid var(--p-divider);max-height:154px;overflow:auto}
.lwb-review-title{font-family:var(--mono-font);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);margin-bottom:7px}
.lwb-review-item{display:flex;align-items:center;gap:9px;padding:4px 0;font-size:12.5px}
.lwb-empty{color:var(--dsw-alias-label-secondary);font-size:12px;padding:3px 0}
.lwb-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:9px}
.lwb-thumb{width:100%;aspect-ratio:1;object-fit:cover;border-radius:11px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);cursor:zoom-in;display:block;border:1px solid var(--p-border)}
.lwb-ficon{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:11px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);color:var(--dsw-alias-label-secondary);border:1px solid var(--p-border)}
.lwb-drop-area{border:1px dashed var(--dsw-alias-border-l2);border-radius:11px;padding:11px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;transition:border-color .2s var(--ease),background .2s var(--ease),color .2s var(--ease)}
.lwb-drop-area-on{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 70%,transparent);color:var(--dsw-alias-label-primary)}
.lwb-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:zoom-out;padding:32px}
.lwb-lightbox img{max-width:92vw;max-height:88vh;border-radius:12px}
.lwb-done-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(198px,1fr));gap:2px 18px}
.lwb-boards{display:flex;flex-wrap:wrap;gap:13px;align-items:flex-start;align-content:flex-start;padding:0;min-width:0}
.lwb-col{flex:1 1 220px;min-width:0;max-width:min(100%,280px);box-sizing:border-box;display:flex;flex-direction:column;background:var(--p-bg);border:1px solid var(--p-border);border-radius:var(--p-radius);padding:14px;gap:9px;box-shadow:var(--p-shadow);backdrop-filter:var(--p-blur);-webkit-backdrop-filter:var(--p-blur)}
.lwb-colhead{display:flex;align-items:center;gap:7px;padding:1px 1px 9px;border-bottom:1px solid var(--p-divider)}
.lwb-badge{font-family:var(--mono-font);font-size:9.5px;padding:3px 8px;border-radius:7px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);color:var(--dsw-alias-label-secondary);letter-spacing:.05em}
.lwb-confirm{display:flex;gap:6px;align-items:center}
.lwb-menu-wrap{position:relative;display:flex}
.lwb-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:30;min-width:162px;padding:5px;border-radius:11px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--p-border);box-shadow:0 16px 40px -18px rgba(0,0,0,.42);backdrop-filter:var(--p-blur);-webkit-backdrop-filter:var(--p-blur)}
.lwb-menu-item{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-family:inherit;font-size:12px;text-align:left;width:100%;padding:8px 10px;border-radius:8px;cursor:pointer;white-space:nowrap;transition:background .14s var(--ease)}
.lwb-menu-item:hover{background:var(--dsw-alias-bg-layer-2)}
.lwb-menu-item-danger{color:var(--dsw-alias-state-error-primary)}
.lwb-card{display:flex;flex-direction:column;padding:9px 10px;border-radius:11px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 75%,transparent);border:1px solid transparent;transition:border-color .16s var(--ease)}
.lwb-card:hover{border-color:var(--p-border)}
.lwb-card-row{display:flex;align-items:center;gap:8px}
.lwb-attach{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin-top:9px;padding-top:9px;border-top:1px solid var(--p-divider)}
.lwb-attach-thumb{width:46px;height:46px;object-fit:cover;border-radius:9px;cursor:zoom-in;display:block}
.lwb-attach-chip{font-family:var(--mono-font);font-size:10px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);border-radius:8px;padding:5px 8px;max-width:122px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lwb-note{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 70%,transparent);border-radius:12px;padding:12px 14px;font-size:12.5px;margin-bottom:8px;white-space:pre-wrap;word-break:break-word;position:relative;line-height:1.6}
.lwb-note-meta{font-family:var(--mono-font);font-size:10px;color:var(--dsw-alias-label-secondary);margin-top:7px}
.lwb-foot{padding:8px 20px;font-size:10px;color:var(--dsw-alias-label-secondary);border-top:1px solid var(--p-divider);flex:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--mono-font);letter-spacing:.02em}
.lwb-svg{display:block;flex:none}
`

    const STATUS_TOOLTIP_CSS = "\n.rw-card-state-actions{display:inline-flex;align-items:center;gap:5px;flex:none;white-space:nowrap}.rw-card-state-actions>.rw-action-icon{flex:none}.rw-card-meta:has(.rw-card-state-actions){gap:8px;flex-wrap:wrap}.rw-course-card>.rw-paper-head>.rw-project-title{min-width:0;flex:1;overflow-wrap:anywhere}.rw-course-card>.rw-paper-head{gap:8px}.rw-function-tooltip{position:fixed;z-index:2147483647;pointer-events:none;width:max-content;max-width:min(300px,calc(100vw - 16px));box-sizing:border-box;padding:5px 8px;border:1px solid var(--dsw-alias-border-l2,#999);border-radius:5px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#222);font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,sans-serif);font-size:11px;font-weight:400;line-height:1.5;white-space:normal;overflow-wrap:anywhere;box-shadow:none}.rw-function-tooltip[hidden]{display:none}\n"
    const AGENDA_CSS = "\n.rw-day-agenda{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:14px;margin:0 0 24px;container-type:inline-size}.rw-day-panel{min-width:0;padding:14px 16px;background:color-mix(in srgb,var(--rw-button-color) 4%,var(--dsw-alias-bg-base));border:1px solid var(--rw-soft-rule);border-radius:9px}.rw-day-panel>header{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:10px}.rw-day-panel h2{margin:0;font-size:13px;font-weight:550}.rw-day-panel>header>time{font-size:11px;color:var(--rw-secondary);font-variant-numeric:tabular-nums}.rw-agenda-list{list-style:none;padding:0;margin:0}.rw-agenda-list>li{display:flex;align-items:flex-start;gap:9px;padding:7px 0}.rw-agenda-list>li+li{border-top:1px solid var(--rw-soft-rule)}.rw-agenda-kind{font-size:10px;color:var(--rw-secondary);flex:none;line-height:20px}.rw-agenda-copy{flex:1;min-width:0}.rw-agenda-title{font:inherit;font-size:12px;line-height:1.6;color:var(--rw-ink);background:none;border:0;padding:0;text-align:left;overflow-wrap:anywhere}.rw-agenda-title:is(button){cursor:pointer}.rw-agenda-title:is(button):hover{text-decoration:underline}.rw-agenda-detail{display:block;font-size:10px;line-height:1.6;color:var(--rw-secondary);white-space:pre-wrap;overflow-wrap:anywhere;margin-top:2px}.rw-agenda-time{flex:none;font-size:10px;line-height:20px;color:var(--rw-secondary);font-variant-numeric:tabular-nums}.rw-task-list{max-height:420px;overflow:auto;scrollbar-gutter:stable;padding-right:4px}.rw-task-filter{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px}.rw-task-filter>label{display:flex;align-items:center;gap:7px}.rw-task-filter input{width:145px;font-size:11px}.rw-task-entry{display:flex;align-items:flex-start;gap:8px;padding:9px 0}.rw-task-entry+.rw-task-entry{border-top:1px solid var(--rw-soft-rule)}.rw-task-entry>.lwb-check{margin-top:3px;flex:none}.rw-task-copy{min-width:0;flex:1}.rw-task-copy .lwb-item-text{display:block;overflow-wrap:anywhere}.rw-task-meta{display:block;font-size:10px;color:var(--rw-secondary);line-height:1.6;margin-top:3px;overflow-wrap:anywhere}.rw-task-composer{display:flex;align-items:flex-end;flex-wrap:wrap;gap:8px;margin-top:12px}.rw-task-composer label{display:flex;flex-direction:column;gap:3px;min-width:0;font-size:10px;color:var(--rw-secondary)}.rw-task-composer .rw-task-text{flex:1 0 100%;width:100%;box-sizing:border-box}.rw-task-composer input[type=date]{width:145px}.rw-task-composer input[type=time]{width:115px}.rw-task-composer select{flex:1;min-width:90px;max-width:100%}.rw-calendar-sync{display:flex;align-items:center;gap:5px;border:0;border-radius:5px;padding:4px 6px;font:inherit!important;font-size:11px!important;background:none;color:var(--rw-secondary);cursor:pointer;white-space:nowrap}.rw-calendar-sync .lwb-svg{width:14px;height:14px;stroke-width:1.7}.rw-calendar-sync:disabled{opacity:.45;cursor:default}.rw-calendar-sync:hover{background:var(--rw-button-bg);color:var(--rw-ink)}.rw-task-edit{display:flex;align-items:flex-end;flex-wrap:wrap;gap:6px;margin-top:8px}.rw-task-edit label{display:flex;flex-direction:column;gap:3px;font-size:10px;color:var(--rw-secondary)}.rw-task-edit input{width:135px}.lwb-daily-section>.lwb-err{margin:8px 0;max-width:100%}@media(max-width:780px){.rw-day-agenda{grid-template-columns:minmax(0,1fr)}.rw-day-panel{padding:12px 14px}}@media(max-width:420px){.rw-task-composer label{flex:1}.rw-task-composer input[type=date],.rw-task-composer input[type=time]{width:100%}}\n\n.rw-home{container-type:inline-size;container-name:workbench-home}\n.rw-day-today{background:color-mix(in srgb,var(--rw-ink) 8%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-ink) 38%,var(--dsw-alias-bg-base))}\n.rw-day-today h2{font-size:14px;font-weight:600;color:var(--rw-ink)}\n.rw-day-tomorrow{background:color-mix(in srgb,var(--rw-ink) 2%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-ink) 22%,var(--dsw-alias-bg-base));padding:12px 14px}\n.rw-day-tomorrow h2{font-size:12px;font-weight:500;color:var(--rw-secondary)}\n.rw-day-tomorrow .rw-agenda-title{color:var(--rw-secondary)}\n.rw-day-tomorrow .rw-agenda-list>li{padding:6px 0}\n@container workbench-home (max-width:700px){.rw-day-agenda{grid-template-columns:minmax(0,1fr)}}\n"
    const WRAPPED_GANTT_CSS = "\n.rw-wrapped-gantt,.rw-gantt-segments,.rw-gantt-segment{min-width:0;max-width:100%;box-sizing:border-box}.rw-gantt-segment+.rw-gantt-segment{margin-top:18px}.rw-gantt-range{font-size:10px;font-weight:400;color:var(--rw-secondary);font-variant-numeric:tabular-nums;margin:0 0 5px}.rw-wrapped-gantt .rw-gantt-tools{flex-wrap:wrap}.rw-wrapped-gantt .rw-gantt-header{height:64px}.rw-wrapped-gantt .rw-gantt-years,.rw-wrapped-gantt .rw-gantt-months{height:20px}.rw-wrapped-gantt .rw-gantt-years>span,.rw-wrapped-gantt .rw-gantt-months>span{font-size:10px;font-weight:400;color:var(--rw-secondary);padding:2px 5px}.rw-wrapped-gantt .rw-gantt-days{height:24px}.rw-wrapped-gantt .rw-gantt-days>span{font-size:9px;color:var(--rw-hint);top:5px}.rw-wrapped-gantt .rw-gantt-calendar .rw-gantt-today{top:40px}.rw-wrapped-gantt .rw-gantt-label{position:static;padding:10px;overflow-wrap:anywhere}.rw-wrapped-gantt .rw-gantt-label-heading{font-size:11px;font-weight:400;padding-left:0}.rw-wrapped-gantt .rw-gantt-project-heading .rw-project-title{font-size:11px!important;font-weight:500}.rw-wrapped-gantt .rw-gantt-caption{height:auto;min-height:0;font-size:10px;font-weight:400;line-height:1.5;color:var(--rw-secondary);white-space:normal}.rw-wrapped-gantt .rw-gantt-caption time{font-size:9px;line-height:1.6;color:var(--rw-hint);font-weight:400}.rw-wrapped-gantt .rw-gantt-caption>span{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere;line-height:1.5}.rw-gantt-caption-event{display:block}.rw-wrapped-gantt .rw-gantt-pending{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.5;font-size:9px;color:var(--rw-hint)}.rw-wrapped-gantt .rw-gantt-future{font-size:9px;white-space:normal;max-width:35%;color:var(--rw-hint)}.rw-wrapped-gantt .rw-gantt-bar{height:13px;top:23px}.rw-wrapped-gantt .rw-bar-from-previous{border-top-left-radius:0;border-bottom-left-radius:0}.rw-wrapped-gantt .rw-bar-to-next{border-top-right-radius:0;border-bottom-right-radius:0}.rw-gantt-stacked .rw-gantt-header,.rw-gantt-stacked .rw-gantt-row{grid-template-columns:minmax(0,1fr)}.rw-gantt-stacked .rw-gantt-label-heading{display:none}.rw-gantt-stacked .rw-gantt-row>.rw-gantt-label{border-right:0;border-bottom:1px solid var(--rw-soft-rule);border-radius:6px 6px 0 0;display:flex;align-items:center;flex-wrap:wrap;gap:5px 10px;padding:8px 10px}.rw-gantt-stacked .rw-gantt-project-heading{margin:0;min-width:0}.rw-gantt-stacked .rw-gantt-row .rw-gantt-lane{border-radius:0 0 6px 6px}.rw-gantt-stacked .rw-gantt-stage,.rw-gantt-stacked .rw-people{margin-top:0}\n"
    const COMPACT_TIME_CSS = "\n.rw-compact-timeline{min-width:0;container-type:inline-size}.rw-compact-time-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.rw-compact-years{font-size:10px;color:var(--rw-secondary);font-variant-numeric:tabular-nums}.rw-compact-time-axis{display:grid;gap:12px 0;list-style:none;padding:0;margin:0}.rw-compact-node{display:grid;grid-template-columns:var(--rw-node-label-width);grid-template-rows:18px 20px auto;gap:3px;justify-items:center;text-align:center;position:relative;min-width:0}.rw-compact-node time{font-size:12px;line-height:1.5;font-weight:600;color:var(--rw-ink);font-variant-numeric:tabular-nums;white-space:nowrap}.rw-compact-node::after{content:'';position:absolute;left:calc(var(--rw-node-label-width) / 2);width:100%;top:29px;height:4px;box-sizing:border-box;border-top:2px dashed var(--rw-line);z-index:0}.rw-compact-node.rw-node-elapsed::after{border:0;background:var(--rw-line);border-radius:2px}.rw-compact-node:last-child::after{display:none}.rw-compact-node-dot{display:flex;align-items:center;justify-content:center;position:relative;z-index:1;width:14px;height:14px;box-sizing:border-box;border:2px solid var(--rw-line);border-radius:50%;background:var(--dsw-alias-bg-base);outline:3px solid var(--dsw-alias-bg-base);margin:2px 0;color:var(--dsw-alias-bg-base);font-size:9px;line-height:1;font-weight:600}.rw-node-actual .rw-compact-node-dot{background:var(--rw-ink);border-color:var(--rw-ink)}.rw-node-future time{color:var(--rw-secondary);font-weight:500}.rw-compact-node-label{font-size:10px;line-height:1.5;color:var(--rw-secondary);max-width:100%;box-sizing:border-box;padding:0 4px;overflow-wrap:anywhere;white-space:normal}.rw-node-actual .rw-compact-node-label{color:var(--rw-ink)}\n\n.rw-compact-time-rows{display:grid;gap:14px}.rw-compact-node>*{grid-column:1}.rw-compact-node-label{width:var(--rw-node-label-width)}\n"
    const CONTACTS_CSS = "\n.rw-people{display:flex;flex-wrap:wrap;gap:7px 16px;margin-top:8px;min-width:0}.rw-person{min-width:0;font-size:12px;max-width:100%;overflow-wrap:anywhere}.rw-person-heading{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 8px}.rw-person-name{font-weight:500;color:var(--rw-ink)}.rw-person-institution,.rw-person-notes{color:var(--rw-secondary);font-size:11px}.rw-person-email{font-size:11px;color:var(--rw-secondary);text-decoration:none}.rw-person-email:hover{text-decoration:underline}.rw-person-notes{white-space:pre-wrap}.rw-people-compact{gap:3px 8px}.rw-people-compact .rw-person{font-size:11px}.rw-people-editor{margin:8px 0 18px}.rw-people-editor h3{margin:0}.rw-person-editor{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:10px 12px;margin-top:8px}.rw-person-row-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}.rw-person-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px;align-items:start}.rw-person-fields .rw-field{min-width:0;margin:0}.rw-person-fields input,.rw-person-fields textarea{width:100%}.rw-person-fields textarea{min-height:62px}.rw-person-field{position:relative}.rw-person-suggestions{position:absolute;z-index:10;left:0;right:0;top:100%;margin-top:3px;max-height:220px;overflow:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);padding:3px}.rw-person-option{display:block;width:100%;text-align:left;border:0;border-radius:4px;background:none;color:var(--dsw-alias-label-primary);padding:7px 8px;cursor:pointer;overflow-wrap:anywhere}.rw-person-option>strong{display:block;font-size:12px;font-weight:500}.rw-person-option>span{display:block;font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:2px}.rw-person-option:hover,.rw-person-option-active{background:var(--dsw-alias-bg-layer-2)}@media(max-width:560px){.rw-person-fields{grid-template-columns:minmax(0,1fr)}}\n"
    const ACTION_NOTES_CSS = "\n/* Match the three header actions, including their target and vector sizes. */\n.lwb-root .rw-action-icon{width:28px;height:28px;min-width:28px;flex:none;padding:5px;box-sizing:border-box;border:0;border-radius:5px;background:none;color:color-mix(in srgb,var(--rw-ink) 68%,var(--dsw-alias-bg-base));display:inline-flex;align-items:center;justify-content:center;cursor:pointer}\n.lwb-root .rw-action-icon .lwb-svg{width:18px;height:18px;stroke-width:1.7;flex:none}\n.lwb-root .rw-action-icon:hover{border:0;background:color-mix(in srgb,var(--rw-ink) 5%,var(--dsw-alias-bg-base));color:var(--rw-ink)}\n.lwb-root .rw-action-icon:focus-visible{outline:2px solid var(--rw-ink);outline-offset:2px}\n.lwb-root .rw-note-composer{width:100%;max-width:720px;min-width:0;margin:10px auto 0;box-sizing:border-box}\n.lwb-root .rw-note-composer>.lwb-textarea{display:block;width:100%;max-width:100%;min-width:0;min-height:150px;height:clamp(150px,18vh,220px);padding:10px 12px;line-height:1.65;resize:vertical;box-sizing:border-box}\n.lwb-root .rw-note-composer>.lwb-row{margin-top:8px}\n"
    const DESTINATION_CSS = "\n.rw-destination-editor{margin:16px 0}.rw-destination-picker{display:flex;gap:6px;margin:6px 0;align-items:center}.rw-destination-picker .lwb-input,.rw-destination-picker .lwb-select{min-width:0;flex:1;font-size:12px}.rw-destination-picker:first-of-type .lwb-select{flex:0 0 90px}.rw-destination-list{list-style:none;padding:0;margin:8px 0}.rw-destination-list li,.rw-destination-option{display:flex;gap:8px;align-items:center;min-width:0;padding:6px 0;font-size:12px}.rw-destination-kind{font-size:10px;color:var(--dsw-alias-label-secondary);flex:none}.rw-destination-name{flex:1;min-width:0;overflow-wrap:anywhere;text-align:left}.rw-destination-list svg,.rw-destination-option svg{width:16px;height:16px;flex:none;color:var(--dsw-alias-label-secondary)}.rw-destination-menu{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:9px;padding:10px;width:min(360px,calc(100vw - 40px));max-height:60vh;overflow:auto;font-family:var(--dsw-font-family);box-shadow:0 8px 28px #0001}.rw-destination-menu-head{display:flex;align-items:center;justify-content:space-between;font-size:12px;margin-bottom:5px}.rw-destination-option{width:100%;border:0;border-radius:5px;background:transparent;color:inherit;cursor:pointer;padding:9px 6px}.rw-destination-option:hover,.rw-destination-option:focus-visible{background:var(--dsw-alias-bg-layer-2)}.rw-destination-menu .lwb-icon-btn{border:0;background:transparent;color:inherit;cursor:pointer;padding:4px}.rw-destination-menu .lwb-err{font-size:12px;line-height:1.5}\n"
    const UNIFIED_DAILY_CSS = "\n/* A single, secondary daily list. */\n.lwb-root .rw-unified-daily>.rw-block-heading{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:4px 0 9px;border:0}.rw-unified-daily .rw-block-heading:before{display:none}.rw-daily-tools{display:flex;align-items:center;gap:2px}.lwb-root .rw-daily-tools .lwb-icon-btn{width:25px;height:25px;padding:4px}.rw-daily-tools svg{width:16px;height:16px}.rw-daily-tools .is-active{background:var(--dsw-alias-bg-layer-2);color:var(--rw-blue)}.rw-unified-list{min-width:0}.rw-unified-list.is-expanded{max-height:260px;overflow:auto;scrollbar-gutter:stable}.lwb-root .rw-unified-list .rw-task-entry{padding:7px 0;gap:9px}.rw-task-dot{display:block;width:7px;height:7px;border:0;border-radius:50%;flex:none;box-sizing:border-box;margin:7px 4px 0;padding:0}.rw-dot-calendar{background:var(--rw-green)}.rw-dot-manual{background:var(--rw-blue);cursor:pointer;position:relative}.rw-dot-manual:before{content:\"\";position:absolute;inset:-6px}.rw-dot-manual:focus-visible{outline:2px solid var(--rw-blue);outline-offset:4px}.rw-dot-manual:hover{box-shadow:0 0 0 3px color-mix(in srgb,var(--rw-blue) 15%,transparent)}.lwb-root .rw-unified-list .rw-calendar-entry .lwb-item-text{color:var(--rw-ink)}.rw-add-task-popover{width:min(360px,calc(100vw - 40px));padding:16px;box-sizing:border-box;border:1px solid var(--rw-line);border-radius:10px;color:var(--rw-ink);background:var(--dsw-alias-bg-base);font:inherit;max-height:80vh;overflow:auto}.rw-add-task-popover>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.rw-add-task-popover h3{font-size:13px;font-weight:600;margin:0}.rw-add-task-popover form{display:grid;gap:10px}.rw-add-task-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rw-add-task-fields label{display:grid;gap:5px;font-size:11px;color:var(--rw-secondary)}.lwb-root .rw-add-task-popover .lwb-input,.lwb-root .rw-add-task-popover .lwb-select{width:100%;min-width:0;box-sizing:border-box;font-size:12px;padding:7px 8px}.rw-add-task-popover footer{display:flex;justify-content:flex-end}.rw-add-task-popover footer button{padding:5px 14px;font-size:12px}\n"
    const HEADING_ICONS_CSS = ".lwb-root .rw-block-heading:before,.lwb-root .rw-block-heading h2:before{display:none;content:none}.rw-section-icon{flex:none;color:var(--rw-secondary)}.rw-section-chevron{transform-origin:10px 10px}.rw-block[open]>.rw-block-heading .rw-section-chevron{transform:rotate(90deg)}.lwb-root .rw-block-heading{gap:8px}.lwb-root .rw-block-heading:focus-visible{outline:1px solid var(--rw-blue);outline-offset:4px;border-radius:4px}"
    const SUMMARY_CLEAN_CSS = ".lwb-root .rw-project.rw-paper-brief .rw-compact-timeline{position:relative}.lwb-root .rw-project.rw-paper-brief .rw-compact-time-head{position:absolute;right:0;top:0;margin:0;line-height:1.2;pointer-events:none}.lwb-root .rw-project.rw-paper-brief .rw-compact-time-axis{margin-top:0;margin-right:52px}.lwb-root .rw-project.rw-paper-brief .rw-compact-years{font-size:9px;opacity:.75}.lwb-root .rw-project.rw-paper-brief.rw-project-active .rw-project-title{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;white-space:normal;overflow-wrap:anywhere;overflow:hidden;text-overflow:ellipsis;height:3em;min-height:3em;max-height:3em;line-height:1.5}.lwb-root .rw-home .rw-project.rw-paper-brief.rw-project-active{min-height:200px}.lwb-root .rw-project.rw-paper-brief .rw-project-title+.rw-people{margin-top:5px}.lwb-root .rw-project.rw-paper-brief .rw-brief-time{margin-top:5px}.lwb-root .rw-project.rw-paper-brief .rw-compact-time-head{margin-bottom:2px;min-height:0;line-height:1.2}.lwb-root .rw-project.rw-paper-brief .rw-compact-timeline{margin-top:0;padding-top:0}.lwb-root .rw-brief-card .rw-compact-time-head>.rw-card-caption{display:none}.lwb-root .rw-brief-card .rw-compact-time-head{justify-content:flex-end}.lwb-root .rw-project.rw-paper-brief:is(.rw-project-completed,.rw-project-planned,.rw-project-paused) .rw-project-title{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-height:1.5;height:3em;min-height:3em;max-height:3em;overflow:hidden;white-space:normal;overflow-wrap:anywhere}.lwb-root .rw-project.rw-paper-brief .rw-people{flex-wrap:nowrap;height:20px;min-height:20px;max-height:20px;overflow:hidden}.lwb-root .rw-project.rw-paper-brief .rw-person-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lwb-root .rw-paper-brief .rw-project-title{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;line-height:1.5;height:3em;min-height:3em;max-height:3em;width:100%;padding:0;box-sizing:content-box;white-space:normal;overflow-wrap:anywhere}.lwb-root .rw-paper-brief .rw-people{display:flex;flex-wrap:nowrap;height:20px;min-height:20px;overflow:hidden;gap:0 10px}.lwb-root .rw-paper-brief .rw-people>.rw-collaborator-label{flex:none}.lwb-root .rw-paper-brief .rw-people>.rw-person{flex:0 1 auto;min-width:0;overflow:hidden}.lwb-root .rw-paper-brief .rw-person-name{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lwb-root .rw-paper-brief .rw-person-mail{flex:none}.lwb-root .rw-project-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,213px),1fr))}.lwb-root .rw-course-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,213px),1fr))}@media(max-width:700px){.lwb-root .rw-project-grid,.lwb-root .rw-course-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,187px),1fr))}}.rw-card-destinations{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:8px}.lwb-root .rw-card-destination{display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:2px 0;border:0;background:none;color:var(--rw-secondary);font:inherit;font-size:11px;text-align:left;cursor:pointer}.rw-card-destination span{overflow-wrap:anywhere}.rw-card-destination svg{width:13px;height:13px;flex:none}.lwb-root .rw-card-destination:hover{color:var(--rw-blue)}.lwb-root .rw-brief-card.rw-project-active{padding:15px 16px;background:color-mix(in srgb,var(--rw-blue) 6%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-blue) 48%,var(--dsw-alias-bg-base))}.lwb-root .rw-brief-card.rw-project-planned{padding:10px 12px;background:color-mix(in srgb,var(--rw-ink) 1.5%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-ink) 29%,var(--dsw-alias-bg-base));align-self:start}.lwb-root .rw-brief-card.rw-project-planned .rw-project-title{font-size:13px;font-weight:500;line-height:1.45;color:var(--rw-secondary)}.lwb-root .rw-brief-card.rw-project-active .rw-project-title{font-size:14px;font-weight:600}.lwb-root .rw-brief-card.rw-project-planned .rw-card-meta{margin-bottom:4px}.lwb-root .rw-brief-card.rw-project-planned .rw-people{margin-top:5px;gap:3px 12px}.lwb-root .rw-brief-card.rw-project-planned .rw-brief-time{margin-top:8px}.lwb-root .rw-brief-card.rw-project-planned .rw-brief-time p,.lwb-root .rw-brief-card.rw-project-planned .rw-brief-location{font-size:11px;margin:4px 0}.lwb-root .rw-brief-card.rw-project-planned .rw-compact-time-head{margin-bottom:4px}.lwb-root .rw-brief-card.rw-project-planned .rw-person-name{color:var(--rw-secondary)}.lwb-root .rw-brief-card{cursor:pointer;display:block}.rw-brief-card .rw-project-title{display:block;text-align:left}.rw-brief-time{margin-top:12px}.rw-brief-time p,.rw-brief-location{font-size:12px;color:var(--rw-secondary);margin:6px 0}.rw-info-dialog{width:min(760px,calc(100vw - 28px));max-height:calc(100dvh - 32px);padding:0;overflow:hidden;box-sizing:border-box;border:1px solid var(--rw-line);border-radius:12px;color:var(--rw-ink);background:var(--dsw-alias-bg-base)}.rw-info-dialog[open]{display:flex;flex-direction:column}.rw-info-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 24px 14px;flex:none}.rw-info-head h2{font-size:18px;line-height:1.5;margin:5px 0 0;font-weight:600;overflow-wrap:anywhere}.rw-detail-kind{font-size:11px;color:var(--rw-secondary)}.rw-info-body{overflow:auto;min-height:0;padding:0 24px 24px;overscroll-behavior:contain}.rw-detail-section{margin-top:20px}.rw-detail-section h3{font-size:12px;color:var(--rw-secondary);font-weight:500;margin:0 0 9px}.rw-detail-prose{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.7;margin:5px 0}.rw-detail-facts{display:flex;flex-wrap:wrap;gap:12px 28px;margin:0}.rw-detail-facts dt,.rw-detail-list small,.rw-detail-plan small{font-size:11px;color:var(--rw-secondary)}.rw-detail-facts dd{margin:3px 0 0;font-size:13px}.rw-detail-people{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:16px}.rw-detail-people strong{font-size:13px}.rw-detail-people a,.rw-detail-link{font-size:12px;color:var(--rw-blue);overflow-wrap:anywhere}.rw-detail-link{display:flex;align-items:center;gap:6px;margin:7px 0;text-decoration:none}.rw-detail-list{padding-left:18px;margin:0}.rw-detail-list li{margin:8px 0}.rw-detail-list small,.rw-detail-plan small{display:block}.rw-detail-plan{margin:12px 0}.rw-detail-plan strong{font-size:13px}@media(max-width:500px){.rw-info-head{padding:16px}.rw-info-body{padding:0 16px 16px}.rw-info-head h2{font-size:16px}}.lwb-root .rw-people{display:flex;flex-wrap:wrap;gap:5px 14px;align-items:center}.lwb-root .rw-people>.rw-person{display:inline-flex;align-items:center;gap:4px;flex:0 0 auto;max-width:100%;padding:0;border:0;background:none}.lwb-root .rw-person-name{white-space:nowrap;font-size:11px;font-weight:500}.lwb-root .rw-person-mail{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;color:var(--rw-secondary);text-decoration:none;border-radius:4px}.lwb-root .rw-person-mail:hover{background:var(--dsw-alias-bg-layer-2);color:var(--rw-blue)}.lwb-root .rw-person-mail svg{width:13px;height:13px;flex:none}.lwb-root .rw-summary-section>h2{display:flex;align-items:center;gap:7px}.lwb-root .rw-summary-section>h2>svg.rw-section-icon{width:14px;height:14px;min-width:14px;max-width:14px;max-height:14px;flex:0 0 14px;display:block}.lwb-root .rw-summary-section>h2:before{content:none;display:none}.rw-summary-section .rw-section-chevron{transform:rotate(90deg)}.rw-scale-icons{display:flex;gap:3px}.rw-scale-icons button[aria-pressed=true]{background:var(--dsw-alias-bg-layer-2);color:var(--rw-blue)}.rw-scale-letter{font-size:11px}.lwb-root .rw-gantt-today:before,.lwb-root .rw-gantt-calendar .rw-gantt-today:before{clip-path:none;content:\"\";position:absolute;top:0;left:-3px;width:7px;height:7px;border-radius:50%;background:var(--rw-blue)}.rw-gantt-calendar .rw-gantt-today{pointer-events:auto}.lwb-root .rw-teach-day.rw-teach-today{background:color-mix(in srgb,var(--rw-blue) 9%,var(--dsw-alias-bg-base));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-blue) 50%,transparent)}.lwb-root .rw-teach-today .rw-teach-date{background:var(--rw-blue);color:var(--dsw-alias-bg-base);border-radius:50%}.rw-summary-toggle[aria-pressed=true]{opacity:.5}.rw-summary-stats>div{white-space:nowrap}.lwb-root .rw-project.rw-paper-brief .rw-card-meta{display:flex;align-items:center;justify-content:space-between;gap:8px}.lwb-root .rw-project.rw-paper-brief .rw-card-year{margin-left:auto;flex:none;font-size:10px;font-weight:400;line-height:1.4;color:var(--rw-hint);font-variant-numeric:tabular-nums}.lwb-root .rw-project.rw-paper-brief .rw-compact-time-head{display:none}.lwb-root .rw-project.rw-paper-brief .rw-compact-time-axis{margin-right:0}.lwb-root .rw-project.rw-course-card.rw-brief-card .rw-project-title{margin-bottom:0}.lwb-root .rw-project.rw-course-card.rw-brief-card .rw-brief-location{margin:5px 0 0;line-height:1.5}.lwb-root .rw-project.rw-course-card.rw-brief-card .rw-brief-time{margin-top:5px}.lwb-root .rw-project.rw-course-card.rw-brief-card .rw-brief-time:empty{display:none}.lwb-root .rw-project.rw-course-card.rw-brief-card .rw-brief-time p{margin:0;line-height:1.5}.lwb-root .rw-gantt-compact .rw-gantt-row{margin:0;border:0;border-bottom:1px solid var(--rw-soft-rule);border-radius:0}.lwb-root .rw-gantt-compact .rw-gantt-label{padding:6px 8px;display:flex;align-items:center}.lwb-root .rw-gantt-compact .rw-gantt-project-heading{display:flex;align-items:center;gap:7px;min-width:0;width:100%;margin:0}.lwb-root .rw-gantt-compact .rw-project-title{font-size:12px;font-weight:500;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;min-width:0}.lwb-root .rw-gantt-compact .rw-gantt-swatch{flex:none}.lwb-root .rw-gantt-compact .rw-gantt-label>.rw-status,.lwb-root .rw-gantt-compact .rw-people,.lwb-root .rw-gantt-compact .rw-gantt-stage,.lwb-root .rw-gantt-compact .rw-gantt-caption,.lwb-root .rw-gantt-compact .rw-gantt-stem,.lwb-root .rw-gantt-compact .rw-gantt-future{display:none}.lwb-root .rw-gantt-compact .rw-gantt-bar{top:13px;height:12px}.lwb-root .rw-gantt-compact .rw-gantt-node{top:14px;width:10px;height:10px}.rw-gantt-group-title{font-size:11px;color:var(--rw-secondary);padding:10px 8px 5px;font-weight:500}.lwb-root .rw-gantt-compact .rw-gantt-lane{border-radius:0}.rw-period-board{min-width:0}.rw-period-tools{display:flex;justify-content:flex-end;gap:3px;margin-bottom:8px}.rw-period-tools [aria-pressed=true]{background:var(--dsw-alias-bg-layer-2);color:var(--rw-blue)}.rw-period-header,.rw-period-project{display:grid;grid-template-columns:minmax(100px,26%) minmax(0,1fr)}.rw-period-project{border-bottom:1px solid var(--rw-soft-rule);align-items:center}.rw-period-name{display:flex;gap:7px;align-items:center;min-width:0;padding:4px 9px 4px 0;font-size:12px}.rw-period-name>span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rw-period-name .rw-gantt-swatch{flex:none;width:7px;height:7px}.rw-period-scale,.rw-period-line{display:grid;grid-template-columns:72px minmax(0,1fr);align-items:center;min-width:0;height:25px}.rw-period-date{font-size:9px;color:var(--rw-hint);white-space:nowrap;padding-left:4px}.rw-period-ticks,.rw-period-track{position:relative;height:100%;min-width:0}.rw-period-ticks>span{position:absolute;top:5px;box-sizing:border-box;font-size:9px;white-space:nowrap;overflow:hidden;text-align:center;color:var(--rw-secondary);border-left:1px solid var(--rw-soft-rule)}.rw-period-track .rw-gantt-bar{top:8px;height:9px;border-radius:3px}.rw-period-track .rw-gantt-node{top:8px;width:9px;height:9px}.rw-period-track .rw-gantt-today{top:0;bottom:0}.rw-period-line+.rw-period-line{border-top:1px dotted var(--rw-soft-rule)}@media(max-width:600px){.rw-period-header,.rw-period-project{grid-template-columns:minmax(80px,28%) minmax(0,1fr)}.rw-period-scale,.rw-period-line{grid-template-columns:60px minmax(0,1fr)}.rw-period-name{font-size:11px}}.lwb-root .rw-summary-dashboard .rw-teach-grid{gap:1px;border:1px solid var(--rw-soft-rule);border-radius:10px;overflow:hidden;background:var(--rw-soft-rule)}.lwb-root .rw-summary-dashboard .rw-teach-weekday{padding:4px;border:0;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base));font-size:10px}.lwb-root .rw-summary-dashboard .rw-teach-day{min-height:60px;padding:4px;border:0}.lwb-root .rw-summary-dashboard .rw-teach-blank{background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base))}.lwb-root .rw-summary-dashboard .rw-teach-date{min-width:20px;height:20px;margin-bottom:2px;font-size:10px}.lwb-root .rw-summary-dashboard .rw-teach-event{padding:2px 4px;margin:2px 0;line-height:1.35;border-radius:5px;border-left-width:2px;box-sizing:border-box}.lwb-root .rw-summary-dashboard .rw-teach-selected{border-radius:5px;box-shadow:inset 0 0 0 1px var(--rw-blue)!important}.lwb-root .rw-summary-dashboard .rw-teaching-calendar .rw-calendar-head{margin-bottom:8px}.lwb-root .rw-summary-dashboard .rw-teach-legend{gap:6px 18px;padding:8px 0 5px}.lwb-root .rw-summary-dashboard .rw-teach-status-key{padding-bottom:7px;gap:12px}.lwb-root .rw-summary-dashboard .rw-teach-agenda{margin-top:6px;padding-top:7px}.lwb-root .rw-summary-dashboard .rw-teach-agenda-item{padding:5px 0;gap:8px}@media(max-width:600px){.lwb-root .rw-summary-dashboard .rw-teach-day{min-height:54px;padding:3px}.lwb-root .rw-summary-dashboard .rw-teach-event{padding:2px}}.lwb-root .rw-summary-papers .rw-summary-stats{margin-bottom:8px}.lwb-root .rw-period-tools{justify-content:flex-start;margin:0 0 4px;gap:3px}.lwb-root .rw-period-board>.rw-gantt-group-title{padding-top:6px}.lwb-root .rw-summary-papers .rw-period-board{margin-top:0}.lwb-root .rw-period-header>.rw-period-tools{align-self:center;justify-content:flex-start;margin:0;gap:3px}.lwb-root .rw-period-header{align-items:center}.lwb-root{--rw-section-gap:36px;--rw-content-gap:12px}.lwb-root .rw-home,.lwb-root .rw-summary-dashboard{display:flex;flex-direction:column;gap:var(--rw-section-gap)}.lwb-root .rw-home>.rw-block,.lwb-root .rw-home>.rw-day-agenda{margin-top:0;margin-bottom:0}.lwb-root .rw-summary-dashboard>.rw-summary-section{margin:0;padding:0;border:0}.lwb-root .rw-home .rw-block-heading{padding-bottom:0}.lwb-root .rw-home .rw-block>.rw-block-content{padding-top:var(--rw-content-gap)}.lwb-root .rw-summary-dashboard>.rw-summary-section>h2{margin-bottom:var(--rw-content-gap)}.lwb-root .rw-home .rw-group{margin-bottom:var(--rw-content-gap)}.lwb-root .rw-home .rw-group:last-child{margin-bottom:0}.lwb-root .rw-project-grid,.lwb-root .rw-course-grid{gap:var(--rw-content-gap)}@media(max-width:600px){.lwb-root{--rw-section-gap:28px}}.lwb-root .rw-summary-dashboard .rw-calendar-head .rw-month-picker{width:auto;max-width:155px;min-height:26px;height:26px;padding:2px 5px;border:0;border-radius:5px;background:transparent;box-shadow:none;font:inherit;font-size:12px;font-weight:500;line-height:1.5;color:var(--rw-secondary);cursor:pointer}.lwb-root .rw-summary-dashboard .rw-calendar-head .rw-month-picker:hover{background:var(--dsw-alias-bg-layer-2);color:var(--rw-ink)}.lwb-root .rw-summary-dashboard .rw-calendar-head .rw-month-picker:focus-visible{outline:1px solid var(--rw-blue);outline-offset:2px;box-shadow:none}.lwb-root .rw-summary-dashboard .rw-month-picker::-webkit-calendar-picker-indicator{opacity:.45;cursor:pointer;width:13px;height:13px;margin-left:4px}.lwb-root .rw-summary-dashboard .rw-month-picker::-webkit-datetime-edit{padding:0}.lwb-root .rw-summary-dashboard .rw-calendar-head{gap:4px;align-items:center}.lwb-root .rw-project-grid,.lwb-root .rw-course-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,max(213px,calc((100% - 36px)/4))),1fr));gap:12px;align-items:start}.lwb-root .rw-project-grid>.rw-project,.lwb-root .rw-course-grid>.rw-project{width:100%;max-width:100%;box-sizing:border-box;grid-column:auto}@media(max-width:700px){.lwb-root .rw-project-grid,.lwb-root .rw-course-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,max(187px,calc((100% - 36px)/4))),1fr))}}\n/* Open agenda and bounded, gently accented project cards. */\n.lwb-root .rw-home>.rw-day-agenda{gap:22px 36px;padding:6px 0 2px;align-items:center}\n.lwb-root .rw-home .rw-day-agenda>.rw-day-panel{position:relative;background:none;border:0;border-radius:0;box-shadow:none;padding:0 0 0 17px}\n.lwb-root .rw-home .rw-day-agenda>.rw-day-panel:before{content:\"\";position:absolute;left:0;top:3px;bottom:3px;width:2px;border-radius:2px;background:var(--rw-soft-rule)}\n.lwb-root .rw-home .rw-day-agenda>.rw-day-today:before{background:var(--rw-blue)}\n.lwb-root .rw-home .rw-day-panel>header{justify-content:flex-start;align-items:center;gap:10px;margin:0 0 7px}\n.lwb-root .rw-home .rw-day-today h2{font-size:14px;font-weight:600}\n.lwb-root .rw-home .rw-day-tomorrow h2{font-size:12px;font-weight:500;color:var(--rw-secondary)}\n.lwb-root .rw-home .rw-day-panel>header>time{font-size:10px;letter-spacing:.03em;color:var(--rw-hint)}\n.lwb-root .rw-home .rw-day-today>header>time{color:var(--rw-blue)}\n.lwb-root .rw-home .rw-day-panel .rw-agenda-list>li{padding:5px 0;gap:8px;border:0}\n.lwb-root .rw-home .rw-day-tomorrow .rw-agenda-title{font-size:11px;color:var(--rw-secondary)}\n.lwb-root .rw-home .rw-agenda-detail{max-width:65ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--rw-hint)}\n.lwb-root .rw-home .rw-project-grid,.lwb-root .rw-home .rw-course-grid{max-width:1476px;grid-template-columns:repeat(auto-fill,minmax(min(100%,max(213px,calc((100% - 36px)/4))),1fr));gap:12px}\n.lwb-root .rw-home .rw-project.rw-brief-card{position:relative;aspect-ratio:2.1 / 1;min-height:180px;max-width:360px;border:1px solid var(--rw-soft-rule);border-radius:12px 12px 12px 5px;box-shadow:none;overflow:visible}\n.lwb-root .rw-home .rw-project.rw-brief-card:before{content:\"\";position:absolute;left:15px;top:-1px;width:26px;height:2px;border-radius:2px;background:var(--rw-blue);pointer-events:none}\n.lwb-root .rw-home .rw-project.rw-brief-card.rw-project-active{background:color-mix(in srgb,var(--rw-blue) 3%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-blue) 30%,var(--dsw-alias-bg-base))}\n.lwb-root .rw-home .rw-project.rw-brief-card.rw-project-planned{background:var(--dsw-alias-bg-base);border-color:var(--rw-soft-rule)}\n.lwb-root .rw-home .rw-project.rw-brief-card.rw-project-planned:before{background:color-mix(in srgb,var(--rw-blue) 38%,var(--dsw-alias-bg-base));width:18px}\n.lwb-root .rw-home .rw-course-card.rw-brief-card:before{background:var(--rw-violet)}\n.lwb-root .rw-home .rw-project.rw-brief-card:hover{border-color:var(--rw-line);box-shadow:none}\n@media(max-width:700px){.lwb-root .rw-home .rw-project-grid,.lwb-root .rw-home .rw-course-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,max(187px,calc((100% - 36px)/4))),1fr))}.lwb-root .rw-home .rw-project.rw-brief-card{min-height:180px}}\n\n.lwb-root .rw-summary-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;align-items:start;min-width:0}\n.lwb-root .rw-summary-layout>.rw-summary-stats{margin:0;gap:12px 26px}\n.lwb-root .rw-summary-chart{min-width:0;width:100%}\n.lwb-root .rw-summary-layout.is-wide{grid-template-columns:140px minmax(0,1fr);column-gap:32px}\n.lwb-root .rw-summary-layout.is-wide>.rw-summary-stats{flex-direction:column;gap:24px;padding-top:34px;align-items:flex-start}\n.lwb-root .rw-summary-layout.is-wide>.rw-summary-stats>div{align-items:baseline;gap:8px}\n.lwb-root .rw-summary-layout-courses .rw-summary-chart{max-width:980px;justify-self:end}\n.lwb-root .rw-summary-dashboard .rw-teach-grid{grid-template-columns:repeat(7,minmax(0,1fr));align-items:stretch}\n.lwb-root .rw-summary-dashboard .rw-teach-day{aspect-ratio:1.4 / 1;min-width:0;min-height:60px;height:auto;box-sizing:border-box}\n.lwb-root .rw-summary-dashboard .rw-teach-event{max-width:100%;min-width:0}\n.lwb-root .rw-summary-layout-papers .rw-period-board{width:100%;max-width:none}\n.lwb-root .rw-course-card .rw-next-lessons{height:41px;min-height:41px;max-height:41px;display:grid;grid-template-rows:18px 18px;gap:5px}.lwb-root .rw-course-card .rw-next-lesson{display:flex;align-items:center;gap:6px;min-width:0;margin:0;line-height:18px;height:18px}.rw-next-lesson-time{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.rw-holiday-label{flex:none;font-size:10px;line-height:16px;padding:0 4px;border-radius:3px;color:var(--rw-secondary);background:color-mix(in srgb,var(--rw-violet) 9%,transparent)}\n/* Keep the page composed on large displays, aligned with its header. */\n.lwb-root .rw-home{width:100%;max-width:1200px;margin-inline:auto;box-sizing:border-box}\n.lwb-root .rw-summary-dashboard{width:100%;max-width:1200px;margin-inline:auto;box-sizing:border-box}\n.lwb-root:has(.rw-home) .lwb-head{width:100%;max-width:1248px;margin-inline:auto;box-sizing:border-box}\n.lwb-root:has(.rw-summary-dashboard) .lwb-head{width:100%;max-width:1248px;margin-inline:auto;box-sizing:border-box}\n.lwb-root .rw-home>.rw-day-agenda{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);column-gap:24px;width:100%;box-sizing:border-box}\n@container workbench-home (max-width:620px){.lwb-root .rw-home>.rw-day-agenda{grid-template-columns:minmax(0,1fr);row-gap:20px}}\n@media(max-width:700px){.lwb-root .rw-home>.rw-day-agenda{grid-template-columns:minmax(0,1fr);row-gap:20px}}\n\n/* Match the overview reading hierarchy to the workbench. */\n.lwb-root .rw-summary-dashboard{font-size:13px;line-height:1.5}\n.lwb-root .rw-summary-dashboard>.rw-summary-section>h2{font-size:14px;font-weight:600;color:var(--rw-ink);line-height:1.5}\n.lwb-root .rw-summary-dashboard .rw-summary-stats span{font-size:12px;line-height:1.5}\n.lwb-root .rw-summary-dashboard .rw-summary-stats strong{font-size:24px;font-weight:550}\n.lwb-root .rw-summary-dashboard .rw-summary-list h3{font-size:13px;font-weight:550}\n.lwb-root .rw-summary-dashboard .rw-summary-tasks li{font-size:13px;line-height:1.55}\n.lwb-root .rw-summary-dashboard .rw-summary-count,.lwb-root .rw-summary-dashboard .rw-summary-tasks time{font-size:11px}\n.lwb-root .rw-summary-dashboard .rw-teach-legend,.lwb-root .rw-summary-dashboard .rw-course-name{font-size:13px}\n.lwb-root .rw-summary-dashboard .rw-teach-progress{font-size:12px;color:var(--rw-secondary)}\n.lwb-root .rw-summary-dashboard .rw-period-name{font-size:13px;line-height:1.5}\n.lwb-root .rw-summary-dashboard .rw-gantt-group-title{font-size:12px;line-height:1.5}\n.lwb-root .rw-summary-dashboard .rw-period-date,.lwb-root .rw-summary-dashboard .rw-period-ticks>span{font-size:10px}\n.lwb-root .rw-summary-dashboard .rw-teach-weekday{font-size:11px}\n.lwb-root .rw-summary-dashboard .rw-teach-date{font-size:11px;min-width:21px;height:21px}\n.lwb-root .rw-summary-dashboard .rw-teach-event,.lwb-root .rw-summary-dashboard .rw-teach-event-name{font-size:11px}\n.lwb-root .rw-summary-dashboard .rw-teach-event-time{font-size:10px}\n.lwb-root .rw-summary-dashboard .rw-month-picker{font-size:13px}\n.lwb-root .rw-summary-chart{container-type:inline-size;container-name:summary-chart}\n@container summary-chart (max-width:600px){.lwb-root .rw-summary-dashboard .rw-period-name{font-size:12px}.lwb-root .rw-summary-dashboard .rw-period-ticks>span{font-size:9px}.lwb-root .rw-summary-dashboard .rw-teach-event-name{font-size:10px}.lwb-root .rw-summary-dashboard .rw-teach-event{flex-wrap:wrap}.lwb-root .rw-summary-dashboard .rw-teach-event-name{width:100%}}\n.lwb-root .rw-unified-daily>.rw-block-heading{margin-bottom:14px}.rw-category-picker{display:flex;align-items:center;gap:7px;min-width:0}.rw-category-picker>.lwb-select,.rw-category-picker>.lwb-input{flex:1;min-width:0}.rw-category-picker>.lwb-icon-btn{flex:none;width:28px;height:28px}.rw-task-dot[tabindex]{cursor:help}.rw-task-dot:focus-visible{outline:1px solid currentColor;outline-offset:4px}.lwb-root .rw-course-card .rw-next-lessons:has(.rw-course-semester){height:64px;min-height:64px;max-height:64px;grid-template-rows:18px 18px 18px}.lwb-root .rw-course-card .rw-course-semester{font:inherit;line-height:18px;color:inherit}\n.lwb-root .rw-summary-dashboard .rw-summary-daily-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,max(213px,calc((100% - 36px)/4))),1fr));gap:18px 12px;align-items:start;max-width:1476px}\n.lwb-root .rw-summary-dashboard .rw-summary-daily-grid>.rw-summary-list{width:100%;max-width:360px;min-width:0;box-sizing:border-box;grid-column:auto}\n@media(max-width:700px){.lwb-root .rw-summary-dashboard .rw-summary-daily-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,max(187px,calc((100% - 36px)/4))),1fr))}}\n\n.lwb-root .rw-summary-layout.is-wide>.rw-summary-stats{display:grid;grid-template-columns:minmax(3ch,max-content) max-content;column-gap:8px;row-gap:24px;align-items:baseline;justify-content:start}\n.lwb-root .rw-summary-layout.is-wide>.rw-summary-stats>div{display:contents}\n.lwb-root .rw-summary-layout.is-wide>.rw-summary-stats strong{text-align:right;justify-self:stretch;font-variant-numeric:tabular-nums}\n.lwb-root .rw-summary-layout.is-wide>.rw-summary-stats span{justify-self:start;text-align:left}\n\n/* Group the two agendas instead of distributing them across the page. */\n.lwb-root .rw-home>.rw-day-agenda{width:100%;max-width:860px;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);column-gap:28px;justify-self:start;margin-inline:0}\n.lwb-root .rw-home .rw-day-panel{min-width:0}\n@container workbench-home (max-width:620px){.lwb-root .rw-home>.rw-day-agenda{grid-template-columns:minmax(0,1fr);row-gap:20px;max-width:440px}}\n@media(max-width:700px){.lwb-root .rw-home>.rw-day-agenda{grid-template-columns:minmax(0,1fr);row-gap:20px;max-width:440px}}\n.lwb-root .rw-main-link-row{height:18px;min-height:18px;max-height:18px;line-height:18px;min-width:0;margin-top:5px;font-size:12px}.rw-main-link-row a{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--rw-blue);text-decoration:none}.rw-main-link-row a:hover{text-decoration:underline}.lwb-root .rw-course-card .rw-next-lessons{height:64px;min-height:64px;max-height:64px;grid-template-rows:18px 18px 18px}.lwb-root .rw-next-lessons>.rw-main-link-row{margin:0;font-size:inherit}.lwb-root .rw-home .rw-project.rw-paper-brief{min-height:210px}.lwb-root .rw-home .rw-project.rw-paper-brief.rw-project-active{min-height:225px}.rw-detail-link-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}.rw-detail-link-list li{display:flex;gap:8px;align-items:baseline;min-width:0}.rw-detail-link-list a{overflow-wrap:anywhere;color:var(--rw-secondary);text-decoration:none}.rw-detail-link-list .is-primary a{color:var(--rw-blue);font-weight:550}.rw-primary-tag{font-size:10px;color:var(--rw-secondary);white-space:nowrap}.lwb-root .rw-unified-list .rw-task-actions{opacity:1}.lwb-root .rw-unified-list .rw-task-complete{color:var(--rw-green)}.lwb-root .rw-task-dot.rw-dot-manual{cursor:help}.lwb-root .rw-task-dot.rw-dot-manual:hover{box-shadow:none}\n/* Share spare vertical space above and below the compact content. */\n.lwb-root .rw-home .rw-project.rw-brief-card{display:flex;flex-direction:column;justify-content:center;row-gap:0;height:auto}\n.lwb-root .rw-home .rw-project.rw-brief-card>*{flex-shrink:0}\n.lwb-root .rw-home .rw-project.rw-brief-card>:first-child{margin-top:0}\n.lwb-root .rw-home .rw-project.rw-brief-card>:last-child{margin-bottom:0}\n.lwb-root .rw-home .rw-project.rw-brief-card.rw-project-active{padding-block:15px}\n.lwb-root .rw-home .rw-project.rw-brief-card.rw-project-planned{padding-block:10px}\n\n.lwb-root .rw-integrated-block{position:relative}\n.lwb-root .rw-integrated-block>.rw-block-heading{margin-bottom:0}\n.lwb-root .rw-integrated-content{display:flex;flex-direction:column;gap:24px;padding-top:20px!important}\n.lwb-root .rw-integrated-chart-wrap{min-width:0;width:100%;box-sizing:border-box}\n.lwb-root .rw-integrated-block.is-wide[open] .rw-integrated-chart-wrap{padding-left:150px;min-height:112px}\n.lwb-root .rw-integrated-stats{display:inline-flex;gap:10px;font-size:11px;color:var(--rw-secondary);font-weight:400}\n.lwb-root .rw-integrated-stats>span{display:inline-flex;gap:4px;align-items:baseline}\n.lwb-root .rw-integrated-stats strong{font-size:inherit;font-weight:400}\n.lwb-root .rw-integrated-block.is-wide[open] .rw-integrated-stats{position:absolute;left:0;top:76px;display:grid;grid-template-columns:56px max-content;gap:18px 8px;align-items:baseline}\n.lwb-root .rw-integrated-block.is-wide[open] .rw-integrated-stats>span{display:contents}\n.lwb-root .rw-integrated-block.is-wide[open] .rw-integrated-stats strong{font-size:24px;text-align:right;font-variant-numeric:tabular-nums;color:var(--rw-ink)}\n.lwb-root .rw-integrated-block.is-wide[open] .rw-integrated-stats>span>span{align-self:baseline;font-size:12px}\n.lwb-root .rw-integrated-chart{margin:0;display:block;min-width:0}\n.lwb-root .rw-block-course .rw-integrated-chart{max-width:784px;margin-left:auto}\n.lwb-root .rw-integrated-chart .rw-teach-day{min-height:48px}\n.lwb-root .rw-daily-category-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,max(213px,calc((100% - 36px)/4))),1fr));gap:24px 12px;align-items:start}\n.lwb-root .rw-daily-category{max-width:360px;min-width:0}\n.lwb-root .rw-daily-category>header{display:flex;align-items:center;gap:7px;margin-bottom:8px}\n.lwb-root .rw-daily-category h3{font-size:12px;font-weight:550;margin:0}\n.rw-category-dot{width:6px;height:6px;border-radius:50%;flex:none}.rw-category-count{font-size:10px;color:var(--rw-hint)}\n.lwb-root .rw-daily-category .rw-task-entry{position:relative;gap:6px;align-items:flex-start;padding:8px 0}\n.lwb-root .rw-daily-category .rw-task-line{display:block}\n.lwb-root .rw-daily-category .rw-task-meta{display:block;margin:2px 0 0;font-size:10px}\n.lwb-root .rw-daily-category .rw-task-copy{min-width:0;flex:1}\n.lwb-root .rw-daily-category .rw-task-actions{gap:0;flex:none;align-self:center}\n.lwb-root .rw-daily-category .rw-task-actions .lwb-icon-btn{width:21px;height:23px;padding:3px}\n.lwb-root .rw-daily-category .lwb-item-text{font-size:12px;overflow-wrap:anywhere}\n.lwb-root .rw-static-title{cursor:default}\n.lwb-root:has(.rw-integrated-home) .lwb-head{max-width:1248px}\n@media(max-width:700px){.lwb-root .rw-integrated-content{gap:20px;padding-top:16px!important}.lwb-root .rw-daily-category-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,187px),1fr))}}\n.lwb-root .rw-project-archive,.rw-dialog.rw-project-archive{width:min(940px,calc(100vw - 32px));max-height:calc(100dvh - 40px)}.rw-project-archive .rw-archive-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;column-gap:16px;row-gap:7px;padding:13px 10px;text-align:left;width:100%;box-sizing:border-box}.rw-project-archive .rw-archive-title{min-width:0;max-width:none;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;white-space:normal;overflow:hidden;overflow-wrap:anywhere;font-size:13px;line-height:1.5}.rw-project-archive .rw-archive-status{font-size:11px;white-space:nowrap;line-height:1.8}.rw-archive-facts{grid-column:1/-1;display:flex;flex-direction:column;gap:5px;min-width:0;font-size:12px;line-height:1.55;color:var(--rw-secondary)}.rw-archive-description{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;overflow-wrap:anywhere;white-space:normal}.rw-archive-label{color:var(--rw-hint);font-size:11px}.rw-archive-dates{display:flex;flex-wrap:wrap;gap:3px 18px;font-size:11px;font-variant-numeric:tabular-nums}.rw-archive-dates>span{white-space:nowrap}@media(max-width:600px){.rw-project-archive .rw-archive-row{column-gap:8px;padding:11px 4px}.rw-archive-dates{gap:3px 12px}}\n.lwb-root .rw-block-course .rw-integrated-chart{margin-inline:0}\n.lwb-root .rw-block-course .rw-integrated-chart-wrap{max-width:none;margin-inline:0}\n.lwb-root .rw-block-course.is-wide[open] .rw-integrated-chart-wrap{max-width:none;padding-left:150px;margin-inline:0}\n.lwb-root .rw-block-course.is-wide[open] .rw-integrated-stats{left:0}\n\n.lwb-root .rw-period-header,.lwb-root .rw-period-project{grid-template-columns:minmax(75px,19.5%) minmax(0,1fr)}\n.lwb-root .rw-home .rw-project-grid{align-items:center}\n.lwb-root .rw-home .rw-project-grid>.rw-project.rw-brief-card{align-self:center}\n.lwb-root .rw-home .rw-project.rw-paper-brief{background:color-mix(in srgb,var(--rw-card-color) 5%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-card-color) 40%,var(--dsw-alias-bg-base))}\n.lwb-root .rw-home .rw-project.rw-paper-brief:before{background:var(--rw-card-color);width:34px}\n.lwb-root .rw-home .rw-project.rw-paper-brief.rw-project-active{background:color-mix(in srgb,var(--rw-card-color) 8%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-card-color) 55%,var(--dsw-alias-bg-base))}\n.lwb-root .rw-home .rw-project.rw-paper-brief.rw-project-planned{background:color-mix(in srgb,var(--rw-card-color) 3%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-card-color) 30%,var(--dsw-alias-bg-base))}\n.lwb-root .rw-home .rw-project.rw-paper-brief.rw-project-planned:before{background:color-mix(in srgb,var(--rw-card-color) 60%,var(--dsw-alias-bg-base));width:24px}\n.lwb-root .rw-home .rw-paper-brief .rw-status{color:var(--rw-card-color)}\n@media(max-width:700px){.lwb-root .rw-period-header,.lwb-root .rw-period-project{grid-template-columns:minmax(60px,21%) minmax(0,1fr)}}\n.lwb-root .rw-period-board .rw-period-name>span:last-child{color:var(--rw-secondary);font-weight:400}\n.lwb-root .rw-daily-category .rw-category-dot{width:4px;height:13px;border-radius:2px}\n.lwb-root .rw-daily-category>header{gap:8px;margin-bottom:12px}\n.lwb-root .rw-daily-category .rw-task-entry{border:0;box-shadow:none;padding:7px 0;align-items:center}\n.lwb-root .rw-daily-category .rw-task-line{display:flex;align-items:baseline;gap:7px;min-width:0}\n.lwb-root .rw-daily-category .lwb-item-text{display:block;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}\n.lwb-root .rw-daily-category .rw-task-meta{display:inline;flex:none;margin:0;font-size:9px;white-space:nowrap}\n.lwb-root .rw-daily-category .rw-task-dot{margin-top:0}\n.lwb-root .rw-daily-category .rw-task-actions{align-self:center}\n.lwb-root .rw-calendar-minor-tasks{margin-top:4px;display:grid;gap:2px;min-width:0}\n.lwb-root .rw-calendar-minor-task{display:block;font-size:10px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.76;font-weight:400;background:none;border:0}\n.lwb-root .rw-calendar-minor-task.is-done{text-decoration:line-through;opacity:.5}\n.lwb-root .rw-calendar-minor-more{font-size:9px;line-height:1.2;color:var(--rw-hint);cursor:help}\n.rw-sort-control{display:inline-flex;align-items:center}.rw-sort-popover{position:fixed;margin:0;padding:6px;width:176px;max-height:80vh;overflow:auto;border:1px solid var(--rw-soft-rule);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--rw-ink);box-shadow:0 5px 18px #00000012}.rw-sort-popover button{display:block;width:100%;border:0;background:none;color:var(--rw-secondary);font:inherit;font-size:12px;text-align:left;padding:7px 9px;border-radius:4px;cursor:pointer}.rw-sort-popover button:hover,.rw-sort-popover button.is-selected{background:var(--dsw-alias-bg-layer-2);color:var(--rw-ink)}.rw-dragging{opacity:.45}.lwb-root .rw-drop-target,.rw-project-archive .rw-drop-target{outline:2px solid var(--rw-blue);outline-offset:3px}.rw-daily-category>header{cursor:grab}.rw-project[draggable=true]{cursor:grab}.rw-project[draggable=true]:active{cursor:grabbing}\n.lwb-root .rw-teaching-calendar .rw-calendar-controls{display:flex;justify-content:flex-start;align-items:center;gap:3px;width:fit-content;max-width:100%;margin-right:auto;padding:2px 3px;border:0;border-radius:6px;background:color-mix(in srgb,var(--rw-ink) 3%,var(--dsw-alias-bg-base))}.lwb-root .rw-calendar-controls .rw-month-picker{width:138px;min-width:0;margin:0 5px 0 0;padding:3px 5px;background:transparent;border:0}.lwb-root .rw-calendar-controls .lwb-icon-btn{width:26px;height:26px;padding:4px;border:0;background:transparent;flex:none}.lwb-root .rw-calendar-controls .lwb-icon-btn:hover{background:color-mix(in srgb,var(--rw-ink) 7%,var(--dsw-alias-bg-base))}\n.lwb-root .rw-course-card{border-color:color-mix(in srgb,var(--rw-project-color) 40%,var(--dsw-alias-bg-base));background:color-mix(in srgb,var(--rw-project-color) 5%,var(--dsw-alias-bg-base))}.lwb-root .rw-course-card::before{background:var(--rw-project-color)}.lwb-root .rw-course-card.rw-project-active{border-color:color-mix(in srgb,var(--rw-project-color) 55%,var(--dsw-alias-bg-base));background:color-mix(in srgb,var(--rw-project-color) 8%,var(--dsw-alias-bg-base))}.lwb-root .rw-course-card.rw-project-planned{border-color:color-mix(in srgb,var(--rw-project-color) 30%,var(--dsw-alias-bg-base));background:color-mix(in srgb,var(--rw-project-color) 3%,var(--dsw-alias-bg-base))}.lwb-root .rw-course-card .rw-course-progress{color:var(--rw-secondary)}\n.lwb-root .rw-daily-category header .rw-category-action{width:21px;height:21px;padding:3px;margin-left:0;border:0;background:transparent;color:var(--rw-secondary);flex:none}.lwb-root .rw-daily-category header .rw-category-action svg{width:14px;height:14px}.lwb-root .rw-daily-category header .rw-category-action:hover{background:var(--dsw-alias-bg-layer-2);color:var(--rw-ink)}\n.lwb-root .rw-history-columns{width:min(760px,calc(100vw - 32px));padding:16px;box-sizing:border-box}.rw-history-columns:popover-open{display:grid;grid-template-columns:1.15fr 1fr;gap:16px;align-items:start}.rw-history-column{min-width:0;padding:14px;border-radius:9px}.rw-history-done{background:color-mix(in srgb,var(--rw-blue) 6%,var(--dsw-alias-bg-base));border:1px solid var(--rw-soft-rule)}.rw-history-deleted{padding:11px;background:color-mix(in srgb,var(--rw-ink) 2%,var(--dsw-alias-bg-base));color:var(--rw-secondary)}.rw-history-column .lwb-pane-title{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:13px}.rw-history-column .lwb-item{display:flex;align-items:center;gap:8px;padding:7px 0}.rw-history-column .lwb-item-text,.rw-deleted-copy{flex:1;min-width:0;overflow-wrap:anywhere}.rw-history-deleted .lwb-item{font-size:11px}.rw-deleted-copy small{display:block;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px}.rw-history-column .lwb-icon-btn{flex:none;width:23px;height:23px;padding:3px}.rw-history-column .lwb-icon-btn svg{width:15px;height:15px}@media(max-width:560px){.rw-history-columns:popover-open{grid-template-columns:1fr}}\n.lwb-root .rw-signature{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;font-family:inherit;font-size:17px;font-weight:500;letter-spacing:-.02em;color:var(--rw-secondary);margin-right:12px}.rw-signature-fd{color:color-mix(in srgb,#a61932 70%,var(--rw-secondary))}.rw-signature-math{color:color-mix(in srgb,#164b86 76%,var(--rw-secondary))}.rw-signature img{width:24px;height:24px;object-fit:contain;flex:none}@media(max-width:650px){.lwb-root .rw-signature{font-size:13px;gap:4px;margin-right:4px}.rw-signature img{width:20px;height:20px}.lwb-root .lwb-head{flex-wrap:wrap}}\n.lwb-root .rw-signature{font-size:12px;font-weight:400;letter-spacing:.015em;line-height:1.4;gap:6px;margin-right:10px;color:var(--rw-secondary);font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}.rw-signature-at{opacity:.55;padding:0 1px}.rw-signature-fd{color:color-mix(in srgb,#a61932 60%,var(--rw-secondary))}.rw-signature-math{color:color-mix(in srgb,#164b86 65%,var(--rw-secondary))}.rw-signature img{width:18px;height:18px;opacity:.85}@media(max-width:650px){.lwb-root .rw-signature{font-size:11px;gap:5px;margin-right:4px}.rw-signature img{width:16px;height:16px}}\n.lwb-root .rw-signature{font-size:14px;letter-spacing:0}.rw-signature-at{padding:0;letter-spacing:-.04em}.rw-signature img{width:19px;height:19px}@media(max-width:650px){.lwb-root .rw-signature{font-size:13px}.rw-signature img{width:18px;height:18px}}\n.lwb-root .rw-signature{font-family:\"Avenir Next\",\"Avenir\",\"IBM Plex Sans\",\"Segoe UI\",sans-serif;font-weight:500;letter-spacing:0}.rw-signature-at{padding:0;margin:0 -.02em;letter-spacing:-.04em}\n.lwb-root .rw-daily-category>header{position:relative;padding-bottom:10px;margin-bottom:9px}.lwb-root .rw-daily-category>header::after{content:\"\";position:absolute;left:0;bottom:0;width:100%;height:1px;background:color-mix(in srgb,var(--rw-ink) 16%,transparent)}.lwb-root .rw-daily-category .rw-task-entry{border-bottom:0}\n.lwb-root .rw-signature{margin-right:0;margin-left:auto;justify-content:flex-end;text-align:right}.lwb-root .rw-logo-refresh{display:inline-flex;align-items:center;justify-content:center;flex:none;padding:3px;border:0;border-radius:4px;background:transparent;cursor:pointer;color:inherit}.lwb-root .rw-logo-refresh:hover{background:color-mix(in srgb,var(--rw-ink) 5%,transparent)}.rw-logo-refresh:focus-visible{outline:1px solid currentColor;outline-offset:2px}.rw-logo-refresh:disabled{opacity:.45;cursor:default}.rw-logo-refresh img{display:block}\n.lwb-root .rw-daily-category .rw-unified-list{min-height:36px}.rw-task-entry[draggable=\"true\"]{cursor:grab}.rw-task-entry.rw-drop-target{box-shadow:inset 0 2px var(--rw-blue)}\n.lwb-root .rw-signature-link{color:inherit;font:inherit;text-decoration:none;border-radius:3px;cursor:pointer}.rw-signature-link:hover{opacity:.8}.rw-signature-link:focus-visible{outline:1px solid currentColor;outline-offset:3px}\n.lwb-root .rw-project-tools{display:inline-flex;align-items:center;gap:2px;flex:none}.lwb-root .rw-project-tools .lwb-icon-btn{width:25px;height:25px;min-width:25px;padding:4px;box-sizing:border-box;border:0;border-radius:5px;background:transparent;color:var(--rw-secondary)}.lwb-root .rw-project-tools .lwb-icon-btn svg{width:16px;height:16px}.lwb-root .rw-project-tools .lwb-icon-btn:hover{border:0;background:var(--dsw-alias-bg-layer-2);color:var(--rw-ink)}\n.lwb-root .rw-home>.rw-day-agenda{width:100%;max-width:732px;grid-template-columns:repeat(auto-fit,minmax(min(100%,187px),1fr));gap:20px 12px;align-items:center;margin-inline:0}.lwb-root .rw-home>.rw-day-agenda>.rw-day-panel{min-width:0;max-width:360px;width:100%;box-sizing:border-box}.lwb-root .rw-home>.rw-day-agenda .rw-agenda-copy{min-width:0;overflow-wrap:anywhere}\n.lwb-root .rw-daily-category>header{padding-bottom:8px;margin-bottom:3px}.lwb-root .rw-daily-category .rw-unified-list{margin-top:0;padding-top:0}.lwb-root .rw-daily-category .rw-unified-list>.rw-task-entry:first-child{padding-top:5px}\n.lwb-root .rw-teaching-calendar .rw-teach-day{height:clamp(64px,7vw,90px);min-height:0;aspect-ratio:auto;overflow:hidden;padding:4px;box-sizing:border-box}.rw-day-scroll{display:grid;grid-template-columns:22px minmax(0,1fr);gap:4px;align-content:start;align-items:start;height:100%;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin}.lwb-root .rw-day-scroll .rw-teach-date{margin:0;width:22px;height:22px;padding:0;line-height:22px}.rw-day-courses{display:flex;flex-direction:column;gap:3px;min-width:0}.lwb-root .rw-day-courses .rw-teach-event{width:100%;min-width:0;margin:0;padding:2px 3px;display:flex;flex-wrap:nowrap;gap:3px;box-sizing:border-box;line-height:16px}.lwb-root .rw-day-courses .rw-teach-event-name{width:auto;min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lwb-root .rw-day-scroll .rw-calendar-minor-tasks{grid-column:1/-1;margin:0;overflow:visible;max-height:none}.rw-day-scroll::-webkit-scrollbar{width:3px}.rw-day-scroll::-webkit-scrollbar-thumb{background:var(--rw-soft-rule);border-radius:3px}\n.lwb-root .rw-teaching-calendar .rw-teach-day{height:90px;padding:4px}.lwb-root .rw-day-scroll{height:100%;display:grid;grid-template-columns:22px minmax(0,1fr);grid-template-rows:22px 47px;gap:4px;overflow:hidden;position:relative}.lwb-root .rw-day-scroll .rw-teach-date{grid-column:1;grid-row:1}.lwb-root .rw-day-scroll .rw-calendar-minor-tasks{grid-column:2;grid-row:1;height:22px;max-height:22px;overflow-y:auto;overflow-x:hidden;display:block;padding:0;scrollbar-width:thin;scroll-snap-type:y proximity}.lwb-root .rw-day-scroll .rw-calendar-minor-task{display:block;height:22px;line-height:22px;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;scroll-snap-align:start}.lwb-root .rw-day-courses{grid-column:1/-1;grid-row:2;height:47px;min-height:47px;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:3px;scrollbar-width:thin;scroll-snap-type:y proximity}.lwb-root .rw-day-courses .rw-teach-event{flex:none;height:22px;min-height:22px;width:100%;scroll-snap-align:start}.lwb-root .rw-day-courses.has-more{border-right:2px dotted color-mix(in srgb,var(--rw-ink) 23%,transparent);padding-right:3px}.lwb-root .rw-calendar-minor-tasks.has-more{border-right:2px dotted color-mix(in srgb,var(--rw-ink) 20%,transparent);padding-right:3px}.rw-day-courses::-webkit-scrollbar,.rw-calendar-minor-tasks::-webkit-scrollbar{width:3px}.rw-day-courses::-webkit-scrollbar-thumb,.rw-calendar-minor-tasks::-webkit-scrollbar-thumb{background:var(--rw-soft-rule);border-radius:3px}\n.lwb-root .rw-teaching-calendar .rw-teach-day{height:68px;min-height:0;padding:3px}.lwb-root .rw-day-scroll{grid-template-rows:18px 40px;gap:2px}.lwb-root .rw-day-scroll .rw-teach-date{height:18px;line-height:18px}.lwb-root .rw-day-scroll .rw-calendar-minor-tasks{height:18px;max-height:18px}.lwb-root .rw-day-scroll .rw-calendar-minor-task{height:18px;line-height:18px}.lwb-root .rw-day-courses{height:40px;min-height:40px;gap:2px}.lwb-root .rw-day-courses .rw-teach-event{height:19px;min-height:19px;line-height:15px;padding:1px 3px}\n.lwb-root .rw-teaching-calendar .rw-teach-day{height:61px;padding:2px}.lwb-root .rw-day-scroll{grid-template-rows:17px 36px;gap:2px}.lwb-root .rw-day-scroll .rw-teach-date{height:17px;line-height:17px}.lwb-root .rw-day-scroll .rw-calendar-minor-tasks{height:17px;max-height:17px}.lwb-root .rw-day-scroll .rw-calendar-minor-task{height:17px;line-height:17px}.lwb-root .rw-day-courses{height:36px;min-height:36px;gap:2px}.lwb-root .rw-day-courses .rw-teach-event{height:17px;min-height:17px;line-height:15px;padding:0 3px}\n.lwb-root .lwb-head.rw-top-header{z-index:20;max-width:none;margin:0;padding:4px 0;box-sizing:border-box;flex-wrap:nowrap;background:var(--dsw-alias-bg-base)}.lwb-root.rw-header-docked .lwb-body{padding-top:12px}.lwb-root .rw-top-header .lwb-title{flex:none}\n.lwb-root .lwb-head.rw-top-header{padding:0;min-height:0;align-items:center}.lwb-root .rw-top-header .lwb-title{margin-block:0;line-height:1.1}.lwb-root .rw-top-header .rw-home-button{margin:0;padding-block:0;line-height:1.1}\n/* One shared section rhythm; task rows remain compact. */\n.lwb-root .rw-integrated-home{--rw-section-content-gap:14.4px}\n.lwb-root .rw-integrated-home .rw-block>.rw-block-heading{margin-bottom:0;padding-bottom:0}\n.lwb-root .rw-integrated-home .rw-integrated-content{padding-top:var(--rw-section-content-gap)!important;row-gap:var(--rw-section-content-gap)}\n.lwb-root .rw-integrated-home .rw-unified-daily>.rw-daily-category-grid{margin-top:0;padding-top:var(--rw-section-content-gap)}\n.lwb-root .rw-integrated-content>.rw-integrated-chart-wrap,.lwb-root .rw-integrated-content>.rw-project-grid,.lwb-root .rw-integrated-content>.rw-course-grid{margin-block:0}\n\n/* Reduce only the space between adjacent task rows to 40%. */\n.lwb-root .rw-daily-category .rw-unified-list>.rw-task-entry:not(:last-child){padding-bottom:2.24px}\n.lwb-root .rw-daily-category .rw-unified-list>.rw-task-entry+.rw-task-entry{padding-top:2.24px}\n\n/* Equal spacing between all four top-level sections, 80% of the agenda gap. */\n.lwb-root .rw-home.rw-integrated-home{row-gap:calc(var(--rw-section-gap) * .8)}\n.lwb-root .rw-home.rw-integrated-home>.rw-block,.lwb-root .rw-home.rw-integrated-home>.rw-day-agenda{margin-block:0}\n\n.lwb-root .rw-day-courses .rw-teach-event{cursor:default;text-align:left;font-family:inherit}\n\n/* Quiet tinted section headers, with compact padding and no added borders. */\n.lwb-root .rw-integrated-home>.rw-block-paper{--rw-heading-tint:var(--rw-blue,#527e96)}\n.lwb-root .rw-integrated-home>.rw-block-course{--rw-heading-tint:var(--rw-green,#43847b)}\n.lwb-root .rw-integrated-home>.rw-unified-daily{--rw-heading-tint:#8271a3}\n.lwb-root .rw-home.rw-integrated-home>.rw-block>.rw-block-heading{background:color-mix(in srgb,var(--rw-heading-tint) 7%,var(--dsw-alias-bg-base));padding:5px 9px;min-height:30px;box-sizing:border-box;border:0;border-radius:5px;box-shadow:none;margin-block:0}\n\n/* Fit the tint to the heading text rather than oversized action controls. */\n.lwb-root .rw-home.rw-integrated-home>.rw-block>.rw-block-heading{padding-block:2px;min-height:0}\n.lwb-root .rw-home.rw-integrated-home>.rw-block>.rw-block-heading h2{line-height:1.3}\n.lwb-root .rw-home.rw-integrated-home>.rw-block>.rw-block-heading .lwb-icon-btn{height:22px;min-height:0;padding-block:2px}\n\n/* Numeric month and quiet legend share one compact calendar toolbar. */\n.lwb-root .rw-summary-dashboard .rw-teaching-calendar .rw-calendar-head{width:100%;box-sizing:border-box;background:none;padding:0;margin:0 0 4.8px;gap:2px;font-size:10px;color:var(--rw-hint);flex-wrap:wrap}\n.lwb-root .rw-calendar-head .rw-numeric-month{position:relative;display:inline-flex;align-items:center;flex:none;height:22px;margin-right:2px;font:inherit;font-weight:400;color:inherit;cursor:pointer}\n.lwb-root .rw-summary-dashboard .rw-calendar-head .rw-numeric-month .rw-month-picker{position:absolute;inset:0;width:100%;max-width:none;min-width:0;height:100%;min-height:0;margin:0;padding:0;opacity:0;cursor:pointer}\n.lwb-root .rw-numeric-month:focus-within{outline:1px solid var(--rw-soft-rule);outline-offset:2px;border-radius:3px}\n.lwb-root .rw-calendar-head.rw-calendar-controls .lwb-icon-btn{width:22px;height:22px;padding:3px;color:var(--rw-hint)}\n.lwb-root .rw-calendar-head.rw-calendar-controls .lwb-icon-btn svg{width:15px;height:15px}\n.lwb-root .rw-summary-dashboard .rw-calendar-head .rw-teach-status-key{margin-left:auto;padding:0;gap:9px;font-size:10px;line-height:22px;color:var(--rw-hint);flex-wrap:nowrap}\n.lwb-root .rw-calendar-head .rw-teach-status-key>span{white-space:nowrap}\n\n/* Scale card geometry together to 85%, without scaling typography. */\n.lwb-root .rw-home .rw-project-grid,.lwb-root .rw-home .rw-course-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,max(181px,calc((100% - 36px)/4))),1fr));align-items:center}\n.lwb-root .rw-home .rw-project.rw-brief-card{max-width:306px;min-height:153px;aspect-ratio:2.1 / 1;padding:8.5px 10.2px;border-radius:10.2px 10.2px 10.2px 4.25px;align-self:center}\n.lwb-root .rw-home .rw-project.rw-paper-brief{min-height:178.5px}\n.lwb-root .rw-home .rw-project.rw-paper-brief.rw-project-active{min-height:191.25px}\n.lwb-root .rw-home .rw-project.rw-brief-card.rw-project-active{padding:12.75px 13.6px}\n.lwb-root .rw-home .rw-project.rw-brief-card.rw-project-planned{padding:8.5px 10.2px}\n\n/* Single-row compact milestones; cards must grow rather than overflow. */\n.lwb-root .rw-home .rw-project.rw-brief-card{aspect-ratio:auto;height:auto;justify-content:flex-start}\n.lwb-root .rw-project.rw-paper-brief .rw-compact-time-axis{margin-right:0}\n.lwb-root .rw-paper-brief .rw-compact-time-rows{display:block;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;padding-block:2px}\n.lwb-root .rw-paper-brief .rw-compact-node{grid-template-rows:18px 12px 15px;gap:1px}\n.lwb-root .rw-paper-brief .rw-compact-node-dot{width:10px;height:10px;margin:1px 0;outline-width:2px}\n.lwb-root .rw-paper-brief .rw-compact-node::after{top:24px;height:2px}\n.lwb-root .rw-paper-brief .rw-compact-node-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px}\n.lwb-root .rw-home .rw-project.rw-brief-card .rw-card-meta{margin-bottom:5px}\n.lwb-root .rw-home .rw-project.rw-brief-card .rw-brief-time{margin-top:5px}\n.lwb-root .rw-home .rw-project.rw-brief-card .rw-main-link-row{margin-top:5px}\n.lwb-root .rw-home .rw-course-card .rw-next-lessons>.rw-main-link-row{margin-top:0}\n\n/* Card actions use the section toolbar language at a smaller scale. */\n.lwb-root .rw-brief-card .rw-card-state-actions{gap:1px}\n.lwb-root .rw-brief-card .rw-card-state-actions>.rw-status{margin-right:3px}\n.lwb-root .rw-brief-card .rw-action-icon{width:21px;min-width:21px;height:20px;min-height:0;padding:3px;border:0;border-radius:4px;background:transparent;color:var(--rw-secondary);box-shadow:none}\n.lwb-root .rw-brief-card .rw-action-icon svg,.lwb-root .rw-brief-card .rw-action-icon .lwb-svg{width:14px;height:14px;stroke-width:1.7;flex:none}\n.lwb-root .rw-brief-card .rw-action-icon:hover{background:var(--dsw-alias-bg-layer-2);color:var(--rw-ink)}\n\n/* Small status chips mark timeline groups without tall separator rows. */\n.lwb-root .rw-summary-dashboard .rw-period-board>.rw-gantt-group-title{padding:1.2px 0 .6px;margin:0;font-size:10px;line-height:16px}\n.lwb-root .rw-period-board .rw-timeline-status{display:inline-flex;align-items:center;padding:0 5px;font-size:10px;line-height:15px;font-weight:500;border:1px solid color-mix(in srgb,var(--rw-ink) 12%,transparent);border-radius:3px;color:var(--rw-secondary);background:color-mix(in srgb,var(--rw-ink) 3%,var(--dsw-alias-bg-base))}\n.lwb-root .rw-period-board .rw-timeline-status-active{color:var(--rw-blue);border-color:color-mix(in srgb,var(--rw-blue) 22%,transparent);background:color-mix(in srgb,var(--rw-blue) 8%,var(--dsw-alias-bg-base))}\n.lwb-root .rw-period-board .rw-timeline-status-planned{color:color-mix(in srgb,#8271a3 75%,var(--rw-secondary));border-color:color-mix(in srgb,#8271a3 18%,transparent);background:color-mix(in srgb,#8271a3 5%,var(--dsw-alias-bg-base))}\n\n/* Month headers use the same compact vertical inset as status groups. */\n.lwb-root .rw-summary-dashboard .rw-period-board>.rw-period-header{margin:0;padding:1.2px 0 .6px}\n.lwb-root .rw-summary-dashboard .rw-period-header .rw-period-scale{height:auto;min-height:0;line-height:18px;padding:0;margin:0}\n.lwb-root .rw-summary-dashboard .rw-period-header .rw-period-date,.lwb-root .rw-summary-dashboard .rw-period-header .rw-period-ticks{line-height:18px;height:18px;padding-block:0;margin-block:0}\n\n/* Daily categories share exactly the card grid's responsive column geometry. */\n.lwb-root .rw-home .rw-daily-category-grid{width:100%;max-width:1476px;box-sizing:border-box;grid-template-columns:repeat(auto-fill,minmax(min(100%,max(181px,calc((100% - 36px)/4))),1fr));column-gap:12px}\n.lwb-root .rw-home .rw-daily-category-grid>.rw-daily-category{width:100%;max-width:306px;min-width:0;box-sizing:border-box}\n\n.rw-link-picker{padding:8px;border:1px solid var(--rw-soft-rule);border-radius:6px;margin-top:6px}.rw-link-picker-list{max-height:220px;overflow:auto}.rw-link-picker .rw-destination-option{width:100%;text-align:left}.rw-link-picker .rw-destination-option>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}.rw-detail-destination{display:flex;gap:8px;align-items:center;margin:5px 0}\n"
    const WEATHER_CSS = ".rw-weather{display:inline-flex;align-items:center;gap:5px;margin-left:4px;color:var(--rw-secondary);text-decoration:none;font-size:12px;line-height:1;white-space:nowrap;font-variant-numeric:tabular-nums}.rw-weather svg{color:var(--rw-blue);flex:none}.rw-weather-unit{font-size:10px;margin-left:2px;color:var(--rw-hint)}.rw-weather:hover{color:var(--rw-ink)}.rw-weather:focus-visible{outline:1px solid var(--rw-blue);outline-offset:4px;border-radius:3px}"
    const STATUS_TONE_CSS = ".lwb-root .rw-project-active{background:color-mix(in srgb,var(--rw-blue) 4%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-blue) 55%,var(--dsw-alias-bg-base));padding:15px 16px}.lwb-root .rw-project-active .rw-project-title{font-size:14px;font-weight:600;color:var(--rw-ink)}.lwb-root .rw-project-planned{background:color-mix(in srgb,var(--rw-ink) 2%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-ink) 26%,var(--dsw-alias-bg-base));padding:10px 12px}.lwb-root .rw-project-planned .rw-project-title{font-size:13px;font-weight:500;color:var(--rw-secondary)}.lwb-root .rw-project-planned .rw-background,.lwb-root .rw-project-planned .rw-next p,.lwb-root .rw-project-planned .rw-course-meta dd{font-size:11px;color:var(--rw-secondary)}.lwb-root .rw-project-planned .rw-card-meta{margin-bottom:4px}.lwb-root .rw-project-planned .rw-card-bottom{padding-top:6px;margin-top:7px}.lwb-root .rw-project-planned .rw-status{background:transparent;border-color:var(--rw-soft-rule);color:var(--rw-secondary)}.lwb-root .rw-project-planned:hover{border-color:var(--rw-line)}.lwb-root .rw-day-agenda{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:center}.lwb-root .rw-day-today{background:color-mix(in srgb,var(--rw-blue) 11%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-blue) 50%,var(--dsw-alias-bg-base));padding:15px 16px}.lwb-root .rw-day-today h2{font-size:14px}.lwb-root .rw-day-tomorrow{background:color-mix(in srgb,var(--rw-ink) 2%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-ink) 22%,var(--dsw-alias-bg-base));padding:11px 13px}.lwb-root .rw-day-tomorrow h2{font-size:12px;color:var(--rw-secondary)}.lwb-root .rw-day-tomorrow .rw-agenda-title{font-size:11px;color:var(--rw-secondary)}.lwb-root .rw-day-tomorrow li{padding-top:5px;padding-bottom:5px}.lwb-root .rw-day-tomorrow .rw-agenda-detail{font-size:10px}@media(max-width:700px){.lwb-root .rw-day-agenda{grid-template-columns:minmax(0,1fr)}}"
    const STARTUP_CSS = ".rw-sidebar-entry{display:flex;align-items:center;gap:8px;width:100%;height:36px;padding:6px 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:14px;cursor:pointer}.rw-sidebar-entry:hover{background:var(--dsw-alias-bg-layer-2)}"
    const NEAR_POPOVER_CSS = ".lwb-root .rw-near-popover{position:fixed!important;inset:auto;right:auto!important;bottom:auto!important;margin:0!important;position-anchor:auto!important;position-area:none!important;transform:none!important;overflow:auto;box-sizing:border-box}.lwb-root .rw-recent-popover.rw-near-popover{width:min(440px,calc(100vw - 20px))}"
    const ARCHIVE_CSS = ".rw-project-archive{width:min(680px,calc(100vw - 32px))}.rw-archive-body{padding:14px 20px 20px;overflow:auto}.rw-archive-body>.lwb-input{width:100%;box-sizing:border-box;font-size:12px}.rw-archive-list{margin-top:10px;max-height:55vh;overflow:auto}.rw-archive-row{display:flex;align-items:baseline;gap:12px;width:100%;padding:11px 3px;text-align:left;border:0;border-bottom:1px solid var(--rw-soft-rule);background:transparent;color:var(--rw-ink);font:inherit;font-size:12px;cursor:pointer}.rw-archive-row:hover{background:var(--dsw-alias-bg-layer-2)}.rw-archive-title{flex:1;min-width:0;overflow-wrap:anywhere}.rw-archive-status,.rw-archive-date{font-size:10px;color:var(--rw-secondary);white-space:nowrap}@media(max-width:500px){.rw-archive-row{flex-wrap:wrap;gap:4px 10px}.rw-archive-title{flex-basis:100%}}"
    const POLISH_CSS = "/* Shared visual language: host typography, quiet colour, content before controls. */\n.lwb-root,.rw-dialog{--rw-ink:var(--dsw-alias-label-primary);--rw-secondary:color-mix(in srgb,var(--rw-ink) 66%,var(--dsw-alias-bg-base));--rw-hint:color-mix(in srgb,var(--rw-ink) 48%,var(--dsw-alias-bg-base));--rw-soft-rule:color-mix(in srgb,var(--rw-ink) 17%,var(--dsw-alias-bg-base));--rw-line:color-mix(in srgb,var(--rw-ink) 38%,var(--dsw-alias-bg-base));--rw-rule:var(--rw-soft-rule);--rw-blue:color-mix(in srgb,#4d709b 78%,var(--rw-ink));--rw-green:color-mix(in srgb,#4c8278 78%,var(--rw-ink));--rw-violet:color-mix(in srgb,#83729b 78%,var(--rw-ink));--rw-warm:color-mix(in srgb,#977844 78%,var(--rw-ink));font-size:13px;letter-spacing:normal;line-height:1.55}\n.lwb-root .lwb-head{padding:14px 24px;gap:10px;min-height:30px}.lwb-root .lwb-title{font-size:17px;font-weight:600;margin:0}.rw-home-button{display:inline-flex;align-items:center;gap:9px;background:none;border:0;padding:0;color:inherit;font:inherit;cursor:pointer}.rw-home-button:focus-visible{outline:2px solid var(--rw-blue);outline-offset:5px;border-radius:4px}.lwb-root .lwb-body{padding:10px 24px 28px}.lwb-root .rw-header-actions{gap:5px}\n.lwb-root .lwb-icon-btn,.rw-dialog .lwb-icon-btn,.lwb-root .rw-history-trigger,.lwb-root .rw-calendar-sync{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;min-height:0;padding:5px;border:0;border-radius:6px;background:transparent;box-shadow:none;color:var(--rw-secondary);cursor:pointer}.lwb-root .lwb-icon-btn:hover,.rw-dialog .lwb-icon-btn:hover,.lwb-root .rw-history-trigger:hover,.lwb-root .rw-calendar-sync:hover{background:var(--dsw-alias-bg-layer-2);color:var(--rw-ink)}.lwb-root .lwb-icon-btn svg,.rw-dialog .lwb-icon-btn svg{width:17px;height:17px;stroke-width:1.6}.lwb-root button:focus-visible,.rw-dialog button:focus-visible{outline:2px solid var(--rw-blue);outline-offset:2px}.lwb-root button:disabled,.rw-dialog button:disabled{opacity:.4;cursor:default}\n.lwb-root .lwb-btn,.rw-dialog .lwb-btn{font-size:12px;min-height:30px;padding:5px 10px;border-radius:6px;border-width:1px;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base));box-shadow:none;transform:none}.lwb-root .lwb-btn-primary,.rw-dialog .lwb-btn-primary{background:var(--rw-blue);border-color:var(--rw-blue);color:var(--dsw-alias-bg-base)}.lwb-root .rw-text-button,.rw-dialog .rw-text-button{font-size:11px;color:var(--rw-secondary)}\n.lwb-root .rw-block{margin:22px 0 0;padding:0;border:0;background:none;border-radius:0;box-shadow:none}.lwb-root .rw-block-heading,.lwb-root .rw-daily>summary{gap:8px;padding:5px 0 10px;min-height:24px}.lwb-root .rw-block-heading h2,.lwb-root .rw-daily>summary h2{font-size:13px;font-weight:600}.lwb-root .rw-block-heading:before{font-size:15px;font-weight:400;color:var(--rw-secondary)}.lwb-root .rw-block-meta{font-size:10px;color:var(--rw-secondary)}.lwb-root .rw-block-content{padding:12px 0 0}.lwb-root .rw-section-title{margin:0 0 7px;gap:6px}.lwb-root .rw-section-title h3{font-size:11px;font-weight:500;color:var(--rw-secondary)}.lwb-root .rw-count{font-size:10px;color:var(--rw-hint)}.lwb-root .rw-group{margin:0 0 14px}.lwb-root .rw-progress-log{padding-top:10px;margin-top:10px}.rw-update{font-size:12px}.rw-update time{font-size:10px;color:var(--rw-secondary)}.lwb-root .rw-recent{border:0;margin-top:10px}.lwb-root .rw-recent>summary{font-size:11px;color:var(--rw-secondary)}\n.lwb-root .rw-project{border:1px solid var(--rw-line);border-radius:9px;padding:13px 14px;background:var(--dsw-alias-bg-base);box-shadow:none}.lwb-root .rw-project:hover{box-shadow:none;border-color:var(--rw-line)}.lwb-root .rw-project-title{font-size:14px;font-weight:550;line-height:1.5;letter-spacing:normal}.lwb-root .rw-card-meta{margin-bottom:6px}.lwb-root .rw-status{border:1px solid transparent;background:var(--dsw-alias-bg-layer-2);font-size:10px;font-weight:500;padding:1px 6px;line-height:1.6;text-decoration:none;color:var(--rw-secondary)}.lwb-root .rw-status-active{color:var(--rw-blue);background:color-mix(in srgb,var(--rw-blue) 9%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-blue) 24%,var(--dsw-alias-bg-base))}.lwb-root .rw-status-completed{color:var(--rw-green);background:color-mix(in srgb,var(--rw-green) 8%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-green) 24%,var(--dsw-alias-bg-base))}.lwb-root .rw-status-paused{color:var(--rw-warm);background:color-mix(in srgb,var(--rw-warm) 8%,var(--dsw-alias-bg-base))}.lwb-root .rw-card-state-actions{gap:4px}.lwb-root .rw-card-state-actions .lwb-icon-btn{width:24px;height:24px;padding:4px}.lwb-root .rw-card-state-actions .lwb-icon-btn svg{width:15px;height:15px}.rw-background{font-size:12px;line-height:1.6;margin:6px 0 0;color:var(--rw-secondary)}.lwb-root .rw-person{border:0;background:none;padding:0}.rw-person-name{font-size:11px;font-weight:500}.rw-person-institution,.rw-person-email,.rw-person-notes{font-size:10px;color:var(--rw-secondary)}.lwb-root .rw-people{gap:6px;margin-top:7px}.rw-stage{font-size:11px;color:var(--rw-secondary)}.lwb-root .rw-next>span,.lwb-root .rw-card-caption{font-size:10px;color:var(--rw-secondary);font-weight:400}.lwb-root .rw-next p{font-size:12px;margin:3px 0 0}.lwb-root .rw-card-bottom{font-size:10px;padding-top:9px;margin-top:10px}.lwb-root .rw-card-links a{color:var(--rw-blue);font-size:11px;text-decoration:none}.lwb-root .rw-card-links a:hover{text-decoration:underline}.rw-course-meta dt{font-size:10px;color:var(--rw-secondary)}.rw-course-meta dd{font-size:12px}.lwb-root .rw-course-plan-preview,.lwb-root .rw-course-upcoming{font-size:12px}.rw-course-square{border-radius:2px}\n@container project-card (min-width:620px){.rw-card-layout.rw-card-no-action{grid-template-columns:minmax(0,1.2fr) minmax(220px,1fr)}.rw-card-layout.rw-card-no-action .rw-card-schedule{grid-column:2}}\n.lwb-root .rw-compact-node time{font-size:11px;font-weight:500;color:var(--rw-secondary)}.lwb-root .rw-compact-node-label{font-size:10px;color:var(--rw-secondary)}.rw-compact-node-dot{width:12px;height:12px;border-width:1.5px;margin:3px 0}.rw-node-actual .rw-compact-node-dot{background:var(--rw-blue);border-color:var(--rw-blue)}.rw-compact-node.rw-node-elapsed::after{height:3px;background:color-mix(in srgb,var(--rw-blue) 65%,var(--dsw-alias-bg-base))}.rw-compact-time-head{margin-bottom:7px}.rw-compact-years{color:var(--rw-hint)}\n.lwb-root .rw-day-agenda{gap:12px;margin-bottom:22px}.lwb-root .rw-day-panel{padding:13px 15px;border-radius:8px;border:1px solid var(--rw-soft-rule)}.lwb-root .rw-day-today{background:color-mix(in srgb,var(--rw-blue) 7%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-blue) 30%,var(--dsw-alias-bg-base))}.lwb-root .rw-day-tomorrow{background:color-mix(in srgb,var(--rw-blue) 2%,var(--dsw-alias-bg-base))}.lwb-root .rw-day-panel>header{margin-bottom:5px}.lwb-root .rw-day-today h2{font-size:13px;font-weight:600;color:var(--rw-ink)}.lwb-root .rw-day-tomorrow h2{font-size:12px;color:var(--rw-secondary)}.lwb-root .rw-day-panel>header>time{font-size:10px;color:var(--rw-secondary)}.rw-agenda-list>li{gap:8px;padding:7px 0}.rw-agenda-list>li+li{border:0}.rw-agenda-kind{display:flex;align-items:center;margin-top:3px;color:var(--rw-secondary);line-height:1}.rw-agenda-research{color:var(--rw-blue)}.rw-agenda-lesson{color:var(--rw-violet)}.rw-agenda-calendar{color:var(--rw-green)}.rw-agenda-title{font-size:12px;line-height:1.5}.rw-agenda-detail{font-size:10px;color:var(--rw-secondary);margin-top:2px}.rw-day-panel .rw-help{font-size:11px;margin:8px 0 2px}.rw-agenda-time{font-size:10px}.rw-day-tomorrow .rw-agenda-list>li{padding:6px 0}\n.lwb-root .rw-daily>.rw-block-content{padding-top:2px}.rw-daily-toolbar{display:flex;align-items:center;gap:3px;margin:0 0 7px;min-height:28px}.rw-daily-toolbar>.rw-help{font-size:10px}.rw-quiet-control{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:3px 6px;min-height:25px;border:0;background:transparent;color:var(--rw-secondary);font:inherit;font-size:11px!important;border-radius:5px;cursor:pointer}.rw-quiet-control:hover{background:var(--dsw-alias-bg-layer-2);color:var(--rw-ink)}.rw-date-trigger{anchor-name:--rw-task-dates}.rw-filter-trigger{anchor-name:--rw-task-filter}.lwb-root .rw-task-composer{display:block;border:1px solid var(--rw-soft-rule);border-radius:8px;padding:5px 7px;margin:0 0 9px;background:var(--dsw-alias-bg-base)}.rw-task-composer:focus-within{border-color:var(--rw-line)}.rw-compose-line{display:flex;align-items:center;gap:6px}.lwb-root .rw-task-composer .rw-task-text{flex:1;min-width:0;width:auto;height:30px;background:transparent;border:0;border-radius:0;box-shadow:none;padding:4px 6px;font:inherit;font-size:12px;outline:0;color:var(--rw-ink);box-sizing:border-box}.rw-task-text::placeholder{color:var(--rw-hint)}.rw-compose-add{flex:none;display:flex;align-items:center;justify-content:center;width:27px;height:27px;border:0;background:color-mix(in srgb,var(--rw-blue) 10%,var(--dsw-alias-bg-base));color:var(--rw-blue);border-radius:6px;padding:5px;cursor:pointer}.rw-compose-add svg{width:16px;height:16px}.rw-compose-options{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:1px}.lwb-root .rw-task-composer .rw-category-select{flex:none;min-width:0;width:auto;max-width:160px;padding:3px 18px 3px 6px;height:25px;border:0;background-color:transparent;border-radius:5px;color:var(--rw-secondary);font-size:11px;box-shadow:none}.rw-category-select:focus-visible{outline:1px solid var(--rw-blue)}\n.lwb-root .rw-task-list{padding:0;max-height:260px;scrollbar-gutter:stable}.lwb-root .rw-task-entry{padding:8px 1px;gap:8px;align-items:flex-start}.lwb-root .rw-task-entry+.rw-task-entry{border-top:1px solid color-mix(in srgb,var(--rw-ink) 10%,var(--dsw-alias-bg-base))}.lwb-root .rw-task-entry>.lwb-check,.lwb-root .rw-recent-popover .lwb-check{width:15px;height:15px;margin-top:3px;accent-color:var(--rw-blue);border-width:1px}.rw-task-line{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 12px}.lwb-root .rw-task-copy .lwb-item-text{flex:1;min-width:min(100%,170px);font-size:12px;font-weight:400;line-height:1.6;padding:0;overflow-wrap:anywhere}.lwb-root .rw-task-meta{font-size:10px;line-height:1.6;margin:0;color:var(--rw-secondary);white-space:normal}.rw-task-actions{display:flex;gap:1px;opacity:.45}.rw-task-entry:hover .rw-task-actions,.rw-task-entry:focus-within .rw-task-actions{opacity:1}.lwb-root .rw-task-actions .lwb-icon-btn{width:24px;height:24px;padding:4px}.lwb-root .rw-task-actions svg{width:14px;height:14px}.lwb-root .rw-task-edit{margin:6px 0;gap:7px}.lwb-root .rw-task-edit input{padding:4px 6px;min-height:27px;font-size:11px;width:130px}.rw-task-edit label{font-size:10px}.rw-calendar-preview{margin-top:12px}.rw-calendar-preview>header{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--rw-secondary);padding:4px 0}.rw-calendar-preview>header svg{color:var(--rw-green)}.rw-calendar-preview .rw-text-button{font-size:10px}.rw-calendar-entries{min-width:0}.rw-calendar-entries.is-expanded{max-height:240px;overflow:auto;scrollbar-gutter:stable}.rw-calendar-dot{width:5px;height:5px;flex:none;border-radius:50%;background:var(--rw-green);margin:7px 5px 0}.lwb-root .rw-calendar-entry{padding:6px 1px}.rw-calendar-entry .lwb-item-text{color:var(--rw-secondary)}\n.rw-task-popover{position:fixed;inset:0;margin:auto;width:min(290px,calc(100vw - 32px));height:fit-content;max-height:80vh;overflow:auto;box-sizing:border-box;padding:14px;border:1px solid var(--rw-line);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--rw-ink);font-family:inherit;font-size:12px;box-shadow:0 5px 20px #00000010}.rw-task-popover::backdrop{background:transparent}.rw-task-popover>header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.rw-task-popover strong{font-size:12px;font-weight:550}.rw-task-popover>label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:8px 0;color:var(--rw-secondary);font-size:11px}.rw-task-popover .lwb-input{font-size:12px;padding:5px 7px;min-height:30px;width:155px;border:1px solid var(--rw-soft-rule);border-radius:5px}.rw-task-popover .rw-text-button{font-size:11px;margin-top:4px}.rw-task-popover .lwb-icon-btn{width:24px;height:24px}\n@supports (top:anchor(bottom)){.rw-task-popover{inset:auto;top:anchor(bottom);left:anchor(left);margin:6px 0 0;position-try-fallbacks:flip-inline,flip-block}.rw-composer-popover{position-anchor:--rw-task-dates}.rw-filter-popover{position-anchor:--rw-task-filter}}\n.lwb-root .rw-summary-caption{font-size:11px;letter-spacing:0;color:var(--rw-secondary);margin-bottom:18px}.lwb-root .rw-summary-section{margin-bottom:22px;padding-bottom:22px}.lwb-root .rw-summary-section>h2{font-size:11px;display:flex;align-items:center;gap:7px;margin-bottom:10px}.rw-summary-section>h2:before{content:'';width:5px;height:5px;border-radius:2px;background:var(--rw-blue)}.rw-summary-courses>h2:before{background:var(--rw-violet)}.rw-summary-daily>h2:before{background:var(--rw-green)}.lwb-root .rw-summary-stats{gap:12px 26px;margin:0 0 16px;padding:0}.lwb-root .rw-summary-stats>div{gap:7px}.lwb-root .rw-summary-stats strong{font-size:24px;line-height:1.25;font-weight:550;letter-spacing:-.02em;color:var(--rw-ink)}.lwb-root .rw-summary-stats span{font-size:10px;color:var(--rw-secondary)}.rw-summary-meter{height:3px}.rw-summary-meter>span{background:var(--rw-green)}.rw-summary-tasks li{font-size:12px;padding:7px 0}.rw-summary-mark{color:var(--rw-green)}.rw-summary-dashboard .rw-gantt-project-heading{gap:7px}.rw-summary-dashboard .rw-gantt-label{padding:10px 8px}.rw-summary-dashboard .rw-gantt-tools{margin-bottom:7px}.rw-summary-dashboard .rw-gantt-current{font-size:10px}.rw-summary-dashboard .rw-gantt-scale{font-size:11px;padding:4px 7px;min-height:26px}.rw-summary-dashboard .rw-gantt-bar{opacity:.72}.rw-summary-dashboard .rw-gantt-caption{font-size:10px}.rw-summary-dashboard .rw-teach-day{min-height:76px}.rw-summary-dashboard .rw-teach-legend{font-size:11px}.rw-summary-dashboard .rw-teach-agenda{margin-top:10px;padding-top:10px}.rw-summary-dashboard .rw-teach-agenda h3{font-size:11px;font-weight:500}.rw-summary-dashboard .rw-calendar-head input{font-size:12px;min-height:28px;padding:4px 7px}.rw-summary-dashboard .rw-teach-event{font-size:10px}\n.rw-dialog{border:1px solid var(--rw-line);border-radius:10px;box-shadow:0 10px 35px #00000018}.rw-dialog-head,.rw-dialog-foot{padding:12px 18px;gap:8px}.rw-dialog h2{font-size:16px;line-height:1.4;font-weight:600}.rw-dialog h3{font-size:12px;font-weight:550;margin:18px 0 9px}.rw-dialog .rw-editor-body{padding:16px 18px}.rw-dialog .rw-kind{display:none}.rw-dialog .rw-field>span{font-size:11px;color:var(--rw-secondary);font-weight:400}.rw-dialog .lwb-input,.rw-dialog .lwb-select,.rw-dialog .lwb-textarea{font-size:12px;padding:6px 8px;border-radius:6px;border:1px solid var(--rw-soft-rule);box-shadow:none;min-height:31px}.rw-dialog .lwb-textarea{min-height:62px;line-height:1.6}.rw-dialog .lwb-input:focus,.rw-dialog .lwb-select:focus,.rw-dialog .lwb-textarea:focus{outline:1px solid var(--rw-blue);outline-offset:1px}.rw-dialog .rw-fields{gap:10px 14px}.rw-dialog .rw-help{font-size:10px}.rw-dialog .rw-recognition{padding-bottom:14px;margin-bottom:16px}.rw-dialog .rw-recognition textarea{min-height:76px}.rw-dialog .rw-ai-actions .rw-ai-confirm{font-size:11px;min-height:28px;padding:4px 9px;border-color:var(--rw-line)}.rw-dialog .rw-ai-actions .rw-ai-undo{border:0;background:none}.rw-dialog .rw-ai-actions select.rw-ai-model{height:26px;min-height:26px;font-size:11px;flex-basis:210px;width:210px;border:0;outline-offset:2px}.rw-dialog .rw-person-editor,.rw-dialog .rw-week-plan,.rw-dialog .rw-stage-editor{border-color:var(--rw-soft-rule);border-radius:7px;box-shadow:none}.rw-dialog .rw-person-editor{padding:10px}.rw-dialog .rw-stage-add,.rw-dialog .rw-inline{gap:8px}.rw-dialog .rw-class-row{gap:8px}.rw-dialog .rw-attachment{font-size:11px;padding:6px 0}.lwb-root .lwb-wide{border:0;background:none;box-shadow:none}.lwb-root .lwb-pane-full{padding:0}.lwb-root .rw-recent-popover .lwb-pane-full{padding:14px 16px}.lwb-root .lwb-pane-title:before{display:none}.lwb-root .lwb-pane-title{font-family:inherit;letter-spacing:normal;text-transform:none;font-size:12px;color:var(--rw-ink)}.lwb-root .lwb-upload{border:1px dashed var(--rw-line);border-radius:8px;box-shadow:none}.rw-placeholder,.rw-help,.rw-empty{color:var(--rw-hint)}\n@media(hover:none){.rw-task-actions{opacity:1}}\n@media(max-width:700px){.lwb-root .lwb-head{padding:12px 14px}.lwb-root .lwb-body{padding:8px 14px 24px}.lwb-root .rw-day-panel{padding:11px 12px}.lwb-root .rw-task-line{display:block}.lwb-root .rw-task-meta{margin-top:1px}.rw-dialog .rw-editor-body{padding:14px}.rw-dialog-head,.rw-dialog-foot{padding:11px 14px}.rw-dialog{width:calc(100vw - 24px)}.rw-summary-stats{gap:12px 20px}}\n\n/* Quiet section hierarchy: whitespace and a small accent instead of rules. */\n.lwb-root .rw-block>.rw-block-heading,.lwb-root .rw-block[open]>.rw-block-heading{border:0;box-shadow:none;padding-bottom:2px}.lwb-root .rw-block>.rw-block-content{border:0;padding-top:9px}.lwb-root .rw-block-heading h2{display:flex;align-items:center;gap:7px}.lwb-root .rw-block-heading h2:before{content:\"\";width:5px;height:5px;flex:none;border-radius:2px;background:var(--rw-blue)}.lwb-root .rw-block-course .rw-block-heading h2:before{background:var(--rw-violet)}.lwb-root .rw-daily .rw-block-heading h2:before{background:var(--rw-green)}\n"
    const SUMMARY_CSS = "\n.rw-summary-dashboard{color:var(--rw-ink);min-width:0}.rw-summary-caption{font-size:11px;color:var(--rw-secondary);letter-spacing:.08em;margin:0 0 20px}.rw-summary-section{padding:0 0 26px;margin:0 0 26px;border-bottom:1px solid var(--rw-soft-rule)}.rw-summary-section:last-child{border-bottom:0;margin-bottom:0}.rw-summary-section>h2{font-size:12px;font-weight:500;color:var(--rw-secondary);margin:0 0 14px}.rw-summary-stats{display:flex;flex-wrap:wrap;gap:16px 32px;margin-bottom:20px}.rw-summary-stats>div{display:flex;align-items:baseline;gap:8px}.rw-summary-stats strong{font-size:27px;font-weight:550;line-height:1.2;font-variant-numeric:tabular-nums;letter-spacing:-.03em}.rw-summary-stats span{font-size:11px;color:var(--rw-secondary)}.rw-summary-dashboard .rw-gantt-row{border:0;border-radius:0;border-bottom:1px solid var(--rw-soft-rule)}.rw-summary-dashboard .rw-project-title{font-size:12px;cursor:default}.rw-summary-dashboard .rw-gantt-label-heading{font-size:11px;font-weight:400;color:var(--rw-secondary)}.rw-summary-dashboard .rw-gantt-node,.rw-summary-dashboard .rw-gantt-caption{cursor:default}.rw-summary-dashboard .rw-course-name{cursor:default}.rw-summary-daily-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px 30px;align-items:start}.rw-summary-list{min-width:0}.rw-summary-list header{display:flex;align-items:center;gap:10px;margin-bottom:9px}.rw-summary-list h3{font-size:12px;font-weight:550;margin:0}.rw-summary-count{font-size:10px;color:var(--rw-secondary);font-variant-numeric:tabular-nums}.rw-summary-toggle{margin-left:auto;padding:3px 5px;background:none;border:0;border-radius:4px;color:var(--rw-secondary);font:inherit;font-size:10px;cursor:pointer}.rw-summary-toggle:hover{background:var(--dsw-alias-bg-layer-2);color:var(--rw-ink)}.rw-summary-toggle:focus-visible{outline:1px solid currentColor}.rw-summary-meter{height:3px;background:var(--rw-soft-rule);border-radius:2px;overflow:hidden;margin-bottom:5px}.rw-summary-meter>span{display:block;height:100%;background:var(--rw-secondary)}.rw-summary-tasks{list-style:none;margin:0;padding:0}.rw-summary-tasks li{display:flex;gap:8px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--rw-soft-rule);font-size:12px;line-height:1.5;flex-wrap:wrap}.rw-summary-tasks li:last-child{border:0}.rw-summary-mark{font-size:11px;color:var(--rw-secondary)}.rw-summary-task-text{flex:1;min-width:100px;overflow-wrap:anywhere}.rw-summary-tasks time{font-size:10px;color:var(--rw-secondary);font-variant-numeric:tabular-nums}.rw-summary-tasks .is-done .rw-summary-task-text{color:var(--rw-secondary);text-decoration:line-through;text-decoration-color:var(--rw-soft-rule)}.rw-summary-muted{font-size:11px;color:var(--rw-secondary);margin:12px 0}\n"
    const AI_CONTROLS_CSS = "\n/* Quiet, compact recognition controls shared by project and course forms. */\n.rw-dialog .rw-ai-actions .rw-ai-confirm{border:1px solid var(--rw-line,var(--dsw-alias-border-l1));border-radius:6px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);padding:5px 11px;min-height:30px;font-size:12px;font-weight:500;box-shadow:none}\n.rw-dialog .rw-ai-actions .rw-ai-confirm:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}\n.rw-dialog .rw-ai-actions .rw-ai-undo{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:4px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);box-shadow:none;border-radius:5px}\n.rw-dialog .rw-ai-actions .rw-ai-undo:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}\n.rw-dialog .rw-ai-actions select.rw-ai-model{flex:0 1 230px;width:230px;min-width:0;max-width:100%;height:28px;min-height:28px;padding:3px 24px 3px 9px;border:0;border-radius:6px;box-shadow:none;background-color:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:11px;font-weight:400;text-overflow:ellipsis}\n.rw-dialog .rw-ai-actions .rw-ai-model:focus-visible,.rw-dialog .rw-ai-actions .rw-ai-confirm:focus-visible,.rw-dialog .rw-ai-actions .rw-ai-undo:focus-visible{outline:1px solid var(--dsw-alias-label-secondary);outline-offset:2px;box-shadow:none}\n"
    const AI_ENTRY_CSS = '\n.rw-recognition{margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid var(--dsw-alias-border-l1)}.rw-recognition textarea{width:100%;min-height:88px}.rw-ai-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:8px}.rw-ai-actions select{max-width:100%;min-width:160px;flex:1}.rw-ai-actions button:disabled{opacity:.4;cursor:default}.rw-ai-preview{width:min(620px,calc(100vw - 40px));max-height:75vh;overflow:auto;padding:22px;box-sizing:border-box}.rw-ai-preview h3{margin:0 0 8px;font-size:16px}.rw-ai-change{padding:10px 0;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:13px;overflow-wrap:anywhere;white-space:pre-wrap}.rw-ai-change strong{display:block;font-size:12px;margin-bottom:4px}.rw-ai-before{color:var(--dsw-alias-label-secondary);font-size:12px}.rw-ai-preview footer{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}\n'
    const RESEARCH_CSS = "/* Local research workspace: host typography, restrained surfaces, real milestones. */\n.lwb-root{--p-radius:12px;--p-pad:18px;--p-gap:16px;--p-bg:var(--dsw-alias-bg-base);--p-border:var(--dsw-alias-border-l1);--p-divider:var(--dsw-alias-border-l1);--p-shadow:none;--p-blur:none;--mono-font:var(--dsw-font-family,inherit);background-image:none;font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif);font-size:14px;line-height:1.6;letter-spacing:normal}\n.lwb-root button,.lwb-root input,.lwb-root select,.lwb-root textarea,.rw-dialog button,.rw-dialog input,.rw-dialog select,.rw-dialog textarea{font-family:inherit;font-size:inherit}\n.lwb-head{padding:16px 28px;gap:10px;min-height:34px}.lwb-title{font-size:15px;letter-spacing:normal}.lwb-dot{display:none}.lwb-tabs{padding:0 28px;gap:16px}.lwb-tab{padding:10px 2px;border-radius:0;font-size:14px;background:none}.lwb-tab-on:after{left:0;right:0;height:2px;background:var(--dsw-alias-label-primary)}\n.lwb-body{padding:28px 32px 44px}.lwb-btn{border-radius:8px;box-shadow:none;font-weight:500;font-size:13px;padding:7px 12px}.lwb-btn-primary{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);border-color:transparent}.lwb-btn-primary:hover{opacity:.85;background:var(--dsw-alias-label-primary)}\n.lwb-input,.lwb-textarea,.lwb-select{background:var(--dsw-specific-input-major,var(--dsw-alias-bg-base));border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;box-sizing:border-box;color:var(--dsw-alias-label-primary);font-size:13px}.lwb-input:focus,.lwb-textarea:focus,.lwb-select:focus{outline:2px solid var(--dsw-alias-border-l2);outline-offset:1px}.lwb-textarea{min-height:76px;resize:vertical}.lwb-wide,.lwb-hero,.lwb-board{background:var(--dsw-alias-bg-base);box-shadow:none;backdrop-filter:none;border:1px solid var(--p-border)}\n.lwb-count,.lwb-tag,.lwb-note-meta,.lwb-attach-chip,.lwb-sec-count{font-family:inherit;letter-spacing:normal;font-variant-numeric:tabular-nums}.lwb-pane-title{font-size:14px;font-weight:550}.lwb-err{max-width:340px;font-size:12px;overflow-wrap:anywhere}.lwb-icon-btn{border-radius:7px}.rw-header-icon{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l1);background:transparent;font-size:21px!important}.rw-header-icon:hover{background:var(--dsw-alias-interactive-bg-hover)}.rw-header-icon:disabled{opacity:.45}.rw-save{font-size:12px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rw-spin{display:inline-block;animation:rw-spin 1s linear infinite}@keyframes rw-spin{to{transform:rotate(360deg)}}\n.rw-home{max-width:1440px;margin:0 auto}.rw-intro{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:0 0 25px}.rw-date{font-size:12px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}.rw-intro h1{font-family:inherit;font-size:26px;font-weight:600;letter-spacing:-.025em;line-height:1.45;margin:6px 0}.rw-intro p{font-size:13px;color:var(--dsw-alias-label-secondary);margin:0;line-height:1.7}.rw-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:0 0 17px;margin-bottom:24px;border-bottom:1px solid var(--dsw-alias-border-l1)}.rw-filters{display:flex;gap:4px}.rw-filter{border:0;border-radius:7px;background:none;color:var(--dsw-alias-label-secondary);padding:6px 12px;cursor:pointer;font-size:13px!important}.rw-filter-on{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:550}.rw-summary,.rw-count{font-size:12px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}\n.rw-group{margin-bottom:28px}.rw-section-title{display:flex;align-items:center;gap:10px;margin:0 0 13px}.rw-section-title h2{font-size:15px;font-weight:600;margin:0}.rw-project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.rw-project{min-width:0;padding:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-base);transition:border-color .15s}.rw-project:hover{border-color:var(--dsw-alias-border-l2)}.rw-card-meta{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:10px}.rw-kind{color:var(--dsw-alias-label-secondary);font-size:12px}.rw-status{font-size:11px;border-radius:5px;padding:2px 7px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2)}.rw-status-active{color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 8%,transparent)}.rw-status-completed{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 8%,transparent)}\n.rw-project-title{display:block;max-width:100%;font-size:17px!important;font-weight:600;text-align:left;line-height:1.5;color:var(--dsw-alias-label-primary);background:none;padding:0;border:0;cursor:pointer;overflow-wrap:anywhere}.rw-collaborators{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:7px}.rw-stage{font-size:12px;color:var(--dsw-alias-label-primary);margin-top:12px}.rw-background{font-size:13px;line-height:1.7;color:var(--dsw-alias-label-secondary);margin:12px 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap}.rw-next{padding:13px 0 12px;margin-top:10px;border-top:1px solid var(--dsw-alias-border-l1)}.rw-next>span{font-size:11px;color:var(--dsw-alias-label-secondary)}.rw-next p{margin:3px 0 0;font-size:13px;color:var(--dsw-alias-label-primary);white-space:pre-wrap;overflow-wrap:anywhere}.rw-undated{font-size:12px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));padding:6px 0 10px}.rw-timeline{padding:9px 4px 13px}.rw-time-track{position:relative;height:2px;background:var(--dsw-alias-border-l1);margin:7px 3px 12px}.rw-time-dot{position:absolute;top:50%;width:6px;height:6px;border:2px solid var(--dsw-alias-bg-base);background:var(--dsw-alias-label-secondary);border-radius:50%;transform:translate(-50%,-50%)}.rw-time-done{background:var(--dsw-alias-state-success-primary)}.rw-time-today{position:absolute;top:-5px;height:12px;width:2px;background:var(--dsw-alias-state-business-primary);transform:translateX(-50%)}.rw-time-labels{display:flex;flex-wrap:wrap;gap:4px 14px;color:var(--dsw-alias-label-secondary);font-size:11px}.rw-time-labels time{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}.rw-card-bottom{display:flex;justify-content:space-between;gap:10px;align-items:center;border-top:1px solid var(--dsw-alias-border-l1);padding-top:11px;font-size:11px;color:var(--dsw-alias-label-secondary)}.rw-text-button{background:none;border:0;color:var(--dsw-alias-label-primary);padding:0;text-align:left;cursor:pointer;font-size:12px!important}.rw-text-button:hover{text-decoration:underline}.rw-empty{padding:20px;border:1px dashed var(--dsw-alias-border-l1);border-radius:10px;font-size:13px;color:var(--dsw-alias-label-secondary);line-height:1.8}.rw-recent{margin:16px 0}.rw-recent summary,.rw-daily summary{cursor:pointer;font-size:13px;color:var(--dsw-alias-label-secondary);padding:12px 0}.rw-recent[open]>summary{margin-bottom:8px}.rw-daily{margin-top:32px;border-top:1px solid var(--dsw-alias-border-l1);padding-top:5px}.rw-daily>summary{display:flex;gap:12px;align-items:center;font-weight:550;color:var(--dsw-alias-label-primary)}.rw-daily>summary:before{content:'＋';font-weight:400;color:var(--dsw-alias-label-secondary)}.rw-daily[open]>summary:before{content:'−'}.rw-daily[open]>summary{margin-bottom:10px}.rw-daily .lwb-wide{margin-bottom:12px}.rw-daily .lwb-item{font-size:13px}.rw-kanban{display:grid;grid-template-columns:repeat(4,minmax(230px,1fr));gap:14px;overflow-x:auto;padding-bottom:8px}.rw-column{padding:14px;background:var(--dsw-alias-bg-layer-2);border-radius:12px;min-width:0}.rw-column .rw-project{padding:15px;margin-bottom:12px}.rw-column .rw-project-title{font-size:15px!important}.rw-column .rw-empty{border:0;padding:16px 0}.rw-column .rw-section-title h2{font-size:13px}.rw-column .rw-card-bottom{flex-wrap:wrap}\n.rw-help{font-size:12px;color:var(--dsw-alias-label-secondary);font-weight:400;line-height:1.7}.rw-dialog{color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif);background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:16px;padding:0;width:min(760px,calc(100vw - 64px));max-width:none;max-height:88vh;box-shadow:0 20px 80px rgba(0,0,0,.18);overflow:hidden}.rw-dialog::backdrop{background:rgba(0,0,0,.24);backdrop-filter:blur(3px)}.rw-dialog>form{display:flex;flex-direction:column;max-height:88vh}.rw-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:20px 24px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}.rw-dialog-head h2{font-size:19px;font-weight:600;margin:4px 0 0;line-height:1.5;overflow-wrap:anywhere}.rw-dialog-head .lwb-icon-btn{font-size:24px;width:28px;height:28px}.rw-editor-body{overflow-y:auto;min-height:0;padding:20px 24px}.rw-editor-body h3{font-size:14px;font-weight:600;margin:25px 0 6px}.rw-editor-body p.rw-help{margin:0 0 12px}.rw-field{display:flex;flex-direction:column;gap:6px;margin:0 0 15px;min-width:0}.rw-field>span{font-size:12px;color:var(--dsw-alias-label-secondary)}.rw-field input,.rw-field textarea,.rw-field select{width:100%;box-sizing:border-box;min-width:0}.rw-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}.rw-inline{display:flex;gap:8px;margin:12px 0}.rw-inline input{flex:1;min-width:0}.rw-inline button{white-space:nowrap}.rw-milestone{display:flex;align-items:center;gap:9px;padding:7px 0;font-size:13px}.rw-milestone input{accent-color:var(--dsw-alias-label-primary)}.rw-milestone time{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}.rw-update{display:flex;gap:16px;align-items:flex-start;padding:9px 0;font-size:13px;line-height:1.7}.rw-update time{color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap;padding-top:2px;font-variant-numeric:tabular-nums}.rw-update p{margin:3px 0}.rw-activity{padding:8px 18px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px}.rw-attachment{display:flex;align-items:center;gap:8px;padding:8px 0}.rw-attachment .rw-text-button{flex:1;overflow-wrap:anywhere}.rw-dialog .lwb-drop-area{border:1px dashed var(--dsw-alias-border-l1);border-radius:8px;margin:10px 0 16px}.rw-link{display:inline-block;margin:0 12px 5px 0;color:var(--dsw-alias-state-business-primary);font-size:12px}.rw-dialog-foot{display:flex;align-items:center;gap:10px;padding:14px 24px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base)}.rw-dialog-foot .rw-help{max-width:50%}.rw-dialog :focus-visible,.lwb-root button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:3px}.rw-daily .lwb-sec{margin-bottom:12px}\n@media(min-width:1500px){.rw-project-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}\n@media(max-width:900px){.lwb-body{padding:20px}.lwb-head{padding:12px 20px}.rw-project-grid{grid-template-columns:1fr}.rw-intro{align-items:flex-start}.rw-intro h1{font-size:23px}.rw-save{display:none}.rw-summary{white-space:nowrap}.rw-dialog{width:calc(100vw - 32px)}.rw-fields{grid-template-columns:1fr 1fr}.rw-dialog-head,.rw-editor-body,.rw-dialog-foot{padding-left:18px;padding-right:18px}}\n@media(prefers-reduced-motion:reduce){.rw-spin{animation:none}.rw-project{transition:none}}\n\n/* Equal-rank sections and compact bordered project cards; size from panel, not viewport. */\n.lwb-root{font-size:13px;line-height:1.5;--p-radius:10px;--p-pad:12px 14px;--p-gap:12px}\n.lwb-head{padding:11px 20px;min-height:32px}.lwb-title{font-size:14px}.lwb-tabs{padding:0 20px;gap:16px}.lwb-tab{font-size:13px;padding:8px 2px}.lwb-body{padding:16px 20px 28px}.rw-home{max-width:none;width:100%;margin:0;min-width:0}.rw-intro{display:none}\n.rw-block{margin:0 0 14px;border:1px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:11px;background:var(--dsw-alias-bg-base);overflow:hidden;min-width:0}.rw-block-heading{display:flex;align-items:center;gap:10px;padding:11px 14px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 65%,var(--dsw-alias-bg-base));cursor:pointer;list-style:none;min-height:24px}.rw-block-heading::-webkit-details-marker{display:none}.rw-block-heading:before{content:'›';display:block;font-size:18px;line-height:1;color:var(--dsw-alias-label-secondary);width:8px;text-align:center;transform:rotate(0deg);transition:transform .12s}.rw-block[open]>.rw-block-heading:before{transform:rotate(90deg)}.rw-block-heading h2{font-size:15px;font-weight:600;line-height:1.5;margin:0;color:var(--dsw-alias-label-primary)}.rw-block-meta{font-size:11px;color:var(--dsw-alias-label-secondary);font-weight:400;font-variant-numeric:tabular-nums;line-height:1.5}.rw-block[open]>.rw-block-heading{border-bottom:1px solid var(--dsw-alias-border-l1)}.rw-block-content{padding:12px 14px 14px;min-width:0}.rw-add-button{border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:4px 8px;background:var(--dsw-alias-bg-base);font-size:12px!important;line-height:1.5;color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap}.rw-add-button:hover{background:var(--dsw-alias-interactive-bg-hover)}\n.rw-group{margin:0 0 13px}.rw-group:last-child{margin-bottom:0}.rw-section-title{gap:7px;margin:0 0 8px;min-height:19px}.rw-section-title h3,.rw-column .rw-section-title h3{font-size:12px;font-weight:550;line-height:1.5;color:var(--dsw-alias-label-secondary);margin:0}.rw-count{font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));font-weight:400}.rw-empty{border:0;border-radius:0;background:none;padding:4px 0 7px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}\n.rw-project-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px;min-width:0}.rw-project{container-name:project-card;container-type:inline-size;min-width:0;padding:13px 14px 10px;border:1px solid color-mix(in srgb,var(--dsw-alias-label-secondary) 24%,var(--dsw-alias-bg-base));border-radius:9px;background:var(--dsw-alias-bg-base);box-shadow:0 1px 2px rgba(0,0,0,.025);transition:border-color .15s,box-shadow .15s}.rw-project:hover{border-color:color-mix(in srgb,var(--dsw-alias-label-secondary) 42%,var(--dsw-alias-bg-base));box-shadow:0 2px 7px rgba(0,0,0,.04)}.rw-card-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-items:start}.rw-card-heading,.rw-card-action,.rw-card-schedule{min-width:0}.rw-card-meta{margin:0 0 5px;gap:7px}.rw-kind{font-size:10px;line-height:1.4}.rw-status{font-size:10px;line-height:1.4;padding:2px 5px}.rw-project-title{font-size:14px!important;font-weight:550;line-height:1.45;margin:0;letter-spacing:0}.rw-collaborators{font-size:11px;line-height:1.45;margin-top:5px}.rw-stage{font-size:11px;line-height:1.45;margin-top:5px}.rw-background{font-size:12px;line-height:1.5;margin:6px 0 0;-webkit-line-clamp:2}.rw-next{margin:0;padding:7px 0 0;border-top:1px solid var(--dsw-alias-border-l1)}.rw-next>span,.rw-card-caption{font-size:10px;line-height:1.4;color:var(--dsw-alias-label-secondary)}.rw-next p{font-size:12px;line-height:1.5;margin:3px 0 0}.rw-card-schedule{padding-top:0}.rw-undated{font-size:11px;line-height:1.5;padding:3px 0 0}.rw-timeline{padding:1px 3px 2px}.rw-time-track{margin:7px 3px 8px}.rw-time-labels{font-size:10px;line-height:1.45;gap:3px 9px}.rw-card-bottom{margin-top:9px;padding-top:7px;font-size:10px;line-height:1.5;gap:10px;align-items:center}.rw-card-bottom .rw-text-button{font-size:11px!important;white-space:nowrap}.rw-card-links{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:6px 12px;min-width:0}.rw-card-links a{font-size:11px;color:var(--dsw-alias-state-business-primary);text-decoration:none;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rw-card-links a:hover{text-decoration:underline}\n@container project-card (min-width:620px){.rw-card-layout{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr) minmax(0,.95fr);gap:18px}.rw-next{padding:0;border:0}.rw-card-action,.rw-card-schedule{border-left:1px solid var(--dsw-alias-border-l1);padding-left:14px;min-height:52px}.rw-card-meta{justify-content:flex-start}.rw-status{margin-left:5px}}\n.rw-kanban{grid-template-columns:repeat(4,minmax(220px,1fr));gap:10px;padding-bottom:3px}.rw-column{padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2)}.rw-column .rw-project{padding:10px;margin-bottom:9px;background:var(--dsw-alias-bg-base)}.rw-column .rw-project-title{font-size:13px!important}.rw-column .rw-section-title{margin-bottom:9px}.rw-column .rw-empty{font-size:11px;padding:5px 0}.rw-recent{margin:10px 0 0}.rw-recent>summary{font-size:12px;font-weight:500;line-height:1.5;padding:6px 0}.rw-recent[open]>summary{margin-bottom:5px}.rw-progress-log{border-top:1px solid var(--dsw-alias-border-l1);padding-top:11px;margin-top:12px}.rw-activity{padding:5px 10px;border-radius:8px}.rw-update{gap:12px;padding:5px 0;font-size:12px;line-height:1.5}.rw-update time{font-size:10px}.rw-update p{margin-top:1px}\n.rw-daily{padding-top:0;margin-top:0}.rw-daily>summary{padding:11px 14px;margin:0!important;gap:10px}.rw-daily>summary:before{content:'›';font-size:18px;font-weight:400}.rw-daily[open]>summary:before{content:'›'}.rw-daily .rw-block-heading h2{font-size:15px;font-weight:600}.rw-daily .lwb-pane-title{font-size:12px;font-weight:550}.rw-daily .lwb-wide{border-radius:8px;margin:0;padding:10px 12px;box-shadow:none}.rw-daily .lwb-pane-full{padding:0}.rw-daily .lwb-item{padding:4px 0;font-size:12px}.rw-daily .lwb-item-text{font-size:12px;line-height:1.5}.rw-daily .lwb-input,.rw-daily .lwb-select,.rw-daily .lwb-textarea{font-size:12px;padding:6px 8px}.lwb-daily-content{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px;align-items:start}.lwb-daily-content>.rw-recent{margin:0;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:4px 10px}.lwb-daily-content>.rw-recent>.lwb-wide{border:0;padding:4px 0}.rw-daily .lwb-boards{gap:12px}.rw-daily .lwb-board{padding:10px 12px;border-radius:8px;min-width:0}.rw-daily .lwb-board-head{margin-bottom:8px}.rw-daily .lwb-card{padding:7px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-base)}\n@media(max-width:700px){.lwb-body{padding:12px}.lwb-head{padding:10px 14px}.rw-block-heading,.rw-daily>summary{padding:10px 11px}.rw-block-content{padding:10px 11px}.rw-block-heading{gap:7px;flex-wrap:wrap}.rw-block-heading h2,.rw-daily .rw-block-heading h2{font-size:14px}.rw-block-meta{font-size:10px}.rw-project-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))}.rw-project{padding:11px}.rw-save{display:none}}\n\n/* E-ink: solid borders, readable secondary text, grayscale states, no decorative motion. */\n.lwb-root{--rw-ink:var(--dsw-alias-label-primary);--rw-secondary:color-mix(in srgb,var(--rw-ink) 82%,var(--dsw-alias-bg-base));--rw-line:color-mix(in srgb,var(--rw-ink) 66%,var(--dsw-alias-bg-base));--rw-rule:color-mix(in srgb,var(--rw-ink) 48%,var(--dsw-alias-bg-base));--p-border:var(--rw-line);--p-divider:var(--rw-rule);--p-shadow:none;--p-blur:none;-webkit-font-smoothing:auto}\n.lwb-root *{animation:none!important;transition:none!important;box-shadow:none!important;text-shadow:none!important;backdrop-filter:none!important}.lwb-root .lwb-head,.lwb-root .lwb-tabs{border-bottom:1px solid var(--rw-rule)}.lwb-root .lwb-tab{color:var(--rw-secondary)}.lwb-root .lwb-tab-on{color:var(--rw-ink);font-weight:600}.lwb-root .lwb-tab-on:after{height:3px;background:var(--rw-ink)}\n.lwb-root .rw-block{border:1.5px solid var(--rw-line);border-radius:9px}.lwb-root .rw-block-heading,.lwb-root .rw-daily>summary{background:var(--dsw-alias-bg-base);color:var(--rw-ink)}.lwb-root .rw-block[open]>.rw-block-heading{border-bottom:1.5px solid var(--rw-line)}.lwb-root .rw-block-heading:before{color:var(--rw-ink);font-weight:600}.lwb-root .rw-block-heading h2{font-weight:650}.lwb-root .rw-block-meta,.lwb-root .rw-count{color:var(--rw-secondary);font-size:12px}.lwb-root .rw-section-title h3,.lwb-root .rw-column .rw-section-title h3{color:var(--rw-ink);font-size:12px;font-weight:600}.lwb-root .rw-section-title{padding-bottom:5px;border-bottom:1px solid var(--rw-rule)}\n.lwb-root .rw-project{border:1.5px solid var(--rw-line);border-radius:8px;background:var(--dsw-alias-bg-base);box-shadow:none}.lwb-root .rw-project:hover{border-color:var(--rw-ink);box-shadow:none}.lwb-root .rw-project-title{color:var(--rw-ink);font-weight:600}.lwb-root .rw-kind,.lwb-root .rw-collaborators,.lwb-root .rw-background,.lwb-root .rw-undated,.lwb-root .rw-next>span,.lwb-root .rw-card-caption,.lwb-root .rw-card-bottom,.lwb-root .rw-help,.lwb-root .rw-empty,.lwb-root .rw-recent>summary,.lwb-root .rw-save{color:var(--rw-secondary)}.lwb-root .rw-kind,.lwb-root .rw-card-caption,.lwb-root .rw-next>span,.lwb-root .rw-card-bottom{font-size:11px}.lwb-root .rw-card-meta{gap:8px}.lwb-root .rw-status{color:var(--rw-ink);background:var(--dsw-alias-bg-base);border:1px solid var(--rw-line);font-weight:500;font-size:11px;padding:1px 6px}.lwb-root .rw-status-active{background:var(--rw-ink);color:var(--dsw-alias-bg-base);border-color:var(--rw-ink)}.lwb-root .rw-status-completed{background:var(--dsw-alias-bg-base);color:var(--rw-ink);border:1px solid var(--rw-ink);text-decoration:underline;text-underline-offset:2px}\n.lwb-root .rw-card-bottom,.lwb-root .rw-next,.lwb-root .rw-progress-log{border-color:var(--rw-rule)}.lwb-root .rw-card-links a,.lwb-root .rw-link{color:var(--rw-ink);text-decoration:underline;text-underline-offset:3px}.lwb-root .rw-card-schedule,.lwb-root .rw-card-action{border-color:var(--rw-rule)}.lwb-root .rw-time-track{height:2px;background:var(--rw-line)}.lwb-root .rw-time-dot{background:var(--rw-ink);border-color:var(--dsw-alias-bg-base);width:7px;height:7px}.lwb-root .rw-time-today{background:var(--rw-ink);width:3px;height:14px}.lwb-root .rw-time-labels,.lwb-root .rw-update time{font-size:11px;color:var(--rw-secondary)}.lwb-root .rw-time-labels time{color:var(--rw-ink)}.lwb-root .rw-activity{border-color:var(--rw-line)}\n.lwb-root .rw-column{border:1px solid var(--rw-line);background:var(--dsw-alias-bg-base)}.lwb-root .rw-add-button,.lwb-root .rw-header-icon,.lwb-root .lwb-btn{border:1px solid var(--rw-line);color:var(--rw-ink);background:var(--dsw-alias-bg-base)}.lwb-root .lwb-btn-primary{background:var(--rw-ink);color:var(--dsw-alias-bg-base);border-color:var(--rw-ink)}.lwb-root .lwb-svg{stroke-width:1.8}.lwb-root .lwb-input,.lwb-root .lwb-select,.lwb-root .lwb-textarea{border:1px solid var(--rw-line);background:var(--dsw-alias-bg-base);color:var(--rw-ink)}.lwb-root input::placeholder,.lwb-root textarea::placeholder{color:var(--rw-secondary);opacity:1}.lwb-root .lwb-count,.lwb-root .lwb-tag,.lwb-root .lwb-empty{color:var(--rw-secondary)}.lwb-root .rw-daily .lwb-wide,.lwb-root .lwb-daily-content>.rw-recent,.lwb-root .rw-daily .lwb-board,.lwb-root .rw-daily .lwb-card{border-color:var(--rw-line)}.lwb-root .rw-header-icon:disabled{opacity:1;color:var(--rw-secondary);border-style:dashed}.lwb-root button:focus-visible{outline:2px solid var(--rw-ink);outline-offset:2px}\n.rw-dialog{border:1.5px solid var(--dsw-alias-label-primary);box-shadow:none}.rw-dialog::backdrop{background:rgba(0,0,0,.18);backdrop-filter:none}.rw-dialog .rw-field>span,.rw-dialog .rw-help,.rw-dialog .rw-kind{color:color-mix(in srgb,var(--dsw-alias-label-primary) 82%,var(--dsw-alias-bg-base))}.rw-dialog .rw-dialog-head,.rw-dialog .rw-dialog-foot{border-color:color-mix(in srgb,var(--dsw-alias-label-primary) 60%,var(--dsw-alias-bg-base))}.rw-dialog .lwb-input,.rw-dialog .lwb-select,.rw-dialog .lwb-textarea,.rw-dialog .lwb-btn,.rw-dialog .lwb-drop-area{border-color:color-mix(in srgb,var(--dsw-alias-label-primary) 66%,var(--dsw-alias-bg-base))}.rw-dialog input::placeholder,.rw-dialog textarea::placeholder{color:color-mix(in srgb,var(--dsw-alias-label-primary) 75%,var(--dsw-alias-bg-base));opacity:1}.rw-dialog .rw-link{color:var(--dsw-alias-label-primary);text-decoration:underline;text-underline-offset:3px}\n\n/* Chronological project timeline. Event groups preserve simultaneous dates without overlapping labels. */\n.rw-axis-help{margin:0 0 10px}.rw-paper-timelines{display:grid;gap:10px}.rw-paper-row{border:1.5px solid var(--rw-line);border-radius:8px;padding:12px 14px;min-width:0}.rw-paper-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.rw-paper-head .rw-project-title{font-size:14px!important}.rw-event-axis{display:flex;list-style:none;padding:0 0 8px;margin:14px 0 0;overflow-x:auto;gap:0}.rw-event-point{position:relative;flex:1 0 158px;min-width:0;padding:22px 14px 0 0;box-sizing:border-box;border-top:2px solid var(--rw-line)}.rw-event-point:before{content:'';position:absolute;left:0;top:-6px;width:9px;height:9px;border:1.5px solid var(--rw-ink);border-radius:50%;background:var(--dsw-alias-bg-base)}.rw-event-point>time{display:block;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;margin-top:-8px}.rw-event-labels{font-size:12px;line-height:1.6;overflow-wrap:anywhere;margin-top:5px}.rw-event-labels>div{margin:3px 0}.rw-event-estimated{color:var(--rw-secondary)}.rw-axis-pending{font-size:11px;color:var(--rw-secondary);margin-top:6px}.rw-stage-editor{display:grid;grid-template-columns:auto minmax(140px,1fr) 145px;gap:9px;align-items:end;border:1px solid var(--dsw-alias-label-secondary);border-radius:7px;padding:10px;margin:9px 0}.rw-stage-editor .rw-field,.rw-stage-add .rw-field{margin:0}.rw-stage-check{display:flex;align-items:center;gap:4px;font-size:12px;align-self:center}.rw-stage-add{display:grid;grid-template-columns:minmax(140px,1fr) 145px auto;gap:9px;align-items:end;margin:12px 0}.rw-stage-editor .rw-text-button{align-self:center}@media(max-width:650px){.rw-stage-editor,.rw-stage-add{grid-template-columns:1fr}.rw-event-point{flex-basis:155px}.rw-paper-row{padding:10px}}\n\n/* Open sections, bordered project cards, quiet action buttons. */\n.lwb-root{--rw-button-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-label-primary));--rw-button-line:color-mix(in srgb,var(--rw-button-color) 30%,var(--dsw-alias-bg-base));--rw-button-bg:color-mix(in srgb,var(--rw-button-color) 4%,var(--dsw-alias-bg-base));--rw-soft-rule:color-mix(in srgb,var(--rw-ink) 25%,var(--dsw-alias-bg-base))}\n.lwb-root .rw-block{border:0;border-radius:0;background:none;overflow:visible;margin-bottom:23px}\n.lwb-root .rw-block-heading,.lwb-root .rw-daily>summary{padding:7px 0 9px;background:none;min-height:24px}\n.lwb-root .rw-block[open]>.rw-block-heading{border-bottom:1px solid var(--rw-soft-rule)}\n.lwb-root .rw-block-content{padding:12px 0 0}\n.lwb-root .rw-section-title{border:0;padding-bottom:0;margin-bottom:8px}\n.lwb-root .rw-column{border:0;border-radius:0;background:none;padding:0 3px}\n.lwb-root .rw-daily .lwb-wide,.lwb-root .rw-daily .lwb-board,.lwb-root .lwb-daily-content>.rw-recent,.lwb-root .rw-activity{border:0;border-radius:0;background:none;padding:0}\n.lwb-root .lwb-daily-content>.rw-recent>.lwb-wide{padding:4px 0}\n.lwb-root .rw-project,.lwb-root .rw-paper-row{border:1px solid var(--rw-line);border-radius:8px}\n.lwb-root .rw-card-bottom,.lwb-root .rw-card-schedule,.lwb-root .rw-card-action,.lwb-root .rw-next,.lwb-root .rw-progress-log{border-color:var(--rw-soft-rule)}\n.lwb-root .rw-add-button,.lwb-root .rw-header-icon,.lwb-root .lwb-btn,.lwb-root .rw-text-button{border:1px solid var(--rw-button-line);background:var(--rw-button-bg);color:var(--dsw-alias-label-primary);border-radius:6px;font-weight:400}\n.lwb-root .rw-text-button{padding:4px 8px;line-height:1.5;text-decoration:none;white-space:nowrap}\n.lwb-root .rw-add-button:hover,.lwb-root .rw-header-icon:hover,.lwb-root .lwb-btn:hover,.lwb-root .rw-text-button:hover{background:color-mix(in srgb,var(--rw-button-color) 9%,var(--dsw-alias-bg-base));border-color:color-mix(in srgb,var(--rw-button-color) 48%,var(--dsw-alias-bg-base));text-decoration:none}\n.lwb-root .rw-header-icon:disabled{border-style:solid;color:var(--rw-secondary)}\n.rw-dialog .lwb-btn:not(.lwb-btn-primary),.rw-dialog .rw-text-button{border:1px solid color-mix(in srgb,var(--dsw-alias-state-business-primary,var(--dsw-alias-label-primary)) 30%,var(--dsw-alias-bg-base));background:color-mix(in srgb,var(--dsw-alias-state-business-primary,var(--dsw-alias-label-primary)) 4%,var(--dsw-alias-bg-base));border-radius:6px;color:var(--dsw-alias-label-primary)}\n.rw-dialog .rw-text-button{padding:4px 8px}\n@media(max-width:700px){.lwb-root .rw-block-heading,.lwb-root .rw-daily>summary{padding:7px 0 9px}.lwb-root .rw-block-content{padding:10px 0 0}}\n\n/* Course content uses the same project card surfaces and quiet actions. */\n.rw-course-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:12px}.rw-course-card{container-type:normal}.rw-course-meta{display:flex;flex-wrap:wrap;gap:7px 24px;margin:10px 0;font-size:12px}.rw-course-meta>div{display:flex;gap:9px;min-width:0}.rw-course-meta dt{color:var(--rw-secondary)}.rw-course-meta dd{margin:0;overflow-wrap:anywhere}.rw-course-upcoming{font-size:12px;line-height:1.8;margin:8px 0}.rw-course-plans{margin:12px 0 0}.rw-course-plan-preview{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:12px;padding:6px 0}.rw-course-plan-preview time{font-variant-numeric:tabular-nums;color:var(--rw-secondary)}.rw-course-plan-preview p{grid-column:2;margin:0;white-space:pre-wrap;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.rw-calendar{margin:14px 0 7px;min-width:0}.rw-calendar-head{display:flex;align-items:center;gap:6px;margin-bottom:10px;font-size:13px}.rw-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}.rw-calendar-weekday{text-align:center;font-size:11px;color:var(--rw-secondary);padding:4px}.rw-calendar-day{font:inherit;min-height:47px;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3px;padding:6px 2px;border:1px solid transparent;border-radius:5px;color:var(--dsw-alias-label-primary);background:none;cursor:pointer;font-size:12px}.rw-calendar-day small{font-size:10px;line-height:1.3;overflow-wrap:anywhere}.rw-calendar-class{border-color:var(--dsw-alias-border-l2,var(--dsw-alias-label-secondary));font-weight:600}.rw-calendar-selected{outline:2px solid var(--dsw-alias-label-primary);outline-offset:-2px;background:var(--dsw-alias-bg-layer-2)}.rw-calendar-agenda{font-size:12px;line-height:1.8;margin-top:10px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1)}.rw-calendar-agenda strong{font-size:11px}.rw-course-dialog{width:min(940px,calc(100vw - 48px))}.rw-course-dialog .rw-calendar{max-width:550px;margin:18px auto}.rw-course-dialog .rw-calendar-day{min-height:52px}.rw-class-row{display:grid;grid-template-columns:minmax(130px,1.1fr) minmax(95px,.8fr) minmax(95px,.8fr) minmax(100px,1fr) auto;gap:9px;align-items:end;margin:12px 0}.rw-class-row .rw-field{margin:0}.rw-class-row .rw-text-button{align-self:center}.rw-button-gap{margin-left:8px}.rw-plan-heading{display:flex;align-items:center;gap:10px;margin-top:24px}.rw-plan-heading h3{margin:0!important}.rw-week-plan{border:0;margin:15px 0 20px}.rw-week-plan>summary{cursor:pointer;font-size:13px;font-weight:600;border-bottom:1px solid var(--dsw-alias-border-l1);padding:8px 0}.rw-week-body{padding:13px 0 0}.rw-course-files{margin:10px 0}.rw-course-files .lwb-drop-area{padding:12px}.rw-course-dialog .lwb-err{max-width:none}.rw-course-dialog .rw-calendar-selected{background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,var(--dsw-alias-bg-base))}@media(max-width:650px){.rw-class-row{grid-template-columns:1fr 1fr}.rw-class-row .rw-field:first-child{grid-column:1/-1}.rw-course-meta{display:grid;gap:7px}.rw-course-grid{grid-template-columns:1fr}}\n\n.rw-calendar-head .rw-month-picker{width:155px;max-width:55%;font-size:12px;padding:6px 8px;flex:0 1 155px}.rw-course-card{container-name:course-card;container-type:inline-size}.rw-course-body{min-width:0}.rw-course-with-calendar .rw-course-plans{margin-top:14px}@container course-card (min-width:720px){.rw-course-with-calendar{display:grid;grid-template-columns:minmax(280px,.95fr) minmax(220px,1.05fr);gap:24px;align-items:start;margin-top:12px}.rw-course-with-calendar .rw-calendar{margin:0}.rw-course-with-calendar .rw-course-plans{margin:0;padding-left:20px;border-left:1px solid var(--rw-soft-rule);min-height:100px}}\n\n.rw-flash{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary);max-width:min(340px,40vw);overflow-wrap:anywhere}.rw-dialog-foot .rw-flash{max-width:45%}@media(max-width:700px){.lwb-head .rw-flash{max-width:35vw;font-size:11px}}\n\n.lwb-root .lwb-title{font-size:18px;font-weight:600;line-height:1.4;letter-spacing:normal;margin:0;gap:10px}.rw-title-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;color:inherit}.rw-title-icon .lwb-svg{width:22px;height:22px;display:block}\n\n/* Placeholder and empty-state copy recedes; entered content and errors retain their hierarchy. */\n.lwb-root,.rw-dialog{--rw-hint:color-mix(in srgb,var(--dsw-alias-label-primary) 38%,var(--dsw-alias-bg-base))}\n.lwb-root .rw-next p.rw-placeholder,.lwb-root .rw-placeholder,.lwb-root .rw-undated,.lwb-root .rw-axis-pending,.lwb-root .rw-empty,.lwb-root .lwb-empty,.lwb-root .rw-help,.rw-dialog .rw-help,.rw-dialog .rw-placeholder{color:var(--rw-hint);font-weight:400}\n.lwb-root input::placeholder,.lwb-root textarea::placeholder,.rw-dialog input::placeholder,.rw-dialog textarea::placeholder{color:var(--rw-hint);opacity:1;font-weight:400}\n\n/* Compact, consistent, unframed header actions. */\n.rw-header-actions{display:flex;align-items:center;gap:4px;flex:none}.lwb-root .rw-header-actions .rw-header-icon{width:28px;height:28px;min-width:28px;padding:5px;box-sizing:border-box;border:0;border-radius:5px;background:none;color:color-mix(in srgb,var(--rw-ink) 68%,var(--dsw-alias-bg-base));display:flex;align-items:center;justify-content:center;cursor:pointer}.rw-header-actions .rw-header-icon>span{display:flex;align-items:center;justify-content:center}.lwb-root .rw-header-actions .lwb-svg{width:18px;height:18px;stroke-width:1.7}.lwb-root .rw-header-actions .rw-header-icon:hover{border:0;background:color-mix(in srgb,var(--rw-ink) 5%,var(--dsw-alias-bg-base));color:var(--rw-ink)}.lwb-root .rw-header-actions .rw-header-icon[aria-pressed=true]{background:color-mix(in srgb,var(--rw-ink) 8%,var(--dsw-alias-bg-base));color:var(--rw-ink)}.lwb-root .rw-header-actions .rw-header-icon:disabled{border:0;opacity:.4;cursor:default}.lwb-head{gap:8px}\n\n/* Original daily reading order: execution, completed work, then notes. */\n.lwb-root .lwb-daily-content{display:flex;flex-direction:column;gap:0}.lwb-root .lwb-daily-section{min-width:0;padding:14px 0;border:0;background:none}.lwb-root .lwb-daily-section:first-child{padding-top:0}.lwb-root .lwb-daily-section+.lwb-daily-section{border-top:1px solid var(--rw-soft-rule)}.lwb-root .rw-daily .lwb-daily-section .lwb-pane-title{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:550;line-height:1.5;letter-spacing:normal;text-transform:none;color:var(--rw-secondary);margin:0 0 10px;padding:0}.lwb-root .rw-daily .lwb-daily-section .lwb-pane-title:before{content:'';width:5px;height:5px;flex:none;border-radius:50%;background:var(--rw-secondary);opacity:1}.lwb-root .lwb-daily-section .lwb-count{font-size:11px;font-weight:400;color:var(--rw-hint)}.lwb-root .lwb-daily-section .lwb-pane-full{padding:0}.lwb-root .lwb-daily-section .lwb-done-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:2px 20px}.lwb-root .lwb-daily-notes .lwb-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:8px;align-items:start}.lwb-root .lwb-daily-notes .lwb-note{margin:0;border-radius:5px;background:none;padding:8px 28px 8px 0}.lwb-root .lwb-daily-exec .lwb-row{flex-wrap:wrap}.lwb-root .lwb-daily-exec .lwb-row>.lwb-input:not(:first-child){min-width:160px;flex:1}@media(max-width:650px){.lwb-root .lwb-daily-section{padding:12px 0}.lwb-root .lwb-daily-section .lwb-done-grid{grid-template-columns:1fr}}\n\n/* All research projects share one proportional calendar, with project rows aligned below it. */\n.rw-shared-gantt{min-width:0}.rw-gantt-tools{display:flex;align-items:center;gap:10px;margin:0 0 10px}.rw-gantt-current{font-size:11px;color:var(--rw-secondary);font-variant-numeric:tabular-nums}.rw-gantt-tools .rw-gantt-scale{font-size:11px;padding:4px 7px;border-color:var(--rw-button-line);width:auto;background:none}.rw-gantt-scroll{overflow:auto;max-width:100%;padding-bottom:4px;scrollbar-gutter:stable;outline-offset:2px}.rw-gantt-table{min-width:0}.rw-gantt-header,.rw-gantt-row{display:grid;grid-template-columns:var(--rw-label-width) var(--rw-chart-width);box-sizing:border-box}.rw-gantt-header{position:relative;border:1px solid transparent;margin-bottom:8px;height:78px}.rw-gantt-label{position:sticky;left:0;z-index:4;min-width:0;box-sizing:border-box;background:var(--dsw-alias-bg-base);padding:12px;border-right:1px solid var(--rw-soft-rule)}.rw-gantt-label-heading{font-size:12px;font-weight:550;display:flex;align-items:center;padding-left:0;color:var(--rw-secondary);border-right:0}.rw-gantt-calendar{position:relative;min-width:0;background:var(--dsw-alias-bg-base)}.rw-gantt-years,.rw-gantt-months,.rw-gantt-days{position:relative;height:24px;border-bottom:1px solid var(--rw-soft-rule);box-sizing:border-box;overflow:hidden}.rw-gantt-years>span,.rw-gantt-months>span{position:absolute;top:0;bottom:0;box-sizing:border-box;border-left:1px solid var(--rw-soft-rule);padding:3px 7px;overflow:hidden;white-space:nowrap;font-size:11px}.rw-gantt-years>span{font-weight:600;color:var(--rw-ink)}.rw-gantt-months>span{color:var(--rw-secondary)}.rw-gantt-days{height:28px}.rw-gantt-days>span{position:absolute;top:6px;transform:translateX(-50%);font-size:10px;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--rw-secondary)}.rw-gantt-days>span.rw-gantt-weekend{color:var(--rw-hint)}.rw-gantt-row{position:relative;border:1px solid var(--rw-line);border-radius:7px;margin:0 0 9px;background:var(--dsw-alias-bg-base)}.rw-gantt-row>.rw-gantt-label{border-radius:6px 0 0 6px}.rw-gantt-project-heading{display:flex;align-items:flex-start;gap:7px;margin-bottom:7px}.rw-gantt-project-heading .rw-project-title{font-size:12px!important;line-height:1.5}.rw-gantt-swatch{width:7px;height:7px;flex:none;border-radius:2px;background:var(--rw-project-color);margin-top:5px}.rw-gantt-label .rw-status{display:inline-block;font-size:10px}.rw-gantt-label .rw-collaborators,.rw-gantt-stage{font-size:11px;line-height:1.5;margin-top:6px;overflow-wrap:anywhere}.rw-gantt-stage{color:var(--rw-secondary)}.rw-gantt-lane{position:relative;min-width:0;overflow:hidden;border-radius:0 6px 6px 0}.rw-gantt-gridline{position:absolute;top:0;bottom:0;width:1px;background:color-mix(in srgb,var(--rw-ink) 10%,var(--dsw-alias-bg-base));z-index:0;pointer-events:none}.rw-gantt-today{position:absolute;top:0;bottom:0;z-index:1;width:1.5px;background:var(--rw-ink);opacity:.55;pointer-events:none}.rw-gantt-calendar .rw-gantt-today{top:48px;opacity:1}.rw-gantt-calendar .rw-gantt-today:before{content:'';position:absolute;left:-3px;top:0;width:7px;height:5px;background:var(--rw-ink);clip-path:polygon(0 0,100% 0,50% 100%)}.rw-gantt-bar{position:absolute;top:22px;height:16px;min-width:4px;box-sizing:border-box;border:1px solid var(--rw-project-color);border-radius:3px;background:color-mix(in srgb,var(--rw-project-color) 70%,var(--dsw-alias-bg-base));z-index:2}.rw-gantt-node{position:absolute;top:24px;z-index:3;width:12px;height:12px;box-sizing:border-box;border:2px solid var(--dsw-alias-bg-base);border-radius:50%;padding:0;background:var(--rw-project-color);outline:1px solid var(--rw-project-color);transform:translateX(-50%);cursor:pointer}.rw-gantt-node.rw-gantt-estimated{background:var(--dsw-alias-bg-base);border-color:var(--rw-project-color);outline:0}.rw-gantt-stem{position:absolute;top:30px;width:1px;background:color-mix(in srgb,var(--rw-project-color) 35%,var(--dsw-alias-bg-base));z-index:0;pointer-events:none}.rw-gantt-caption{position:absolute;box-sizing:border-box;text-align:left;display:flex;gap:6px;align-items:baseline;min-width:0;font:inherit;line-height:1.6;font-size:11px;color:var(--rw-ink);padding:1px 2px;background:var(--dsw-alias-bg-base);border:0;cursor:pointer;z-index:2}.rw-gantt-caption time{font-size:10px;font-variant-numeric:tabular-nums;color:var(--rw-secondary);white-space:nowrap;flex:none}.rw-gantt-caption>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rw-gantt-caption:hover>span{text-decoration:underline;text-underline-offset:2px}.rw-gantt-pending{position:absolute;bottom:6px;left:8px;right:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;font-size:10px}.rw-gantt-future{position:absolute;top:22px;font-size:10px;white-space:nowrap;padding-left:12px}.rw-gantt-scroll:focus-visible{outline:1px solid var(--rw-line)}\n\n.rw-gantt-caption{flex-direction:column;align-items:flex-start;gap:0;height:36px}.rw-gantt-caption>span{display:block;max-width:100%;line-height:1.6}.rw-gantt-caption time{line-height:1.5}\n\n/* Shared course calendar: course colors identify lessons; status is also explicit in text. */\n.rw-teaching-calendar{min-width:0}.rw-teaching-calendar .rw-calendar-head{margin:0 0 12px}.rw-teach-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:0;border-top:1px solid var(--rw-soft-rule);border-left:1px solid var(--rw-soft-rule)}.rw-teach-weekday{padding:6px;text-align:center;font-size:11px;color:var(--rw-secondary);border-right:1px solid var(--rw-soft-rule);border-bottom:1px solid var(--rw-soft-rule)}.rw-teach-day{min-height:96px;min-width:0;padding:5px;box-sizing:border-box;border-right:1px solid var(--rw-soft-rule);border-bottom:1px solid var(--rw-soft-rule);background:var(--dsw-alias-bg-base)}.rw-teach-blank{background:color-mix(in srgb,var(--rw-ink) 2%,var(--dsw-alias-bg-base))}.rw-teach-selected{box-shadow:inset 0 0 0 1.5px var(--rw-ink)!important}.rw-teach-date{display:flex;align-items:center;justify-content:center;min-width:23px;height:23px;padding:0 4px;border:0;background:none;color:var(--rw-ink);font:inherit;font-size:11px;cursor:pointer;border-radius:4px;margin:0 0 4px}.rw-teach-today>.rw-teach-date{background:var(--rw-ink);color:var(--dsw-alias-bg-base)}.rw-teach-event{display:flex;align-items:center;gap:4px;min-width:0;width:100%;font:inherit;font-size:11px;line-height:1.5;padding:4px 5px;margin:3px 0;border:1px solid color-mix(in srgb,var(--rw-course-color) 35%,var(--dsw-alias-bg-base));border-left:3px solid var(--rw-course-color);border-radius:3px;background:color-mix(in srgb,var(--rw-course-color) 6%,var(--dsw-alias-bg-base));color:var(--rw-ink);text-align:left;cursor:pointer}.rw-teach-event-time{white-space:nowrap;font-size:10px;font-variant-numeric:tabular-nums;flex:none}.rw-teach-event-name{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.rw-teach-event.rw-lesson-completed{background:color-mix(in srgb,var(--rw-course-color) 22%,var(--dsw-alias-bg-base));border-color:var(--rw-course-color)}.rw-teach-event.rw-lesson-pending{border-style:dashed;border-left-style:solid;background:none}.rw-teach-event.rw-lesson-today{border-color:var(--rw-course-color)}.rw-teach-pending-mark{font-size:10px;margin-left:auto;color:var(--rw-secondary)}.rw-teach-legend{display:flex;flex-wrap:wrap;gap:10px 24px;padding:13px 0 8px}.rw-teach-legend-course{display:flex;align-items:center;gap:7px;min-width:0}.rw-course-square{display:block;width:9px;height:9px;border-radius:2px;flex:none}.rw-course-name{font:inherit;font-size:12px;font-weight:550;color:var(--rw-ink);border:0;background:none;padding:0;text-align:left;cursor:pointer;overflow-wrap:anywhere}.rw-course-name:hover{text-decoration:underline;text-underline-offset:3px}.rw-teach-progress{font-size:11px;color:var(--rw-secondary);white-space:nowrap;font-variant-numeric:tabular-nums}.rw-teach-status-key{display:flex;flex-wrap:wrap;gap:16px;font-size:10px;color:var(--rw-hint);padding:2px 0 12px}.rw-teach-agenda{border-top:1px solid var(--rw-soft-rule);padding-top:12px;font-size:12px}.rw-teach-agenda h3{font-size:12px;font-weight:550;margin:0 0 7px;font-variant-numeric:tabular-nums}.rw-teach-agenda-item{display:flex;align-items:center;gap:12px;padding:9px 0}.rw-teach-agenda-item+.rw-teach-agenda-item{border-top:1px solid var(--rw-soft-rule)}.rw-teach-agenda-detail{min-width:0;flex:1}.rw-teach-agenda-detail>div{font-size:11px;line-height:1.6;color:var(--rw-secondary);margin-top:3px}.rw-lecture-check{display:flex;gap:6px;align-items:center;white-space:nowrap;font-size:11px}.rw-lecture-check input{accent-color:var(--rw-course-color);margin:0}.rw-teach-session-state{font-size:10px;color:var(--rw-hint)}.rw-teach-agenda-plan{margin-top:12px;padding-top:10px;border-top:1px solid var(--rw-soft-rule)}.rw-teach-agenda-plan p{margin:5px 0;white-space:pre-wrap}.rw-teach-agenda-plan>.rw-text-button{margin-top:7px}@media(max-width:850px){.rw-teach-event{flex-wrap:wrap;gap:0 4px}.rw-teach-event-name{width:100%;font-size:10px}.rw-teach-day{min-height:90px;padding:3px}.rw-teach-session-state{display:none}}@media(max-width:600px){.rw-teach-day{min-height:78px;padding:2px}.rw-teach-event{padding:3px 2px;border-left-width:2px}.rw-teach-event-time{font-size:9px}.rw-teach-event-name{font-size:9px}.rw-teach-progress{font-size:10px}.rw-teach-legend{gap:9px 18px}.rw-teach-agenda-item{gap:8px}}\n\n.lwb-root .lwb-head{border-bottom:0}\n\n/* Secondary daily panes share a responsive row; completed work is a light-dismiss top-layer card. */\n.rw-daily>.rw-block-content{container-name:daily-panel;container-type:inline-size}.lwb-root .lwb-daily-content{display:grid;grid-template-columns:minmax(0,1fr);gap:0;align-items:start}.lwb-root .lwb-daily-content>.lwb-daily-section{padding:0;border:0;min-width:0}.lwb-root .lwb-daily-content>.lwb-daily-notes{padding-top:14px;margin-top:14px;border-top:1px solid var(--rw-soft-rule)}.lwb-root .rw-history-trigger{display:inline-flex;align-items:center;justify-content:center;flex:none;width:26px;height:26px;margin:0 0 0 3px;padding:4px;border:0;border-radius:5px;background:none;color:var(--rw-secondary);cursor:pointer}.rw-history-trigger>span{display:flex}.lwb-root .rw-history-trigger .lwb-svg{width:17px;height:17px;stroke-width:1.7}.lwb-root .rw-history-trigger:hover{background:color-mix(in srgb,var(--rw-ink) 6%,var(--dsw-alias-bg-base));color:var(--rw-ink)}.lwb-root .rw-recent-popover{position:fixed;inset:0;margin:auto;width:min(580px,calc(100vw - 32px));max-height:min(460px,75vh);box-sizing:border-box;overflow:auto;padding:0;border:1px solid var(--rw-line);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--rw-ink);font-family:inherit;font-size:12px}.rw-recent-popover::backdrop{background:transparent}.lwb-root .rw-daily .rw-recent-popover .lwb-pane-full{padding:16px 18px}.lwb-root .rw-daily .rw-recent-popover .lwb-pane-title{font-size:13px;line-height:1.5;letter-spacing:normal;text-transform:none;color:var(--rw-ink);margin:0 0 11px;font-weight:550;gap:8px}.lwb-root .rw-recent-popover .lwb-pane-title:before{display:none}.lwb-root .rw-history-close{border:0;background:none;color:var(--rw-secondary);font:inherit;font-size:20px;line-height:1;width:24px;height:24px;border-radius:4px;cursor:pointer;padding:0}.lwb-root .rw-history-close:hover{color:var(--rw-ink);background:var(--dsw-alias-bg-layer-2)}.lwb-root .rw-recent-popover .lwb-done-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:3px 16px}.lwb-root .rw-recent-popover .lwb-item{padding:7px 0}.lwb-root .rw-recent-popover .lwb-check{flex:none}.lwb-root .rw-recent-popover .lwb-tag{font-size:10px}.rw-history-trigger:focus-visible,.rw-history-close:focus-visible{outline:2px solid var(--rw-ink);outline-offset:2px}\n@container daily-panel (min-width:800px){.lwb-root .lwb-daily-content{grid-template-columns:minmax(0,1fr);gap:0}.lwb-root .lwb-daily-content>.lwb-daily-notes{padding:0 0 0 20px;margin:0;border-top:0;border-left:1px solid var(--rw-soft-rule)}}\n"
    function installFunctionTooltips(){
      if(!document.body?.appendChild)return()=>{}
      const tip=document.createElement('div'),id='rw-function-tooltip-'+Date.now().toString(36)
      tip.className='rw-function-tooltip';tip.id=id;tip.setAttribute('role','tooltip');tip.hidden=true;document.body.appendChild(tip)
      let anchor=null,timer=null,oldTitle=''
      function hide(){if(timer!==null){clearTimeout(timer);timer=null}if(anchor){if(oldTitle&&!anchor.hasAttribute('title'))anchor.setAttribute('title',oldTitle);const described=(anchor.getAttribute('aria-describedby') || '').split(/\s+/).filter(x=>x&&x!==id).join(' ');if(described)anchor.setAttribute('aria-describedby',described);else anchor.removeAttribute('aria-describedby')}anchor=null;oldTitle='';tip.hidden=true}
      function show(button,immediate=false){
        if(anchor===button)return
        hide()
        let text=button.getAttribute('title') || button.getAttribute('aria-label') || button.textContent || ''
        text=(button.classList.contains('rw-person-name')?text:text.replace(/\s+/g,' ')).trim();tip.style.whiteSpace='pre-line';if(!text)return
        anchor=button;oldTitle=button.getAttribute('title') || '';if(oldTitle)button.removeAttribute('title')
        const reveal=()=>{timer=null;if(!anchor?.isConnected){hide();return}const layer=anchor.closest('dialog[open], [popover]:popover-open') || document.body;if(tip.parentNode!==layer)layer.appendChild(tip);tip.textContent=text;tip.hidden=false;tip.style.left='0px';tip.style.top='0px';const rect=anchor.getBoundingClientRect(),box=tip.getBoundingClientRect(),x=Math.max(8,Math.min(rect.left+(rect.width-box.width)/2,window.innerWidth-box.width-8)),y=rect.top-box.height-7>=8?rect.top-box.height-7:Math.min(window.innerHeight-box.height-8,rect.bottom+7);tip.style.left=x+'px';tip.style.top=Math.max(8,y)+'px';anchor.setAttribute('aria-describedby',[(anchor.getAttribute('aria-describedby') || ''),id].filter(Boolean).join(' '))}
        if(immediate)reveal();else timer=setTimeout(reveal,160)
      }
      function target(event){const button=event.target?.closest?.('button,.rw-person-name,.rw-person-mail,.rw-task-dot');return button?.closest('.lwb-root,.rw-dialog')?button:null}
      const over=event=>{const button=target(event);if(button)show(button)},out=event=>{if(anchor&&!anchor.contains(event.relatedTarget))hide()},focus=event=>{const button=target(event);if(button)show(button,true)},blur=()=>hide(),key=event=>{if(event.key==='Escape')hide()}
      document.addEventListener('pointerover',over);document.addEventListener('pointerout',out);document.addEventListener('focusin',focus);document.addEventListener('focusout',blur);document.addEventListener('pointerdown',hide);document.addEventListener('scroll',hide,true);document.addEventListener('keydown',key);window.addEventListener('resize',hide)
      return()=>{hide();document.removeEventListener('pointerover',over);document.removeEventListener('pointerout',out);document.removeEventListener('focusin',focus);document.removeEventListener('focusout',blur);document.removeEventListener('pointerdown',hide);document.removeEventListener('scroll',hide,true);document.removeEventListener('keydown',key);window.removeEventListener('resize',hide);tip.remove()}
    }

    exports.inject = ['slots','sessions','workspaces','uiWorkspace','layout']

    exports.apply = function (ctx) {
      const slots = ctx.get('slots')
      if (slots === undefined) {
        console.error('[life-workbench] slots 服务不可用')
        return
      }

      ctx.effect(() => insertStyles(CSS + RESEARCH_CSS + AI_ENTRY_CSS + ACTION_NOTES_CSS + CONTACTS_CSS + COMPACT_TIME_CSS + WRAPPED_GANTT_CSS + AGENDA_CSS + STATUS_TOOLTIP_CSS + AI_CONTROLS_CSS + SUMMARY_CSS + POLISH_CSS + DESTINATION_CSS + UNIFIED_DAILY_CSS + HEADING_ICONS_CSS + SUMMARY_CLEAN_CSS + WEATHER_CSS + STATUS_TONE_CSS + STARTUP_CSS + NEAR_POPOVER_CSS + ARCHIVE_CSS))

      ctx.effect(()=>installFunctionTooltips())
      const todayKey = function () {
        const d = new Date()
        const pad = function (n) { return String(n).length < 2 ? '0' + String(n) : String(n) }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
      }

      let snapshot = {
        status: 'loading', tab: 'overview',
        contacts: [], calendarEvents: [], calendarSync:{}, calendarSyncing:false, calendarError:'', projects: [], boards: [], files: [], notes: [], schedule: [], history: {},
        refreshing: false, saving: false, noticePending: false,
        today: '', path: '', error: '', notice: '', rolled: false, migrated: false, storage: '',
      }
      const listeners = new Set()
      let noticeTimer=null
      ctx.effect(()=>()=>{if(noticeTimer!==null)clearTimeout(noticeTimer)})

      function publish(patch) {
        if(Object.prototype.hasOwnProperty.call(patch,'notice')){
          if(noticeTimer!==null){clearTimeout(noticeTimer);noticeTimer=null}
          patch=Object.assign({noticePending:false},patch)
          if(patch.notice && !patch.noticePending)noticeTimer=setTimeout(()=>{noticeTimer=null;publish({notice:''})},3000)
        }
        snapshot = Object.assign({}, snapshot, patch)
        listeners.forEach(function (listener) {
          try { listener() } catch (error) { console.error('[life-workbench] listener failed', error) }
        })
      }

      function StatusNotice({view}) {
        const message=view.noticePending?view.notice:view.saving?'保存中…':view.notice
        return message?E('span',{className:'rw-flash',role:'status','aria-live':'polite'},message):null
      }

      function isBirthday(item){
  if(!item || typeof item!=='object')return false
  if(item.isBirthday===true || item.calendarType==='birthday')return true
  return [item.title,item.text,item.calendarTitle].some(value=>typeof value==='string'&&/(?:生日|生辰|寿辰|壽辰|\bbirthdays?\b|\bb[ -]?day\b)/iu.test(value))
}
      function isValidCalendarTask(item){
  if(!item || isBirthday(item))return false
  const title=String(item.title || '').trim()
  if(!title)return false
  const terms=new Set('立春 雨水 惊蛰 春分 清明 谷雨 立夏 小满 芒种 夏至 小暑 大暑 立秋 处暑 白露 秋分 寒露 霜降 立冬 小雪 大雪 冬至 小寒 大寒'.split(' '))
  const term=title.replace(/(?:\d{4}年|节气|二十四|[·：:（）()\s])/g,'')
  if(terms.has(term))return false
  if(item.allDay&&/(?:节假日|节气|holidays?)/i.test(item.calendarTitle || '')&&!item.location)return false
  return true
}
      function calendarInWeek(e,today){return isValidCalendarTask(e)&&Array.from({length:7},(_,i)=>shiftDay(today,i)).some(day=>calendarOnDay(e,day))}
      function withoutBirthdays(view){
        return {...view,calendarEvents:(view.calendarEvents || []).filter(isValidCalendarTask),boards:(view.boards || []).map(b=>({...b,cards:(b.cards || []).filter(c=>!isBirthday(c))})),schedule:(view.schedule || []).filter(s=>!isBirthday(s))}
      }
      function useSnapshot() {
        const pair = React.useState(snapshot),currentDay=useCalendarToday()
        const setValue = pair[1]
        React.useEffect(function () {
          const listener = function () { setValue(snapshot) }
          listeners.add(listener)
          setValue(snapshot)
          return function () { listeners.delete(listener) }
        }, [])
        return React.useMemo(()=>{const raw=withoutBirthdays(pair[0]),view={...raw,...reconcileCollaborators(raw.projects,raw.contacts)};return {...view,projects:view.projects.map(p=>p.kind==='course'?{...p,status:courseStatus(p,currentDay)}:p)}},[pair[0],currentDay])
      }

      let seq = 0
      function nextId(prefix) { seq = seq + 1; return prefix + '-' + Date.now().toString(36) + '-' + seq }

      let chain = Promise.resolve()
      let mutations = 0
      let pendingWrites = 0
      let saveFailed = false
      let hasLoaded = false
      function persist(patch) {
        if (!hasLoaded) { publish({error:'请先成功读取工作台，再保存修改'}); return }
        mutations += 1
        pendingWrites += 1
        publish(Object.assign({}, patch, {saving:true},snapshot.noticePending?{}:{notice:''}))
        const payload = {
          version: 7,
          sortPreferences: snapshot.sortPreferences || {},
          deletedItems: snapshot.deletedItems || [],
          projectTrash: snapshot.projectTrash || [],
          projects: patch.projects !== undefined ? patch.projects : snapshot.projects,
          dailyStamp: snapshot.today || todayKey(),
          style: 'glass',
          boards: patch.boards !== undefined ? patch.boards : snapshot.boards,
          files: patch.files !== undefined ? patch.files : snapshot.files,
          links: [],
          notes: patch.notes !== undefined ? patch.notes : snapshot.notes,
          schedule: patch.schedule !== undefined ? patch.schedule : snapshot.schedule,
          history: snapshot.history,
        }
        chain = chain.then(async function () {
          try {
            const res = await hostCall('save', { state: payload })
            if (res !== null && res !== undefined && res.ok === true) { saveFailed = false; publish({ error: '' }) }
            else { saveFailed = true; publish({ error: res !== null && res !== undefined && res.error ? String(res.error) : '保存失败' }) }
          } catch (error) {
            saveFailed = true
            publish({ error: String(error !== null && error !== undefined && error.message ? error.message : error) })
          } finally { pendingWrites -= 1; publish(Object.assign({saving:pendingWrites>0},pendingWrites===0&&!saveFailed&&!snapshot.noticePending&&!snapshot.notice?{notice:'已保存'}:{})) }
        })
      }

      async function load(manual = false) {
        if (snapshot.refreshing) return false
        if (manual) { await chain; if (saveFailed) { publish({notice: '保存尚未成功，已保留当前编辑。请先重试保存。'}); return false } }
        const revision = mutations
        publish({refreshing: true})
        try {
          const res = await hostCall('load', {})
          if (res !== null && res !== undefined && res.ok === true) {
            if (mutations !== revision) { publish({notice: '刷新期间有新编辑，已保留当前内容。'}); return false }
            hasLoaded = true
            const state = res.state !== null && res.state !== undefined ? res.state : {}
            publish({
              status: 'ready',
              sortPreferences: state.sortPreferences || {},
              deletedItems: state.deletedItems || [],
              projectTrash: state.projectTrash || [],
              calendarEvents: Array.isArray(state.calendarEvents)?state.calendarEvents:[],
              calendarSync:state.calendarSync || {},
              contacts: Array.isArray(state.contacts)?state.contacts:[],
              projects: Array.isArray(state.projects) ? state.projects.map(p=>p.kind==='paper'?{...p,plannedDate:projectPlanDate(p)}:p) : [],
              notice: manual ? '已刷新' : '已同步',
              boards: Array.isArray(state.boards) ? state.boards : [],
              files: Array.isArray(state.files) ? state.files : [],
              notes: Array.isArray(state.notes) ? state.notes : [],
              schedule: Array.isArray(state.schedule) ? state.schedule : [],
              history: state.history !== null && state.history !== undefined && typeof state.history === 'object' ? state.history : {},
              today: res.today ? String(res.today) : todayKey(),
              path: res.path ? String(res.path) : '',
              rolled: res.rolled === true,
              migrated: res.migrated === true,
              storage: res.storage ? String(res.storage) : '',
              error: '',
            })
            return true
          } else {
            publish({ status: 'ready', error: res !== null && res !== undefined && res.error ? String(res.error) : '加载失败' })
          }
        } catch (error) {
          publish({ status: 'ready', error: String(error !== null && error !== undefined && error.message ? error.message : error) })
        } finally { publish({refreshing: false}) }
        return false
      }

      let clientRefreshPending = false
      async function refreshHarness(){
        if(clientRefreshPending)return false
        clientRefreshPending=true
        publish({clientRefreshing:true})
        try{
          if(!await load(true))return false
          // Writes started while the data request was completing must settle too.
          do { await chain } while(pendingWrites>0)
          if(saveFailed){publish({notice:'保存尚未成功，已保留当前编辑。请先重试保存。'});return false}
          window.location.reload()
          return true
        }catch(error){publish({error:'客户端刷新失败：'+String(error?.message || error)});return false}
        finally{clientRefreshPending=false;publish({clientRefreshing:false})}
      }

      function patchBoard(boardId, mutate) {
        persist({
          boards: snapshot.boards.map(function (board) {
            if (board === null || board === undefined || board.id !== boardId) return board
            return mutate(board)
          }),
        })
      }
      function addBoard(title) { persist({ boards: snapshot.boards.concat([{ id: nextId('board'), title: title, cards: [] }]) }) }
      function recycleEntry(kind,data,extra={}){return {id:nextId('deleted'),kind,data:JSON.parse(JSON.stringify(data)),deletedAt:new Date().toISOString(),...extra}}
      function removeBoard(boardId) {const board=snapshot.boards.find(b=>b.id===boardId);if(!board)return;persist({boards:snapshot.boards.filter(b=>b.id!==boardId),deletedItems:[recycleEntry('board',board),...(snapshot.deletedItems || [])]})}
      function restoreDeleted(id){
        const entry=(snapshot.deletedItems || []).find(x=>x.id===id);if(!entry)return
        const patch={deletedItems:snapshot.deletedItems.filter(x=>x.id!==id)}
        if(entry.kind==='board'){const existing=snapshot.boards.find(b=>b.id===entry.data.id);patch.boards=existing?snapshot.boards.map(b=>b.id===existing.id?{...entry.data,...b,cards:[...(b.cards || []),...(entry.data.cards || []).filter(c=>!(b.cards || []).some(x=>x.id===c.id))]}:b):[...snapshot.boards,entry.data]}
        else if(entry.kind==='slot')patch.schedule=[...snapshot.schedule.filter(x=>x.id!==entry.data.id),entry.data]
        else {let boards=snapshot.boards;let board=boards.find(b=>b.id===entry.boardId);if(!board){board={id:entry.boardId || nextId('board'),title:entry.boardTitle || '每日事项',cards:[]};boards=[...boards,board]}patch.boards=boards.map(b=>b.id===board.id?{...b,cards:[...(b.cards || []).filter(c=>c.id!==entry.data.id),entry.data]}:b)}
        persist(patch)
      }

      function addCard(boardId, title) {
        patchBoard(boardId, function (board) {
          const cards = Array.isArray(board.cards) ? board.cards : []
          return Object.assign({}, board, {
            cards: cards.concat([{ id: nextId('card'), title: title, done: false, createdAt: todayKey(), doneAt: null }]),
          })
        })
      }
      function toggleCard(boardId, cardId) {
        patchBoard(boardId, function (board) {
          const cards = Array.isArray(board.cards) ? board.cards : []
          return Object.assign({}, board, {
            cards: cards.map(function (card) {
              if (card === null || card === undefined || card.id !== cardId) return card
              const nextDone = card.done !== true
              return Object.assign({}, card, { done: nextDone, doneAt: nextDone ? todayKey() : null })
            }),
          })
        })
      }
      function renameCard(boardId, cardId, title) {
        patchBoard(boardId, function (board) {
          const cards = Array.isArray(board.cards) ? board.cards : []
          return Object.assign({}, board, {
            cards: cards.map(function (card) {
              if (card === null || card === undefined || card.id !== cardId) return card
              return Object.assign({}, card, { title: title })
            }),
          })
        })
      }
      function removeCard(boardId,cardId){const board=snapshot.boards.find(b=>b.id===boardId),card=board?.cards?.find(c=>c.id===cardId);if(!card)return;persist({boards:snapshot.boards.map(b=>b.id===boardId?{...b,cards:b.cards.filter(c=>c.id!==cardId)}:b),deletedItems:[recycleEntry('card',card,{boardId,boardTitle:board.title}),...(snapshot.deletedItems || [])]})}
      function removeFile(fileId) { persist({ files: snapshot.files.filter(function (f) { return f === null || f === undefined || f.id !== fileId }) }) }

      function ownerOf(file, boards) {
        if (file?.projectId) { const project=snapshot.projects.find(p=>p.id===file.projectId); if(project)return {cardTitle:project.title} }
        if (file === null || file === undefined || !file.cardId) return null
        for (let i = 0; i < boards.length; i += 1) {
          const board = boards[i]
          if (board === null || board === undefined) continue
          const cards = Array.isArray(board.cards) ? board.cards : []
          for (let j = 0; j < cards.length; j += 1) {
            if (cards[j] !== null && cards[j] !== undefined && cards[j].id === file.cardId) {
              return { boardTitle: board.title, cardTitle: cards[j].title }
            }
          }
        }
        return null
      }

      function addSlot(time, text) { persist({ schedule: snapshot.schedule.concat([{ id: nextId('slot'), time: time, text: text, done: false, date: todayKey() }]) }) }
      function toggleSlot(slotId) {
        persist({ schedule: snapshot.schedule.map(function (i) {
          if (i === null || i === undefined || i.id !== slotId) return i
          return Object.assign({}, i, { done: i.done !== true, doneAt:i.done!==true?todayKey():null })
        }) })
      }
      function removeSlot(slotId){const item=snapshot.schedule.find(x=>x.id===slotId);if(item)persist({schedule:snapshot.schedule.filter(x=>x.id!==slotId),deletedItems:[recycleEntry('slot',item),...(snapshot.deletedItems || [])]})}

      const HAS_FILE_READER = typeof FileReader !== 'undefined'
      const HAS_TYPED = typeof ArrayBuffer !== 'undefined' && typeof Uint8Array !== 'undefined'
      const READ_MODE = HAS_FILE_READER ? 'FileReader' : (HAS_TYPED ? 'ArrayBuffer' : 'unsupported')

      const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      function bytesToBase64(bytes) {
        let out = ''
        for (let i = 0; i < bytes.length; i += 3) {
          const b0 = bytes[i]
          const has1 = i + 1 < bytes.length
          const has2 = i + 2 < bytes.length
          const b1 = has1 ? bytes[i + 1] : 0
          const b2 = has2 ? bytes[i + 2] : 0
          out += B64_CHARS.charAt(b0 >> 2)
          out += B64_CHARS.charAt(((b0 & 3) << 4) | (b1 >> 4))
          out += has1 ? B64_CHARS.charAt(((b1 & 15) << 2) | (b2 >> 6)) : '='
          out += has2 ? B64_CHARS.charAt(b2 & 63) : '='
        }
        return out
      }

      function encodeFile(file) {
        return new Promise(function (resolve, reject) {
          if (HAS_FILE_READER) {
            try {
              const reader = new FileReader()
              reader.onload = function () {
                const result = String(reader.result === null || reader.result === undefined ? '' : reader.result)
                const comma = result.indexOf(',')
                resolve({ base64: comma >= 0 ? result.slice(comma + 1) : '', mime: file.type || '' })
              }
              reader.onerror = function () { reject(new Error('FileReader 读取失败')) }
              reader.readAsDataURL(file)
              return
            } catch (error) { reject(error); return }
          }
          if (HAS_TYPED && typeof file.arrayBuffer === 'function') {
            file.arrayBuffer().then(function (buffer) {
              resolve({ base64: bytesToBase64(new Uint8Array(buffer)), mime: file.type || '' })
            }).catch(reject)
            return
          }
          reject(new Error('当前环境无法读取本地文件内容'))
        })
      }

      function formatBytes(size) {
        const value = typeof size === 'number' && size > 0 ? size : 0
        if (value < 1024) return value + ' B'
        if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB'
        return (value / 1024 / 1024).toFixed(1) + ' MB'
      }

      async function uploadFiles(list, target) {
        const incoming = []
        for (let i = 0; i < list.length; i += 1) incoming.push(list[i])
        if (incoming.length === 0) return
        if (target?.projectId && incoming.length + snapshot.files.filter(f=>f.projectId===target.projectId&&(f.teachingPlanId || null)===(target.teachingPlanId || null)).length > 5) { publish({notice:'每个项目或周计划最多关联 5 份附件。'}); return }
        publish({notice:'正在上传 '+incoming.length+' 个文件…',noticePending:true})
        const added = []
        const failed = []
        for (let i = 0; i < incoming.length; i += 1) {
          const file = incoming[i]
          if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
            failed.push(file.name + '（超过 ' + formatBytes(MAX_UPLOAD_BYTES) + '）')
            continue
          }
          try {
            const encoded = await encodeFile(file)
            const res = await hostCall('upload', {
              name: file.name || '未命名', mime: encoded.mime || file.type || '',
              base64: encoded.base64, size: typeof file.size === 'number' ? file.size : 0,
            })
            if (res !== null && res !== undefined && res.ok === true && res.file) {
              added.push(Object.assign({}, res.file, {
                boardId: target ? target.boardId : null, cardId: target ? target.cardId : null,
                projectId: target ? target.projectId || null : null,
                teachingPlanId: target ? target.teachingPlanId || null : null,
              }))
            } else {
              failed.push(file.name + '（' + (res !== null && res !== undefined && res.error ? String(res.error) : '写入失败') + '）')
            }
          } catch (error) {
            failed.push(file.name + '（' + String(error !== null && error !== undefined && error.message ? error.message : error) + '）')
          }
        }
        if (added.length > 0) persist({ files: snapshot.files.concat(added) })
        publish({ notice: failed.length === 0 ? ('已上传 ' + added.length + ' 个') : ('成功 ' + added.length + ' 个，失败：' + failed.join('；')) })
      }

      function svg(props, children) {
        return React.createElement('svg', {
          className: 'lwb-svg', width: props.size || 15, height: props.size || 15, viewBox: '0 0 24 24',
          fill: 'none', stroke: 'currentColor', strokeWidth: props.weight || 1.6,
          strokeLinecap: 'round', strokeLinejoin: 'round',
        }, children)
      }
      function PanelIcon({ size = 17 } = {}) {
        // A balanced dashboard glyph; pass all tiles as the helper's children array.
        return svg({ size, weight: 1.8 }, [
          React.createElement('rect', { key: 'a', x: 3, y: 3, width: 7, height: 9, rx: 1.5 }),
          React.createElement('rect', { key: 'b', x: 14, y: 3, width: 7, height: 5, rx: 1.5 }),
          React.createElement('rect', { key: 'c', x: 3, y: 16, width: 7, height: 5, rx: 1.5 }),
          React.createElement('rect', { key: 'd', x: 14, y: 12, width: 7, height: 9, rx: 1.5 }),
        ])
      }
      function ClipIcon(props) {
        return svg({ size: props.size || 15, weight: 1.5 },
          React.createElement('path', { key: 'a', d: 'M17 8.5l-6.6 6.6a2.6 2.6 0 0 1-3.7-3.7l7-7a3.9 3.9 0 0 1 5.5 5.5l-7 7a5.2 5.2 0 0 1-7.3-7.3L11 3.5' })
        )
      }
      function CompletedCalendarIcon(){return svg({size:17,weight:1.7},[
        E('rect',{key:'calendar',x:3,y:5,width:18,height:16,rx:2}),
        E('path',{key:'binding',d:'M8 3v4M16 3v4M3 11h18'}),
        E('path',{key:'check',d:'m8 16 2.5 2.5L16 13'})])}
      function BoardIcon(){return svg({size:18,weight:1.7},[
        E('rect',{key:'frame',x:3,y:4,width:18,height:16,rx:2}),
        E('path',{key:'columns',d:'M9 4v16M15 4v16M6 8v4M12 8v7M18 8v3'})])}

      function ResourceIcon(){return svg({size:18,weight:1.7},[
        E('path',{key:'folder',d:'M3 7V6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z'}),
        E('path',{key:'edge',d:'M3 9h18'})])}
      function AddIcon(){return svg({size:18,weight:1.7},E('path',{key:'plus',d:'M12 5v14M5 12h14'}))}
      function EditIcon(){return svg({size:18,weight:1.7},[
        E('path',{key:'page',d:'M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6'}),
        E('path',{key:'pen',d:'M16.5 3.5a2.12 2.12 0 0 1 3 3L10 16l-4 1 1-4Z M15 5l3 3'})])}
      function RefreshIcon(){return svg({size:18,weight:1.7},[
        E('path',{key:'circle',d:'M20 10a8 8 0 1 0-1.5 7.2'}),
        E('path',{key:'arrow',d:'M20 4v6h-6'})])}
      function FileIcon(props) {
        return svg({ size: props.size || 22, weight: 1.4 },
          React.createElement('path', { key: 'a', d: 'M6 3.5h8L19 8.5v12H6z' }),
          React.createElement('path', { key: 'b', d: 'M13.5 3.5v5h5' })
        )
      }

      function InlineEdit(props) {
        if (!props.open) return null
        return React.createElement('input', {
          className: 'lwb-input', value: props.draft, autoFocus: true,
          onChange: function (event) { props.onDraft(event.target.value) },
          onBlur: props.onClose,
          onKeyDown: function (event) {
            if (event.key === 'Enter') {
              const text = String(props.draft).trim()
              if (text !== '') props.onCommit(text)
              props.onClose()
            }
            if (event.key === 'Escape') props.onClose()
          },
        })
      }

      function FileThumb(props) {
        const file = props.file
        const pair = React.useState('')
        const src = pair[0]
        const setSrc = pair[1]
        React.useEffect(function () {
          let alive = true
          if (file === null || file === undefined || file.kind !== 'image') return undefined
          hostCall('readFile', { id: file.id }).then(function (res) {
            if (!alive) return
            if (res !== null && res !== undefined && res.ok === true) {
              setSrc('data:' + (file.mime || 'image/png') + ';base64,' + String(res.base64 || ''))
            }
          }).catch(function (error) { if (alive) console.error('[life-workbench] 读取图片失败', error) })
          return function () { alive = false }
        }, [file !== null && file !== undefined ? file.id : ''])

        if (file !== null && file !== undefined && file.kind === 'image' && src !== '') {
          return React.createElement('img', {
            className: props.className || 'lwb-thumb', src: src, alt: file.name || '', title: file.name || '点击放大',
            onClick: function () { if (props.onZoom) props.onZoom(src) },
          })
        }
        return React.createElement('div', { className: 'lwb-ficon' }, React.createElement(FileIcon, { size: 22 }))
      }

      function UploadZone(props) {
        const overPair = React.useState(false)
        const over = overPair[0]
        const setOver = overPair[1]
        function onDrop(event) {
          event.preventDefault()
          setOver(false)
          const dt = event.dataTransfer
          if (dt !== null && dt !== undefined && dt.files) uploadFiles(dt.files, props.target || null)
        }
        return React.createElement('div', {
          className: over ? 'lwb-drop-area lwb-drop-area-on' : 'lwb-drop-area',
          onDragOver: function (event) { event.preventDefault(); setOver(true) },
          onDragLeave: function () { setOver(false) },
          onDrop: onDrop,
        },
          React.createElement('label', { style: { cursor: 'pointer', display: 'block' } },
            props.label || '拖入或点击上传',
            React.createElement('input', {
              type: 'file', multiple: true, style: { display: 'none' },
              onChange: function (event) {
                const input = event.target
                if (input !== null && input !== undefined && input.files) uploadFiles(input.files, props.target || null)
                if (input !== null && input !== undefined) input.value = ''
              },
            })
          )
        )
      }

      function WideCard(props) { return React.createElement('div', { className: 'lwb-wide' }, props.children) }
      function Split(props) {
        return React.createElement('div', { className: 'lwb-split' },
          props.panes.map(function (pane, index) {
            return React.createElement('div', { className: 'lwb-pane', key: index }, pane)
          })
        )
      }
      function section(name, count, body) {
        return React.createElement('div', { className: 'lwb-sec' },
          React.createElement('div', { className: 'lwb-sec-head' },
            React.createElement('span', { className: 'lwb-sec-name' }, name),
            React.createElement('span', { className: 'lwb-sec-line' }),
            count ? React.createElement('span', { className: 'lwb-sec-count' }, count) : null
          ),
          body
        )
      }

      function dailyEntries(view){
        const entries=[]
        for(const board of view.boards)for(const card of board.cards || [])if(card&&!card.projectId)entries.push({kind:'card',id:card.id,boardId:board.id,boardTitle:board.title,daily:board.kind==='daily',date:card.date || '',time:card.time || '',text:card.title,done:card.done===true,doneAt:card.doneAt || ''})
        for(const slot of view.schedule || [])if(slot)entries.push({kind:'slot',id:slot.id,date:slot.date || view.today || todayKey(),time:slot.time || '',text:slot.text,done:slot.done===true,doneAt:slot.doneAt || ''})
        return entries
      }
      function calendarOnDay(event,day){
        if(event.allDay)return event.startDate<=day&&day<event.endDate
        return event.startDate<=day&&(event.endDate>day||(event.endDate===day&&event.endTime!=='00:00'))
      }
      function agendaForDay(view,day){
        const entries=[]
        for(const project of view.projects){
          if(projectHidden(project,day))continue
          if(project.kind==='paper'&&project.status==='active'&&(!validDay(project.startDate)||project.startDate<=day)&&(!validDay(project.endDate)||project.endDate>=day))entries.push({kind:'research',id:project.id,text:project.title,project,time:'',detail:project.stage || (project.nextStep || '').split('\n')[0]})
          if(project.kind==='course'&&project.status!=='completed'&&project.status!=='paused')for(const session of courseSessions(project,day,day))if(!lessonCompleted(project,session))entries.push({kind:'lesson',id:project.id+'-'+session.id,text:project.title,project,session,time:session.startTime || '',detail:[session.endTime?'至 '+session.endTime:'',session.location || project.location].filter(Boolean).join(' · ')})
        }
        for(const item of dailyEntries(view))if((!item.done||(item.daily&&!item.date&&day>(view.today || todayKey())))&&(item.date===day||(!item.date&&item.daily)))entries.push({...item,detail:item.boardTitle || ''})
        for(const event of view.calendarEvents || [])if(isValidCalendarTask(event)&&calendarOnDay(event,day))entries.push({kind:'calendar',id:event.id,text:event.title,time:event.allDay?'全天':event.startDate<day?'持续中':event.time,detail:[event.location,event.calendarTitle].filter(Boolean).join(' · ')})
        const rank={research:0,lesson:1,card:2,slot:2,calendar:3};return entries.sort((a,b)=>rank[a.kind]-rank[b.kind]||String(a.time).localeCompare(String(b.time)))
      }
      async function syncMacCalendar(date){
        if(snapshot.calendarSyncing)return
        publish({calendarSyncing:true,calendarError:'',notice:'正在同步 Mac 日历…',noticePending:true})
        try{await chain;const result=await hostCall('syncCalendar',{date});if(!result.ok)throw Error(result.error || '同步失败');publish({calendarEvents:result.events,calendarSync:result.calendarSync,notice:'已同步 '+result.count+' 项日历日程',noticePending:false})}catch(error){publish({calendarError:error.message,notice:'',noticePending:false})}finally{publish({calendarSyncing:false})}
      }
      function DayAgenda({onOpen}){
        const view=useSnapshot(),today=useCalendarToday(),tomorrow=shiftDay(today,1)
        React.useEffect(()=>{if(view.today&&view.today!==today)void load(true)},[today,view.today])
        const names={research:'研究',lesson:'课程',card:'事项',slot:'事项',calendar:'日历'}
        return E('section',{className:'rw-day-agenda','aria-label':'近期任务'},[[today,'今日任务'],[tomorrow,'明日预告']].map(([day,title])=>{
          const items=agendaForDay(view,day)
          return E('section',{className:'rw-day-panel '+(day===today?'rw-day-today':'rw-day-tomorrow'),key:day,'aria-label':title},E('header',null,E('h2',null,title),E('time',{dateTime:day},day.slice(5).replace('-','.'))),items.length?E('ul',{className:'rw-agenda-list'},items.map(item=>E('li',{key:item.kind+'-'+item.id},E('span',{className:'rw-agenda-kind rw-agenda-'+item.kind,title:names[item.kind],'aria-label':names[item.kind]},E(QuietIcon,{name:item.kind==='research'?'research':item.kind==='lesson'?'lesson':item.kind==='calendar'?'calendar':'task',size:14})),E('div',{className:'rw-agenda-copy'},item.project?E('button',{type:'button',className:'rw-agenda-title',onClick:()=>onOpen(item.project)},item.text):E('span',{className:'rw-agenda-title'},item.text),item.detail?E('span',{className:'rw-agenda-detail'},item.detail):null),item.time?E('span',{className:'rw-agenda-time'},item.time):null))):E('p',{className:'rw-help'},'暂无安排'))
        }))
      }
      function QuietIcon({name,size=16}){
        const paths={calendar:'M5 3v4M19 3v4M3 9h18M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2M7 13h3M14 13h3M7 17h3',clock:'M12 8v5l3 2',trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',close:'M6 6l12 12M18 6 6 18',filter:'M4 6h16M7 12h10M10 18h4',research:'M5 3h11l3 3v15H5zM9 9h6M9 13h6M9 17h4',lesson:'M3 5h7l2 2 2-2h7v15h-7l-2 1-2-1H3zM12 7v14',task:'M5 12l4 4L19 6'}
        return svg({size,weight:1.6},[name==='clock'?E('circle',{key:'c',cx:12,cy:12,r:9}):null,E('path',{key:'p',d:paths[name]||paths.task})])
      }
      function shortDay(date,today=todayKey()){
        if(!validDay(date))return ''
        if(date===today)return '今天'
        if(date===shiftDay(today,1))return '明天'
        return date.slice(0,4)===today.slice(0,4)?Number(date.slice(5,7))+'.'+Number(date.slice(8)):date.replaceAll('-','.')
      }
      function useNearPopover(id,trigger,active=true){
        React.useEffect(()=>{
          const panel=document.getElementById(id);if(!panel)return
          const place=()=>{
            if(!panel.matches(':popover-open')||!trigger.current)return
            const rect=trigger.current.getBoundingClientRect(),gap=7,edge=10,w=window.innerWidth,h=window.innerHeight
            const below=Math.max(0,h-rect.bottom-gap-edge),above=Math.max(0,rect.top-gap-edge)
            panel.style.maxHeight=Math.max(60,Math.max(above,below))+'px'
            const box=panel.getBoundingClientRect(),down=box.height<=below||below>=above
            panel.style.left=Math.max(edge,Math.min(rect.right-box.width,w-box.width-edge))+'px'
            panel.style.top=Math.max(edge,Math.min(down?rect.bottom+gap:rect.top-box.height-gap,h-box.height-edge))+'px'
          }
          panel.classList.add('rw-near-popover')
          const observer=typeof ResizeObserver==='function'?new ResizeObserver(place):null;observer?.observe(panel)
          panel.addEventListener('toggle',place);window.addEventListener('resize',place);document.addEventListener('scroll',place,true)
          return()=>{observer?.disconnect();panel.removeEventListener('toggle',place);window.removeEventListener('resize',place);document.removeEventListener('scroll',place,true)}
        },[id,active])
      }
      function TaskDatePopover({id,date,time,onDate,onTime,filter=false}){
        return E('section',{id,popover:'auto',className:'rw-task-popover '+(filter?'rw-filter-popover':'rw-composer-popover'),role:'dialog','aria-label':filter?'按日期查看':'安排日期与时间'},
          E('header',null,E('strong',null,filter?'查看日期':'日期与时间'),E('button',{type:'button',className:'lwb-icon-btn',title:'关闭','aria-label':'关闭日期面板',popovertarget:id,popovertargetaction:'hide'},E(QuietIcon,{name:'close'}))),
          E('label',null,E('span',null,'日期'),E('input',{type:'date',className:'lwb-input','aria-label':filter?'查看任务日期':'任务日期',value:date,onInput:e=>onDate(e.target.value),onChange:e=>onDate(e.target.value)})),
          !filter?E('label',null,E('span',null,'时间（可选）'),E('input',{type:'time',className:'lwb-input','aria-label':'任务时间（可选）',value:time,onInput:e=>onTime(e.target.value),onChange:e=>onTime(e.target.value)})):null,
          filter?E('button',{type:'button',className:'rw-text-button',onClick:()=>onDate(''),popovertarget:id,popovertargetaction:'hide'},'全部日期'):time?E('button',{type:'button',className:'rw-text-button',onClick:()=>onTime('')},'清除时间'):null)
      }
      function SectionIcon({foldable=false}){
        return E('svg',{className:'rw-section-icon',width:16,height:16,viewBox:'0 0 20 20',fill:'none',stroke:'currentColor',strokeWidth:1.35,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},E('rect',{x:2.5,y:2.5,width:15,height:15,rx:4}),foldable?E('path',{className:'rw-section-chevron',d:'m8.5 6.5 3.5 3.5-3.5 3.5'}):E('path',{d:'M6.5 7h7M6.5 10h7M6.5 13h4'}))
      }
      const TASK_CATEGORY_COLORS=['#527c9a','#a27b4e','#8271a3','#9b687c','#67884d','#527f83','#957048','#6e77a2']
      function taskCategoryColor(board,index=0){return /^#[0-9a-f]{6}$/i.test(board?.color || '')?board.color:TASK_CATEGORY_COLORS[index%TASK_CATEGORY_COLORS.length]}
      function nextTaskCategoryColor(boards){const used=new Set(boards.map(taskCategoryColor));const free=TASK_CATEGORY_COLORS.find(c=>!used.has(c));if(free)return free;let n=boards.length,color;do{const hue=(n++*137.508)%360;const a=.42*Math.min(.46,1-.46);const f=k=>{const x=(k+hue/30)%12;return Math.round(255*(.46-a*Math.max(-1,Math.min(x-3,9-x,1)))).toString(16).padStart(2,'0')};color='#'+f(0)+f(8)+f(4)}while(used.has(color));return color}
      const SORT_STATUS={active:0,planned:1,paused:2,completed:3}
      function sortPreference(view,kind){return view.sortPreferences?.[kind] || {field:kind==='daily'?'manual':'start',direction:'asc',ids:[]}}
      function sortProjects(list,pref){
        const index=new Map((pref.ids || []).map((id,i)=>[id,i])),direction=pref.direction==='desc'?-1:1
        const value=p=>pref.field==='name'?String(p.title || ''):pref.field==='plan'?projectPlanDate(p):pref.field==='semester'?courseSemesterKey(p):p.kind==='course'?p.termStart || p.startDate || '':p.startDate || projectPlanDate(p) || ''
        return list.slice().sort((a,b)=>{const group=(SORT_STATUS[a.status]??4)-(SORT_STATUS[b.status]??4);if(group)return group;if(pref.field==='manual')return (index.get(a.id)??1e9)-(index.get(b.id)??1e9);const av=value(a),bv=value(b);if(!av||!bv)return av?-1:bv?1:0;return direction*av.localeCompare(bv,'zh-CN',{numeric:true,sensitivity:'base'})})
      }
      function courseSemesterKey(p){const date=[p.termStart,p.startDate,...(p.classSessions || []).map(x=>x.date).filter(validDay).sort()].find(validDay);if(!date)return '';const month=Number(date.slice(5,7)),year=Number(date.slice(0,4))-(month===1?1:0);return year+'-'+(month>=8||month===1?'2':'1')}
      function setSort(kind,patch){persist({sortPreferences:{...(snapshot.sortPreferences || {}),[kind]:{...sortPreference(snapshot,kind),...patch}}})}
      function moveBefore(ids,source,target){const result=ids.filter(id=>id!==source),index=result.indexOf(target);if(index<0)return ids;result.splice(index,0,source);return result}
      let draggingOrder=null,suppressDragClickUntil=0
      function dragOrdering(kind,item,ordered){
        return {draggable:true,onDragStart:e=>{draggingOrder={kind,id:item.id,status:item.status};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',item.id);e.currentTarget.classList.add('rw-dragging')},onDragEnd:e=>{e.currentTarget.classList.remove('rw-dragging');document.querySelectorAll('.rw-drop-target').forEach(n=>n.classList.remove('rw-drop-target'));draggingOrder=null;suppressDragClickUntil=Date.now()+200},onDragOver:e=>{if(draggingOrder?.kind===kind&&draggingOrder.status===item.status&&draggingOrder.id!==item.id){e.preventDefault();e.dataTransfer.dropEffect='move';e.currentTarget.classList.add('rw-drop-target')}},onDragLeave:e=>{if(!e.currentTarget.contains(e.relatedTarget))e.currentTarget.classList.remove('rw-drop-target')},onDrop:e=>{e.currentTarget.classList.remove('rw-drop-target');if(draggingOrder?.kind!==kind||draggingOrder.status!==item.status)return;e.preventDefault();e.stopPropagation();setSort(kind,{field:'manual',direction:'asc',ids:moveBefore(ordered.map(x=>x.id),draggingOrder.id,item.id)});suppressDragClickUntil=Date.now()+250;draggingOrder=null}}
      }
      function SortMenu({kind}){
        const view=useSnapshot(),pref=sortPreference(view,kind),ref=React.useRef(null),panel=React.useRef(null),id='rw-sort-'+React.useId(),label=kind==='paper'?'研究项目':kind==='course'?'教学任务':'日常事项'
        useNearPopover(id,ref)
        const fields=kind==='paper'?[['plan','计划时间'],['start','开始时间'],['name','名称']]:kind==='course'?[['semester','学期'],['start','开始时间'],['name','名称']]:[['length','事项数量'],['name','分类名称']]
        const choose=patch=>{setSort(kind,patch);panel.current?.hidePopover()}
        return E('span',{className:'rw-sort-control',onClick:e=>e.stopPropagation()},E('button',{ref,type:'button',className:'lwb-icon-btn rw-header-icon',title:label+'排序','aria-label':label+'排序',popovertarget:id},svg({size:16,weight:1.6},[E('path',{key:'lines',d:'M4 6h12M4 11h8M4 16h4M19 6v14m-3-3 3 3 3-3'})])),
          E('section',{id,ref:panel,popover:'auto',className:'rw-sort-popover',role:'dialog','aria-label':label+'排序方式'},E('button',{type:'button',className:pref.field==='manual'?'is-selected':'',onClick:()=>choose({field:'manual'})},'手动排序'),fields.flatMap(([field,title])=>['asc','desc'].map(direction=>E('button',{type:'button',key:field+direction,className:pref.field===field&&pref.direction===direction?'is-selected':'',onClick:()=>choose({field,direction})},title+' · '+(direction==='asc'?'升序':'降序'))))))
      }
      function dailyBoard(view){return view.boards.find(b=>b.kind==='daily') || view.boards.find(b=>b.title==='每日事项')}
      let draggingTask=null
      function moveTask(item,targetId,beforeId=null){
        const board=snapshot.boards.find(b=>b.id===targetId);if(!board)return
        const source=item.kind==='slot'?snapshot.schedule.find(x=>x.id===item.id):snapshot.boards.find(b=>b.id===item.boardId)?.cards?.find(c=>c.id===item.id);if(!source||beforeId===item.id)return
        const card=item.kind==='slot'?{...source,title:source.text}:source
        const boards=snapshot.boards.map(b=>({...b,cards:(b.cards || []).filter(c=>!(b.id===item.boardId&&c.id===item.id))}))
        const target=boards.find(b=>b.id===targetId),index=target.cards.findIndex(c=>c.id===beforeId);target.cards.splice(index<0?target.cards.length:index,0,card)
        const old=(snapshot.sortPreferences?.taskOrder || {})[targetId] || dailyEntries(snapshot).filter(t=>t.boardId===targetId&&!t.done).sort((a,b)=>(a.date || '9999').localeCompare(b.date || '9999')||a.time.localeCompare(b.time)).map(t=>t.id)
        const ids=old.filter(id=>id!==item.id),at=ids.indexOf(beforeId);ids.splice(at<0?ids.length:at,0,item.id)
        persist({boards,schedule:item.kind==='slot'?snapshot.schedule.filter(x=>x.id!==item.id):snapshot.schedule,files:snapshot.files.map(f=>f.cardId===item.id?{...f,boardId:targetId}:f),sortPreferences:{...(snapshot.sortPreferences || {}),taskOrder:{...(snapshot.sortPreferences?.taskOrder || {}),[targetId]:ids}}})
      }
      function useBlockOpen(key){
        const storageKey='rw-block-open-'+key
        const [open,setOpen]=React.useState(()=>{try{return localStorage.getItem(storageKey)!=='false'}catch{return true}})
        const onToggle=e=>{if(e.target!==e.currentTarget)return;const value=e.currentTarget.open;setOpen(value);try{localStorage.setItem(storageKey,String(value))}catch{}}
        return {open,onToggle}
      }
      function OverviewView(){
        const blockState=useBlockOpen('daily')
        const [taskDragging,setTaskDragging]=React.useState(false)
        const view=useSnapshot(),today=useCalendarToday(),recentId='rw-recent-'+React.useId(),addId='rw-add-task-'+React.useId(),addRef=React.useRef(null),addTrigger=React.useRef(null),filterId='rw-filter-'+React.useId(),filterTrigger=React.useRef(null),recentTrigger=React.useRef(null)
        useNearPopover(addId,addTrigger);useNearPopover(filterId,filterTrigger);useNearPopover(recentId,recentTrigger)
        const [draft,setDraft]=React.useState({date:today,time:'',text:'',boardId:''}),[filter,setFilter]=React.useState(''),[localError,setLocalError]=React.useState(''),[editing,setEditing]=React.useState(null),[titleEdit,setTitleEdit]=React.useState(null),[expanded,setExpanded]=React.useState(false)
        const [newCategory,setNewCategory]=React.useState(''),[addingCategory,setAddingCategory]=React.useState(false)
        function createCategory(){const title=newCategory.trim();if(!title)return;const existing=snapshot.boards.find(b=>b.title.trim().toLocaleLowerCase()===title.toLocaleLowerCase());if(existing){setDraft(d=>({...d,boardId:existing.id}));setNewCategory('');setAddingCategory(false);return}const board={id:nextId('board'),title,color:nextTaskCategoryColor(snapshot.boards),cards:[]};persist({boards:snapshot.boards.map((b,i)=>({...b,color:taskCategoryColor(b,i)})).concat(board)});setDraft(d=>({...d,boardId:board.id}));setNewCategory('');setAddingCategory(false);setLocalError('')}
        const items=dailyEntries(view),pending=items.filter(i=>!i.done&&(!filter||i.date===filter||(!i.date&&i.daily))),completed=items.filter(i=>i.done).sort((a,b)=>b.doneAt.localeCompare(a.doneAt))
        const calendar=(view.calendarEvents || []).filter(e=>calendarInWeek(e,today)&&(!filter||calendarOnDay(e,filter))).map(e=>({kind:'calendar',id:e.id,text:e.title,date:e.startDate,time:e.allDay?'全天':e.time,detail:e.location || '',source:e.calendarTitle || ''}))
        const rows=pending.sort((a,b)=>(a.date || '9999').localeCompare(b.date || '9999')||String(a.time).localeCompare(String(b.time))),boardId=draft.boardId || view.boards[0]?.id || ''
        const calendarRows=calendar.sort((a,b)=>(a.date || '').localeCompare(b.date || '')||String(a.time).localeCompare(String(b.time))),allRows=rows.concat(calendarRows),shownRows=expanded?allRows:allRows.slice(0,4)
        const dailyGroup=dailyBoard(view),categoryKey=item=>item.kind==='calendar'?(dailyGroup?.id || '__daily'):item.boardId || 'other'
        const categoryList=Array.from(new Set([dailyGroup?.id || '__daily',...allRows.map(categoryKey),...view.boards.map(b=>b.id)])).map(id=>({id,status:'category',name:id===dailyGroup?.id||id==='__daily'?'每日事项':view.boards.find(b=>b.id===id)?.title || '其他事项',entries:allRows.filter(item=>categoryKey(item)===id)}))
        for(const group of categoryList){const ids=view.sortPreferences?.taskOrder?.[group.id];if(ids){const ranks=new Map(ids.map((id,i)=>[id,i]));group.entries.sort((a,b)=>Number(a.kind==='calendar')-Number(b.kind==='calendar')||(ranks.get(a.id)??1e9)-(ranks.get(b.id)??1e9))}}
        const categoryPref=sortPreference(view,'daily'),categoryIndices=new Map((categoryPref.ids || view.boards.map(b=>b.id)).map((id,i)=>[id,i]))
        categoryList.sort((a,b)=>categoryPref.field==='name'?(categoryPref.direction==='desc'?-1:1)*a.name.localeCompare(b.name,'zh-CN',{numeric:true}):categoryPref.field==='length'?(categoryPref.direction==='desc'?-1:1)*(a.entries.length-b.entries.length):(categoryIndices.get(a.id)??1e9)-(categoryIndices.get(b.id)??1e9))
        function commit(){const text=draft.text.trim();if(!text)return;if(!validDay(draft.date)){setLocalError('请选择有效的任务日期');return}if(draft.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)){setLocalError('请选择有效的时间');return}if(!boardId){setLocalError('请先在看板中新建一个事项分类');return}patchBoard(boardId,b=>({...b,cards:[...(b.cards || []),{id:nextId('card'),title:text,date:draft.date,time:draft.time,done:false,createdAt:todayKey(),doneAt:null}]}));setDraft({...draft,text:'',time:''});setLocalError('');addRef.current?.hidePopover?.()}
        function toggle(item){if(item.kind==='slot')toggleSlot(item.id);else toggleCard(item.boardId,item.id)}
        function remove(item){if(item.kind==='slot')removeSlot(item.id);else removeCard(item.boardId,item.id)}
        function updateEntry(item,key,value){const current=item.kind==='slot'?snapshot.schedule.find(s=>s.id===item.id):snapshot.boards.find(b=>b.id===item.boardId)?.cards.find(c=>c.id===item.id);if(current?.[key==='title'&&item.kind==='slot'?'text':key]===value)return;if(item.kind==='slot')persist({schedule:snapshot.schedule.map(s=>s.id===item.id?{...s,[key==='title'?'text':key]:value}:s)});else patchBoard(item.boardId,b=>({...b,cards:(b.cards || []).map(c=>c.id===item.id?{...c,[key]:value}:c)}))}
        function renderTask(item){
          const isCalendar=item.kind==='calendar',categoryIndex=view.boards.findIndex(b=>b.id===(isCalendar?dailyGroup?.id:item.boardId)),category=view.boards[categoryIndex],categoryName=isCalendar?'每日事项':category?.title || '其他事项',categoryColor=category?taskCategoryColor(category,categoryIndex):isCalendar?'#8271a3':'#8b8090',meta=[shortDay(item.date,today),item.time].filter(Boolean).join(' · ')
          return E('div',{className:'rw-task-entry'+(isCalendar?' rw-calendar-entry':''),key:item.kind+'-'+item.id,draggable:!isCalendar,onDragStart:e=>{if(isCalendar)return;e.stopPropagation();draggingTask=item;setTaskDragging(true);draggingOrder=null;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',item.id);e.currentTarget.classList.add('rw-dragging')},onDragEnd:e=>{e.stopPropagation();draggingTask=null;setTaskDragging(false);e.currentTarget.classList.remove('rw-dragging');document.querySelectorAll('.rw-drop-target').forEach(n=>n.classList.remove('rw-drop-target'))},onDragOver:e=>{if(!draggingTask)return;e.preventDefault();e.stopPropagation();e.currentTarget.classList.add('rw-drop-target')},onDragLeave:e=>e.currentTarget.classList.remove('rw-drop-target'),onDrop:e=>{if(!draggingTask)return;e.preventDefault();e.stopPropagation();moveTask(draggingTask,isCalendar?dailyGroup?.id:item.boardId,isCalendar?null:item.id);draggingTask=null;setTaskDragging(false);e.currentTarget.classList.remove('rw-drop-target')}},
            isCalendar?E('span',{className:'rw-task-dot rw-dot-calendar',style:{background:categoryColor},title:categoryName,'aria-label':categoryName,tabIndex:0}):E('span',{className:'rw-task-dot rw-dot-manual',style:{background:categoryColor},title:categoryName,'aria-label':categoryName,tabIndex:0}),
            E('div',{className:'rw-task-copy'},E('div',{className:'rw-task-line'},titleEdit?.id===item.id?E(InlineEdit,{open:true,value:item.text,draft:titleEdit.value,onDraft:value=>setTitleEdit({id:item.id,value}),onCommit:value=>{if(value.trim())updateEntry(item,'title',value.trim())},onClose:()=>setTitleEdit(null)}):E('span',{className:'lwb-item-text',title:isCalendar?[item.text,item.date,item.time,item.detail,item.source].filter(Boolean).join(' · '):[item.text,item.date,item.time,'双击编辑'].filter(Boolean).join(' · '),onDoubleClick:isCalendar?undefined:()=>setTitleEdit({id:item.id,value:item.text})},item.text)),
              editing===item.id?E('div',{className:'rw-task-edit'},E('label',null,'日期',E('input',{type:'date',className:'lwb-input',value:item.date,'aria-label':'调整任务日期',onInput:e=>{if(validDay(e.target.value))updateEntry(item,'date',e.target.value)},onChange:e=>{if(validDay(e.target.value))updateEntry(item,'date',e.target.value)}})),E('label',null,'时间',E('input',{type:'time',className:'lwb-input',value:item.time,'aria-label':'调整任务时间',onInput:e=>updateEntry(item,'time',e.target.value),onChange:e=>updateEntry(item,'time',e.target.value)})),E('button',{type:'button',className:'lwb-icon-btn',title:'完成调整','aria-label':'完成调整',onClick:()=>setEditing(null)},E(QuietIcon,{name:'task'}))):null),
            !isCalendar?E('div',{className:'rw-task-actions'},E('button',{type:'button',className:'lwb-icon-btn rw-task-complete','aria-label':'完成：'+item.text,title:'标记完成',onClick:()=>toggle(item)},E(QuietIcon,{name:'task'})),E('button',{type:'button',className:'lwb-icon-btn','aria-label':'调整日期：'+item.text,title:'调整日期与时间',onClick:()=>setEditing(editing===item.id?null:item.id)},E(QuietIcon,{name:'calendar'})),E('button',{type:'button',className:'lwb-icon-btn','aria-label':'删除：'+item.text,title:'删除事项',onClick:()=>remove(item)},E(QuietIcon,{name:'trash'}))):null)
        }
        return E('details',{...blockState,className:'rw-block rw-daily rw-unified-daily','aria-label':'日常任务'},
          E('summary',{className:'rw-block-heading',title:'展开或折叠日常事项'},E(SectionIcon,{foldable:true}),E('h2',null,'日常事项'),E('span',{className:'rw-block-meta'},(items.filter(i=>!i.done&&(!i.date||(i.date>=today&&i.date<=shiftDay(today,6)))).length+(view.calendarEvents || []).filter(e=>calendarInWeek(e,today)).length)+' 项待办'),E('span',{className:'lwb-spacer'}),
            E('div',{className:'rw-daily-tools'},
              E('button',{type:'button',ref:addTrigger,className:'lwb-icon-btn',title:'添加事项','aria-label':'添加事项',popovertarget:addId,popovertargetaction:'toggle','aria-haspopup':'dialog'},E(AddIcon)),E(SortMenu,{kind:'daily'}),
              E('button',{type:'button',ref:filterTrigger,className:'lwb-icon-btn'+(filter?' is-active':''),title:filter?'筛选：'+filter:'按日期筛选','aria-label':'按日期筛选',popovertarget:filterId,popovertargetaction:'toggle','aria-haspopup':'dialog'},E(QuietIcon,{name:'filter'})),
              E('button',{type:'button',ref:recentTrigger,className:'lwb-icon-btn',title:'最近完成','aria-label':'最近完成','aria-haspopup':'dialog',popovertarget:recentId,popovertargetaction:'toggle'},E(CompletedCalendarIcon)),
              allRows.length>4?E('button',{type:'button',className:'lwb-icon-btn',title:expanded?'收起事项':'更多事项','aria-label':expanded?'收起事项':'更多事项','aria-expanded':expanded,onClick:()=>setExpanded(!expanded)},E('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,'aria-hidden':true},E('path',{d:expanded?'m6 15 6-6 6 6':'m6 9 6 6 6-6'}))):null)),
          view.calendarError?E('div',{className:'lwb-err',role:'alert'},view.calendarError):null,
          E('div',{className:'rw-daily-category-grid'},categoryList.filter(category=>taskDragging || category.entries.length>0).map(category=>{const key=category.id,entries=category.entries,board=view.boards.find(b=>b.id===key),index=view.boards.findIndex(b=>b.id===key),color=board?taskCategoryColor(board,index):'#8271a3';return E('section',{key,className:'rw-daily-category',...dragOrdering('daily',category,categoryList),onDragOver:e=>{if(draggingTask){e.preventDefault();e.stopPropagation();e.currentTarget.classList.add('rw-drop-target')}else dragOrdering('daily',category,categoryList).onDragOver(e)},onDrop:e=>{if(draggingTask){e.preventDefault();e.stopPropagation();moveTask(draggingTask,key);draggingTask=null;setTaskDragging(false);e.currentTarget.classList.remove('rw-drop-target')}else dragOrdering('daily',category,categoryList).onDrop(e)}},E('header',null,E('span',{className:'rw-category-dot',style:{background:color},'aria-hidden':true}),E('h3',null,category.name),E('span',{className:'rw-category-count'},entries.length),key===dailyGroup?.id||key==='__daily'?E('button',{type:'button',className:'lwb-icon-btn rw-category-action',disabled:view.calendarSyncing,onClick:()=>void syncMacCalendar(filter || today),'aria-label':'同步 Mac 日历',title:view.calendarSyncing?'正在同步日历':'同步 Mac 日历'},E(RefreshIcon)):board&&!['work','life','daily'].includes(board.id)&&!['每日事项','工作','生活'].includes(board.title)?E('button',{type:'button',className:'lwb-icon-btn rw-category-action',title:'删除分类','aria-label':'删除分类：'+board.title,onClick:()=>{if(window.confirm('删除“'+board.title+'”分类及其中的 '+(board.cards || []).length+' 项事项？可在最近删除中还原。')){removeBoard(board.id);setDraft(d=>d.boardId===board.id?{...d,boardId:''}:d)}}},E(QuietIcon,{name:'trash'})):null),E('div',{className:'rw-unified-list'+(expanded?' is-expanded':'')},(expanded?entries:entries.slice(0,4)).map(renderTask)))})),
          E('section',{id:addId,ref:addRef,popover:'auto',role:'dialog','aria-label':'添加待办事项',className:'rw-add-task-popover'},
            E('header',null,E('h3',null,'添加事项'),E('button',{type:'button',className:'lwb-icon-btn',title:'关闭','aria-label':'关闭添加事项',popovertarget:addId,popovertargetaction:'hide'},E(QuietIcon,{name:'close'}))),
            E(RecognitionBox,{kind:'task',current:draft,onApply:data=>{const next={...draft,text:data.text ?? draft.text,date:data.date ?? draft.date,time:data.time ?? draft.time};setDraft(next);setLocalError('');return next},onRestore:previous=>setDraft(previous)}),
            E('form',{onSubmit:e=>{e.preventDefault();commit()}},
              E('input',{className:'lwb-input',autoFocus:true,'aria-label':'任务内容',placeholder:'事项内容',value:draft.text,onChange:e=>setDraft({...draft,text:e.target.value})}),
              E('div',{className:'rw-add-task-fields'},E('label',null,'日期',E('input',{className:'lwb-input',type:'date','aria-label':'任务日期',value:draft.date,onInput:e=>setDraft(d=>({...d,date:e.target.value})),onChange:e=>setDraft(d=>({...d,date:e.target.value}))})),
                E('label',null,'时间（可选）',E('input',{className:'lwb-input',type:'time','aria-label':'任务时间',value:draft.time,onInput:e=>setDraft(d=>({...d,time:e.target.value})),onChange:e=>setDraft(d=>({...d,time:e.target.value}))}))),
              E('div',{className:'rw-category-picker'},E('select',{className:'lwb-select','aria-label':'事项分类',value:boardId,onChange:e=>setDraft({...draft,boardId:e.target.value})},view.boards.map(b=>E('option',{key:b.id,value:b.id},b.title))),E('button',{type:'button',className:'lwb-icon-btn',title:addingCategory?'收起新建分类':'新建分类','aria-label':addingCategory?'收起新建分类':'新建分类','aria-expanded':addingCategory,onClick:()=>setAddingCategory(!addingCategory)},E(AddIcon))),
              addingCategory?E('div',{className:'rw-category-picker'},E('input',{className:'lwb-input',placeholder:'新分类名称','aria-label':'新分类名称',maxLength:40,value:newCategory,onChange:e=>setNewCategory(e.target.value),onKeyDown:e=>{if(e.key==='Enter'){e.preventDefault();createCategory()}}}),E('button',{type:'button',className:'lwb-icon-btn',title:'保存分类','aria-label':'保存分类',disabled:!newCategory.trim(),onClick:createCategory},E(QuietIcon,{name:'task'}))):null,
              localError?E('div',{className:'lwb-err',role:'alert'},localError):null,
              E('footer',null,E('button',{type:'submit',className:'lwb-btn',disabled:!draft.text.trim()},'添加')))),
          E(TaskDatePopover,{id:filterId,date:filter,filter:true,onDate:date=>{setFilter(date);setExpanded(false)}}),
          E('section',{id:recentId,popover:'auto',className:'rw-recent-popover rw-history-columns',role:'dialog','aria-label':'最近完成与最近删除'},
            E('div',{className:'rw-history-column rw-history-done'},E('h3',{className:'lwb-pane-title'},'最近完成',E('span',{className:'lwb-count'},completed.length)),completed.length?completed.map(item=>E('div',{className:'lwb-item',key:item.kind+'-'+item.id},E('input',{type:'checkbox',className:'lwb-check',checked:true,'aria-label':'恢复待办：'+item.text,onChange:()=>toggle(item)}),E('span',{className:'lwb-item-text lwb-item-done'},item.text),E('button',{type:'button',className:'lwb-icon-btn',title:'移到最近删除','aria-label':'删除：'+item.text,onClick:()=>remove(item)},E(QuietIcon,{name:'trash'})))):E('p',{className:'rw-help'},'暂无完成事项')),
            E('div',{className:'rw-history-column rw-history-deleted'},E('h3',{className:'lwb-pane-title'},'最近删除',E('span',{className:'lwb-count'},(view.deletedItems || []).length),E('button',{type:'button',className:'lwb-icon-btn',title:'清空最近删除','aria-label':'清空最近删除',disabled:!(view.deletedItems || []).length,onClick:()=>{if(window.confirm('永久清空最近删除？清空后无法还原。'))persist({deletedItems:[]})}},E(QuietIcon,{name:'trash'}))),
              (view.deletedItems || []).length?(view.deletedItems || []).map(entry=>E('div',{className:'lwb-item',key:entry.id},E('div',{className:'rw-deleted-copy'},E('span',{className:'lwb-item-text'},entry.data.title || entry.data.text || '未命名'),entry.kind==='board'?E('small',null,'分类 · '+(entry.data.cards || []).length+' 项', (entry.data.cards || []).length?' · '+entry.data.cards.map(c=>c.title).join('、'):''):null),E('button',{type:'button',className:'lwb-icon-btn',title:'还原','aria-label':'还原：'+(entry.data.title || entry.data.text),onClick:()=>restoreDeleted(entry.id)},svg({size:15,weight:1.6},[E('path',{key:'restore',d:'M4 10h10a6 6 0 0 1 0 12M4 10l5-5M4 10l5 5'})])))):E('p',{className:'rw-help'},'暂无删除内容'))))
      }
      function CardRow(props) {
        const board = props.board
        const card = props.card
        const view = useSnapshot()
        const openPair = React.useState(false)
        const attachOpen = openPair[0]
        const setAttachOpen = openPair[1]
        const editing = props.editing
        const setEditing = props.setEditing
        const zoom = props.zoom

        if (card === null || card === undefined) return null
        const isEditing = editing !== null && editing.id === card.id
        const attached = view.files.filter(function (f) { return f !== null && f !== undefined && f.cardId === card.id })

        return React.createElement('div', { className: 'lwb-card' },
          React.createElement('div', { className: 'lwb-card-row' },
            React.createElement('input', {
              type: 'checkbox', className: 'lwb-check', checked: card.done === true,
              onChange: function () { toggleCard(board.id, card.id) },
            }),
            isEditing
              ? React.createElement(InlineEdit, {
                  open: true, value: card.title, draft: editing.value,
                  onDraft: function (t) { setEditing({ id: card.id, value: t }) },
                  onCommit: function (t) { renameCard(board.id, card.id, t) },
                  onClose: function () { setEditing(null) },
                })
              : React.createElement('span', {
                  className: card.done === true ? 'lwb-item-text lwb-item-done' : 'lwb-item-text',
                  title: '双击编辑',
                  onDoubleClick: function () { setEditing({ id: card.id, value: card.title }) },
                }, card.title),
            React.createElement('button', {
              className: 'lwb-icon-btn', style: { display: 'flex', alignItems: 'center', gap: 4 },
              title: attached.length > 0 ? ('附件 ' + attached.length) : '添加附件',
              onClick: function () { setAttachOpen(!attachOpen) },
            },
              React.createElement(ClipIcon, { size: 15 }),
              attached.length > 0 ? React.createElement('span', { style: { fontFamily: 'var(--mono-font)', fontSize: 10 } }, String(attached.length)) : null
            ),
            React.createElement('button', { className: 'lwb-icon-btn', title: '删除', onClick: function () { removeCard(board.id, card.id) } }, '\u00d7')
          ),
          attachOpen
            ? React.createElement('div', { className: 'lwb-attach' },
                attached.length === 0
                  ? React.createElement('span', { className: 'lwb-empty', style: { padding: 0 } }, '还没有附件')
                  : attached.map(function (file) {
                      if (file === null || file === undefined) return null
                      if (file.kind === 'image') {
                        return React.createElement(FileThumb, { key: file.id, file: file, className: 'lwb-attach-thumb', onZoom: zoom })
                      }
                      return React.createElement('span', { className: 'lwb-attach-chip', key: file.id, title: file.name }, file.name || '文件')
                    }),
                React.createElement(UploadZone, { label: '上传到这条', target: { boardId: board.id, cardId: card.id } })
              )
            : null
        )
      }

      function BoardsView() {
        const view = useSnapshot()
        const boardDraftPair = React.useState('')
        const boardDraft = boardDraftPair[0]
        const setBoardDraft = boardDraftPair[1]
        const addingPair = React.useState(false)
        const adding = addingPair[0]
        const setAdding = addingPair[1]
        const menuPair = React.useState('')
        const menu = menuPair[0]
        const setMenu = menuPair[1]
        const confirmPair = React.useState('')
        const confirmBoard = confirmPair[0]
        const setConfirmBoard = confirmPair[1]
        const draftPair = React.useState({})
        const drafts = draftPair[0]
        const setDrafts = draftPair[1]
        const editPair = React.useState(null)
        const editing = editPair[0]
        const setEditing = editPair[1]
        const zoomPair = React.useState('')
        const zoom = zoomPair[0]
        const setZoom = zoomPair[1]
        const boards = view.boards.map(board => Object.assign({}, board, {cards: (board.cards || []).filter(card => !card.projectId)}))

        // 菜单打开时，点击页面其它地方关闭（菜单项与触发按钮自身 stopPropagation）
        React.useEffect(function () {
          if (menu === '') return undefined
          const close = function () { setMenu('') }
          document.addEventListener('click', close)
          return function () { document.removeEventListener('click', close) }
        }, [menu])

        function commitBoard() {
          const title = boardDraft.trim()
          if (title === '') { setAdding(false); return }
          addBoard(title)
          setBoardDraft('')
          setAdding(false)
        }
        function commitCard(boardId) {
          const text = (drafts[boardId] || '').trim()
          if (text === '') return
          addCard(boardId, text)
          setDrafts(Object.assign({}, drafts, { [boardId]: '' }))
        }
        /**
         * 切换看板的「每日事项」类型：每日看板跨天时会把当天明细归档后重置勾选。
         * 删除 kind 字段而不是置 undefined，避免它在 JSON 里留下占位。
         */
        function toggleDaily(boardId) {
          patchBoard(boardId, function (board) {
            const next = Object.assign({}, board)
            if (next.kind === 'daily') delete next.kind
            else next.kind = 'daily'
            return next
          })
        }

        function renderBoard(board) {
          if (board === null || board === undefined) return null
          const cards = Array.isArray(board.cards) ? board.cards : []
          const doneCount = cards.filter(function (c) { return c !== null && c !== undefined && c.done === true }).length
          return React.createElement('section', { key: board.id, className: 'lwb-col' },
            React.createElement('header', { className: 'lwb-colhead' },
              React.createElement('span', { className: 'lwb-item-text', style: { fontWeight: 600, cursor: 'default' } }, board.title),
              board.kind === 'daily' ? React.createElement('span', { className: 'lwb-badge' }, 'DAILY') : null,
              React.createElement('div', { className: 'lwb-spacer' }),
              React.createElement('span', { className: 'lwb-count' }, cards.length > 0 ? doneCount + '/' + cards.length : ''),
              confirmBoard === board.id
                ? React.createElement('span', { className: 'lwb-confirm' },
                    React.createElement('button', { className: 'lwb-btn lwb-btn-danger lwb-mini', onClick: function () { removeBoard(board.id); setConfirmBoard('') } }, '删除'),
                    React.createElement('button', { className: 'lwb-btn lwb-mini', onClick: function () { setConfirmBoard('') } }, '取消')
                  )
                : React.createElement('span', { className: 'lwb-menu-wrap' },
                    React.createElement('button', {
                      type:'button',className: 'lwb-icon-btn', title: '看板设置','aria-label':board.title+'看板设置','aria-expanded':menu===board.id,
                      onClick: function (event) {
                        event.stopPropagation()
                        setMenu(menu === board.id ? '' : board.id)
                      },
                    }, '\u22ef'),
                    menu === board.id
                      ? React.createElement('span', { className: 'lwb-menu' },
                          React.createElement('button', {
                            type:'button', className:'lwb-menu-item',
                            onClick:function(event){event.stopPropagation();patchBoard(board.id,b=>Object.assign({},b,{hideCompleted:b.hideCompleted!==true}));setMenu('')},
                          },board.hideCompleted===true?'显示已完成事项':'隐藏已完成事项'),
                          React.createElement('button', {
                            className: 'lwb-menu-item',
                            onClick: function (event) {
                              event.stopPropagation()
                              toggleDaily(board.id)
                              setMenu('')
                            },
                          }, board.kind === 'daily' ? '取消「每日事项」' : '设为「每日事项」'),
                          React.createElement('button', {
                            className: 'lwb-menu-item lwb-menu-item-danger',
                            onClick: function (event) {
                              event.stopPropagation()
                              setConfirmBoard(board.id)
                              setMenu('')
                            },
                          }, '删除看板')
                        )
                      : null
                  )
            ),
            React.createElement('div', { className: 'lwb-cards' },
              cards.filter(card=>board.hideCompleted!==true||card?.done!==true).map(function (card) {
                return React.createElement(CardRow, {
                  key: card !== null && card !== undefined ? card.id : Math.random(),
                  board: board, card: card, editing: editing, setEditing: setEditing, zoom: setZoom,
                })
              })
            ),
            React.createElement('input', {
              className: 'lwb-input', placeholder: '添加事项',
              value: drafts[board.id] || '',
              onChange: function (event) { setDrafts(Object.assign({}, drafts, { [board.id]: event.target.value })) },
              onKeyDown: function (event) { if (event.key === 'Enter') commitCard(board.id) },
            })
          )
        }

        return React.createElement('div', null,
          React.createElement('div', { style: { display: 'flex', gap: 9, marginBottom: 15, alignItems: 'center' } },
            React.createElement('div', { className: 'lwb-spacer' }),
            adding
              ? React.createElement('span', { className: 'lwb-confirm' },
                  React.createElement('input', {
                    className: 'lwb-input', placeholder: '看板名称', autoFocus: true, value: boardDraft,
                    style: { maxWidth: 158 },
                    onChange: function (event) { setBoardDraft(event.target.value) },
                    onKeyDown: function (event) {
                      if (event.key === 'Enter') commitBoard()
                      if (event.key === 'Escape') { setAdding(false); setBoardDraft('') }
                    },
                  }),
                  React.createElement('button', { className: 'lwb-btn lwb-btn-primary', onClick: commitBoard }, '创建'),
                  React.createElement('button', { className: 'lwb-btn', onClick: function () { setAdding(false); setBoardDraft('') } }, '取消')
                )
              : React.createElement('button', { className: 'lwb-btn', onClick: function () { setAdding(true) } }, '新增看板')
          ),
          React.createElement('div', { className: 'lwb-boards' }, boards.map(function (board) { return renderBoard(board) })),
          zoom !== ''
            ? React.createElement('div', { className: 'lwb-lightbox', onClick: function () { setZoom('') } },
                React.createElement('img', { src: zoom, alt: '' })
              )
            : null
        )
      }

      const E = React.createElement
      const PROJECT_STATES = {active:'进行中',planned:'计划中',paused:'暂缓',completed:'已完成'}
      function validDay(day) { if(!/^\d{4}-\d{2}-\d{2}$/.test(day || ''))return false;const d=new Date(day+'T12:00:00Z');return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===day }
      function dayValue(day) { return Date.parse(day+'T12:00:00') }
      function safeLink(value) { try { const u=new URL(value); return ['http:','https:'].includes(u.protocol) ? u.href : null } catch { return null } }
      function projectLabel(project) { return project.kind==='course' ? '教学任务' : '研究项目' }
      function updateProjects(project) {
        const links=orderedProjectLinks(project);project={...project,links,primaryLinkUrl:links[0]?.url || ''}
        const found=snapshot.projects.some(p=>p.id===project.id)
        const next=synchronizeCollaborators(snapshot.projects,found?snapshot.projects.map(p=>p.id===project.id?project:p):snapshot.projects.concat(project),snapshot.contacts)
        persist(next)
      }
function reconcileCollaborators(projects,contacts=[]){
 const all=[...contacts.map(c=>({...c,contactId:c.id})),...projects.flatMap(projectPeople)]
 const resolve=person=>{
  const group=all.filter(c=>sameContact(c,person)),next={...person}
  for(const key of ['email','institution','notes'])if(!next[key]){const values=[...new Set(group.map(c=>c[key]).filter(Boolean))];if(values.length===1)next[key]=values[0]}
  const known=group.find(c=>c.contactId);if(known)next.contactId=known.contactId
  return next
 }
 return {projects:projects.map(p=>Array.isArray(p.collaboratorDetails)?{...p,collaboratorDetails:p.collaboratorDetails.map(resolve)}:p),contacts:contacts.map(c=>{const next=resolve({...c,contactId:c.id});delete next.contactId;return next})}
}
function contactNameKey(name){return String(name || '').normalize('NFKC').trim().toLowerCase().replace(/,/g,' ').split(/\s+/).filter(Boolean).sort().join(' ')}
function sameContact(a,b){
 if(a.contactId&&b.contactId&&a.contactId===b.contactId)return true
 if(a.email&&b.email&&a.email.toLowerCase()===b.email.toLowerCase())return true
 return !!a.name&&contactNameKey(a.name)===contactNameKey(b.name)
}
function synchronizeCollaborators(previous,projects,contacts=[]){
 let result=projects.map(p=>({...p,collaboratorDetails:projectPeople(p)})),directory=contacts.map(c=>({...c}))
 for(const project of projects){
  const oldProject=previous.find(p=>p.id===project.id),oldPeople=projectPeople(oldProject)
  for(const person of projectPeople(project)){
   const old=oldPeople.find(p=>person.id&&p.id===person.id)||oldPeople.find(p=>sameContact(p,person))
   const patch={};for(const key of ['name','institution','email','notes'])if(old?person[key]!==old[key]:!!person[key])patch[key]=person[key]
   if(!Object.keys(patch).length)continue
   const matches=p=>sameContact(p,person)||(old&&sameContact(p,old))
   const known=directory.find(c=>matches({...c,contactId:c.id})),contactId=person.contactId||old?.contactId||known?.id||person.id||'contact-'+Date.now().toString(36)+'-'+directory.length
   result=result.map(p=>{const people=p.collaboratorDetails.map(c=>matches(c)?{...c,...patch,contactId}:c);return {...p,collaboratorDetails:people,collaborators:people.map(c=>c.name).join('、')}})
   if(known)directory=directory.map(c=>matches({...c,contactId:c.id})?{...c,...patch,id:c.id}:c);else directory.push({...contactFields(person),id:contactId})
  }
 }
 return {projects:result,contacts:directory}
}
const contactClean=(v,max=1000)=>typeof v==='string'?v.trim().slice(0,max):''
function contactFields(value){const p=value&&typeof value==='object'?value:{};return {name:contactClean(p.name,200),institution:contactClean(p.institution,500),email:contactClean(p.email,320),notes:contactClean(p.notes,4000)}}
function projectPeople(project){if(Array.isArray(project?.collaboratorDetails))return project.collaboratorDetails.map(p=>({...contactFields(p),id:contactClean(p.id,200),contactId:contactClean(p.contactId,200)})).filter(p=>p.name||p.email||p.institution||p.notes);const name=contactClean(project?.collaborators,12000);return name?[{name,institution:'',email:'',notes:''}]:[]}
function mergeContacts(existing,people,overwrite=true){const result=(Array.isArray(existing)?existing:[]).filter(p=>p&&typeof p==='object').map(p=>({...contactFields(p),id:contactClean(p.id,200)})).filter(p=>p.name);for(const raw of people){const person=contactFields(raw);if(!person.name)continue;const email=person.email.toLocaleLowerCase(),identity=p=>p.name.toLocaleLowerCase()===person.name.toLocaleLowerCase()&&p.institution.toLocaleLowerCase()===person.institution.toLocaleLowerCase();const index=result.findIndex(p=>(raw.contactId&&p.id===raw.contactId)||(email&&p.email.toLocaleLowerCase()===email)||(!email&&!p.email&&identity(p))||(identity(p)&&(!email||!p.email)));if(index>=0){if(overwrite)result[index]={...person,id:result[index].id}}else result.push({...person,id:contactClean(raw.contactId || raw.id,200)||'contact-'+result.length+'-'+Date.now().toString(36)})}return result}

      function shortPersonName(value){
        const name=String(value || '').trim().replace(/\s+/g,' ')
        if(!name||/[\u3400-\u9fff]/u.test(name))return name
        const comma=name.split(',').map(s=>s.trim()),words=name.split(' ')
        if(words.length<2)return name
        const surnames=new Set('lou li wang zhang liu chen yang huang zhao wu zhou xu sun ma zhu hu guo he gao lin luo zheng liang xie song tang han feng yu dong xiao cheng cao yuan deng fu shen peng lu su jiang cai jia ding wei xue ye yan pan du dai xia tian ren fan fang shi yao tan shao jin qian qin hao kong bai cui kang mao qiu gu meng wen mo zeng zou lai ouyang szeto hsieh hsu chang chiang tsai'.split(' '))
        let family,given
        if(comma.length===2){family=comma[0];given=comma[1].split(' ')}
        else if(surnames.has(words[0].toLowerCase())&&!surnames.has(words[words.length-1].toLowerCase())){family=words[0];given=words.slice(1)}
        else {let i=words.length-1;while(i>0&&['de','del','van','von','der','den','da','di','dos','la','le'].includes(words[i-1].toLowerCase()))i--;family=words.slice(i).join(' ');given=words.slice(0,i)}
        return given.map(word=>word.split('-').filter(Boolean).map(part=>Array.from(part)[0].toLocaleUpperCase()+'.').join('-')).join(' ')+' '+family
      }
      function CollaboratorSummary({project,compact=false}){
        const people=projectPeople(project);if(!people.length)return null
        return E('div',{className:'rw-people'+(compact?' rw-people-compact':''),'aria-label':'合作者'},E('span',{className:'rw-collaborator-label',title:'合作者','aria-label':'合作者',style:{color:'var(--rw-hint)',display:'inline-flex',flexShrink:0}},E('svg',{width:13,height:13,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},E('circle',{cx:9,cy:8,r:3}),E('path',{d:'M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 20v-2a6 6 0 0 0-3-5'}))),people.map((p,i)=>E('div',{className:'rw-person',key:p.id || i},E('span',{className:'rw-person-name',tabIndex:0,title:[p.name,p.institution,p.email,p.notes].filter(Boolean).join('\n')},shortPersonName(p.name)||p.email),p.email?E('a',{className:'rw-person-mail',href:'mailto:'+encodeURIComponent(p.email.trim().replace(/[\r\n]/g,'')),title:'给 '+p.name+' 写邮件：'+p.email,'aria-label':'给 '+p.name+' 写邮件'},E('svg',{width:13,height:13,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},E('rect',{x:3,y:5,width:18,height:14,rx:3}),E('path',{d:'m4 7 8 6 8-6'}))):null)))
      }
      function CollaboratorEditor({project,onChange}){
        const view=useSnapshot(),people=Array.isArray(project.collaboratorDetails)?project.collaboratorDetails:projectPeople(project).map((p,i)=>Object.assign({id:'legacy-person-'+i},p))
        const [focus,setFocus]=React.useState(null),[active,setActive]=React.useState(-1),listId='rw-contacts-'+React.useId()
        const contacts=mergeContacts(view.contacts,view.projects.flatMap(projectPeople),false)
        const row=people.find(p=>p.id===focus?.id),query=(row?.[focus?.key] || '').trim().toLocaleLowerCase()
        const choices=focus?contacts.filter(p=>p.email||p.institution||p.notes||!contacts.some(other=>other.id!==p.id&&other.name===p.name&&(other.email||other.institution||other.notes))).filter(p=>[p.name,p.institution,p.email,p.notes].join(' ').toLocaleLowerCase().includes(query)).slice(0,8):[]
        const commit=next=>onChange(next)
        function change(id,key,value){commit(people.map(p=>p.id===id?Object.assign({},p,{[key]:value,...(key==='name'||key==='email'?{contactId:''}:{})}):p));setActive(-1)}
        function choose(person){commit(people.map(p=>p.id===focus.id?Object.assign({},contactFields(person),{id:p.id,contactId:person.id}):p));setFocus(null);setActive(-1)}
        function input(p,key,label,type='text'){
          const suggest=key==='name'||key==='email',opened=suggest&&focus?.id===p.id&&focus?.key===key&&choices.length>0
          return E('label',{className:'rw-field rw-person-field',key},E('span',null,label),E('input',{className:'lwb-input','aria-label':label,type,value:p[key] || '',autoComplete:'off',maxLength:key==='email'?320:key==='name'?200:500,...(suggest?{role:'combobox','aria-autocomplete':'list','aria-expanded':!!opened,'aria-controls':opened?listId:undefined,'aria-activedescendant':opened&&active>=0?listId+'-'+active:undefined}:{}),onFocus:()=>{if(suggest){setFocus({id:p.id,key});setActive(-1)}},onBlur:()=>{setFocus(f=>f?.id===p.id&&f?.key===key?null:f)},onChange:e=>{change(p.id,key,e.target.value);if(suggest)setFocus({id:p.id,key})},onKeyDown:e=>{if(!opened)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setActive(n=>(n+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length)}else if(e.key==='Enter'){e.preventDefault();choose(choices[active>=0?active:0])}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setFocus(null)}}}),opened?E('div',{id:listId,role:'listbox','aria-label':'已有合作者',className:'rw-person-suggestions'},choices.map((c,i)=>E('button',{type:'button',role:'option',id:listId+'-'+i,key:c.id,'aria-selected':active===i,className:active===i?'rw-person-option rw-person-option-active':'rw-person-option',onMouseDown:e=>e.preventDefault(),onClick:()=>choose(c)},E('strong',null,c.name),E('span',null,[c.institution,c.email].filter(Boolean).join(' · '))))):null)
        }
        return E('section',{className:'rw-people-editor','aria-label':'合作者信息'},E('div',{className:'rw-plan-heading'},E('h3',null,'合作者'),E('span',{className:'lwb-spacer'}),E('button',{type:'button',className:'lwb-icon-btn rw-header-icon rw-action-icon',title:'添加合作者','aria-label':'添加合作者',onClick:()=>commit(people.concat({id:nextId('person'),name:'',institution:'',email:'',notes:''}))},E(AddIcon))),people.map((p,i)=>E('div',{className:'rw-person-editor',key:p.id},E('div',{className:'rw-person-row-head'},E('span',{className:'rw-help'},'合作者 '+(i+1)),E('button',{type:'button',className:'lwb-icon-btn rw-header-icon rw-action-icon',title:'移除合作者','aria-label':'移除合作者 '+(p.name || i+1),onClick:()=>{commit(people.filter(x=>x.id!==p.id));setFocus(null)}},svg({size:18,weight:1.7},E('path',{d:'M6 6l12 12M18 6 6 18'})))),E('div',{className:'rw-person-fields'},input(p,'name','姓名'),input(p,'institution','单位'),input(p,'email','邮箱','email'),E('label',{className:'rw-field'},E('span',null,'备注'),E('textarea',{className:'lwb-textarea',rows:2,maxLength:4000,value:p.notes || '',onChange:e=>change(p.id,'notes',e.target.value)}))))),!people.length?E('p',{className:'rw-help'},'暂无合作者'):null)
      }

      function newProject() { return {id:nextId('project'),title:'',kind:'paper',status:'planned',stage:'',collaborators:'',background:'',nextStep:'',plannedDate:todayKey(),startDate:'',targetDate:'',endDate:'',links:[],references:'',milestones:[],updates:[],createdAt:todayKey()} }
      function projectPlanDate(project){
        const added=(project.createdAt || '').slice(0,10)
        return validDay(project.plannedDate)?project.plannedDate:validDay(added)?added:''
      }
      function projectEvents(project) {
        const events=[]
        for(const [key,label] of [['plannedDate','计划日期'],['startDate','实际开始'],['targetDate','预计完成'],['endDate','实际完成']]) {
          const date=key==='plannedDate'?projectPlanDate(project):(project[key] || '').slice(0,10)
          if(validDay(date))events.push({id:key,date,label,estimated:key==='plannedDate'||key==='targetDate'})
        }
        for(const [i,m] of (project.milestones || []).entries()) {
          const id=m.id || 'stage-'+i
          if(validDay(m.date))events.push({id:id+'-date',date:m.date,label:m.title+' · 阶段日期',estimated:!m.done})
          if(m.done && validDay(m.doneAt) && m.doneAt!==m.date)events.push({id:id+'-done',date:m.doneAt,label:m.title+' · 已完成',estimated:false})
          else if(m.done && validDay(m.date))events[events.length-1].label=m.title+' · 已完成'
        }
        return events.sort((a,b)=>a.date.localeCompare(b.date))
      }
      function compactTimelineGroups(project,today){
        const short={plannedDate:'计划',startDate:'开始',targetDate:'预计',endDate:'完成'},groups=[]
        for(const point of projectEvents(project)){
          let group=groups[groups.length-1];if(!group||group.date!==point.date){group={date:point.date,events:[]};groups.push(group)}
          group.events.push(Object.assign({},point,{short:short[point.id] || point.label.split(' · ')[0]}))
        }
        for(const group of groups){group.actual=group.date<=today&&group.events.some(p=>!p.estimated);group.future=group.date>today;group.short=[...new Set(group.events.map(p=>p.short))].join(' / ');group.description=group.events.map(p=>p.label).join('、')+'：'+group.date}
        return groups
      }
      function compactTimelineRows(groups,width,crossYear){
        const labelWidth=crossYear?64:52,gap=10,available=Math.max(labelWidth,Number(width)||320),capacity=Math.max(1,Math.min(6,Math.floor((available+gap)/(labelWidth+gap)))),rows=[]
        for(let i=0;i<groups.length;i+=capacity){
          const points=groups.slice(i,i+capacity),intervals=points.slice(1).map((p,j)=>calendarDay(p.date)-calendarDay(points[j].date)),total=intervals.reduce((a,b)=>a+b,0),free=Math.max(0,available-points.length*labelWidth-Math.max(0,points.length-1)*gap)
          rows.push({labelWidth,points,columns:points.map((p,j)=>j===points.length-1?labelWidth:labelWidth+gap+(total?free*intervals[j]/total:0))})
        }
        return rows
      }
      function ProjectTimeline({project}) {
        const today=useCalendarToday(),groups=compactTimelineGroups(project,today),years=[...new Set(groups.map(p=>p.date.slice(0,4)))],crossYear=years.length>1
        const ref=React.useRef(null),[width,setWidth]=React.useState(320)
        React.useEffect(()=>{const el=ref.current;if(!el)return;const measure=()=>setWidth(el.clientWidth);measure();const observer=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;observer?.observe(el);return()=>observer?.disconnect()},[])
        const labelWidth=crossYear?54:42, intervals=groups.slice(1).map((p,i)=>calendarDay(p.date)-calendarDay(groups[i].date)),total=intervals.reduce((a,b)=>a+b,0),free=Math.max(0,width-groups.length*labelWidth)
        const rows=groups.length?[{labelWidth,points:groups,columns:groups.map((p,i)=>labelWidth+(i<groups.length-1&&total?free*intervals[i]/total:0))}]:[]
        return E('div',{className:'rw-compact-timeline',ref},
          E('div',{className:'rw-compact-time-head'},E('span',{className:'rw-card-caption'},'时间安排'),years.length?E('span',{className:'rw-compact-years'},years.length===1?years[0]:years[0]+'–'+years[years.length-1]):null),
          groups.length?E('div',{className:'rw-compact-time-rows'},rows.map((row,index)=>E('ol',{key:row.points[0].date,className:'rw-compact-time-axis','aria-label':'项目时间节点'+(rows.length>1?' · '+(index+1):''),style:{gridTemplateColumns:row.columns.map(n=>n+'px').join(' '),'--rw-node-label-width':row.labelWidth+'px'}},row.points.map((group,i)=>E('li',{key:group.date,className:'rw-compact-node'+(group.actual?' rw-node-actual':'')+(group.future?' rw-node-future':'')+(i<row.points.length-1&&row.points[i+1].date<=today?' rw-node-elapsed':''),title:group.description},
            E('time',{dateTime:group.date,'aria-label':group.date},(crossYear?group.date.slice(2):group.date.slice(5)).replaceAll('-','.')),
            E('span',{className:'rw-compact-node-dot','aria-hidden':true},group.events.some(p=>p.id==='endDate')&&group.actual?'✓':null),
            E('span',{className:'rw-compact-node-label'},group.short)))))):null)
      }
      const PROJECT_COLORS=['#3267a8','#297d73','#9a6630','#7759a4','#a64d61','#516b43','#517c91','#9b7732']
      function calendarDay(day){return Date.parse(day+'T00:00:00Z')/86400000}
      function calendarStamp(value){return new Date(value*86400000).toISOString().slice(0,10)}
      function nextMonth(day){const d=new Date(day.slice(0,7)+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);return d.toISOString().slice(0,10)}
      function projectColor(id){let hash=0;for(const c of String(id))hash=(hash*31+c.charCodeAt(0))>>>0;return PROJECT_COLORS[hash%PROJECT_COLORS.length]}
      function nextCalendarDelay(now){return new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime()-now.getTime()+200}
      function useCalendarToday(){
        const [today,setToday]=React.useState(todayKey)
        React.useEffect(()=>{
          let timer=null
          const update=()=>{if(timer!==null)clearTimeout(timer);setToday(todayKey());timer=setTimeout(update,nextCalendarDelay(new Date()))}
          const resume=()=>{if(document.visibilityState==='visible')update()}
          update();document.addEventListener('visibilitychange',resume)
          return()=>{if(timer!==null)clearTimeout(timer);document.removeEventListener('visibilitychange',resume)}
        },[])
        return today
      }
      function sharedTimelineModel(projects,today,width=850,scale='fit'){
        const usedColors=new Set();const days=[today],rows=projects.map(project=>{
          const events=projectEvents(project),groups=[]
          for(const event of events){let group=groups[groups.length-1];if(!group||group.date!==event.date){group={date:event.date,events:[]};groups.push(group)}group.events.push(event)}
          const start=projectPlanDate(project)||(validDay(project.startDate)?project.startDate:null)
          // Filled bars show elapsed calendar time; completion is always an explicit date.
          const end=validDay(project.endDate)?project.endDate:today
          const elapsed=!!start&&start<=today&&end>=start
          events.forEach(e=>days.push(e.date));if(start)days.push(start);days.push(end)
          let color=projectColor(project.id);if(usedColors.size<PROJECT_COLORS.length){let i=PROJECT_COLORS.indexOf(color);while(usedColors.has(color)){i=(i+1)%PROJECT_COLORS.length;color=PROJECT_COLORS[i]}}if(usedColors.size>=PROJECT_COLORS.length)color='hsl('+((usedColors.size*137.508)%360).toFixed(1)+' 42% 42%)';usedColors.add(color)
          return {project,start,end,elapsed,color,groups,undated:(project.milestones || []).filter(m=>!validDay(m.date)&&!(m.done&&validDay(m.doneAt))).length}
        })
        const sorted=days.filter(validDay).sort(),min=sorted[0].slice(0,7)+'-01',end=nextMonth(sorted[sorted.length-1]),first=calendarDay(min),count=calendarDay(end)-first
        const pixels=scale==='day'?28:scale==='week'?12:scale==='month'?4:0
        const chartWidth=pixels?Math.max(680,count*pixels):Math.max(680,width)
        const position=date=>(calendarDay(date)-first+.5)/count*100
        const months=[],years=[]
        for(let month=min;month<end;month=nextMonth(month)){
          const left=(calendarDay(month)-first)/count*100,span=(calendarDay(nextMonth(month))-calendarDay(month))/count*100
          months.push({date:month,left,width:span,label:Number(month.slice(5,7))+'月'})
          let year=years[years.length-1];if(!year||year.label!==month.slice(0,4)){year={label:month.slice(0,4),left,width:0};years.push(year)}year.width+=span
        }
        const perDay=chartWidth/count,ticks=[]
        if(perDay>=5){const step=perDay>=24?1:7;let firstTick=first;if(step===7)firstTick+=(8-new Date(first*86400000).getUTCDay())%7
          for(let day=firstTick;day<first+count;day+=step){const date=calendarStamp(day);ticks.push({date,left:position(date),label:step===1?date.slice(8):date.slice(5),weekend:[0,6].includes(new Date(day*86400000).getUTCDay())})}}
        else{const step=Math.max(1,Math.ceil(65/(perDay*30)));months.forEach((m,i)=>{if(i%step===0)ticks.push({date:m.date,left:position(m.date),label:m.date.slice(5)})})}
        for(const row of rows){const lanes=[]
          for(const group of row.groups){group.position=position(group.date);group.label=group.events.map(e=>e.label).join(' · ');group.estimated=group.events.every(e=>e.estimated)
            const labelWidth=Math.min(210,Math.max(132,group.label.length*10+12)),x=group.position/100*chartWidth;group.labelWidth=labelWidth;group.left=Math.max(4,Math.min(chartWidth-labelWidth-4,x-8));let lane=lanes.findIndex(right=>right+12<=group.left);if(lane<0)lane=lanes.length;lanes[lane]=group.left+labelWidth;group.lane=lane}
          row.height=Math.max(104,68+lanes.length*42);row.barLeft=row.start?position(row.start):0;row.barWidth=row.elapsed?(calendarDay(row.end)-calendarDay(row.start))/count*100:0
        }
        return {rows,months,years,ticks,first:min,last:calendarStamp(first+count-1),days:count,width:chartWidth,position,todayPosition:position(today)}
      }
      function wrappedTimelineModels(projects,today,width,scale='fit'){
        width=Math.max(160,width);const base=sharedTimelineModel(projects,today,width),first=calendarDay(base.first),last=calendarDay(base.last)+1,windows=[]
        let cursor=first
        while(cursor<last){
          let end
          if(scale==='day')end=Math.min(last,cursor+Math.max(7,Math.floor(width/24)))
          else if(scale==='week')end=Math.min(last,cursor+7*Math.max(2,Math.floor(width/64)))
          else{const months=Math.max(1,Math.min(12,Math.floor(width/(scale==='month'?100:70))));let next=calendarStamp(cursor);for(let i=0;i<months;i++)next=nextMonth(next);end=Math.min(last,calendarDay(next))}
          const days=end-cursor,position=date=>(calendarDay(date)-cursor+.5)/days*100,months=[],years=[],ticks=[]
          for(let month=calendarStamp(cursor).slice(0,7)+'-01';calendarDay(month)<end;month=nextMonth(month)){
            const start=Math.max(cursor,calendarDay(month)),stop=Math.min(end,calendarDay(nextMonth(month))),left=(start-cursor)/days*100,span=(stop-start)/days*100
            months.push({date:month,left,width:span,label:Number(month.slice(5,7))+'月'});let year=years[years.length-1];if(!year||year.label!==month.slice(0,4)){year={label:month.slice(0,4),left,width:0};years.push(year)}year.width+=span
          }
          const perDay=width/days,step=scale==='day'?1:scale==='week'?7:perDay>=24?1:perDay>=7?7:0
          if(step){let tick=cursor;if(step===7)tick+=(8-new Date(tick*86400000).getUTCDay())%7;for(;tick<end;tick+=step){const date=calendarStamp(tick);ticks.push({date,left:position(date),label:step===1?date.slice(8):date.slice(5),weekend:[0,6].includes(new Date(tick*86400000).getUTCDay())})}}
          else months.forEach(m=>ticks.push({date:calendarStamp(Math.max(cursor,calendarDay(m.date))),left:position(calendarStamp(Math.max(cursor,calendarDay(m.date)))),label:m.date.slice(5,7)}))
          const rows=base.rows.map(source=>{
            const groups=source.groups.filter(g=>calendarDay(g.date)>=cursor&&calendarDay(g.date)<end).map(g=>({...g})),lanes=[],heights=[]
            for(const group of groups){group.position=position(group.date);group.labelWidth=Math.min(width-8,Math.max(80,Math.min(152,width/3)));group.left=Math.max(4,Math.min(width-group.labelWidth-4,group.position/100*width-7));let lane=lanes.findIndex(right=>right+10<=group.left);if(lane<0)lane=lanes.length;lanes[lane]=group.left+group.labelWidth;group.lane=lane;const lines=group.events.reduce((sum,e)=>sum+Math.max(1,Math.ceil([...e.label].reduce((n,c)=>n+(c.charCodeAt(0)>255?10:5.5),0)/(group.labelWidth-6))),0);heights[lane]=Math.max(heights[lane] || 0,17+lines*15+4)}
            const offsets=[];let total=0;for(let i=0;i<heights.length;i++){offsets[i]=total;total+=heights[i]+7}for(const group of groups)group.top=48+offsets[group.lane]
            const barStart=source.start?Math.max(cursor,calendarDay(source.start)):cursor,barEnd=Math.min(end-1,calendarDay(source.end)),elapsed=source.elapsed&&barStart<=barEnd&&calendarDay(source.start)<end&&calendarDay(source.end)>=cursor
            return {...source,groups,elapsed,barLeft:(barStart-cursor+.5)/days*100,barWidth:elapsed?(barEnd-barStart)/days*100:0,height:Math.max(96,48+total+42),continuesBefore:source.elapsed&&calendarDay(source.start)<cursor,continuesAfter:source.elapsed&&calendarDay(source.end)>=end}
          })
          const windowStart=cursor
          windows.push({rows,months,years,ticks,first:calendarStamp(cursor),last:calendarStamp(end-1),days,width,position:date=>(calendarDay(date)-windowStart+.5)/days*100,todayPosition:position(today),hasToday:calendarDay(today)>=cursor&&calendarDay(today)<end})
          cursor=end
        }
        return windows
      }
      function periodTimelineModels(projects,today,scale='year'){
        const day=calendarDay(today),year=Number(today.slice(0,4)),month=today.slice(0,7)+'-01'
        const current=scale==='year'?year+'-01-01':scale==='month'?month:calendarStamp(day-(new Date(today+'T12:00:00Z').getUTCDay()+6)%7)
        const previous=scale==='year'?(year-1)+'-01-01':scale==='month'?calendarStamp(calendarDay(month)-1).slice(0,7)+'-01':calendarStamp(calendarDay(current)-7)
        const next=scale==='year'?(year+1)+'-01-01':scale==='month'?nextMonth(current):calendarStamp(calendarDay(current)+7)
        const base=sharedTimelineModel(projects,today)
        return [[previous,current],[current,next]].map(([first,until])=>{
          const start=calendarDay(first),end=calendarDay(until),count=end-start,weights=Array(count).fill(scale==='year'?.25:.6)
          for(const row of base.rows)for(const group of row.groups){const at=calendarDay(group.date)-start;if(at<0||at>=count)continue;for(let i=Math.max(0,at-2);i<=Math.min(count-1,at+2);i++)weights[i]+=Math.min(3,group.events.length)/(1+Math.abs(i-at))}
          const prefix=[0];for(const w of weights)prefix.push(prefix.at(-1)+w)
          const boundary=date=>{const offset=Math.max(0,Math.min(count,calendarDay(date)-start));return prefix[offset]/prefix.at(-1)*100}
          const position=date=>{const i=Math.max(0,Math.min(count-1,calendarDay(date)-start));return (prefix[i]+weights[i]/2)/prefix.at(-1)*100}
          const ticks=[]
          if(scale==='year')for(let date=first;date<until;date=nextMonth(date)){const left=boundary(date),width=boundary(nextMonth(date))-left;ticks.push({date,left,width,label:Number(date.slice(5,7))+'月'})}
          else for(let i=0;i<count;i++){const date=calendarStamp(start+i);ticks.push({date,left:boundary(date),width:boundary(calendarStamp(start+i+1))-boundary(date),label:scale==='week'?WEEKDAYS[new Date(date+'T12:00:00Z').getUTCDay()]:String(i+1)})}
          const rows=base.rows.map(row=>{const from=row.start&&row.start>first?row.start:first,to=row.end<until?row.end:calendarStamp(end-1),elapsed=row.elapsed&&from<=to&&row.start<until&&row.end>=first;return {...row,elapsed,barLeft:position(from),barWidth:elapsed?Math.max(0,position(to)-position(from)):0,groups:row.groups.filter(g=>g.date>=first&&g.date<until).map(g=>({...g,position:position(g.date),label:g.events.map(e=>e.label).join(' · '),estimated:g.events.every(e=>e.estimated)}))}})
          return {first,last:calendarStamp(end-1),label:scale==='year'?first.slice(0,4):scale==='month'?first.slice(0,7):first.slice(5)+'–'+calendarStamp(end-1).slice(5),rows,ticks,hasToday:today>=first&&today<until,todayPosition:position(today)}
        })
      }
      function PeriodViewIcon({period}){
        const marks=period==='year'?Array.from({length:12},(_,i)=>E('rect',{key:i,x:6+(i%4)*3.5,y:9+Math.floor(i/4)*3.5,width:1.5,height:1.5,rx:.3,fill:'currentColor',stroke:'none'})):period==='month'?Array.from({length:9},(_,i)=>E('rect',{key:i,x:6+(i%3)*4.5,y:9+Math.floor(i/3)*3.5,width:2,height:1.5,rx:.3,fill:'currentColor',stroke:'none'})):[E('rect',{key:'week',x:5.5,y:11,width:13,height:4,rx:1,fill:'currentColor',stroke:'none'}),E('path',{key:'split',d:'M9 11v4m3-4v4m3-4v4',stroke:'var(--dsw-alias-bg-base)',strokeWidth:.8})]
        return E('svg',{width:17,height:17,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},E('rect',{x:3,y:5,width:18,height:16,rx:3}),E('path',{d:'M7 3v4M17 3v4M3 9h18'}),marks)
      }
      function CompactResearchBoard({projects,scale='year',colors}){
        const today=useCalendarToday()
        const ordered=projects.slice().sort((a,b)=>({active:0,planned:1,paused:2,completed:3}[a.status]??4)-({active:0,planned:1,paused:2,completed:3}[b.status]??4)),models=periodTimelineModels(ordered,today,scale)
        if(colors)for(const model of models)for(const row of model.rows)row.color=colors.get(row.project.id) || row.color

        return E('section',{className:'rw-period-board','aria-label':'研究项目时间轴'},
          E('div',{className:'rw-period-header'},E('div',null),E('div',null,models.map(model=>E('div',{key:model.first,className:'rw-period-scale'},E('span',{className:'rw-period-date'},model.label),E('div',{className:'rw-period-ticks'},model.ticks.map((tick,i)=>E('span',{key:tick.date,style:{left:tick.left+'%',width:tick.width+'%'},title:tick.date},scale==='year'||scale==='week'||tick.width>=3||i%5===0?tick.label:''))))))),
          ordered.map((project,index)=>E(React.Fragment,{key:project.id},index===0||ordered[index-1].status!==project.status?E('div',{className:'rw-gantt-group-title'},E('span',{className:'rw-timeline-status rw-timeline-status-'+project.status},PROJECT_STATES[project.status] || '其它')):null,
            E('div',{className:'rw-period-project'},E('div',{className:'rw-period-name',title:project.title},E('span',{className:'rw-gantt-swatch',style:{background:models[0].rows[index].color},'aria-hidden':true}),E('span',null,project.title)),
              E('div',null,models.map(model=>{const row=model.rows[index];return E('div',{key:model.first,className:'rw-period-line',style:{'--rw-project-color':row.color},'aria-label':project.title+' '+model.label},E('span',{className:'rw-period-date'},model.label),E('div',{className:'rw-period-track'},model.ticks.map(t=>E('span',{key:t.date,className:'rw-gantt-gridline',style:{left:t.left+'%'},'aria-hidden':true})),row.elapsed?E('div',{className:'rw-gantt-bar',style:{left:row.barLeft+'%',width:row.barWidth+'%'},title:row.start+' — '+row.end}):null,model.hasToday?E('span',{className:'rw-gantt-today',style:{left:model.todayPosition+'%'},title:'今天 '+today}):null,row.groups.map(g=>E('span',{key:g.date,className:'rw-gantt-node'+(g.estimated?' rw-gantt-estimated':''),tabIndex:0,style:{left:'clamp(5px, '+g.position+'%, calc(100% - 5px))'},title:g.date+' · '+g.label,'aria-label':g.date+' · '+g.label}))))}))))))
      }
      function PaperTimelineBoard(props){return props.readOnly?E(CompactResearchBoard,props):E(EditablePaperTimelineBoard,props)}
      function EditablePaperTimelineBoard({projects,onOpen,readOnly=false}){
        const today=useCalendarToday(),[scale,setScale]=React.useState('fit'),[panelWidth,setPanelWidth]=React.useState(1100),scrollRef=React.useRef(null)
        React.useEffect(()=>{const el=scrollRef.current;if(!el)return;const measure=()=>setPanelWidth(el.clientWidth);measure();const observer=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;observer?.observe(el);return()=>observer?.disconnect()},[])
        const ordered=readOnly?projects.slice().sort((a,b)=>({active:0,planned:1,paused:2,completed:3}[a.status]??4)-({active:0,planned:1,paused:2,completed:3}[b.status]??4)):projects
        const stacked=!readOnly&&panelWidth<640,labelWidth=readOnly?Math.min(220,Math.max(90,panelWidth*.30)):stacked?0:Math.min(190,Math.max(130,panelWidth*.23)),models=wrappedTimelineModels(ordered,today,panelWidth-labelWidth-2,scale)
        return E('section',{className:'rw-shared-gantt rw-wrapped-gantt'+(stacked?' rw-gantt-stacked':'')+(readOnly?' rw-gantt-compact':''),'aria-label':'研究项目时间轴'},
          E('div',{className:'rw-gantt-tools'},E('span',{className:'lwb-spacer'}),E('div',{className:'rw-scale-icons'},[['fit','适应宽度','fit'],['day','按日','day'],['week','按周','week'],['month','按月','month']].map(([value,label,icon])=>E('button',{key:value,type:'button',className:'lwb-icon-btn',title:label,'aria-label':label,'aria-pressed':scale===value,onClick:()=>setScale(value)},value==='fit'?E(SummaryIcon,{name:'fit'}):E('span',{className:'rw-scale-letter'},value==='day'?'日':value==='week'?'周':'月'))))),
          E('div',{className:'rw-gantt-segments',ref:scrollRef},models.map((model,index)=>{
            const todayLine=()=>model.hasToday?E('span',{className:'rw-gantt-today',style:{left:model.todayPosition+'%'},title:'今天 '+today,'aria-hidden':true}):null
            const gridLines=()=>model.ticks.map(t=>E('span',{key:t.date,className:'rw-gantt-gridline',style:{left:t.left+'%'},'aria-hidden':true}))
            return E('section',{key:model.first,className:'rw-gantt-segment','aria-label':model.first+' 至 '+model.last},models.length>1?E('div',{className:'rw-gantt-range'},model.first+' — '+model.last):null,
              E('div',{className:'rw-gantt-table',style:{width:'100%','--rw-label-width':labelWidth+'px','--rw-chart-width':'minmax(0,1fr)'}},
                E('div',{className:'rw-gantt-header'},E('div',{className:'rw-gantt-label rw-gantt-label-heading'}),E('div',{className:'rw-gantt-calendar'},
                  E('div',{className:'rw-gantt-years'},model.years.map(y=>E('span',{key:y.label,style:{left:y.left+'%',width:y.width+'%'}},y.label+'年'))),
                  E('div',{className:'rw-gantt-months'},model.months.map(m=>E('span',{key:m.date,style:{left:m.left+'%',width:m.width+'%'}},m.label))),
                  E('div',{className:'rw-gantt-days'},model.ticks.map(t=>E('span',{key:t.date,className:t.weekend?'rw-gantt-weekend':'',style:{left:'clamp(14px, '+t.left+'%, calc(100% - 14px))'},title:t.date},t.label))),todayLine())),
                model.rows.map((row,rowIndex)=>{
                  const p=row.project,missing=index===models.length-1?[!row.start&&'计划日期待设置',!validDay(p.startDate)&&'实际开始待设置',!validDay(p.endDate)&&'实际完成待设置',row.undated?row.undated+' 个阶段未设日期':null].filter(Boolean):[]
                  return E(React.Fragment,{key:p.id},readOnly&&(rowIndex===0||model.rows[rowIndex-1].project.status!==p.status)?E('div',{className:'rw-gantt-group-title'},PROJECT_STATES[p.status] || '其它'):null,E('article',{className:'rw-gantt-row',key:p.id,style:{'--rw-project-color':row.color,minHeight:(readOnly?38:row.height)+'px'}},
                    E('div',{className:'rw-gantt-label'},E('div',{className:'rw-gantt-project-heading'},E('span',{className:'rw-gantt-swatch','aria-hidden':true}),E(readOnly?'span':'button',{className:'rw-project-title',title:p.title,onClick:readOnly?undefined:()=>onOpen(p)},p.title)),E('span',{className:'rw-status rw-status-'+p.status},PROJECT_STATES[p.status] || '计划中'),E(CollaboratorSummary,{project:p,compact:true}),p.stage?E('div',{className:'rw-gantt-stage'},p.stage):null),
                    E('div',{className:'rw-gantt-lane',style:{height:(readOnly?38:row.height)+'px'}},gridLines(),todayLine(),
                      row.elapsed?E('div',{className:'rw-gantt-bar'+(row.continuesBefore?' rw-bar-from-previous':'')+(row.continuesAfter?' rw-bar-to-next':''),role:'img','aria-label':p.title+'：'+row.start+' 至 '+row.end,style:{left:row.barLeft+'%',width:row.barWidth+'%'},title:row.start+' — '+row.end}):null,
                      row.start&&row.start>today&&row.start>=model.first&&row.start<=model.last?E('span',{className:'rw-gantt-future rw-placeholder',style:{left:Math.min(65,model.position(row.start))+'%'}},'未到计划日期'):null,
                      row.groups.map(g=>E(React.Fragment,{key:g.date},E(readOnly?'span':'button',{type:readOnly?undefined:'button',className:'rw-gantt-node'+(g.estimated?' rw-gantt-estimated':''),style:{left:'clamp(7px, '+g.position+'%, calc(100% - 7px))'},title:g.date+' · '+g.label,'aria-label':g.date+' · '+g.label,onClick:readOnly?undefined:()=>onOpen(p)}),E('span',{className:'rw-gantt-stem',style:{left:g.position+'%',height:g.top-30+'px'},'aria-hidden':true}),E(readOnly?'div':'button',{type:readOnly?undefined:'button',className:'rw-gantt-caption',style:{left:g.left+'px',top:g.top+'px',width:g.labelWidth+'px'},title:g.date+' · '+g.label,onClick:readOnly?undefined:()=>onOpen(p)},E('time',{dateTime:g.date},model.years.length>1?g.date.slice(2):g.date.slice(5)),E('span',null,g.events.map(e=>E('span',{key:e.id,className:'rw-gantt-caption-event'},e.label)))))),
                      !readOnly&&missing.length?E('div',{className:'rw-axis-pending rw-gantt-pending'},missing.join(' · ')):null)))
                })))
          })))
      }

      function destinationLinks(project){
        const seen=new Set();return (Array.isArray(project.harnessLinks)?project.harnessLinks:[]).filter(x=>{if(!x||!['workspace','session'].includes(x.type)||typeof x.id!=='string'||!x.id)return false;const key=x.type+':'+x.id;if(seen.has(key))return false;seen.add(key);return true})
      }
      function normalizeDestinationLinks(links){
        const result=destinationLinks({harnessLinks:links}).map(x=>({...x}));
        for(const type of ['workspace','session']){const group=result.filter(x=>x.type===type),primary=group.find(x=>x.primary)||group[0];for(const x of group)x.primary=x===primary}
        return result
      }
      function primaryDestination(project){const links=normalizeDestinationLinks(project.harnessLinks);return links.find(x=>x.type==='session'&&x.primary)||links.find(x=>x.type==='workspace'&&x.primary)}
      function destinationCatalog(){
        const ws=ctx.get('workspaces')?.list?.getSnapshot?.(),ss=ctx.get('sessions')?.list?.getSnapshot?.()
        if(ws?.phase!=='ready'||ss?.phase!=='ready')return {ready:false,items:[],workspaces:[],sessions:{}}
        const archived=new Set(ws.archivedSessionIds || []),workspaces=ws.items || [],sessions=ss.byId || {}
        const items=workspaces.map(w=>({type:'workspace',id:w.workspaceId,title:w.title || w.path?.split('/').filter(Boolean).pop() || '未命名工作区',detail:w.path || ''}))
        for(const id of ss.ids || Object.keys(sessions)){const s=sessions[id];if(!s||archived.has(id))continue;const w=workspaces.find(w=>(w.sessionIds || []).includes(id));items.push({type:'session',id,title:s.displayTitle || '未命名对话',detail:w?.title || w?.path || '',workspaceId:w?.workspaceId || ''})}
        return {ready:true,items,workspaces,sessions,archived}
      }
      function resolveDestination(link,catalog){
        if(!catalog.ready)throw Error('工作区与对话仍在载入，请稍后重试')
        if(link.type==='session'){if(!catalog.sessions[link.id])throw Error('该对话已不存在，请编辑项目中的关联');return link.id}
        const workspace=catalog.workspaces.find(w=>w.workspaceId===link.id)
        if(!workspace)throw Error('该工作区已不存在，请编辑项目中的关联')
        const ids=(workspace.sessionIds || []).filter(id=>catalog.sessions[id]&&!catalog.archived?.has(id)).sort((a,b)=>(catalog.sessions[b].updatedAt || 0)-(catalog.sessions[a].updatedAt || 0)||a.localeCompare(b))
        if(!ids.length)throw Error('该工作区暂无可打开的对话')
        return ids[0]
      }
      function useDestinationCatalog(){
        const [catalog,setCatalog]=React.useState(destinationCatalog)
        React.useEffect(()=>{const update=()=>setCatalog(destinationCatalog()),off=[];for(const name of ['workspaces','sessions']){const store=ctx.get(name)?.list;if(typeof store?.subscribe==='function')off.push(store.subscribe(update))}update();return()=>off.forEach(fn=>{if(typeof fn==='function')fn()})},[])
        return catalog
      }
      function DestinationIcon({type}){return type==='workspace'?E(ResourceIcon):E('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,'aria-hidden':true},E('path',{d:'M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 3V6a2 2 0 0 1 2-2Z'}))}
      function DestinationEditor({project,onChange}){
        const catalog=useDestinationCatalog(),[query,setQuery]=React.useState(''),[branch,setBranch]=React.useState(null),[opened,setOpened]=React.useState(false),links=normalizeDestinationLinks(project.harnessLinks)
        const linked=x=>links.some(l=>l.type===x.type&&l.id===x.id),matches=x=>[x.title,x.detail].join(' ').toLowerCase().includes(query.toLowerCase())
        const workspaces=catalog.items.filter(x=>x.type==='workspace'),sessions=catalog.items.filter(x=>x.type==='session')
        const add=x=>{if(!linked(x))onChange(normalizeDestinationLinks([...links,{type:x.type,id:x.id,title:x.title,primary:!links.some(l=>l.type===x.type)}]))}
        const row=x=>E('button',{type:'button',className:'rw-destination-option',key:x.type+x.id,disabled:linked(x),onClick:()=>add(x)},E(DestinationIcon,{type:x.type}),E('span',null,x.title),linked(x)?'已关联':'+')
        return E('section',{className:'rw-destination-editor'},E('h3',null,'关联工作区与对话'),E('button',{type:'button',className:'lwb-btn',onClick:()=>setOpened(!opened),'aria-expanded':opened},opened?'收起选择':'添加关联'),opened?E('div',{className:'rw-link-picker'},E('input',{className:'lwb-input',placeholder:'搜索工作区或对话',value:query,onChange:e=>setQuery(e.target.value)}),branch!==null?E('button',{type:'button',className:'rw-text-button',onClick:()=>setBranch(null)},'‹ 工作区'):null,
          E('div',{className:'rw-link-picker-list'},branch===null?E(React.Fragment,null,workspaces.filter(w=>matches(w)||sessions.some(x=>x.workspaceId===w.id&&matches(x))).map(w=>E('button',{type:'button',className:'rw-destination-option',key:w.id,onClick:()=>setBranch(w.id)},E(DestinationIcon,{type:'workspace'}),E('span',null,w.title),'›')),E('button',{type:'button',className:'rw-destination-option',onClick:()=>setBranch('')},'未归属工作区的对话','›')):E(React.Fragment,null,workspaces.find(w=>w.id===branch)?row(workspaces.find(w=>w.id===branch)):null,sessions.filter(x=>x.workspaceId===branch&&matches(x)).map(row)))):null,
          E('ul',{className:'rw-destination-list'},links.map(link=>E('li',{key:link.type+link.id},E(DestinationIcon,{type:link.type}),E('span',{className:'rw-destination-name'},catalog.items.find(x=>x.type===link.type&&x.id===link.id)?.title||link.title||link.id),E('button',{type:'button',className:'rw-text-button',title:'设为主要'+(link.type==='workspace'?'工作区':'对话'),'aria-pressed':link.primary,onClick:()=>onChange(links.map(x=>x.type===link.type?{...x,primary:x.id===link.id}:x))},link.primary?'主要':'设为主要'),E('button',{type:'button',className:'lwb-icon-btn',title:'移除关联',onClick:()=>onChange(normalizeDestinationLinks(links.filter(x=>x!==link)))},E(QuietIcon,{name:'close'}))))))
      }
      function DestinationButton({project,labeled=false}){
        const links=destinationLinks(project),catalog=useDestinationCatalog(),id='rw-destinations-'+React.useId(),ref=React.useRef(null),trigger=React.useRef(null),[error,setError]=React.useState(''),[busy,setBusy]=React.useState(false)
        useNearPopover(id,trigger,links.length>0)
        if(!links.length)return null
        async function open(link){if(busy)return;setBusy(true);setError('');try{do{await chain}while(pendingWrites>0);if(saveFailed)throw Error('请先保存当前修改，再打开关联');const target=resolveDestination(link,destinationCatalog());const workspace=ctx.get('uiWorkspace');if(typeof workspace?.openSession!=='function')throw Error('当前客户端暂不支持跳转');await workspace.openSession(target);ref.current?.hidePopover?.()}catch(e){setError(e.message || '无法打开关联');ref.current?.showPopover?.()}finally{setBusy(false)}}
        return E(React.Fragment,null,E('button',{type:'button',ref:trigger,className:labeled?'rw-card-destination':'lwb-icon-btn rw-header-icon rw-action-icon',title:links.length>1?'打开主要对话或主要工作区':'打开'+(links[0].type==='workspace'?'工作区':'对话')+'：'+(catalog.items.find(x=>x.id===links[0].id&&x.type===links[0].type)?.title || links[0].title || ''),'aria-label':'打开关联：'+project.title,disabled:busy,onClick:()=>void open(primaryDestination(project))},E(DestinationIcon,{type:labeled?links[0].type:'workspace'}),labeled?E('span',null,catalog.items.find(x=>x.id===links[0].id&&x.type===links[0].type)?.title || links[0].title || (links[0].type==='workspace'?'工作区':'对话')):null),
          E('div',{id,ref,popover:'auto',role:'dialog','aria-label':'选择关联工作区或对话',className:'rw-destination-menu'},E('div',{className:'rw-destination-menu-head'},E('span',null,'打开关联'),E('button',{type:'button',className:'lwb-icon-btn',title:'关闭','aria-label':'关闭关联菜单',popovertarget:id,popovertargetaction:'hide'},E(QuietIcon,{name:'close',size:14}))),links.map(link=>{const current=catalog.items.find(x=>x.id===link.id&&x.type===link.type);return E('button',{type:'button',className:'rw-destination-option',key:link.type+link.id,disabled:busy,onClick:()=>void open(link)},E(DestinationIcon,{type:link.type}),E('span',{className:'rw-destination-kind'},link.type==='workspace'?'工作区':'对话'),E('span',{className:'rw-destination-name',title:current?.detail},current?.title || link.title || link.id))}),error?E('p',{className:'lwb-err',role:'alert'},error):null))
      }

      function CardDestinations({project}){
        const links=destinationLinks(project)
        return links.length?E('div',{className:'rw-card-destinations','aria-label':'关联工作区与对话'},links.map(link=>E(DestinationButton,{key:link.type+link.id,project:{...project,harnessLinks:[link]},labeled:true}))):null
      }
      function CardStateActions({project,onOpen}){
        const course=project.kind==='course',label=course?'课程详情与编辑':'详情与编辑'
        return E('span',{className:'rw-card-state-actions'},E('span',{className:'rw-status rw-status-'+project.status},PROJECT_STATES[project.status] || '计划中'),E('button',{type:'button',className:'lwb-icon-btn rw-header-icon rw-action-icon',title:label,'aria-label':label+'：'+project.title,onClick:()=>onOpen(project)},E(EditIcon)),E(DestinationButton,{project}))
      }
      function orderedProjectLinks(project){const links=(project.links || []).filter(l=>safeLink(l.url));const primary=links.find(l=>l.url===project.primaryLinkUrl)||links[0];return primary?[primary,...links.filter(l=>l!==primary)]:[]}
      async function openProjectLink(event,url){event.preventDefault();event.stopPropagation();try{const result=await hostCall('openExternal',{url});if(!result.ok)throw Error(result.error || '打开失败')}catch(error){publish({notice:'链接打开失败：'+error.message})}}
      function MainLinkRow({project}){const link=orderedProjectLinks(project)[0];let domain='';if(link)try{domain=new URL(link.url).hostname.replace(/^www\./,'')}catch{}return E('div',{className:'rw-main-link-row'},link?E('a',{href:link.url,title:(link.title || domain)+' · '+link.url,onClick:e=>void openProjectLink(e,link.url)},domain):E('span',{'aria-hidden':true},'\u00a0'))}
      function PrimaryLinkSelect({text,value,onChange}){let links=[];try{links=parseLinksText(text)}catch{}return links.length?E('label',{className:'rw-field'},E('span',null,'主要链接'),E('select',{className:'lwb-select','aria-label':'主要链接',value:links.some(l=>l.url===value)?value:links[0].url,onChange:e=>onChange(e.target.value)},links.map((l,i)=>E('option',{key:i,value:l.url},l.title || l.url)))):null}
      function ProjectDetails({project,onClose}){
        const view=useSnapshot(),ref=React.useRef(null),course=project.kind==='course',people=projectPeople(project),files=view.files.filter(f=>f.projectId===project.id)
        React.useEffect(()=>{ref.current?.showModal();return()=>{if(ref.current?.open)ref.current.close()}},[])
        const block=(label,content)=>content?E('section',{className:'rw-detail-section'},E('h3',null,label),content):null
        const prose=value=>value?E('p',{className:'rw-detail-prose'},value):null
        const links=value=>(value || []).filter(l=>safeLink(l.url)).map((l,i)=>E('a',{key:i,href:safeLink(l.url),target:'_blank',rel:'noopener noreferrer',className:'rw-detail-link'},l.title || l.url))
        const dates=course?[['首次上课',project.termStart],['最后上课',project.termEnd]]:[['计划',projectPlanDate(project)],['开始',project.startDate],['预计完成',project.targetDate],['实际完成',project.endDate]]
        return E('dialog',{ref,className:'rw-dialog rw-info-dialog','aria-label':project.title+'详情',onCancel:e=>{e.preventDefault();onClose()},onClick:e=>{if(e.target===ref.current){const r=ref.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}},
          E('header',{className:'rw-info-head'},E('div',null,E('span',{className:'rw-detail-kind'},(course?'教学任务':'研究项目')+' · '+(PROJECT_STATES[project.status] || '计划中')),E('h2',null,project.title)),E('button',{type:'button',className:'lwb-icon-btn',title:'关闭','aria-label':'关闭详情',onClick:onClose},E(QuietIcon,{name:'close'}))),
          E('div',{className:'rw-info-body'},
            block('时间安排',E(React.Fragment,null,E('dl',{className:'rw-detail-facts'},dates.filter(([,v])=>v).map(([k,v])=>E('div',{key:k},E('dt',null,k),E('dd',null,v)))),course?E('div',null,(project.weeklySchedule || []).map((s,i)=>E('p',{key:i},'每'+WEEKDAYS[s.weekday]+' '+[s.startTime,s.endTime].filter(Boolean).join('–')+(s.location?' · '+s.location:''))),(project.classSessions || []).map((s,i)=>E('p',{key:i},s.date+' '+[s.startTime,s.endTime].filter(Boolean).join('–')+(s.location?' · '+s.location:'')))):E(ProjectTimeline,{project}))),
            block('合作者',people.length?E('div',{className:'rw-detail-people'},people.map((p,i)=>E('div',{key:i},E('strong',null,p.name),prose(p.institution),p.email?E('a',{href:'mailto:'+encodeURIComponent(p.email.trim()),title:'写邮件'},p.email):null,prose(p.notes)))):null),
            course?block('课程信息',E('dl',{className:'rw-detail-facts'},[['地点',project.location],['授课年级',project.grade],['教材',project.textbook]].filter(([,v])=>v).map(([k,v])=>E('div',{key:k},E('dt',null,k),E('dd',null,v))))):null,
            course?block('授课进度',prose(lessonSummary(project).completed+' / '+lessonSummary(project).total+' 次已讲完')):null,
            block(course?'教学目标':'问题背景',prose(course?project.teachingGoal:project.background)),block('当前阶段',prose(project.stage)),block('下一步',prose(project.nextStep)),block('文献与资料',prose(project.references)),
            block('阶段节点',project.milestones?.length?E('ul',{className:'rw-detail-list'},project.milestones.map((m,i)=>E('li',{key:i},E('span',null,m.title),E('small',null,[m.date,m.done?'已完成':'',m.doneAt].filter(Boolean).join(' · '))))):null),
            block('教学计划',project.teachingPlans?.length?E('div',null,project.teachingPlans.map((p,i)=>E('div',{className:'rw-detail-plan',key:i},E('strong',null,p.title),E('small',null,[p.startDate,p.endDate,p.done?'已完成':''].filter(Boolean).join(' · ')),prose(p.content),links(p.links)))):null),
            block('推进记录',project.updates?.length?E('ul',{className:'rw-detail-list'},project.updates.map((u,i)=>E('li',{key:i},E('small',null,u.date),prose(u.text)))):null),
            block('相关链接',project.links?.length?E('ul',{className:'rw-detail-link-list'},orderedProjectLinks(project).map((l,i)=>E('li',{key:i,className:i===0?'is-primary':''},E('a',{href:l.url,title:l.url,onClick:e=>void openProjectLink(e,l.url)},l.title || l.url),i===0?E('span',{className:'rw-primary-tag'},'主要'):null))):null),
            block('附件',files.length?E('div',null,files.map(f=>E('button',{type:'button',key:f.id,className:'rw-detail-link rw-text-button',title:'打开附件',onClick:()=>void downloadResearchFile(f)},E(ClipIcon,{size:14}),f.name))):null),
            block('关联工作区与对话',destinationLinks(project).length?E('div',null,normalizeDestinationLinks(project.harnessLinks).map(l=>E('div',{key:l.type+l.id,className:'rw-detail-destination'},E('span',{className:'rw-destination-kind'},(l.type==='workspace'?'工作区':'对话')+(l.primary?' · 主要':'')),E(DestinationButton,{project:{...project,harnessLinks:[l]},labeled:true})))):null)))
      }
      function openCardDetails(event,open){if(Date.now()<suppressDragClickUntil)return;if(event.target.closest('button,a,input,select,textarea'))return;open()}
      function ProjectCard({project,onOpen,color,dragProps={}}) {
        const [details,setDetails]=React.useState(false),years=[...new Set(projectEvents(project).map(event=>String(event.date || '').slice(0,4)).filter(year=>/^\d{4}$/.test(year)))].sort()
        return E(React.Fragment,null,E('article',{className:'rw-project rw-project-'+project.status+' rw-brief-card rw-paper-brief',style:{'--rw-card-color':color || projectColor(project.id)},...dragProps,onClick:e=>openCardDetails(e,()=>setDetails(true))},
          E('div',{className:'rw-card-meta'},E(CardStateActions,{project,onOpen}),years.length?E('span',{className:'rw-card-year',title:'项目年份'},years.length===1?years[0]:years[0]+'–'+years[years.length-1]):null),
          E('button',{type:'button',className:'rw-project-title',title:project.title,onClick:()=>setDetails(true)},project.title),E(CollaboratorSummary,{project}),E('div',{className:'rw-brief-time'},E(ProjectTimeline,{project})),E(MainLinkRow,{project})),
          details?E(ProjectDetails,{project,onClose:()=>setDetails(false)}):null)
      }
      async function downloadResearchFile(file) {
        try {
          const res=await hostCall('readFile',{id:file.id});if(!res.ok)throw Error(res.error || '读取失败')
          const bytes=Uint8Array.from(atob(res.base64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:file.mime || 'application/octet-stream'}))
          const a=document.createElement('a');a.href=url;a.download=file.name || '附件';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)
        } catch(error) { publish({notice:'附件读取失败：'+error.message}) }
      }
      const WEEKDAYS=['周日','周一','周二','周三','周四','周五','周六']
      function localDay(date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')}
      function shiftDay(day,delta){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+delta);return localDay(d)}
      function courseSessions(course,from,to){
        if(!validDay(from)||!validDay(to)||from>to)return []
        const sessions=new Map((course.classSessions || []).filter(s=>validDay(s.date)&&s.date>=from&&s.date<=to).map(s=>[s.id,Object.assign({},s,{location:s.location || course.location || ''})]))
        if(validDay(course.termStart)&&validDay(course.termEnd)&&course.termStart<=course.termEnd){
          const end=to<course.termEnd?to:course.termEnd,start=from>course.termStart?from:course.termStart
          for(const slot of (course.weeklySchedule || [])){const weekday=Number(slot.weekday);if(!Number.isInteger(weekday)||weekday<0||weekday>6)continue
            for(let date=shiftDay(start,(weekday-new Date(start+'T12:00:00').getDay()+7)%7);date<=end;date=shiftDay(date,7)){const id=slot.id+'-'+date;sessions.set(id,Object.assign({},slot,{id,date,location:slot.location || course.location || ''}))}}
        }
        for(const record of Object.values(course.lessonCompletions || {}))if(record&&record.id&&validDay(record.date))sessions.set(record.id,Object.assign({},record,{location:record.location || course.location || ''}))
        return Array.from(sessions.values()).filter(s=>s.date>=from&&s.date<=to).sort((a,b)=>a.date.localeCompare(b.date)||(a.startTime || '').localeCompare(b.startTime || ''))
      }
      function parseLinksText(text){return text.split('\n').filter(l=>l.trim()).map(line=>{const parts=line.split('|'),url=safeLink(parts.length>1?parts.slice(1).join('|').trim():line.trim());if(!url)throw Error('链接需为 http:// 或 https:// 地址');return {title:parts.length>1?parts[0].trim() || url:url,url}})}
      function linksText(links){return (links || []).map(l=>l.title+' | '+l.url).join('\n')}
      function LinkFields({value,onChange,label='相关链接'}){
        return E('label',{className:'rw-field'},E('span',null,label),E('textarea',{className:'lwb-textarea',rows:2,value,placeholder:'名称 | https://…',onChange:e=>onChange(e.target.value)}))
      }
      function CourseAttachments({course,planId}){
        const view=useSnapshot(),attached=view.files.filter(f=>f.projectId===course.id&&(planId?f.teachingPlanId===planId:(!f.teachingPlanId||!(course.teachingPlans || []).some(w=>w.id===f.teachingPlanId))))
        const saved=view.projects.find(p=>p.id===course.id),canUpload=saved&&(!planId||(saved.teachingPlans || []).some(w=>w.id===planId))
        return E('div',{className:'rw-course-files'},attached.map(file=>E('div',{className:'rw-attachment',key:file.id},E(ClipIcon,{size:14}),E('button',{type:'button',className:'rw-text-button',onClick:()=>void downloadResearchFile(file)},file.name),E('span',{className:'rw-help'},formatBytes(file.size)),E('button',{type:'button',className:'lwb-icon-btn','aria-label':'取消关联 '+file.name,title:'取消关联，文件保留在资料库',onClick:()=>persist({files:snapshot.files.map(f=>f.id===file.id?Object.assign({},f,{projectId:null,teachingPlanId:null}):f)})},'×'))),canUpload?(attached.length<5?E(UploadZone,{label:'添加附件',target:{projectId:course.id,teachingPlanId:planId || null}}):null):E('span',{className:'rw-help'},'保存后可添加附件'))
      }
      function courseStatus(course,today=todayKey()){
        const dates=(course.classSessions || []).map(s=>s.date).filter(validDay)
        if(validDay(course.termStart)&&validDay(course.termEnd)&&course.termStart<=course.termEnd){
          const first=calendarDay(course.termStart),last=calendarDay(course.termEnd),weekday=new Date(course.termStart+'T12:00:00Z').getUTCDay()
          for(const slot of course.weeklySchedule || []){const d=Number(slot.weekday);if(!Number.isInteger(d)||d<0||d>6)continue;const start=first+(d-weekday+7)%7;if(start<=last){dates.push(calendarStamp(start),calendarStamp(start+Math.floor((last-start)/7)*7))}}
          if(!dates.length)dates.push(course.termStart,course.termEnd)
        }
        dates.sort();if(dates.length)return today<dates[0]?'planned':today>dates[dates.length-1]?'completed':'active'
        if(validDay(course.termStart))return today<course.termStart?'planned':'active'
        return course.status || 'planned'
      }
      function lessonCompleted(course,session,today=todayKey()){return validDay(session.date)&&session.date<today || course.lessonCompletions?.[session.id]?.date===session.date}
      function lessonState(course,session,today){return lessonCompleted(course,session,today)?'completed':session.date<today?'pending':session.date===today?'today':'upcoming'}
      const LESSON_STATES={completed:'已讲完',pending:'待确认',today:'今日安排',upcoming:'后续安排'}
      function scheduledLesson(course,s){
        if((course.classSessions || []).some(x=>x.id===s.id&&validDay(x.date)))return true
        return validDay(course.termStart)&&validDay(course.termEnd)&&s.date>=course.termStart&&s.date<=course.termEnd&&(course.weeklySchedule || []).some(x=>s.id===x.id+'-'+s.date&&Number(x.weekday)===new Date(s.date+'T12:00:00').getDay())
      }
      function lessonSummary(course,today=todayKey()){
        let past=new Set((course.classSessions || []).filter(s=>validDay(s.date)&&s.date<today).map(s=>s.id)).size
        let total=new Set((course.classSessions || []).filter(s=>validDay(s.date)).map(s=>s.id)).size
        if(validDay(course.termStart)&&validDay(course.termEnd)&&course.termStart<=course.termEnd){
          const first=calendarDay(course.termStart),last=calendarDay(course.termEnd),weekday=new Date(course.termStart+'T12:00:00').getDay()
          for(const slot of (course.weeklySchedule || [])){const day=Number(slot.weekday);if(!Number.isInteger(day)||day<0||day>6)continue;const start=first+(day-weekday+7)%7;if(start<=last)total+=Math.floor((last-start)/7)+1;const pastEnd=Math.min(last,calendarDay(today)-1);if(start<=pastEnd)past+=Math.floor((pastEnd-start)/7)+1}
        }
        const completed=Object.values(course.lessonCompletions || {}).filter(s=>s&&validDay(s.date)&&s.id)
        total+=completed.filter(s=>!scheduledLesson(course,s)).length
        return {total,completed:past+completed.filter(s=>s.date>=today||!scheduledLesson(course,s)).length}
      }
      function setLessonCompleted(courseId,session,completed){
        const course=snapshot.projects.find(p=>p.id===courseId&&p.kind==='course');if(!course||!validDay(session.date))return
        const records=Object.assign({},course.lessonCompletions || {})
        if(completed)records[session.id]={id:session.id,date:session.date,startTime:session.startTime || '',endTime:session.endTime || '',location:session.location || course.location || '',completedAt:new Date().toISOString()}
        else delete records[session.id]
        updateProjects(Object.assign({},course,{lessonCompletions:records,updatedAt:new Date().toISOString()}))
      }
      function courseColorMap(courses){const used=new Set();return new Map(courses.map(course=>{let color=projectColor(course.id);if(used.size<PROJECT_COLORS.length){let i=PROJECT_COLORS.indexOf(color);while(used.has(color)){i=(i+1)%PROJECT_COLORS.length;color=PROJECT_COLORS[i]}}else color='hsl('+((used.size*137.508)%360).toFixed(1)+' 42% 42%)';used.add(color);return [course.id,color]}))}
      function TeachingCalendarBoard({courses,onOpen,readOnly=false,colorMap}){
        const taskView=useSnapshot()
        const timedTasks=dailyEntries(taskView).filter(t=>validDay(t.date)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time)).map(t=>{const i=taskView.boards.findIndex(b=>b.id===t.boardId);return {...t,color:i>=0?taskCategoryColor(taskView.boards[i],i):'#8b8090',category:t.boardTitle || '其他事项'}}).concat((taskView.calendarEvents || []).filter(t=>isValidCalendarTask(t)&&!t.allDay&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time)).map(t=>({id:t.id,date:t.startDate,time:t.time,text:t.title,color:dailyBoard(taskView)?taskCategoryColor(dailyBoard(taskView),taskView.boards.indexOf(dailyBoard(taskView))):'#8271a3',category:'每日事项'}))).sort((a,b)=>a.time.localeCompare(b.time))
        const today=useCalendarToday(),[month,setMonth]=React.useState(()=>today.slice(0,7)),[selected,setSelected]=React.useState(today)
        const first=month+'-01',d=new Date(first+'T12:00:00'),last=localDay(new Date(d.getFullYear(),d.getMonth()+1,0,12)),offset=(d.getDay()+6)%7,days=Number(last.slice(-2)),used=new Set()
        const colors=colorMap || courseColorMap(courses),entries=courses.map(course=>({course,color:colors.get(course.id),summary:lessonSummary(course,today)}))
        const sessions=entries.flatMap(e=>courseSessions(e.course,first,last).map(s=>Object.assign({},s,{course:e.course,color:e.color,state:lessonState(e.course,s,today)}))).sort((a,b)=>a.date.localeCompare(b.date)||(a.startTime || '').localeCompare(b.startTime || '')||a.course.title.localeCompare(b.course.title))
        const daily=sessions.filter(s=>s.date===selected),plans=courses.flatMap(course=>(course.teachingPlans || []).filter(w=>validDay(w.startDate)&&w.startDate<=selected&&selected<=(w.endDate || w.startDate)).map(w=>({course,plan:w})))
        function move(delta){const day=localDay(new Date(d.getFullYear(),d.getMonth()+delta,1,12));setMonth(day.slice(0,7));setSelected(day)}
        return E('section',{className:'rw-teaching-calendar','aria-label':'教学任务日历'},
          E('div',{className:'rw-calendar-head rw-calendar-controls',role:'group','aria-label':'日历月份切换'},E('label',{className:'rw-numeric-month',title:'选择月份'},E('span',{'aria-hidden':true},month.replace('-','.')),E('input',{type:'month',className:'lwb-input rw-month-picker',value:month,'aria-label':'课程日历月份',onClick:e=>{try{e.currentTarget.showPicker()}catch{}},onChange:e=>{if(validDay(e.target.value+'-01')){setMonth(e.target.value);setSelected(e.target.value+'-01')}}})),E('button',{type:'button',className:'lwb-icon-btn',title:'上个月','aria-label':'课程日历上个月',onClick:()=>move(-1)},E(SummaryIcon,{name:'left'})),E('button',{type:'button',className:'lwb-icon-btn',title:'回到今天','aria-label':'回到今天',onClick:()=>{setMonth(today.slice(0,7));setSelected(today)}},E(SummaryIcon,{name:'today'})),E('button',{type:'button',className:'lwb-icon-btn',title:'下个月','aria-label':'课程日历下个月',onClick:()=>move(1)},E(SummaryIcon,{name:'right'})),E('div',{className:'rw-teach-status-key'},E('span',{title:'已讲完'},'✓ 已讲'),E('span',{title:'后续课程安排'},'□ 待讲'),E('span',{title:'已过时间，待确认'},'○ 待定'))),
          E('div',{className:'rw-teach-grid'},['一','二','三','四','五','六','日'].map(w=>E('div',{className:'rw-teach-weekday',key:w},w)),Array.from({length:offset},(_,i)=>E('div',{className:'rw-teach-day rw-teach-blank',key:'empty'+i,'aria-hidden':true})),Array.from({length:days},(_,i)=>{
            const date=month+'-'+String(i+1).padStart(2,'0'),items=sessions.filter(s=>s.date===date),tasks=timedTasks.filter(t=>t.date===date)
            return E('div',{className:'rw-teach-day'+(date===selected?' rw-teach-selected':'')+(date===today?' rw-teach-today':''),key:date},E('div',{className:'rw-day-scroll',tabIndex:items.length+tasks.length>1?0:undefined,'aria-label':date+' 日程'},E('button',{type:'button',className:'rw-teach-date','aria-label':(date===today?'今天，':'查看 ')+date,title:date===today?'今天 '+date:date,'aria-current':date===today?'date':undefined,'aria-pressed':date===selected,onClick:()=>setSelected(date)},i+1),
              E('div',{className:'rw-day-courses'+(items.length>2?' has-more':''),tabIndex:items.length>2?0:undefined,title:items.length>2?'滚动查看全部 '+items.length+' 门课程':undefined},items.map(s=>E('div',{className:'rw-teach-event rw-lesson-'+s.state,key:s.course.id+'-'+s.id,style:{'--rw-course-color':s.color},title:s.course.title+' · '+s.date+' '+[s.startTime,s.endTime].filter(Boolean).join('–')+(s.location?' · '+s.location:'')+' · '+LESSON_STATES[s.state],'aria-label':s.date+' '+s.startTime+' '+s.course.title+' '+LESSON_STATES[s.state]},s.state==='completed'?E('span',{className:'rw-teach-event-time'},'✓'):null,E('span',{className:'rw-teach-event-name'},s.course.title),s.state==='pending'?E('span',{className:'rw-teach-pending-mark','aria-hidden':true},'○'):null))),
              tasks.length?E('div',{className:'rw-calendar-minor-tasks'+(tasks.length>1?' has-more':''),tabIndex:tasks.length>1?0:undefined,title:tasks.length>1?'滚动查看全部 '+tasks.length+' 项事项':undefined},tasks.map(t=>E('span',{key:t.id,className:'rw-calendar-minor-task'+(t.done?' is-done':''),style:{color:t.color},title:t.category+' · '+t.date+' '+t.time+' · '+t.text},t.text))):null))
          })),


          !readOnly?E('section',{className:'rw-teach-agenda','aria-label':'当天授课安排'},E('h3',null,selected),daily.length?daily.map(s=>E('div',{className:'rw-teach-agenda-item',key:s.course.id+'-'+s.id,style:{'--rw-course-color':s.color}},E('span',{className:'rw-course-square',style:{background:s.color},'aria-hidden':true}),E('div',{className:'rw-teach-agenda-detail'},E(readOnly?'span':'button',{type:readOnly?undefined:'button',className:'rw-course-name',onClick:readOnly?undefined:()=>onOpen(s.course)},s.course.title),E('div',null,[s.startTime,s.endTime].filter(Boolean).join('–')+(s.location?' · '+s.location:''))),readOnly?E('span',{className:'rw-teach-session-state'},LESSON_STATES[s.state]):E('label',{className:'rw-lecture-check'},E('input',{type:'checkbox',checked:s.state==='completed',disabled:s.date<today,title:s.date<today?'日期已过，自动计为已讲完':'标记已讲完','aria-label':s.course.title+' '+s.date+' '+s.startTime+' 已讲完',onChange:e=>setLessonCompleted(s.course.id,s,e.target.checked)}),'已讲完'),!readOnly&&s.state!=='completed'?E('span',{className:'rw-teach-session-state'},LESSON_STATES[s.state]):null)):E('div',{className:'rw-placeholder'},'无上课安排'),
            plans.map(({course,plan})=>E('div',{className:'rw-teach-agenda-plan',key:course.id+'-'+plan.id},E('span',{className:'rw-card-caption'},course.title+' · 教学计划'),E('div',null,plan.title),plan.content?E('p',null,plan.content):null,readOnly?null:E('button',{type:'button',className:'rw-text-button',onClick:()=>onOpen(course)},'课程资料与周计划 →')))):null)
      }

      function CourseCalendar({course}){
        const [month,setMonth]=React.useState(()=>todayKey().slice(0,7)),[selected,setSelected]=React.useState(todayKey())
        const first=month+'-01',d=new Date(first+'T12:00:00'),last=localDay(new Date(d.getFullYear(),d.getMonth()+1,0,12)),offset=(d.getDay()+6)%7,days=Number(last.slice(-2))
        const sessions=courseSessions(course,first,last),selectedSessions=sessions.filter(s=>s.date===selected),plans=(course.teachingPlans || []).filter(p=>validDay(p.startDate)&&p.startDate<=selected&&selected<=(p.endDate || p.startDate))
        function move(delta){const next=localDay(new Date(d.getFullYear(),d.getMonth()+delta,1,12));setMonth(next.slice(0,7));setSelected(next)}
        return E('section',{className:'rw-calendar','aria-label':'上课日历'},
          E('div',{className:'rw-calendar-head'},E('input',{type:'month',className:'lwb-input rw-month-picker',value:month,'aria-label':'日历月份',onChange:e=>{if(/^\d{4}-\d{2}$/.test(e.target.value)&&validDay(e.target.value+'-01')){setMonth(e.target.value);setSelected(e.target.value+'-01')}}}),E('span',{className:'lwb-spacer'}),E('button',{type:'button',className:'rw-text-button','aria-label':'上个月',onClick:()=>move(-1)},'‹'),E('button',{type:'button',className:'rw-text-button',onClick:()=>{setMonth(todayKey().slice(0,7));setSelected(todayKey())}},'今天'),E('button',{type:'button',className:'rw-text-button','aria-label':'下个月',onClick:()=>move(1)},'›')),
          E('div',{className:'rw-calendar-grid'},['一','二','三','四','五','六','日'].map(w=>E('span',{className:'rw-calendar-weekday',key:w},w)),Array.from({length:offset},(_,i)=>E('span',{key:'empty'+i})),Array.from({length:days},(_,i)=>{
            const date=month+'-'+String(i+1).padStart(2,'0'),items=sessions.filter(s=>s.date===date),hasPlan=(course.teachingPlans || []).some(p=>validDay(p.startDate)&&p.startDate<=date&&date<=(p.endDate || p.startDate))
            return E('button',{type:'button',key:date,className:'rw-calendar-day'+(selected===date?' rw-calendar-selected':'')+(items.length?' rw-calendar-class':''),'aria-label':date+(items.length?'，'+items.length+' 次课':'')+(hasPlan?'，有教学计划':''),'aria-pressed':selected===date,onClick:()=>setSelected(date)},E('span',null,i+1),items.length?E('small',null,items.map(s=>(lessonCompleted(course,s)?'✓ ':'')+(s.startTime || '上课')).slice(0,2).join(' / ')):hasPlan?E('small',null,'计划'):null)
          })),
          E('div',{className:'rw-calendar-agenda'},E('strong',null,selected),selectedSessions.length?selectedSessions.map(s=>E('div',{key:s.id},(lessonCompleted(course,s)?'✓ 已讲完 · ':'')+[s.startTime,s.endTime].filter(Boolean).join('–')+(s.location?' · '+s.location:''))):E('div',{className:'rw-help'},'无上课安排'),plans.map(p=>E('div',{key:p.id},p.title || '教学计划'))))
      }
      // 2026 official holiday periods: gov.cn/zhengce/content/202511/content_7047090.htm
      const COURSE_HOLIDAYS_2026=[['01-01','01-03','元旦'],['02-15','02-23','春节'],['04-04','04-06','清明'],['05-01','05-05','五一'],['06-19','06-21','端午'],['09-25','09-27','中秋'],['10-01','10-07','国庆']]
      function courseHoliday(date){
        if(!validDay(date))return ''
        const md=date.slice(5)
        if(date.startsWith('2026-'))return COURSE_HOLIDAYS_2026.find(([a,b])=>md>=a&&md<=b)?.[2] || ''
        // Other years: known festival dates only; never infer unpublished adjusted breaks.
        if(md==='01-01')return '元旦'
        if(md==='05-01'||md==='05-02')return '五一'
        if(md>='10-01'&&md<='10-03')return '国庆'
        return ''
      }
      function courseSemester(project){
        const date=[project.termStart,project.startDate,...(project.classSessions || []).map(s=>s.date).filter(validDay).sort()].find(validDay)
        if(!date)return ''
        let year=Number(date.slice(0,4));const month=Number(date.slice(5,7)),autumn=month>=8||month===1
        if(month===1)year--
        return String(year).slice(-2)+'年'+(autumn?'秋季':'春季')+'学期'
      }
      function CourseCard({project,onOpen,color,dragProps={}}){
        const [details,setDetails]=React.useState(false),today=useCalendarToday(),sessions=courseSessions(project,today,[shiftDay(today,30),project.termEnd || '',...(project.classSessions || []).map(s=>s.date || '')].sort().at(-1)).filter(s=>!lessonCompleted(project,s,today)).slice(0,1),progress=lessonSummary(project,today)
        return E(React.Fragment,null,E('article',{className:'rw-project rw-course-card rw-project-'+project.status+' rw-brief-card',style:{'--rw-project-color':color || projectColor(project.id)},...dragProps,onClick:e=>openCardDetails(e,()=>setDetails(true))},
          E('div',{className:'rw-card-meta'},E(CardStateActions,{project,onOpen})),E('button',{type:'button',className:'rw-project-title',title:'查看课程详情',onClick:()=>setDetails(true)},project.title),
          project.location?E('p',{className:'rw-brief-location'},project.location):null,
          E('div',{className:'rw-brief-time rw-next-lessons'},[0,1].map(i=>{if(i===1)return E('p',{key:'progress',className:'rw-next-lesson rw-course-progress'},progress.completed+' / '+progress.total+' 次已讲完');const s=sessions[i];if(!s)return E('p',{key:'empty-'+i,className:'rw-next-lesson is-empty','aria-hidden':true},'\u00a0');const holiday=courseHoliday(s.date),label=s.date+' '+[s.startTime,s.endTime].filter(Boolean).join('–')+(s.location&&s.location!==project.location?' · '+s.location:'');return E('p',{key:s.id,className:'rw-next-lesson',title:label+(holiday?' · '+holiday:'')},E('span',{className:'rw-next-lesson-time'},label),holiday?E('span',{className:'rw-holiday-label',title:holiday+'假期 · 请核对学校授课安排'},holiday):null)}),E(MainLinkRow,{project}))),details?E(ProjectDetails,{project,onClose:()=>setDetails(false)}):null)
      }
      function prepareCourse(draft){
        if(!draft.title.trim())throw Error('请填写课程名称')
        for(const key of ['termStart','termEnd'])if(draft[key]&&!validDay(draft[key]))throw Error('课程日期无效')
        if(draft.termStart&&draft.termEnd&&draft.termEnd<draft.termStart)throw Error('课程结束不能早于开始')
        if((draft.weeklySchedule || []).length&&(!draft.termStart||!draft.termEnd))throw Error('请设置课程开始和结束日期')
        const checkTime=s=>{for(const k of ['startTime','endTime'])if(s[k]&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(s[k]))throw Error('上课时间无效');if(s.endTime&&s.endTime<=s.startTime)throw Error('下课时间应晚于上课时间')}
        for(const s of draft.weeklySchedule || []){if(!Number.isInteger(Number(s.weekday))||Number(s.weekday)<0||Number(s.weekday)>6)throw Error('上课星期无效');checkTime(s)}
        for(const s of draft.classSessions || []){if(!validDay(s.date))throw Error('请填写单次上课日期');checkTime(s)}
        const teachingPlans=(draft.teachingPlans || []).map(w=>{if(!w.title.trim())throw Error('请填写周计划标题');if(!validDay(w.startDate))throw Error('请填写周计划日期');if(w.endDate&&(!validDay(w.endDate)||w.endDate<w.startDate))throw Error('周计划结束日期无效');return Object.assign({},w,{title:w.title.trim(),links:parseLinksText(w.linksDraft===undefined?linksText(w.links):w.linksDraft)})}).map(w=>{delete w.linksDraft;return w})
        return Object.assign({},draft,{title:draft.title.trim(),links:parseLinksText(draft.linksDraft===undefined?linksText(draft.links):draft.linksDraft),teachingPlans,updatedAt:new Date().toISOString()})
      }
      const AI_LABELS={harnessLinks:'关联工作区与对话',text:'事项内容',date:'日期',time:'时间',firstWeekStart:'第一周起算日',totalWeeks:'总周数',collaboratorDetails:'合作者信息',title:'名称',status:'状态',collaborators:'合作者',background:'问题背景与目标',stage:'当前阶段',nextStep:'下一步',references:'文献与资料备注',plannedDate:'计划日期',startDate:'实际开始',targetDate:'预计结束',endDate:'实际结束',milestones:'阶段节点',updates:'推进记录',links:'相关链接',location:'上课地点',grade:'授课年级',textbook:'使用教材',teachingGoal:'教学目标',termStart:'课程开始日期',termEnd:'课程结束日期',weeklySchedule:'每周上课',classSessions:'单次上课',teachingPlans:'每周教学计划'}
      let recognitionSelection=''
      const cloneAI=value=>JSON.parse(JSON.stringify(value))
      function recognizedDraft(before,data){
        const result=cloneAI(before)
        const meaningful=v=>v!==undefined&&v!==null&&v!==''&&(!Array.isArray(v)||v.length>0)
        for(const [key,value] of Object.entries(data)){
          if(!meaningful(value))continue
          if(key==='harnessLinks'){const merged=destinationLinks(before).map(x=>({...x}));for(const item of value){if(item.primary)for(const x of merged)if(x.type===item.type)x.primary=false;const i=merged.findIndex(x=>x.type===item.type&&x.id===item.id);if(i<0)merged.push(item);else merged[i]={...merged[i],...item}}result.harnessLinks=normalizeDestinationLinks(merged);continue}
          if(!Array.isArray(value)){result[key]=value;continue}
          const existing=cloneAI(before[key] || [])
          for(const item of value){
            const match=x=>item.id&&x.id===item.id || (key==='links'?x.url===item.url:key==='collaboratorDetails'?x.name===item.name||(item.email&&x.email===item.email):key==='weeklySchedule'?x.weekday===item.weekday&&x.startTime===item.startTime:key==='classSessions'?x.date===item.date&&x.startTime===item.startTime:key==='updates'?x.date===item.date&&x.text===item.text:x.title===item.title)
            const index=existing.findIndex(match),old=index<0?{}:existing[index],merged={...old}
            for(const [field,v] of Object.entries(item))if(meaningful(v))merged[field]=Array.isArray(v)?recognizedDraft({[field]:old[field] || []},{[field]:v})[field]:v
            if(key==='teachingPlans'&&item.links?.length)merged.linksDraft=linksText(merged.links)
            if(key!=='links')merged.id=old.id || item.id || nextId('ai-'+key)
            if(index<0)existing.push(merged);else existing[index]=merged
          }
          result[key]=existing
        }
        if(result.collaboratorDetails?.length)result.collaborators=result.collaboratorDetails.map(p=>p.name).join('、')
        return result
      }
      function undoRecognition(current,before,applied){
        const restored=cloneAI(current)
        for(const key of Object.keys(applied)){
          if(key==='draft'){restored.draft=undoRecognition(current.draft,before.draft,applied.draft);continue}
          if(JSON.stringify(current[key])===JSON.stringify(applied[key])){if(before[key]===undefined)delete restored[key];else restored[key]=cloneAI(before[key])}
        }
        return restored
      }
      function aiDisplay(value,key){
        if(key==='harnessLinks')return normalizeDestinationLinks(value).map(x=>(x.type==='workspace'?'工作区':'对话')+' · '+(x.title||x.id)+(x.primary?'（主要）':'')).join('\n')
        if(key==='collaboratorDetails')return (value || []).map(p=>[p.name,p.institution,p.email,p.notes].filter(Boolean).join(' · ')).join('\n') || '留空'
        if(key==='status')return PROJECT_STATES[value] || value
        if(Array.isArray(value))return value.length?value.map(x=>{if(key==='links')return x.title+' | '+x.url;if(key==='weeklySchedule')return WEEKDAYS[x.weekday]+' '+x.startTime+(x.endTime?'–'+x.endTime:'')+(x.location?' · '+x.location:'');return [x.title,x.date || x.startDate,x.endDate,x.startTime,x.endTime,x.location,x.text || x.content,x.done?'已完成':'',x.doneAt,(x.links || []).map(l=>l.title+' | '+l.url).join('\n')].filter(Boolean).join(' · ')}).join('\n'):'留空'
        return value || '留空'
      }
      function RecognitionPreview({data,before,onConfirm,onCancel}){
        const ref=React.useRef(null),[edited,setEdited]=React.useState(()=>recognizedDraft(before,data))
        React.useEffect(()=>{ref.current?.showModal();return()=>{if(ref.current?.open)ref.current.close()}},[])
        const changes=Object.keys(data).filter(key=>key!=='collaborators'&&JSON.stringify(before[key])!==JSON.stringify(edited[key]))
        function input(value,change,label){if(label==='状态')return E('select',{className:'lwb-select',value,'aria-label':label,onChange:e=>change(e.target.value)},Object.entries(PROJECT_STATES).map(([id,name])=>E('option',{key:id,value:id},name)));return typeof value==='boolean'?E('input',{type:'checkbox',checked:value,'aria-label':label,onChange:e=>change(e.target.checked)}):E('textarea',{className:'lwb-textarea',rows:2,value:value??'','aria-label':label,onChange:e=>change(typeof value==='number'?Number(e.target.value):e.target.value)})}
        function fields(value,change,label){if(Array.isArray(value))return value.map((item,i)=>E('div',{key:i,style:{marginTop:'8px'}},fields(item,next=>change(value.map((v,j)=>j===i?next:v)),label+' '+(i+1))));if(value&&typeof value==='object')return Object.entries(value).filter(([k])=>!['id','contactId','harnessLinks'].includes(k)).map(([k,v])=>E('label',{className:'rw-field',key:k},E('span',null,AI_LABELS[k]||({name:'姓名',institution:'单位',email:'邮箱',notes:'备注',url:'链接',date:'日期',text:'内容',content:'内容',done:'已完成',weekday:'星期（0 为周日）',startTime:'开始时间',endTime:'结束时间'}[k]||k)),fields(v,next=>change({...value,[k]:next}),label+' '+k)));return input(value,change,label)}
        return E('dialog',{ref,className:'rw-dialog rw-ai-preview','aria-label':'确认智能识别结果',onCancel:e=>{e.preventDefault();onCancel()}},E('h3',null,'确认补充与更新'),E('p',{className:'rw-help'},'未提及的信息保留。可直接修改下方内容，确认后仍需保存。'),changes.length?changes.map(key=>E('div',{className:'rw-ai-change',key},E('strong',null,AI_LABELS[key] || key),before[key]&&(!Array.isArray(before[key])||before[key].length)?E('del',{className:'rw-ai-before',style:{display:'block',whiteSpace:'pre-wrap'}},aiDisplay(before[key],key)):null,key==='harnessLinks'?E(DestinationEditor,{project:{harnessLinks:edited[key]},onChange:value=>setEdited(previous=>({...previous,harnessLinks:value}))}):fields(edited[key],value=>setEdited(previous=>({...previous,[key]:value})),AI_LABELS[key]||key))):E('p',{className:'rw-help'},'没有新增或更新的信息。'),E('footer',null,E('button',{type:'button',className:'lwb-btn',onClick:onCancel},'取消'),E('button',{type:'button',className:'lwb-btn lwb-btn-primary',onClick:()=>onConfirm(edited)},'确认填入')))
      }
      function RecognitionBox({kind,current,onApply,onRestore}){
        const [images,setImages]=React.useState([]),[reading,setReading]=React.useState(false),fileRef=React.useRef(null),uploadGeneration=React.useRef(0)
        const [text,setText]=React.useState(''),[catalog,setCatalog]=React.useState(null),[selection,setSelection]=React.useState(''),[busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),[pending,setPending]=React.useState(null),[history,setHistory]=React.useState([]),[reload,setReload]=React.useState(0)
        const request=React.useRef({generation:0,controller:null})
        React.useEffect(()=>{let active=true;hostCall('models',{}).then(result=>{if(!active)return;if(!result.ok)throw Error(result.error);setCatalog(result);const routes=result.groups.flatMap(g=>g.models.map(m=>JSON.stringify({provider:g.id,model:m.id})));setSelection(routes.includes(recognitionSelection)?recognitionSelection:result.default?JSON.stringify(result.default):'');setError('')}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[reload])
        React.useEffect(()=>()=>{uploadGeneration.current++;request.current.generation++;request.current.controller?.abort()},[])
        function invalidate(){request.current.generation++;request.current.controller?.abort();setBusy(false);setPending(null);setError('')}
        async function addImages(files){
          const selected=Array.from(files || []);if(!selected.length)return
          invalidate();const generation=++uploadGeneration.current
          if(images.length+selected.length>3){setError('最多上传 3 张截图');return}
          if(selected.some(f=>!['image/png','image/jpeg','image/webp','image/gif'].includes(f.type)||f.size>8*1024*1024)||images.reduce((n,i)=>n+i.size,0)+selected.reduce((n,f)=>n+f.size,0)>12*1024*1024){setError('支持 PNG、JPEG、WebP、GIF；单张不超过 8 MB，合计 12 MB');return}
          setReading(true)
          try{const loaded=await Promise.all(selected.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('截图读取失败'));reader.onload=()=>resolve({name:file.name,mediaType:file.type,size:file.size,data:String(reader.result).split(',')[1]});reader.readAsDataURL(file)})));if(generation===uploadGeneration.current)setImages(previous=>previous.concat(loaded))}catch(e){if(generation===uploadGeneration.current)setError(e.message)}finally{if(generation===uploadGeneration.current)setReading(false)}
        }
        async function recognize(){invalidate();const generation=request.current.generation,controller=new AbortController();request.current.controller=controller;setBusy(true);try{const result=await hostCall('recognize',{kind,text,images,destinations:kind!=='task'&&/关联|链接|工作区|对话/.test(text)?destinationCatalog().items:[],selection:JSON.parse(selection),current:kind==='course'?{firstWeekStart:current.firstWeekStart,totalWeeks:current.totalWeeks,weeklySchedule:current.weeklySchedule}:undefined},controller.signal);if(generation!==request.current.generation)return;if(!result.ok)throw Error(result.error);setPending(result.data)}catch(e){if(generation===request.current.generation&&!controller.signal.aborted)setError(e.message)}finally{if(generation===request.current.generation)setBusy(false)}}
        const before=current.draft?Object.assign({},current.draft,{links:current.linksText.split('\n').filter(Boolean).map(line=>{const parts=line.split('|');return {title:parts[0].trim(),url:(parts[1] || parts[0]).trim()}})}):Object.assign({},current,{links:current.linksDraft===undefined?current.links:current.linksDraft.split('\n').filter(Boolean).map(line=>{const parts=line.split('|');return {title:parts[0].trim(),url:(parts[1] || parts[0]).trim()}})})
        return E('section',{className:'rw-recognition','aria-label':'智能识别'},E('label',{className:'rw-field'},E('span',null,'智能识别'),E('textarea',{className:'lwb-textarea',rows:3,maxLength:16000,value:text,onPaste:e=>{const files=Array.from(e.clipboardData?.files || []).filter(f=>f.type.startsWith('image/'));if(files.length){e.preventDefault();if(!reading&&!busy)void addImages(files)}},placeholder:kind==='task'?'例如：明天下午三点给合作者发送论文草稿':kind==='course'?'粘贴课程信息、上课安排与每周教学计划…':'粘贴项目介绍、时间安排；可指定关联工作区、对话及主要关联…',onChange:e=>{invalidate();setText(e.target.value)}})),
          E('input',{type:'file',ref:fileRef,accept:'image/png,image/jpeg,image/webp,image/gif',multiple:true,hidden:true,onChange:e=>{void addImages(e.target.files);e.target.value=''}}),
          images.length?E('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',margin:'8px 0'}},images.map((image,i)=>E('div',{key:i,style:{display:'flex',alignItems:'center',gap:'4px'}},E('img',{src:'data:'+image.mediaType+';base64,'+image.data,alt:image.name,style:{width:'64px',height:'48px',objectFit:'contain',border:'1px solid var(--rw-soft-rule)',borderRadius:'5px'}}),E('button',{type:'button',className:'lwb-icon-btn',title:'移除截图','aria-label':'移除截图 '+image.name,disabled:reading||busy,onClick:()=>{invalidate();setImages(images.filter((_,j)=>j!==i))}},E(QuietIcon,{name:'close'}))))):null,
          E('div',{className:'rw-ai-actions'},E('button',{type:'button',className:'lwb-icon-btn',title:'上传截图（也可粘贴）','aria-label':'上传截图',disabled:busy||reading||images.length>=3,onClick:()=>fileRef.current?.click()},E(ClipIcon,{size:16})),E('button',{type:'button',className:'lwb-btn rw-ai-confirm',disabled:busy||reading||(!text.trim()&&!images.length)||!selection,onClick:recognize},busy?'识别中…':'确认识别'),E('button',{type:'button',className:'lwb-icon-btn rw-ai-undo',title:'撤销上次填入','aria-label':'撤销上次填入',disabled:!history.length||busy,onClick:()=>{const last=history[history.length-1];onRestore(undoRecognition(current,last.before,last.applied));setHistory(history.slice(0,-1));setPending(null);publish({notice:'已撤销识别填入'})}},svg({size:18,weight:1.7},[E('path',{key:'undo',d:'M3 10a8 8 0 1 1 2 8M3 4v6h6'})])),E('select',{'aria-label':'识别模型',className:'lwb-select rw-ai-model',value:selection,disabled:busy,onChange:e=>{invalidate();recognitionSelection=e.target.value;setSelection(e.target.value)}},E('option',{value:''},catalog?'选择 AI 模型':'正在读取模型…'),(catalog?.groups || []).map(g=>E('optgroup',{key:g.id,label:g.name},g.models.map(m=>E('option',{key:m.id,value:JSON.stringify({provider:g.id,model:m.id})},m.name || m.id))))),busy?E('button',{type:'button',className:'rw-text-button',onClick:invalidate},'取消识别'):null),
          catalog?.failures?.length?E('p',{className:'rw-help'},'部分模型目录未能读取，可重试。'):null,error?E('div',{role:'alert',className:'lwb-err'},error):null,(!catalog||catalog.failures?.length)?E('button',{type:'button',className:'rw-text-button',onClick:()=>setReload(n=>n+1)},'重新读取模型'):null,
          pending?E(RecognitionPreview,{data:pending,before,onCancel:()=>setPending(null),onConfirm:edited=>{const previous=cloneAI(current),applied=onApply(edited);setHistory(h=>h.concat({before:previous,applied:cloneAI(applied)}).slice(-10));setPending(null);publish({notice:'已应用识别结果'})}}):null)
      }

      function trashProject(draft){
        if(!window.confirm('将此项目移入回收站？可随时还原。'))return false
        const data=JSON.parse(JSON.stringify(draft));if(data.linksDraft!==undefined){data.links=parseLinksText(data.linksDraft);delete data.linksDraft}
        persist({projects:snapshot.projects.filter(p=>p.id!==data.id),projectTrash:[{id:nextId('project-trash'),data,deletedAt:new Date().toISOString()},...(snapshot.projectTrash || []).filter(e=>e.data.id!==data.id)]});return true
      }
      function restoreProjectTrash(id){const entry=(snapshot.projectTrash || []).find(e=>e.id===id);if(!entry)return;persist({projects:snapshot.projects.some(p=>p.id===entry.data.id)?snapshot.projects:[...snapshot.projects,entry.data],projectTrash:snapshot.projectTrash.filter(e=>e.id!==id)})}
      function ProjectTrash({kind,onClose}){
        const view=useSnapshot(),ref=React.useRef(null),label=kind==='paper'?'研究项目':'教学任务',items=(view.projectTrash || []).filter(e=>e.data.kind===kind)
        React.useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[])
        const purge=id=>{if(window.confirm(id?'彻底删除此项目？此操作无法还原。':'清空'+label+'回收站？此操作无法还原。'))persist({projectTrash:(snapshot.projectTrash || []).filter(e=>id?e.id!==id:e.data.kind!==kind)})}
        return E('dialog',{ref,className:'rw-dialog rw-project-archive','aria-label':label+'回收站',onCancel:e=>{e.preventDefault();onClose()}},E('header',{className:'rw-dialog-head'},E('h2',null,label+'回收站'),E('button',{type:'button',className:'lwb-btn',disabled:!items.length,onClick:()=>purge(null)},'清空'),E('button',{type:'button',className:'lwb-icon-btn',title:'关闭','aria-label':'关闭回收站',onClick:onClose},E(QuietIcon,{name:'close'}))),E('div',{className:'rw-archive-body'},items.length?items.map(entry=>E('div',{key:entry.id,className:'rw-archive-row'},E('span',{className:'rw-archive-title'},entry.data.title || '未命名'),E('span',null,E('button',{type:'button',className:'rw-text-button',onClick:()=>restoreProjectTrash(entry.id)},'还原'),E('button',{type:'button',className:'lwb-icon-btn',title:'彻底删除','aria-label':'彻底删除：'+(entry.data.title || '未命名'),onClick:()=>purge(entry.id)},E(QuietIcon,{name:'trash'}))),E(ArchiveFacts,{project:entry.data}))):E('p',{className:'rw-placeholder'},'回收站为空')))
      }
      function CourseEditor({project,onClose}){
        const view=useSnapshot();const [draft,setDraft]=React.useState(()=>Object.assign({},JSON.parse(JSON.stringify(project)),{linksDraft:linksText(project.links)})),[baseline,setBaseline]=React.useState(()=>JSON.stringify(Object.assign({},project,{linksDraft:linksText(project.links)}))),[error,setError]=React.useState(''),ref=React.useRef(null)
        const field=(key,value)=>setDraft(d=>Object.assign({},d,{[key]:value})),edit=(key,id,patch)=>setDraft(d=>Object.assign({},d,{[key]:(d[key] || []).map(x=>x.id===id?Object.assign({},x,patch):x)})),remove=(key,id)=>field(key,(draft[key] || []).filter(x=>x.id!==id))
        const close=()=>{if(JSON.stringify(draft)===baseline||window.confirm('放弃尚未保存的课程修改？'))onClose()}
        React.useEffect(()=>{const el=ref.current;if(el&&!el.open)el.showModal();return()=>{if(el?.open)el.close()}},[])
        const input=(key,label,type='text')=>E('label',{className:'rw-field',key},E('span',null,label),E('input',{className:'lwb-input',type,value:draft[key] || '',onChange:e=>field(key,e.target.value)}))
        function save(event,exit=true){event?.preventDefault();try{const course=prepareCourse(draft);delete course.linksDraft;updateProjects(course);setBaseline(JSON.stringify(draft));setError('');if(exit)onClose()}catch(e){setError(e.message)}}
        function scheduleRow(s,key){const recurring=key==='weeklySchedule';return E('div',{className:'rw-class-row',key:s.id},recurring?E('label',{className:'rw-field'},E('span',null,'星期'),E('select',{className:'lwb-select',value:s.weekday,onChange:e=>edit(key,s.id,{weekday:Number(e.target.value)})},[1,2,3,4,5,6,0].map(n=>E('option',{key:n,value:n},WEEKDAYS[n])))):E('label',{className:'rw-field'},E('span',null,'日期'),E('input',{className:'lwb-input',type:'date',value:s.date || '',onChange:e=>edit(key,s.id,{date:e.target.value})})),
          ...[['startTime','上课'],['endTime','下课']].map(([k,label])=>E('label',{className:'rw-field',key:k},E('span',null,label),E('input',{className:'lwb-input',type:'time',value:s[k] || '',onChange:e=>edit(key,s.id,{[k]:e.target.value})}))),E('label',{className:'rw-field'},E('span',null,'地点'),E('input',{className:'lwb-input',value:s.location || '',placeholder:draft.location || '',onChange:e=>edit(key,s.id,{location:e.target.value})})),E('button',{type:'button',className:'rw-text-button',onClick:()=>remove(key,s.id)},'移除'))}
        return E('dialog',{ref,className:'rw-dialog rw-course-dialog',onCancel:e=>{e.preventDefault();close()},'aria-labelledby':'rw-course-heading'},E('form',{onSubmit:save},
          E('header',{className:'rw-dialog-head'},E('h2',{id:'rw-course-heading'},project.title || '新建教学任务'),E('button',{className:'lwb-icon-btn',type:'button','aria-label':'关闭课程详情',onClick:close},'×')),
          E('div',{className:'rw-editor-body'},E(RecognitionBox,{kind:'course',current:draft,onApply:data=>{const next={...draft,...data};next.linksDraft=linksText(next.links);setDraft(next);setError('');return next},onRestore:previous=>setDraft(previous)}),E('div',{className:'rw-fields'},input('title','课程名称'),E('label',{className:'rw-field'},E('span',null,'状态'),E('select',{className:'lwb-select',value:draft.status,onChange:e=>field('status',e.target.value)},Object.entries(PROJECT_STATES).map(([value,label])=>E('option',{key:value,value},label)))),input('location','上课地点'),input('grade','授课年级'),input('textbook','使用教材')),
            E('label',{className:'rw-field'},E('span',null,'教学目标'),E('textarea',{className:'lwb-textarea',rows:2,value:draft.teachingGoal===undefined?(draft.background || ''):draft.teachingGoal,onChange:e=>field('teachingGoal',e.target.value)})),
            E(DestinationEditor,{project:draft,onChange:links=>field('harnessLinks',links)}),E('h3',null,'上课安排'),E('div',{className:'rw-fields'},input('termStart','课程开始日期','date'),input('termEnd','课程结束日期','date')),
            (draft.weeklySchedule || []).map(s=>scheduleRow(s,'weeklySchedule')),E('button',{type:'button',className:'lwb-btn',onClick:()=>field('weeklySchedule',(draft.weeklySchedule || []).concat({id:nextId('class'),weekday:1,startTime:'',endTime:'',location:''}))},'＋ 每周上课'),
            (draft.classSessions || []).map(s=>scheduleRow(s,'classSessions')),E('button',{type:'button',className:'lwb-btn rw-button-gap',onClick:()=>field('classSessions',(draft.classSessions || []).concat({id:nextId('class'),date:'',startTime:'',endTime:'',location:''}))},'＋ 单次上课'),
            E(CourseCalendar,{course:draft}),
            E('div',{className:'rw-plan-heading'},E('h3',null,'每周教学计划'),E('span',{className:'lwb-spacer'}),E('button',{type:'button',className:'lwb-btn',onClick:()=>field('teachingPlans',(draft.teachingPlans || []).concat({id:nextId('week'),startDate:'',endDate:'',title:'',content:'',links:[],done:false}))},'＋ 新增周计划')),
            (draft.teachingPlans || []).slice().sort((a,b)=>(a.startDate || '9999').localeCompare(b.startDate || '9999')).map(w=>E('details',{className:'rw-week-plan',key:w.id,open:true},E('summary',{className:!w.startDate&&!w.title?'rw-placeholder':''},(w.startDate || '日期待定')+' · '+(w.title || '新教学计划')),
              E('div',{className:'rw-week-body'},E('div',{className:'rw-fields'},...[['startDate','开始日期','date'],['endDate','结束日期','date'],['title','本周主题','text']].map(([key,label,type])=>E('label',{className:'rw-field',key},E('span',null,label),E('input',{className:'lwb-input',type,value:w[key] || '',onChange:e=>edit('teachingPlans',w.id,{[key]:e.target.value})}))),E('label',{className:'rw-stage-check'},E('input',{type:'checkbox',checked:!!w.done,onChange:()=>edit('teachingPlans',w.id,{done:!w.done})}),'已完成')),
                E('label',{className:'rw-field'},E('span',null,'教学内容与备课安排'),E('textarea',{className:'lwb-textarea',rows:3,value:w.content || '',onChange:e=>edit('teachingPlans',w.id,{content:e.target.value})})),
                E(LinkFields,{value:w.linksDraft===undefined?linksText(w.links):w.linksDraft,onChange:value=>edit('teachingPlans',w.id,{linksDraft:value})}),E(CourseAttachments,{course:draft,planId:w.id}),E('button',{type:'button',className:'rw-text-button',onClick:()=>remove('teachingPlans',w.id)},'移除周计划')))),
            E('h3',null,'课程资料'),E(CourseAttachments,{course:draft}),E(LinkFields,{value:draft.linksDraft,onChange:value=>field('linksDraft',value)}),E(PrimaryLinkSelect,{text:draft.linksDraft,value:draft.primaryLinkUrl,onChange:value=>field('primaryLinkUrl',value)}),
            E('label',{className:'rw-field'},E('span',null,'资料备注'),E('textarea',{className:'lwb-textarea',value:draft.references || '',onChange:e=>field('references',e.target.value)})),
            (error||view.error)?E('div',{className:'lwb-err',role:'alert'},error||view.error):null),
          E('footer',{className:'rw-dialog-foot'},E(StatusNotice,{view}),E('button',{type:'button',className:'rw-text-button',title:'移到回收站',onClick:()=>{if(trashProject(draft))onClose()}},'放弃 / 删除'),E('span',{className:'lwb-spacer'}),E('button',{type:'button',className:'lwb-btn',onClick:close},'取消'),E('button',{type:'button',className:'lwb-btn',onClick:e=>save(e,false)},'保存并继续'),E('button',{type:'submit',className:'lwb-btn lwb-btn-primary'},'保存课程'))))
      }

      function ProjectEditor({project,onClose}) {
        const view=useSnapshot();const initial=React.useMemo(()=>({...project,plannedDate:projectPlanDate(project)||todayKey()}),[project]);const [draft,setDraft]=React.useState(()=>JSON.parse(JSON.stringify(initial)))
        const [linksText,setLinksText]=React.useState(()=>(project.links || []).map(l=>l.title+' | '+l.url).join('\n'))
        const [step,setStep]=React.useState('');const [stepDate,setStepDate]=React.useState('');const [update,setUpdate]=React.useState('');const [error,setError]=React.useState('')
        const dialogRef=React.useRef(null);const dirty=step.trim()!==''||stepDate!==''||update.trim()!==''||JSON.stringify(draft)!==JSON.stringify(initial)||linksText!==(project.links || []).map(l=>l.title+' | '+l.url).join('\n')
        const close=()=>{if(!dirty || window.confirm('放弃尚未保存的项目修改？'))onClose()}
        React.useEffect(()=>{const el=dialogRef.current;if(el && !el.open)el.showModal();return()=>{if(el?.open)el.close()}},[])
        const field=(key,value)=>setDraft(d=>Object.assign({},d,{[key]:value}))
        const attached=view.files.filter(f=>f.projectId===draft.id)
        function save(event) {
          event.preventDefault();if(!draft.title.trim()){setError('请填写项目名称');return}
          const people=projectPeople(draft);if(people.some(p=>!p.name.trim())){setError('请填写合作者姓名，或移除空白条目');return}
          if(people.some(p=>p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))){setError('请检查合作者邮箱格式');return}
          const links=[]
          for(const line of linksText.split('\n').filter(l=>l.trim())) {
            const parts=line.split('|');const url=safeLink(parts.length>1?parts.slice(1).join('|').trim():line.trim())
            if(!url){setError('链接需为完整的 http:// 或 https:// 地址');return}
            links.push({title:parts.length>1?parts[0].trim() || url:url,url})
          }
          if(!validDay(draft.plannedDate)){setError('请选择有效的计划日期');return}
          for(const [key,label] of [['plannedDate','计划日期'],['startDate','开始日期'],['targetDate','预计结束日期'],['endDate','实际结束日期']])if(draft[key] && !validDay(draft[key])){setError(label+'无效');return}
          if(draft.startDate && draft.endDate && draft.endDate<draft.startDate){setError('实际结束日期不能早于开始日期');return}
          if(draft.startDate && draft.targetDate && draft.targetDate<draft.startDate){setError('预计结束日期不能早于开始日期');return}
          if(stepDate && !step.trim()){setError('请为阶段日期填写节点名称');return}
          for(const m of (draft.milestones || []).concat(step.trim()?[{title:step,date:stepDate}]:[])){if(!m.title.trim()){setError('阶段名称不能为空');return}for(const key of ['date','doneAt'])if(m[key]&&!validDay(m[key])){setError('阶段日期无效');return}}
          updateProjects(Object.assign({},draft,{collaboratorDetails:people,collaborators:people.map(p=>p.name).join('、'),title:draft.title.trim(),links,milestones:step.trim()?(draft.milestones || []).concat({id:nextId('milestone'),title:step.trim(),date:stepDate,done:false}):draft.milestones,updates:update.trim()?(draft.updates || []).concat({id:nextId('update'),date:todayKey(),text:update.trim()}):draft.updates,updatedAt:new Date().toISOString()}));onClose()
        }
        function addMilestone(){if(!step.trim())return;field('milestones',(draft.milestones || []).concat({id:nextId('milestone'),title:step.trim(),date:stepDate,done:false}));setStep('');setStepDate('')}
        const editMilestone=(id,patch)=>field('milestones',(draft.milestones || []).map(m=>m.id===id?Object.assign({},m,patch):m))
        function addUpdate(){if(!update.trim())return;field('updates',(draft.updates || []).concat({id:nextId('update'),date:todayKey(),text:update.trim()}));setUpdate('')}
        const input=(key,label,type='text',placeholder='')=>E('label',{className:'rw-field',key},E('span',null,label),E('input',{className:'lwb-input',type,value:draft[key] || '',placeholder,onInput:type==='date'?e=>field(key,e.target.value):undefined,onChange:e=>field(key,e.target.value)}))
        const area=(key,label,placeholder)=>E('label',{className:'rw-field',key},E('span',null,label),E('textarea',{className:'lwb-textarea',rows:3,value:draft[key] || '',placeholder,onChange:e=>field(key,e.target.value)}))
        return E('dialog',{ref:dialogRef,className:'rw-dialog',onCancel:e=>{e.preventDefault();close()},'aria-labelledby':'rw-editor-heading'},
          E('form',{onSubmit:save},E('header',{className:'rw-dialog-head'},E('div',null,E('span',{className:'rw-kind'},'项目档案'),E('h2',{id:'rw-editor-heading'},project.title || '新建项目')),E('button',{type:'button',className:'lwb-icon-btn',title:'关闭','aria-label':'关闭项目详情',onClick:close},'×')),
          E('div',{className:'rw-editor-body'},
            E(RecognitionBox,{kind:'paper',current:{draft,linksText,step,stepDate,update},onApply:data=>{const next={draft:{...draft,...data},linksText:(data.links || []).map(l=>l.title+' | '+l.url).join('\n'),step,stepDate,update};setDraft(next.draft);setLinksText(next.linksText);setError('');return next},onRestore:previous=>{setDraft(previous.draft);setLinksText(previous.linksText);setStep(previous.step);setStepDate(previous.stepDate);setUpdate(previous.update)}}),
            input('title','项目名称','text','研究项目名称'),E(DestinationEditor,{project:draft,onChange:links=>field('harnessLinks',links)}),
            E('label',{className:'rw-field'},E('span',null,'状态'),E('select',{className:'lwb-select',value:draft.status,onChange:e=>field('status',e.target.value)},Object.entries(PROJECT_STATES).map(([value,label])=>E('option',{key:value,value},label)))),
            E(CollaboratorEditor,{project:draft,onChange:people=>setDraft(d=>Object.assign({},d,{collaboratorDetails:people,collaborators:people.map(p=>p.name).filter(Boolean).join('、')}))}),
            area('background','问题背景与目标','研究问题、已有结果、主要困难'),
            input('stage','当前阶段','text','例如：关键引理证明'),
            area('nextStep','下一步','一个具体、可接续的步骤'),
            E('h3',null,'时间安排'),
            E('div',{className:'rw-fields'},input('plannedDate','计划日期','date'),input('startDate','实际开始','date'),input('targetDate','预计结束','date'),input('endDate','实际结束','date')),
            E('h3',null,'阶段节点'),
            (draft.milestones || []).map(m=>E('div',{className:'rw-stage-editor',key:m.id},
              E('label',{className:'rw-stage-check'},E('input',{type:'checkbox',checked:!!m.done,onChange:()=>editMilestone(m.id,{done:!m.done,doneAt:!m.done?(m.doneAt || todayKey()):''})}),'已完成'),
              E('label',{className:'rw-field'},E('span',null,'阶段名称'),E('input',{className:'lwb-input',value:m.title,onChange:e=>editMilestone(m.id,{title:e.target.value})})),
              E('label',{className:'rw-field'},E('span',null,'阶段日期'),E('input',{className:'lwb-input',type:'date',value:m.date || '',onChange:e=>editMilestone(m.id,{date:e.target.value})})),
              m.done?E('label',{className:'rw-field'},E('span',null,'实际完成日期'),E('input',{className:'lwb-input',type:'date',value:m.doneAt || '',onChange:e=>editMilestone(m.id,{doneAt:e.target.value})})):null,
              E('button',{className:'rw-text-button',type:'button',onClick:()=>field('milestones',draft.milestones.filter(x=>x.id!==m.id))},'移除'))),
            E('div',{className:'rw-stage-add'},E('label',{className:'rw-field'},E('span',null,'新阶段名称'),E('input',{className:'lwb-input',value:step,placeholder:'例如：主定理证明、初稿完成','aria-label':'新阶段节点',onChange:e=>setStep(e.target.value),onKeyDown:e=>{if(e.key==='Enter'){e.preventDefault();addMilestone()}}})),E('label',{className:'rw-field'},E('span',null,'阶段日期（可选）'),E('input',{className:'lwb-input',type:'date',value:stepDate,onChange:e=>setStepDate(e.target.value)})),E('button',{type:'button',className:'lwb-btn',onClick:addMilestone},'添加节点')),
            E('h3',null,'推进记录'),(draft.updates || []).slice().reverse().map(u=>E('div',{className:'rw-update',key:u.id},E('time',null,u.date),E('span',null,u.text))),
            E('div',{className:'rw-inline'},E('input',{className:'lwb-input',value:update,placeholder:'今天推进了什么 / 遇到什么问题','aria-label':'新推进记录',onChange:e=>setUpdate(e.target.value),onKeyDown:e=>{if(e.key==='Enter'){e.preventDefault();addUpdate()}}}),E('button',{type:'button',className:'lwb-btn',onClick:addUpdate},'记录')),
            E('h3',null,'相关文献与草稿'),area('references','文献备注','论文题目、作者、草稿版本或研究计划说明'),
            attached.map(file=>E('div',{className:'rw-attachment',key:file.id},E(ClipIcon,{size:15}),E('button',{type:'button',className:'rw-text-button',onClick:()=>void downloadResearchFile(file)},file.name),E('span',{className:'rw-help'},formatBytes(file.size)),E('button',{type:'button',className:'lwb-icon-btn',title:'取消项目关联，保留在资料库',onClick:()=>persist({files:snapshot.files.map(f=>f.id===file.id?Object.assign({},f,{projectId:null}):f)})},'×'))),
            !view.projects.some(p=>p.id===draft.id) ? E('p',{className:'rw-help'},'保存项目后，可以在这里附上文件。') : attached.length<5 ? E(UploadZone,{label:'添加附件',target:{projectId:draft.id}}) : E('p',{className:'rw-help'},'已有 5 份附件，其余资料可在总库保存。'),
            E('label',{className:'rw-field'},E('span',null,'写作与相关链接'),E('textarea',{className:'lwb-textarea',rows:3,value:linksText,placeholder:'LaTeX 写作 | https://…\n参考文献 | https://…',onChange:e=>setLinksText(e.target.value)})),
            E(PrimaryLinkSelect,{text:linksText,value:draft.primaryLinkUrl,onChange:value=>field('primaryLinkUrl',value)}),
            error?E('div',{className:'lwb-err',role:'alert'},error):null),
          E('footer',{className:'rw-dialog-foot'},E(StatusNotice,{view}),E('button',{type:'button',className:'rw-text-button',title:'移到回收站',onClick:()=>{if(trashProject(draft))onClose()}},'放弃 / 删除'),E('span',{className:'lwb-spacer'}),E('button',{type:'button',className:'lwb-btn',onClick:close},'取消'),E('button',{type:'submit',className:'lwb-btn lwb-btn-primary'},'保存项目'))))
      }
      function SummaryIcon({name}){
        const paths={fit:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 12h8m-8 0 2-2m-2 2 2 2m6-2-2-2m2 2-2 2',eye:'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',today:'M12 3v3m0 12v3M3 12h3m12 0h3M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0',left:'m14 6-6 6 6 6',right:'m10 6 6 6-6 6'}
        return E('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},E('path',{d:paths[name] || paths.fit}))
      }
      function summaryWeek(view,today){
        const end=shiftDay(today,6),within=date=>validDay(date)&&date>=today&&date<=end
        const boards=view.boards.map(b=>({...b,cards:(b.cards || []).filter(c=>!c.projectId&&(within(c.date)||(!c.date&&b.kind==='daily')))}))
        const schedule=(view.schedule || []).filter(c=>within(c.date))
        const calendar=(view.calendarEvents || []).filter(e=>calendarInWeek(e,today)).map(e=>({id:e.id,title:e.title,date:e.startDate,time:e.allDay?'':e.time,done:false}))
        if(calendar.length)boards.push({id:'summary-calendar',title:'日历',cards:calendar,summaryOnly:true})
        return {...view,boards,schedule,calendarEvents:[]}
      }
      function SummaryStats({items}){
        return E('div',{className:'rw-summary-stats'},items.map(([value,label])=>E('div',{key:label},E('strong',null,value),E('span',null,label))))
      }
      function DailySummary({view}){
        const groups=view.boards.map(b=>({...b,cards:(b.cards || []).filter(c=>c&&!c.projectId)})).filter(b=>b.cards.length)
        const slots=view.schedule || []
        const rows=(items)=>E('ul',{className:'rw-summary-tasks'},items.map(c=>E('li',{key:c.id,className:c.done?'is-done':''},E('span',{className:'rw-summary-mark','aria-label':c.done?'已完成':'待办'},c.done?'✓':'○'),E('span',{className:'rw-summary-task-text'},c.title || c.text),c.date||c.time?E('time',null,[shortDay(c.date),c.time].filter(Boolean).join(' · ')):null)))
        return E('div',{className:'rw-summary-daily-grid'},groups.map(b=>{
          const done=b.cards.filter(c=>c.done).length,visible=b.cards.filter(c=>!b.hideCompleted||!c.done)
          return E('article',{className:'rw-summary-list',key:b.id},E('header',null,E('h3',null,b.title),E('span',{className:'rw-summary-count'},done+' / '+b.cards.length),b.summaryOnly?null:E('button',{type:'button',className:'lwb-icon-btn rw-summary-toggle',title:(b.hideCompleted?'显示':'隐藏')+'已完成事项','aria-label':(b.hideCompleted?'显示':'隐藏')+'已完成事项 · '+b.title,'aria-pressed':b.hideCompleted===true,onClick:()=>patchBoard(b.id,current=>({...current,hideCompleted:current.hideCompleted!==true}))},E(SummaryIcon,{name:'eye'}))),E('div',{className:'rw-summary-meter',role:'img','aria-label':done+' / '+b.cards.length+' 项已完成'},E('span',{style:{width:done/b.cards.length*100+'%'}})),visible.length?rows(visible):E('p',{className:'rw-summary-muted'},'已完成 '+done+' 项'))
        }),slots.length?E('article',{className:'rw-summary-list'},E('header',null,E('h3',null,'其他日程')),rows(slots)):null)
      }
      function SummaryChartLayout({items,children,kind}){
        const ref=React.useRef(null),previous=React.useRef(null),wideRef=React.useRef(false),[wide,setWide]=React.useState(false)
        React.useEffect(()=>{
          const el=ref.current;if(!el)return
          const observer=new ResizeObserver(()=>{
            const next=el.clientWidth>=(wideRef.current?1000:1060)
            if(next===wideRef.current)return
            previous.current=[...el.querySelectorAll('.rw-summary-stats>div>strong,.rw-summary-stats>div>span,.rw-summary-chart')].map(node=>({node,rect:node.getBoundingClientRect()}))
            wideRef.current=next;setWide(next)
          });observer.observe(el);return()=>observer.disconnect()
        },[])
        React.useLayoutEffect(()=>{
          const positions=previous.current;previous.current=null
          if(!positions||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
          const animations=positions.filter(x=>x.node.isConnected).map(({node,rect})=>{const now=node.getBoundingClientRect();return node.animate([{transform:`translate(${rect.left-now.left}px,${rect.top-now.top}px)`,opacity:.65},{transform:'translate(0,0)',opacity:1}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'})})
          return()=>animations.forEach(a=>a.cancel())
        },[wide])
        return E('div',{ref,className:'rw-summary-layout rw-summary-layout-'+kind+(wide?' is-wide':'')},E(SummaryStats,{items}),E('div',{className:'rw-summary-chart'},children))
      }
      function SummaryDashboard(){
        const view=useSnapshot(),today=useCalendarToday(),week=summaryWeek(view,today),papers=view.projects.filter(p=>p.kind==='paper'),courses=view.projects.filter(p=>p.kind==='course'),tasks=dailyEntries(week)
        const stats=list=>Object.entries(PROJECT_STATES).map(([key,label])=>[list.filter(p=>p.status===key).length,label]).filter(([n,label])=>n||['进行中','计划中','已完成'].includes(label))
        const lessons=courses.reduce((sum,c)=>{const x=lessonSummary(c,today);return {total:sum.total+x.total,completed:sum.completed+x.completed}},{total:0,completed:0})
        const block=(id,label,children)=>E('section',{className:'rw-summary-section rw-summary-'+id,'aria-label':label,key:id},E('h2',null,E(SectionIcon,{foldable:id!=='daily'}),label),children)
        return E('div',{className:'rw-summary-dashboard'},
          papers.length?block('papers','研究项目',E(SummaryChartLayout,{kind:'papers',items:stats(papers)},E(PaperTimelineBoard,{projects:papers,readOnly:true}))):null,
          courses.length?block('courses','教学任务',E(SummaryChartLayout,{kind:'courses',items:[[courses.length,'门课程'],[lessons.completed,'次已讲完'],[Math.max(0,lessons.total-lessons.completed),'次未完成']]},E(TeachingCalendarBoard,{courses,readOnly:true}))):null,
          tasks.length?block('daily','日常事项',E(React.Fragment,null,E(SummaryStats,{items:[[tasks.filter(t=>!t.done).length,'七天内待办'],[tasks.filter(t=>t.done).length,'七天内已完成']]}),E(DailySummary,{view:week}))):null,
          !papers.length&&!courses.length&&!tasks.length?E('p',{className:'rw-summary-muted'},'暂无可汇总的信息'):null)
      }
      function projectExpired(project,day){
        const end=project.kind==='course'?(project.termEnd || project.endDate || project.targetDate):(project.endDate || project.targetDate)
        return validDay(end)&&end<day
      }
      function projectHidden(project,day){return project.kind==='course'?courseStatus(project,day)==='completed':project.status==='completed'||projectExpired(project,day)}
      function ArchiveFacts({project:p}){
        const course=p.kind==='course'
        const dates=(course?[['开始',p.termStart],['结束',p.termEnd]]:[['计划',projectPlanDate(p)],['开始',p.startDate],['预计结束',p.targetDate],['完成',p.endDate]]).filter(([,v])=>v)
        const people=projectPeople(p).map(x=>x.name).filter(Boolean).join('、')
        const schedule=(p.weeklySchedule || []).map(x=>WEEKDAYS[x.weekday]+' '+[x.startTime,x.endTime].filter(Boolean).join('–')+(x.location&&x.location!==p.location?' · '+x.location:''))
        if(!schedule.length)(p.classSessions || []).slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(x=>schedule.push(x.date+' '+[x.startTime,x.endTime].filter(Boolean).join('–')+(x.location&&x.location!==p.location?' · '+x.location:'')))
        return E('span',{className:'rw-archive-facts'},course?E(React.Fragment,null,[courseSemester(p),p.location].filter(Boolean).length?E('span',{className:'rw-archive-description',title:[courseSemester(p),p.location].filter(Boolean).join(' · ')},[courseSemester(p),p.location].filter(Boolean).join(' · ')):null,schedule.length?E('span',{className:'rw-archive-description',title:schedule.join('；')},schedule.join('；')):null):people?E('span',{className:'rw-archive-description',title:'合作者：'+people},E('span',{className:'rw-archive-label'},'合作者 '),people):null,
          dates.length?E('span',{className:'rw-archive-dates'},dates.map(([label,value])=>E('span',{key:label},E('span',{className:'rw-archive-label'},label+' '),value))):null)
      }
      function ProjectArchive({kind,projects,onOpen,onClose}){
        const sortView=useSnapshot(),[query,setQuery]=React.useState(''),ref=React.useRef(null),today=useCalendarToday(),label=kind==='paper'?'研究项目':'教学任务'
        React.useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[])
        const archiveOrdered=sortProjects(projects.filter(p=>p.kind===kind),sortPreference(sortView,kind))
        const matching=archiveOrdered.filter(p=>[p.title,p.background,p.collaborators,p.location,p.grade,p.textbook,...projectPeople(p).map(x=>x.name)].filter(Boolean).join(' ').toLowerCase().includes(query.trim().toLowerCase()))
        return E('dialog',{ref,className:'rw-dialog rw-project-archive','aria-label':'全部'+label,onCancel:e=>{e.preventDefault();onClose()},onClick:e=>{if(e.target===ref.current){const r=ref.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}},
          E('header',{className:'rw-dialog-head'},E('h2',null,'全部'+label),E('button',{type:'button',className:'lwb-icon-btn',title:'关闭','aria-label':'关闭全部'+label,onClick:onClose},E(QuietIcon,{name:'close'}))),
          E('div',{className:'rw-archive-body'},E('input',{type:'search',className:'lwb-input',autoFocus:true,placeholder:'搜索名称、合作者或关键词','aria-label':'搜索'+label,value:query,onChange:e=>setQuery(e.target.value)}),
            E('div',{className:'rw-archive-list'},matching.length?matching.map(p=>E('button',{type:'button',className:'rw-archive-row',key:p.id,...dragOrdering(kind,p,archiveOrdered),onClick:()=>{if(Date.now()<suppressDragClickUntil)return;onClose();onOpen(p)}},E('span',{className:'rw-archive-title'},p.title || '未命名'),E('span',{className:'rw-archive-status'},p.status==='completed'?'已完成':projectExpired(p,today)?'已过期':PROJECT_STATES[p.status] || '计划中'),E(ArchiveFacts,{project:p}))):E('p',{className:'rw-placeholder'},query?'没有匹配结果':'暂无'+label))))
      }
      function PeriodMenu({scale,onChange}){
        const ref=React.useRef(null),panel=React.useRef(null),id='rw-period-menu-'+React.useId()
        useNearPopover(id,ref)
        return E('span',{className:'rw-sort-control',onClick:e=>e.stopPropagation()},E('button',{ref,type:'button',className:'lwb-icon-btn rw-header-icon',title:'时间轴视图','aria-label':'时间轴视图',popovertarget:id},E(PeriodViewIcon,{period:scale})),E('section',{id,ref:panel,popover:'auto',className:'rw-sort-popover',role:'dialog','aria-label':'时间轴视图选择'},[['year','年视图'],['month','月视图'],['week','周视图']].map(([value,label])=>E('button',{key:value,type:'button',className:scale===value?'is-selected':'',onClick:()=>{onChange(value);panel.current?.hidePopover()}},label))))
      }
      function ProjectVisibilityMenu({kind,value,onChange,onArchive}){
        const ref=React.useRef(null),panel=React.useRef(null),id='rw-visibility-'+React.useId(),label=kind==='paper'?'项目':'教学任务'
        useNearPopover(id,ref)
        return E('span',{className:'rw-sort-control',onClick:e=>e.stopPropagation()},E('button',{ref,type:'button',className:'lwb-icon-btn rw-header-icon',title:'显示范围','aria-label':label+'显示范围',popovertarget:id},E(SummaryIcon,{name:'eye'})),E('section',{id,ref:panel,popover:'auto',className:'rw-sort-popover',role:'dialog','aria-label':'选择显示范围'},[['both','进行中与计划中'],['active','进行中'],['planned','计划中']].map(([key,label])=>E('button',{type:'button',key,className:value===key?'is-selected':'',onClick:()=>{onChange(key);panel.current?.hidePopover()}},label)),E('button',{type:'button',onClick:()=>{panel.current?.hidePopover();onArchive(kind)}},'全部'+label+'（含已完成）')))
      }
      function IntegratedProjectBlock({kind,label,projects,allProjects,today,onEdit,onArchive,onTrash,showCharts=true}){
        const blockState=useBlockOpen(kind)
        const [visibility,setVisibility]=React.useState(()=>{try{const value=localStorage.getItem('rw-project-visibility-'+kind);return ['active','planned'].includes(value)?value:'both'}catch{return 'both'}})
        const changeVisibility=value=>{setVisibility(value);try{localStorage.setItem('rw-project-visibility-'+kind,value)}catch{}}
        const ref=React.useRef(null),statsRef=React.useRef(null),before=React.useRef(null),wideRef=React.useRef(false),[wide,setWide]=React.useState(false),[period,setPeriod]=React.useState('year')
        React.useEffect(()=>{const el=ref.current;if(!el)return;const observer=new ResizeObserver(()=>{if(!el.open)return;const next=el.clientWidth>=(wideRef.current?1000:1060);if(next===wideRef.current)return;before.current=statsRef.current?.getBoundingClientRect();wideRef.current=next;setWide(next)});observer.observe(el);return()=>observer.disconnect()},[])
        React.useLayoutEffect(()=>{const old=before.current;before.current=null;const el=statsRef.current;if(!old||!el||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const now=el.getBoundingClientRect();const animation=el.animate([{transform:`translate(${old.left-now.left}px,${old.top-now.top}px)`,opacity:.6},{transform:'translate(0,0)',opacity:1}],{duration:260,easing:'ease-out'});return()=>animation.cancel()},[wide])
        const counts=['active','planned'].map(status=>[projects.filter(p=>p.status===status).length,PROJECT_STATES[status]]).filter(([n])=>n)
        const order={active:0,planned:1,paused:2,completed:3},date=p=>p.kind==='course'?p.termStart || p.startDate || '9999':p.startDate || projectPlanDate(p) || '9999'
        const sortView=useSnapshot(),orderedAll=sortProjects(allProjects,sortPreference(sortView,kind)),visibleIds=new Set(projects.map(p=>p.id)),ordered=orderedAll.filter(p=>visibleIds.has(p.id)&&(visibility==='both'?['active','planned'].includes(p.status):p.status===visibility))
        const colors=new Map(kind==='paper'?sharedTimelineModel(allProjects.slice().sort((a,b)=>(order[a.status]??4)-(order[b.status]??4)),today).rows.map(row=>[row.project.id,row.color]):courseColorMap(allProjects))
        return E('details',{ref,...blockState,className:'rw-block rw-block-'+kind+' rw-integrated-block'+(wide&&showCharts?' is-wide':'')},
          E('summary',{className:'rw-block-heading',title:'展开或折叠'+label},E(SectionIcon,{foldable:true}),E('h2',null,label),E('span',{ref:statsRef,className:'rw-integrated-stats'},counts.map(([n,text])=>E('span',{key:text},E('strong',null,n),E('span',null,text)))),E('span',{className:'lwb-spacer'}),
            E('span',{className:'rw-project-tools rw-daily-tools'},E('button',{type:'button',className:'lwb-icon-btn rw-header-icon',title:kind==='paper'?'新建项目':'新建课程','aria-label':kind==='paper'?'新建项目':'新建课程',onClick:e=>{e.preventDefault();e.stopPropagation();onEdit(Object.assign(newProject(),{kind}))}},E(AddIcon)),E(SortMenu,{kind}),
            E(ProjectVisibilityMenu,{kind,value:visibility,onChange:changeVisibility,onArchive}),kind==='paper'&&showCharts&&ordered.length?E(PeriodMenu,{scale:period,onChange:setPeriod}):null,E('button',{type:'button',className:'lwb-icon-btn rw-header-icon',title:label+'回收站','aria-label':label+'回收站',onClick:e=>{e.preventDefault();e.stopPropagation();onTrash(kind)}},E(QuietIcon,{name:'trash'})))),
          E('div',{className:'rw-block-content rw-integrated-content'},
            showCharts&&ordered.length?E('div',{className:'rw-integrated-chart-wrap'},E('div',{className:'rw-summary-dashboard rw-integrated-chart'},kind==='paper'?E(PaperTimelineBoard,{projects:ordered,readOnly:true,scale:period,colors}):E(TeachingCalendarBoard,{courses:ordered,readOnly:true,colorMap:colors}))):null,
            ordered.length?E('div',{className:kind==='paper'?'rw-project-grid':'rw-course-grid'},ordered.map(p=>E(kind==='paper'?ProjectCard:CourseCard,{key:p.id,project:p,onOpen:onEdit,color:colors.get(p.id),dragProps:dragOrdering(kind,p,orderedAll)}))):null))
      }
      function ResearchHome({showCharts=true}){
        const view=useSnapshot(),today=useCalendarToday(),[editing,setEditing]=React.useState(null),[archiveKind,setArchiveKind]=React.useState(null),[details,setDetails]=React.useState(null),[trashKind,setTrashKind]=React.useState(null)
        return E('div',{className:'rw-home rw-integrated-home'},E(DayAgenda,{onOpen:setEditing}),['paper','course'].map(kind=>E(IntegratedProjectBlock,{key:kind,kind,showCharts,label:kind==='paper'?'研究项目':'教学任务',allProjects:view.projects.filter(p=>p.kind===kind),projects:view.projects.filter(p=>p.kind===kind&&!projectHidden(p,today)),today,onEdit:setEditing,onArchive:setArchiveKind,onTrash:setTrashKind})),E(OverviewView),
          trashKind?E(ProjectTrash,{kind:trashKind,onClose:()=>setTrashKind(null)}):null,
          archiveKind?E(ProjectArchive,{kind:archiveKind,projects:view.projects,onOpen:project=>{if(project.status==='completed')setEditing(project);else setDetails(project)},onClose:()=>setArchiveKind(null)}):null,
          details?E(ProjectDetails,{project:details,onClose:()=>setDetails(null)}):null,
          editing?E(editing.kind==='course'?CourseEditor:ProjectEditor,{key:editing.id,project:editing,onClose:()=>setEditing(null)}):null)
      }
      function weatherLabel(code){return code===0?'晴':code<=3?'多云':code<=48?'雾':code<=57?'毛毛雨':code<=67?'雨':code<=77?'雪':code<=82?'阵雨':code<=86?'阵雪':'雷雨'}
      function WeatherBadge(){
        const [weather,setWeather]=React.useState(null)
        React.useEffect(()=>{let active=true,timer;const update=async()=>{try{const response=await fetch('/life-workbench/weather',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const data=await response.json();if(active)setWeather(data.ok?data.weather:null)}catch{if(active)setWeather(null)}if(active)timer=setTimeout(update,1200000)};const receive=e=>{if(active)setWeather(e.detail)};window.addEventListener('rw-weather-updated',receive);void update();return()=>{active=false;clearTimeout(timer);window.removeEventListener('rw-weather-updated',receive)}},[])
        if(!weather)return null
        const cloud=weather.code>0,snow=weather.code>=71&&weather.code<=77||weather.code>=85&&weather.code<=86,rain=weather.code>=51&&!snow,storm=weather.code>=95
        const title=[weather.city,weatherLabel(weather.code),weather.temperature+'°C',Number.isFinite(weather.low)&&Number.isFinite(weather.high)?'今日 '+Math.round(weather.low)+'–'+Math.round(weather.high)+'°C':'',weather.time?'更新 '+weather.time.replace('T',' '):'','天气数据：Open-Meteo'].filter(Boolean).join(' · ')
        return E('a',{className:'rw-weather',title,'aria-label':weather.city+' '+weatherLabel(weather.code)+' '+weather.temperature+' 摄氏度',href:'https://open-meteo.com/',target:'_blank',rel:'noopener noreferrer'},E('svg',{width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},cloud?E('path',{d:'M6 16a4 4 0 0 1-.4-8A6 6 0 0 1 17 7a4.5 4.5 0 0 1 1 9H6'}):weather.isDay?E(React.Fragment,null,E('circle',{cx:12,cy:12,r:4}),E('path',{d:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5'})):E('path',{d:'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z'}),storm?E('path',{d:'m13 14-3 5h4l-3 4'}):snow?E('path',{d:'M8 19v3m-1.5-1.5h3M16 19v3m-1.5-1.5h3'}):rain?E('path',{d:'m8 19-1 3m6-3-1 3m6-3-1 3'}):weather.code>=45?E('path',{d:'M6 19h12M8 22h8'}):null),E('span',null,weather.temperature,E('span',{className:'rw-weather-unit'},'°C')))
      }
      function App() {
        const view = useSnapshot()
        const [showCharts,setShowCharts]=React.useState(()=>{try{return localStorage.getItem('rw-show-integrated-charts')!=='false'}catch{return true}})
        function toggleCharts(){setShowCharts(value=>{const next=!value;try{localStorage.setItem('rw-show-integrated-charts',String(next))}catch{}return next})}
        const head = React.createElement('div', { className: 'lwb-head' },
          React.createElement('h1', { className:'lwb-title' },E('button',{type:'button',className:'rw-home-button',title:showCharts?'隐藏时间轴与课程日历':'显示时间轴与课程日历','aria-label':showCharts?'隐藏时间轴与课程日历':'显示时间轴与课程日历','aria-pressed':showCharts,onClick:toggleCharts},E('span',{className:'rw-title-icon','aria-hidden':true},E(PanelIcon,{size:20})),'数学工作台')),
          (view.tab==='overview'||view.tab==='boards')?E(WeatherBadge):null,
          React.createElement('div', { className: 'lwb-spacer' }),
          view.error !== '' ? React.createElement('span', {className:'lwb-err',title:view.error,role:'alert'}, '保存或读取失败：'+view.error) : null,
          view.error !== '' ? React.createElement('button',{className:'lwb-btn',onClick:()=>persist({})},'重试保存') : null,
          E(StatusNotice,{view}),
          E('span',{className:'rw-signature','aria-label':'工作台'},E('button',{type:'button',className:'rw-logo-refresh',title:'刷新工作台与客户端','aria-label':'刷新工作台与客户端',disabled:view.refreshing || view.saving || view.clientRefreshing,onClick:()=>void refreshHarness()},E('img',{src:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHJlY3QgeD0iMS41IiB5PSIxLjUiIHdpZHRoPSIyMSIgaGVpZ2h0PSIyMSIgcng9IjUuNSIgZmlsbD0iIzI0NWE4OCIvPjxwYXRoIGQ9Ik03IDguNWgxME03IDEyaDEwTTcgMTUuNWg2IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMS42IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=",alt:'工作台'})))

        )
        let body = null
        if (view.status === 'loading') body = React.createElement('div', { className: 'lwb-empty' }, '正在载入…')
        else if (view.tab === 'boards') body = React.createElement(ResearchHome,{showCharts})
        else body = React.createElement(ResearchHome, {showCharts})

        return React.createElement('div', { className: 'lwb-root' },
          head,
          React.createElement('div', { className: 'lwb-body' }, body)
        )
      }

      ctx.effect(() => slots.inject('sidebar.panellist', () => slots.register(
        {name:'sidebar.panellist',id:SLOT_ID,order:-10,label:'工作台'},
        function(props){return E(PanelIcon,{size:props?.size})}
      )))

      const layout=ctx.get('layout')
      let mainRegistered=false,startupLoaded=false,startupDisposed=false,userNavigated=false
      const bootKey='__dshWorkbenchStartupSelected'
      function returnToConversation(){try{if(layout?.panelInfo?.getSnapshot?.().activePanelId===SLOT_ID)layout.selectPanel(null)}catch(error){console.warn('[life-workbench] 无法返回对话面板',error)}}
      function selectStartup(){
        if(!mainRegistered||!startupLoaded||startupDisposed||userNavigated||window[bootKey]||typeof layout?.selectPanel!=='function')return
        window[bootKey]=true
        try{publish({tab:'overview'});layout.selectPanel(SLOT_ID)}catch(error){returnToConversation();console.warn('[life-workbench] 启动面板不可用，保留默认界面',error)}
      }
      class WorkbenchBoundary extends React.Component {
        constructor(props){super(props);this.state={failed:false}}
        static getDerivedStateFromError(){return {failed:true}}
        componentDidCatch(error){console.error('[life-workbench] 界面异常，返回对话',error);returnToConversation()}
        render(){return this.state.failed?null:this.props.children}
      }
      ctx.effect(()=>{
        const cancelStartup=()=>{userNavigated=true}
        document.addEventListener?.('pointerdown',cancelStartup,{once:true,capture:true})
        document.addEventListener?.('keydown',cancelStartup,{once:true,capture:true})
        return()=>{startupDisposed=true;document.removeEventListener?.('pointerdown',cancelStartup,true);document.removeEventListener?.('keydown',cancelStartup,true);returnToConversation()}
      })
      ctx.effect(() => slots.inject('main', () => {
        const dispose=slots.register({name:'main',key:SLOT_ID},function(){return E(WorkbenchBoundary,null,E(App))})
        mainRegistered=true;selectStartup()
        return()=>{mainRegistered=false;returnToConversation();if(typeof dispose==='function')dispose()}
      }))

      ctx.effect(()=>{
        let stopped=false,timer,busy=false,lastAttempt=0,done=''
        const storageKey='life-workbench-daily-refresh-v1'
        try{done=localStorage.getItem(storageKey)||''}catch{}
        const tick=async()=>{
          clearTimeout(timer)
          if(stopped)return
          const now=new Date(),parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now),get=k=>parts.find(p=>p.type===k)?.value,day=get('year')+'-'+get('month')+'-'+get('day'),ready=Number(get('hour'))*60+Number(get('minute'))>=450
          if(!busy&&startupLoaded&&ready&&done!==day&&Date.now()-lastAttempt>=300000){
            busy=true;lastAttempt=Date.now()
            try{
              await chain
              if(stopped)return
              const results=await Promise.allSettled([hostCall('syncCalendar',{date:day}),hostCall('weather',{force:true})])
              if(stopped)return
              const calendar=results[0].status==='fulfilled'?results[0].value:null,weather=results[1].status==='fulfilled'?results[1].value:null
              if(calendar?.ok)publish({calendarEvents:calendar.events,calendarSync:calendar.calendarSync,calendarError:''})
              if(weather?.weather)window.dispatchEvent(new CustomEvent('rw-weather-updated',{detail:weather.weather}))
              if(calendar?.ok&&weather?.weather){done=day;try{localStorage.setItem(storageKey,day)}catch{}}
            }catch{}finally{busy=false}
          }
          if(!stopped){clearTimeout(timer);timer=setTimeout(tick,60000)}
        }
        const resume=()=>{if(document.visibilityState==='visible')void tick()}
        timer=setTimeout(tick,1500);document.addEventListener('visibilitychange',resume)
        return()=>{stopped=true;clearTimeout(timer);document.removeEventListener('visibilitychange',resume)}
      })

      void load().then(ok=>{startupLoaded=ok===true;selectStartup()})
    }

    // __ModuleLoader__ 协议要求 factory 返回插件对象；缺少这句会让 loader
    // 拿到 undefined，报 "invalid plugin ... received undefined"。
    return module.exports
  },
})
