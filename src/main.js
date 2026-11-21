import './styles.css';
import './blue-particle-heart.css';
import {Store} from './store.js';
import {FocusTimer} from './timer.js';
import {Analytics} from './analytics.js';
import {ProductivityIntelligence} from './productivity-intelligence.js';
import {mountBlueParticleHeart} from './blue-particle-heart.js';

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store=new Store();
const timer=new FocusTimer(store,()=>paintClock());
let page='timer',heartUnmount=()=>{},tick=null,selectedSubject=store.data.subjects[0]?.id||'',taskFilter='all',taskSearch='';
const fmt=n=>{n=Math.max(0,Math.floor(n||0));return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,'0')).join(':')};
const duration=n=>{const h=Math.floor(n/3600),m=Math.floor(n%3600/60);return h? h+'h '+m+'m':m+'m'};
const totals=()=>{const sessions=store.data.sessions,now=new Date();return {today:Analytics.dailySeconds(sessions,now),week:Analytics.weekly(sessions).reduce((a,x)=>a+x.seconds,0),all:sessions.reduce((a,x)=>a+x.duration,0),count:sessions.length}};
function paintClock(){const el=$('#clock');if(el)el.textContent=fmt(timer.elapsed());const btn=$('#pauseTimer');if(btn)btn.textContent=timer.paused?'Resume':'Pause';$('#timerState')?.replaceChildren(document.createTextNode(!timer.active?'READY':timer.paused?'PAUSED':'FOCUSING'));}
function toast(msg){let e=$('#toast');if(!e){e=document.createElement('div');e.id='toast';document.body.append(e)}e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2300)}
function nav(){return `<header class="topbar"><a class="brand" href="#" data-page="timer"><span class="brand-mark">♥</span><span>TIMER<span class="brand-light">DASHBOARD</span><small>NATIONVK · FIND YOUR OWN PATH</small></span></a><nav><button data-page="timer" class="${page==='timer'?'active':''}">Timer</button><button data-page="dashboard" class="${page==='dashboard'?'active':''}">Dashboard</button><button data-page="subjects" class="${page==='subjects'?'active':''}">Subjects</button><button data-page="tasks" class="${page==='tasks'?'active':''}">Tasks</button></nav><span class="local-status"><i></i> LOCAL DATA</span></header>`;}
function subjectOptions(){return store.data.subjects.map(s=>`<option value="${esc(s.id)}" ${s.id===selectedSubject?'selected':''}>${esc(s.name)}</option>`).join('')}
function timerPage(){
return `<main class="timer-layout"><section class="timer-intro"><span class="eyebrow">FOCUS MODE · BLUE PARTICLE HEART</span><h1>Make time<br><em>mean something.</em></h1><p>One session at a time. Your focus history stays on this device.</p><div class="subject-picker"><label for="subjectSelect">FOCUS SUBJECT</label><select id="subjectSelect" ${timer.active?'disabled':''}>${subjectOptions()}</select><button class="icon-btn" id="addSubject" aria-label="Add subject">＋</button></div></section>
<section class="heart-stage" id="blueHeartScene"><canvas id="blueHeartCanvas" aria-label="Animated particle heart"></canvas><div class="heart-overlay"><span class="timer-state" id="timerState">READY</span><strong id="clock">${fmt(timer.elapsed())}</strong><small>${timer.active?esc(store.subjectName(timer.subjectId)):'YOUR FOCUS TIME'}</small></div><div class="timer-actions">${timer.active?`<button class="control secondary" id="pauseTimer">${timer.paused?'Resume':'Pause'}</button><button class="control finish" id="finishTimer">Finish session</button>`:`<button class="control start" id="startTimer">Start focus</button>`}</div></section>
<div class="timer-foot"><span><b>01</b> Breathe</span><span><b>02</b> Focus</span><span><b>03</b> Progress</span></div></main>`;
}
function subjectsPage(){
const subjects=store.data.subjects;
return `<main class="management-page"><section class="management-heading"><div><span class="eyebrow">ORGANIZE YOUR LEARNING</span><h1>Your <em>Subjects</em></h1><p>Create and manage the subjects you focus on. Your session history remains attached to its original subject name.</p></div><button class="control start" id="addSubjectPage">＋ New subject</button></section><section class="subject-management-grid">${subjects.map(s=>{const seconds=Analytics.subjectSeconds(store.data.sessions,s.id);const count=store.data.sessions.filter(x=>x.subjectId===s.id).length;return `<article class="panel subject-manage-card"><span class="subject-color-dot" style="background:${esc(s.color)}"></span><div class="subject-manage-copy"><h2>${esc(s.name)}</h2><p>${duration(seconds)} focused · ${count} sessions</p></div><div class="subject-manage-actions"><button class="text-btn" data-edit-subject="${esc(s.id)}">Edit name</button><button class="text-btn danger-text" data-delete-subject="${esc(s.id)}">Delete</button></div></article>`}).join('')||'<p class="empty">No subjects yet. Create your first subject to start tracking focus.</p>'}</section></main>`;
}

