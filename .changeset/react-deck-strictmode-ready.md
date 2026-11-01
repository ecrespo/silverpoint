---
'@silverpoint/react': patch
---

`SpDeck` (React): the deck works under `<StrictMode>` — its cleanup no longer destroys the controller that StrictMode's replayed mount reuses (#7) — and `onReady` now receives the first `{ total }` even when React runs the subscribing effect after the controller's initial microtask (#8).
