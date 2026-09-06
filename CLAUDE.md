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
node dev/harness.mjs dev/assert-v<NEW>.mjs   # when one focused check is practical
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

## Testing — one focused check, not the museum

**The historical suite is retired from the release workflow.** `dev/archive/`
holds `assert-current`, `assert-multidevice` and `assert-v104 … v140`. They pin
contracts that later versions deliberately superseded, so red there is not
evidence a change is wrong, and green there buys no confidence in a scoped edit.
Do not run them as a release step, do not repair them, and do not let their
count stand in for judgement. Run one only when Nitin asks for that diagnostic.

Write at most **one focused assertion per release**, `dev/assert-v<NEW>.mjs`,
covering only the contract that release changed. Copy `dev/assert-template.mjs`,
which carries the fixture helpers and runs green as-is.

```sh
node dev/harness.mjs dev/assert-v141.mjs
```

Assertion files export `default async function run(t)` and use `t.assert`,
`t.equal`, `t.deepEqual`, `t.page.evaluate`, `t.resetStorage`,
`t.seedIndexedDb`, `t.readIndexedDb`, `t.openApp`,
`t.waitForNoPendingLocalSave`. Wikipedia/TMDB/Gemini are stubbed via
`window.__CINELENS_HARNESS__`. Any fatal console error fails the run. See
`dev/README.md` for the full API.

Two rules make a focused check worth the time:

- **See it fail before you trust it.** Run it against the unfixed code, or break
  the fix once the file is written and confirm only that assertion reddens. A
  green-first test confirms your mental model, not the app's behaviour — and a
  wrong model with a green suite is worse than no suite. Record what you broke
  on a `FALSIFIED:` line in the file.
- **Assert behaviour, not source text.** `t.page.evaluate` running the real
  function beats grepping `app.js`: a regex matches comments, matches a
  similarly-named function, and keeps passing after the code moves.

`dev/` is gitignored, local-only and unbacked — nothing in it is ever staged,
and no release depends on it. `dev/assert-perf.mjs` is the profiler; run it
before optimising.

## Backend

`Apps Script.txt` is the Gemini tagger deployed as a Google Apps Script web app.
**Changing it requires Nitin to redeploy manually** — say so explicitly when a
change depends on it. `MAX_ITEMS = 20` is the batch ceiling the client targets.

## Documentation

`spec.md` (~4k lines) is the behavioural record, organised by version. Newer
sections supersede older ones; when correcting stale text, mark the old passage
as superseded rather than silently rewriting history. Append a numbered section
for substantive changes.
