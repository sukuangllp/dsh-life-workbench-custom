import fs from 'node:fs'
function loadLocation(){
  const fromEnv=process.env.LIFE_WORKBENCH_LOCATION
  if(typeof fromEnv==='string'&&fromEnv.trim()!==''){
    try{return JSON.parse(fromEnv)}catch{console.warn('[life-workbench] LIFE_WORKBENCH_LOCATION 不是合法 JSON，天气功能已关闭')}
  }
  try{return JSON.parse(fs.readFileSync(new URL('./weather-location.json',import.meta.url),'utf8'))}catch{return null}
}
const location=loadLocation()
export function createWeatherService({fetcher=globalThis.fetch,now=Date.now,place=location}={}){
  let cache=null,pending=null,nextAttempt=0
  return async({force=false}={})=>{
    if(!place||!Number.isFinite(place.latitude)||!Number.isFinite(place.longitude))return {ok:true,weather:null}
    if(!force&&now()<nextAttempt)return {ok:true,weather:cache&&now()-cache.fetchedAt<7200000?cache:null}
    if(pending)return pending
    pending=(async()=>{try{
      const url=new URL('https://api.open-meteo.com/v1/forecast')
      for(const [key,value] of Object.entries({latitude:place.latitude,longitude:place.longitude,current:'temperature_2m,weather_code,is_day',daily:'temperature_2m_max,temperature_2m_min',timezone:'auto',forecast_days:1}))url.searchParams.set(key,String(value))
      const response=await fetcher(url,{signal:AbortSignal.timeout(10000)})
      if(!response.ok)throw Error('Weather unavailable')
      const data=await response.json(),current=data.current
      if(!Number.isFinite(current?.temperature_2m)||!Number.isInteger(current?.weather_code))throw Error('Invalid weather')
      cache={city:place.name,temperature:Math.round(current.temperature_2m),code:current.weather_code,isDay:current.is_day!==0,low:data.daily?.temperature_2m_min?.[0],high:data.daily?.temperature_2m_max?.[0],time:current.time,fetchedAt:now()};nextAttempt=now()+1200000
    }catch{nextAttempt=now()+300000}finally{pending=null}
    return {ok:true,weather:cache&&now()-cache.fetchedAt<7200000?cache:null}
    })();return pending
  }
}
