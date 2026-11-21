---
'@silverpoint/react': patch
---

A dashboard's charts follow a provider change made while the dashboard was hidden (#27, Next.js `cacheComponents`): the dashboard root provides the configuration it read to its charts.
