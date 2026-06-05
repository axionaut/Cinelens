# CineLens Specification

## 1. Product Summary

CineLens is a static browser app for building a personal movie and TV recommendation engine using Wikipedia as the title and plot source, local browser storage as the primary data store and optional Google Drive sync for persistence across sessions/devices.

The app is designed for Hindi and English movies and shows only. It must collect candidate titles automatically, process them only when a real plot/synopsis/premise/story section exists, derive meaningful plot tags from that story text, learn from the user’s ratings and recommend titles based on the user’s positive and negative taste signals.

The app must behave like a recommendation engine, not like a Wikipedia category browser. Wikipedia collection order is housekeeping. It must not leak into recommendation display order.

## 2. Current Packaging

The browser app is split by responsibility:

```text
index.html  HTML layout and external script/style references
styles.css  visual styling and responsive rules
app.js      application logic, integrations and persistence
```

`index.html` loads the Google Identity Services client followed by `app.js` at
the end of the body. The files must remain deployable together as a static site.

Repository text files use LF line endings through `.gitattributes` so edits do
not produce misleading whole-file diffs on Windows.

### 2.1 Genre Signal

Genres are stored separately from story concepts. They are derived only from
Wikipedia lead/category metadata, not guessed from isolated plot words.

- Existing saved Wikipedia titles derive genres from their stored lead text
  during housekeeping; they do not require an immediate refetch.
- Fresh and re-tagged titles also use Wikipedia categories.
- Rated-title genre preferences contribute to recommendation weight at 35% of
  a concept weight.
- Positive concept overlap remains the primary ranking rule. Genre preference
  influences weighted ordering within the same concept-overlap tier.
- Cards show their genres explicitly and highlight genres shared with the
  user's positive taste profile.

The release smoke test must confirm that the split stylesheet and application
script load in headless Chrome, the app executes its initial render, removed
availability controls remain absent and every temporary browser profile/output
file is deleted. Genre changes additionally require JavaScript syntax checks
and targeted source assertions for extraction, weighting, card display and
overlap-first ordering.

## 3. Core User Requirements

### 3.1 Content Scope

The app must support:

- Hindi movies
- English movies
- Hindi TV shows / series / miniseries
- English TV shows / series / miniseries

The app must reject or skip:

- Non-movie pages
- Non-TV-show pages
- Franchise pages
- Actor/person pages
- Director/person pages
- Soundtrack pages
- Category/list/template pages
- Pages with no real plot/synopsis/premise/story section
- Pages with only intro/lead text and no usable story section
- Pages outside Hindi/English scope

### 3.2 Recommendation Goal

Once the user has rated enough titles, automatic fetching should continue in the background until the app has at least:

```text
5 recommendations at the strongest available overlap tier
```

The strongest tier means the title shares the current maximum number of positive concepts, then reaches nearly the best weighted fit inside that overlap tier. The implementation uses:

```js
const PERFECT_REC_TARGET = 5;
const PERFECT_REC_MIN_RATIO = 0.995;
```

The ratio is used only inside the maximum-overlap tier because floating-point weighted fit can make exact equality brittle.

### 3.3 Manual Add

Manual add should use a Wikipedia URL, not a typed title.

The input should accept:

```text
https://en.wikipedia.org/wiki/Page_Title
https://en.wikipedia.org/w/index.php?title=Page_Title
```

The manual add pipeline must be the same as the automatic collection pipeline:

1. Parse Wikipedia page title from URL.
2. Fetch Wikipedia page.
3. Confirm usable movie/show identity.
4. Confirm Hindi/English scope.
5. Require real plot/synopsis/premise/story section.
6. Derive tags from story text.
7. Add to pool.
8. Prompt the user to rate the newly added title.
9. Save locally.
10. Sync to Drive when connected.
11. Re-render relevant counts/cards.

### 3.4 Pool Visibility

The user must be able to inspect the pool.

Pool must be a full tab, not a hidden internal store.

Pool entries must use the same card design as recommendation/rated/watchlist cards for visual consistency.

Pool cards must support:

- Rating stars
- Full tag visibility
- Removable tags
- Retag button
- Watchlist button
- Delete/remove button

### 3.5 Rejected Visibility

The user must be able to inspect rejected titles.

Rejected tab must show:

- Rejected title
- Mode/source
- Reason
- Retry action
- Forget/remove action

Rejected titles should not be silently lost.

### 3.6 Rated Visibility

Rated must be its own tab and must actually show rated cards.

Rated cards must use the same card component as the rest of the app.

Rated tab must show all rated titles that match the selected type context where applicable.

### 3.7 Watchlist Visibility

Watchlist must be its own tab.

Watchlist cards must use the same card component.

### 3.8 Tags / Tag Brain Visibility

Tags must be its own tab.

Tag Brain should show user taste signals derived from ratings.

Tag Brain is secondary to recommendations. It must not crowd the recommendation page.

### 3.9 Infinite Recommendations

Recommendations page should be infinite in the user-facing sense:

- Initial recommendation card count loads first.
- Scrolling near the bottom loads more cards.
- Watchlist, Rated and Tags should not sit under recommendations on the same page.
- Each major view belongs in its own tab.

The implementation currently uses:

```js
const REC_INFINITE_PAGE_SIZE = 20;
```

### 3.10 Go to Top

A Go to Top button must appear after scrolling down and take the user back to the top smoothly.

### 3.11 Stop Fetching

Stop Fetching must stop immediately enough to feel immediate to the user.

It must:

- Abort the current Wikipedia request when possible.
- Cancel pending throttle sleep.
- Prevent auto-fetch from restarting immediately after render.
- Restore the manual Expand Pool action as the explicit way to resume fetching.

It must not merely say “stopping after current request” while the UI continues crawling.

### 3.12 Dynamic Updates

The user wants dynamic progress without screen flicker.

Correct behavior:

- Stats/counts update immediately during fetching.
- Cards do not re-render after every title.
- Cards refresh after a batch, currently every 20 added titles.
- Cards also refresh immediately when the 5 × 100% target is reached.
- Final render happens when fetching stops or completes.

The implementation currently uses:

```js
const CARD_REFRESH_BATCH_SIZE = 20;
```

## 4. UI Specification

### 4.1 Visual Direction

Visual direction is:

```text
Dark Cinema shell + Dense Analyst cards
```

Do not use the word “Noir” as the product/design name.

The interface should feel:

- Dark
- Compact
- Film-native
- Fast to scan
- Data-rich
- Consistent

Avoid:

- White cards
- Fake poster placeholders taking excessive space
- Cramped one-row pool tables
- Alphabetical recommendation dumps
- Multiple sections stacked under one tab
- Excessive decorative effects

### 4.2 Layout Width

The app should use the available browser width efficiently.

The previous issue was large empty space on the left and right. The grid should expand responsively across the page.

Recommended behavior:

```css
.container {
  max-width: none or very high practical value;
  width: 100%;
}

.movies-grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
```

Card width should remain readable and avoid becoming tiny tiles.

### 4.3 Header Tabs

Top tab bar should include:

- All / Recommendations
- Movies
- Shows
- Rated
- Watchlist
- Tags
- Pool
- Rejected

Current code uses `activeTab` and `setTab(tab, btn)`.

Implementation detail: Movies and Shows may remain filters for recommendations rather than full isolated top-level views, but the visible sections must match user expectation:

- Recommendations tab: only recommendations
- Rated tab: only rated
- Watchlist tab: only watchlist
- Tags tab: concept brain plus the selected concept's shared title-card workspace
- Pool tab: only Pool
- Rejected tab: only Rejected

### 4.4 Control Deck

Controls should be visually separated into readable rows.

Recommended grouping:

Row 1:

- Top Recs slider
- Since/year numeric field
- Hindi + English / Hindi / English selector
- Tag count/housekeeping status

