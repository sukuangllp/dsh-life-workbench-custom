export function isBirthday(item){
  if(!item || typeof item!=='object')return false
  if(item.isBirthday===true || item.calendarType==='birthday')return true
  return [item.title,item.text,item.calendarTitle].some(value=>typeof value==='string'&&/(?:生日|生辰|寿辰|壽辰|\bbirthdays?\b|\bb[ -]?day\b)/iu.test(value))
}

export function isValidCalendarTask(item){
  if(!item || isBirthday(item))return false
  const title=String(item.title || '').trim()
  if(!title)return false
  const terms=new Set('立春 雨水 惊蛰 春分 清明 谷雨 立夏 小满 芒种 夏至 小暑 大暑 立秋 处暑 白露 秋分 寒露 霜降 立冬 小雪 大雪 冬至 小寒 大寒'.split(' '))
  const term=title.replace(/(?:\d{4}年|节气|二十四|[·：:（）()\s])/g,'')
  if(terms.has(term))return false
  if(item.allDay&&/(?:节假日|节气|holidays?)/i.test(item.calendarTitle || '')&&!item.location)return false
  return true
}
