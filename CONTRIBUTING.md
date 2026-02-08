# Contributing to Koinos Wallet

## Branch Strategy

We use a simplified Git Flow with two long-lived branches and short-lived feature branches.

```
main (production)
  └── develop (integration)
       ├── feature/burn-koin
       ├── feature/nft-gallery
       └── fix/balance-refresh
```

### Branch Overview

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Stable production code. Every commit is a potential release. | App Store / Play Store |
| `develop` | Integration branch. Features are merged here for testing before release. | Internal testing |
| `feature/*` | New functionality. Short-lived, branched from `develop`. | — |
| `fix/*` | Bug fixes. Short-lived, branched from `develop` (or `main` for hotfixes). | — |

### Rules

- **Never commit directly to `main`** — only merge from `develop` (or hotfix branches).
- **Never commit directly to `develop`** — always use feature/fix branches.
- **`main` and `develop` must always be in a buildable state.**
- **Delete feature branches** after merging.

---

## Daily Workflow

### 1. Start a New Feature

```bash
# Make sure develop is up to date
git checkout develop
git pull origin develop

# Create your feature branch
git checkout -b feature/my-new-feature
```

### 2. Work on Your Feature

```bash
# Make changes, commit often with clear messages
git add -A
git commit -m "feat: add token swap UI"

git add -A
git commit -m "feat: integrate swap contract calls"

# Push to remote regularly (backup + visibility)
git push -u origin feature/my-new-feature
```

#### Commit Message Convention

Use prefixes to categorize commits:

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring (no behavior change) |
| `test:` | Adding or updating tests |
| `docs:` | Documentation changes |
| `chore:` | Config, dependencies, tooling |

### 3. Merge Feature into Develop

When your feature is complete and tested:

```bash
# Update develop first
git checkout develop
git pull origin develop

# Merge your feature
git merge feature/my-new-feature

# Push develop
git push origin develop

# Delete the feature branch (local + remote)
git branch -d feature/my-new-feature
git push origin --delete feature/my-new-feature
```

### 4. Release to Production

When `develop` is stable and ready for release:

```bash
# Switch to main
git checkout main
git pull origin main

# Merge develop into main
git merge develop

# Tag the release
git tag v1.2.0
git push origin main --tags

# Go back to develop for next cycle
git checkout develop
```

---

## Hotfix Workflow

For urgent fixes that need to go to production immediately:

```bash
# Branch from main
git checkout main
git checkout -b fix/critical-signing-bug

# Fix the issue, commit
git add -A
git commit -m "fix: handle null signer in transaction flow"

# Merge into main
git checkout main
git merge fix/critical-signing-bug
git tag v1.2.1
git push origin main --tags

# Also merge into develop so it has the fix
git checkout develop
git merge fix/critical-signing-bug
git push origin develop

# Clean up
git branch -d fix/critical-signing-bug
```

---

## Version Tagging

We follow [Semantic Versioning](https://semver.org/):

```
v{MAJOR}.{MINOR}.{PATCH}

MAJOR — breaking changes or major redesigns
MINOR — new features (backwards compatible)
PATCH — bug fixes
```

Examples:
- `v1.0.0` → Initial App Store release
- `v1.1.0` → Added VHP token support
- `v1.1.1` → Fixed balance refresh bug
- `v2.0.0` → Complete UI redesign

---

## Quick Reference

```bash
# See all branches
git branch -a

# See current branch
git branch --show-current

# See recent history
git log --oneline --graph -10

# Sync develop with latest
git checkout develop && git pull origin develop

# Start feature
git checkout develop && git checkout -b feature/name

# Finish feature
git checkout develop && git merge feature/name && git push origin develop
```