Row 2:

- Add Wikipedia URL input
- Fetch from URL button
- Drive status
- Drive button
- Expand Pool / Stop Fetching button

The previous huddling issue came from cramped flex wrapping. Controls need `row-gap`, `column-gap` and/or dedicated rows.

### 4.6 Cards

All major title displays should use the same card design.

Cards should include:

- Title
- Match % where applicable
- Year / language / country / format metadata
- Match bar where applicable
- Star rating control
- Canonical concepts ordered by relevance
- Actions

Actions should include, where relevant:

- Re-tag
- Watchlist / Remove from Watchlist
- Delete/remove title
- Expand/collapse tags

Every card must have a Retag button, not only Pool entries.

### 4.7 Tags on Cards

Normal cards may show a limited number of concepts with expand/collapse.

Expanded cards may show all concepts because Pool and Tags are auditing workspaces.

Concept removal uses the global `Concept clicks: remove` toggle rather than a tiny per-chip `×`.

Removing a concept must:

- Add it to the title's persisted `suppressedConcepts`
- Keep it suppressed through canonical rebuilds and retagging
- Recompute tag weights
- Save locally
- Sync to Drive when connected
- Re-render

### 4.8 Manual Rating Prompt

After manual URL add succeeds, show a rating prompt immediately.

The modal/prompt should show:

- Title
- Year
- 1–5 rating stars or buttons
- Skip/Not now option

Rating from the prompt should use the same `rateMovie()` logic so recommendations update correctly.

## 5. Data Model

### 5.1 Root State

Current state shape:

```js
state = {
  movies: {},
  tagWeights: {},
  settings: {
    topN,
    minYear,
    languageFilter,
    tagDeleteMode
  },
  drive: {
    connected,
    accessToken,
    folderId,
    fileId
  },
  rejectedWikiTitles: {},
  poolFetched
}
```

### 5.2 Movie Object

A processed title should contain:

```js
{
  id,
  title,
  year,
  director,
  language,
  country,
  format,          // absent/undefined for movie, 'series' or 'miniseries' for shows
  tags,
  coreTags,
  plotTags,
  storyText,
  leadText,
  tagged,
  rating,
  watchlist,
  source,
  wikiTitle,
  pageTitle
}
```

### 5.3 Rejected Title Object

Rejected entries are currently stored in `state.rejectedWikiTitles` using keys such as:

```js
mode:normalised-title
```

A rejected item should contain:

```js
{
  title,
  mode,
  reason,
  source,
  at
}
```

Reasons should be human-readable enough for the Rejected tab.

Examples:

- no usable plot/synopsis section
- not Hindi/English
- not movie/show
- year before cutoff
- duplicate
- Wikipedia URL could not be processed
- fetch aborted

## 6. Wikipedia Collection Specification

### 6.1 API Discipline

The app must avoid bombarding Wikipedia.

Current throttle settings:

```js
const WIKI_REQUEST_DELAY_MS = 850;
const WIKI_BATCH_PAUSE_MS = 2500;
```

Expected behavior:

- One request at a time.
- Delay between requests.
- Batch pause after groups of requests.
- Cache existing and rejected titles.
- Never repeatedly fetch the same rejected title in a loop.
- Stop button aborts active fetch.

### 6.2 Candidate Sources

Automatic candidate discovery should use mixed source lanes, not simple alphabetical category crawl.

Source lanes include:

- Wikipedia film categories
- Wikipedia TV list pages
- Wikipedia navigation list pages
- Curated English movie title list
- Curated Hindi movie title list
- Curated show title list
- Search-related lanes where relevant
- Manual URL lane

Current constants include:

- `WIKI_SOURCES`
- `WIKI_LIST_SOURCES`
- `WIKI_NAVIGATION_LISTS`
- `EXPANSION_ENGLISH`
- `EXPANSION_HINDI`
- `EXPANSION_SHOWS`

The candidate system should:

1. Gather titles from all enabled lanes.
2. Shuffle each lane.
3. Round-robin across lanes.
4. Remove duplicates.
5. Exclude existing titles.
6. Exclude rejected titles.
7. Process candidates through the same validation pipeline as manual URL add.

### 6.3 Fetching a Wikipedia Title

Current function:

```js
fetchWikiMovie(wikiTitle, mode='all')
```

Expected behavior:

1. Fetch page extract and categories using Wikipedia API.
2. Read lead section for identity only.
3. Split the extract into sections and select the strongest section whose content is genuinely narrative.
4. Reject the page if no valid story section exists.
5. Determine year.
6. Determine language.
7. Determine country.
8. Determine format: movie vs series/miniseries.
9. Validate against requested mode.
10. Derive tags from story text.
11. Return normalized movie object.

### 6.4 Plot Required Rule

This is critical.

No content-qualified narrative section means skip.

Do not fall back to intro/lead for tagging.

Intro/lead may help identify the page, year, language, country and format, but not tags.

Do not use an exact-heading allowlist. Wikipedia headings vary and may combine concepts, such as `Premise and main characters`.

- Evaluate every real section by narrative content.
- Treat heading words only as weak supporting signals.
- Penalize or reject production, reception, casting, episode-list, music, release, marketing, awards and similar non-story content.
- Select the strongest qualifying section rather than the first familiar heading.

## 7. Tagging Engine Specification

### 7.1 Purpose

Tags are the brain of CineLens.

The recommendation system is only as good as tag hygiene. A false shared tag makes unrelated titles look similar. A missing tag is a small loss. A wrong tag is poison.

Tagging must therefore follow this rule:

```text
Fewer verified tags are better than many invented tags.
```

### 7.2 Tag Groups

The app keeps three tag arrays on each title:

```js
tags
coreTags
plotTags
```

#### `tags`

The full saved tag set for display and audit.

It may include:

- language tag
- country tag
- decade tag
- format tag
- genre tags
- tone tags
- setting tags
- plot tags
- director/style tags

#### `coreTags`

The scoring tag set used by the recommendation engine.

These must be high-confidence and useful for taste matching.

Examples:

- crime-thriller
- serial-killer-thriller
- supernatural-horror
- space-sci-fi
- artificial-intelligence
- time-manipulation
- war-drama
- prison-setting
- courtroom-drama
- political-thriller
- spy-thriller
- heist-thriller
- sports-drama
- twist-ending
- non-linear-narrative
- unreliable-narration
- morally-ambiguous-protagonist
- revenge-driven
- grief-and-loss
- power-and-ambition
- slow-burn
- psychological
- satirical
- visually-striking

#### `plotTags`

The audit-facing plot tag set.

It must contain only evidence-backed tags. It must not be padded to a fixed count.

### 7.3 Removed Minimum Tag Padding

The earlier logic used:

```js
const MIN_PLOT_TAGS = 20;
```

That caused contamination because `ensureMinimumPlotTags()` added broad fallback tags when a title did not naturally produce enough tags.

The new rule is:

```js
const MIN_PLOT_TAGS = 0;
```

`ensureMinimumPlotTags()` must never add generic fallback tags. It now returns cleaned, evidence-backed non-meta tags only.

This is intentional. A movie with 6 accurate tags is better than a movie with 6 accurate tags and 14 fake ones wearing a cheap moustache.

### 7.4 Contaminated Fallback Tags

These tags are treated as contaminated because they were previously used as filler:

```js
const LOW_CONFIDENCE_PLOT_TAGS = new Set([
  'protagonist-driven','conflict-driven','character-driven','plot-driven','dramatic-stakes',
  'goal-oriented-plot','relationship-conflict','moral-choice','escalating-conflict','personal-cost',
  'turning-point-heavy','dialogue-driven','emotional-stakes','social-context','consequence-driven',
  'journey-arc','high-stakes','character-growth','world-building','genre-hybrid',
  'central-conflict','main-character-goal','character-relationships','narrative-stakes','decision-pressure',
  'setting-driven','identity-pressure','authority-conflict','danger-driven','emotional-pressure',
  'social-pressure','professional-pressure','family-pressure','survival-pressure','hidden-information',
  'investigation-thread','personal-history','opposition-force','moral-pressure','resolution-driven'
]);
```

