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
let page='timer',heartUnmount=()=>{},tick=null,selectedSubject=store.data.subjects[0]?.id||'';
const fmt=n=>{n=Math.max(0,Math.floor(n||0));return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,'0')).join(':')};
const duration=n=>{const h=Math.floor(n/3600),m=Math.floor(n%3600/60);return h? h+'h '+m+'m':m+'m'};
const totals=()=>{const sessions=store.data.sessions,now=new Date();return {today:Analytics.dailySeconds(sessions,now),week:Analytics.weekly(sessions).reduce((a,x)=>a+x.seconds,0),all:sessions.reduce((a,x)=>a+x.duration,0),count:sessions.length}};
function paintClock(){const el=$('#clock');if(el)el.textContent=fmt(timer.elapsed());const btn=$('#pauseTimer');if(btn)btn.textContent=timer.paused?'Resume':'Pause';$('#timerState')?.replaceChildren(document.createTextNode(!timer.active?'READY':timer.paused?'PAUSED':'FOCUSING'));}
function toast(msg){let e=$('#toast');if(!e){e=document.createElement('div');e.id='toast';document.body.append(e)}e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2300)}
function nav(){return `<header class="topbar"><a class="brand" href="#" data-page="timer"><span class="brand-mark">♥</span><span>TIMER<span class="brand-light">DASHBOARD</span><small>NATIONVK · FIND YOUR OWN PATH</small></span></a><nav><button data-page="timer" class="${page==='timer'?'active':''}">Timer</button><button data-page="dashboard" class="${page==='dashboard'?'active':''}">Dashboard</button></nav><span class="local-status"><i></i> LOCAL DATA</span></header>`;}
function subjectOptions(){return store.data.subjects.map(s=>`<option value="${esc(s.id)}" ${s.id===selectedSubject?'selected':''}>${esc(s.name)}</option>`).join('')}
function timerPage(){
return `<main class="timer-layout"><section class="timer-intro"><span class="eyebrow">FOCUS MODE · BLUE PARTICLE HEART</span><h1>Make time<br><em>mean something.</em></h1><p>One session at a time. Your focus history stays on this device.</p><div class="subject-picker"><label for="subjectSelect">FOCUS SUBJECT</label><select id="subjectSelect" ${timer.active?'disabled':''}>${subjectOptions()}</select><button class="icon-btn" id="addSubject" aria-label="Add subject">＋</button></div></section>
<section class="heart-stage" id="blueHeartScene"><canvas id="blueHeartCanvas" aria-label="Animated particle heart"></canvas><div class="heart-overlay"><span class="timer-state" id="timerState">READY</span><strong id="clock">${fmt(timer.elapsed())}</strong><small>${timer.active?esc(store.subjectName(timer.subjectId)):'YOUR FOCUS TIME'}</small></div><div class="timer-actions">${timer.active?`<button class="control secondary" id="pauseTimer">${timer.paused?'Resume':'Pause'}</button><button class="control finish" id="finishTimer">Finish session</button>`:`<button class="control start" id="startTimer">Start focus</button>`}</div></section>
<div class="timer-foot"><span><b>01</b> Breathe</span><span><b>02</b> Focus</span><span><b>03</b> Progress</span></div></main>`;
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
<section class="panel calendar-panel"><div class="panel-head"><div><span class="eyebrow">MONTHLY ACTIVITY</span><h2>${new Date().toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2></div><span class="tag">${days.filter(d=>d.seconds>=goal).length} GOAL DAYS</span></div><div class="calendar-grid">${['S','M','T','W','T','F','S'].map(d=>`<span class="day-label">${d}</span>`).join('')}${Array.from({length:offset},()=>'<span></span>').join('')}${days.map(d=>`<span class="calendar-day ${d.seconds>=goal?'met':d.seconds?'partial':''}" title="${d.key}: ${fmt(d.seconds)}">${d.day}</span>`).join('')}</div></section>
<section class="panel history-panel"><div class="panel-head"><div><span class="eyebrow">RECENT SESSIONS</span><h2>Your focus history</h2></div><span class="tag">${t.count} TOTAL</span></div>${recent.length?recent.map(s=>`<div class="history-row"><span class="history-dot"></span><div><b>${esc(store.subjectName(s.subjectId))}</b><small>${new Date(s.startedAt).toLocaleString()}</small></div><strong>${fmt(s.duration)}</strong></div>`).join(''):'<p class="empty">No completed sessions yet. Your history will appear here.</p>'}</section>
<footer class="dashboard-footer"><span>Timer Dashboard · NATIONVK</span><button id="exportData">Export session CSV</button></footer></main>`;
}
function mountHeart(){heartUnmount();const root=$('#blueHeartScene');if(root)heartUnmount=mountBlueParticleHeart(root)}
function stopHeart(){heartUnmount();heartUnmount=()=>{}}
function render(){
stopHeart();
$('#app').innerHTML=nav()+(page==='timer'?timerPage():dashboardPage());
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
$('#dailyGoal')?.addEventListener('change',e=>{try{store.setDailyGoal(Number(e.target.value));render()}catch(err){toast(err.message)}});
$('#exportData')?.addEventListener('click',exportCsv);
}
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
