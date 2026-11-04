const clean=(v,max=1000)=>typeof v==='string'?v.trim().slice(0,max):''
export function contactFields(value){const p=value&&typeof value==='object'?value:{};return {name:clean(p.name,200),institution:clean(p.institution,500),email:clean(p.email,320),notes:clean(p.notes,4000)}}
export function projectPeople(project){if(Array.isArray(project?.collaboratorDetails))return project.collaboratorDetails.map(p=>({...contactFields(p),id:clean(p.id,200),contactId:clean(p.contactId,200)})).filter(p=>p.name||p.email||p.institution||p.notes);const name=clean(project?.collaborators,12000);return name?[{name,institution:'',email:'',notes:''}]:[]}
export function mergeContacts(existing,people,overwrite=true){const result=(Array.isArray(existing)?existing:[]).filter(p=>p&&typeof p==='object').map(p=>({...contactFields(p),id:clean(p.id,200)})).filter(p=>p.name);for(const raw of people){const person=contactFields(raw);if(!person.name)continue;const email=person.email.toLocaleLowerCase(),identity=p=>p.name.toLocaleLowerCase()===person.name.toLocaleLowerCase()&&p.institution.toLocaleLowerCase()===person.institution.toLocaleLowerCase();const index=result.findIndex(p=>(raw.contactId&&p.id===raw.contactId)||(email&&p.email.toLocaleLowerCase()===email)||(!email&&!p.email&&identity(p))||(identity(p)&&(!email||!p.email)));if(index>=0){if(overwrite)result[index]={...person,id:result[index].id}}else result.push({...person,id:clean(raw.contactId || raw.id,200)||'contact-'+result.length+'-'+Date.now().toString(36)})}return result}

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

export {synchronizeCollaborators};

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

export {reconcileCollaborators};
