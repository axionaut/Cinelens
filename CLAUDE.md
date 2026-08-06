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

## Testing

A browser smoke harness drives the real app in headless Chrome:

```sh
node dev/harness.mjs dev/assert-v104.mjs
```

Assertion files export `default async function run(t)` and use `t.assert`,
`t.equal`, `t.deepEqual`, `t.page.evaluate`, `t.resetStorage`. The harness stubs
Wikipedia/TMDB/Gemini via `window.__CINELENS_HARNESS__`.

`dev/` is gitignored, so assertion files are local-only. `dev/assert-current.mjs`
is a v90-era suite with known stale expectations; `dev/assert-v104.mjs` is
current.

Always run `node --check app.js` after edits.

## Backend

`Apps Script.txt` is the Gemini tagger deployed as a Google Apps Script web app.
**Changing it requires Nitin to redeploy manually** — say so explicitly when a
change depends on it. `MAX_ITEMS = 20` is the batch ceiling the client targets.

## Documentation

`spec.md` (~4k lines) is the behavioural record, organised by version. Newer
sections supersede older ones; when correcting stale text, mark the old passage
as superseded rather than silently rewriting history. Append a numbered section
for substantive changes.