function taskProgress(task){const subs=task.subtasks||[];return subs.length?Math.round(subs.filter(x=>x.done).length/subs.length*100):(task.done?100:0)}
function tasksPage(){
const today=Analytics.dateKey(new Date());
const all=store.data.tasks;
const overdueCount=all.filter(x=>!x.done&&x.dueDate&&x.dueDate<today).length;
const completed=all.filter(x=>x.done).length;
const tasks=all.filter(x=>taskFilter==='all'||(taskFilter==='active'&&!x.done)||(taskFilter==='done'&&x.done)||(taskFilter==='overdue'&&!x.done&&x.dueDate&&x.dueDate<today));
const rank={high:0,medium:1,low:2};
tasks.sort((a,b)=>(a.done-b.done)||(rank[a.priority||'medium']-rank[b.priority||'medium'])||((a.dueDate||'9999').localeCompare(b.dueDate||'9999')));
const q=taskSearch.trim().toLocaleLowerCase();
const visible=tasks.filter(t=>!q||[t.title,...(t.subtasks||[]).map(s=>s.title)].join(' ').toLocaleLowerCase().includes(q));
return `<main class="management-page"><section class="management-heading"><div><span class="eyebrow">PLAN · EXECUTE · COMPLETE</span><h1>Make it <em>happen.</em></h1><p>Break big goals into smaller steps and track every completion.</p></div><button class="control start" id="addTask">＋ Add task</button></section>
<section class="task-summary-grid"><article class="metric"><span>TOTAL TASKS</span><strong>${all.length}</strong><small>Everything on your list</small></article><article class="metric"><span>REMAINING</span><strong>${all.length-completed}</strong><small>Still in progress</small></article><article class="metric"><span>COMPLETED</span><strong>${completed}</strong><small>${all.length?Math.round(completed/all.length*100):0}% completion rate</small></article><article class="metric"><span>OVERDUE</span><strong>${overdueCount}</strong><small>Need your attention</small></article></section>
<section class="panel task-manager-panel"><div class="task-toolbar"><label class="sr-only" for="taskSearch">Search tasks</label><input id="taskSearch" type="search" placeholder="Search tasks and subtasks…" value="${esc(taskSearch)}"><label class="sr-only" for="taskFilter">Filter tasks</label><select id="taskFilter"><option value="all" ${taskFilter==='all'?'selected':''}>All tasks</option><option value="active" ${taskFilter==='active'?'selected':''}>Active</option><option value="done" ${taskFilter==='done'?'selected':''}>Completed</option><option value="overdue" ${taskFilter==='overdue'?'selected':''}>Overdue</option></select></div>
<div class="task-list">${visible.map(t=>{const subs=t.subtasks||[],pct=taskProgress(t),isOverdue=!t.done&&t.dueDate&&t.dueDate<today,due=t.dueDate?new Date(t.dueDate+'T00:00:00').toLocaleDateString():'No deadline';return `<article class="task-card"><div class="task-main"><label class="task-title-label"><input type="checkbox" data-task-toggle="${esc(t.id)}" ${t.done?'checked':''}><span class="${t.done?'done':''}">${esc(t.title)}<small class="task-meta"><i class="priority ${esc(t.priority||'medium')}">${(t.priority||'medium').toUpperCase()}</i><i class="due ${isOverdue?'overdue':''}">${isOverdue?'Overdue · ':''}${esc(due)}</i></small></span></label><div class="task-actions"><button class="text-btn" data-add-subtask="${esc(t.id)}">＋ Subtask</button><button class="text-btn" data-edit-task="${esc(t.id)}">Edit</button><button class="text-btn danger-text" data-delete-task="${esc(t.id)}">Delete</button></div></div><div class="task-progress-head"><span>Progress ${subs.length?'· '+subs.filter(s=>s.done).length+'/'+subs.length+' subtasks':''}</span><b>${pct}%</b></div><div class="progress-track task-progress"><i style="width:${pct}%"></i></div>${subs.length?`<div class="subtask-list">${subs.map(s=>`<div class="subtask-row"><label><input type="checkbox" data-subtask-task="${esc(t.id)}" data-subtask="${esc(s.id)}" ${s.done?'checked':''}><span class="${s.done?'done':''}">${esc(s.title)}</span></label><button type="button" class="subtask-delete" data-delete-subtask-task="${esc(t.id)}" data-delete-subtask="${esc(s.id)}" aria-label="Delete subtask">×</button></div>`).join('')}</div>`:''}</article>`}).join('')||'<p class="empty">No matching tasks. Add a new task or change the filter.</p>'}</div></section></main>`;
}
function taskDialog(task=null){
return new Promise(resolve=>{
const wrap=document.createElement('div');wrap.className='dialog-backdrop';
const form=document.createElement('form');form.className='app-dialog task-dialog';
form.innerHTML=`<h2>${task?'Edit task':'Create a task'}</h2><label>Task title<input class="dialog-input" name="title" maxlength="300" required placeholder="What do you want to finish?"></label><label>Priority<select class="dialog-input" name="priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Due date (optional)<input class="dialog-input" type="date" name="dueDate"></label><div class="dialog-actions"><button type="button" class="secondary" data-cancel>Cancel</button><button type="submit" class="primary">${task?'Save changes':'Add task'}</button></div>`;
form.elements.title.value=task?.title||'';form.elements.priority.value=task?.priority||'medium';form.elements.dueDate.value=task?.dueDate||'';
wrap.append(form);document.body.append(wrap);form.elements.title.focus();
const close=value=>{wrap.remove();resolve(value)};
form.querySelector('[data-cancel]').onclick=()=>close(null);
wrap.addEventListener('click',e=>{if(e.target===wrap)close(null)});
form.addEventListener('submit',e=>{e.preventDefault();close({title:form.elements.title.value.trim(),priority:form.elements.priority.value,dueDate:form.elements.dueDate.value})});
});
}