The implementation also creates:

```js
const CONTAMINATED_FALLBACK_TAGS = new Set([...LOW_CONFIDENCE_PLOT_TAGS]);
```

These tags must be removed from existing data and blocked from future scoring.

### 7.5 Tag Cleaning Helpers

The app must include shared cleaning helpers:

```js
function normaliseTagName(tag)
function cleanTagArray(tags, movie=null, keepLowConfidence=false)
function cleanContaminatedTags(silent=true)
```

`normaliseTagName()` converts tags to lower-case hyphenated names.

`cleanTagArray()` must:

1. Normalise tag names.
2. Remove blank tags.
3. Remove contaminated fallback tags by default.
4. Apply `tagEvidenceOk()` where movie context exists.
5. Deduplicate.

`cleanContaminatedTags()` must:

1. Walk every saved title.
2. Replace seed title tags from `SEED_TAGS` where available.
3. Rebuild Wikipedia title tags from saved `storyText` where available.
4. Strip contaminated tags from non-Wikipedia/manual items.
5. Rebuild `coreTags`.
6. Rebuild `plotTags` without filler.
7. Recompute `state.tagWeights`.
8. Save local state when changes were made.

### 7.6 Existing Data Migration

The app must clean already saved contaminated data automatically.

On app load:

```js
loadLocalState();
cleanContaminatedTags(true);
seedPool();
```

When Drive data is loaded:

```js
loadFromDrive()
```

must call `cleanContaminatedTags(true)` immediately after assigning `state.movies` from Drive.

When Drive data was cleaned, the app must sync the cleaned copy back to Drive so the poisoned version does not return in the next session.

### 7.7 Seed Title Rules

Seed titles must use only their curated `SEED_TAGS`.

Seed titles must not call filler logic.

Correct seed behaviour:

```js
movie.tags = cleanTagArray(SEED_TAGS[movie.id], movie, false);
movie.coreTags = cleanTagArray(recommendationTags(movie.tags), movie, false);
movie.plotTags = [];
```

This prevents hardcoded seed titles from receiving fake plot tags when no `storyText` exists.

### 7.8 Wikipedia Title Rules

Wikipedia titles must be tagged from the extracted story section.

Correct Wikipedia behaviour:

```js
const rawTags = cleanTagArray(deriveTagsFromText(storyText, meta), meta, false);
const coreTags = cleanTagArray(recommendationTags(rawTags), meta, false);
const plotTags = cleanTagArray(ensureMinimumPlotTags(rawTags, storyText, meta), meta, false);
const tags = cleanTagArray([...rawTags, ...coreTags, ...plotTags], meta, false);
```

The `meta` object must include:

```js
source: 'wikipedia'
storyText
leadText
```

so evidence checks have the page context.

### 7.9 Housekeeping Rules

`runHousekeeping()` must not reintroduce contaminated tags.

For Wikipedia items with `storyText`, housekeeping should rebuild from current tag logic rather than trust old saved tags.

For seed/manual items without story text, housekeeping should clean existing tags and leave `plotTags` empty.

Housekeeping must recompute tag weights after cleanup.

### 7.10 Broad Keyword Trap Prevention

Do not use broad single words as decisive evidence for specific genres.

Known bad examples:

- `match` must not trigger sports-drama.
- `game` must not trigger sports-drama by itself.
- `time` must not trigger time-manipulation.
- `past` must not trigger time-manipulation.
- `future` must not trigger sci-fi or time-manipulation by itself.
- `war` must not trigger war-drama when used metaphorically.

### 7.11 Specific Tag Evidence Rules

#### sports-drama

Require sports-specific evidence such as:

```text
football, cricket, basketball, baseball, tennis, boxing, wrestling, racing driver, athlete, sports coach, tournament, championship, world cup, olympics, sports team, hockey, kabaddi
```

Avoid triggering from:

```text
match, game, team, play
```

unless combined with sport-specific terms.

#### war-drama

Require clear military/war evidence such as:

```text
world war, wwii, world war ii, nazi, soldier, military unit, army officer, battlefield, combat mission, war-torn, wartime
```

#### time-manipulation

Require clear evidence such as:

```text
time travel, time loop, travels back in time, travels forward in time, temporal, paradox, alternate timeline, parallel timeline
```

Do not trigger from:

```text
time, past, future, memory, years later
```

### 7.12 Retagging

Retag must:

1. Refetch the Wikipedia page.
2. Re-extract mandatory story section.
3. Rebuild tags from the current tagger.
4. Rebuild `coreTags` and `plotTags` through `cleanTagArray()`.
5. Preserve user rating and watchlist status.
6. Save locally.
7. Sync Drive when connected.
8. Re-render.

Retag should fail cleanly when the page no longer passes rules.

## 8. Recommendation Engine Specification

### 8.1 Learning From Ratings

Ratings are 1–5 stars.

Current weight logic:

```js
weight = rating - 3
```

Meaning:

- 5 stars = strong positive signal
- 4 stars = mild positive signal
- 3 stars = neutral
- 2 stars = mild negative signal
- 1 star = strong negative signal

Tags from rated titles update `state.tagWeights`.

### 8.2 Scoring Candidates

Recommendation candidates are unrated titles from the pool that match selected scope and filters.

A candidate is ranked first by the number of positively weighted concepts it shares with the user's rated-title taste profile. Negative overlap and weighted contribution then refine that order.

Recommendations must be sorted by positive overlap count, negative overlap count and then weighted score, not alphabetically.

Alphabetical order may be used only as a tie-breaker.

### 8.3 Match Display

Match percentage is absolute weighted taste coverage:

```js
matchPct = Math.round(positiveWeightedContribution / totalPositiveTasteWeight * 100)
```

The first ranked recommendation is not automatically labeled 100%.

The background target means at least five recommendations in the strongest positive-overlap tier and near its best weighted fit, using `PERFECT_REC_MIN_RATIO`.

### 8.4 Recommendation Candidate Filters

Candidate must:

- Be unrated
- Be tagged
- Meet minimum year cutoff
- Match selected tab context when applicable

## 9. Persistence Specification

### 9.1 Local Storage

The app must persist to browser `localStorage` under:

```js
cinelens_v2
```

Data saved:

- movies
- settings
- rejectedWikiTitles

### 9.2 Google Drive Sync

Google Drive file name:

```js
cinelens_data.json
```

Drive scope:

```js
https://www.googleapis.com/auth/drive.file
```

Drive sync should:

- Find existing `cinelens_data.json`
- Load it when connected
- Create it if missing
- Patch it on sync
- Store and restore Drive file ID
- Sync local state after meaningful changes

### 9.3 Drive Token Persistence

Drive token must survive refresh and reopening while valid.

Current token keys:

```js
cinelens_drive_token_v1
cinelens_drive_token_expiry_v1
```

Expected behavior:

- On load, attempt Drive restore if a valid token exists.
- If token expired, clear it and show not connected.
- Manual Drive button requests interactive token.
- Silent token request may be attempted where Google/browser allows.
- If browser blocks silent auth, manual button must still work.

### 9.4 Critical Drive Rule

A Drive issue must not make the whole app static.

All Drive calls must fail gracefully and never break the global script.

## 10. Error Handling Specification

### 10.1 JavaScript Integrity

A single JS syntax error currently kills all buttons. This is unacceptable.

Before delivering any HTML file:

1. Extract JavaScript from the HTML.
2. Run syntax check.
3. Prefer running a basic smoke check for expected functions.

