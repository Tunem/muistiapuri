"use client";
import { useState, useEffect, CSSProperties } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Tab = "paiva" | "kalenteri" | "tavoitteet";

interface Task   { id: string; text: string; done: boolean; priority: "korkea"|"normaali"|"matala"; date: string; }
interface CalEvent { id: string; title: string; date: string; time: string; color: "pine"|"clay"|"slate"|"gold"; }
interface Goal   { id: string; title: string; description: string; target: number; current: number; unit: string; color: "pine"|"clay"|"gold"; created_at: string; }

function today() { return new Date().toISOString().slice(0, 10); }
const fi = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("fi-FI", { day: "numeric", month: "short" });
const MONTH_FI = ["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kesäkuu","Heinäkuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"];
const WEEK_FI = ["Ma","Ti","Ke","To","Pe","La","Su"];
const inp: CSSProperties = { border:"1px solid var(--border)", borderRadius:8, padding:"10px 12px", fontSize:13, background:"var(--bg)", outline:"none", color:"var(--text)", fontFamily:"inherit" };

/* ── DayView ─────────────────────────────────────────── */
function DayView({ user }: { user: User }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [prio, setPrio] = useState<Task["priority"]>("normaali");
  const [showDone, setShowDone] = useState(false);
  const td = today();

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .or(`date.eq.${td},done.eq.false`)
        .eq("user_id", user.id)
        .order("created_at");
      if (!error && data) setTasks(data as Task[]);
    }
   fetchTasks();
}, [user.id]);

  const pending = tasks.filter(t => !t.done);
  const done    = tasks.filter(t => t.done);
  const h = new Date().getHours();
  const greeting = h < 12 ? "Hyvää huomenta" : h < 18 ? "Hyvää päivää" : "Hyvää iltaa";

  async function add() {
    if (!input.trim()) return;
    const { data, error } = await supabase.from("tasks").insert({ text: input.trim(), done: false, priority: prio, date: td, user_id: user.id }).select().single();
    if (!error && data) { setTasks(ts => [...ts, data as Task]); setInput(""); }
  }

  async function toggle(id: string) {
    const t = tasks.find(x => x.id === id)!;
    await supabase.from("tasks").update({ done: !t.done }).eq("id", id);
    setTasks(ts => ts.map(x => x.id === id ? { ...x, done: !x.done } : x));
  }

  async function remove(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(ts => ts.filter(x => x.id !== id));
  }

  const prioBg:    Record<Task["priority"],string> = { korkea:"var(--clay-light)",  normaali:"var(--slate-light)", matala:"var(--gold-light)" };
  const prioColor: Record<Task["priority"],string> = { korkea:"var(--clay)",        normaali:"var(--slate)",       matala:"var(--gold)" };

  return (
    <div style={{ maxWidth:560, margin:"0 auto" }}>
      <div style={{ marginBottom:32 }}>
        <p style={{ color:"var(--muted)", fontSize:13, marginBottom:4 }}>{new Date().toLocaleDateString("fi-FI", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
        <h1 className="serif" style={{ fontSize:32, fontWeight:400 }}>{greeting} 👋</h1>
        {pending.length > 0 && <p style={{ color:"var(--muted)", fontSize:13, marginTop:8 }}>Sinulla on <strong style={{ color:"var(--pine)" }}>{pending.length}</strong> tehtävää tänään</p>}
      </div>

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:20, marginBottom:24 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:12 }}>Lisää tehtävä</p>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Mitä pitää tehdä?" style={{ ...inp, flex:1 }}/>
          <button onClick={add} style={{ padding:"10px 18px", background:"var(--pine)", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700 }}>+ Lisää</button>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {(["matala","normaali","korkea"] as Task["priority"][]).map(p=>(
            <button key={p} onClick={()=>setPrio(p)} style={{ padding:"4px 12px", borderRadius:20, border:`1px solid ${prio===p?"transparent":"var(--border)"}`, background:prio===p?prioBg[p]:"transparent", color:prio===p?prioColor[p]:"var(--muted)", cursor:"pointer", fontSize:11, fontWeight:prio===p?700:300 }}>{p}</button>
          ))}
        </div>
      </div>

      {pending.length===0&&done.length===0&&(
        <div style={{ textAlign:"center", padding:"40px 0", color:"var(--muted)" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🌿</div>
          <p style={{ fontSize:14 }}>Ei tehtäviä tänään. Nauti päivästä!</p>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {pending.map(t=>(
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"14px 16px" }}>
            <button onClick={()=>toggle(t.id)} style={{ width:20, height:20, border:"2px solid var(--border2)", borderRadius:"50%", background:"transparent", cursor:"pointer", flexShrink:0 }}/>
            <span style={{ flex:1, fontSize:14 }}>{t.text}</span>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:prioBg[t.priority], color:prioColor[t.priority], padding:"2px 8px", borderRadius:20 }}>{t.priority}</span>
            <button onClick={()=>remove(t.id)} style={{ background:"none", border:"none", color:"var(--faint)", cursor:"pointer", fontSize:18 }}>×</button>
          </div>
        ))}
      </div>

      {done.length>0&&<>
        <button onClick={()=>setShowDone(s=>!s)} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:12, marginTop:16, padding:"4px 0" }}>
          {showDone?"▾":"▸"} Tehdyt ({done.length})
        </button>
        {showDone&&(
          <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:8 }}>
            {done.map(t=>(
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 16px", opacity:0.6 }}>
                <button onClick={()=>toggle(t.id)} style={{ width:20, height:20, border:"2px solid var(--pine)", borderRadius:"50%", background:"var(--pine)", cursor:"pointer", flexShrink:0, color:"#fff", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>✓</button>
                <span style={{ flex:1, fontSize:13, textDecoration:"line-through", color:"var(--muted)" }}>{t.text}</span>
                <button onClick={()=>remove(t.id)} style={{ background:"none", border:"none", color:"var(--faint)", cursor:"pointer", fontSize:16 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </>}
    </div>
  );
}

/* ── CalendarView ─────────────────────────────────────── */
function CalendarView({ user }: { user: User }) {
  const supabase = createClient();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [year, setYear]     = useState(new Date().getFullYear());
  const [month, setMonth]   = useState(new Date().getMonth());
  const [selected, setSelected] = useState(today());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", time:"09:00", color:"pine" as CalEvent["color"] });
  const [loading, setLoading] = useState(false);
  const td = today();

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const pfx = `${year}-${String(month+1).padStart(2,"0")}`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", `${pfx}-01`)
        .lte("date", `${pfx}-${String(lastDay).padStart(2,"0")}`)
        .order("time");
      if (!error && data) setEvents(data as CalEvent[]);
      setLoading(false);
    }
    fetchEvents();
  }, [year, month, user.id]);

  const firstDay  = new Date(year, month, 1);
  const startDow  = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number|null)[] = [...Array(startDow).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];

  function ds(d: number) { return `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
  function prev() { month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1); }
  function next() { month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1); }

  async function addEvent() {
    if (!form.title.trim()) return;
    const { data, error } = await supabase
    .from("events")
    .insert({ title:form.title.trim(), date:selected, time:form.time, color:form.color, user_id:user.id })
    .select()
    .single();
    if (!error && data) { setEvents(es=>[...es, data as CalEvent]); setForm({title:"",time:"09:00",color:"pine"}); setShowForm(false); }
  }

  const selEvents = events.filter(e=>e.date===selected).sort((a,b)=>a.time.localeCompare(b.time));
  const hasDot    = new Set(events.map(e=>e.date));
  const dot: Record<string,string> = { pine:"var(--pine)", clay:"var(--clay)", slate:"var(--slate)", gold:"var(--gold)" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 290px", gap:24, maxWidth:820, margin:"0 auto" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <button onClick={prev} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, width:36, height:36, cursor:"pointer", fontSize:16, color:"var(--muted)" }}>‹</button>
          <h2 className="serif" style={{ fontSize:22, fontWeight:400 }}>{MONTH_FI[month]} {year}</h2>
          <button onClick={next} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, width:36, height:36, cursor:"pointer", fontSize:16, color:"var(--muted)" }}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:8 }}>
          {WEEK_FI.map(d=><div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"var(--muted)", padding:"4px 0" }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {cells.map((d,i)=>{
            if(!d) return <div key={`e${i}`}/>;
            const date=ds(d); const isTd=date===td; const isSel=date===selected;
            return (
              <button key={date} onClick={()=>setSelected(date)} style={{ aspectRatio:"1", borderRadius:8, border:"none", cursor:"pointer", background:isSel?"var(--pine)":isTd?"var(--pine-light)":"transparent", color:isSel?"#fff":isTd?"var(--pine)":"var(--text)", fontSize:13, fontWeight:(isSel||isTd)?700:300, position:"relative", transition:"all 0.15s" }}>
                {d}
                {hasDot.has(date)&&<span style={{ position:"absolute", bottom:3, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:isSel?"rgba(255,255,255,0.7)":"var(--pine)" }}/>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <p style={{ fontSize:11, color:"var(--muted)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>{fi(selected)}</p>
              {selected===td&&<p style={{ fontSize:10, color:"var(--pine)" }}>Tänään</p>}
            </div>
            <button onClick={()=>setShowForm(s=>!s)} style={{ background:"var(--pine)", color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>+</button>
          </div>
          {showForm&&(
            <div style={{ marginBottom:16, padding:14, background:"var(--bg)", borderRadius:10, border:"1px solid var(--border)" }}>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addEvent()} placeholder="Tapahtuma…" style={{ ...inp, width:"100%", marginBottom:8 }}/>
              <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={{ ...inp, width:"100%", marginBottom:8 }}/>
              <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                {(["pine","clay","slate","gold"] as CalEvent["color"][]).map(c=>(
                  <button key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${form.color===c?"var(--text)":"transparent"}`, background:dot[c], cursor:"pointer" }}/>
                ))}
              </div>
              <button onClick={addEvent} style={{ width:"100%", padding:"8px", background:"var(--pine)", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700 }}>Tallenna</button>
            </div>
          )}
          {loading && <p style={{ color:"var(--muted)", fontSize:12, textAlign:"center", padding:"8px 0" }}>Ladataan…</p>}
          {selEvents.length===0
            ? <p style={{ color:"var(--muted)", fontSize:12, textAlign:"center", padding:"16px 0" }}>Ei tapahtumia</p>
            : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {selEvents.map(ev=>(
                  <div key={ev.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", borderRadius:8, borderLeft:`3px solid ${dot[ev.color]}`, background:"var(--bg)" }}>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13 }}>{ev.title}</p>
                      <p style={{ fontSize:11, color:"var(--muted)" }}>🕐 {ev.time}</p>
                    </div>
                    <button onClick={async()=>{ await supabase.from("events").delete().eq("id",ev.id); setEvents(es=>es.filter(e=>e.id!==ev.id)); }} style={{ background:"none", border:"none", color:"var(--faint)", cursor:"pointer", fontSize:16 }}>×</button>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}

/* ── GoalsView ─────────────────────────────────────────── */
function GoalsView({ user }: { user: User }) {
  const supabase = createClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", description:"", target:"", unit:"", color:"pine" as Goal["color"] });

  useEffect(() => {
    supabase.from("goals").select("*").order("created_at").then(({ data }) => { if (data) setGoals(data as Goal[]); });
  }, []);

  async function addGoal() {
    const target = parseInt(form.target);
    if (!form.title.trim()||!target) return;
    const { data, error } = await supabase.from("goals").insert({ title:form.title.trim(), description:form.description.trim(), target, current:0, unit:form.unit.trim()||"yksikköä", color:form.color, user_id:user.id }).select().single();
    if (!error && data) { setGoals(gs=>[...gs, data as Goal]); setForm({title:"",description:"",target:"",unit:"",color:"pine"}); setShowForm(false); }
  }

  async function adjust(id: string, delta: number) {
    const g = goals.find(x=>x.id===id)!;
    const next = Math.max(0, Math.min(g.target, g.current+delta));
    await supabase.from("goals").update({ current: next }).eq("id", id);
    setGoals(gs=>gs.map(x=>x.id===id?{...x,current:next}:x));
  }

  async function removeGoal(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    setGoals(gs=>gs.filter(x=>x.id!==id));
  }

  const cm: Record<Goal["color"],{main:string,light:string}> = {
    pine:{main:"var(--pine)",light:"var(--pine-light)"},
    clay:{main:"var(--clay)",light:"var(--clay-light)"},
    gold:{main:"var(--gold)",light:"var(--gold-light)"},
  };

  const active    = goals.filter(g=>g.current<g.target);
  const completed = goals.filter(g=>g.current>=g.target);

  return (
    <div style={{ maxWidth:660, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h1 className="serif" style={{ fontSize:28, fontWeight:400 }}>Tavoitteet</h1>
          {goals.length>0&&<p style={{ color:"var(--muted)", fontSize:13, marginTop:4 }}>{completed.length}/{goals.length} saavutettu</p>}
        </div>
        <button onClick={()=>setShowForm(s=>!s)} style={{ padding:"10px 20px", background:"var(--pine)", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700 }}>+ Uusi tavoite</button>
      </div>

      {showForm&&(
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:24, marginBottom:24 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:16 }}>Uusi tavoite</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Tavoitteen nimi *" style={inp}/>
            <input value={form.unit}  onChange={e=>setForm(f=>({...f,unit:e.target.value}))}  placeholder="Yksikkö (km, kirjaa…)" style={inp}/>
          </div>
          <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Kuvaus (valinnainen)" style={{ ...inp, width:"100%", marginBottom:10 }}/>
          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16 }}>
            <input type="number" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))} placeholder="Tavoitemäärä *" style={{ ...inp, flex:1 }} min={1}/>
            <div style={{ display:"flex", gap:8 }}>
              {(["pine","clay","gold"] as Goal["color"][]).map(c=>(
                <button key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{ width:26, height:26, borderRadius:"50%", border:`2px solid ${form.color===c?"var(--text)":"transparent"}`, background:cm[c].main, cursor:"pointer" }}/>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={addGoal} style={{ flex:1, padding:"10px", background:"var(--pine)", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700 }}>Tallenna tavoite</button>
            <button onClick={()=>setShowForm(false)} style={{ padding:"10px 16px", background:"transparent", color:"var(--muted)", border:"1px solid var(--border)", borderRadius:8, cursor:"pointer", fontSize:13 }}>Peruuta</button>
          </div>
        </div>
      )}

      {goals.length===0&&(
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🎯</div>
          <p className="serif" style={{ fontSize:15, marginBottom:6 }}>Aseta ensimmäinen tavoitteesi</p>
          <p style={{ fontSize:13 }}>Seuraa edistymistäsi askel askeleelta</p>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
        {active.map(g=>{
          const pct=Math.round((g.current/g.target)*100);
          const c=cm[g.color];
          return (
            <div key={g.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <h3 className="serif" style={{ fontSize:16, fontWeight:400, marginBottom:2 }}>{g.title}</h3>
                  {g.description&&<p style={{ fontSize:12, color:"var(--muted)" }}>{g.description}</p>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:13, color:"var(--muted)" }}>{g.current}/{g.target} {g.unit}</span>
                  <button onClick={()=>removeGoal(g.id)} style={{ background:"none", border:"none", color:"var(--faint)", cursor:"pointer", fontSize:16 }}>×</button>
                </div>
              </div>
              <div style={{ height:6, background:"var(--bg2)", borderRadius:3, marginBottom:14, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:c.main, borderRadius:3, transition:"width 0.4s ease" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"var(--muted)" }}>{pct}% valmis</span>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>adjust(g.id,-1)} style={{ width:32,height:32,border:"1px solid var(--border)",borderRadius:8,background:"var(--bg)",cursor:"pointer",fontSize:16,color:"var(--muted)" }}>−</button>
                  <button onClick={()=>adjust(g.id,1)}  style={{ width:32,height:32,border:"none",borderRadius:8,background:c.main,cursor:"pointer",fontSize:16,color:"#fff" }}>+</button>
                  <button onClick={()=>adjust(g.id,5)}  style={{ padding:"0 12px",height:32,border:"none",borderRadius:8,background:c.light,cursor:"pointer",fontSize:11,fontWeight:700,color:c.main }}>+5</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {completed.length>0&&(
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:12 }}>Saavutettu 🎉</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {completed.map(g=>(
              <div key={g.id} style={{ background:"var(--pine-light)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:18 }}>✓</span>
                <div style={{ flex:1 }}>
                  <p className="serif" style={{ fontSize:14, color:"var(--pine)" }}>{g.title}</p>
                  <p style={{ fontSize:11, color:"var(--pine)", opacity:0.7 }}>{g.target} {g.unit} saavutettu</p>
                </div>
                <button onClick={()=>removeGoal(g.id)} style={{ background:"none", border:"none", color:"var(--faint)", cursor:"pointer", fontSize:16 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── App Shell ─────────────────────────────────────────── */
export default function App() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("paiva");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) window.location.href = "/login";
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) window.location.href = "/login";
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <p className="serif" style={{ color:"var(--muted)", fontSize:18 }}>Ladataan…</p>
    </div>
  );

  if (!user) return null;

  const tabs: {id:Tab;label:string}[] = [{id:"paiva",label:"Päivä"},{id:"kalenteri",label:"Kalenteri"},{id:"tavoitteet",label:"Tavoitteet"}];

  return (
    <div style={{ minHeight:"100vh" }}>
      <header style={{ borderBottom:"1px solid var(--border)", background:"rgba(245,242,237,0.92)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:10, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", height:60 }}>
        <span className="serif" style={{ fontSize:20, letterSpacing:"-0.3px" }}>Muistiapuri</span>
        <nav style={{ display:"flex", gap:2 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"7px 18px", borderRadius:8, border:"none", background:tab===t.id?"var(--pine)":"transparent", color:tab===t.id?"#fff":"var(--muted)", cursor:"pointer", fontSize:13, fontWeight:tab===t.id?700:300, transition:"all 0.18s" }}>{t.label}</button>
          ))}
        </nav>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:12, color:"var(--muted)" }}>{user.email}</span>
          <button onClick={signOut} style={{ background:"none", border:"1px solid var(--border)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12, color:"var(--muted)", fontFamily:"inherit" }}>Kirjaudu ulos</button>
        </div>
      </header>
      <div style={{ height:2, background:"linear-gradient(90deg, var(--pine) 0%, var(--gold) 60%, transparent 100%)" }}/>
      <main style={{ padding:"36px 40px" }}>
        {tab==="paiva"      && <DayView      user={user}/>}
        {tab==="kalenteri"  && <CalendarView user={user}/>}
        {tab==="tavoitteet" && <GoalsView    user={user}/>}
      </main>
    </div>
  );
}
