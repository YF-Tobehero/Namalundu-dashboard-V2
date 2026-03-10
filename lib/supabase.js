import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Default dashboard data
export const DEFAULT_DATA = {
  projects: [
    { id: "p1", name: "Namalundu 一期 / Phase I", capacity: "10MW", status: "进行中 / In Progress", note: "T接 Dimba-Kafue Gorge 33kV / T-tap into 33kV line", color: "#6366f1" },
    { id: "p2", name: "Namalundu 二期 / Phase II (30MW)", capacity: "30MW", status: "开发中 / In Development", note: "", color: "#f59e0b" },
    { id: "p3", name: "二期快速版 / Phase II Fast-track (5MW)", capacity: "5MW", status: "开发中 / In Development", note: "T接方案，共用一期母线 / Sharing Phase I busbar", color: "#f59e0b" },
  ],
  techBlockers: [
    { id: "t1", title: "核心方案信息缺失 / Critical design info missing", status: "等待中 / Awaiting", severity: "fatal", reason: "重要技术参数尚未到位 / Key parameters not yet received" },
    { id: "t2", title: "一期接入核实 / Phase I grid verification", status: "待核实 / To Verify", severity: "high", reason: "需确认容量占用 / Confirm capacity usage" },
    { id: "t3", title: "ZESCO 前置沟通 / ZESCO pre-engagement", status: "待准备 / To Prepare", severity: "high", reason: "需先确定方案 / Finalize scheme first" },
    { id: "t4", title: "方案比选 / Scheme comparison", status: "待深化 / To Deepen", severity: "medium", reason: "需完整信息 / Requires complete info" },
  ],
  bizBlockers: [
    { id: "b1", title: "ODI 备案 / ODI filing", status: "未启动 / Not Started", severity: "medium", reason: "" },
    { id: "b2", title: "合资注册 / JV registration", status: "未启动 / Not Started", severity: "medium", reason: "确认股权结构 / Confirm equity" },
    { id: "b3", title: "可研更新 / Feasibility update", status: "待更新 / Pending Update", severity: "medium", reason: "需确定方案 / Requires scheme" },
    { id: "b4", title: "Escrow 账户 / Escrow account", status: "待更新 / Pending Update", severity: "medium", reason: "需银行确认 / Bank confirmation" },
  ],
  permitBlockers: [
    { id: "pm1", title: "ZDA 许可 / ZDA license", status: "待申请 / To Apply", severity: "high", reason: "锁定5年免税 / 5-year tax holiday" },
    { id: "pm2", title: "ERB 注册 / ERB registration", status: "待申请 / To Apply", severity: "medium", reason: "能源监管 / Energy Regulation Board" },
    { id: "pm3", title: "ZRA 进口优惠 / ZRA duty relief", status: "待申请 / To Apply", severity: "medium", reason: "设备免税 / Equipment exemption" },
    { id: "pm4", title: "可行性报告 / Feasibility report", status: "待发送 / To Send", severity: "medium", reason: "提供给合作方 / Provide to partner" },
  ],
  timeline: [
    { id: "tl1", phase: "合资主体设立 / JV Setup", duration: "1月 / 1mo", prereq: "—", output: "营业执照 / License", progress: 0 },
    { id: "tl2", phase: "ODI 备案 / ODI Filing", duration: "2月 / 2mo", prereq: "主体设立 / Entity", output: "投资证书 / Cert.", progress: 0 },
    { id: "tl3", phase: "设备排产 / Equipment Mfg.", duration: "2-3月 / 2-3mo", prereq: "方案确认 / Scheme", output: "设备出厂 / Ex-factory", progress: 0 },
    { id: "tl4", phase: "EPC 招标施工 / EPC Build", duration: "3月 / 3mo", prereq: "设备到场 / On-site", output: "竣工 / Complete", progress: 0 },
    { id: "tl5", phase: "调试COD / Commissioning", duration: "1月 / 1mo", prereq: "施工完 / Built", output: "商运 / COD", progress: 0 },
  ],
  risks: [
    { id: "r1", category: "技术 / Technical", risk: "信息延迟 / Info delay", mitigation: "跟进+并行 / Follow up + parallel" },
    { id: "r2", category: "技术 / Technical", risk: "ZESCO不确定 / ZESCO uncertainty", mitigation: "多方案+沟通 / Multi-scheme + talks" },
    { id: "r3", category: "融资 / Financing", risk: "ODI延迟 / ODI delay", mitigation: "聘顾问 / Engage advisors" },
    { id: "r4", category: "政策 / Policy", risk: "ZDA变动 / ZDA changes", mitigation: "早锁定 / Secure early" },
    { id: "r5", category: "物流 / Logistics", risk: "物流延误 / Shipping delay", mitigation: "40%缓冲 / 40% buffer" },
  ],
  p0Actions: [
    { id: "a1", text: "获取核心信息 / Obtain critical info", done: false },
    { id: "a2", text: "启动合资+申请 / JV + applications", done: false },
    { id: "a3", text: "方案比选材料 / Comparison materials", done: false },
  ],
  p1Actions: [
    { id: "a4", text: "ODI 材料 / ODI docs", done: false },
    { id: "a5", text: "设备询价 / Equipment RFQ", done: false },
    { id: "a6", text: "EPC 招标 / EPC tender", done: false },
    { id: "a7", text: "物流清关 / Logistics", done: false },
    { id: "a8", text: "可研更新 / Feasibility update", done: false },
    { id: "a9", text: "Escrow 设计 / Escrow design", done: false },
  ],
  techParams: [
    { id: "tp1", label: "光照 / Irradiance", value: "~1,900-2,000 kWh/kWp/yr", note: "南方省 / Southern Province" },
    { id: "tp2", label: "组件 / Modules", value: "630W Mono PERC", note: "~8,850 (5MW)" },
    { id: "tp3", label: "逆变器 / Inverters", value: "330kW", note: "15-17台 (5MW)" },
    { id: "tp4", label: "变压器 / Transformers", value: "3,150+2,500 kVA", note: "5MW config" },
    { id: "tp5", label: "基础 / Foundation", value: "灌注桩 / Bored piles", note: "镀锌钢柱 / Galvanized" },
  ],
};

// Fetch dashboard data
export async function loadDashboard() {
  const { data, error } = await supabase
    .from("dashboard_data")
    .select("data, updated_at")
    .eq("id", "main")
    .single();
  if (error || !data) return { data: DEFAULT_DATA, updatedAt: new Date().toISOString() };
  return { data: data.data, updatedAt: data.updated_at };
}

// Save dashboard data
export async function saveDashboard(dashData) {
  const { error } = await supabase
    .from("dashboard_data")
    .upsert({ id: "main", data: dashData }, { onConflict: "id" });
  return !error;
}

// Fetch changelog
export async function loadChangelog(limit = 200) {
  const { data, error } = await supabase
    .from("changelog")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return error ? [] : data;
}

// Add changelog entry
export async function addChangelogEntry(username, action) {
  await supabase.from("changelog").insert({ username, action });
}

// Clear changelog
export async function clearChangelog() {
  await supabase.from("changelog").delete().neq("id", 0);
}