Suggested check:

```bash
node --check extracted.js
```

At minimum, verify these functions exist:

```text
render
setTab
connectDrive
expandPool
stopFetching
addManualTitle
rateMovie
retagMovie
renderPoolGrid
renderRatedGrid
syncDrive
```

### 10.2 Fetch Errors

Wikipedia fetch errors should:

- Not crash the app.
- Record rejected title where appropriate.
- Respect stop/abort state.
- Show a toast if manual fetch fails.

### 10.3 Drive Errors

Drive errors should:

- Set Drive status to not connected.
- Clear token if unauthorized.
- Keep local state intact.
- Show a useful toast.
- Keep all non-Drive app controls usable.

## 11. Current Important Constants

```js
const WIKI_REQUEST_DELAY_MS = 850;
const WIKI_BATCH_PAUSE_MS = 2500;
const CARD_REFRESH_BATCH_SIZE = 20;
const REC_INFINITE_PAGE_SIZE = 20;
const PERFECT_REC_TARGET = 5;
const PERFECT_REC_MIN_RATIO = 0.995;
const MIN_PLOT_TAGS = 0;
```

## 12. Known Sensitive Areas in the Code

These areas have caused failures or regressions and require special care:

### 12.1 Escaping in inline HTML handlers

Several buttons use inline `onclick="function('id','tag',event)"` patterns.

Any tag/title containing quotes or backslashes can break JavaScript if not escaped correctly.

Safer future approach:

- Use `data-*` attributes.
- Attach event listeners after rendering.
- Avoid inline JS handlers for dynamic strings.

### 12.2 Removable Tag Rendering

This previously produced a broken line like:

```js
String(tag).replace(/\/g,'\\').replace(/'/g,"\\'")
```

A malformed escape in this area killed the whole script.

This area must be syntax-checked after every edit.

### 12.3 Pool Grid vs Pool Rows

Pool was requested as same-design cards, not audit table rows.

Do not replace Pool cards with one-line rows.

### 12.4 Rated Tab Rendering

Rated tab must call `renderRatedGrid()` and `updateVisibleSections()` must show the Rated section when `activeTab === 'rated'`.

### 12.5 Plot Fallback

Do not reintroduce fallback from missing story section to intro.

This violates the core collection rule.

## 13. Acceptance Tests

### 13.1 App Loads

Expected:

- Page renders.
- Buttons respond.
- Tabs switch.
- No console syntax errors.

### 13.2 Drive Connect

Expected:

- Click Drive.
- Google auth opens or restores.
- Status changes to connected.
- `cinelens_data.json` is created or loaded.
- Refresh page: Drive restores while token valid.
- Close and reopen: Drive restores while token valid.
- If token expired, Drive button still reconnects interactively.

### 13.3 Manual URL Add

Input:

```text
https://en.wikipedia.org/wiki/Inglourious_Basterds
```

Expected:

- Page processed only if plot exists.
- Title added to Pool.
- Rating prompt appears.
- Tags do not include `sports-drama` unless story evidence supports actual sport.
- Save local and sync Drive when connected.

### 13.4 Automatic Fetch

Expected:

- Expand Pool starts fetching.
- Stop Fetching aborts promptly.
- Fetch progress visible.
- Stats update during fetch.
- Cards refresh every 20 additions, not every addition.
- Fetching continues until 5 near-perfect recommendations where possible.
- Pages without story section are rejected.

### 13.5 Recommendations

Expected:

- Recommendations sort by score.
- Alphabetical order is not primary.
- Infinite scroll loads more cards.
- Recommendations tab shows recommendations only.

### 13.6 Rated Tab

Expected:

- Rate any title.
- Open Rated tab.
- Rated title appears as a normal card.

### 13.7 Pool Tab

Expected:

- Open Pool tab.
- Pool titles appear as normal cards.
- Rating stars work.
- All tags visible or expandable as required.
- Tags can be removed with `×`.
- Removing a tag updates card and scoring.

### 13.8 Retag

Expected:

- Retag button exists on every title card.
- Retag refetches Wikipedia.
- Tags are rebuilt from story section.
- Rating/watchlist state survives.

### 13.9 Rejected Tab

Expected:

- Rejected title appears with reason.
- Retry works.
- Forget works.

## 14. Development Rules For Future Changes

1. Always edit from the latest confirmed working HTML file.
2. Apply only the requested change unless a dependency requires a small supporting change.
3. Preserve Drive, sync, ratings, pool, rejected, tabs and fetch controls unless the request explicitly targets them.
4. Always provide the complete updated HTML file.
5. Never provide snippets as the final code output.
6. After every edit, syntax-check the extracted JavaScript.
7. When fixing bugs, state the exact file used as the base.
8. Do not silently revert newer features while fixing older ones.
9. Keep design consistent: same cards across Recommendations, Rated, Watchlist and Pool.
10. Treat tagging as the core engine, not cosmetic metadata.

### 14.1 Required Delivery Workflow

Every completed code change must follow this sequence before it is reported as done:

1. Update `spec.md` with the new behavior, migration rule or bugfix notes.
2. Extract and syntax-check the inline JavaScript from the real `index.html`.
3. Run a targeted runtime smoke test in headless Chrome against the real app, preferably served from localhost when storage or browser behavior is involved.
4. Exercise the changed user flow and verify its persisted state, not only function presence.
5. Remove every temporary test artifact, including smoke-test HTML files, extracted scripts, browser profiles, logs, server output and generated scratch files.
6. Confirm no temporary artifact remains in the workspace, staged changes, system temp directory or any external browser-profile path used by the test.
7. Run `git diff --check` and review the final diff for unintended changes.
8. Commit only the intended project files with a descriptive commit message.
9. Push the commit to the active branch's configured remote.
10. Report the smoke-test result, cleanup result, commit hash and pushed branch.

Do not describe a change as complete after static checks alone when a browser-visible or persistence behavior was changed.

## 15. Recommended Future Refactor

The app is now large for a single inline script. A safe future refactor would separate the code into logical modules while keeping deployment simple.

Suggested files:

```text
index.html
styles.css
app.js
wiki.js
tagger.js
recommendations.js
drive.js
storage.js
```

Refactor only after a stable working version is preserved.

Before refactor, create a known-good checkpoint and do one module at a time.

## 16. Product Principle

CineLens should collect like a careful librarian, tag like a cautious critic and recommend like it has learned the user’s taste.

Wikipedia order is internal plumbing.
Recommendations are the product.

## 16. Tag Hygiene Fix Changelog

### 16.1 Problem Fixed

The previous build used a forced 20-tag minimum and generic fallback tags. This contaminated stored title data, inflated tag overlap and damaged recommendation quality.

### 16.2 Implementation Changes

- Set `MIN_PLOT_TAGS` to `0`.
- Added `CONTAMINATED_FALLBACK_TAGS`.
- Added `normaliseTagName()`.
- Added `cleanTagArray()`.
- Added `cleanContaminatedTags()`.
- Cleaned local saved data on startup.
- Cleaned Drive-loaded data before rendering.
- Synced the cleaned Drive copy back when cleanup changes were detected.
- Removed plot filler from seed title handling.
- Rebuilt Wikipedia tags from saved `storyText` during cleanup and housekeeping.
- Kept recommendation scoring limited to cleaned scoring tags.

### 16.3 Result

The Tag Brain now rewards tag accuracy over tag count. Recommendations are based on cleaner overlap and less fake similarity.

## 17. Current Bugfix Build Notes — Rated Tab, Retag and Contrastive Descriptor Brain

### 17.1 What was wrong

The previous uploaded build did not match the intended behaviour:

