// TruthLens AI — final project presentation generator (pptxgenjs).
// Usage: NODE_PATH=<dir with pptxgenjs, react, react-dom, react-icons, sharp> node build_deck.js <applyThemePath>
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Lu = require("react-icons/lu");
const NOTES = require("./notes.js");

const ROOT = path.resolve(__dirname, "..");
const A = (f) => path.join(ROOT, "assets", f);
const OUT = path.join(ROOT, "TruthLens_AI_Final_Presentation.pptx");
const { applyTheme } = require(process.argv[2]);
const REPORT = JSON.parse(fs.readFileSync(A("live-run-report.json"), "utf8"));

// ---------- Theme ----------
const HEX = {
  bg: "0B1020", text: "F2EFE8", panel: "141B30", muted: "9AA3B8",
  indigo: "6E7BFF", teal: "2EC4B6", coral: "FF6B5E", grey: "8A93A6", amber: "F2B84B", line: "2A3456",
};
const THEME = {
  name: "TruthLens Editorial",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: HEX.bg, lt1: HEX.text, dk2: HEX.panel, lt2: HEX.muted,
    accent1: HEX.indigo, accent2: HEX.teal, accent3: HEX.coral, accent4: HEX.grey,
    accent5: HEX.amber, accent6: HEX.line, hlink: "9AA6FF", folHlink: "B7A6FF",
  },
};
const MONO = "Courier New";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "TruthLens AI — Autonomous Multi-Agent Claim Verification";
pres.author = "Mugash Priyan U.";
pres.subject = "Agent Technology — Final Project Presentation";
const S = pres.SchemeColor;
const C = {
  bg: S.text1, text: S.background1, panel: S.text2, muted: S.background2,
  indigo: S.accent1, teal: S.accent2, coral: S.accent3, grey: S.accent4, amber: S.accent5, line: S.accent6,
};
const W = 13.333, M = 0.6, CW = W - 2 * M;

// ---------- Layouts ----------
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: C.bg },
  objects: [],
});
pres.defineSlideMaster({
  title: "CONTENT_DARK",
  background: { color: C.bg },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: M, y: 0.3, w: 8.6, h: 0.3, fontFace: MONO, fontSize: 11, color: C.indigo, bold: true, margin: 0, valign: "middle" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.62, w: CW, h: 0.78, fontFace: "Cambria", fontSize: 30, bold: true, color: C.text, margin: 0, valign: "middle", align: "left" }, text: "" } },
    { text: { text: "TruthLens AI  ·  Agent Technology  ·  Final Project Review", options: { x: M, y: 7.05, w: 7, h: 0.25, fontFace: MONO, fontSize: 9, color: C.muted, margin: 0 } } },
  ],
  slideNumber: { x: 12.23, y: 7.05, w: 0.5, h: 0.25, fontFace: MONO, fontSize: 9, color: C.muted, align: "right" },
});

// ---------- Helpers ----------
let objId = 0;
const nm = (p) => `${p}_${++objId}`;
function T(slide, text, o = {}) {
  const opts = Object.assign({ isTextBox: true, margin: 0, fontFace: "Calibri", fontSize: 14, color: C.text, valign: "top", objectName: nm("text") }, o);
  slide.addText(text, opts);
}
function R(slide, x, y, w, h, o = {}) {
  const shape = o.round ? pres.shapes.ROUNDED_RECTANGLE : pres.shapes.RECTANGLE;
  const opts = { x, y, w, h, objectName: nm("shape"), fill: o.fill ? { color: o.fill, transparency: o.ft || 0 } : { type: "none" }, line: o.line ? { color: o.line, width: o.lw || 1, dashType: o.dash || "solid" } : { type: "none" } };
  if (o.round) opts.rectRadius = o.round;
  slide.addShape(shape, opts);
}
function line(slide, x1, y1, x2, y2, o = {}) {
  const opts = {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    objectName: nm("line"),
    line: { color: o.color || C.muted, width: o.w || 1.25, dashType: o.dash || "solid", endArrowType: o.arrow === false ? undefined : "triangle" },
  };
  if (x2 < x1) opts.flipH = true;
  if (y2 < y1) opts.flipV = true;
  slide.addShape(pres.shapes.LINE, opts);
}
function chip(slide, x, y, w, h, label, color, o = {}) {
  R(slide, x, y, w, h, { round: h / 2, fill: color, ft: o.ft == null ? 78 : o.ft, line: color, lw: 0.75 });
  T(slide, label, { x, y, w, h, align: "center", valign: "middle", fontFace: o.mono === false ? "Calibri" : MONO, fontSize: o.fs || 11, bold: true, color: o.tc || color });
}
function codePanel(slide, x, y, w, h, lines, o = {}) {
  R(slide, x, y, w, h, { fill: C.panel, line: C.line, round: 0.06 });
  if (o.label) T(slide, o.label, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.25, fontFace: MONO, fontSize: 10, color: C.muted, bold: true });
  const runs = lines.map((ln, i) => {
    const seg = typeof ln === "string" ? { text: ln, options: {} } : ln;
    return { text: seg.text, options: Object.assign({ fontFace: MONO, fontSize: o.fs || 11.5, color: C.text, breakLine: i < lines.length - 1 }, seg.options) };
  });
  T(slide, runs, { x: x + 0.2, y: y + (o.label ? 0.45 : 0.18), w: w - 0.4, h: h - (o.label ? 0.6 : 0.3), lineSpacingMultiple: 1.05 });
}
function src(slide, text, y = 6.72) {
  T(slide, "src › " + text, { x: M, y, w: CW, h: 0.24, fontFace: MONO, fontSize: 9.5, color: C.muted });
}
function stageStrip(slide, active) {
  const x0 = 10.48, y = 0.3, s = 0.3, g = 0.075;
  T(slide, "STAGE", { x: x0 - 0.75, y, w: 0.68, h: s, fontFace: MONO, fontSize: 8.5, color: C.muted, align: "right", valign: "middle" });
  for (let i = 0; i < 6; i++) {
    const on = active.includes(i + 1);
    R(slide, x0 + i * (s + g), y, s, s, { fill: on ? C.indigo : undefined, line: on ? C.indigo : C.line, lw: 1 });
    T(slide, String(i + 1), { x: x0 + i * (s + g), y, w: s, h: s, align: "center", valign: "middle", fontFace: MONO, fontSize: 10, bold: true, color: on ? C.text : C.muted });
  }
}
function img(slide, file, x, y, w, h, o = {}) {
  slide.addImage({ path: A(file), x, y, w, h, objectName: nm("image"), altText: o.alt || file });
  R(slide, x, y, w, h, { line: o.border || C.line, lw: 1 });
}
const iconCache = {};
async function icon(name, hex) {
  const key = name + hex;
  if (iconCache[key]) return iconCache[key];
  const Comp = Lu[name] || Lu.LuCircle;
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { size: 256, color: "#" + hex }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return (iconCache[key] = "image/png;base64," + buf.toString("base64"));
}
async function iconCircle(slide, name, x, y, d, colorKey) {
  R(slide, x, y, d, d, { round: d / 2, fill: C[colorKey], ft: 80, line: C[colorKey], lw: 0.75 });
  const p = d * 0.22;
  slide.addImage({ data: await icon(name, HEX[colorKey]), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: nm("icon"), altText: name });
}
// table helpers
function cell(text, o = {}) { return { text, options: Object.assign({ fontFace: "Calibri", fontSize: 12, color: C.text, valign: "middle", margin: [4, 6, 4, 6] }, o) }; }
function hcell(text, o = {}) { return cell(text, Object.assign({ fontFace: MONO, fontSize: 10.5, bold: true, color: C.muted, fill: { color: C.panel } }, o)); }
const BORDER = { type: "solid", pt: 0.75, color: HEX.line };

