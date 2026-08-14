 refactor: lazy-load large App component (split BigApp.jsx)

Corps (pr_body.md)

Split App.jsx into a lazily-loaded BigApp component to reduce initial bundle size and improve first-load performance.

Changes

• Extracted the large application implementation from src/App.jsx into src/BigApp.jsx.
• Replaced src/App.jsx with a small React.lazy + Suspense wrapper that lazy-loads BigApp.
• Added commit describing the refactor; no behavioral changes intended.

Motivation

• App.jsx was very large (~156KB). Code-splitting reduces initial bundle and improves perceived performance on first load.

How to test

1. Start frontend dev server: cd frontend/frontend && npm run dev
2. Load the app: confirm landing and chat load; check network tab to ensure BigApp chunk is lazy-loaded.
3. Smoke-test auth, conversations, and basic UI interactions.

Files to review

• src/BigApp.jsx (new large file)
• src/App.jsx (new wrapper)
• frontend package/json or vite config (ensure no regressions)

Risks & Rollback

• Low risk: refactor only; if issues, revert commit or restore previous App.jsx.
• Rollback: revert branch commit or use backup branch.

Checklist

• Dev server builds and loads BigApp chunk
• Core features smoke-tested (auth, chat, messages)
• No console errors in dev mode
• Add a short note to CHANGELOG if desired

Co-authored-by: Copilot 223556219+Copilot@users.noreply.github.com

Labels (suggested)

• refactor
• perf
• chore
• needs-review

Reviewers (suggested)

• @frontend-owner (remplacez par le handle réel)
• @your-colleague-frontend
