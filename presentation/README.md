# Final Project Presentation — TruthLens AI

| File | Purpose |
|---|---|
| `TruthLens_AI_Final_Presentation.pptx` | The deck: 26 presented slides plus 2 appendix slides, 16:9, speaker notes and target time on every slide |
| `TruthLens_AI_Final_Presentation.pdf` | PDF export for quick review |
| `PRESENTER_SCRIPT.md` | Backup script, slide by slide, with a timing plan (about 25 min) |
| `SOURCE_APPENDIX.md` | Source files and symbols behind each technical claim, README discrepancies, live-run data, references |
| `assets/` | Real screenshots of the deployed app and the raw JSON report from the live run (17 Nov 2026) |
| `build/` | Generator scripts (`build_deck.js`, `notes.js`, `build_script.js`) |

## Rebuild

The scripts need `pptxgenjs`, `react`, `react-dom`, `react-icons` and `sharp` (install them anywhere, then point `NODE_PATH` at that `node_modules`), plus the pptx skill's `apply_theme.js`:

```bash
NODE_PATH=/path/to/node_modules node build/build_deck.js /path/to/apply_theme.js
```

```bash
node build/build_script.js
```

Fonts: Cambria (titles), Calibri (body), Courier New (code). All three ship with Microsoft Office.