- The Rated tab count updated, but the discovery/control deck still occupied the visible area on the Rated tab, making the rated cards appear missing.
- Pool cards showed endless `tagging...` for legacy seed items that had no Wikipedia story text and could never be tagged.
- Retag on legacy items cleared tags and then attempted local tagging instead of finding the correct Wikipedia page.
- Housekeeping still rebuilt tags using the old hardcoded rule vocabulary.
- Seed and curated expansion lanes were still active in the HTML.

### 17.2 Corrected behaviour

- The Rated tab now renders every item with `Number(m.rating || 0) > 0`, independent of the active content filter.
- The control deck is hidden on Rated, Watchlist and Tags tabs, so the content grid appears directly under the tab header.
- Legacy seed items are preserved only as legacy records. They keep ratings, but their fake tags are removed.
- Legacy cards display `legacy · needs wiki` instead of `seed`, `tagging...` or fake tag counts.
- Retag now tries verified `wikiPageId` first when available.
- Retag on legacy items searches candidate Wikipedia titles using title/year/page variants, then verifies the canonical title before replacing the record.
- Manual Wikipedia URL can repair an existing legacy title while preserving rating, watchlist and skipped state.
- Failed retag is non-destructive and shows a clear message asking for the correct Wikipedia URL.

### 17.3 Contrastive descriptor tagging

Current descriptor generation uses only story-section text extracted from Wikipedia. The app extracts candidate 2–5 word phrases from plot/premise/synopsis/story text, filters low-value language and ranks phrases by local phrase quality plus cross-title rarity.

Stored fields:

```js
rawDescriptors     // candidate phrases from the page story text
descriptorTags     // selected contrastive descriptors
coreTags           // same as descriptorTags for scoring
plotTags           // same as descriptorTags for UI compatibility
tags               // same as descriptorTags for legacy compatibility
```

Recommendation scoring must use `scoringTags(movie)`, not raw metadata tags.

### 17.4 Removed active hardcoding

- `seedPool()` is now a no-op.
- `curatedTitlesForMode()` returns an empty list.
- Automatic pool growth uses Wikipedia category/list/link sources, not hardcoded title packs.
- Legacy seed records already present in saved data are migrated to `source: 'legacy'` and must be repaired through verified Wikipedia fetch or manual Wikipedia URL.

### 17.5 UI rules

## 18. Recent Bugfixes and UX Improvements (Latest Build)

### 18.1 Concept Interaction Everywhere

**Change**: Canonical concepts use one consistent interaction on all shared title cards.

**Implementation**:
- Unified `renderConceptChips()` path through the shared `buildCard()` component
- Explore mode opens the concept workspace
- Remove mode persists title-specific suppression
- Consistent concept expand/collapse with "+N" indicator
- Immediate active-workspace render and state save on removal

### 18.2 Top Recs Slider Removal

**Change**: Removed the Top Recs / topN slider from the control deck.

**Reason**: Infinite scroll display makes the slider redundant. Recommendations are user-controlled through infinite scroll pagination.

**Implementation**:
- Removed topN HTML control (lines 441-443)
- Removed topN initialization from `loadLocalState()`
- Preserved `topN` in settings state for backward compatibility if needed
- No impact on recommendation scoring or ranking

### 18.3 Manual Rating Dialog Fixes

**Change**: Fixed star-rating interaction in the manual rating dialog (shown after manual add).

**Problems Fixed**:
1. Only the clicked star was highlighted, not the range up to that star
2. "Rate Later" button cluttered the immediate add flow

**Implementation**:
- Added `previewManualStars(n)` function to show filled stars 1..n via `.active` class
- Added `restoreManualStars()` function to reset preview on mouse leave
- Removed "Rate Later" button from manual rating modal
- Stars now correctly fill in range when clicked or hovered
- Rating persists properly in state after selection

### 18.4 Wikipedia URL Persistence Fix

**Change**: Fixed the issue where retag would fail with "needs correct Wikipedia URL" even though the URL was saved.

**Problems Diagnosed**:
1. `wikiPageId` was not being reliably extracted or reconstructed when fetching
2. Housekeeping and save cycles could lose wiki metadata
3. Retag fallback logic was not sufficiently robust

**Implementation**:
- `findFreshWikiForMovie()`: Enhanced resilience with multiple fallback strategies
  - Explicit `wikiPageId` reconstruction from movie.id at function start
  - PageId-based fetch first (fastest if successful)
  - 300ms delay after pageId attempt to avoid rate limiting
  - Comprehensive title candidates (original, year variants, format variants, country-specific variants)
  - 200ms stagger between title fetch attempts
  - Wikipedia search as final fallback
  - Total retry chain: pageId → title candidates → search results

- `rebuildDescriptorBrain()`: Enhanced metadata preservation
  - Explicitly reconstructs `wikiPageId` from movie.id if missing
  - Cross-syncs `wikiTitle` ↔ `pageTitle` bidirectionally
  - Ensures `wikiUrl` is reconstructed from title when needed
  - Prevents metadata loss during rebuild cycles

- `applyFreshWikiMovie()`: Explicit data preservation
  - Preserves `wikiPageId`, `wikiTitle`, `pageTitle`, `wikiUrl` from both fresh and previous data
  - Falls back to previous values if fresh data lacks wiki metadata
  - No metadata lost during retag operations

- `loadLocalState()`: Post-load reconstruction
  - Reconstructs `wikiPageId` immediately after loading from localStorage for all Wikipedia movies
  - Ensures the movie.id → wikiPageId mapping is always valid

**Result**: Retag now works reliably even after pool expansion, saves, and complex state transitions. All wiki metadata paths include fallbacks and auto-reconstruction.

### 18.5 Validation

All changes tested for:
- No orphaned references to removed controls
- Consistent card component rendering across all tabs
- Tag removal updates and persists correctly
- Manual add flow completes without rate dialog deadlock
- Retag succeeds or provides clear manual correction path
- Drive sync and local storage remain compatible

- Star rating must fill all stars from 1 through the selected rating.
- Hover should preview the filled range.
- Pool and Rated cards must use the same star renderer.
- No card should show indefinite `tagging...` unless an actual async tagging process is running and tied to a real fetch.

### 17.6 Verification

After this edit, the extracted inline JavaScript from `index.html` passes syntax check with:

```text
node --check script.js
```

## 18. Current Consistency Fix Changelog — Descriptor State and Rated Tab Visibility

### 18.1 Bugs fixed

- Rated cards were being rendered into `#ratedGrid`, but the grid remained hidden because `.rated-only` had a stylesheet `display:none` rule and the tab visibility code reset inline display to an empty value.
- Pool tag removal removed tags from `tags`, `coreTags` and `plotTags`, but not `descriptorTags`, so removed tags could still affect scoring.
- Retag did not replace `descriptorTags` / `rawDescriptors`, which could leave stale recommendation descriptors after a fresh Wikipedia fetch.
- Retag failure was destructive and could still show a success message.
- Rejected retry routed plain Wikipedia titles through the manual URL field, which only accepts URLs.
- Manual URL fetch failures could leave the fetch progress/button state stuck.
- Unknown-language Wikipedia pages could be accepted as English by default.
- Housekeeping could reintroduce old rule-vocabulary tags instead of rebuilding descriptor tags from story text.

### 18.2 Implementation changes

- Added explicit section display handling so visible grids use `display:grid`, visible headers/controls use `display:flex`, and other visible sections use `display:block`.
- Updated tag removal to remove from `descriptorTags` and recompute tag weights.
- Added fresh Wikipedia replacement helpers for retagging while preserving rating, watchlist, skipped state and notes.
- Made retag failure non-destructive with a clear “needs correct Wikipedia URL” state.
- Made rejected retry call the Wikipedia fetch pipeline directly.
- Wrapped manual URL fetch in `try/finally`.
- Required positive English/Hindi evidence before accepting a Wikipedia page.
- Updated housekeeping to rebuild descriptor fields from story text using a single descriptor corpus snapshot per run.

