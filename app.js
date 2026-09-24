const DB_NAME='mama-zukan-db', DB_VERSION=1;
const sections=[
  ['overview','概要'],['appearance','外見'],['personality','性格'],['speech','口調・呼称'],
  ['relationship','関係性'],['intimacy','親密時'],['imageRules','画像生成ルール'],['notes','重要メモ']
];
let db, chars=[], current=null, currentSection='overview', dirty=false;

function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=e=>{const d=e.target.result;if(!d.objectStoreNames.contains('characters'))d.createObjectStore('characters',{keyPath:'id'});};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function req(store,mode='readonly'){return db.transaction(store,mode).objectStore(store)}
function all(){return new Promise((res,rej)=>{const r=req('characters').getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);})}
function put(x){return new Promise((res,rej)=>{const r=req('characters','readwrite').put(x);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);})}
function del(id){return new Promise((res,rej)=>{const r=req('characters','readwrite').delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);})}
const uid=()=>crypto.randomUUID?.()||String(Date.now()+Math.random());
const blankSections=()=>Object.fromEntries(sections.map(([k])=>[k,'']));
async function ensureSeed(){return;}

function esc(s=''){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function renderList(filter=''){const f=filter.trim().toLowerCase();const box=document.querySelector('#characterList');box.innerHTML='';chars.filter(c=>!f||JSON.stringify(c).toLowerCase().includes(f)).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).forEach(c=>{const el=document.createElement('div');el.className='character-card'+(current?.id===c.id?' active':'');el.innerHTML=`<b>${esc(c.name)}</b><span>${esc(c.subtitle||'')}</span>`;el.onclick=()=>select(c.id);box.appendChild(el);});}
function renderTabs(){const box=document.querySelector('#tabs');box.innerHTML='';for(const [k,label] of sections){const b=document.createElement('button');b.textContent=label;b.className=currentSection===k?'active':'';b.onclick=()=>{capture();currentSection=k;renderTabs();renderPanel();};box.appendChild(b);}}
function renderPanel(){const panel=document.querySelector('#tabPanel');panel.innerHTML='';const t=document.querySelector('#textSectionTemplate').content.cloneNode(true);const ta=t.querySelector('textarea');ta.value=current.sections?.[currentSection]||'';ta.oninput=()=>markDirty();panel.appendChild(t);}
function renderGallery(){const g=document.querySelector('#gallery');g.innerHTML='';(current.images||[]).forEach((it,i)=>{const d=document.createElement('div');d.className='gallery-item';d.innerHTML=`<img src="${it.data}" alt=""><span class="badge">${it.label||'画像'}</span><button>×</button>`;d.querySelector('button').onclick=()=>{current.images.splice(i,1);pushHistory('画像を削除');markDirty();renderGallery();};g.appendChild(d);});}
function renderHistory(){const h=document.querySelector('#history');h.innerHTML='';(current.history||[]).slice().reverse().slice(0,40).forEach(x=>{const d=document.createElement('div');d.className='history-item';d.innerHTML=`<time>${new Date(x.at).toLocaleString('ja-JP')}</time>${esc(x.text)}`;h.appendChild(d);});}
function select(id){capture();current=chars.find(c=>c.id===id);document.querySelector('#emptyState').classList.add('hidden');document.querySelector('#editor').classList.remove('hidden');document.querySelector('#nameInput').value=current.name||'';document.querySelector('#subtitleInput').value=current.subtitle||'';document.querySelector('#tagsInput').value=(current.tags||[]).join(', ');renderTabs();renderPanel();renderGallery();renderHistory();dirty=false;status('保存済み');renderList(document.querySelector('#searchInput').value);}
function capture(){if(!current)return;const ta=document.querySelector('.section-text');if(ta)current.sections[currentSection]=ta.value;current.name=document.querySelector('#nameInput').value.trim();current.subtitle=document.querySelector('#subtitleInput').value.trim();current.tags=document.querySelector('#tagsInput').value.split(',').map(x=>x.trim()).filter(Boolean);}
function markDirty(){dirty=true;status('未保存');}
function status(s){document.querySelector('#saveStatus').textContent=s;}
function pushHistory(text){current.history=current.history||[];current.history.push({at:new Date().toISOString(),text});}
async function save(){if(!current)return;capture();current.updatedAt=Date.now();pushHistory('設定を保存');await put(current);chars=await all();dirty=false;status('保存済み');renderList(document.querySelector('#searchInput').value);renderHistory();}
function compile(c){let out=`# ${c.name}\n${c.subtitle?`\n${c.subtitle}\n`:''}`;if(c.tags?.length)out+=`\nタグ: ${c.tags.join(' / ')}\n`;for(const [k,label] of sections){const text=c.sections?.[k]?.trim();if(text)out+=`\n## ${label}\n${text}\n`;}return out.trim();}

async function fileToDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(file);});}

window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
document.querySelector('#searchInput').oninput=e=>renderList(e.target.value);
['nameInput','subtitleInput','tagsInput'].forEach(id=>document.querySelector('#'+id).oninput=markDirty);
document.querySelector('#saveBtn').onclick=save;
document.querySelector('#copyBtn').onclick=async()=>{capture();await navigator.clipboard.writeText(compile(current));status('コピーしました');setTimeout(()=>status(dirty?'未保存':'保存済み'),1200);};
document.querySelector('#deleteBtn').onclick=async()=>{if(!current||!confirm(`${current.name} を削除しますか？`))return;await del(current.id);current=null;chars=await all();document.querySelector('#editor').classList.add('hidden');document.querySelector('#emptyState').classList.remove('hidden');renderList();};
document.querySelector('#clearHistoryBtn').onclick=()=>{if(!current)return;current.history=[{at:new Date().toISOString(),text:'履歴を整理'}];markDirty();renderHistory();};
document.querySelector('#imageInput').onchange=async e=>{if(!current)return;for(const f of e.target.files){current.images.push({id:uid(),label:f.name,data:await fileToDataURL(f)});}pushHistory(`${e.target.files.length}枚の画像を追加`);markDirty();renderGallery();e.target.value='';};

document.querySelector('#newCharacterBtn').onclick=()=>document.querySelector('#newDialog').showModal();
document.querySelector('#newForm').addEventListener('submit',async e=>{const name=document.querySelector('#newName').value.trim();if(!name)return;const c={id:uid(),name,subtitle:document.querySelector('#newSubtitle').value.trim(),tags:[],sections:blankSections(),images:[],history:[{at:new Date().toISOString(),text:'新規作成'}],updatedAt:Date.now()};await put(c);chars=await all();document.querySelector('#newName').value='';document.querySelector('#newSubtitle').value='';setTimeout(()=>select(c.id));});

document.querySelector('#exportBtn').onclick=async()=>{if(dirty)await save();const data={version:1,exportedAt:new Date().toISOString(),characters:await all()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mama-zukan-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);};
document.querySelector('#importInput').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.characters))throw Error('形式が違います');if(!confirm(`${data.characters.length}人を読み込みます。既存IDが同じ人物は上書きされます。続けますか？`))return;for(const c of data.characters)await put(c);chars=await all();renderList();alert('読み込み完了');}catch(err){alert('読み込みに失敗しました: '+err.message)}finally{e.target.value='';}};

(async()=>{db=await openDB();await ensureSeed();chars=await all();renderList();if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});})();