function dashboardPage(){
const t=totals(),sessions=store.data.sessions,week=Analytics.weekly(sessions),goal=(store.data.settings.dailyGoalMinutes||120)*60;
const progress=Math.min(100,Math.round(t.today/goal*100)),streak=Analytics.streak(sessions,goal/60);
const subjects=Analytics.subjectRanking(sessions,store.data.subjects);
const report=ProductivityIntelligence.analyze(sessions,{dailyGoalMinutes:goal/60});
const max=Math.max(1,...week.map(x=>x.seconds));
const recent=[...sessions].sort((a,b)=>new Date(b.startedAt)-new Date(a.startedAt)).slice(0,8);
const days=Analytics.monthlyDays(sessions,new Date().getFullYear(),new Date().getMonth());
const offset=new Date(new Date().getFullYear(),new Date().getMonth(),1).getDay();
const rec=report.recommendations[0];
return `<main class="dashboard"><section class="welcome-row"><div><span class="eyebrow">YOUR PERSONAL FOCUS OVERVIEW</span><h1>Progress, <em>made visible.</em></h1><p>Every completed session adds up. Keep showing up.</p></div><div class="goal-ring" style="--progress:${progress}%"><div><strong>${progress}%</strong><small>DAILY GOAL</small></div></div></section>
<section class="metric-grid"><article class="metric"><span>FOCUS TODAY</span><strong>${duration(t.today)}</strong><small>${fmt(t.today)} recorded</small></article><article class="metric"><span>THIS WEEK</span><strong>${duration(t.week)}</strong><small>Last 7 days</small></article><article class="metric"><span>ALL-TIME FOCUS</span><strong>${duration(t.all)}</strong><small>${t.count} completed sessions</small></article><article class="metric"><span>CURRENT STREAK</span><strong>${streak} days</strong><small>Daily goal: ${goal/60} min</small></article></section>
<section class="dash-grid"><article class="panel week-panel"><div class="panel-head"><div><span class="eyebrow">CONSISTENCY</span><h2>Weekly focus</h2></div><span class="tag">LAST 7 DAYS</span></div><div class="week-chart">${week.map(d=>`<div class="bar-col"><span>${d.seconds?duration(d.seconds):''}</span><div class="bar-track"><i style="height:${Math.max(2,d.seconds/max*100)}%"></i></div><small>${d.label}</small></div>`).join('')}</div><div class="chart-foot"><span>${week.filter(d=>d.seconds>0).length} active days</span><span>${(t.week/3600).toFixed(1)} total hours</span></div></article>
<article class="panel goal-panel"><span class="eyebrow">DAILY TARGET</span><h2>Stay consistent.</h2><div class="goal-big">${fmt(t.today)} <small>/ ${fmt(goal)}</small></div><div class="progress-track"><i style="width:${progress}%"></i></div><p>${Math.max(0,goal-t.today)>0?duration(goal-t.today)+' left to reach your goal':'Daily goal completed. Great work!'}</p><label class="goal-setting">Daily goal <select id="dailyGoal"><option value="30" ${goal/60===30?'selected':''}>30 min</option><option value="60" ${goal/60===60?'selected':''}>1 hour</option><option value="90" ${goal/60===90?'selected':''}>90 min</option><option value="120" ${goal/60===120?'selected':''}>2 hours</option><option value="180" ${goal/60===180?'selected':''}>3 hours</option><option value="240" ${goal/60===240?'selected':''}>4 hours</option></select></label></article></section>
<section class="dash-grid"><article class="panel subject-panel"><div class="panel-head"><div><span class="eyebrow">TIME DISTRIBUTION</span><h2>Subject breakdown</h2></div><button class="text-btn" id="addSubjectDash">＋ Add subject</button></div>${subjects.length?subjects.slice(0,6).map(s=>`<div class="subject-row"><div><i style="background:${esc(s.color)}"></i><b>${esc(s.name)}</b><span>${s.share}%</span></div><div class="progress-track"><i style="width:${s.share}%;background:${esc(s.color)}"></i></div><small>${duration(s.seconds)}</small></div>`).join(''):'<p class="empty">Complete a session to see your subject stats.</p>'}</article>
<article class="panel insight-panel"><span class="eyebrow">PRODUCTIVITY INSIGHT</span><h2>${rec?esc(rec.reason):'Your focus profile'}</h2><p>${rec?esc(rec.action):'Complete more focus sessions to unlock insights based on your activity.'}</p><div class="insight-stats"><div><b>${report.dna.consistency}%</b><small>30-day consistency</small></div><div><b>${report.summary.averageSessionSeconds?duration(report.summary.averageSessionSeconds):'—'}</b><small>Average session</small></div></div></article></section>
<section class="panel dashboard-task-panel"><div class="panel-head"><div><span class="eyebrow">NEXT ACTIONS</span><h2>Task overview</h2></div><button class="text-btn" data-page="tasks">View all tasks →</button></div><div class="task-summary-inline"><span><b>${store.data.tasks.filter(x=>!x.done).length}</b> remaining</span><span><b>${store.data.tasks.filter(x=>x.done).length}</b> completed</span></div>${store.data.tasks.filter(x=>!x.done).slice(0,4).map(t=>`<label class="dashboard-task-row"><input type="checkbox" data-task-toggle="${esc(t.id)}"><span>${esc(t.title)}<small>${esc(t.dueDate||'No deadline')} · ${(t.priority||'medium').toUpperCase()}</small></span><b>${taskProgress(t)}%</b></label>`).join('')||'<p class="empty">No pending tasks. Add a task to plan your next step.</p>'}<button class="task-add-inline" id="addTaskDash">＋ Add a task</button></section>
<section class="panel calendar-panel"><div class="panel-head"><div><span class="eyebrow">MONTHLY ACTIVITY</span><h2>${new Date().toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2></div><span class="tag">${days.filter(d=>d.seconds>=goal).length} GOAL DAYS</span></div><div class="calendar-grid">${['S','M','T','W','T','F','S'].map(d=>`<span class="day-label">${d}</span>`).join('')}${Array.from({length:offset},()=>'<span></span>').join('')}${days.map(d=>`<span class="calendar-day ${d.seconds>=goal?'met':d.seconds?'partial':''}" title="${d.key}: ${fmt(d.seconds)}">${d.day}</span>`).join('')}</div></section>
<section class="panel history-panel"><div class="panel-head"><div><span class="eyebrow">RECENT SESSIONS</span><h2>Your focus history</h2></div><span class="tag">${t.count} TOTAL</span></div>${recent.length?recent.map(s=>`<div class="history-row"><span class="history-dot"></span><div><b>${esc(store.subjectName(s.subjectId))}</b><small>${new Date(s.startedAt).toLocaleString()}</small></div><strong>${fmt(s.duration)}</strong></div>`).join(''):'<p class="empty">No completed sessions yet. Your history will appear here.</p>'}</section>
<footer class="dashboard-footer"><span>Timer Dashboard · NATIONVK</span><button id="exportData">Export session CSV</button></footer></main>`;
}
function mountHeart(){heartUnmount();const root=$('#blueHeartScene');if(root)heartUnmount=mountBlueParticleHeart(root)}
function stopHeart(){heartUnmount();heartUnmount=()=>{}}
function render(){
stopHeart();
$('#app').innerHTML=nav()+(page==='timer'?timerPage():page==='subjects'?subjectsPage():page==='tasks'?tasksPage():dashboardPage());
if(page==='timer'){mountHeart();paintClock();if(tick)clearInterval(tick);tick=setInterval(paintClock,250)}
else if(tick){clearInterval(tick);tick=null}
bind();
}
function bind(){
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();page=b.dataset.page;render()}));
$('#subjectSelect')?.addEventListener('change',e=>selectedSubject=e.target.value);
$('#startTimer')?.addEventListener('click',()=>{try{timer.start(selectedSubject);render()}catch(e){toast(e.message)}});
$('#pauseTimer')?.addEventListener('click',()=>{try{timer.toggle();paintClock()}catch(e){toast(e.message)}});
$('#finishTimer')?.addEventListener('click',()=>{try{const n=timer.finish();toast('Session saved · '+fmt(n));render()}catch(e){toast(e.message)}});
$('#addSubject')?.addEventListener('click',addSubject);
$('#addSubjectDash')?.addEventListener('click',addSubject);
$('#addSubjectPage')?.addEventListener('click',addSubject);
$('#addTask')?.addEventListener('click',()=>openTaskEditor());
$('#addTaskDash')?.addEventListener('click',()=>openTaskEditor());
$('#taskSearch')?.addEventListener('input',e=>{taskSearch=e.target.value;const pos=e.target.selectionStart;render();const next=$('#taskSearch');next?.focus();next?.setSelectionRange(pos,pos)});
$('#taskFilter')?.addEventListener('change',e=>{taskFilter=e.target.value;render()});
document.querySelectorAll('[data-task-toggle]').forEach(el=>el.addEventListener('change',()=>{try{store.toggleTask(el.dataset.taskToggle,el.checked);render()}catch(e){toast(e.message)}}));
document.querySelectorAll('[data-add-subtask]').forEach(el=>el.addEventListener('click',()=>{const title=prompt('Subtask name');if(title?.trim()){try{store.addSubtask(el.dataset.addSubtask,title);render();toast('Subtask added')}catch(e){toast(e.message)}}}));
document.querySelectorAll('[data-subtask]').forEach(el=>el.addEventListener('change',()=>{try{store.toggleSubtask(el.dataset.subtaskTask,el.dataset.subtask,el.checked);render()}catch(e){toast(e.message)}}));
document.querySelectorAll('[data-delete-subtask]').forEach(el=>el.addEventListener('click',()=>{try{store.deleteSubtask(el.dataset.deleteSubtaskTask,el.dataset.deleteSubtask);render()}catch(e){toast(e.message)}}));
document.querySelectorAll('[data-edit-task]').forEach(el=>el.addEventListener('click',()=>openTaskEditor(el.dataset.editTask)));
document.querySelectorAll('[data-delete-task]').forEach(el=>el.addEventListener('click',()=>{if(confirm('Delete this task and its subtasks?')){store.deleteTask(el.dataset.deleteTask);render();toast('Task deleted')}}));
document.querySelectorAll('[data-edit-subject]').forEach(el=>el.addEventListener('click',()=>{const s=store.data.subjects.find(x=>x.id===el.dataset.editSubject);const name=prompt('Edit subject name',s?.name||'');if(name?.trim()){try{store.editSubject(s.id,name);render();toast('Subject updated')}catch(e){toast(e.message)}}}));
document.querySelectorAll('[data-delete-subject]').forEach(el=>el.addEventListener('click',()=>{if(confirm('Delete this subject? Existing focus sessions remain in history.')){store.deleteSubject(el.dataset.deleteSubject);if(selectedSubject===el.dataset.deleteSubject)selectedSubject=store.data.subjects[0]?.id||'';render();toast('Subject deleted')}}));
$('#dailyGoal')?.addEventListener('change',e=>{try{store.setDailyGoal(Number(e.target.value));render()}catch(err){toast(err.message)}});
$('#exportData')?.addEventListener('click',exportCsv);
}
async function openTaskEditor(id=null){const existing=id?store.data.tasks.find(t=>t.id===id):null;const value=await taskDialog(existing);if(!value)return;try{if(existing)store.updateTask(existing.id,value);else store.addTask(value.title,value.priority,value.dueDate);render();toast(existing?'Task updated':'Task added')}catch(e){toast(e.message)}}
function addSubject(){
const name=prompt('Subject name');if(!name?.trim())return;
try{store.addSubject(name);selectedSubject=store.data.subjects.at(-1).id;render();toast('Subject added')}catch(e){toast(e.message)}
}
function exportCsv(){
const rows=[['subject','started_at','ended_at','duration_seconds'],...store.data.sessions.map(s=>[store.subjectName(s.subjectId),s.startedAt,s.endedAt,s.duration])];
const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='timer-dashboard-sessions.csv';a.click();URL.revokeObjectURL(url);
}
window.addEventListener('beforeunload',()=>{stopHeart();if(tick)clearInterval(tick)});
render();
