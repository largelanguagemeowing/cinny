# AGENTS.md

This repository is a private fork of [cinnyapp/cinny](https://github.com/cinnyapp/cinny), kept in sync with upstream `dev` via rebase. This file documents the workflow that any agent (human or AI) working in this repo must follow.

## Remotes

```
origin    git@github.com:largelanguagemeowing/cinny.git   (the fork, push here)
upstream  git@github.com:cinnyapp/cinny.git                (read-only source of truth)
```

- `origin` is the fork you own and push to.
- `upstream` is the original cinnyapp/cinny. Fetch only. Never push here.

## Branch layout

```
upstream/dev  --*--*--*--*--*--*--*   (read-only)
                 | ff-only
dev           --*--*--*--*--*--*--*   (mirror, push to origin)
                 | rebase
fork/dev      --*--*--*  <- fork-specific commits, always on top
```

- `dev` is a pure fast-forward mirror of `upstream/dev`. Never commit on it. Never rebase or merge into it. It only ever advances via `git merge --ff-only upstream/dev`.
- `fork/dev` is where all fork-specific work lives. It is rebased onto `dev` on every sync. This is the branch you build and deploy from.

## Where to commit

- All fork-specific changes go on `fork/dev`.
- Do not commit on `dev`. The `git sync` alias enforces this with a fast-forward-only merge that will refuse to run if `dev` has diverged.
- Keep commits small and atomic. Small commits make rebase conflicts easy to resolve and easy to reorder or squash. Since this is a private fork with no upstream PRs, you are free to squash aggressively.

## Syncing with upstream

Run the one-command sync:

```bash
git sync
```

This runs, in order:

1. `git fetch upstream`
2. `git checkout dev`
3. `git merge --ff-only upstream/dev` (aborts if `dev` has diverged)
4. `git push origin dev`
5. `git checkout fork/dev`
6. `git rebase dev` (replays your commits on top of the new `dev`)
7. `git push --force-with-lease origin fork/dev`

If any step fails, fix the cause and rerun. The `--force-with-lease` on the final push will fail if `origin/fork/dev` has moved since your last fetch, which protects against clobbering work pushed from another clone.

## Useful aliases

```bash
git sync        # full upstream sync (see above)
git fork-log    # show commits fork/dev carries on top of dev
git dev-log     # show recent upstream commits on dev
```

## Config in effect (repo-local)

```
rebase.autoStash              = true
pull.rebase                   = true
push.default                  = current
branch.dev.remote             = upstream   (fetch)
branch.dev.pushRemote         = origin
branch.fork/dev.remote        = .          (rebases onto local dev)
branch.fork/dev.pushRemote    = origin
branch.fork/dev.rebase        = true
```

## Recovering from a messy rebase

1. `git rebase --abort` to get back to the pre-rebase state.
2. Squash or reorder your commits: `git rebase -i dev`.
3. Retry `git sync`.

If one upstream commit conflicts with several of yours, squashing yours first usually makes the conflict trivial.

## Fork-only files

- `AGENTS.md` itself is fork-only. It does not exist upstream and must survive every rebase.
- Any other fork-only files (scripts, configs) should be clearly named and kept in fork-specific paths so they do not collide with upstream files during rebase.
