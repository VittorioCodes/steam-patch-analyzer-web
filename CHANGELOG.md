# Changelog

All notable changes to Steam Patch Analyzer Web are documented here.

---

## [v0.7] - 2026-04-12

### Added
- **Select Patch** button next to Run Analysis, visible on first load
- Patch selection modal that lists all patch-filtered news items by title, allowing the user to choose which patch to analyze instead of always defaulting to the latest one
- `getAllPatchNewsItems()` helper that applies the existing third-party press filter and patch title heuristics to return the full list of matching patches (used exclusively by the Select Patch flow)
- `handleOpenPatchSelect()` function that fetches Steam news and populates the patch list before opening the modal
- Loading state inside the patch selection modal while Steam data is being fetched

### Changed
- `handleAnalyze` now accepts an optional `specificPatchItem` parameter; when provided (via Select Patch), it skips the Steam fetch and goes straight to AI analysis with the supplied item

---

## [v0.6] - Initial Public Release

### Added
- Google Gemini AI integration with multi-model fallback strategy (tries up to 5 models in priority order)
- Steam Web API news fetching via a Cloudflare Workers CORS proxy
- Three-tier patch filtering system: third-party press exclusion, patch title heuristics, and cascading priority selection
- Analysis output split into four sections: Buffs, Nerfs, Other, Changes
- Fullscreen column expansion modal for detailed reading
- Follow-up chat modal powered by a persistent Gemini chat session seeded with the analyzed patch
- Game search with autocomplete from a pre-compiled list of ~8 000 Steam apps
- Status bar showing live fetch/analysis state, current patch title, and model used
- Dark theme (GitHub-style dark dimmed)
- MIT License
