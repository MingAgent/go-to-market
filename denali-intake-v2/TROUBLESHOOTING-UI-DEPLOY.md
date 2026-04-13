# GTM Engine UI Deploy Troubleshooting

**Last updated:** 2026-04-13
**App:** `denali-intake-v2` (Vite + React 19)
**Live URL:** https://gtmengine.mingma.pro
**Deploy target:** Vercel project `mingagents-projects/go-to-market`
**Domains settings:** https://vercel.com/mingagents-projects/go-to-market/settings/domains
**Deployments:** https://vercel.com/mingagents-projects/go-to-market/deployments
**Repo linked to Vercel:** check Project → Settings → Git (verify which GitHub repo + branch is wired up)

---

## 1. Where the UI actually comes from

Until today MEMORY.md did not record the deploy target, which is why we chased GitHub Pages by mistake. The truth:

- `gtmengine.mingma.pro` → served by **Vercel** (`echo1-gtm-engine` project)
- GitHub Pages build at `mingagent.github.io/echo1-gtm-engine/` is a **leftover**, not the live site
- DNS CNAME for `gtmengine` points at Vercel, not `mingagent.github.io`

If the UI isn't updating, the first question is always: **did Vercel actually build and promote a new deployment from the latest commit?**

---

## 2. First-pass checklist (2 minutes)

Run these in order. Stop at the first failing step.

1. **Did the commit land on `main`?**
   `git log -1 --oneline` on your Mac inside `denali-intake-v2/` — confirm the SHA matches what you expect.
2. **Did GitHub receive it?**
   Open `https://github.com/MingAgent/echo1-gtm-engine/commits/main` — top commit should match.
3. **Did Vercel trigger a deploy?**
   `https://vercel.com/mingagents-projects/go-to-market/deployments` — the newest row should be from the same SHA, status = **Ready**.
4. **Is the new deployment actually promoted to Production?**
   Same page — the production row is the one aliased to `gtmengine.mingma.pro`. If the newest Ready deploy is *Preview* only, it won't show on the custom domain.
5. **Hard-refresh the live URL.**
   Cmd-Shift-R on `https://gtmengine.mingma.pro/`. Confirm `document.title` is the new one.

If all five pass and the UI still looks wrong, go to Section 3.

---

## 3. Common failure modes

### A. Vercel built but didn't promote to production
- **Symptom:** Deployments list shows latest SHA as *Ready — Preview*, not *Production*.
- **Fix:** In the deployment's three-dot menu → **Promote to Production**. Or push to `main` with production branch correctly set in Project → Settings → Git.
- **Root cause:** Production branch misconfigured, or the push landed on a non-production branch.

### B. Missing / wrong environment variables
- **Symptom:** Deploy is Ready, page loads, but screen is blank/black or renders partially. `src/App.jsx` imports `./lib/supabase`, which throws at module load if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing → React never mounts → you see the body background only.
- **Fix:** Project → Settings → Environment Variables. Confirm all six are set for **Production**:
  - `VITE_VAPI_PUBLIC_KEY`
  - `VITE_SQUAD_ID`
  - `VITE_TEXT_PROXY_URL`
  - `VITE_SUPABASE_URL` (= `https://cxaicthpjysltidclncf.supabase.co`)
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_AIRTABLE_SYNC_URL`
  After adding or fixing any, click **Redeploy** on the latest production deployment (do NOT rebuild — you need the updated env baked in, so "Redeploy with existing Build Cache: OFF").
- **How to confirm it's this:** On the live page, open DevTools → Console. If the top error mentions `supabase`, `VITE_SUPABASE_URL`, `createClient`, or `undefined is not an object` during module eval, this is the cause.

### C. Custom domain aliased to an old deployment
- **Symptom:** Deployments list shows newest is Production, but `gtmengine.mingma.pro` still serves old HTML (old `<title>`).
- **Fix:** Settings → Domains → `gtmengine.mingma.pro` — confirm it's bound to the project and "Assigned to: Production". If it's pinned to a specific deployment, unpin it. Then redeploy or use **Promote** again.

### D. DNS still pointing somewhere else
- **Symptom:** `gtmengine.mingma.pro` loads something that isn't even styled like this app, or `dig` returns an origin that isn't Vercel.
- **Fix:** In Namecheap (or wherever DNS lives), CNAME `gtmengine` → `cname.vercel-dns.com`. Wait up to 30 min for propagation. Verify with `dig gtmengine.mingma.pro`.

### E. Browser cache / service worker
- **Symptom:** Only *your* browser shows the old UI; incognito shows the new one.
- **Fix:** DevTools → Application → Service Workers → **Unregister**. Then Application → Storage → **Clear site data**. Hard refresh.

### F. GitHub Pages red herring
- **Symptom:** `mingagent.github.io/echo1-gtm-engine/` shows a black screen and you start debugging it.
- **Fix:** Ignore it. That URL is not the live site. Consider disabling GitHub Pages in repo Settings → Pages to remove the confusion, or leave it and just don't look at it.

---

## 4. Black-screen-specific diagnostic (Vercel URL)

If the **Vercel** production URL itself (not just the custom domain) renders a black/blank screen:

1. Open the deployment's unique URL (e.g. `echo1-gtm-engine-<hash>-mingagents-projects.vercel.app`).
2. DevTools → Console. Copy the first red error.
3. DevTools → Network → reload. Check that `/assets/index-*.js` and `/assets/index-*.css` return **200**, not 404.
4. In Console, run:
   ```js
   document.getElementById('root').innerHTML.length
   ```
   - `0` → React never mounted → almost always a module-load error (Supabase env vars missing, see 3B).
   - Non-zero but invisible → CSS didn't load, or a component is rendering `null`/transparent.

The fastest triage: if console shows a Supabase-related error, it's 3B. Fix env vars and redeploy.

---

## 5. Safe deploy loop (use this every time)

1. Edit locally in `denali-intake-v2/`.
2. `npm run build` locally to confirm it builds clean. If local build fails, Vercel build will fail too.
3. Commit + push to `main`.
4. Watch `vercel.com/mingagents-projects/go-to-market/deployments` — wait for the new SHA row to reach **Ready — Production**.
5. Hard-refresh `gtmengine.mingma.pro`. Confirm `<title>` matches the new build.
6. If production alias did NOT flip, open the new deployment and click **Promote to Production**.

---

## 6. Things to keep out of the repo going forward

- Don't keep two deploy pipelines (Pages + Vercel) pointed at the same custom domain — pick one and disable the other. Current decision: **Vercel is canonical**.
- `public/CNAME` only applies to GitHub Pages. It's harmless on Vercel but can be deleted to signal "Pages is not the deploy target."
- `vite.config.js` `base: './'` (relative) is correct for Vercel and also lets the Pages preview render, which is fine.

---

## 7. Open TODOs (as of 2026-04-13)

- [ ] Verify all 6 `VITE_*` env vars set on Vercel for Production.
- [ ] Confirm `gtmengine.mingma.pro` domain is "Assigned to: Production" in Vercel.
- [ ] Confirm DNS CNAME `gtmengine` → `cname.vercel-dns.com`.
- [ ] Decide whether to keep or disable the GitHub Pages workflow in `.github/workflows/`.
- [ ] Add "deploy target = Vercel" to MEMORY.md so future sessions don't chase Pages again.
