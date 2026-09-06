# CineLens

A personal movie/TV recommendation app. Static, no build step, no dependencies:
`index.html` + `styles.css` + `app.js` served directly from the repository root
by GitHub Pages. `app.js` is a single ~11k-line file — that is deliberate, not
technical debt to "fix".

## Working agreements

- **One `APP_VERSION` bump per request.** One request = one bump, one commit,
  one push. Never bump incrementally mid-task. The value is rendered in the
  header, so it is how Nitin tells whether a deploy has landed — if he reports
  behaviour that contradicts a recent change, check the version badge in his
  screenshot before investigating.
- **No `Co-Authored-By` trailer** on commits in this repo.
- **Answer concisely.** Short, direct replies. Detailed prose belongs in code
  comments, commit messages and `spec.md`, not in chat.
- **Don't poll the live deploy** after every push. Only check when a recent
  Pages run failed.
- **`.claude/gate.sh` enforces the mechanical half of the two rules above** at
  `git commit`. See Release workflow.

## Data model

State lives in `state` and persists to IndexedDB (record-scoped) plus Google
Drive (a manifest with hashed catalogue chunks; only changed chunks upload).
`localStorage` holds only a small bootstrap.

Key per-title fields:

- **Wikipedia identity** — `wikiPageId`, `wikiTitle`, `pageTitle`, `storyText`
- **TMDB identity** — `tmdbId`, `tmdbTitle`, `tmdbYear`, `tmdbIdVerified`,
  `posterUrl`, `watchAvailability`, `tmdbReviewText`
- **Tags** — `tags`, `aiTagEvidence`, `aiTagging` (status, prompt version,
  story hash, `usableTagCount`, `underfilled`, `topUpAttempts`)
- **User state** — `rating`, `ratedAt`, `manualAdded`, `suppressedTags`

`tmdbTitle`/`tmdbYear` exist so a wrong TMDB pairing is *detectable*. Without
them a record can display one film's title and another's poster with nothing
stored disagreeing — see `spec.md` 31.15.

## Invariants worth knowing before editing

- **Stored tags vs displayed tags are different sets.** `movie.tags` is what was
  committed; `recommendationScoringTags` is that list after `tagIsPresentable`
  drops generic single words and tags appearing in >10% of the library. A title
  can hold 10 and show 6. Count with `usableTagCount` when a floor matters.
- **`tagEvidenceOk` runs on every load** via `normaliseStoredTitleRecord` →
  `cleanTagArray`. Anything that removes source text must be shed-aware or it
  silently deletes grounded tags.
- **Never evict titles to save space.** A title dropped today may match well
  after a later tagger change. Shed bytes (`sourceShed`), not records.
- **Rating evidence is the taste model's only input.** Removing a rated title
  unlearns what it taught. Preferences are applied at scoring time, not training.
- **Pacing lives in `AdaptiveLimiter`**, one per upstream. Do not reintroduce
  fixed `sleep(DELAY - elapsed)` gates or process-wide serialisation.

## Release workflow

Default for an ordinary request: diagnose the concrete code path, implement the
scoped fix directly, run the compact checks, bump `APP_VERSION` once, append the
`spec.md` section, commit and push. No design-and-approve loop and no
implementation brief unless Nitin asks for one. He does the extended browser
testing and reports regressions for the next iteration.

The compact checks are the whole release bar for a scoped change:

```sh
node --check app.js
git diff --check
```

`.claude/gate.sh` runs the mechanical half at `git commit` and blocks the commit
with a reason: unbumped `APP_VERSION`, failing `node --check`, whitespace
damage, a missing `## <NEW>.` section in `spec.md`, a `Co-Authored-By` trailer,
double-decoded characters, or a staged local-only file. It is quiet for every
other command and for commits that do not touch `app.js`. A blocked commit means
fix the named thing — never work around the gate.

This is a testing-scope preference, not licence to skip safety or hide
uncertainty. Destructive actions, Drive/IndexedDB migrations and anything that
can lose rated titles still need the normal care and an explicit decision from
Nitin where the call is his.

## Testing — there is no assertion suite, and none is to be created

**Nitin does the testing.** Claude writes the code, reads the actual data path
before changing it, runs the compact checks above, and confirms at UI/UX level
when that is warranted. Nitin runs the app and reports regressions.

**Do not create `dev/assert-v<N>.mjs`, a "current" suite, a template, or any
file that accumulates one contract per release.** That set existed and was
deleted (2026-09-06, owner). Every file pinned the behaviour of the release
that wrote it, and the app then evolved past it, so later runs argued with
history instead of finding defects — the reconciliation cost more than the bugs
were worth. Writing one focused assertion per release rebuilds the same pile a
release at a time. Depth belongs in reading the code path, not in a stored
claim about it.

`dev/harness.mjs` remains for a **throwaway** browser probe when a question
genuinely cannot be settled by reading the code. Write it in the session
scratchpad, never in `dev/`, and delete it once it has answered:

```sh
node dev/harness.mjs "$SCRATCHPAD/probe.mjs"
```

A probe that calls the helper you just added proves nothing about whether it is
wired in — reach the real entry point (`matchesGlobalFilters`, not
`matchesWatchPlatformFilter`). `dev/README.md` has the API and the two traps.

`dev/` is gitignored, local-only and unbacked — nothing in it is ever staged,
and no release depends on it. `dev/assert-perf.mjs` is the profiler despite the
name; run it before optimising.

## Backend

`Apps Script.txt` is the Gemini tagger deployed as a Google Apps Script web app.
**Changing it requires Nitin to redeploy manually** — say so explicitly when a
change depends on it. `MAX_ITEMS = 20` is the batch ceiling the client targets.

## Documentation

`spec.md` (~4k lines) is the behavioural record, organised by version. Newer
sections supersede older ones; when correcting stale text, mark the old passage
as superseded rather than silently rewriting history. Append a numbered section
for substantive changes.
