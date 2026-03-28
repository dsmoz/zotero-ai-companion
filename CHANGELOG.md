# Changelog

All notable changes to Zotero AI Companion are documented here.
Format: Keep a Changelog · Versioning: Semantic Versioning

## [0.3.0] - 2026-03-28
### Added
- **Item Chat**: LLM-powered streaming chat per Zotero item; history persisted to `.data/chats/{key}.json`
- **Library Chat**: Standalone panel for cross-library semantic search + LLM chat with session sidebar (last 10 sessions)
- **Multi-doc Chat**: Chat across multiple selected items simultaneously; session persists with scoped document keys
- **Query rewriting**: Follow-up questions (≤ 15 words) auto-expanded using conversation history before semantic search
- **APA source citations**: Inline `[N]` superscripts in assistant responses; "Sources" section per message with author, year, title
- **Related Documents panel**: Loads similar items on chat open (scope-based for multi-doc; query-based for library chat); collapses/expands
- **Session restore**: Multi-doc chat sessions store `zotero_keys`; document header and history reload on reopen
- **Markdown rendering**: `marked` + `DOMPurify` for assistant messages in all three chat surfaces
- LLM provider routing: Anthropic (claude-sonnet-4-6, with prompt caching) → OpenRouter → LM Studio → error
- `chat_llm.py`: `stream_llm_response()` with provider auto-detection
- `chat_sessions.py`: JSON session storage; `load_session`, `save_session`, `new_session`, `list_library_sessions`

### Changed
- Backend source objects now include `year` and `authors` fields (extracted from Zotero metadata) across all three chat generators
- `similar_items()` fixed: now fetches a representative chunk and uses `SemanticSearch` instead of incorrect `Search_by_zotero_key(top_k=…)` call
- Related Documents panel now loads immediately on chat open rather than waiting for first send

### Fixed
- `/similar/<key>` 500 error: `Search_by_zotero_key` does not accept `top_k`; fixed to use `limit`
- Library chat context maintenance: query rewriting prevents "what about Angola?" from losing topic across turns
- Multi-doc session reload: `zotero_keys` now stored in session JSON so scope is preserved on reopen

## [0.2.1] - 2026-03-28
### Fixed
- Restored CSS design tokens (`tokens.css`) and base styles lost during git rebase abort
- Added `src/styles/` copy step to `build.mjs` so stylesheet bundle is included in XPI

## [0.2.0] - 2026-03-28
### Fixed
- Window focus check replaced `Services.wm.getWindowByName` (not a valid XPCOM API) with `getEnumerator('')` loop

## [0.1.9] - 2026-03-28
### Fixed
- Same window-focus fix (incremental release)

## [0.1.8] - 2026-03-28
### Fixed
- Command handlers lost during git rebase abort; restored window open/close lifecycle

## [0.1.7] - 2026-03-28
### Added
- Initial Library Chat panel
- Multi-doc Chat panel
- SSE streaming backend routes for item, library, and multi-doc chat