### 18.3 Verification

Runtime smoke test was performed in headless Chrome against the real `index.html` served from localhost.

Test setup:

- Seeded localStorage with one rated title and forty-nine pool titles.
- Opened the app.
- Clicked the Rated tab.

Observed result:

```text
activeTab: Rated
ratedGridDisplay: grid
ratedCards: 1
ratedCount: 1 titles
controlDeckDisplay: none
normalDisplay: none
```

The extracted inline JavaScript also passes:

```text
node --check
```

## 26. Rejected Title Refresh Lane

Rejected Wikipedia titles are not permanent dead ends. Pool expansion keeps a persisted count of successful new additions and, after every 500 additions, runs a bounded rejected-title refresh lane.

- Each lane retries at most 25 eligible rejected titles, oldest retry first.
- A recovered title passes the same language, year, format and hidden-title checks as a newly discovered title, then moves into the normal pool and leaves Rejected.
- Hidden titles are never restored by the lane.
- Automatic retries stop after three attempts for the current Wikipedia parser version. Manual retry remains available.
- Increasing the parser version makes older failures eligible again, even if they exhausted retries under an earlier parser.
- Existing saved rejected titles become due for one refresh lane on the next pool expansion after this feature is loaded.
- The addition counter, lane history and per-title retry metadata persist locally and in the Google Drive brain file.
- Stopping fetching interrupts the lane and preserves its due state for the next expansion.

### 26.1 Required verification and delivery

Changes to this lane must include a real headless-Chrome smoke test of the `expandPool()` trigger and recovery behavior, JavaScript syntax and diff checks, removal of every temporary harness/profile/log file, an update to this specification, a commit, and a push.

Current smoke result:

```text
status: PASS
fresh title added: true
lane triggered at addition 500: true
old-parser rejection recovered: true
failed rejection advanced to retry 3/3: true
hidden rejection skipped: true
current-parser exhausted rejection skipped: true
counter reset to 0 after completed lane: true
```

## 27. Concept Workspace, Shared Cards and Performance Release

### 27.1 Tags / Concepts workspace

The Tags tab is a first-class concept explorer rather than a chip cloud with a narrow drawer.

- Concepts are searchable and filterable by All, You Like, You Dislike and Unweighted.
- Selecting a concept opens an inline title-card workspace using the same `buildCard()` component as recommendations, Rated, Watchlist, Pool and Hidden.
- The selected concept shows total, Rated, In Pool and Hidden counts.
- Title cards can be filtered by All titles, Rated, In Pool or Hidden.
- Large concept groups render 40 cards at a time with an explicit show-more action.
- Shared cards retain the actions appropriate to their state: rate/rerate, watchlist, retag, hide, restore or forget.

### 27.2 Concepts on cards

Cards display canonical concepts, not the pre-homogenization raw descriptor list.

- Concepts are ordered by recommendation relevance: matched concepts first, then positive taste weight, then absolute taste weight.
- The visible order is meaningful; the strongest explanation appears first.
- Recommendation matches are visually highlighted.
- Each concept tooltip reports its taste weight and current click behavior.

### 27.3 Concept click mode and permanent removal

The tiny tag-removal cross is replaced by a single explicit toggle:

- `Concept clicks: explore` opens that concept in the Tags workspace.
- `Concept clicks: remove` removes the clicked concept from that title.
- Removed concepts are stored in the title's persisted `suppressedConcepts` list.
- Canonical rebuilds, housekeeping, retagging, local reload and Drive reload must never reapply a suppressed concept to the same title.

### 27.4 Discovery controls

- The year range slider is replaced by a numeric year field.
- A language selector supports Hindi + English, Hindi only and English only.
- Year and language changes update only the active card workspace.

### 27.6 Wikipedia thumbnails

- New Wikipedia fetches request a small `pageimages` thumbnail in the existing API call.
- Cards use native lazy loading and asynchronous image decoding.
- Existing titles are not bulk-refetched merely to obtain images; they gain thumbnails when naturally re-tagged or refreshed.

### 27.7 Performance requirements

- `render()` renders only the active tab instead of rebuilding every hidden grid.
- Rating an already-tagged title recalculates weights without rebuilding the entire tag corpus.
- Pool expansion rebuilds, saves and paints at bounded card batches rather than after each successful title.
- Mobile disables decorative noise, backdrop blur and card entrance animation.

### 27.8 Required verification and delivery

This release requires a real headless-Chrome smoke test covering concept selection, shared cards, card rerating, permanent suppression through retag/rebuild, filters, active-tab-only rendering and lazy thumbnails. It also requires JavaScript syntax and diff checks, deletion of all temporary files/profiles/logs, this specification update, a commit and a push.

Current smoke result:

```text
status: PASS
shared concept cards: true
Rated / Pool / Hidden grouping: true
strongest concept first: true
rerating from shared card: true
suppression survives canonical rebuild: true
Hindi-only filter: true
numeric year field: true
concept click toggle: true
lazy thumbnail: true
Wikipedia thumbnail parsed: true
active-tab-only render: true
```

## 28. Concept Quality and Card Explanation Redesign

### 28.1 Problem

The first canonical concept implementation over-homogenized phrases by promoting their individual tokens. This made concepts such as `crime`, `thriller`, `child`, `father` and `relationship` appear across hundreds of unrelated titles. The cards then repeated the same high-weight concepts, making recommendations look homogeneous and poorly explained.

### 28.2 Phrase-preserving concepts

- Canonicalization may merge genuinely similar phrases, but it must not promote the individual words inside a phrase into independent concepts.
- `father-child-relationship` remains a phrase-level concept.
- `boy-discovers` and `boy-keeps-discovering` may still merge because their normalized phrase signatures match.
- Generic single-word fragments such as `crime`, `thriller`, `child`, `relationship`, `return` and `discover` are excluded from user-facing concept presentation.
- The canonical version is increased so existing saved titles rebuild automatically without losing ratings, watchlist state or suppressions.

### 28.3 Genre evidence

Broad genre labels require corroboration.

- `crime-thriller` requires at least two distinct crime-story signals, an explicit lead genre, or a relevant category.
- A single occurrence of `detective`, `crime`, `murder` or `investigation` must not classify an otherwise unrelated title as crime-thriller.
- Narrow concepts such as courtroom drama, heist, serial killer, prison setting or detective protagonist remain separately useful when their own evidence exists.

### 28.4 Specificity-aware recommendations

Concept contribution is multiplied by corpus specificity derived from document frequency.

- Rare concepts retain high explanatory and recommendation value.
- Concepts shared by a large fraction of the pool are strongly downweighted rather than allowed to dominate every score.
- User taste weight is preserved; specificity only controls how diagnostic that concept is among the available titles.

### 28.5 Card presentation

Cards no longer display a ranked dump of five near-identical chips.

- `Why`: at most two positively weighted concepts that contributed to this recommendation, ordered by actual weighted contribution.
- `Distinct`: at most three comparatively rare concepts that describe what separates this title from the rest of the pool.
- `More`: available only when expanded.
- The selected concept is omitted from cards inside its own concept workspace because repeating it on every card adds no information.
- Numeric chip ranks are removed.

### 28.6 Visual theme

The application background, control deck and cards use black and neutral dark-grey surfaces. Warm brown/red page glows are removed. Yellow remains the interaction accent rather than a background tint.

### 28.7 Required verification and delivery

Smoke testing must prove that token fragments are not promoted, a one-signal story is not classified as crime-thriller, corroborated crime evidence still works, broad concepts receive lower specificity, card explanations are limited and grouped, selected concepts are omitted in their own workspace, and the final computed background is black/dark grey. Complete the usual syntax, diff, cleanup, specification, commit and push steps.

Current smoke result:

