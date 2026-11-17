// Generates PRESENTER_SCRIPT.md from notes.js (same text as the .pptx speaker notes).
const fs = require("fs");
const path = require("path");
const NOTES = require("./notes.js");

const toSec = (d) => { const [m, s] = d.split(":").map(Number); return m * 60 + s; };
const fmt = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
let total = 0;
const rows = NOTES.map((n, i) => { const start = total; total += toSec(n.dur); return `| ${i + 1} | ${n.title} | ${n.dur} | ${fmt(start)} |`; });

let md = `# TruthLens AI — Presenter Script

Backup script for the final Agent Technology presentation. The text is identical to the speaker notes in \`TruthLens_AI_Final_Presentation.pptx\`, so you can read it if the slides fail.

- **Total spoken time:** about ${fmt(total)} for slides 1–26. Appendix slides 27–28 are backup only.
- **For a 20-minute slot:** shorten slides 16, 17, 18 and 20 to one sentence each (saves about 3 minutes), and present only one of the two demo slides (saves about 1 minute).
- **Live demo:** a live run usually takes 8–15 s. Results vary between runs: the deployed route has no cache, search results change, and model sampling varies. If the network fails, use slides 23–24, which are screenshots from a real run on 17 Nov 2026.

## Timing plan

| Slide | Title | Time | Starts at |
|---|---|---|---|
${rows.join("\n")}

---
`;
NOTES.forEach((n, i) => {
  md += `\n## Slide ${i + 1} — ${n.title}\n\n*Target: ${n.dur}*\n\n${n.notes.trim()}\n\n---\n`;
});
md += `\n## Appendix slides (not presented)\n\n- **Slide 27 — Technical source appendix:** use it to answer "where is that in the code?"\n- **Slide 28 — References.**\n`;
fs.writeFileSync(path.join(__dirname, "..", "PRESENTER_SCRIPT.md"), md);
console.log("total", fmt(total));