let slideNo = 0;
function newSlide(section, kicker, title, stages) {
  slideNo++;
  const s = pres.addSlide({ masterName: "CONTENT_DARK", sectionTitle: section });
  s.addText(kicker, { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  stageStrip(s, stages || []);
  const n = NOTES[slideNo - 1];
  s.addNotes(`[Target time ${n.dur}]\n\n${n.notes}`);
  return s;
}
const VCOL = { TRUE: "teal", FALSE: "coral", PARTIALLY_TRUE: "teal", MISLEADING: "amber", UNSUPPORTED: "grey" };

// ================= SLIDES =================
async function build() {
  const SEC_A = "A · Problem & Motivation", SEC_B = "B · System Architecture", SEC_C = "C · Implementation & Methods",
    SEC_D = "D · Comparison & Critical Analysis", SEC_E = "E · Demonstration & Close", SEC_X = "Appendix";

  // ---------- 1 · Title ----------
  pres.addSection({ title: SEC_A });
  {
    slideNo++;
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: SEC_A });
    s.addNotes(`[Target time ${NOTES[0].dur}]\n\n${NOTES[0].notes}`);
    T(s, "AGENT TECHNOLOGY  ·  FINAL PROJECT PRESENTATION", { x: 0.7, y: 0.65, w: 7, h: 0.3, fontFace: MONO, fontSize: 11, bold: true, color: C.indigo });
    T(s, "TruthLens AI", { x: 0.7, y: 1.05, w: 7.2, h: 1.2, fontFace: "Cambria", fontSize: 64, bold: true, color: C.text });
    T(s, "Autonomous Multi-Agent Claim Verification and Evidence Reasoning System", { x: 0.7, y: 2.3, w: 6.6, h: 0.95, fontFace: "Cambria", fontSize: 22, color: C.muted });
    // identity
    T(s, "Mugash Priyan U.", { x: 0.7, y: 3.75, w: 6.5, h: 0.45, fontSize: 22, bold: true });
    T(s, [
      { text: "M.Tech Integrated CSE — Data Science", options: { breakLine: true } },
      { text: "Subject: Agent Technology", options: { breakLine: true } },
      { text: "SRM Institute of Science and Technology" },
    ], { x: 0.7, y: 4.25, w: 6.5, h: 0.95, fontSize: 15, color: C.muted, lineSpacingMultiple: 1.1 });
    T(s, [
      { text: "LIVE  ", options: { color: C.teal, bold: true } },
      { text: "https://frontend-xi-kohl-41.vercel.app", options: { hyperlink: { url: "https://frontend-xi-kohl-41.vercel.app/" }, color: C.text, breakLine: true } },
      { text: "CODE  ", options: { color: C.teal, bold: true } },
      { text: "https://github.com/umugash/truthlens-ai", options: { hyperlink: { url: "https://github.com/umugash/truthlens-ai" }, color: C.text } },
    ], { x: 0.7, y: 5.45, w: 6.6, h: 0.7, fontFace: MONO, fontSize: 12.5, lineSpacingMultiple: 1.25 });
    // right: decomposition motif from the real run
    const px = 7.95, pw = 4.7;
    R(s, px, 0.95, pw, 3.55, { fill: C.panel, line: C.line, round: 0.08 });
    T(s, "UNSTRUCTURED INPUT", { x: px + 0.25, y: 1.1, w: 4, h: 0.25, fontFace: MONO, fontSize: 9.5, bold: true, color: C.muted });
    const span = (t, n, col) => [{ text: t, options: { color: C.text } }, { text: ` ${n} `, options: { color: C[col], bold: true, superscript: true } }];
    T(s, [
      ...span("Apple has acquired OpenAI in a landmark $50 billion deal.", "1", "coral"),
      ...span(" The acquisition was announced yesterday", "2", "grey"),
      ...span(" and will integrate ChatGPT into all Apple devices starting next month.", "3", "coral"),
      ...span(" CEO Tim Cook confirmed the deal at a press conference in Cupertino.", "4", "grey"),
    ], { x: px + 0.25, y: 1.4, w: pw - 0.5, h: 1.75, fontSize: 13.5, lineSpacingMultiple: 1.12 });
    T(s, "PER-CLAIM VERDICTS", { x: px + 0.25, y: 3.25, w: 4, h: 0.25, fontFace: MONO, fontSize: 9.5, bold: true, color: C.muted });
    const vs = [["1", "FALSE", "coral"], ["2", "UNSUPP.", "grey"], ["3", "FALSE", "coral"], ["4", "UNSUPP.", "grey"]];
    vs.forEach((v, i) => chip(s, px + 0.25 + i * 1.07, 3.6, 0.98, 0.36, `${v[0]} ${v[1]}`, C[v[2]], { fs: 10 }));
    T(s, "Real output · live deployment · 17 Nov 2026 · trust score 24/100", { x: px, y: 4.6, w: pw, h: 0.25, fontFace: MONO, fontSize: 9, color: C.muted, align: "right" });
    // central question
    R(s, px, 5.15, pw, 1.35, { fill: C.indigo, ft: 85, line: C.indigo, lw: 0.75, round: 0.08 });
    T(s, "How can we transform unstructured information into a structured, evidence-backed claim-verification workflow using coordinated AI agents?", { x: px + 0.25, y: 5.25, w: pw - 0.5, h: 1.15, fontFace: "Cambria", italic: true, fontSize: 14.5, valign: "middle" });
  }

  // ---------- 2 · Problem ----------
  {
    const s = newSlide(SEC_A, "A · PROBLEM — 02", "One message, many claims, scattered evidence");
    const ch = ["News websites", "Social media", "Messaging apps", "Blogs", "Online publications", "Viral forwards"];
    const cw = (CW - 5 * 0.15) / 6;
    ch.forEach((c, i) => chip(s, M + i * (cw + 0.15), 1.6, cw, 0.36, c, C.muted, { mono: false, fs: 12, ft: 92, tc: C.text }));
    // message bubble
    R(s, M, 2.25, 6.15, 2.75, { fill: C.panel, line: C.line, round: 0.12 });
    T(s, "FORWARDED MESSAGE", { x: M + 0.25, y: 2.4, w: 4, h: 0.25, fontFace: MONO, fontSize: 9.5, bold: true, color: C.muted });
    const sp = (t, n) => [{ text: t }, { text: ` ${n} `, options: { color: C.indigo, bold: true, superscript: true } }];
    T(s, [
      { text: "Breaking: " , options: { color: C.muted } },
      ...sp("Apple has acquired OpenAI in a landmark $50 billion deal.", "1"),
      ...sp(" The acquisition was announced yesterday", "2"),
      ...sp(" and will integrate ChatGPT into all Apple devices starting next month.", "3"),
      ...sp(" CEO Tim Cook confirmed the deal at a press conference in Cupertino.", "4"),
    ], { x: M + 0.25, y: 2.72, w: 5.65, h: 2.15, fontSize: 16, lineSpacingMultiple: 1.15 });
    const steps = [["4", "independent factual claims"], ["4", "different searches"], ["4", "possibly different verdicts"]];
    steps.forEach((st, i) => {
      const x = M + i * 2.1;
      T(s, st[0], { x, y: 5.15, w: 0.5, h: 0.55, fontFace: "Cambria", fontSize: 30, bold: true, color: C.indigo });
      T(s, st[1], { x: x + 0.5, y: 5.17, w: 1.5, h: 0.55, fontSize: 13, color: C.muted, valign: "middle" });
    });
    // difficulties
    const rows = [
      ["LuSplit", "One text can carry several claims with different truth values"],
      ["LuPuzzle", "A search result may support only part of a statement"],
      ["LuSwords", "Different sources can contradict each other"],
      ["LuHand", "The reader must compare every source manually"],
      ["LuEyeOff", "A fluent generated answer can hide where its evidence came from"],
    ];
    T(s, "WHY IT IS HARD", { x: 7.25, y: 2.25, w: 5, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    for (let i = 0; i < rows.length; i++) {
      const y = 2.62 + i * 0.6;
      await iconCircle(s, rows[i][0], 7.25, y, 0.44, "coral");
      T(s, rows[i][1], { x: 7.85, y: y - 0.02, w: 4.88, h: 0.5, fontSize: 14.5, valign: "middle" });
    }
    R(s, M, 5.9, CW, 0.75, { fill: C.indigo, ft: 86, line: C.indigo, lw: 0.75, round: 0.06 });
    T(s, [
      { text: "Claim-level verification beats an article-level summary: ", options: { bold: true } },
      { text: "summarising the whole text averages away a false claim hidden among true ones." },
    ], { x: M + 0.25, y: 5.9, w: CW - 0.5, h: 0.75, fontSize: 15, valign: "middle" });
  }

  // ---------- 3 · Existing approaches ----------
  {
    const s = newSlide(SEC_A, "A · CONTEXT — 03", "What existing approaches do well — and where they stop");
    const H = ["APPROACH", "WHAT IT DOES WELL", "TYPICAL INTERACTION", "LIMITATION FOR CLAIM-BY-CLAIM VERIFICATION"].map((h) => hcell(h));
    const rows = [
      ["Search engines\nGoogle, Bing", "Fast discovery and ranking of relevant pages from a fresh web index", "Type a query, open and read results", "No claim decomposition or verdict; the user reads, compares and judges every source"],
      ["LLM assistants\nChatGPT, Gemini", "Flexible synthesis; can search the web and cite sources (product- and plan-dependent)", "Conversational prompting and follow-ups", "Decomposition, evidence stance and output format depend on each prompt — no fixed schema"],
      ["Fact-checking platforms\nSnopes, PolitiFact, Google Fact Check Explorer", "Expert human verdicts with documented sources — the quality reference", "Look up an existing fact-check", "Covers only claims already checked; new viral text may not be covered yet"],
      ["TruthLens AI\nthis project", "Fixed six-stage workflow: per-claim verdict, confidence, stance-labelled evidence, exportable report", "Paste text → one click → structured report", "Depends on Gemini + Tavily; snippet-level evidence; accuracy not yet benchmarked"],
    ];
    const data = [H, ...rows.map((r, i) => r.map((t, j) => {
      const tl = i === 3;
      if (j === 0) {
        const [a, b] = t.split("\n");
        return { text: [{ text: a, options: { bold: true, breakLine: true, color: tl ? C.indigo : C.text, fontSize: 13 } }, { text: b, options: { fontSize: 10.5, color: C.muted } }], options: { valign: "middle", margin: [4, 6, 4, 6], fill: tl ? { color: C.indigo, transparency: 86 } : undefined } };
      }
      return cell(t, { fontSize: 12.5, fill: tl ? { color: C.indigo, transparency: 86 } : undefined });
    }))];
    s.addTable(data, { x: M, y: 1.6, w: CW, colW: [2.45, 3.2, 2.45, 4.03], rowH: [0.38, 0.92, 0.92, 0.92, 0.92], border: BORDER, objectName: nm("table") });
    T(s, [
      { text: "Key distinction  ", options: { fontFace: MONO, fontSize: 10.5, bold: true, color: C.indigo } },
      { text: "Search engines rank pages. LLM assistants synthesise answers and can use web tools. TruthLens packages a repeatable application workflow — extract → retrieve → classify → reason → score → report — around Gemini. It is not a competing foundation model.", options: { fontSize: 14 } },
    ], { x: M, y: 5.95, w: CW, h: 0.75, valign: "middle" });
  }

  // ---------- 4 · Gap & problem statement ----------
  {
    const s = newSlide(SEC_A, "A · PROBLEM FORMULATION — 04", "Research gap and problem statement");
    T(s, "“", { x: M, y: 1.4, w: 0.6, h: 0.9, fontFace: "Cambria", fontSize: 60, bold: true, color: C.indigo });
    T(s, "To design and implement an AI-assisted, multi-agent claim-verification system that decomposes unstructured information into independently verifiable claims, retrieves relevant external evidence, evaluates supporting and contradicting information, performs structured reasoning, estimates confidence, and generates an explainable verification report.", { x: M + 0.7, y: 1.6, w: CW - 0.7, h: 1.55, fontFace: "Cambria", italic: true, fontSize: 19, lineSpacingMultiple: 1.1, valign: "middle" });
    const boxes = [
      ["01  EXISTING PROBLEM", "Verification is manual and document-level: people search, read and compare sources by themselves.", "grey"],
      ["02  IDENTIFIED GAP", "No inspectable claim-by-claim pipeline in which claims, sources and stances persist as data instead of vanishing into one answer.", "coral"],
      ["03  PROPOSED DIRECTION", "Specialised agents with one responsibility each, passing typed state; external retrieval instead of model memory.", "indigo"],
      ["04  OBJECTIVE", "A deployed web application returning per-claim verdicts, confidence, evidence and an overall trust score.", "teal"],
    ];
    const bw = (CW - 3 * 0.35) / 4;
    boxes.forEach((b, i) => {
      const x = M + i * (bw + 0.35);
      R(s, x, 3.55, bw, 2.55, { fill: C.panel, line: C[b[2]], lw: 1, round: 0.08 });
      T(s, b[0], { x: x + 0.2, y: 3.72, w: bw - 0.4, h: 0.3, fontFace: MONO, fontSize: 10.5, bold: true, color: C[b[2]] });
      T(s, b[1], { x: x + 0.2, y: 4.12, w: bw - 0.4, h: 1.9, fontSize: 14.5, lineSpacingMultiple: 1.05 });
      if (i < 3) line(s, x + bw + 0.04, 4.82, x + bw + 0.31, 4.82, { color: C.muted, w: 1.5 });
    });
    T(s, "Scope note — the objective is an explainable, inspectable workflow. It is not a claim of superior accuracy; that requires the benchmark proposed on slide 22.", { x: M, y: 6.3, w: CW, h: 0.4, fontSize: 13, italic: true, color: C.muted });
  }

  // ---------- 5 · Solution ----------
  {
    const s = newSlide(SEC_A, "A · PROPOSED SOLUTION — 05", "TruthLens AI: from pasted text to a verdict per claim", [1, 2, 3, 4, 5, 6]);
    T(s, "WHAT THE SYSTEM DOES", { x: M, y: 1.6, w: 5, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    const caps = [
      "Accept news text, social posts or message forwards",
      "Extract factual, independently verifiable claims",
      "Search the web for each claim separately",
      "Classify each source: supports / contradicts / neutral",
      "Reason over the evidence to a verdict",
      "Attach a 0–100 confidence and an overall trust score",
      "Return a structured report with source links",
    ];
    caps.forEach((c, i) => {
      const y = 1.98 + i * 0.6;
      T(s, String(i + 1).padStart(2, "0"), { x: M, y, w: 0.5, h: 0.45, fontFace: MONO, fontSize: 14, bold: true, color: C.indigo, valign: "middle" });
      T(s, c, { x: M + 0.6, y, w: 5.2, h: 0.45, fontSize: 15, valign: "middle" });
      if (i < caps.length - 1) R(s, M + 0.6, y + 0.52, 5.2, 0.005, { fill: C.line });
    });
    const x0 = 6.85, vw = CW - (x0 - M);
    T(s, "FIVE VERDICTS  ·  definitions from REASONING_PROMPT", { x: x0, y: 1.6, w: vw, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    const V = [
      ["TRUE", "Evidence strongly supports the claim", "teal", 1.0],
      ["PARTIALLY_TRUE", "Some truth, but incomplete or oversimplified", "teal", 0.7],
      ["MISLEADING", "Technically related but presented deceptively", "amber", 0.3],
      ["FALSE", "Evidence strongly contradicts the claim", "coral", 0.0],
      ["UNSUPPORTED", "Insufficient evidence to verify", "grey", 0.5],
    ];
    V.forEach((v, i) => {
      const y = 1.98 + i * 0.56;
      chip(s, x0, y, 2.05, 0.4, v[0], C[v[2]], { fs: 10.5, ft: v[0] === "PARTIALLY_TRUE" ? 88 : 78 });
      T(s, v[1], { x: x0 + 2.2, y, w: 3.0, h: 0.4, fontSize: 13.5, valign: "middle" });
      T(s, "w=" + v[3].toFixed(1), { x: x0 + 5.2, y, w: vw - 5.2, h: 0.4, fontFace: MONO, fontSize: 11, color: C.muted, align: "right", valign: "middle" });
    });
    R(s, x0, 4.95, vw, 1.55, { fill: C.grey, ft: 88, line: C.grey, lw: 1, round: 0.08 });
    T(s, "WHY UNSUPPORTED MATTERS", { x: x0 + 0.25, y: 5.07, w: 5, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.text });
    T(s, [
      { text: "Absence of evidence ≠ evidence of falsity. ", options: { bold: true } },
      { text: "If search returns nothing, the code skips the LLM and returns UNSUPPORTED with confidence 15; in the trust score it carries a neutral weight of 0.5." },
    ], { x: x0 + 0.25, y: 5.38, w: vw - 0.5, h: 1.05, fontSize: 14 });
    src(s, "backend/app/utils/prompts.py · REASONING_PROMPT   ·   backend/app/agents/reasoning_agent.py   ·   frontend/app/api/verify/route.ts");
  }

  // ---------- 6 · Architecture ----------
  pres.addSection({ title: SEC_B });
  {
    const s = newSlide(SEC_B, "B · ARCHITECTURE — 06", "Two execution paths, one report schema", [1, 2, 3, 4, 5, 6]);
    // browser
    R(s, M, 1.6, 2.65, 4.75, { fill: C.panel, line: C.line, round: 0.08 });
    T(s, "BROWSER", { x: M + 0.18, y: 1.72, w: 2.3, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    T(s, "Next.js client · React 19", { x: M + 0.18, y: 1.98, w: 2.35, h: 0.3, fontSize: 14, bold: true });
    const br = [["page.tsx", "landing → loading → results"], ["components/*", "UI, claim cards, history"], ["lib/api.ts", "verifyText() → POST"], ["lib/export.ts", "PDF · JSON · clipboard"], ["lib/history.ts", "localStorage, 20 entries"]];
    br.forEach((b, i) => {
      const y = 2.42 + i * 0.76;
      R(s, M + 0.15, y, 2.35, 0.64, { fill: C.bg, line: C.line, round: 0.05 });
      T(s, [{ text: b[0], options: { fontFace: MONO, fontSize: 11, bold: true, color: C.indigo, breakLine: true } }, { text: b[1], options: { fontSize: 11.5, color: C.muted } }], { x: M + 0.27, y: y + 0.06, w: 2.15, h: 0.54, valign: "middle" });
    });
    // path A
    const ax = 4.35, aw = 5.15;
    R(s, ax, 1.6, aw, 1.95, { fill: C.indigo, ft: 86, line: C.indigo, lw: 1.5, round: 0.08 });
    T(s, "PATH A · DEPLOYED (production)", { x: ax + 0.2, y: 1.72, w: aw - 0.4, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.indigo });
    T(s, "Vercel serverless function", { x: ax + 0.2, y: 1.98, w: aw - 0.4, h: 0.32, fontSize: 15, bold: true });
    T(s, [
      { text: "frontend/app/api/verify/route.ts", options: { fontFace: MONO, fontSize: 11, color: C.text, breakLine: true } },
      { text: "POST /api/verify · six stages inline in TypeScript · Promise.all within each stage · maxDuration 60 s · REST calls to Gemini and Tavily", options: { fontSize: 12.5, color: C.muted } },
    ], { x: ax + 0.2, y: 2.35, w: aw - 0.4, h: 1.1 });
    // path B
    R(s, ax, 3.9, aw, 2.45, { fill: C.panel, line: C.muted, lw: 1.25, dash: "dash", round: 0.08 });
    T(s, "PATH B · ALTERNATIVE BACKEND", { x: ax + 0.2, y: 4.02, w: aw - 0.4, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    T(s, "FastAPI + Uvicorn + LangGraph", { x: ax + 0.2, y: 4.28, w: aw - 0.4, h: 0.32, fontSize: 15, bold: true });
    const pb = [["routes.py", "POST /api/verify · POST /api/verify/stream (SSE)"], ["graph.py", "StateGraph: 6 nodes, linear edges → END"], ["services/", "GeminiProvider (retry, cache) · TavilySearchService"], ["types/models.py", "Pydantic request/response models"]];
    pb.forEach((b, i) => T(s, [{ text: b[0].padEnd(16, " "), options: { fontFace: MONO, fontSize: 10.5, bold: true, color: C.text } }, { text: b[1], options: { fontSize: 12, color: C.muted } }], { x: ax + 0.2, y: 4.7 + i * 0.4, w: aw - 0.35, h: 0.36, valign: "middle" }));
    // externals
    const ex = 10.2, ew = CW - (ex - M);
    R(s, ex, 1.6, ew, 4.75, { fill: C.panel, line: C.line, round: 0.08 });
    T(s, "EXTERNAL APIs", { x: ex + 0.18, y: 1.72, w: ew - 0.3, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    R(s, ex + 0.15, 2.1, ew - 0.3, 1.75, { fill: C.bg, line: C.line, round: 0.05 });
    T(s, [{ text: "Google Gemini API", options: { bold: true, fontSize: 14, breakLine: true } }, { text: "LLM for extraction, stance, reasoning, summary · default gemini-flash-lite-latest · temperature 0.1", options: { fontSize: 11.5, color: C.muted } }], { x: ex + 0.3, y: 2.2, w: ew - 0.6, h: 1.55 });
    R(s, ex + 0.15, 4.1, ew - 0.3, 2.05, { fill: C.bg, line: C.line, round: 0.05 });
    T(s, [{ text: "Tavily Search API", options: { bold: true, fontSize: 14, breakLine: true } }, { text: "web evidence per claim · ≤5 results · basic depth · include_answer = false", options: { fontSize: 11.5, color: C.muted } }], { x: ex + 0.3, y: 4.2, w: ew - 0.6, h: 1.85 });
    // arrows
    line(s, M + 2.65, 2.55, ax, 2.55, { color: C.indigo, w: 2 });
    T(s, "default", { x: M + 2.72, y: 2.2, w: 1.0, h: 0.3, fontFace: MONO, fontSize: 9.5, color: C.indigo });
    line(s, M + 2.65, 5.1, ax, 5.1, { color: C.muted, w: 1.5, dash: "dash" });
    T(s, "if NEXT_PUBLIC_\nAPI_URL is set", { x: M + 2.72, y: 4.5, w: 1.05, h: 0.55, fontFace: MONO, fontSize: 8.5, color: C.muted });
    line(s, ax + aw, 2.55, ex, 2.55, { color: C.indigo, w: 2 });
    line(s, ax + aw, 5.1, ex, 5.1, { color: C.muted, w: 1.5, dash: "dash" });
    T(s, [
      { text: "Both paths return the same VerificationReport JSON ", options: { bold: true } },
      { text: "(Pydantic models ≡ TypeScript interfaces). Solid = deployed path. Dashed = used only when the frontend is pointed at the FastAPI service. The SSE stream is not consumed by the UI." },
    ], { x: M, y: 6.45, w: CW, h: 0.5, fontSize: 12.5, color: C.muted });
  }

  // ---------- 7 · Why agents ----------
  {
    const s = newSlide(SEC_B, "B · DESIGN RATIONALE — 07", "Why decompose instead of one large prompt?", [1, 2, 3, 4, 5, 6]);
    T(s, "SINGLE-PROMPT APPROACH", { x: M, y: 1.55, w: 5, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    const box = (x, y, w, h, t, col, o = {}) => { R(s, x, y, w, h, { fill: o.fill || C.panel, ft: o.ft || 0, line: col, lw: 1.25, round: 0.06 }); T(s, t, { x, y, w, h, align: "center", valign: "middle", fontSize: o.fs || 14, bold: true, color: o.tc || C.text }); };
    box(M, 1.9, 1.6, 0.65, "Input", C.grey);
    line(s, M + 1.6, 2.22, M + 2.05, 2.22, { color: C.grey });
    box(M + 2.05, 1.9, 3.0, 0.65, "One LLM prompt", C.grey);
    line(s, M + 5.05, 2.22, M + 5.5, 2.22, { color: C.grey });
    box(M + 5.5, 1.9, 1.6, 0.65, "Answer", C.grey);
    T(s, "Intermediate steps stay inside the model — nothing to inspect, store or reuse.", { x: M + 7.4, y: 1.9, w: 4.7, h: 0.65, fontSize: 13.5, italic: true, color: C.muted, valign: "middle" });
    T(s, "TRUTHLENS PIPELINE", { x: M, y: 2.85, w: 5, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.indigo });
    const st = [["Input", "text"], ["Claims", "Claim[]"], ["Search", "SearchResult[]"], ["Evidence", "EvidenceItem[]"], ["Reasoning", "verdict + why"], ["Confidence", "0–100"], ["Report", "Report JSON"]];
    const bw = 1.45, g = (CW - 7 * bw) / 6;
    st.forEach((t, i) => {
      const x = M + i * (bw + g);
      box(x, 3.2, bw, 0.7, t[0], C.indigo, { fill: i === 0 ? C.panel : C.indigo, ft: i === 0 ? 0 : 82, fs: 14 });
      T(s, t[1], { x: x - 0.1, y: 3.97, w: bw + 0.2, h: 0.25, fontFace: MONO, fontSize: 9.5, color: C.teal, align: "center" });
      if (i < 6) line(s, x + bw + 0.03, 3.55, x + bw + g - 0.03, 3.55, { color: C.indigo, w: 1.5 });
    });
    const col = (x, w, head, colKey, items) => {
      T(s, head, { x, y: 4.5, w, h: 0.3, fontFace: MONO, fontSize: 11, bold: true, color: C[colKey] });
      T(s, items.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1 } })), { x, y: 4.85, w, h: 1.45, fontSize: 14, paraSpaceAfter: 3 });
    };
    col(M, 5.9, "ADVANTAGES", "teal", ["Separation of concerns: one prompt, one job", "Explicit intermediate records for every claim", "Claims processed independently and in parallel", "Failures are localised; stages are replaceable"]);
    col(M + 6.25, 5.9, "TRADE-OFFS", "coral", ["Up to 2N + 2 Gemini + N Tavily calls per request", "More latency and API cost than a single call", "Early errors (bad extraction) propagate downstream", "Pipeline logic is duplicated in two codebases"]);
    R(s, M, 6.38, CW, 0.005, { fill: C.line });
    T(s, "Decomposition buys inspectability and maintainability — it does not by itself guarantee higher accuracy.", { x: M, y: 6.42, w: CW, h: 0.32, fontFace: "Cambria", italic: true, fontSize: 14.5, color: C.text });
  }

  // ---------- 8 · Six stages ----------
  {
    const s = newSlide(SEC_B, "B · AGENT ROLES — 08", "Six specialised stages, mapped to the source", [1, 2, 3, 4, 5, 6]);
    const H = ["#", "AGENT · FILE · FUNCTION", "INPUT", "RESPONSIBILITY", "OUTPUT", "WHY A SEPARATE STAGE"].map((h) => hcell(h));
    const r = [
      ["Claim Extraction", "claim_extraction.py", "extract_claims()", "Original text", "Gemini prompt keeps factual, verifiable claims; drops opinions and predictions", "list[Claim{id,text}]", "Every later stage works per claim"],
      ["Search", "search_agent.py", "search_for_claims()", "Claims", "Tavily query “fact check verify: <claim>”, ≤5 results, all claims concurrently", "{claim_id: SearchResult[]}", "Pure I/O, no LLM; isolates network failures"],
      ["Evidence Analysis", "evidence_agent.py", "analyze_evidence()", "Claim + its results", "One batched Gemini call per claim: summary + stance per source", "EvidenceItem[]", "Relevance ≠ support; creates a traceable record"],
      ["Reasoning", "reasoning_agent.py", "reason_over_evidence()", "Claim + evidence JSON", "Gemini weighs the sources and selects one of five verdicts with an explanation", "verdict, reasoning, confidence", "Cross-source judgement is a distinct task"],
      ["Confidence", "confidence_agent.py", "score_confidence()", "Verdict, evidence, initial confidence", "Clamps to 0–100; caps at 20 with no evidence; heuristic/LLM only if initial ≤ 0", "int 0–100", "Hook for future calibration"],
      ["Report", "report_agent.py", "generate_report()", "ClaimResult[]", "Weighted trust score (formula) + Gemini summary + timestamp", "VerificationReport", "Deterministic aggregation, kept apart from judgement"],
    ];
    const data = [H, ...r.map((x, i) => [
      cell(String(i + 1), { fontFace: MONO, bold: true, fontSize: 14, color: C.text, fill: { color: C.indigo, transparency: 70 }, align: "center" }),
      { text: [{ text: x[0], options: { bold: true, fontSize: 13, color: C.text, breakLine: true } }, { text: x[1] + " · " + x[2], options: { fontFace: MONO, fontSize: 9.5, color: C.indigo } }], options: { valign: "middle", margin: [3, 6, 3, 6] } },
      cell(x[3], { fontSize: 12, color: C.muted }),
      cell(x[4], { fontSize: 12 }),
      cell(x[5], { fontFace: MONO, fontSize: 10.5, color: C.teal }),
      cell(x[6], { fontSize: 12, color: C.muted }),
    ])];
    s.addTable(data, { x: M, y: 1.55, w: CW, colW: [0.45, 2.55, 1.45, 3.55, 1.95, 2.18], rowH: [0.34, 0.68, 0.68, 0.68, 0.68, 0.68, 0.68], border: BORDER, objectName: nm("table") });
    T(s, [
      { text: "Orchestration  ", options: { fontFace: MONO, fontSize: 10.5, bold: true, color: C.indigo } },
      { text: "backend/app/agents/graph.py · TruthLensWorkflow (LangGraph). The deployed route.ts mirrors stages 1–4 and 6 inline; stages 4 and 5 are merged there (confidence comes straight from reasoning).", options: { fontSize: 13 } },
    ], { x: M, y: 6.3, w: CW, h: 0.55, valign: "middle" });
  }

  // ---------- 9 · LangGraph ----------
  {
    const s = newSlide(SEC_B, "B · ORCHESTRATION — 09", "LangGraph StateGraph: explicit state, linear DAG", [1, 2, 3, 4, 5, 6]);
    const nodes = [["START", "set_entry_point", null], ["extract_claims", "→ claims", 1], ["search_sources", "→ search_results", 2], ["analyze_evidence", "→ evidence", 3], ["reason", "→ claim_results", 4], ["score_confidence", "→ claim_results (confidence)", 5], ["generate_report", "→ report", 6], ["END", "compile() → ainvoke / astream", null]];
    const nh = 0.48, ng = 0.17, nx = M, nw = 2.5;
    nodes.forEach((n, i) => {
      const y = 1.6 + i * (nh + ng);
      const term = n[2] === null;
      R(s, nx + (term ? 0.45 : 0), y, term ? nw - 0.9 : nw, nh, { fill: term ? C.panel : C.indigo, ft: term ? 0 : 80, line: term ? C.muted : C.indigo, lw: 1.25, round: term ? nh / 2 : 0.06 });
      T(s, n[0], { x: nx, y, w: nw, h: nh, align: "center", valign: "middle", fontFace: MONO, fontSize: 12, bold: true, color: term ? C.muted : C.text });
      T(s, n[1], { x: nx + nw + 0.2, y, w: 2.95, h: nh, valign: "middle", fontFace: MONO, fontSize: 10.5, color: term ? C.muted : C.teal });
      if (i < nodes.length - 1) line(s, nx + nw / 2, y + nh, nx + nw / 2, y + nh + ng, { color: C.indigo, w: 1.5 });
    });
    const cx = 6.35, cw2 = CW - (cx - M);
    codePanel(s, cx, 1.55, cw2, 3.2, [
      { text: "class GraphState(TypedDict):", options: { color: C.indigo, bold: true } },
      "    original_text: str",
      "    claims: list[Claim]",
      "    search_results: dict",
      "    evidence: dict",
      "    claim_results: list[ClaimResult]",
      "    report: VerificationReport | None",
      "    current_step: str",
      "",
      { text: "async def _node_extract_claims(self, state):", options: { color: C.indigo, bold: true } },
      "    claims = await extract_claims(",
      "        state[\"original_text\"], self.llm)",
      "    return {**state, \"claims\": claims,",
      "            \"current_step\": \"extract_claims\"}",
    ], { fs: 10.5, label: "backend/app/agents/graph.py" });
    const b = [
      ["Topology  ", "1 entry, 6 nodes, 6 edges, END — no conditional edges or cycles (deterministic workflow, not self-planning agents)."],
      ["Execution  ", "ainvoke() serves /api/verify; astream() yields one update per node for the SSE endpoint /api/verify/stream."],
      ["Concurrency  ", "inside reason and score_confidence, per-claim work runs with asyncio.gather."],
      ["Why explicit state  ", "inspectable, serialisable (model_dump() between nodes), streamable, ready for conditional routing (future)."],
    ];
    T(s, b.map((x, i) => [{ text: x[0], options: { bold: true, color: C.indigo } }, { text: x[1], options: { breakLine: i < b.length - 1 } }]).flat(), { x: cx, y: 4.9, w: cw2, h: 1.85, fontSize: 13, paraSpaceAfter: 4 });
  }

  // ---------- 10 · Claim extraction ----------
  pres.addSection({ title: SEC_C });
  {
    const s = newSlide(SEC_C, "C · STAGE 1 — 10", "Claim extraction: decompose before you verify", [1]);
    const fl = [["Input text", "10–10,000 chars"], ["CLAIM_EXTRACTION_PROMPT", "rules + JSON shape"], ["Gemini", "temperature 0.1"], ["extract_json()", "3-step parser"], ["list[Claim]", "{id, text}"]];
    const bw = 2.1, g = (CW - 5 * bw) / 4;
    fl.forEach((f, i) => {
      const x = M + i * (bw + g);
      R(s, x, 1.6, bw, 0.78, { fill: i === 2 ? C.indigo : C.panel, ft: i === 2 ? 80 : 0, line: i === 2 ? C.indigo : C.line, lw: 1.25, round: 0.06 });
      T(s, [{ text: f[0], options: { fontFace: i === 1 || i === 3 ? MONO : "Calibri", fontSize: i === 1 ? 9 : 13.5, bold: true, breakLine: true } }, { text: f[1], options: { fontSize: 11, color: C.muted } }], { x: x + 0.05, y: 1.6, w: bw - 0.1, h: 0.78, align: "center", valign: "middle" });
      if (i < 4) line(s, x + bw + 0.03, 1.99, x + bw + g - 0.03, 1.99, { color: C.indigo, w: 1.5 });
    });
    codePanel(s, M, 2.7, 5.75, 2.35, [
      "Rules:",
      "- Split into independent factual claims",
      "- Ignore opinions, predictions, and",
      "  subjective statements",
      "- Each claim should be self-contained and",
      "  verifiable via web search",
      "- Return ONLY valid JSON",
      { text: "[{\"id\": 1, \"text\": \"factual claim here\"}, ...]", options: { color: C.teal } },
    ], { fs: 11, label: "backend/app/utils/prompts.py · CLAIM_EXTRACTION_PROMPT" });
    T(s, [
      { text: "Parsing  ", options: { bold: true, color: C.indigo } },
      { text: "json.loads → ```json fence → regex for [ … ] or { … }", options: { fontFace: MONO, fontSize: 11.5, breakLine: true } },
      { text: "On failure  ", options: { bold: true, color: C.indigo } },
      { text: "backend raises ValueError → HTTP 422; deployed route falls back to the whole text as one claim." },
    ], { x: M, y: 5.2, w: 5.75, h: 1.3, fontSize: 13.5, paraSpaceAfter: 4 });
    const rx = 6.75, rw = CW - (rx - M);
    T(s, "LIVE RUN · 1 MESSAGE → 4 CLAIMS", { x: rx, y: 2.7, w: rw, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    REPORT.claims.forEach((c, i) => {
      const y = 3.05 + i * 0.7;
      const flag = i === 1;
      R(s, rx, y, rw, 0.58, { fill: C.panel, line: flag ? C.amber : C.line, lw: flag ? 1.5 : 1, round: 0.05 });
      T(s, String(c.claim.id), { x: rx + 0.12, y, w: 0.4, h: 0.58, fontFace: MONO, fontSize: 14, bold: true, color: flag ? C.amber : C.indigo, valign: "middle" });
      T(s, c.claim.text, { x: rx + 0.55, y, w: rw - 0.7, h: 0.58, fontSize: 14, valign: "middle" });
    });
    T(s, [
      { text: "Claim 2 lost its subject ", options: { bold: true, color: C.amber } },
      { text: "— “the acquisition” of what? The search then drifted to an unrelated company (slide 21)." },
    ], { x: rx, y: 5.9, w: rw, h: 0.6, fontSize: 13 });
    src(s, "backend/app/agents/claim_extraction.py · extract_claims()   ·   backend/app/utils/json_helpers.py · extract_json()   ·   route.ts Step 1");
  }

  // ---------- 11 · Retrieval ----------
  {
    const s = newSlide(SEC_C, "C · STAGE 2 — 11", "External evidence retrieval with Tavily", [2]);
    const cy = [1.95, 2.75, 3.55, 4.35];
    REPORT.claims.forEach((c, i) => {
      R(s, M, cy[i], 2.45, 0.58, { fill: C.panel, line: C.line, round: 0.05 });
      T(s, [{ text: `C${c.claim.id}  `, options: { fontFace: MONO, bold: true, color: C.indigo } }, { text: c.claim.text.slice(0, 34) + (c.claim.text.length > 34 ? "…" : "") }], { x: M + 0.12, y: cy[i], w: 2.25, h: 0.58, fontSize: 11.5, valign: "middle" });
      line(s, M + 2.45, cy[i] + 0.29, 3.6, cy[i] + 0.29, { color: C.indigo, w: 1.5 });
      line(s, 4.95, cy[i] + 0.29, 5.35, cy[i] + 0.29, { color: C.teal, w: 1.5 });
      R(s, 5.35, cy[i], 0.95, 0.58, { fill: C.teal, ft: 85, line: C.teal, lw: 1, round: 0.05 });
      T(s, "≤ 5", { x: 5.35, y: cy[i], w: 0.95, h: 0.58, align: "center", valign: "middle", fontFace: MONO, fontSize: 13, bold: true, color: C.teal });
    });
    R(s, 3.6, 1.95, 1.35, 2.98, { fill: C.indigo, ft: 82, line: C.indigo, lw: 1.5, round: 0.06 });
    T(s, [{ text: "Tavily", options: { bold: true, fontSize: 15, breakLine: true } }, { text: "/search", options: { fontFace: MONO, fontSize: 11, color: C.muted } }], { x: 3.6, y: 1.95, w: 1.35, h: 2.98, align: "center", valign: "middle" });
    T(s, "PARALLEL FAN-OUT", { x: M, y: 1.6, w: 5, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    T(s, [
      { text: "asyncio.gather", options: { fontFace: MONO, color: C.indigo, bold: true } }, { text: " (backend) · " },
      { text: "Promise.all", options: { fontFace: MONO, color: C.indigo, bold: true } }, { text: " (deployed): total search time ≈ slowest single search, not the sum." },
    ], { x: M, y: 5.15, w: 5.7, h: 0.7, fontSize: 13 });
    T(s, [
      { text: "Why per claim?  ", options: { bold: true, color: C.indigo } },
      { text: "One query mixing four assertions returns pages about the most prominent topic and misses the rest." },
    ], { x: M, y: 5.85, w: 5.7, h: 0.75, fontSize: 13 });
    const tx = 6.75, tw = CW - (tx - M);
    const rows = [
      ["query", "\"fact check verify: \" + claim.text"],
      ["max_results", "5"],
      ["search_depth", "\"basic\"  (TAVILY_SEARCH_DEPTH)"],
      ["include_answer", "False — reason over sources only"],
      ["title, url", "copied to SearchResult"],
      ["content → snippet", "page extract used as evidence text"],
      ["published_date", "→ publication_date (null if absent)"],
    ];
    s.addTable([[hcell("PARAMETER / FIELD"), hcell("VALUE IN CODE")], ...rows.map((r) => [cell(r[0], { fontFace: MONO, fontSize: 11, color: C.teal }), cell(r[1], { fontSize: 12.5 })])], { x: tx, y: 1.6, w: tw, colW: [2.15, tw - 2.15], rowH: 0.42, border: BORDER, objectName: nm("table") });
    R(s, tx, 5.15, tw, 1.45, { fill: C.panel, line: C.line, round: 0.06 });
    T(s, [
      { text: "RELIABILITY", options: { fontFace: MONO, fontSize: 10, bold: true, color: C.muted, breakLine: true } },
      { text: "Backend: ", options: { bold: true } }, { text: "10-min in-memory cache keyed query::max::depth; async client → sync client in a thread → [] on failure.", options: { breakLine: true } },
      { text: "Deployed route: ", options: { bold: true } }, { text: "no cache; non-OK response or exception → []." },
    ], { x: tx + 0.2, y: 5.25, w: tw - 0.4, h: 1.3, fontSize: 12.5 });
    src(s, "agents/search_agent.py · search_for_claims()   ·   services/tavily.py · TavilySearchService.search()   ·   route.ts · callTavily()");
  }

  // ---------- 12 · Evidence ----------
  {
    const s = newSlide(SEC_C, "C · STAGE 3 — 12", "Evidence analysis: a search hit is not proof", [3]);
    codePanel(s, M, 1.55, 3.85, 1.95, [
      { text: "class EvidenceItem(BaseModel):", options: { color: C.indigo, bold: true } },
      "  source_title: str",
      "  source_url: str",
      "  summary: str",
      { text: "  stance: Literal[\"supports\",", options: { color: C.teal } },
      { text: "    \"contradicts\", \"neutral\"]", options: { color: C.teal } },
    ], { fs: 11, label: "types/models.py" });
    const imp = ["One batched Gemini call per claim (≤5 sources)", "Snippet truncated to 400 characters", "Answers mapped back by index", "Invalid stance → neutral", "Parse failure → all neutral + raw snippet"];
    T(s, "HOW IT IS IMPLEMENTED", { x: M, y: 3.7, w: 3.85, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    T(s, imp.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < imp.length - 1 } })), { x: M, y: 4.0, w: 3.85, h: 2.1, fontSize: 13.5, paraSpaceAfter: 4 });
    const mx = 4.75, mw = 4.25;
    T(s, "ILLUSTRATIVE EXAMPLE — not real search results", { x: mx, y: 1.55, w: mw, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.amber });
    const ex = [["Supporting article", "supports", "teal", "Aligns with the claim"], ["Conflicting article", "contradicts", "coral", "Challenges the claim"], ["Background article", "neutral", "grey", "Related, but does not prove it"]];
    s.addTable([[hcell("EVIDENCE ITEM"), hcell("STANCE"), hcell("INTERPRETATION")], ...ex.map((e) => [cell(e[0], { fontSize: 12.5 }), cell(e[1], { fontFace: MONO, fontSize: 11, bold: true, color: C[e[2]], fill: { color: C[e[2]], transparency: 85 } }), cell(e[3], { fontSize: 12.5, color: C.muted })])], { x: mx, y: 1.9, w: mw, colW: [1.45, 1.35, 1.45], rowH: [0.34, 0.62, 0.62, 0.62], border: BORDER, objectName: nm("table") });
    T(s, [
      { text: "Why this layer matters  ", options: { bold: true, color: C.indigo, breakLine: true } },
      { text: "Relevance ≠ support. Stance records make each verdict traceable to named sources — they feed the reasoning prompt, the UI stance badges and the JSON export." },
    ], { x: mx, y: 4.35, w: mw, h: 1.75, fontSize: 13.5 });
    const rx = 9.3, rw = CW - (rx - M);
    T(s, "REAL DATA · LIVE RUN", { x: rx, y: 1.55, w: rw, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    const cnt = (c, k) => c.evidence.filter((e) => e.stance === k).length;
    const labels = REPORT.claims.map((c) => "Claim " + c.claim.id);
    s.addChart(pres.charts.BAR, [
      { name: "supports", labels, values: REPORT.claims.map((c) => cnt(c, "supports")) },
      { name: "contradicts", labels, values: REPORT.claims.map((c) => cnt(c, "contradicts")) },
      { name: "neutral", labels, values: REPORT.claims.map((c) => cnt(c, "neutral")) },
    ], {
      x: rx - 0.1, y: 1.85, w: rw + 0.1, h: 3.9, barDir: "bar", barGrouping: "stacked", objectName: nm("chart"),
      chartColors: [HEX.teal, HEX.coral, HEX.grey], showValue: true, dataLabelPosition: "ctr", dataLabelColor: HEX.bg, dataLabelFontSize: 11, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: "0;;;",
      catAxisLabelColor: HEX.muted, valAxisLabelColor: HEX.muted, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 11, valAxisLabelFontSize: 10,
      valAxisMaxVal: 5, valAxisMajorUnit: 1, valGridLine: { color: HEX.line, size: 0.5 }, catGridLine: { style: "none" }, catAxisOrientation: "maxMin",
      showLegend: true, legendPos: "b", legendFontSize: 10.5, legendColor: HEX.muted, legendFontFace: "+mn-lt",
      showTitle: true, title: "Source stances per claim (5 each)", titleColor: HEX.text, titleFontSize: 12, titleFontFace: "+mn-lt",
    });
    T(s, "Only claim 3 (“ChatGPT … next month”) drew decisive evidence: 4 contradicting, 1 neutral.", { x: rx, y: 5.8, w: rw, h: 0.8, fontSize: 12, color: C.muted });
    src(s, "backend/app/agents/evidence_agent.py · _analyze_claim_evidence()   ·   prompts.py · BATCH_EVIDENCE_ANALYSIS_PROMPT   ·   route.ts Step 3");
  }

  // ---------- 13 · Reasoning ----------
  {
    const s = newSlide(SEC_C, "C · STAGE 4 — 13", "Reasoning agent: from evidence to a verdict", [4]);
    const fl = [["Claim + evidence JSON", "source, url, summary, stance"], ["REASONING_PROMPT", "5 verdict definitions + criteria"], ["Gemini", "temperature 0.1"], ["{verdict, confidence,\n reasoning}", "JSON"], ["Validation", "enum + clamp + fallback"]];
    const bw = 2.1, g = (CW - 5 * bw) / 4;
    fl.forEach((f, i) => {
      const x = M + i * (bw + g);
      R(s, x, 1.6, bw, 0.82, { fill: i === 2 ? C.indigo : C.panel, ft: i === 2 ? 80 : 0, line: i === 2 ? C.indigo : C.line, lw: 1.25, round: 0.06 });
      T(s, [{ text: f[0], options: { fontFace: i === 1 || i === 3 ? MONO : "Calibri", fontSize: i === 1 || i === 3 ? 10.5 : 13.5, bold: true, breakLine: true } }, { text: f[1], options: { fontSize: 10.5, color: C.muted } }], { x: x + 0.08, y: 1.6, w: bw - 0.16, h: 0.82, align: "center", valign: "middle" });
      if (i < 4) line(s, x + bw + 0.03, 2.01, x + bw + g - 0.03, 2.01, { color: C.indigo, w: 1.5 });
    });
    T(s, "CRITERIA GIVEN TO THE MODEL", { x: M, y: 2.75, w: 5.6, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    const cr = ["Source quality and credibility", "Number of corroborating sources and their agreement", "Direct relevance and recency of evidence", "Insufficient evidence → UNSUPPORTED"];
    T(s, cr.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < cr.length - 1 } })), { x: M, y: 3.05, w: 5.6, h: 1.35, fontSize: 14, paraSpaceAfter: 3 });
    T(s, "GUARDS IN CODE", { x: M, y: 4.5, w: 5.6, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    const gd = [["no evidence", "UNSUPPORTED · 15 · no LLM call"], ["verdict ∉ enum", "UNSUPPORTED"], ["confidence", "clamped 0–100 (default 70 / 50 if missing)"], ["unparseable", "UNSUPPORTED · 20"]];
    gd.forEach((g2, i) => T(s, [{ text: g2[0].padEnd(15, " "), options: { fontFace: MONO, fontSize: 11, color: C.amber, bold: true } }, { text: g2[1], options: { fontSize: 13 } }], { x: M, y: 4.8 + i * 0.36, w: 5.7, h: 0.34, valign: "middle" }));
    const rx = 6.65, rw = CW - (rx - M);
    const c3 = REPORT.claims[2];
    R(s, rx, 2.75, rw, 3.25, { fill: C.panel, line: C.coral, lw: 1.25, round: 0.08 });
    T(s, "REAL OUTPUT · CLAIM 3", { x: rx + 0.25, y: 2.88, w: 3, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    chip(s, rx + rw - 1.95, 2.85, 1.7, 0.36, `FALSE · ${c3.confidence}`, C.coral, { fs: 11 });
    T(s, "“" + c3.claim.text + "”", { x: rx + 0.25, y: 3.3, w: rw - 0.5, h: 0.6, fontSize: 15, bold: true });
    T(s, c3.reasoning, { x: rx + 0.25, y: 3.95, w: rw - 0.5, h: 1.55, fontSize: 13, italic: true, color: C.muted });
    T(s, "input stances: 4 contradicts · 1 neutral", { x: rx + 0.25, y: 5.55, w: rw - 0.5, h: 0.3, fontFace: MONO, fontSize: 10.5, color: C.coral });
    T(s, [
      { text: "Semantic judgement, not a theorem prover. ", options: { bold: true } },
      { text: "Claim 1 had five neutral sources yet came out FALSE (95): the model inferred “partnership, not acquisition” from what the sources did say." },
    ], { x: rx, y: 6.07, w: rw, h: 0.62, fontSize: 12.5 });
    src(s, "backend/app/agents/reasoning_agent.py · reason_over_evidence()   ·   prompts.py · REASONING_PROMPT   ·   route.ts Steps 4 & 5");
  }

  // ---------- 14 · Confidence ----------
  {
    const s = newSlide(SEC_C, "C · STAGES 5–6 — 14", "Confidence and the overall trust score", [5, 6]);
    R(s, M, 1.55, 6.0, 1.45, { fill: C.panel, line: C.line, round: 0.08 });
    T(s, [
      { text: "Trust = ", options: {} },
      { text: "100", options: {} }, { text: " / N", options: {} },
      { text: "  ·  Σ  ", options: { color: C.indigo } },
      { text: "W", options: {} }, { text: "i", options: { subscript: true } },
      { text: " · (C", options: {} }, { text: "i", options: { subscript: true } }, { text: " / 100)", options: {} },
    ], { x: M + 0.25, y: 1.65, w: 5.6, h: 0.8, fontFace: "Cambria", fontSize: 24, bold: true, valign: "middle" });
    T(s, [
      { text: "N", options: { fontFace: MONO, bold: true, color: C.indigo } }, { text: " claims   " },
      { text: "Wᵢ", options: { fontFace: MONO, bold: true, color: C.indigo } }, { text: " verdict weight   " },
      { text: "Cᵢ", options: { fontFace: MONO, bold: true, color: C.indigo } }, { text: " model confidence 0–100" },
    ], { x: M + 0.25, y: 2.5, w: 5.6, h: 0.35, fontSize: 13, color: C.muted });
    T(s, "VERDICT WEIGHTS  Wᵢ", { x: M, y: 3.2, w: 4, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    const wt = [["TRUE", 1.0, "teal"], ["PARTIALLY_TRUE", 0.7, "teal"], ["UNSUPPORTED", 0.5, "grey"], ["MISLEADING", 0.3, "amber"], ["FALSE", 0.0, "coral"]];
    wt.forEach((w, i) => {
      const y = 3.52 + i * 0.4;
      T(s, w[0], { x: M, y, w: 1.85, h: 0.32, fontFace: MONO, fontSize: 10.5, bold: true, color: C[w[2]], valign: "middle" });
      R(s, M + 1.95, y + 0.06, 3.3, 0.2, { fill: C.line });
      if (w[1] > 0) R(s, M + 1.95, y + 0.06, 3.3 * w[1], 0.2, { fill: C[w[2]] });
      T(s, w[1].toFixed(1), { x: M + 5.35, y, w: 0.6, h: 0.32, fontFace: MONO, fontSize: 12, bold: true, valign: "middle", align: "right" });
    });
    T(s, "Intuition: verdict = how good the claim is; confidence = how sure we are. MISLEADING sits below UNSUPPORTED — deception is worse than missing evidence.", { x: M, y: 5.6, w: 6.0, h: 0.95, fontSize: 13, color: C.muted });
    // worked example
    const rx = 6.95, rw = CW - (rx - M);
    T(s, "WORKED EXAMPLE · LIVE RUN", { x: rx, y: 1.55, w: rw, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    const wmap = { TRUE: 1, PARTIALLY_TRUE: 0.7, MISLEADING: 0.3, UNSUPPORTED: 0.5, FALSE: 0 };
    let sum = 0;
    const rows = REPORT.claims.map((c) => { const v = wmap[c.verdict] * c.confidence / 100; sum += v; return [String(c.claim.id), c.verdict, wmap[c.verdict].toFixed(1), String(c.confidence), v.toFixed(3)]; });
    const mean = sum / REPORT.claims.length;
    const tbl = [[hcell("#"), hcell("VERDICT"), hcell("W"), hcell("C"), hcell("W·C/100")], ...rows.map((r) => r.map((t, j) => cell(t, { fontFace: MONO, fontSize: 11.5, color: j === 1 ? C[VCOL[t]] : C.text, align: j >= 2 ? "right" : "left" }))),
      [cell("", {}), cell("Σ = " + sum.toFixed(3) + "   ÷ 4 = " + mean.toFixed(5) + "   × 100 → " + Math.round(mean * 100) + "  ✓ app showed 24", { fontFace: MONO, fontSize: 11, bold: true, color: C.teal, colspan: 4 })]];
    s.addTable(tbl, { x: rx, y: 1.85, w: rw, colW: [0.45, 1.9, 0.75, 0.75, rw - 3.85], rowH: 0.34, border: BORDER, objectName: nm("table") });
    codePanel(s, rx, 4.05, rw, 1.25, [
      { text: "if initial_confidence is not None and initial_confidence > 0:", options: { color: C.amber } },
      "    if not evidence: return min(initial_confidence, 20)",
      "    return max(0, min(100, initial_confidence))",
    ], { fs: 10, label: "confidence_agent.py · score_confidence() — fast path" });
    const hn = [
      "Heuristic / second LLM prompt runs only if initial confidence ≤ 0 — not an independent model or learned calibration",
      "Deployed route has no separate stage: it uses the reasoning confidence",
      "Not calibrated probabilities; mixes uncertainty with falsity",
      "Rounding: route uses Math.round, backend int() truncates (±1 point)",
    ];
    T(s, hn.map((t, i) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: i < hn.length - 1 } })), { x: rx, y: 5.4, w: rw, h: 1.3, fontSize: 12, paraSpaceAfter: 2 });
    src(s, "backend/app/agents/report_agent.py · compute_overall_trust_score()   ·   confidence_agent.py   ·   route.ts Step 6 (verdictWeights)");
  }

  // ---------- 15 · Report ----------
  {
    const s = newSlide(SEC_C, "C · STAGE 6 — 15", "A structured report, not a chat answer", [6]);
    codePanel(s, M, 1.55, 6.35, 5.1, [
      "{",
      { text: "  \"original_text\": \"Breaking: Apple has acquired…\",", options: {} },
      { text: "  \"claims\": [ …, {", options: {} },
      { text: "    \"claim\": { \"id\": 3, \"text\": \"ChatGPT will be", options: {} },
      { text: "        integrated into all Apple devices…\" },", options: {} },
      { text: "    \"verdict\": \"FALSE\",", options: { color: C.coral } },
      { text: "    \"confidence\": 95,", options: { color: C.indigo } },
      "    \"reasoning\": \"The collected evidence, including…\",",
      "    \"evidence\": [ {",
      "      \"source_title\": \"Introducing Apple Intelligence…\",",
      "      \"source_url\": \"https://www.apple.com/newsroom/…\",",
      "      \"summary\": \"…'later this year,' which directly…\",",
      { text: "      \"stance\": \"contradicts\" }, … ],", options: { color: C.coral } },
      "    \"sources\": [ { \"title\", \"url\", \"snippet\",",
      "                 \"publication_date\": null }, … ] } ],",
      { text: "  \"overall_trust_score\": 24,", options: { color: C.teal } },
      "  \"summary\": \"An analysis of the report regarding…\",",
      "  \"generated_at\": \"2026-11-17T02:29:02.800Z\"",
      "}",
    ], { fs: 10.5, label: "REAL OUTPUT (trimmed) · truthlens-report.json" });
    const rx = 7.3, rw = CW - (rx - M);
    const tb = (y, h, head, fields, col) => {
      R(s, rx, y, rw, h, { fill: C.panel, line: C[col], lw: 1.25, round: 0.06 });
      T(s, [{ text: head, options: { fontFace: MONO, bold: true, fontSize: 12, color: C[col], breakLine: true } }, { text: fields, options: { fontFace: MONO, fontSize: 10.5, color: C.muted } }], { x: rx + 0.18, y: y + 0.08, w: rw - 0.36, h: h - 0.16, valign: "middle" });
    };
    tb(1.55, 0.95, "VerificationReport", "original_text · claims[] · overall_trust_score (0–100) · summary · generated_at", "indigo");
    line(s, rx + 0.5, 2.5, rx + 0.5, 2.68, { color: C.indigo });
    tb(2.68, 0.95, "ClaimResult", "claim · verdict · confidence (0–100) · reasoning · evidence[] · sources[]", "indigo");
    const sub = [["Claim", "id, text"], ["EvidenceItem", "…, stance"], ["SearchResult", "title, url, snippet, date?"]];
    const sw = (rw - 0.3) / 3;
    sub.forEach((x, i) => {
      line(s, rx + 0.5, 3.63, rx + i * (sw + 0.15) + sw / 2, 3.86, { color: C.indigo });
      R(s, rx + i * (sw + 0.15), 3.86, sw, 0.78, { fill: C.panel, line: C.line, round: 0.05 });
      T(s, [{ text: x[0], options: { fontFace: MONO, bold: true, fontSize: 10.5, breakLine: true } }, { text: x[1], options: { fontSize: 10.5, color: C.muted } }], { x: rx + i * (sw + 0.15) + 0.08, y: 3.86, w: sw - 0.16, h: 0.78, align: "center", valign: "middle" });
    });
    T(s, "SAME OBJECT DRIVES", { x: rx, y: 4.85, w: rw, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    const uses = ["UI", "PDF (jsPDF)", "JSON file", "Clipboard", "History ×20"];
    let ux = rx;
    uses.forEach((u) => { const w = 0.3 + u.length * 0.08; chip(s, ux, 5.15, w, 0.36, u, C.teal, { mono: false, fs: 11.5 }); ux += w + 0.1; });
    T(s, [
      { text: "Schema parity  ", options: { bold: true, color: C.indigo } },
      { text: "backend/app/types/models.py (Pydantic, validates ranges) ≡ frontend/types/index.ts (TypeScript). Summary = one Gemini call on the first 500 chars + results; route has a template fallback." },
    ], { x: rx, y: 5.65, w: rw, h: 1.05, fontSize: 12.5 });
  }

  // ---------- 16 · Frontend ----------
  {
    const s = newSlide(SEC_C, "C · FRONTEND — 16", "Frontend: Next.js App Router, real deployed UI");
    img(s, "ui_results.jpg", M, 1.55, 6.9, 4.31, { alt: "TruthLens results page with trust score 24/100 (live deployment)" });
    img(s, "ui_mobile.jpg", 7.7, 1.55, 1.99, 4.31, { alt: "TruthLens on a 390px mobile viewport" });
    T(s, "Desktop, dark mode", { x: M, y: 5.92, w: 4, h: 0.25, fontFace: MONO, fontSize: 9.5, color: C.muted });
    T(s, "Mobile 390 px", { x: 7.7, y: 5.92, w: 2, h: 0.25, fontFace: MONO, fontSize: 9.5, color: C.muted });
    const cx = 9.95, cw2 = CW - (cx - M);
    const comps = [["Header", "brand, history, theme"], ["LandingPage", "textarea, counter, example"], ["LoadingAnimation", "6 stage labels, 1.5 s timer*"], ["ResultsPage", "trust score, summary, exports"], ["ClaimCard", "verdict, confidence, evidence"], ["HistoryPanel", "localStorage slide-over"], ["ThemeToggle", "next-themes light/dark"]];
    comps.forEach((c, i) => T(s, [{ text: c[0], options: { fontFace: MONO, fontSize: 11, bold: true, color: C.indigo, breakLine: true } }, { text: c[1], options: { fontSize: 11.5, color: C.muted } }], { x: cx, y: 1.55 + i * 0.6, w: cw2, h: 0.55 }));
    const j = ["Landing", "Paste text", "Verify", "Loading", "Report", "Evidence", "Export · History"];
    let jx = M; const jy = 6.27;
    j.forEach((t, i) => { const w = 0.45 + t.length * 0.09; R(s, jx, jy, w, 0.36, { fill: C.panel, line: C.line, round: 0.18 }); T(s, t, { x: jx, y: jy, w, h: 0.36, align: "center", valign: "middle", fontSize: 12 }); jx += w; if (i < j.length - 1) { line(s, jx + 0.04, jy + 0.18, jx + 0.26, jy + 0.18, { color: C.indigo }); jx += 0.3; } });
    T(s, "* timer-driven, not wired to server progress: the deployed route returns a single response", { x: cx, y: 5.8, w: cw2, h: 0.5, fontSize: 10.5, italic: true, color: C.amber });
  }

  // ---------- 17 · Backend ----------
  {
    const s = newSlide(SEC_C, "C · BACKEND — 17", "API design and reliability, path by path");
    const rows = [
      ["Request validation", "text ≥ 5 chars (server); UI requires ≥ 10", "Pydantic VerificationRequest: 10–10,000 chars → 422"],
      ["LLM client", "REST generateContent · temperature 0.1", "google-generativeai SDK · temperature 0.1 · Semaphore(5)"],
      ["Retries", "none — per-stage fallbacks instead", "≤ 5 attempts; 429 honours “retry in Ns”, else 2 × 1.5^n s (≤ 10 s)"],
      ["Caching", "none", "in-memory TTL: report 5 min · LLM (SHA-256 of prompt) 10 min · Tavily 10 min"],
      ["Concurrency", "Promise.all within each stage", "asyncio.gather within each stage / node"],
      ["Errors", "fallbacks per stage; 500 + detail", "ValueError → 422; other → 500; Tavily async → sync → []"],
      ["Streaming", "none", "POST /api/verify/stream · SSE from graph.astream (UI does not use it)"],
      ["CORS / origin", "same-origin call from the UI", "CORSMiddleware, origins from CORS_ORIGINS"],
      ["Secrets & limits", "env vars, server-side; maxDuration 60 s", "env vars via pydantic-settings (.env); no timeout set"],
    ];
    s.addTable([[hcell("CONCERN"), hcell("PATH A · NEXT.JS ROUTE (DEPLOYED)", { color: C.indigo }), hcell("PATH B · FASTAPI + LANGGRAPH")], ...rows.map((r) => [cell(r[0], { bold: true, fontSize: 12.5 }), cell(r[1], { fontSize: 12.5, fill: { color: C.indigo, transparency: 90 } }), cell(r[2], { fontSize: 12.5 })])], { x: M, y: 1.55, w: CW, colW: [1.95, 4.0, 6.18], rowH: [0.34, ...Array(9).fill(0.46)], border: BORDER, objectName: nm("table") });
    T(s, "In-memory caches live in one process: lost on restart and not shared across workers or serverless instances. API keys never reach the browser in either path.", { x: M, y: 6.35, w: CW, h: 0.32, fontSize: 12.5, italic: true, color: C.muted });
    src(s, "frontend/app/api/verify/route.ts  ·  backend/app/api/routes.py  ·  services/llm.py · GeminiProvider  ·  main.py · config.py");
  }

  // ---------- 18 · Deployment & data flow ----------
  {
    const s = newSlide(SEC_C, "C · DEPLOYMENT — 18", "One request through the deployed system", [1, 2, 3, 4, 6]);
    const lanes = [["Browser", 1.75], ["Vercel function · /api/verify", 5.0], ["Gemini API", 8.45], ["Tavily API", 11.5]];
    lanes.forEach((l) => {
      R(s, l[1] - 1.2, 1.55, 2.4, 0.45, { fill: C.panel, line: l[0].startsWith("Vercel") ? C.indigo : C.line, lw: 1.25, round: 0.05 });
      T(s, l[0], { x: l[1] - 1.2, y: 1.55, w: 2.4, h: 0.45, align: "center", valign: "middle", fontSize: 12.5, bold: true });
      line(s, l[1], 2.0, l[1], 6.05, { color: C.line, w: 1, dash: "dash", arrow: false });
    });
    const X = { B: 1.75, V: 5.0, G: 8.45, T: 11.5 };
    const msg = [
      ["B", "V", "POST {text}"], ["V", "G", "① extract claims  ×1"], ["V", "T", "② search  ×N  (parallel)"], ["V", "G", "③ evidence stance  ×N  (parallel)"],
      ["V", "G", "④ reasoning + confidence  ×N  (parallel)"], ["V", "V", "⑤ trust score formula (no LLM)"], ["V", "G", "⑥ summary  ×1"], ["V", "B", "VerificationReport JSON"], ["B", "B", "render · save to localStorage"],
    ];
    msg.forEach((m, i) => {
      const y = 2.35 + i * 0.41;
      const a = X[m[0]], b = X[m[1]];
      if (a === b) {
        R(s, a - 0.05, y - 0.12, 0.1, 0.3, { fill: C.amber });
        T(s, m[2], { x: a + 0.15, y: y - 0.16, w: 3.2, h: 0.32, fontSize: 11.5, color: C.amber, valign: "middle" });
      } else {
        line(s, a, y + 0.1, b, y + 0.1, { color: m[1] === "B" ? C.teal : C.indigo, w: 1.5 });
        T(s, m[2], { x: Math.min(a, b) + 0.12, y: y - 0.2, w: Math.abs(b - a) - 0.2, h: 0.28, fontSize: 11.5, align: m[1] === "B" ? "right" : "left" });
      }
    });
    R(s, M, 6.15, 5.9, 0.55, { fill: C.panel, line: C.line, round: 0.05 });
    T(s, [{ text: "Per request  ", options: { fontFace: MONO, bold: true, color: C.indigo, fontSize: 10.5 } }, { text: "≤ 2N + 2 Gemini calls · N Tavily calls" }], { x: M + 0.2, y: 6.15, w: 5.6, h: 0.55, fontSize: 13.5, valign: "middle" });
    R(s, M + 6.1, 6.15, CW - 6.1, 0.55, { fill: C.teal, ft: 88, line: C.teal, round: 0.05 });
    T(s, [{ text: "Live run, N = 4  ", options: { fontFace: MONO, bold: true, color: C.teal, fontSize: 10.5 } }, { text: "10 Gemini + 4 Tavily calls · 10.9 s (single run)" }], { x: M + 6.3, y: 6.15, w: CW - 6.5, h: 0.55, fontSize: 13.5, valign: "middle" });
  }

  // ---------- 19 · Comparison ----------
  pres.addSection({ title: SEC_D });
  {
    const s = newSlide(SEC_D, "D · COMPARISON — 19", "Same model, different packaging: a fair comparison");
    const rows = [
      ["Discovery", "Ranked web pages", "Conversational answer; web tools optional, product-dependent", "Tavily search per extracted claim"],
      ["Claim decomposition", "Done by the user", "Possible if prompted; varies per conversation", "Dedicated extraction stage → JSON claims"],
      ["Evidence classification", "User reads and judges pages", "May appear in prose", "supports / contradicts / neutral per source"],
      ["Reasoning", "Human", "LLM, free-form", "Dedicated stage, five fixed verdicts"],
      ["Confidence", "No per-claim confidence", "Not standard; depends on prompt", "0–100 model-generated estimate per claim (uncalibrated)"],
      ["Output", "Results page", "Conversational answer or report", "Per-claim structured report · PDF / JSON"],
      ["Workflow", "Search and browse", "Open-ended interaction", "Predefined, repeatable pipeline"],
    ];
    s.addTable([[hcell("DIMENSION"), hcell("GOOGLE SEARCH"), hcell("CHATGPT / GEMINI (APPS)"), hcell("TRUTHLENS AI", { color: C.indigo })], ...rows.map((r) => [cell(r[0], { bold: true, fontSize: 12.5 }), cell(r[1], { fontSize: 12.5, color: C.muted }), cell(r[2], { fontSize: 12.5, color: C.muted }), cell(r[3], { fontSize: 12.5, fill: { color: C.indigo, transparency: 86 } })])], { x: M, y: 1.55, w: CW, colW: [2.3, 2.75, 3.45, 3.63], rowH: [0.34, ...Array(7).fill(0.47)], border: BORDER, objectName: nm("table") });
    R(s, M, 5.35, 7.45, 1.35, { fill: C.indigo, ft: 86, line: C.indigo, round: 0.06 });
    T(s, [
      { text: "“WHY BUILD IT IF LLMs CAN SEARCH?”", options: { fontFace: MONO, fontSize: 10, bold: true, color: C.indigo, breakLine: true } },
      { text: "TruthLens does not replace Gemini’s intelligence — it is Gemini underneath. A user could rebuild this by hand with a chatbot and a search engine, re-prompting every stage and assembling the report. TruthLens encodes that procedure once: same stages, same schema, every time." },
    ], { x: M + 0.2, y: 5.43, w: 7.05, h: 1.2, fontSize: 12.5 });
    R(s, M + 7.65, 5.35, CW - 7.65, 1.35, { fill: C.coral, ft: 90, line: C.coral, round: 0.06 });
    T(s, [
      { text: "WHAT IS NOT CLAIMED", options: { fontFace: MONO, fontSize: 10, bold: true, color: C.coral, breakLine: true } },
      { text: "Higher accuracy — no benchmark has been run. Assistant features evolve and vary by plan, configuration and enabled tools." },
    ], { x: M + 7.85, y: 5.43, w: CW - 8.05, h: 1.2, fontSize: 12.5 });
  }

  // ---------- 20 · Design rationale ----------
  {
    const s = newSlide(SEC_D, "D · DESIGN DECISIONS — 20", "Why these methods: requirement → choice → trade-off");
    const rows = [
      ["Language understanding without training data", "Gemini API (flash-lite default, temp 0.1)", "Strong zero-shot extraction, stance, reasoning", "Train / fine-tune own model", "Vendor dependence, rate limits, non-determinism"],
      ["Current, citable information", "Tavily Search API", "Built for LLM apps: clean content + URLs", "Model memory; scraping a search engine", "Snippet-level context; index coverage"],
      ["Explicit multi-step control", "LangGraph StateGraph (backend)", "Typed shared state, streaming, future branching", "Single prompt; plain function chain", "Extra dependency; graph is linear today"],
      ["Machine-checkable outputs", "JSON prompts + Pydantic / TS types", "Validate, store, export; one schema, two paths", "Free-text answers", "Parsing failures need fallbacks"],
      ["Per-assertion truth values", "Claim-wise decomposition", "Mixed-truth texts; targeted queries", "Verify the whole text once", "More calls; claims can lose context"],
      ["Traceable evidence", "supports / contradicts / neutral", "Simple, interpretable, maps to UI badges", "Relevance scores; NLI model", "Coarse; no credibility weighting"],
      ["One headline number", "Verdict-weighted, confidence-scaled mean", "Transparent, explainable formula", "Min/max rule; learned aggregator", "Uncalibrated; mixes doubt with falsity"],
      ["One deployable web app", "Next.js UI + serverless route on Vercel", "Single deploy, keys server-side", "Always call the FastAPI service", "Duplicated pipeline; 60 s limit"],
    ];
    s.addTable([["REQUIREMENT", "CHOICE", "WHY", "ALTERNATIVE", "TRADE-OFF"].map((h, i) => hcell(h, { color: i === 1 ? C.indigo : i === 4 ? C.coral : C.muted })), ...rows.map((r) => [cell(r[0], { bold: true, fontSize: 12 }), cell(r[1], { fontSize: 12, color: C.text, fill: { color: C.indigo, transparency: 88 } }), cell(r[2], { fontSize: 12, color: C.muted }), cell(r[3], { fontSize: 12, color: C.muted }), cell(r[4], { fontSize: 12, color: C.text })])], { x: M, y: 1.55, w: CW, colW: [2.55, 2.55, 2.6, 2.05, 2.38], rowH: [0.34, ...Array(8).fill(0.56)], border: BORDER, objectName: nm("table") });
    T(s, "These are design arguments. No controlled experiment comparing the alternatives has been run.", { x: M, y: 6.45, w: CW, h: 0.3, fontSize: 12.5, italic: true, color: C.muted });
  }

  // ---------- 21 · Limitations ----------
  {
    const s = newSlide(SEC_D, "D · CRITICAL ANALYSIS — 21", "Limitations and failure modes");
    const L = [
      ["LuBrain", "LLM outputs can be wrong", "Verdicts and summaries are generated; claim 1 was FALSE (95) on five “neutral” sources.", true],
      ["LuScissors", "Context lost when splitting", "“The acquisition was announced yesterday” retrieved FACT II Acquisition Corp. — unrelated.", true],
      ["LuFileText", "Snippet-level evidence", "≤ 400 characters per source reach the model; full articles are never read.", false],
      ["LuCopy", "Source independence ignored", "Claim 3: three of five results were one Business Insider article (URL variants).", true],
      ["LuCalendarX", "Weak recency handling", "All 20 results lacked a date; dates are not passed to the model; 2024 coverage judged “next month”.", true],
      ["LuGauge", "Confidence not calibrated", "“UNSUPPORTED · 100%” = certainty in the verdict, not a probability of truth.", true],
      ["LuServerCrash", "API failures and rate limits", "Deployed route has no retries; a Tavily outage silently turns every claim UNSUPPORTED.", false],
      ["LuBraces", "Invalid structured output", "Parsing fallbacks (neutral / UNSUPPORTED) keep it running but can mask errors.", false],
      ["LuUserCheck", "Not a professional fact-checker", "Decision support only; primary sources and human review still required.", false],
    ];
    const cw = (CW - 2 * 0.22) / 3, chh = 1.5;
    for (let i = 0; i < L.length; i++) {
      const x = M + (i % 3) * (cw + 0.22), y = 1.55 + Math.floor(i / 3) * (chh + 0.18);
      R(s, x, y, cw, chh, { fill: C.panel, line: L[i][3] ? C.amber : C.line, lw: 1, round: 0.06 });
      await iconCircle(s, L[i][0], x + 0.18, y + 0.18, 0.46, L[i][3] ? "amber" : "coral");
      T(s, L[i][1], { x: x + 0.78, y: y + 0.16, w: cw - 0.95, h: 0.5, fontSize: 14, bold: true, valign: "middle" });
      T(s, L[i][2], { x: x + 0.2, y: y + 0.72, w: cw - 0.4, h: 0.72, fontSize: 12, color: C.muted });
    }
    R(s, M, 6.68, 0.18, 0.18, { fill: C.amber, round: 0.03 });
    T(s, "= observed in the captured live run.   With no evidence the system abstains: UNSUPPORTED, confidence 15, weight 0.5 — never an automatic FALSE.", { x: M + 0.28, y: 6.62, w: CW - 0.3, h: 0.3, fontSize: 12, color: C.muted, valign: "middle" });
  }

  // ---------- 22 · Evaluation & future work ----------
  {
    const s = newSlide(SEC_D, "D · EVALUATION & FUTURE WORK — 22", "How to measure it — and what comes next");
    T(s, "PROPOSED EVALUATION — NOT YET RUN, NO RESULTS CLAIMED", { x: M, y: 1.55, w: 7.2, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.amber });
    const ev = [
      ["Claim extraction", "Precision · recall · F1", "Human-annotated claim spans"],
      ["Evidence stance", "Accuracy · macro-F1", "Labelled claim–source pairs"],
      ["Verdict", "Accuracy · macro-F1, per class", "FEVER-style set [10] + recent-news set"],
      ["Confidence", "Reliability diagram · ECE · Brier", "Calibration per Guo et al. [11]"],
      ["Baselines", "Same metrics", "Single Gemini prompt · prompt + search · manual search"],
      ["Efficiency", "Latency p50/p95 · cost per claim", "Logged API calls and timings"],
      ["Robustness", "Verdict stability", "Conflicting, duplicated and planted sources"],
    ];
    s.addTable([[hcell("TARGET"), hcell("METRIC"), hcell("DATA / BASELINE")], ...ev.map((r) => [cell(r[0], { bold: true, fontSize: 12.5 }), cell(r[1], { fontSize: 12.5, color: C.teal }), cell(r[2], { fontSize: 12.5, color: C.muted })])], { x: M, y: 1.9, w: 7.2, colW: [1.85, 2.45, 2.9], rowH: [0.34, ...Array(7).fill(0.56)], border: BORDER, objectName: nm("table") });
    const rx = 8.25, rw = CW - (rx - M);
    T(s, "FUTURE WORK ROADMAP", { x: rx, y: 1.55, w: rw, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.indigo });
    const ph = [
      ["PHASE 1 · MEASURE", ["Build labelled benchmark", "Calibrate confidence on it", "Log per-stage traces"]],
      ["PHASE 2 · EVIDENCE QUALITY", ["URL de-duplication", "Source credibility & independence", "Primary-source priority; pass dates", "Claim-level provenance"]],
      ["PHASE 3 · PRODUCT", ["Wire UI to the SSE stream", "Unify the two pipelines", "Batch verification · accounts", "Multilingual input"]],
    ];
    let y = 1.95;
    ph.forEach((p, i) => {
      R(s, rx + 0.05, y + 0.06, 0.2, 0.2, { round: 0.1, fill: C.indigo });
      if (i < 2) R(s, rx + 0.14, y + 0.3, 0.02, p[1].length * 0.3 + 0.35, { fill: C.line });
      T(s, p[0], { x: rx + 0.45, y, w: rw - 0.45, h: 0.32, fontFace: MONO, fontSize: 10.5, bold: true, color: C.indigo, valign: "middle" });
      T(s, p[1].map((t, k) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: k < p[1].length - 1 } })), { x: rx + 0.45, y: y + 0.35, w: rw - 0.45, h: p[1].length * 0.3, fontSize: 13 });
      y += 0.35 + p[1].length * 0.3 + 0.22;
    });
    T(s, "Every item on the right is future work; none is implemented in the current repository.", { x: M, y: 6.45, w: CW, h: 0.3, fontSize: 12.5, italic: true, color: C.muted });
  }

  // ---------- 23 · Demo 1 ----------
  pres.addSection({ title: SEC_E });
  {
    const s = newSlide(SEC_E, "E · DEMONSTRATION 1/2 — 23", "Live run: from pasted text to a trust score", [1, 2, 3, 4, 5, 6]);
    const h = 2.75;
    const shots = [["ui_input.jpg", 1800 / 1295, "1  Paste the app’s example and press Verify"], ["ui_loading.jpg", 1, "2  Six stage labels (timed animation)"], ["ui_results.jpg", 1.6, "3  Report after 10.9 s — trust 24/100"]];
    let x = M;
    const gap = (CW - shots.reduce((a, b) => a + h * b[1], 0)) / 2;
    shots.forEach((sh) => {
      const w = h * sh[1];
      img(s, sh[0], x, 1.55, w, h, { alt: sh[2] });
      T(s, sh[2], { x, y: 4.36, w, h: 0.3, fontSize: 12, color: C.muted });
      x += w + gap;
    });
    const rows = REPORT.claims.map((c) => {
      const n = (k) => c.evidence.filter((e) => e.stance === k).length;
      return [cell(String(c.claim.id), { fontFace: MONO, bold: true }), cell(c.claim.text, { fontSize: 12.5 }), cell(c.verdict, { fontFace: MONO, fontSize: 11, bold: true, color: C[VCOL[c.verdict]] }), cell(String(c.confidence), { fontFace: MONO, align: "right" }), cell(`${n("supports")} / ${n("contradicts")} / ${n("neutral")}`, { fontFace: MONO, fontSize: 11, align: "center" })];
    });
    s.addTable([[hcell("#"), hcell("EXTRACTED CLAIM"), hcell("VERDICT"), hcell("CONF."), hcell("S / C / N")], ...rows], { x: M, y: 4.8, w: CW, colW: [0.45, 7.3, 1.85, 0.9, 1.63], rowH: [0.32, 0.36, 0.36, 0.36, 0.36], border: BORDER, objectName: nm("table") });
    T(s, "Captured from https://frontend-xi-kohl-41.vercel.app · 17 Nov 2026, 02:29 UTC · results vary between runs (no caching, live search, LLM sampling)", { x: M, y: 6.68, w: CW, h: 0.25, fontFace: MONO, fontSize: 9.5, color: C.muted });
  }

  // ---------- 24 · Demo 2 ----------
  {
    const s = newSlide(SEC_E, "E · DEMONSTRATION 2/2 — 24", "Evidence, sources and export — real output", [3, 4, 6]);
    img(s, "ui_claim3.jpg", M, 1.55, 6.95, 4.28, { alt: "Claim 3 card with expanded stance-labelled evidence" });
    T(s, "4  Stance-labelled evidence and source links for claim 3", { x: M, y: 5.9, w: 6.95, h: 0.28, fontSize: 12, color: C.muted });
    img(s, "ui_pdf.jpg", 7.8, 1.55, 2.4, 3.39, { alt: "Exported PDF report page" });
    T(s, "5  Export PDF (jsPDF)", { x: 7.8, y: 5.0, w: 2.4, h: 0.28, fontSize: 12, color: C.muted });
    img(s, "ui_history.jpg", 10.45, 1.55, 2.28, 1.21, { alt: "History panel entry with score 24/100" });
    T(s, "6  History (localStorage)", { x: 10.45, y: 2.82, w: 2.28, h: 0.28, fontSize: 12, color: C.muted });
    R(s, 10.45, 3.3, 2.28, 1.64, { fill: C.amber, ft: 88, line: C.amber, round: 0.06 });
    T(s, [{ text: "VISIBLE LIMITS", options: { fontFace: MONO, fontSize: 9.5, bold: true, color: C.amber, breakLine: true } }, { text: "Entries 1–3 are one article (URL variants); sources date from 2024." }], { x: 10.6, y: 3.38, w: 2.0, h: 1.5, fontSize: 12 });
    T(s, "7  JSON download + clipboard copy use the same report object", { x: 7.8, y: 5.35, w: CW - 7.2, h: 0.5, fontSize: 12, color: C.muted });
    R(s, M, 6.25, CW, 0.5, { fill: C.indigo, ft: 86, line: C.indigo, round: 0.06 });
    T(s, "1 message  →  4 claims  →  20 sources  →  20 stance labels  →  4 verdicts  →  1 exportable report", { x: M, y: 6.25, w: CW, h: 0.5, align: "center", valign: "middle", fontFace: "Cambria", fontSize: 17, bold: true });
  }

  // ---------- 25 · Conclusion ----------
  {
    const s = newSlide(SEC_E, "E · CONCLUSION — 25", "Conclusion and contributions", [1, 2, 3, 4, 5, 6]);
    T(s, "CONTRIBUTIONS", { x: M, y: 1.55, w: 6, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.indigo });
    const cs = [
      ["Six-stage agent pipeline", "extraction → search → evidence → reasoning → confidence → report"],
      ["Two orchestrations", "LangGraph StateGraph (FastAPI) · serverless TypeScript route (deployed)"],
      ["Per-claim external retrieval", "Tavily, concurrent, with fallbacks"],
      ["Explicit evidence stance", "supports / contradicts / neutral per source"],
      ["Five-way verdicts", "including a principled UNSUPPORTED outcome"],
      ["Transparent scoring + shared schema", "documented formula; Pydantic ≡ TypeScript; deployed app"],
    ];
    cs.forEach((c, i) => {
      const y = 1.9 + i * 0.6;
      T(s, String(i + 1).padStart(2, "0"), { x: M, y, w: 0.5, h: 0.5, fontFace: MONO, fontSize: 14, bold: true, color: C.indigo, valign: "middle" });
      T(s, [{ text: c[0], options: { bold: true, fontSize: 14.5, breakLine: true } }, { text: c[1], options: { fontSize: 12, color: C.muted } }], { x: M + 0.55, y, w: 5.9, h: 0.55, valign: "middle" });
    });
    const rx = 7.35, rw = CW - (rx - M);
    T(s, "LESSONS LEARNED", { x: rx, y: 1.55, w: rw, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.teal });
    const ll = ["Structured intermediate state is what makes an LLM system debuggable", "Robust parsing and fallbacks are essential — and must be monitored", "Measure before claiming accuracy"];
    T(s, ll.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < ll.length - 1 } })), { x: rx, y: 1.88, w: rw, h: 1.7, fontSize: 14, paraSpaceAfter: 6 });
    T(s, "OPEN LIMITATIONS", { x: rx, y: 3.75, w: rw, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: C.coral });
    T(s, "Uncalibrated confidence · snippet-level, unweighted sources · no benchmark yet · duplicated pipeline", { x: rx, y: 4.05, w: rw, h: 0.75, fontSize: 13.5, color: C.muted });
    R(s, M, 5.65, CW, 1.05, { fill: C.panel, line: C.indigo, lw: 1, round: 0.06 });
    T(s, "TruthLens shows that coordinated, specialised LLM agents can turn unstructured text into a structured, inspectable verification record. Whether that record is more accurate than the alternatives is an empirical question, and the evaluation plan is how to answer it.", { x: M + 0.25, y: 5.65, w: CW - 0.5, h: 1.05, fontFace: "Cambria", italic: true, fontSize: 15, valign: "middle" });
  }

  // ---------- 26 · Q&A ----------
  {
    slideNo++;
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: SEC_E });
    s.addNotes(`[Target time ${NOTES[25].dur}]\n\n${NOTES[25].notes}`);
    for (let i = 0; i < 6; i++) { R(s, 0.7 + i * 0.42, 1.25, 0.32, 0.32, { fill: C.indigo }); T(s, String(i + 1), { x: 0.7 + i * 0.42, y: 1.25, w: 0.32, h: 0.32, align: "center", valign: "middle", fontFace: MONO, fontSize: 10, bold: true }); }
    T(s, "Thank you —\nquestions?", { x: 0.7, y: 1.85, w: 9, h: 2.6, fontFace: "Cambria", fontSize: 66, bold: true, lineSpacingMultiple: 0.95 });
    T(s, [
      { text: "LIVE  ", options: { color: C.teal, bold: true } },
      { text: "https://frontend-xi-kohl-41.vercel.app", options: { hyperlink: { url: "https://frontend-xi-kohl-41.vercel.app/" }, color: C.text, breakLine: true } },
      { text: "CODE  ", options: { color: C.teal, bold: true } },
      { text: "https://github.com/umugash/truthlens-ai", options: { hyperlink: { url: "https://github.com/umugash/truthlens-ai" }, color: C.text } },
    ], { x: 0.7, y: 4.75, w: 8, h: 0.8, fontFace: MONO, fontSize: 15, lineSpacingMultiple: 1.3 });
    T(s, "Mugash Priyan U.  ·  M.Tech Integrated CSE — Data Science  ·  Agent Technology  ·  SRM Institute of Science and Technology", { x: 0.7, y: 6.6, w: 12, h: 0.3, fontSize: 12, color: C.muted });
  }

  // ---------- A1 · Source appendix ----------
  pres.addSection({ title: SEC_X });
  {
    slideNo++;
    const s = pres.addSlide({ masterName: "CONTENT_DARK", sectionTitle: SEC_X });
    s.addText("APPENDIX A — SOURCE MAP", { placeholder: "kicker" });
    s.addText("Technical source appendix", { placeholder: "title" });
    s.addNotes("Backup slide — not presented. Use it to answer 'where is that in the code?' questions. Every technical claim in the deck traces to one of these files at commit ae5fc66.");
    const f = [
      ["frontend/app/api/verify/route.ts", "Deployed 6-stage pipeline; callGemini, callTavily, extractJson; trust weights; maxDuration 60", "6, 8, 10–14, 17, 18"],
      ["frontend/lib/api.ts", "verifyText(): /api/verify unless NEXT_PUBLIC_API_URL is set", "6"],
      ["frontend/components/loading-animation.tsx", "1.5 s timer; currentStep prop never passed by page.tsx", "16"],
      ["frontend/lib/export.ts · lib/history.ts", "jsPDF export, JSON Blob, clipboard; localStorage, max 20", "15, 16, 24"],
      ["frontend/types/index.ts", "TS interfaces mirroring Pydantic models", "15"],
      ["backend/app/agents/graph.py", "GraphState, StateGraph, 6 nodes, edges, ainvoke", "8, 9"],
      ["backend/app/agents/*_agent.py, claim_extraction.py", "Stage implementations (incl. confidence fast path)", "8, 10–14"],
      ["backend/app/api/routes.py", "/api/verify, /api/verify/stream (SSE), 5-min report cache", "6, 9, 17"],
      ["backend/app/services/llm.py", "GeminiProvider: retries, backoff, Semaphore(5), SHA-256 cache, temp 0.1", "17"],
      ["backend/app/services/tavily.py", "Async → sync fallback, 10-min cache, field mapping", "11, 17"],
      ["backend/app/types/models.py", "Verdict enum, Claim, SearchResult, EvidenceItem, ClaimResult, VerificationReport", "5, 12, 15"],
      ["backend/app/utils/prompts.py · json_helpers.py", "All prompt templates; 3-step JSON extraction", "5, 10, 12, 13"],
      ["backend/app/config.py · main.py", "Settings (model default, depth, CORS); FastAPI app + CORS", "6, 17"],
    ];
    s.addTable([[hcell("FILE"), hcell("WHAT IT ESTABLISHES"), hcell("SLIDES")], ...f.map((r) => [cell(r[0], { fontFace: MONO, fontSize: 10, color: C.indigo }), cell(r[1], { fontSize: 11.5 }), cell(r[2], { fontFace: MONO, fontSize: 10.5, color: C.muted })])], { x: M, y: 1.55, w: CW, colW: [4.4, 6.13, 1.6], rowH: [0.32, ...Array(13).fill(0.37)], border: BORDER, objectName: nm("table") });
  }

  // ---------- A2 · References ----------
  {
    slideNo++;
    const s = pres.addSlide({ masterName: "CONTENT_DARK", sectionTitle: SEC_X });
    s.addText("APPENDIX B — REFERENCES", { placeholder: "kicker" });
    s.addText("References", { placeholder: "title" });
    s.addNotes("Backup slide — not presented. [1]–[2] are the primary sources for every implementation claim. [3]–[9] are the official documentation for the libraries and services the code uses. [10]–[11] are cited only to frame the proposed evaluation; no results from them are claimed for TruthLens.");
    const refs = [
      ["[1]", "TruthLens AI source code, github.com/umugash/truthlens-ai (commit ae5fc66)."],
      ["[2]", "TruthLens AI live deployment, frontend-xi-kohl-41.vercel.app — run captured 17 Nov 2026."],
      ["[3]", "LangGraph documentation — StateGraph, nodes and edges. langchain-ai.github.io/langgraph"],
      ["[4]", "Google AI for Developers — Gemini API, generateContent. ai.google.dev/gemini-api/docs"],
      ["[5]", "Tavily Search API documentation. docs.tavily.com"],
      ["[6]", "FastAPI documentation. fastapi.tiangolo.com"],
      ["[7]", "Pydantic v2 documentation. docs.pydantic.dev"],
      ["[8]", "Next.js documentation — App Router and Route Handlers. nextjs.org/docs"],
      ["[9]", "Vercel documentation — Functions and maxDuration. vercel.com/docs/functions"],
      ["[10]", "J. Thorne, A. Vlachos, C. Christodoulopoulos, A. Mittal, “FEVER: a Large-scale Dataset for Fact Extraction and VERification,” NAACL-HLT 2018."],
      ["[11]", "C. Guo, G. Pleiss, Y. Sun, K. Q. Weinberger, “On Calibration of Modern Neural Networks,” ICML 2017."],
    ];
    refs.forEach((r, i) => {
      const y = 1.6 + i * 0.44;
      T(s, r[0], { x: M, y, w: 0.6, h: 0.4, fontFace: MONO, fontSize: 12, bold: true, color: C.indigo, valign: "middle" });
      T(s, r[1], { x: M + 0.7, y, w: CW - 0.7, h: 0.4, fontSize: 14, valign: "middle" });
    });
    T(s, "[3]–[9]: documentation for technologies used in the code.  [10]–[11]: cited only to frame the proposed evaluation.", { x: M, y: 6.5, w: CW, h: 0.3, fontSize: 12, italic: true, color: C.muted });
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT, "slides:", slideNo);
}

build().catch((e) => { console.error(e); process.exit(1); });
