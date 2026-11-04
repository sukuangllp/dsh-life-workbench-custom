import {isBirthday,isValidCalendarTask} from './birthdays.js'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {randomUUID} from 'node:crypto'
const run=promisify(execFile)
let pending
export function createCalendarSync({dataDir,readState,normalize,writeState}){
 return async function sync(args={}){
  if(pending)return pending
  pending=(async()=>{
   if(process.platform!=='darwin')throw Error('Mac 日历同步仅支持 macOS')
   const pivot=/^\d{4}-\d{2}-\d{2}$/.test(args.date || '')?Number(args.date.slice(0,4)):new Date().getFullYear()
   if(pivot<1971||pivot>2098)throw Error('同步日期应在 1971—2098 年之间')
   const from=(pivot-1)+'-01-01',until=(pivot+2)+'-01-01',jobs=path.join(dataDir(),'calendar-jobs');await fs.mkdir(jobs,{recursive:true,mode:0o700});const output=path.join(jobs,randomUUID()+'.json'),app=fileURLToPath(new URL('./WorkbenchCalendar.app',import.meta.url))
   try{
    await run('/usr/bin/open',['-W','-n','-g',app,'--args','--output',output,'--from',from,'--until',until],{timeout:135000,maxBuffer:100000})
    let result;try{result=JSON.parse(await fs.readFile(output,'utf8'))}catch{throw Error('未能读取 Mac 日历同步结果，请重试')}
    if(!result.ok)throw Error(result.error || '日历同步失败')
    if(!Array.isArray(result.events))throw Error('日历返回的数据格式不正确')
    const current=normalize(readState()).state,keep=(current.calendarEvents || []).filter(e=>e.endDate<from||(e.endDate===from&&(e.allDay||e.endTime==='00:00'))||e.startDate>=until),events=[...keep,...result.events].filter(isValidCalendarTask),unique=[...new Map(events.map(e=>[e.id,e])).values()]
    const calendarSync={from,until,timeZone:result.timeZone,syncedAt:new Date().toISOString()};writeState({...current,calendarEvents:unique,calendarSync})
    return {ok:true,events:unique,calendarSync,count:result.events.filter(isValidCalendarTask).length}
   }finally{await fs.rm(output,{force:true}).catch(()=>{})}
  })()
  try{return await pending}finally{pending=null}
 }
}
