# GitHub Pages Deployment Guide

**CRITICAL REFERENCE** - Save this before clearing chat!

---

## ⚠️ Common Issues We've Encountered (Twice!)

### Issue: Site Reverts to README / 404 Errors After Deployment

**Symptoms:**
- GitHub Actions shows successful deployment (green checkmark)
- But website shows old README or 404 errors
- Sub-pages don't work

**Root Causes & Solutions:**

---

## 1. GitHub Pages Source Not Set to Actions

**Problem:** GitHub Pages is set to "Deploy from a branch" instead of "GitHub Actions"

**Check:**
1. Go to: `https://github.com/[USERNAME]/[REPO]/settings/pages`
2. Look at **"Build and deployment"** → **"Source"**

**Solution:**
- Must be set to: **"GitHub Actions"** ✅
- NOT "Deploy from a branch" ❌

**How to Fix:**
```
Settings → Pages → Build and deployment → Source → Select "GitHub Actions"
```

---

## 2. Environment Protection Rules Block Deployment

**Problem:** Deployment succeeds but GitHub rejects it due to branch restrictions

**Error Message:**
```
Branch "XXX" is not allowed to deploy to github-pages due to
environment protection rules
```

**Check:**
1. Go to: `https://github.com/[USERNAME]/[REPO]/settings/environments`
2. Click on **"github-pages"**
3. Look at **"Deployment branches and tags"**

**Solution:**
- Set to: **"No restriction"** (allows all branches) ✅
- OR add your production branch to the allowed list

**How to Fix:**
```
Settings → Environments → github-pages → Deployment branches and tags
→ Select "No restriction"
```

---

## 3. Workflow Not Configured for Production Branch

**Problem:** Pushing to production branch doesn't trigger workflow

**Check:** Look at `.github/workflows/deploy.yml` line 4-6:
```yaml
on:
  push:
    branches: [ "main", "YOUR-PRODUCTION-BRANCH" ]
```

**Solution:** Ensure your production branch is in the list

**For this project:**
```yaml
on:
  push:
    branches: [ "main", "022-dashboard-welcome" ]  # Production branch!
  workflow_dispatch:
```

**How to Fix:**
1. Edit `.github/workflows/deploy.yml`
2. Add your production branch to the `branches:` array
3. Commit and push

---

## Current Production Setup (Reference)

### Repository: `willplicate/people`

**Production Branch:** `022-dashboard-welcome`
- This is the branch that deploys to live site
- All production code must be merged here

**GitHub Pages Settings:**
- Source: **GitHub Actions** ✅
- Custom domain: `allyouneedisalightjacket.com`
- Environment: `github-pages`
- Branch restrictions: **No restriction** ✅

**Workflow Configuration:** `.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ "main", "022-dashboard-welcome" ]  # Both trigger deployment
  workflow_dispatch:  # Manual trigger option

permissions:
  contents: read
  pages: write
  id-token: write
```

---

## Deployment Process for New Features

### Step 1: Create Feature Branch
```bash
git checkout -b feature-branch-name
# Make your changes
git add .
git commit -m "Add new feature"
git push -u origin feature-branch-name
```

### Step 2: Test Locally
```bash
npm ci                    # Clean install (simulates CI)
npm run build            # Build for production
npm run dev              # Test locally
```

### Step 3: Merge to Production Branch
```bash
git checkout 022-dashboard-welcome
git merge feature-branch-name
git push
```

**Important:** DO NOT merge to `main` first - merge directly to production branch `022-dashboard-welcome`

### Step 4: Verify Deployment
1. Go to: https://github.com/willplicate/people/actions
2. Wait for green checkmark ✅ (~1-2 minutes)
3. Wait 1-2 minutes for CDN propagation
4. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
5. Check: https://allyouneedisalightjacket.com/people/

---

## Troubleshooting Deployment Issues

### Deployment Succeeds But Site Shows Old Content

**Try in this order:**

1. **Hard Refresh Browser**
   - Chrome/Firefox: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R`

2. **Check GitHub Pages Source**
   - Settings → Pages → Source = "GitHub Actions" ✅

3. **Check Environment Protection**
   - Settings → Environments → github-pages → "No restriction" ✅

4. **Clear Browser Cache**
   - Or try incognito/private mode

5. **Wait for CDN Propagation**
   - Can take 5-10 minutes sometimes

6. **Force New Deployment**
   ```bash
   date > .deploy-trigger
   git add .deploy-trigger
   git commit -m "Force deployment"
   git push
   ```

### Build Fails on GitHub Actions

**Check:**
1. Does it build locally? Run `npm ci && npm run build`
2. Are all dependencies in `package.json` and `package-lock.json`?
3. Check GitHub Actions logs for specific error
4. TypeScript errors? Check `next.config.js` has `ignoreBuildErrors: true`

### Workflow Doesn't Trigger

**Check:**
1. Is your branch in `.github/workflows/deploy.yml` branches list?
2. Did you push to the correct branch?
3. Try manual trigger: Actions → Deploy to GitHub Pages → Run workflow

---

## Quick Reference Commands

### Check Current Branch
```bash
git branch --show-current
```

### See Which Branch Triggers Workflow
```bash
cat .github/workflows/deploy.yml | grep -A 2 "branches:"
```

### Force Clean Build
```bash
rm -rf .next node_modules
npm ci
npm run build
```

### Trigger Manual Deployment
Go to: https://github.com/willplicate/people/actions
→ Deploy to GitHub Pages → Run workflow → Run workflow

---

## Common Mistakes to Avoid

❌ **Don't**: Merge to `main` and expect it to deploy
✅ **Do**: Merge to `022-dashboard-welcome` (production branch)

❌ **Don't**: Forget to commit `package-lock.json` after `npm install`
✅ **Do**: Always commit both `package.json` and `package-lock.json`

❌ **Don't**: Push without testing build locally
✅ **Do**: Run `npm run build` before pushing

❌ **Don't**: Expect instant deployment after push
✅ **Do**: Wait 1-2 min for Actions + 1-2 min for CDN

❌ **Don't**: Forget to hard refresh after deployment
✅ **Do**: Always hard refresh browser to see changes

---

## Emergency Recovery

### If Site is Completely Broken

1. **Revert to Last Known Good Commit**
   ```bash
   git checkout 022-dashboard-welcome
   git log --oneline -5                    # Find last good commit
   git reset --hard <commit-hash>          # Revert to it
   git push --force                        # Force push (use carefully!)
   ```

2. **Or Restore from Specific Commit**
   ```bash
   git checkout 022-dashboard-welcome
   git revert <bad-commit-hash>            # Creates new commit that undoes changes
   git push
   ```

---

## Key URLs (Bookmarks)

- **Live Site**: https://allyouneedisalightjacket.com/people/
- **GitHub Repo**: https://github.com/willplicate/people
- **GitHub Actions**: https://github.com/willplicate/people/actions
- **Pages Settings**: https://github.com/willplicate/people/settings/pages
- **Environments**: https://github.com/willplicate/people/settings/environments

---

## Notes

- This guide was created after encountering deployment issues **twice**
- Keep this reference handy before starting new features
- Production branch is `022-dashboard-welcome`, not `main`
- Always verify GitHub Pages settings after any GitHub changes

**Last Updated:** 2025-11-03
**Current Production Branch:** `022-dashboard-welcome`
