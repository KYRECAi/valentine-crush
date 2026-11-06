# KYREC Guardian arcade export

This export keeps the existing game, artwork and character identity. It adds a standalone production build for Guardian and the existing KYREC game hosting.

`npm run test:guardian` checks gameplay, pause/resume, collection, win/fail, replay, persistence, corrupt saves, missing audio, parent messages and save isolation. `npm run typecheck` checks source types. `npm run build:guardian` creates `dist-guardian/index.html`, JavaScript, styles, approved assets and a SHA-256 asset manifest. For Valentine use `GUARDIAN_GAME_BASE_PATH=/valentine/`.

Arcade scores are game points only. They never approve Family Points, financial rewards or budget eligibility. An embedded game accepts a pause command only from its actual parent at the supplied exact HTTP(S) origin with the matching opaque session. Results use `kyrec.arcade` version 1 and contain no family balances or private family data. Embedded saves are isolated by game/session and recover in memory if browser storage is unavailable.

Production publishing requires Michael's release instruction. He explicitly requested both games live on 6 November 2026. Preserve the previous hosting commit for rollback; retain existing art and old hashed bundles. This game publication does not deploy Guardian family accounts or Core, and does not constitute App Store or real-device approval.