```text
status: PASS
phrase preserved without father/child/relationship token promotion: true
one detective signal does not create crime-thriller: true
corroborated detective + murder evidence creates crime-thriller: true
broad crime-thriller specificity lower than family-secret: true
Why limited and contribution ordered: true
Distinct limited to three: true
numeric chip ranks removed: true
selected workspace concept omitted from its cards: true
computed background: linear-gradient(rgb(16,16,16), rgb(8,8,8), rgb(5,5,5))
```

## 29. Overlap-First Recommendation Ranking

Recommendation ranking must use the full set of concepts shared with positively rated titles. The two concepts shown in the collapsed `Why` row are only a readable explanation preview.

Ranking order is lexicographic:

1. More positively weighted shared concepts.
2. Fewer concepts carrying negative taste weight.
3. Higher net weighted contribution after corpus-specificity adjustment.
4. Higher positive weighted contribution, then stable title order.

The weighted contribution still combines rating-derived taste weight with concept specificity, but weight must not allow a one-concept match to outrank a title matching many positive concepts.

Cards show:

- The real number of shared positive concepts.
- Weighted taste coverage as a percentage of the user's total positive concept weight, not a percentage relative to the current top recommendation.
- The number of disliked concepts when present.
- Up to two strongest `Why` concepts plus a `+N shared` indicator proving the score uses all shared concepts.

The previous `100% match` wording is removed because a top-relative score could label a weak two-concept match as 100%. Background expansion now refers to `strongest overlap matches`.

### 29.1 Required verification

Smoke testing must prove that a lower-weight title sharing three positive concepts ranks above a higher-weight title sharing two, negative overlap breaks equal-positive-overlap ties, weighted score orders otherwise equal candidates, taste-fit percentage is absolute coverage, and the card reports the complete shared count while previewing at most two concepts.

Current smoke result:

```text
status: PASS
three lower-weight shared concepts outrank two higher-weight concepts: true
negative overlap loses equal-positive-overlap tie: true
weighted score orders equal-overlap clean candidates: true
weighted fit is absolute taste coverage: true
full shared-concept count shown: true
Why preview limited to two: true
remaining shared concepts declared: true
top result not forced to 100%: true
```

## 30. Availability Subsystem Removal

Streaming availability is removed completely because it was unreliable and added controls, network code and persisted state without improving recommendations.

Removed surface and behavior:

- Country selector
- TMDB token input and local-storage token
- Service/provider filters
- Bulk availability refresh
- Per-card `where` / JustWatch action
- Provider chips and platform filtering
- TMDB request helpers and watch-provider lookup
- Availability preservation during retag
- Availability-related settings and specification requirements

No compatibility shim or hidden availability code remains. Existing saved availability fields may remain inert inside older movie records, but the app neither reads nor writes them.

### 30.1 Required verification

Smoke and static checks must prove that no country, token, service, provider or `where` controls render; recommendation candidates are unaffected by saved provider data; no TMDB or JustWatch requests/functions remain; and overlap-first recommendation behavior still passes after removal.

Current smoke result:

```text
availability controls absent: true
availability functions absent: true
overlap-first recommendation smoke still passes: true
```

## 22. Persistent Hidden Titles

Pressing the x action on a title must hide it instead of deleting all knowledge of it.

- Hidden titles are removed from recommendations, rated, watchlist and pool views.
- Hidden titles are stored in `state.hiddenTitles` and persisted locally and through Google Drive sync.
- Automatic collection, manual Wikipedia add and rejected-title retry must not re-add a hidden title.
- Hidden titles appear as normal cards in a dedicated `Hidden` tab.
- Hidden cards provide `restore` and `forget` actions.
- Restore returns the saved title, rating, watchlist state and tags to the pool.
- Forget permanently removes the hidden record, allowing the title to be fetched again later.
- Rated hidden titles keep contributing their existing rating-based tag weights.
- Unrated hidden titles do not affect tag weights; hiding alone is not treated as a dislike.
- Tag Brain includes rated hidden evidence and labels those source titles as hidden.
- Reset All clears hidden titles as part of the complete app reset.

### 22.1 Hidden Title Acceptance Test

The browser smoke test must verify:

- Pressing x moves a title from `state.movies` to `state.hiddenTitles`.
- The title appears in the Hidden tab and does not remain in Pool.
- A subsequent candidate fetch check excludes the hidden title.
- A rated hidden title continues contributing its rating-based tag weight.
- An unrated hidden title contributes no tag weight.
- Restore returns the title to Pool and removes it from Hidden.
- The hidden state survives local storage serialization and reload.

### 22.2 Verification

Runtime smoke test was performed in headless Chrome against the real `index.html` served from localhost.

Observed result:

```text
status: PASS
hiddenCards: 2
poolCardsBeforeRestore: 0
ratedHiddenWeight: 2
unratedHiddenWeight: 0
persistedAcrossReload: true
restored: true
```

## 23. Corpus-Learned Canonical Tag Brain

Rich story descriptors must remain visible evidence, but recommendation scoring must use a second, automatically learned canonical concept layer.

The canonical layer must not use a movie-domain synonym dictionary or a manually maintained map such as `sci-fi -> science-fiction`.

### 23.1 Learning Rules

The app derives concepts locally from the saved corpus using generic language mechanics:

- lowercase and punctuation normalization
- lightweight inflection stemming
- removal of grammatical/function words
- exact normalized phrase signatures
- conservative token, prefix, character-bigram and acronym similarity
- corpus frequency to select a representative label from the observed tags
- reusable token concepts only when a token occurs across multiple different titles
- suppression of likely character/entity tokens detected from capitalization patterns in story text
- suppression of tokens that are so common that they stop being discriminative

Raw descriptors remain in `descriptorTags`, `tags`, `coreTags` and `plotTags` for display and inspection. Learned scoring concepts are stored separately in:

```js
movie.canonicalTags
movie.canonicalTagVersion
state.canonicalTagStats
```

### 23.2 Existing Data Migration

Existing titles must not be re-fetched or re-rated.

On local load and Drive load, the app must rebuild canonical clusters across all active and hidden titles, then recompute tag weights from existing ratings. Ratings, raw tags, watchlist state, hidden state and Wikipedia metadata must remain intact.

Rated hidden titles continue contributing through their rebuilt canonical tags. Unrated hidden titles remain neutral.

The rebuilt records must be saved locally and synced back to Drive when Drive data required migration.

### 23.3 Runtime Updates

Canonical concepts must rebuild after manual add, retag, raw-tag removal, hide, restore and forget. During pool expansion, rebuilding may be deferred to card-refresh batch boundaries and final completion to avoid recalculating the full corpus after every fetched title.

Cards continue showing raw descriptors. Recommendations, match scoring, Tag Brain and the top `Concepts` count use canonical tags. The control deck must also show both canonical and raw totals for comparison.

### 23.4 Acceptance Test

The runtime smoke test must verify:

- `sci-fi` and `science-fiction` share a learned canonical concept without an explicit synonym entry.
- `boy-discovers` and `boy-keeps-discovering` share a learned canonical concept.
- repeated action roots can connect character-specific descriptors without turning a one-title character name into a concept.
- existing ratings produce weights on canonical concepts immediately after migration.
- raw descriptor arrays remain unchanged.
- migrated canonical tags survive local storage reload.
- canonical concept count is lower than raw unique descriptor count in the fixture.

### 23.5 Verification

Runtime smoke test was performed in headless Chrome against the real `index.html` served from localhost. The fixture began as already-saved, already-rated records without `canonicalTags`, then reloaded after migration.

Observed result:

