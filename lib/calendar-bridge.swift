import Foundation
import AppKit
import EventKit

let args = CommandLine.arguments
func option(_ name: String) -> String? { guard let i = args.firstIndex(of:name),i+1<args.count else{return nil};return args[i+1] }
let store=EKEventStore()
if args.contains("--status") {print(EKEventStore.authorizationStatus(for:.event).rawValue);exit(0)}
guard let output=option("--output"),let from=option("--from"),let until=option("--until") else {exit(2)}
let formatter=DateFormatter();formatter.locale=Locale(identifier:"en_US_POSIX");formatter.dateFormat="yyyy-MM-dd";formatter.isLenient=false
let time=DateFormatter();time.locale=Locale(identifier:"en_US_POSIX");time.dateFormat="HH:mm"
let iso=ISO8601DateFormatter()
var finished=false
func finish(_ result:[String:Any]) {guard !finished else{return};finished=true;do{let data=try JSONSerialization.data(withJSONObject:result,options:[.sortedKeys]);try data.write(to:URL(fileURLWithPath:output),options:.atomic)}catch{fputs("Calendar result could not be written\n",stderr)};exit(0)}
guard let start=formatter.date(from:from),let end=formatter.date(from:until),start<end else {finish(["ok":false,"error":"日历查询日期无效"]);exit(0)}
func readEvents(){
    store.reset()
    let predicate=store.predicateForEvents(withStart:start,end:end,calendars:nil)
    let events=store.events(matching:predicate).filter{$0.status != .canceled && $0.calendar.type != .birthday}.sorted{$0.startDate<$1.startDate}
    if events.count>10000 {finish(["ok":false,"error":"日程数量过多，请缩短同步日期范围"]);return}
    let rows:[[String:Any]]=events.map{event in
        let calendarId=event.calendar.calendarIdentifier
        let identifier=event.eventIdentifier ?? event.calendarItemIdentifier
        return ["id":calendarId+"|"+identifier+"|"+iso.string(from:event.startDate),"eventIdentifier":identifier,"calendarId":calendarId,"calendarTitle":event.calendar.title,"title":event.title ?? "未命名日程","start":iso.string(from:event.startDate),"end":iso.string(from:event.endDate),"startDate":formatter.string(from:event.startDate),"endDate":formatter.string(from:event.endDate),"time":event.isAllDay ? "" : time.string(from:event.startDate),"endTime":event.isAllDay ? "" : time.string(from:event.endDate),"allDay":event.isAllDay,"location":event.location ?? "","url":event.url?.absoluteString ?? ""]
    }
    finish(["ok":true,"events":rows,"from":from,"until":until,"timeZone":TimeZone.current.identifier])
}
let app=NSApplication.shared;app.setActivationPolicy(.accessory)
switch EKEventStore.authorizationStatus(for:.event){
case .fullAccess:readEvents()
case .notDetermined:
    store.requestFullAccessToEvents{granted,error in DispatchQueue.main.async{if granted{readEvents()}else{finish(["ok":false,"error":"尚未获得日历读取权限。请在系统设置 → 隐私与安全性 → 日历中，允许「工作台日历同步」访问，再点击同步。"])} }}
default:finish(["ok":false,"error":"日历读取权限未开启。请在系统设置 → 隐私与安全性 → 日历中，允许「工作台日历同步」访问，再点击同步。"])
}
DispatchQueue.main.asyncAfter(deadline:.now()+120){finish(["ok":false,"error":"日历授权或读取超时，请确认系统授权后重试"])}
app.run()
