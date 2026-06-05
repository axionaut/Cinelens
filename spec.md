# CineLens Specification

## 1. Product Summary

CineLens is a single-file browser app for building a personal movie and TV recommendation engine using Wikipedia as the title and plot source, local browser storage as the primary data store and optional Google Drive sync for persistence across sessions/devices.

The app is designed for Hindi and English movies and shows only. It must collect candidate titles automatically, process them only when a real plot/synopsis/premise/story section exists, derive meaningful plot tags from that story text, learn from the user’s ratings and recommend titles based on the user’s positive and negative taste signals.

The app must behave like a recommendation engine, not like a Wikipedia category browser. Wikipedia collection order is housekeeping. It must not leak into recommendation display order.

## 2. Current Packaging

The app is currently implemented as one complete HTML file containing:

- HTML layout
- CSS styling
- JavaScript app logic
- Wikipedia API integration
- TMDB availability lookup
- Google Drive sync
- Local storage persistence

Current working file basis used for this specification:

```text
index.html
```

The file should remain self-contained unless a deliberate refactor is planned.

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
5 recommendations at 100% match
```

A 100% match means the title’s recommendation score equals or nearly equals the current highest recommendation score. The implementation currently uses:

```js
const PERFECT_REC_TARGET = 5;
const PERFECT_REC_MIN_RATIO = 0.995;
```

This is acceptable because floating-point scoring can make exact equality brittle.

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
- Availability check where relevant

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
- Tags tab: only Tag Brain
- Pool tab: only Pool
- Rejected tab: only Rejected

### 4.4 Control Deck

Controls should be visually separated into readable rows.

Recommended grouping:

Row 1:

- Top Recs slider
- Since/year slider
- Tag count/housekeeping status

Row 2:

- Country selector
- TMDB token/key input
- Check Availability button
- Service filters

Row 3:

- Add Wikipedia URL input
- Fetch from URL button
- Drive status
- Drive button
- Expand Pool / Stop Fetching button

The previous huddling issue came from cramped flex wrapping. Controls need `row-gap`, `column-gap` and/or dedicated rows.

### 4.5 Check Availability Button

The button previously called `check visible` should be labeled:

```text
Check Availability
```

Function:

- Checks streaming/watch availability only for visible cards.
- Uses TMDB watch providers.
- Uses the selected country.
- Does not tag.
- Does not add recommendations.
- Does not process the entire pool.

### 4.6 Cards

All major title displays should use the same card design.

Cards should include:

- Title
- Match % where applicable
- Year / language / country / format metadata
- Match bar where applicable
- Star rating control
- Availability chips/line
- Tags
- Actions

Actions should include, where relevant:

- Re-tag
- Check Availability
- Watchlist / Remove from Watchlist
- Delete/remove title
- Expand/collapse tags

Every card must have a Retag button, not only Pool entries.

### 4.7 Tags on Cards

Normal cards may show a limited number of tags with expand/collapse.

Pool cards must show all tags because Pool is for auditing.

Pool card tags must be removable with an `×`.

Removing a tag must:

- Remove from `movie.tags`
- Remove from `movie.plotTags`
- Remove from `movie.coreTags`
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
    watchCountry,
    platforms
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
  pageTitle,
  availability
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
3. Extract story text from Plot/Synopsis/Premise/Story/Plot summary/Series overview.
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

No plot/synopsis/premise/story section means skip.

Do not fall back to intro/lead for tagging.

Intro/lead may help identify the page, year, language, country and format, but not tags.

Story headings currently accepted:

```js
['Plot', 'Synopsis', 'Premise', 'Story', 'Plot summary', 'Series overview']
```

Acceptable improvement:

- Add `Overview` only if it is clearly story/episode premise text, not generic production overview.
- Avoid using `Reception`, `Cast`, `Production`, `Music`, `Release`, `Marketing`, `Awards`, `Legacy` for tags.

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

A candidate score is calculated from scoring tags and tag weights.

Recommendations must be sorted by score, not alphabetically.

Alphabetical order may be used only as a tie-breaker.

### 8.3 100% Match Display

Match percentage is relative to current highest score:

```js
matchPct = Math.round((score / maxScore) * 100)
```

The first ranked recommendation will normally show 100%.

The target of 5 × 100% means at least 5 recommendations at or near the top score, using `PERFECT_REC_MIN_RATIO`.

### 8.4 Recommendation Candidate Filters

Candidate must:

- Be unrated
- Be tagged
- Meet minimum year cutoff
- Match selected tab context when applicable
- Match selected platform availability if platform filtering is active, once availability is known

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

TMDB token currently stored separately:

```js
cinelens_tmdb_token
```

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
tmdb.js
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
- Added fresh Wikipedia replacement helpers for retagging while preserving rating, watchlist, skipped state, notes and availability.
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