```text
status: PASS
raw unique descriptors: 6
canonical concepts: 3
sci-fi / science-fiction: shared concept
boy-discovers / boy-keeps-discovering: shared concept
danny-discovers / john-keeps-discovering: shared learned action concept "discover"
one-title character names promoted to concepts: false
existing ratings preserved: true
raw descriptors preserved: true
persistedAcrossReload: true
candidate scores: discovery variant 6, named discovery variant 4, science-fiction variant 2
```

## 24. Narrative Overview Parser Fix

### 24.1 Problem

Some valid movie and television pages still failed manual URL add because Wikipedia does not always use `Plot`, `Premise` or `Series overview`. For example, `Two and a Half Men` uses an `Overview` section containing the full narrative summary.

The manual-add error also hid the actual parser rejection reason behind the generic message `Could not process`.

### 24.2 Implementation

- Do not maintain an allowlist of exact story headings.
- Split the plaintext extract into all real Wikipedia sections and score each section by its content.
- Narrative scoring uses character relationships, story actions, narrative openings and action-bearing sentences.
- Production, casting, broadcast, episode-list, ratings, reception and other non-story signals reduce or disqualify a section.
- Heading words such as plot, premise, story, overview, summary or character are only weak hints. The exact heading is never required, so combined or novel headings such as `Premise and main characters` work without code changes.
- Select the strongest qualifying narrative section and continue rejecting pages whose sections are production-only or otherwise non-narrative.
- Add parser diagnostics for missing pages, franchise pages, missing story sections, type mismatch, missing language evidence and missing core identity fields.
- Show the specific parser or network reason in manual-add errors and store it in the Rejected tab.

No title-specific or exact-heading exception is used.

### 24.3 Verification

Runtime smoke test was performed in headless Chrome against the real `index.html` served from localhost.

Observed result:

```text
status: PASS
compound heading accepted: true
completely unseen heading accepted: true
production-only section rejected: true
exact heading allowlist present: false
```

## 21. Current Fix Changelog — Remove Browse Cards Slider

### 21.1 Problem fixed

The old `Batch` / `Browse Cards` slider was redundant after infinite scrolling. It controlled how many fallback unrated browse cards appeared, but infinite scroll already owns progressive card reveal.

### 21.2 Implementation changes

- Removed the visible `Batch` / `Browse Cards` slider.
- Removed `batchSize` from default settings and DOM loading.
- Fallback unrated browse cards now use the same `recVisibleLimit` / infinite-scroll path as recommendations.
- Internal fetch batching constants remain because they throttle Wikipedia requests and card refreshes; they are not user controls.

### 21.3 Verification

Runtime smoke test was performed in headless Chrome against the real `index.html` served from localhost.

Expected control labels:

```text
Top Recs, Since
```

Expected behavior:

```text
No Batch label
No Browse Cards label
No batchSize input
Fallback browse cards render from recVisibleLimit
```

## 22. Current Fix Changelog — Wikipedia Story Heading Parser

### 22.1 Problem fixed

Pool expansion could show real Wikipedia titles in the progress bar while adding `0` titles. The failure was in the page parser, not the UI.

Root cause:

- Wikipedia plaintext extracts expose headings as MediaWiki-style lines such as `== Plot ==`, `== Premise ==` and `== Series overview ==`.
- The app only matched bare heading text such as `Plot`.
- As a result, obvious usable pages like `Inception`, `Arrival`, `13 Reasons Why`, `Delhi Crime` and `Panchayat` produced `storyText = ''` and were rejected.

### 22.2 Implementation changes

- Added heading normalization for Wikipedia extract lines.
- Story extraction now recognizes `== Plot ==`, `== Premise ==`, `== Synopsis ==`, `== Story ==`, `== Plot summary ==` and `== Series overview ==`.
- Story extraction stops cleanly at the next Wikipedia heading.
- Lowered the required story-section length to allow short but real `Premise` sections.
- Release year detection now prefers film/TV category years and TV debut categories before falling back to the first year in the lead.
- Story tag generation now uses the story section only for plot evidence, preventing lead/production text from contaminating plot tags.

### 22.3 Verification

Runtime smoke test was performed in headless Chrome against the real `index.html` served from localhost with live Wikipedia API calls.

Direct parser smoke:

```text
13 Reasons Why: ok, year 2017, English, series, 12 tags
Inception: ok, year 2010, English, movie, 19 tags
Arrival: ok, year 2016, English, movie, 14 tags
Panchayat: ok, year 2020, Hindi, series, 13 tags
Delhi Crime: ok, year 2019, Hindi, series, 13 tags
```

Expand-pool smoke using the real `expandPool()` path with controlled candidate titles:

```text
added: 5
tagged: 5
rejected: 0
titles: 13 Reasons Why, Inception, Arrival, Panchayat, Delhi Crime
expandText: ＋ Expand Pool
fetchVisible: false
```

The extracted inline JavaScript also passes:

```text
node --check
```

## 20. Current Fix Changelog — Tagging Rethink and Reset

### 20.1 Problem fixed

The app could show a large pool with zero tagged titles, leaving the recommendation engine with no usable brain. The descriptor-only tag path was too brittle: if contrastive phrase selection did not produce useful descriptors, a valid story-backed title could still end up effectively untagged.

Reset also needed to clear the entire app state, including the pool.

### 20.2 Implementation changes

- Added a hybrid story tag builder:
  - evidence-backed tags from plot/story text
  - contrastive plot phrases from the same story text
  - no metadata-only scoring tags
  - no low-confidence filler tags
- Routed Wikipedia parse, tag rebuild, housekeeping and rating-time tagging through the same story tag builder.
- Added `Reset All` in the control deck.
- `Reset All` clears:
  - ratings
  - watchlist state
  - pool
  - rejected titles
  - tag weights / Tag Brain
  - saved local state
- If Drive is connected, reset syncs the cleared state so the old pool does not return from Drive.

### 20.3 Verification

Runtime smoke test was performed in headless Chrome against the real `index.html` served from localhost.

Story tagging smoke:

```text
builtTagCount: 21
hasCrime: true
hasTime: true
```

Control label smoke:

```text
labels: Top Recs, Since
resetButton: true
```

Reset smoke:

```text
resetMovieCount: 0
resetRejectedCount: 0
savedMovieCount: 0
savedRejectedCount: 0
statPool: 0
statTags: 0
```

The extracted inline JavaScript also passes:

```text
node --check
```

## 19. Current Fix Changelog — Retag Failure Must Be Actionable

### 19.1 Problem fixed

Retag on a rated/legacy title could start Wikipedia fetching and then leave the user with a toast such as:

```text
Could not re-tag "Inception". Paste its Wikipedia URL.
```

That was not actionable in context because the card did not provide a place to paste the URL.

### 19.2 Implementation changes

- Retag lookup now tries additional common Wikipedia title variants:
  - `Title (film)`
  - `Title (TV series)`
  - `Title (year film)`
  - `Title (year TV series)`
  - search-style `Title film` / `Title television series`
- Leaving recommendation views now cancels pending auto-expand timers and restores the header action to `Expand Pool`.
- Non-manual auto expansion refuses to start unless the active tab is a recommendation tab.
- Retag pauses any active pool expansion before using Wikipedia.
- Retag failure is now actionable on the card:
  - shows a Wikipedia URL input
  - shows a `repair` button
  - preserves the existing rating/watchlist data while repairing from the pasted URL

### 19.3 Verification

Runtime smoke test was performed in headless Chrome against the real `index.html` served from localhost.

Rated tab / fetch-state smoke:

```text
activeTab: Rated
ratedGridDisplay: grid
ratedCards: 3
expandText: ＋ Expand Pool
fetchVisible: false
```

Retag failure smoke:

```text
activeTab: Rated
repairRows: 1
repairInputPlaceholder: paste Wikipedia URL
repairButtonText: repair
fetchVisible: false
expandText: ＋ Expand Pool
```

The extracted inline JavaScript also passes:

```text
node --check
```
