"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, loadDashboard, saveDashboard, loadChangelog, addChangelogEntry, DEFAULT_DATA } from "../lib/supabase";

const SEV = {
  fatal: { bg:"#fef2f2",border:"#dc2626",text:"#991b1b",dot:"#dc2626" },
  high: { bg:"#fff7ed",border:"#ea580c",text:"#9a3412",dot:"#ea580c" },
  medium: { bg:"#fefce8",border:"#ca8a04",text:"#854d0e",dot:"#ca8a04" },
};
const STS=["等待中 / Awaiting","待核实 / To Verify","待准备 / To Prepare","待深化 / To Deepen","未启动 / Not Started","待更新 / Pending Update","待申请 / To Apply","待发送 / To Send","进行中 / In Progress","已完成 / Completed","已阻塞 / Blocked"];
const PS=["进行中 / In Progress","开发中 / In Development","已建成 / Completed","暂停 / On Hold"];
const RC=["技术 / Technical","融资 / Financing","政策 / Policy","物流 / Logistics","合规 / Compliance"];

let _c=Date.now(); const uid=()=>`id_${_c++}`;

export default function Page() {
  const [data,setData]=useState(null);
  const [logs,setLogs]=useState([]);
  const [user,setUser]=useState("");
  const [loginId,setLoginId]=useState("");
  const [loginPw,setLoginPw]=useState("");
  const [loginErr,setLoginErr]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [tab,setTab]=useState("overview");
  const [eKey,setEKey]=useState(null);
  const [eVal,setEVal]=useState("");
  const [toast,setToast]=useState(null);
  const [mob,setMob]=useState(false);
  const stRef=useRef(null);

  useEffect(()=>{
    const check=()=>setMob(window.innerWidth<768);
    check(); window.addEventListener("resize",check);
    return()=>window.removeEventListener("resize",check);
  },[]);

  useEffect(()=>{
    (async()=>{
      try {
        const [dash,cl]=await Promise.all([loadDashboard(),loadChangelog()]);
        setData(dash.data||DEFAULT_DATA);
        setLogs(cl||[]);
        const saved=typeof window!=="undefined"?localStorage.getItem("namalundu-user"):"";
        if(saved)setUser(saved);
      } catch{ setData(DEFAULT_DATA); }
      setLoading(false);
    })();
  },[]);

  const flash=(m)=>{setToast(m);setTimeout(()=>setToast(null),2000)};

  const addLog=useCallback(async(action)=>{
    const u=user||"?";
    await addChangelogEntry(u,action);
    setLogs(prev=>[{username:u,action,created_at:new Date().toISOString(),id:Date.now()},...prev].slice(0,200));
  },[user]);

  const save=useCallback(async(nd)=>{
    setData(nd);
    if(stRef.current)clearTimeout(stRef.current);
    stRef.current=setTimeout(async()=>{
      setSaving(true);
      const ok=await saveDashboard(nd);
      flash(ok?"已保存 Saved ✓":"保存失败 Failed ✗");
      setSaving(false);
    },800);
  },[]);

  const up=useCallback((fn,msg)=>{
    setData(prev=>{const d=JSON.parse(JSON.stringify(prev));fn(d);save(d);return d});
    if(msg)addLog(msg);
  },[save,addLog]);

  const doLogin=async()=>{
    setLoginErr("");
    const id=loginId.trim(); const pw=loginPw.trim();
    if(!id||!pw){setLoginErr("请输入账号和密码 / Enter ID and password");return;}
    try{
      const {data:row,error}=await supabase.from("dashboard_users").select("display_name").eq("user_id",id).eq("password",pw).single();
      if(error||!row){setLoginErr("账号或密码错误 / Invalid ID or password");return;}
      setUser(row.display_name);
      if(typeof window!=="undefined")localStorage.setItem("namalundu-user",row.display_name);
    }catch{setLoginErr("登录失败 / Login failed");}
  };
  const logout=()=>{setUser("");if(typeof window!=="undefined")localStorage.removeItem("namalundu-user")};

  const startE=(k,v)=>{setEKey(k);setEVal(v)};

  // Ops
  const addB=(lk,lb)=>up(d=>{d[lk].push({id:uid(),title:"新卡点 / New blocker",status:STS[0],severity:"medium",reason:""})},`新增${lb} / Added ${lb} blocker`);
  const rmB=(lk,id,t)=>up(d=>{d[lk]=d[lk].filter(b=>b.id!==id)},`删除 / Removed: ${t.slice(0,25)}`);
  const sBF=(lk,id,f,v,msg)=>up(d=>{const b=d[lk].find(x=>x.id===id);if(b)b[f]=v},msg);
  const togA=(lk,i)=>{const it=data[lk][i];const w=!it.done;up(d=>{d[lk][i].done=w},`${w?"✓ Done":"✗ Undone"}: ${it.text.slice(0,25)}`)};
  const addA=(lk,lb)=>up(d=>{d[lk].push({id:uid(),text:"新行动项 / New action item",done:false})},`新增 / Added ${lb} action`);
  const rmA=(lk,i)=>{const t=data[lk][i]?.text;up(d=>{d[lk].splice(i,1)},`删除 / Removed: ${(t||"").slice(0,25)}`)};
  const upProg=(i,v)=>{const p=data.timeline[i]?.phase||"";up(d=>{d.timeline[i].progress=Math.min(100,Math.max(0,v))},`进度 Progress: ${p.slice(0,15)} → ${v}%`)};
  const addTL=()=>up(d=>{d.timeline.push({id:uid(),phase:"新阶段 / New phase",duration:"— / —",prereq:"— / —",output:"— / —",progress:0})},"新增阶段 / Added timeline phase");
  const rmTL=(i)=>{const p=data.timeline[i]?.phase;up(d=>{d.timeline.splice(i,1)},`删除阶段 / Removed phase: ${(p||"").slice(0,15)}`)};
  const addR=()=>up(d=>{d.risks.push({id:uid(),category:RC[0],risk:"新风险 / New risk",mitigation:""})},"新增风险 / Added risk");
  const rmR=(i)=>{const r=data.risks[i]?.risk;up(d=>{d.risks.splice(i,1)},`删除风险 / Removed risk: ${(r||"").slice(0,15)}`)};
  const setPSt=(i,v)=>up(d=>{d.projects[i].status=v},`状态 Status: ${data.projects[i]?.name.slice(0,12)} → ${v}`);
  const addP=()=>up(d=>{d.techParams.push({id:uid(),label:"新参数 / New param",value:"—",note:""})},"新增参数 / Added parameter");
  const rmP=(i)=>up(d=>{d.techParams.splice(i,1)},"删除参数 / Removed parameter");

  // Responsive helpers
  const px = mob ? "14px" : "22px";
  const fs = (d,m) => mob ? m : d;

  // Components
  const EC=({value,ck,onC,style:s})=>{
    if(eKey===ck)return<input autoFocus value={eVal} onChange={e=>setEVal(e.target.value)} onBlur={()=>{onC(eVal);setEKey(null)}} onKeyDown={e=>{if(e.key==="Enter"){onC(eVal);setEKey(null)}}} style={{background:"rgba(255,255,255,0.95)",border:"1.5px solid #6366f1",borderRadius:4,padding:mob?"6px 8px":"2px 6px",fontSize:mob?15:13,width:"100%",outline:"none",color:"#1e293b",...s}}/>;
    return<span onClick={()=>startE(ck,value)} title="点击编辑 / Click to edit" style={{cursor:"text",borderBottom:"1px dashed rgba(255,255,255,0.15)",paddingBottom:1,...s}}>{value||<i style={{color:"#64748b"}}>点击输入… / Click to enter…</i>}</span>;
  };
  const Add=({onClick,label})=><button onClick={onClick} style={{background:"rgba(99,102,241,0.1)",border:"1px dashed rgba(99,102,241,0.3)",borderRadius:8,padding:mob?"10px 14px":"7px 14px",color:"#818cf8",cursor:"pointer",fontSize:mob?13:11,fontWeight:600,width:"100%",marginTop:7,fontFamily:"inherit"}}>+ {label}</button>;
  const Del=({onClick})=><button onClick={e=>{e.stopPropagation();onClick()}} title="删除 / Delete" style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:mob?16:13,padding:mob?"4px 6px":"0 3px",opacity:.5}} onMouseOver={e=>{e.currentTarget.style.opacity=1;e.currentTarget.style.color="#ef4444"}} onMouseOut={e=>{e.currentTarget.style.opacity=.5;e.currentTarget.style.color="#94a3b8"}}>✕</button>;

  const BCard=({item,lk})=>{const sv=SEV[item.severity];return<div style={{background:sv.bg,border:`1px solid ${sv.border}22`,borderLeft:`4px solid ${sv.border}`,borderRadius:10,padding:mob?"12px 12px":"11px 13px",marginBottom:mob?10:7}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:6}}>
      <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:sv.dot,flexShrink:0}}/>
        <span style={{fontWeight:700,color:sv.text,fontSize:mob?14:13,wordBreak:"break-word"}}><EC value={item.title} ck={`${item.id}-t`} onC={v=>sBF(lk,item.id,"title",v,`编辑 Edited: ${v.slice(0,20)}`)}/></span>
      </div>
      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
        <select value={item.severity} onChange={e=>sBF(lk,item.id,"severity",e.target.value,`优先级 Severity: ${item.title.slice(0,12)} → ${e.target.value}`)} style={{fontSize:mob?13:10,padding:mob?"4px 6px":"2px 3px",borderRadius:4,border:`1px solid ${sv.border}44`,background:"white",cursor:"pointer"}}><option value="fatal">致命 / Fatal</option><option value="high">高 / High</option><option value="medium">中 / Medium</option></select>
        <select value={item.status} onChange={e=>sBF(lk,item.id,"status",e.target.value,`状态 Status: ${item.title.slice(0,12)} → ${e.target.value.split("/")[0].trim()}`)} style={{fontSize:mob?13:10,padding:mob?"4px 6px":"2px 3px",borderRadius:4,border:`1px solid ${sv.border}44`,background:"white",cursor:"pointer"}}>{STS.map(o=><option key={o} value={o}>{o}</option>)}</select>
        <Del onClick={()=>rmB(lk,item.id,item.title)}/>
      </div>
    </div>
    <div style={{color:sv.text,fontSize:mob?13:12,opacity:.85,paddingLeft:13}}><EC value={item.reason} ck={`${item.id}-r`} onC={v=>sBF(lk,item.id,"reason",v,`原因 Reason: ${item.title.slice(0,12)}`)}/></div>
  </div>};

  // Loading
  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0f172a",color:"#818cf8",fontFamily:"Inter,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:12,animation:"pulse 1.5s infinite"}}>◈</div>加载中 Loading...<style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style></div></div>;

  // Login
  if(!user)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#0f172a,#1e293b,#0f172a)",fontFamily:"Inter,'Noto Sans SC',sans-serif",padding:16}}>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700;900&family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
    <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:"36px 28px",textAlign:"center",maxWidth:360,width:"100%"}}>
      <div style={{fontSize:36,marginBottom:6}}>◈</div>
      <h2 style={{color:"#f8fafc",fontSize:17,fontWeight:800,marginBottom:3}}>Namalundu Dashboard</h2>
      <p style={{color:"#94a3b8",fontSize:12,marginBottom:20}}>请登录 / Please log in</p>
      <input value={loginId} onChange={e=>{setLoginId(e.target.value);setLoginErr("")}} placeholder="账号 / User ID" style={{width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.06)",color:"#f8fafc",fontSize:16,outline:"none",textAlign:"center",marginBottom:10,fontFamily:"inherit",boxSizing:"border-box"}}/>
      <input value={loginPw} onChange={e=>{setLoginPw(e.target.value);setLoginErr("")}} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="密码 / Password" type="password" style={{width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.06)",color:"#f8fafc",fontSize:16,outline:"none",textAlign:"center",marginBottom:10,fontFamily:"inherit",boxSizing:"border-box"}}/>
      {loginErr&&<div style={{color:"#f87171",fontSize:12,marginBottom:8}}>{loginErr}</div>}
      <button onClick={doLogin} style={{width:"100%",padding:"11px",borderRadius:8,border:"none",background:"#6366f1",color:"white",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>登录 / Log In</button>
    </div>
  </div>;

  if(!data)return null;

  const tabs=[
    {id:"overview",label:"总览 Overview",icon:"◈"},
    {id:"blockers",label:"卡点 Blockers",icon:"⬥"},
    {id:"timeline",label:"时间线 Timeline",icon:"◆"},
    {id:"actions",label:"行动项 Actions",icon:"▸"},
    {id:"risks",label:"风险 Risks",icon:"△"},
    {id:"changelog",label:"变更记录 Log",icon:"◷"},
    {id:"help",label:"帮助 Help",icon:"?"},
  ];
  const allB=[...data.techBlockers,...data.bizBlockers,...data.permitBlockers];
  const fc=allB.filter(b=>b.severity==="fatal").length;
  const hc=allB.filter(b=>b.severity==="high").length;
  const ca=[...data.p0Actions,...data.p1Actions].filter(a=>a.done).length;
  const ta=data.p0Actions.length+data.p1Actions.length;
  const scFn=(st)=>{if(st.includes("已建成")||st.includes("Completed"))return{bg:"rgba(34,197,94,0.15)",fg:"#4ade80"};if(st.includes("进行中")||st.includes("In Progress"))return{bg:"rgba(99,102,241,0.15)",fg:"#a5b4fc"};if(st.includes("暂停"))return{bg:"rgba(239,68,68,0.15)",fg:"#f87171"};return{bg:"rgba(245,158,11,0.15)",fg:"#fbbf24"}};

  const uCols={};const pal=["#818cf8","#f59e0b","#22c55e","#f87171","#38bdf8","#a78bfa","#fb923c","#34d399"];let ci=0;
  const ucFn=(n)=>{if(!uCols[n]){uCols[n]=pal[ci%pal.length];ci++}return uCols[n]};
  const fmtTime=(iso)=>{try{return new Date(iso).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}catch{return iso}};

  return<div style={{fontFamily:"Inter,'Noto Sans SC',sans-serif",background:"linear-gradient(160deg,#0f172a,#1e293b,#0f172a)",minHeight:"100vh",color:"#e2e8f0"}}>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
    {toast&&<div style={{position:"fixed",top:14,right:14,left:mob?14:"auto",background:toast.includes("✗")?"#ef4444":"#22c55e",color:"white",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,zIndex:999,boxShadow:"0 4px 12px rgba(0,0,0,0.3)",textAlign:"center"}}>{toast}</div>}

    {/* Header */}
    <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(234,179,8,0.08))",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:mob?"16px 14px 12px":"20px 22px 14px"}}>
      <div style={{display:"flex",flexDirection:mob?"column":"row",justifyContent:"space-between",alignItems:mob?"stretch":"flex-start",gap:mob?10:12}}>
        <div>
          <div style={{fontSize:mob?9:10,letterSpacing:3,color:"#818cf8",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Zambia · Southern Province</div>
          <h1 style={{fontSize:mob?18:21,fontWeight:900,margin:0,color:"#f8fafc"}}>Namalundu 光伏项目 / Solar Project</h1>
          <div style={{fontSize:11,color:"#94a3b8",marginTop:3,display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
            <span style={{background:"rgba(99,102,241,0.15)",padding:"2px 7px",borderRadius:10,fontSize:10,color:"#a5b4fc"}}>👤 {user}</span>
            <span style={{fontSize:10,cursor:"pointer",color:"#64748b",textDecoration:"underline"}} onClick={logout}>退出 / Logout</span>
            {saving&&<span style={{color:"#818cf8",fontSize:10}}>● 保存中 Saving...</span>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,auto)",gap:mob?8:8}}>
          {[{l:"总容量 Total",v:"45 MW"},{l:"致命 Fatal",v:fc,a:fc>0?"#ef4444":"#22c55e"},{l:"高 High",v:hc,a:hc>0?"#f97316":"#22c55e"},{l:"完成 Done",v:`${ca}/${ta}`,a:"#22c55e"}].map((m,i)=>
            <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:mob?"8px 10px":"8px 12px"}}>
              <div style={{fontSize:9,color:"#64748b",letterSpacing:.7,textTransform:"uppercase",marginBottom:2}}>{m.l}</div>
              <div style={{fontSize:mob?16:17,fontWeight:800,color:m.a||"#f8fafc",fontFamily:"'JetBrains Mono',monospace"}}>{m.v}</div>
            </div>)}
        </div>
      </div>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:0,padding:mob?"0 8px":"0 22px",background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.06)",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:mob?"10px 12px":"9px 13px",background:tab===t.id?"rgba(99,102,241,0.15)":"transparent",border:"none",borderBottom:tab===t.id?"2px solid #818cf8":"2px solid transparent",color:tab===t.id?"#c7d2fe":"#64748b",cursor:"pointer",fontSize:mob?12:11.5,fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0}}>
        <span style={{marginRight:mob?2:4}}>{t.icon}</span>{mob?t.label.split(" ")[0]:t.label}
        {t.id==="changelog"&&logs.length>0&&<span style={{marginLeft:3,background:"#6366f1",color:"white",fontSize:9,padding:"1px 4px",borderRadius:8}}>{logs.length}</span>}
      </button>)}
    </div>

    <div style={{padding:`16px ${px}`,maxWidth:1100}}>

      {/* OVERVIEW */}
      {tab==="overview"&&<div>
        <h2 style={{fontSize:mob?14:13,fontWeight:700,marginBottom:10,color:"#cbd5e1"}}>项目构成 / Project Components</h2>
        <div style={{display:"flex",flexDirection:mob?"column":"row",gap:10,marginBottom:20}}>
          {data.projects.map((p,i)=>{const s=scFn(p.status);return<div key={p.id} style={{flex:mob?"none":"1 1 190px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,padding:mob?14:13,borderTop:`3px solid ${p.color}`}}>
            <div style={{fontSize:mob?13:12,fontWeight:700,marginBottom:2}}>{p.name}</div>
            <div style={{fontSize:mob?24:22,fontWeight:900,color:p.color,fontFamily:"'JetBrains Mono',monospace"}}>{p.capacity}</div>
            <select value={p.status} onChange={e=>setPSt(i,e.target.value)} style={{fontSize:mob?13:10,padding:mob?"4px 8px":"2px 6px",borderRadius:12,marginTop:4,border:"none",background:s.bg,color:s.fg,cursor:"pointer",fontWeight:600}}>{PS.map(s=><option key={s} value={s}>{s}</option>)}</select>
            {p.note&&<div style={{fontSize:mob?11:10,color:"#64748b",marginTop:4}}>{p.note}</div>}
          </div>})}
        </div>

        <h2 style={{fontSize:mob?14:13,fontWeight:700,marginBottom:10,color:"#cbd5e1"}}>项目周期 / Project Lifecycle</h2>
        <div style={{display:"flex",flexDirection:mob?"column":"row",gap:mob?8:0,marginBottom:20,overflowX:mob?"visible":"auto",paddingBottom:3}}>
          {[{cn:"开发许可",en:"Dev & Permit",t:"M1-M2",it:["可研 / Feasibility","ZESCO 审批 / Approval","ZEMA 环评 / EIA"]},{cn:"工程采购",en:"Eng & Procure",t:"M1-M3",it:["设备排产 / Equip. Mfg.","运输清关 / Shipping","EPC 招标 / Tendering"]},{cn:"施工安装",en:"Construction",t:"M3-M4",it:["土建电气 / Civil & Elec.","并网 / Grid Conn.","组件 / Modules"]},{cn:"调试COD",en:"Commissioning",t:"M3-M4",it:["冷调 / Cold Test","并网 / Grid Sync","COD 商运 / Commercial"]}].map((p,i)=>
            <div key={i} style={{flex:mob?"none":1,minWidth:mob?"auto":140,position:"relative"}}>
              <div style={{background:`rgba(99,102,241,${.08+i*.04})`,border:"1px solid rgba(99,102,241,0.15)",borderRadius:mob?10:(i===0?"10px 0 0 10px":i===3?"0 10px 10px 0":0),padding:mob?"12px 14px":"10px 9px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:mob?13:11.5,fontWeight:700,color:"#c7d2fe"}}>{p.cn}</div>
                    <div style={{fontSize:mob?11:10,color:"#94a3b8"}}>{p.en}</div>
                  </div>
                  <div style={{fontSize:mob?10:9,color:"#818cf8",fontFamily:"'JetBrains Mono',monospace"}}>{p.t}</div>
                </div>
                <div style={{marginTop:6}}>
                  {p.it.map((d,j)=><div key={j} style={{fontSize:mob?11:10,color:"#94a3b8",padding:"1px 0",display:"flex",alignItems:"center",gap:4}}><span style={{width:3,height:3,borderRadius:"50%",background:"#6366f1",flexShrink:0}}/>{d}</div>)}
                </div>
              </div>
              {!mob&&i<3&&<div style={{position:"absolute",right:-5,top:"50%",transform:"translateY(-50%)",color:"#6366f1",fontSize:11,zIndex:2}}>▸</div>}
            </div>)}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <h2 style={{fontSize:mob?14:13,fontWeight:700,color:"#cbd5e1",margin:0}}>技术参数 / Technical Parameters</h2>
          <button onClick={addP} style={{background:"none",border:"1px solid rgba(99,102,241,0.3)",borderRadius:5,color:"#818cf8",padding:mob?"4px 10px":"2px 7px",cursor:"pointer",fontSize:mob?12:10,fontFamily:"inherit"}}>+ 添加 / Add</button>
        </div>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,overflow:"hidden"}}>
          {data.techParams.map((tp,i)=><div key={tp.id} style={{padding:mob?"10px 12px":"7px 12px",borderBottom:i<data.techParams.length-1?"1px solid rgba(255,255,255,0.04)":"none",display:mob?"block":"flex",alignItems:"center"}}>
            {mob?<>
              <div style={{fontSize:12,color:"#64748b",marginBottom:3}}><EC value={tp.label} ck={`tp-${tp.id}-l`} onC={v=>up(d=>{d.techParams[i].label=v},`参数 Param: ${v.slice(0,12)}`)}/></div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace"}}><EC value={tp.value} ck={`tp-${tp.id}-v`} onC={v=>up(d=>{d.techParams[i].value=v},`值 Value: ${tp.label.slice(0,8)}→${v.slice(0,12)}`)}/></div>
                <Del onClick={()=>rmP(i)}/>
              </div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}><EC value={tp.note} ck={`tp-${tp.id}-n`} onC={v=>up(d=>{d.techParams[i].note=v})}/></div>
            </>:<>
              <div style={{flex:"0 0 130px",fontSize:11,color:"#64748b"}}><EC value={tp.label} ck={`tp-${tp.id}-l`} onC={v=>up(d=>{d.techParams[i].label=v},`参数 Param: ${v.slice(0,12)}`)}/></div>
              <div style={{flex:1,fontSize:12,fontWeight:600,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace"}}><EC value={tp.value} ck={`tp-${tp.id}-v`} onC={v=>up(d=>{d.techParams[i].value=v},`值 Value: ${tp.label.slice(0,8)}→${v.slice(0,12)}`)}/></div>
              <div style={{flex:1,fontSize:10.5,color:"#64748b"}}><EC value={tp.note} ck={`tp-${tp.id}-n`} onC={v=>up(d=>{d.techParams[i].note=v})}/></div>
              <Del onClick={()=>rmP(i)}/>
            </>}
          </div>)}
        </div>
      </div>}

      {/* BLOCKERS */}
      {tab==="blockers"&&<div>
        <div style={{fontSize:mob?12:11,color:"#94a3b8",marginBottom:12,padding:"8px 10px",background:"rgba(99,102,241,0.08)",borderRadius:7}}>💡 点击文字编辑 / Click to edit · 下拉切换 / Dropdown · ✕ 删除 / Delete · + 新增 / Add</div>
        <h3 style={{fontSize:mob?14:12.5,fontWeight:700,color:"#f87171",marginBottom:7}}>技术层面 / Technical</h3>
        {data.techBlockers.map(b=><BCard key={b.id} item={b} lk="techBlockers"/>)}<Add onClick={()=>addB("techBlockers","技术 Technical")} label="技术卡点 / Technical Blocker"/>
        <h3 style={{fontSize:mob?14:12.5,fontWeight:700,color:"#fbbf24",marginBottom:7,marginTop:14}}>商务层面 / Commercial</h3>
        {data.bizBlockers.map(b=><BCard key={b.id} item={b} lk="bizBlockers"/>)}<Add onClick={()=>addB("bizBlockers","商务 Commercial")} label="商务卡点 / Commercial Blocker"/>
        <h3 style={{fontSize:mob?14:12.5,fontWeight:700,color:"#38bdf8",marginBottom:7,marginTop:14}}>许可合规 / Permits & Compliance</h3>
        {data.permitBlockers.map(b=><BCard key={b.id} item={b} lk="permitBlockers"/>)}<Add onClick={()=>addB("permitBlockers","许可 Permit")} label="许可卡点 / Permit Blocker"/>
      </div>}

      {/* TIMELINE */}
      {tab==="timeline"&&<div>
        <div style={{fontSize:mob?12:11,color:"#94a3b8",marginBottom:12,padding:"8px 10px",background:"rgba(99,102,241,0.08)",borderRadius:7}}>💡 拖动滑块 / Drag slider · 点击编辑 / Click to edit · ✕ 删除 / Delete · + 新增 / Add</div>
        <div style={{position:"relative",paddingLeft:14}}>
          <div style={{position:"absolute",left:6,top:0,bottom:0,width:2,background:"rgba(99,102,241,0.2)"}}/>
          {data.timeline.map((t,i)=><div key={t.id} style={{position:"relative",marginBottom:mob?18:16,paddingLeft:22}}>
            <div style={{position:"absolute",left:-4,top:3,width:16,height:16,borderRadius:"50%",background:t.progress===100?"#22c55e":t.progress>0?"#6366f1":"#334155",border:"3px solid #1e293b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"white",fontWeight:700}}>{t.progress===100?"✓":i+1}</div>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:mob?13:11}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:mob?"flex-start":"center",marginBottom:4,flexWrap:"wrap",gap:4}}>
                <span style={{fontSize:mob?14:12.5,fontWeight:700,color:"#e2e8f0",flex:1,wordBreak:"break-word"}}><EC value={t.phase} ck={`tl-${t.id}-p`} onC={v=>up(d=>{d.timeline[i].phase=v},`阶段 Phase: ${v.slice(0,18)}`)}/></span>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:mob?12:10.5,color:"#818cf8",fontFamily:"'JetBrains Mono',monospace"}}><EC value={t.duration} ck={`tl-${t.id}-d`} onC={v=>up(d=>{d.timeline[i].duration=v},`工期 Duration: ${v}`)}/></span>
                  <Del onClick={()=>rmTL(i)}/>
                </div>
              </div>
              <div style={{display:"flex",gap:mob?8:12,fontSize:mob?12:10.5,color:"#64748b",marginBottom:6,flexWrap:"wrap",flexDirection:mob?"column":"row"}}>
                <span>前置 Prereq: <EC value={t.prereq} ck={`tl-${t.id}-pr`} onC={v=>up(d=>{d.timeline[i].prereq=v})}/></span>
                <span>产出 Output: <EC value={t.output} ck={`tl-${t.id}-o`} onC={v=>up(d=>{d.timeline[i].output=v})}/></span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{flex:1,height:mob?7:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,transition:"width 0.3s",width:`${t.progress}%`,background:t.progress===100?"#22c55e":"linear-gradient(90deg,#6366f1,#818cf8)"}}/></div>
                <input type="range" min={0} max={100} value={t.progress} onChange={e=>upProg(i,Number(e.target.value))} style={{width:mob?80:60,accentColor:"#6366f1"}}/>
                <span style={{fontSize:mob?12:10.5,fontFamily:"'JetBrains Mono',monospace",color:"#94a3b8",minWidth:28,textAlign:"right"}}>{t.progress}%</span>
              </div>
            </div>
          </div>)}
        </div>
        <Add onClick={addTL} label="时间线阶段 / Timeline Phase"/>
      </div>}

      {/* ACTIONS */}
      {tab==="actions"&&<div>
        <h3 style={{fontSize:mob?14:12.5,fontWeight:700,color:"#f87171",marginBottom:7}}><span style={{background:"#ef4444",color:"white",fontSize:mob?10:9,padding:"2px 6px",borderRadius:9,marginRight:6}}>P0</span>立即启动 / Immediate</h3>
        {data.p0Actions.map((a,i)=><div key={a.id} style={{display:"flex",alignItems:"center",gap:mob?10:8,padding:mob?"10px 12px":"8px 11px",marginBottom:mob?6:4,background:a.done?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.03)",border:`1px solid ${a.done?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.08)"}`,borderRadius:7}}>
          <div onClick={()=>togA("p0Actions",i)} style={{width:mob?22:16,height:mob?22:16,borderRadius:4,flexShrink:0,border:a.done?"none":"2px solid #475569",background:a.done?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:mob?13:10,cursor:"pointer"}}>{a.done&&"✓"}</div>
          <span style={{flex:1,fontSize:mob?13:12,color:a.done?"#64748b":"#e2e8f0",textDecoration:a.done?"line-through":"none",wordBreak:"break-word"}}><EC value={a.text} ck={`a-${a.id}`} onC={v=>up(d=>{d.p0Actions[i].text=v},`编辑 Edit P0: ${v.slice(0,20)}`)}/></span>
          <Del onClick={()=>rmA("p0Actions",i)}/>
        </div>)}<Add onClick={()=>addA("p0Actions","P0")} label="P0 行动项 / P0 Action"/>
        <h3 style={{fontSize:mob?14:12.5,fontWeight:700,color:"#fbbf24",marginBottom:7,marginTop:16}}><span style={{background:"#ca8a04",color:"white",fontSize:mob?10:9,padding:"2px 6px",borderRadius:9,marginRight:6}}>P1</span>近期启动 / Near-Term</h3>
        {data.p1Actions.map((a,i)=><div key={a.id} style={{display:"flex",alignItems:"center",gap:mob?10:8,padding:mob?"10px 12px":"8px 11px",marginBottom:mob?6:4,background:a.done?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.03)",border:`1px solid ${a.done?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.08)"}`,borderRadius:7}}>
          <div onClick={()=>togA("p1Actions",i)} style={{width:mob?22:16,height:mob?22:16,borderRadius:4,flexShrink:0,border:a.done?"none":"2px solid #475569",background:a.done?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:mob?13:10,cursor:"pointer"}}>{a.done&&"✓"}</div>
          <span style={{flex:1,fontSize:mob?13:12,color:a.done?"#64748b":"#e2e8f0",textDecoration:a.done?"line-through":"none",wordBreak:"break-word"}}><EC value={a.text} ck={`a-${a.id}`} onC={v=>up(d=>{d.p1Actions[i].text=v},`编辑 Edit P1: ${v.slice(0,20)}`)}/></span>
          <Del onClick={()=>rmA("p1Actions",i)}/>
        </div>)}<Add onClick={()=>addA("p1Actions","P1")} label="P1 行动项 / P1 Action"/>
      </div>}

      {/* RISKS */}
      {tab==="risks"&&<div>
        {data.risks.map((r,i)=>{const cc={"技术 / Technical":"#818cf8","融资 / Financing":"#fbbf24","政策 / Policy":"#f87171","物流 / Logistics":"#38bdf8","合规 / Compliance":"#a78bfa"};return<div key={r.id} style={{padding:mob?"12px":"10px 12px",marginBottom:mob?8:5,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:mob?8:0}}>
            <select value={r.category} onChange={e=>up(d=>{d.risks[i].category=e.target.value},`类别 Category → ${e.target.value}`)} style={{fontSize:mob?12:10,padding:mob?"4px 8px":"2px 5px",borderRadius:12,fontWeight:700,border:"none",background:`${cc[r.category]||"#818cf8"}22`,color:cc[r.category]||"#818cf8",cursor:"pointer"}}>{RC.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <Del onClick={()=>rmR(i)}/>
          </div>
          {mob?<>
            <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0",marginBottom:6}}><EC value={r.risk} ck={`r-${r.id}-r`} onC={v=>up(d=>{d.risks[i].risk=v},`风险 Risk: ${v.slice(0,18)}`)}/></div>
            <div style={{fontSize:12,color:"#94a3b8"}}>缓解 Mitigation: <EC value={r.mitigation} ck={`r-${r.id}-m`} onC={v=>up(d=>{d.risks[i].mitigation=v})}/></div>
          </>:<div style={{display:"flex",gap:9,alignItems:"center"}}>
            <div style={{flex:1,minWidth:130,fontSize:12,fontWeight:600,color:"#e2e8f0"}}><EC value={r.risk} ck={`r-${r.id}-r`} onC={v=>up(d=>{d.risks[i].risk=v},`风险 Risk: ${v.slice(0,18)}`)}/></div>
            <div style={{flex:1,fontSize:11,color:"#94a3b8",minWidth:130}}>缓解 Mitigation: <EC value={r.mitigation} ck={`r-${r.id}-m`} onC={v=>up(d=>{d.risks[i].mitigation=v})}/></div>
          </div>}
        </div>})}<Add onClick={addR} label="风险项 / Risk Item"/>
      </div>}

      {/* CHANGELOG */}
      {tab==="changelog"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{fontSize:mob?14:13,fontWeight:700,color:"#cbd5e1",margin:0}}>变更记录 / Changelog</h2>
          {user==="Admin"&&logs.length>0&&<button onClick={async()=>{if(!confirm("确认清空所有记录？/ Clear all logs?"))return;const{error}=await supabase.from("changelog").delete().neq("id",0);if(!error){setLogs([]);flash("已清空 Cleared ✓")}}} style={{background:"none",border:"1px solid rgba(239,68,68,0.3)",borderRadius:5,color:"#f87171",padding:"3px 8px",cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>清空全部 / Clear All</button>}
        </div>
        {logs.length===0?<div style={{textAlign:"center",padding:36,color:"#475569"}}><div style={{fontSize:26,marginBottom:6}}>◷</div>暂无记录 / No changes yet</div>
        :<div style={{position:"relative",paddingLeft:12}}>
          <div style={{position:"absolute",left:4,top:0,bottom:0,width:1.5,background:"rgba(99,102,241,0.12)"}}/>
          {logs.map((l,i)=>{const c=ucFn(l.username);return<div key={l.id||i} style={{position:"relative",marginBottom:mob?7:5,paddingLeft:16}}>
            <div style={{position:"absolute",left:-2,top:5,width:11,height:11,borderRadius:"50%",background:c,border:"2px solid #1e293b"}}/>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:7,padding:mob?"9px 11px":"7px 10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                <span style={{fontSize:mob?12.5:11.5,fontWeight:700,color:c}}>{l.username}</span>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:mob?10:9.5,color:"#475569",fontFamily:"'JetBrains Mono',monospace"}}>{fmtTime(l.created_at)}</span>
                  {user==="Admin"&&<button onClick={async()=>{const{error}=await supabase.from("changelog").delete().eq("id",l.id);if(!error){setLogs(prev=>prev.filter(x=>x.id!==l.id));flash("已删除 Deleted ✓")}}} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:mob?14:11,padding:"0 2px",opacity:.4}} onMouseOver={e=>{e.currentTarget.style.opacity=1;e.currentTarget.style.color="#ef4444"}} onMouseOut={e=>{e.currentTarget.style.opacity=.4;e.currentTarget.style.color="#475569"}}>✕</button>}
                </div>
              </div>
              <div style={{fontSize:mob?12.5:11.5,color:"#94a3b8"}}>{l.action}</div>
            </div>
          </div>})}
        </div>}
      </div>}

      {/* HELP */}
      {tab==="help"&&<div>
        <h2 style={{fontSize:mob?16:15,fontWeight:700,color:"#cbd5e1",marginBottom:14}}>使用说明 / User Guide</h2>
        {[
          {title:"总览 Overview",icon:"◈",desc:"查看项目构成、开发周期和技术参数。点击项目状态下拉框可切换状态。技术参数可点击编辑，也可新增或删除。/ View project components, lifecycle, and technical parameters. Click status dropdown to change. Parameters are editable, addable, and deletable."},
          {title:"卡点 Blockers",icon:"⬥",desc:"管理技术、商务、许可三类卡点。每个卡点可以：点击标题或原因文字直接编辑；用下拉菜单切换优先级（致命/高/中）和状态；点 ✕ 删除；点底部 + 按钮新增。/ Manage Technical, Commercial, and Permit blockers. Each blocker: click title/reason to edit inline; dropdown to change severity (Fatal/High/Medium) and status; ✕ to delete; + button to add new."},
          {title:"时间线 Timeline",icon:"◆",desc:"跟踪项目各阶段进度。拖动滑块更新完成百分比；点击阶段名称、工期、前置条件、产出可直接编辑；✕ 删除阶段；+ 新增阶段。/ Track progress of each project phase. Drag slider to update %; click phase name, duration, prereq, output to edit; ✕ to delete; + to add new phase."},
          {title:"行动项 Actions",icon:"▸",desc:"P0 为本周需立即启动的事项，P1 为本月内需启动的事项。点击勾选框标记完成/取消；点击文字编辑内容；✕ 删除；+ 新增。/ P0 = immediate this week, P1 = near-term this month. Click checkbox to toggle done; click text to edit; ✕ to delete; + to add."},
          {title:"风险 Risks",icon:"△",desc:"记录和管理项目风险。用下拉菜单选择风险类别（技术/融资/政策/物流/合规）；点击风险描述和缓解措施可编辑；✕ 删除；+ 新增。/ Record and manage risks. Dropdown to select category; click risk or mitigation to edit; ✕ to delete; + to add."},
          {title:"变更记录 Changelog",icon:"◷",desc:"自动记录所有团队成员的操作，包括谁在什么时间做了什么修改。不同成员用不同颜色标识。管理员可删除单条或清空全部记录。/ Automatically logs all team actions. Different members shown in different colors. Admin can delete individual entries or clear all."},
        ].map((h,i)=><div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:mob?"14px":"14px 16px",marginBottom:10}}>
          <div style={{fontSize:mob?14:13,fontWeight:700,color:"#c7d2fe",marginBottom:6}}><span style={{marginRight:6}}>{h.icon}</span>{h.title}</div>
          <div style={{fontSize:mob?12.5:11.5,color:"#94a3b8",lineHeight:1.7}}>{h.desc}</div>
        </div>)}
        <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:10,padding:mob?"14px":"14px 16px",marginTop:14}}>
          <div style={{fontSize:mob?14:13,fontWeight:700,color:"#818cf8",marginBottom:6}}>🔐 账号管理 / Account Management</div>
          <div style={{fontSize:mob?12.5:11.5,color:"#94a3b8",lineHeight:1.7}}>账号由管理员在 Supabase 数据库中创建和管理。如需新增账号或重置密码，请联系项目管理员。/ Accounts are created and managed by the admin in the Supabase database. Contact the project admin to add accounts or reset passwords.</div>
        </div>
      </div>}
    </div>
  </div>;
}
