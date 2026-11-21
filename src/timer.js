const ACTIVE='timer-dashboard-active-session';
export class FocusTimer {
  constructor(store,onChange=()=>{}) {
    this.store=store; this.onChange=onChange; this.active=false; this.paused=false;
    this.startedAt=0; this.segmentStartedAt=0; this.accumulated=0; this.subjectId=null; this.sessionId=null;
    this.restore();
  }
  restore(){
    try{
      const raw=localStorage.getItem(ACTIVE); if(!raw)return;
      const s=JSON.parse(raw);
      if(!s||typeof s.subjectId!=='string'||!Number.isFinite(s.startedAt)||!Number.isFinite(s.segmentStartedAt)||!Number.isFinite(s.accumulated)||typeof s.paused!=='boolean')throw new Error('Invalid timer snapshot');
      Object.assign(this,{subjectId:s.subjectId,startedAt:s.startedAt,segmentStartedAt:s.segmentStartedAt,accumulated:s.accumulated,paused:s.paused,sessionId:s.sessionId||null,active:true});
    }catch(e){try{localStorage.removeItem(ACTIVE)}catch{}}
  }
  persist(){
    const value=JSON.stringify({subjectId:this.subjectId,startedAt:this.startedAt,segmentStartedAt:this.segmentStartedAt,accumulated:this.accumulated,paused:this.paused,sessionId:this.sessionId});
    localStorage.setItem(ACTIVE,value); if(localStorage.getItem(ACTIVE)!==value)throw new Error('Timer state could not be saved.');
  }
  elapsed(){return this.accumulated+(this.active&&!this.paused?Math.max(0,Date.now()-this.segmentStartedAt)/1000:0)}
  start(subjectId){
    if(this.active)return false;if(!subjectId)throw new Error('প্রথমে একটি subject নির্বাচন করো।');
    this.subjectId=subjectId;this.startedAt=Date.now();this.segmentStartedAt=this.startedAt;this.accumulated=0;this.paused=false;
    this.sessionId=crypto.randomUUID?.()||('session-'+this.startedAt);this.active=true;
    try{this.persist()}catch(e){this.active=false;throw e}this.onChange();return true;
  }
  toggle(){
    if(!this.active)return false;
    const old={paused:this.paused,segmentStartedAt:this.segmentStartedAt,accumulated:this.accumulated};
    if(this.paused){this.segmentStartedAt=Date.now();this.paused=false}else{this.accumulated=this.elapsed();this.paused=true}
    try{this.persist()}catch(e){Object.assign(this,old);throw e}this.onChange();return true;
  }
  finish(){
    if(!this.active)return null;
    const duration=this.elapsed();
    const session=duration>=1?{id:this.sessionId||('session-'+this.startedAt),subjectId:this.subjectId,startedAt:new Date(this.startedAt).toISOString(),endedAt:new Date().toISOString(),duration:Math.floor(duration)}:null;
    const exists=session&&this.store.data.sessions.some(s=>s.id===session.id);
    if(session&&!exists)this.store.data.sessions.push(session);
    try{this.store.save();localStorage.removeItem(ACTIVE)}catch(e){if(session&&!exists)this.store.data.sessions=this.store.data.sessions.filter(s=>s.id!==session.id);throw e}
    this.active=false;this.paused=false;this.startedAt=0;this.segmentStartedAt=0;this.accumulated=0;this.subjectId=null;this.sessionId=null;this.onChange();return session?.duration??0;
  }
}