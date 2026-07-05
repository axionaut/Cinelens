# CineLens Specification

## 1. Product Summary

CineLens is a browser app for building a personal movie and TV recommendation engine using Wikipedia as the title and plot source, local browser storage as the primary data store and optional Google Drive sync for persistence across sessions/devices.

The app is designed for Hindi and English movies, plus English TV shows only. Hindi shows are out of scope. The app must collect candidate titles automatically, process them only when a real plot/synopsis/premise/story section exists, derive meaningful plot tags from that story text, learn from the user’s ratings and recommend titles based on the user’s positive and negative taste signals.

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

### 2.0 Delivery Workflow

Every implementation pass must keep this specification current. When code,
style or data-shape behavior changes, update `spec.md` in the same change set
before delivery.

The required delivery sequence is:

1. Inspect the current worktree and protect unrelated user changes.
2. Implement the requested app change.
3. Bump the visible app version when the change will be pushed.
4. Update `spec.md` with the new behavior or process rule.
5. Run targeted verification for the changed code path plus repository hygiene
   checks such as syntax checks and `git diff --check`.
6. Commit the app and spec changes together.
7. Push the commit to the remote branch.

The app version is maintained in `app.js` as an integer `APP_VERSION` and shown
in the main header beside the CineLens logo. Each pushed app change must
increment the visible version by exactly 1 in the same commit so a deployed
page can be identified without opening developer tools.

Assistant status and final responses for code-change work should start by
confirming `spec.md` has been considered and should end by stating whether
`spec.md` was updated in the delivered commit.

#
## 2.4 Performance and Scale Architecture

CineLens must keep interactive work proportional to the visible result set, not
to the entire stored catalogue, wherever possible. The current browser phase
uses these rules:

- Rating-model predictions for unseen titles are cached until ratings, tags,
  genres, hidden state or manual preferences change. Filtering, sorting, tab
  switches and control-deck changes must reuse the cached ranking.
- Rated-title leave-one-out predictions are computed lazily for cards that are
  actually rendered. The app must not build one leave-one-out model for every
  rated title merely because a view opens.
- The tag vocabulary is built once per data revision and reused by stats, AI
  tagging and consolidation.
- The header tag status reuses the same tag-vocabulary cache and stores a
  separate active-title raw-tag count. The active count must match the previous
  `countRawTags()` result and must not reuse the active-plus-hidden vocabulary
  size.
- Search input is debounced for both rendering and persistence. Typing must not
  serialize the entire library, queue Drive sync or rescore recommendations for
  each keystroke.
- The Google Identity Services script in `index.html` must load asynchronously
  so Google network latency does not block initial HTML parsing. The runtime
  loader may still inject the script if the static tag is absent.
- Card grids append through document fragments and remain page-limited. A view
  must not create DOM cards for every stored title.
- Once a canonical Drive file ID exists, routine sync must use that ID directly
  instead of scanning and downloading every same-named Drive file.
- On a Drive-authoritative startup, the compact personal profile is mandatory:
  it must be fetched and applied even when local manifest/profile hashes appear
  unchanged. A catalogue cache by itself is not a usable personal library.
- Catalogue chunks intentionally omit rating, watchlist and manual-add state.
  Restoring a chunk must never manufacture a current personal-state timestamp,
  because that can overwrite a real remote rating with a false local zero.
- If the manifest profile is missing, malformed or cannot be read, startup
  remains read-only and collection stays blocked rather than building a
  zero-rated starter pool.
- IndexedDB persistence uses full saves by default. Full saves scan the active
  and hidden title signature caches and are the only path allowed to delete
  records from IndexedDB.
- Scoped IndexedDB saves are allowed only for hot paths that change known
  records without deletion: rating one active title, and collection saves for
  every title an expansion run created or mutated, including duplicates that
  received fresh Wikipedia data, AI tags or AI retry metadata. Scoped saves
  upsert only the provided ids wherever they currently live, keep unrelated
  records untouched and still compare/write the compact profile payload.

### 2.4.1 Rolling candidate pool

CineLens is a personal recommendation engine, not an ever-growing archive of
unseen titles. The active unseen candidate pool is bounded and continuously
rotated so collection improves relevance without bloating local storage, scoring
work or Drive payloads.

The pool is **not** managed by one global cap such as “top 800 titles overall”.
That would over-favor recent years and flatten older eras, movies versus shows
and Hindi versus English. Instead, replacement happens inside coverage-preserving
segments.

- Each replaceable automatic unseen title belongs to a segment defined by
  **year × language × format**.
- Ratings, watchlist items, manual additions and Hidden titles are personal
  history. They are never evicted by pool rotation.
- After new candidates receive tags, CineLens scores replaceable unseen titles
  with the current rating-learned model and ranks them **within their own
  segment**, not against the entire unseen library at once.
- Every segment receives an adaptive retention allowance derived from:
  - its own current supply,
  - predicted quality of its titles,
  - how many strong matches it currently produces,
  - your demonstrated rating engagement with that segment,
  - and a light recency factor.
- Segments therefore keep a healthy local floor and then expand or contract
  according to actual usefulness. Stronger segments keep more candidates.
  Weaker ones shrink, but they are not wiped out merely because some other year
  or format performs better.
- Before there are enough ratings for personalization, the rolling pool still
  keeps candidates by segment. In that early phase, newer and better-populated
  segments retain somewhat more titles, but the app still avoids one giant
  unbounded archive.
- Pending-tag titles are retained separately by segment, with a small adaptive
  allowance so collection can finish tagging before the title competes for a
  longer-term place in the active pool.
- An evicted title leaves only a compact synchronized fingerprint: title/page
  identity, reason and timestamp. The collector skips matching fingerprints so
  it does not repeatedly fetch and tag the same discarded candidate. The
  fingerprint registry is capped at `5,000` records and prunes its oldest
  entries.
- A manual Wikipedia add removes a matching rolling-pool fingerprint and marks
  that title as a permanent manual addition. It is then protected from future
  automatic rotation.
- During Drive record convergence, a newer rolling-pool fingerprint suppresses
  stale replaceable active copies from another device. It never suppresses a
  rated, watchlisted or manual title.

### 2.4.2 Local Persistence and Drive Sync

CineLens must never treat a single monolithic JSON blob as the live local
library or as the normal Drive-sync unit.

#### Local device cache

- The title library is stored in IndexedDB as individual active-title and
  hidden-title records, with a separate small profile/meta record.
- `localStorage` contains only a compact bootstrap: visual settings, Drive IDs
  and sync metadata needed before IndexedDB opens. It must not contain the
  full title library after the IndexedDB migration completes.
- Startup loads the last confirmed IndexedDB library first and renders that
  real cached library. It must not render a starter/default collection while
  waiting for Drive. When Drive is enabled but the local cache has no ratings,
  the app waits for the mandatory profile restore before treating the cache as
  usable.
- IndexedDB persistence compares per-record content and writes only changed
  title records, added records and deleted records. A simple rating change must
  not rewrite the entire local catalogue.
- A legacy `cinelens_v2` localStorage snapshot is imported once on the first
  v3 startup, then removed only after the IndexedDB write succeeds.
- The app must open the existing `cinelens_local_v3` IndexedDB database without
  requesting a lower schema version. A reverted experimental migration may leave
  extra object stores behind; those stores are harmless and must not prevent the
  active app from opening the existing `movies`, `hidden` and `meta` stores.

#### Chunked Drive model

- The old `cinelens_data.json` remains a read-only migration/recovery backup.
  It is not deleted automatically.
- Normal Drive sync uses a small `cinelens_manifest_v2.json`, one compact
  `cinelens_profile_v2.json` and catalogue chunk files.
- Catalogue chunks are grouped by a five-year year range, language and format.
  This chunking is a transfer/storage concern only. It does not alter the
  recommendation pool’s finer year × language × format retention policy.
- The manifest records every chunk’s Drive ID, hash, count and revision data.
  A routine sync reads the manifest first, then transfers only changed chunks.
- Personal fields such as rating, watchlist and manual-add status live in the
  profile payload rather than determining catalogue-chunk hashes. Rating a
  title therefore updates the small profile instead of uploading its full
  catalogue chunk.
- On a normal startup, CineLens compares local manifest hashes with the remote
  manifest. If no hash changed, it does not download title chunks. If one chunk
  changed on another device, it downloads only that chunk plus any changed
  profile data.
- Concurrent edits are resolved record-by-record within an affected chunk,
  using existing record timestamps. Only a genuinely conflicting changed chunk
  is downloaded and merged.
- Migration from the legacy monolithic file is one-time: load the existing
  canonical library, write the profile/chunks/manifest, verify the generated
  cache, then retain the old file as backup.

### 2.4.2 Scale Boundary

A browser-local `localStorage` document and one monolithic Google Drive JSON
file are not a viable million-title architecture. They remain a compatibility
layer for the current personal-library phase only.

Before CineLens moves from thousands into a genuinely large catalogue, the
catalogue must migrate to an indexed data service:

1. Browser cache: IndexedDB stores only locally needed title records and query
   pages.
2. Central catalogue: a database-backed API owns titles, tags, search indexes
   and recommendation candidates.
3. User profile: ratings, hide/remove tombstones, watchlist, tag preferences
   and Taste Story state are stored independently from the public catalogue.
4. Sync: Drive, if retained, backs up the small user profile only. It must not
   upload or merge the whole catalogue after every user action.
5. Ranking: recommendation generation runs off the indexed catalogue or a
   worker/API, returning a bounded page of IDs for the UI to render.

Do not claim million-title support from the current static-browser/Drive
packaging. That requires this catalogue-service migration.

### 2.0.1 Unified title search and Wikipedia validation

The title-search field accepts both normal title text and direct English Wikipedia
article links. A pasted Wikipedia link is treated as a direct add request after
validation, while a typed title opens disambiguated Wikipedia search results.

- Search-result adds resolve the exact Wikipedia `pageid`, not merely the visible
  result label. This prevents a title from resolving to a same-named person,
  company or other unrelated page on the second step.
- The search field includes an explicit clear button that is visible and usable on
  mobile as well as desktop. It clears both local filtering and pending Wikipedia
  results. The app must not depend on browser-specific `type=search` clear UI.
- Wikipedia title validation requests the page wikitext alongside extract and
  category data, then reads the infobox where available. A film/television
  infobox counts as strong media evidence before person/organization heuristics
  are applied.
- Language admission is Hindi/English only. An explicit non-Hindi/non-English
  language in the infobox, relevant category or explicit lead classification
  rejects the title even when country-based fallback signals might otherwise
  have accepted it.
- Infobox field extraction must support multiline values and common Wikipedia
  wrapper templates such as `{{plainlist}}`, linked language labels and `{{lang}}`.
  A visible infobox value of `English` or `Hindi` is authoritative and must not
  be turned into an unknown/Other value merely because its source markup spans
  multiple lines. Unknown or malformed infobox markup falls through to the
  page's English/Hindi lead/category evidence; only a clearly named unsupported
  language is rejected as `Other`.
- Country or a manual search must never override a clear non-Hindi/non-English
  infobox language.
- A direct Wikipedia link is an explicit request for one exact page. It bypasses
  only loose name-based franchise/overview heuristics; it does not bypass media,
  story, year or Hindi/English validation.
- List-like wording inside a genuine title is never sufficient to reject it.
  Reject only actual Wikipedia list, category, template, disambiguation,
  franchise or overview pages using page namespace, title pattern and page
  evidence together. For example, `The Bucket List` must be accepted as a film,
  while `List of American films of 2007` remains a list page.


### Conventional horror boundary

CineLens excludes only conventional horror. A giant monster, creature, animal attack or fantasy-adventure label alone is not horror and must not exclude a title. A title requires explicit horror metadata or conventional-horror signals such as haunting, possession, ghosts, slasher violence or gore before it can be excluded. Psychological horror, science-fiction horror and horror-comedy remain eligible.

## 2.1 Unified Tag Model

CineLens has one user-facing taste signal: tags.

The app may internally normalize, merge and version tags so that lexically or
grammatically similar phrases are treated together, but this is implementation
detail. The UI, recommendation explanations and user workflows must not ask the
user to reason about both "tags" and "concepts".

The tag module pipeline is:

1. Fetch Wikipedia story/lead/category text.
2. Detect likely character/person names from the original capitalized text.
3. Extract local keyword/keyphrase candidates with the in-browser tag scorer.
4. Remove or weaken names, generic fragments, over-common phrases and
   low-confidence fallback phrases.
5. Normalize lexical/grammatical variants into canonical tags.
6. Compare new tags with the existing tag brain and merge similar ones.
7. Apply title-specific suppressed tags so removed tags do not return.
8. Store one user-facing tag list for display, scoring and Tag Brain.

Older field names such as `canonicalTags`, `canonicalTagVersion` and
`suppressedConcepts` may remain as migration/storage plumbing until a deliberate
data migration renames them. They must be treated as normalized tags, not as a
separate product layer.

### 2.2 Genre Signal

Genres are stored separately from story concepts. They are derived only from
Wikipedia lead/category metadata, not guessed from isolated plot words.

- Existing saved Wikipedia titles derive genres from their stored lead text
  during housekeeping; they do not require an immediate refetch.
- Fresh and re-tagged titles also use Wikipedia categories.
- Rated-title genre preferences contribute to recommendation weight at 35% of
  a tag weight.
- Positive tag overlap remains the primary ranking rule. Genre preference
  influences weighted ordering within the same tag-overlap tier.
- Cards show their genres explicitly and highlight genres shared with the
  user's positive taste profile.
- Every genre chip on a title card is clickable. Clicking it applies that genre
  as the active global genre filter and updates the control-deck selector.
- Genre filtering belongs in the sticky control deck and applies to card grids
  together with language, rating and year filters. The rating filter supports
  All ratings, Unrated, or an exact saved 1–5 star rating.
- `Kids` is a separate genre from `Family`. It is assigned only where Wikipedia
  metadata identifies children’s/kids/pre-school content; Family content is not
  automatically treated as Kids content.
- Documentary titles are not recommended by default. They may remain visible in
  Pool, Tags, Rated, Watchlist, Hidden and Rejected views for inspection.

The release smoke test must confirm that the split stylesheet and application
script load in headless Chrome, the app executes its initial render, removed
availability controls remain absent and every temporary browser profile/output
file is deleted. Genre changes additionally require JavaScript syntax checks
and targeted source assertions for extraction, weighting, card display and
overlap-first ordering.

### 2.3 Sticky Control Deck

The settings/filter section is called the control deck. It remains visible as a
sticky section below the main header and is shared across major app pages.

The control deck owns global controls:

- Year cutoff
- Language filter
- Genre filter
- Rating filter: All ratings, Unrated, or an exact 1–5 star rating
- Sort mode, including stable Random / Shuffle
- Title search
- Tag click mode
- Manual Wikipedia URL add

On mobile, the control deck must be collapsible so the sticky settings area
does not consume most of the viewport.

The control deck must stay compact. Do not show internal tag/candidate debug
text in the user-facing deck. On desktop, filters, sort, search and manual URL
controls should use a dense layout instead of spreading across unnecessary
empty vertical space.

Tag click mode is global. In explore mode, tag clicks open the tag workspace.
In remove mode, tag chips on title cards remove the tag from that title, and
Tag Brain chips remove the tag from every active or hidden title currently
carrying that tag.

Tag removals are persisted per title so retagging or housekeeping does not
reapply the same removed tag to the same title.

Cards should always show their visible tags without a More/Less toggle. Card
tag rows use compact full-width chip rows so label gutters do not waste space.
The card labels are:

```text
Tags  other cleaned/normalized tags
```

Do not show internal source/count labels such as `wikipedia · 12 tags` on
user-facing cards.

Recommendation cards should not use a separate legacy `Why` row. They should
show the match percentage prominently and color-code scoring tags directly.
The displayed match percentage must be normalized from the same ordering basis
used to rank recommendations, so visible order and visible number agree:
positive overlap first, then negative overlap, then weighted score. Positive
matched tags show their positive contribution, disliked/negative matches use
warning color, and ordinary descriptive tags remain neutral.

Card titles must wrap instead of cropping, especially on mobile. Mobile title
grids should use one card per row for readability.

Cards must show whether the title is a Movie or Show. When a verified
Wikipedia URL is available, clicking the title name opens that page in a new
tab.

Title search is a global filter. It applies to recommendation, Pool, Rated,
Watchlist, Hidden and Rejected title grids together with year/language/genre
filters.

## 3. Core User Requirements

### 3.0 User Vocabulary

When the user says "movie" during CineLens work, treat it as shorthand for any
CineLens title unless the user explicitly narrows the scope. This includes:

- Films
- TV shows
- Series
- Miniseries

Use "title" in implementation/spec wording when precision matters, but do not
interpret the user's casual use of "movie" as excluding TV shows.

### 3.1 Content Scope

The app must support:

- Hindi movies
- English movies
- English TV shows / series / miniseries

Existing Hindi shows already present in local data, IndexedDB or Drive must be
removed during startup/restore maintenance and blocked from future automatic
re-collection.

Conventional horror is excluded from CineLens. This means ghost, possession,
demon, slasher, gore, splatter and similar straight-horror titles are removed
from active and Hidden data during startup/restore maintenance and blocked from
future automatic collection or manual add. Psychological-horror,
science-fiction-horror and horror-comedy titles remain eligible when that hybrid
aspect is explicit in the Wikipedia metadata or saved tags.

The app must reject or skip:

- Hindi TV shows / series / miniseries
- Conventional horror titles without an explicit psychological, science-fiction
  or comedy hybrid signal
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

Wikipedia page acceptance must require positive film/show evidence and positive
Hindi or English language evidence. It must not infer a valid title merely from
a nearby movie-like category when the page lead identifies a person,
organization, company, network, studio, agency or other non-title entity.

Cards must provide a `wrong pick` action for cases where a bad title still gets
through. Marking a title as a wrong pick hides it, stores it in Hidden for
audit/restore, records it as rejected so collection avoids it later, saves
locally and syncs Drive when connected. Restoring a wrong pick removes the
wrong-pick tombstone so sync does not hide the restored title again.

### 3.2 Recommendation Goal

Once the user has rated enough titles, automatic fetching should continue in the background until the app has at least:

```text
enough strong recommendation candidates for the current taste profile
```

The strongest tier means the title shares the current maximum number of positive concepts, then reaches nearly the best weighted fit inside that overlap tier. The implementation uses:

```js
const PERFECT_REC_TARGET = 5;
const PERFECT_REC_MIN_RATIO = 0.995;
```

The ratio is used only inside the maximum-overlap tier because floating-point weighted fit can make exact equality brittle.

### 3.2.1 Active Avoidance Signals

The app must actively detect and avoid recommending titles with ending styles
the user dislikes:

- Unresolved endings
- Open endings
- Ambiguous endings
- Anticlimactic / anti-climactic endings
- Cliffhanger endings

When Wikipedia story/lead text contains clear evidence for these attributes,
the tagger stores explicit concepts such as:

```text
unresolved-ending
open-ending
ambiguous-ending
anticlimactic-ending
cliffhanger-ending
```

Titles with these concepts must not appear in For You recommendations or
discovery fallback cards, even if they match other liked concepts or genres.
They may still exist in Pool, Tags, Rated, Watchlist, Hidden and Rejected views
for inspection, editing, retagging or manual override.

Documentary titles are also actively excluded from For You recommendations and
discovery fallback cards.

Agenda/preachy-message avoidance is evidence-based. The tagger may add avoid
tags such as `political-agenda` or `preachy-social-message` only when the
story/lead text clearly frames the title as agenda, propaganda, culture-war or
message driven. Strong women, female protagonists, minority characters or
social settings are not avoid signals by themselves.

### 3.2.2 Names In Tags And Concepts

Specific character/person names must not become recommendation concepts. They
are usually unique to one title and create clutter instead of useful taste
signals.

The tagger must detect likely names from the original capitalized story text
before lowercasing/tokenization, then remove those name tokens from raw
descriptors before they are scored or canonicalized.

Examples:

```text
baby-charlotte-learns -> baby-learns
shaun-evans-falls     -> falls, or dropped if too weak
mark-finds-funny      -> finds-funny, or dropped if too weak
```

The app should prefer reusable roles, relationships, actions, settings and
story attributes over one-off names. Existing saved titles must rebuild through
the name-cleaned concept pipeline when the canonical tag version changes.

### 3.2.3 Overbroad Concept Suppression

Concepts that appear across too much of the pool are not useful recommendation
signals, even when they are technically true. They must not dominate `Why`,
cards or Tag Brain.

The app treats a concept as non-diagnostic when it appears in more than 10% of
the title pool. Non-diagnostic concepts stay in stored title data, but are
excluded from recommendation weighting and user-facing concept explanations.

This is intended to suppress wallpaper concepts such as:

```text
compressed-timeline
father-child-relationship
school-college-setting
```

when they become too common in the user's actual pool.

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

Pool entries must use the same card design as recommendation, rated and recently-added cards for visual consistency.

Pool cards must support:

- Rating stars
- Full tag visibility
- Removable tags
- Retag button
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

### 3.7 Recently Added Visibility

Recently Added replaces Watchlist as a top-level tab.

- It shows every active (non-hidden) title, ordered by when it first entered
  CineLens, with the newest first.
- Retagging, rating, hiding/restoring or ordinary record updates must not move a
  title to the top. The ordering field is `addedAt`, not `_updatedAt`.
- Existing Watchlist entries are not discarded. During migration they become
  normal retained titles (`manualAdded`) so they cannot be lost to rolling-pool
  rotation after the old Watchlist feature is retired.
- Recently Added cards use the shared card component.

### 3.8 Tags / Tag Brain Visibility

Tags must be its own tab.

Tag Brain should show user taste signals derived from ratings.

Tag Brain is secondary to recommendations. It must not crowd the recommendation page.

Tag Brain chips must honor the same global tag click mode as card chips:
explore opens the selected tag workspace, while remove mode bulk-suppresses the
clicked tag from every matching active or hidden title, recomputes weights,
saves locally, syncs Drive when connected and rerenders the Tags view.

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

The main header shows the CineLens logo, a compact integer app-version badge
and the primary tab navigation. The version badge must remain close to the logo
on desktop and mobile, and it must read from `APP_VERSION` rather than user
data or Drive state.

Top tab bar should include:

- All / Recommendations
- Movies
- Shows
- Rated
- Recently Added
- Tags
- Pool
- Rejected

Current code uses `activeTab` and `setTab(tab, btn)`.

Implementation detail: Movies and Shows may remain filters for recommendations rather than full isolated top-level views, but the visible sections must match user expectation:

- Recommendations tab: only recommendations
- Rated tab: only rated
- Recently Added tab: all active titles, newest added first
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

### 6.0 Fetching Strategy

Fetching must optimize for useful recommendation depth, not an artificial
"near-perfect" title count.

The app should track practical fetch progress:

- attempted/check count
- titles added
- strong recommendation candidates available
- current best positive tag-overlap depth

Automatic fetching should stop when the app has enough strong recommendation
candidates, when the run budget is exhausted, or when the user presses Stop.
It must not chase an endless set of titles that exactly match the current top
recommendation tier.

During active fetching, the app should avoid expensive UI work:

- Do not fully rerender card grids after every fetched title.
- Recompute recommendation status only periodically.
- Rebuild the tag brain in batches and at the end of a run.
- Save local state in batches.
- Sync Drive after the run rather than repeatedly inside the inner fetch loop.

Manual Wikipedia URL add is a separate user action from background pool
fetching. If the user has stopped background fetching, manual URL add must
still be allowed to fetch and process the pasted Wikipedia page.

The **Since** year is both a display filter and an automatic-collection
boundary. Year-category discovery must request and walk only categories at or
above the selected year. Changing Since clears the year-category cache and
resets every lane cursor, so the next collection run cannot continue an older
below-cutoff crawl. Existing older personal titles are retained locally and may
be shown again if the display filter is lowered. A deliberate manual/direct
Wikipedia add remains an explicit user action and is not rejected merely for
being older than Since.

Candidate lanes are consumed in **descending year order**. If collection has
reached 2014, the next historical slice is 2013, never 2015. The collector may
stay within a year slice until its locally indexed candidates are exhausted,
but it must not restart from newer years merely because a fetch run ends.

### 6.0.1 Collection cursor persistence

Automatic discovery currently uses the existing Wikipedia year/category flow.
It must preserve each lane cursor across pauses, restarts and device sync so a
collection run continues backward through history: `2014 → 2013 → 2012`.

The reverted experimental local Wikimedia candidate-index feature is not part of
the active collection design. Any leftover IndexedDB `candidates` object store
from that experiment is ignored by the app and must not affect startup, cache
loading or normal collection.

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
2. Keep the default collection proportions weighted toward the active lanes only: roughly 4 parts English movies, 3 parts Hindi movies and 2 parts English shows.
3. Shuffle each lane.
4. Weighted round-robin across lanes using the configured proportions.
5. Remove duplicates.
6. Exclude existing titles.
7. Exclude rejected titles.
8. Process candidates through the same validation pipeline as manual URL add.

This collection mix controls only which Wikipedia titles are fetched next. It is
not a recommendation ranking signal. Recommendation order must still come from
the user's ratings, tags, genres, hidden titles and avoid rules.

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
const MIN_PLOT_TAGS = 5;
```

`ensureMinimumPlotTags()` must never add generic fallback tags. The modern
story tagger may keep additional local keyphrase descriptors from the same
story text to avoid useless one/two-tag cards, but these descriptors must still
be evidence-backed and must not be broad filler.

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

### 8.1 Rating-Learned Taste Model

Ratings are training truth. A match percentage is the model’s predicted personal
rating for a title, not a relative count of shared tags and not a display value
that simply makes the top recommendation look like 100%.

The model learns from every rated title using cleaned recommendation tags and
stored genres:

- It starts from the user’s actual average rating.
- It learns regularized positive and negative tag and genre effects from the
  residual difference between each title’s actual rating and the model’s
  current prediction.
- Very common tags are damped, so ubiquitous wallpaper concepts cannot dominate
  merely through frequency.
- Explicit manual tag preferences remain a small additive signal, but ratings
  remain the main source of learning.
- The resulting raw score is calibrated back to the user’s actual 1–5 rating
  distribution.

For an already rated card, CineLens must make a leave-one-out prediction: it
removes that title from training, learns from every other rated title, then
predicts the held-out title. A title may not improve its own displayed fit by
contributing its own tags to the model.

This makes rated cards a continuous model check. For example, a 4-star title
should normally predict above a materially dissimilar 3-star title when the
rest of the rating history supports that distinction. Imperfect predictions are
useful evidence that the learned model needs more ratings or better tags; they
must not be hidden through a separate rated-card display rule.

### 8.2 Scoring Candidates

Recommendation candidates are unrated titles from the pool that match selected
scope and filters.

Each candidate receives a predicted personal rating on the same 1–5 scale that
the user uses. The card percentage is:

```js
matchPct = ((predictedRating - 1) / 4) * 100
```

The recommendation order is the learned predicted rating first, then positive
learned contribution, negative penalty, tag/genre support and title as a final
tie-breaker. A title needs at least some positive learned evidence above the
user’s baseline rating to enter the personalized recommendation set.

### 8.3 Match Display

Cards show the prediction transparently as `predicted fit`, with the underlying
predicted star value in the explanatory line. The tag/genre chips show the
learned contributions that led to the prediction.

A high percentage must therefore mean “the rating model predicts I will like
this strongly,” not “this title happens to contain many positively weighted
tags.” Rated and unrated titles use the same learned model; rated titles use
leave-one-out evaluation as described above.

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
- Load and merge it when connected
- Create it if missing
- Pull the current Drive file before upload and patch the merged result
- Store and restore Drive file ID
- Sync local state after meaningful changes
- Treat local and Drive as peers. Neither side should blindly overwrite the
  other when both contain useful data.
- Persist `meta.updatedAt` for the dataset and `_updatedAt`/`updatedAt` on
  title, hidden-title and rejected-title records.
- Resolve record conflicts by the newest timestamp. Active-vs-hidden conflicts
  prefer hidden records so a title removed by pressing `x` does not come back
  from an older active copy.
- Preserve legacy Drive files that do not yet contain timestamps by stamping
  missing metadata during merge.
- Keep old fields such as `canonicalTagStats` and `suppressedConcepts`
  readable for migration, but write current data through `tagStats` and
  `suppressedTags`.

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
- Fetching continues until enough strong recommendations exist, or the run budget is exhausted.
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
9. Keep design consistent: same cards across Recommendations, Rated, Recently Added and Pool.
10. Treat tagging as the core engine, not cosmetic metadata.

### 14.1 Required Delivery Workflow

Every completed code change must follow this sequence before it is reported as done:

1. Update `spec.md` with the new behavior, migration rule or bugfix notes.
2. Syntax-check the real `app.js` file.
3. Run a targeted runtime smoke test in headless Chrome against the real split app, preferably served from localhost when storage or browser behavior is involved.
4. Exercise the changed user flow and verify its persisted state, not only function presence.
5. Remove every temporary test artifact, including ad hoc smoke-test HTML files, extracted scripts, browser profiles, logs, server output and generated scratch files.
6. Confirm no temporary artifact remains in the workspace, staged changes, system temp directory or any external browser-profile path used by the test.
7. Run `git diff --check` and review the final diff for unintended changes.
8. Commit only the intended project files with a descriptive commit message.
9. Push the commit to the active branch's configured remote.
10. Report the smoke-test result, cleanup result, commit hash and pushed branch.

The normal CineLens app bundle is:

```text
index.html
app.js
styles.css
spec.md
.gitattributes
dev/harness.mjs
dev/assert-vNNN.mjs
dev/README.md
```

When any of these files are part of the change, stage, commit and push the related bundle files together. The committed `dev/` harness and per-release assertion files are permanent test code. Future behavior smokes must reuse `node dev/harness.mjs dev/assert-vNNN.mjs`; if the harness lacks a shared capability, extend the harness itself. Do not stage editor files, generated syntax extracts, throwaway smoke rigs, browser profiles, logs or other temporary artifacts.

Do not describe a change as complete after static checks alone when a browser-visible or persistence behavior was changed.

Smoke tests are mandatory for behavior changes in this app because a single
browser runtime error can disable the whole static UI. Use the smallest smoke
test that covers the risk:

- Basic app smoke for ordinary app-code changes: load the real split app and
  confirm the CineLens shell renders without a fatal script error.
- Targeted smoke for changed behavior such as fetching, Drive sync, hidden
  titles, sorting, tag removal or persistence.
- Live Wikipedia smoke only when parser/fetch behavior itself changes and a
  controlled fixture cannot prove the behavior.

For copy-only or documentation-only edits, syntax/diff checks may be enough.

## 15. Recommended Future Refactor

The app is split into `index.html`, `styles.css` and `app.js`. A safe future refactor would further separate the JavaScript into logical modules while keeping deployment simple.

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
- Superseded by the sticky-control-deck release: the control deck is now visible across major tabs so filters and concept/tag click mode are global.
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

## 30. Authoritative Current Specification - June 22, 2026

This section is the authoritative CineLens product and implementation contract.
If an earlier requirement, changelog entry, verification note or example
conflicts with this section, this section wins. Earlier sections remain only as
historical context.

### 30.1 Product model

CineLens is a local-first, tag-driven movie and show discovery system.

- Recommendations are driven directly by title tags, genres, ratings, explicit
  tag preferences and negative evidence.
- The removed "concept" layer must not be restored in UI, scoring or internal
  state.
- Local state renders first. Drive synchronization happens afterward and must
  converge without replacing the visible local state with defaults.
- Movies and shows are distinct title types and retain distinct card styling.

### 30.2 Wikipedia discovery and search

Automatic pool discovery is deterministic and cyclical.

- Movie lanes use English-language and Hindi-language year categories.
- The show lane uses country/year television category indexes for English
  content only. Hindi shows are not collected.
- Each lane persists its own descending-year cursor and advances it when a
  source category has been indexed, rather than waiting for a clean end to a
  fetch run.
- Expansion resumes from the persisted cursor instead of starting at the
  newest year every time. After 2014, historical traversal continues with
  2013.
- Candidate category members are saved as lightweight IndexedDB index records.
  They are selected locally by set intersection with the personal library and
  exclusion records before expensive parsing or AI tagging.
- A completed lane may wrap only after its indexed historical slices have been
  exhausted. It does not discard the candidate index simply because a run was
  paused or the app was closed.
- Removed titles, hidden titles and existing title identities are skipped before
  expensive parsing or AI tagging.

The top title search is one unified control.

- Typing performs a direct local-library lookup before Wikipedia is considered. It must reveal matching active titles regardless of the active tab or the current Since, language, genre and rating filters.
- Matching Hidden titles must be shown as Hidden rather than appearing absent.
- Matching compact removal/rotation records must be shown as previously removed with an explicit re-add action, so a title discarded by an earlier rule can be recovered after that rule changes.
- A direct link or Wikipedia result that already matches an active local title must reveal the existing card instead of refetching and retagging it.
- Pressing Enter or `search wiki` first attempts the exact Wikipedia page title.
- Only when an exact usable page is unavailable does the app use fuzzy
  Wikipedia search suggestions.
- A pasted Wikipedia URL is accepted by the same field.
- Search results are previews rather than immediate adds. Every result provides
  a direct Wikipedia link and a separate explicit add action.
- A deliberate manual add still respects the content gate. A page must still be
  a real movie/show with a release year, narrative text and stable Wikipedia
  identity. Hindi shows remain excluded even when added manually.
- Wikipedia request failures must be reported as request failures. They must not
  be converted into a false "title not found" message.
- Deliberately selecting a removed title through search clears its internal
  removal block and permits it to be added again.
- The old separate manual URL row and per-card URL repair field are removed and
  must not return.

### 30.3 Wikipedia page acceptance

A Wikipedia page is accepted only when it has:

- evidence that it is one movie or show rather than a person, company,
  franchise, list or organization
- positive English or Hindi language evidence
- a release/debut year
- a usable narrative section
- a stable Wikipedia page identity

The English/Hindi evidence rule applies to automatic discovery. A deliberate
manual add may accept another or unknown language while retaining every other
identity and narrative requirement.

Narrative extraction evaluates all real Wikipedia sections by content. `Plot`,
`Premise`, `Synopsis`, `Story`, `Overview`, combined headings and unfamiliar
headings are all valid when their contents are genuinely narrative. Production,
casting, episode lists, release, reception and similar sections must not be
mistaken for story text.

Narrative sections are hierarchical. When a parent narrative section such as
`Plot` contains season, chapter or period subsections, CineLens combines those
descendant subsections until the next peer heading. It must not send Gemini only
one season range from a comprehensive series article. Existing titles fetched
under an older parser version refresh Wikipedia before their next Retag.

Movie/show classification is deterministic metadata, not an AI guess.
Precedence is:

1. explicit Wikipedia page-title suffix such as `(film)`, `(TV series)`,
   `(television series)`, `(web series)` or `(miniseries)`
2. the opening definitional sentence, such as "is a ... film" or
   "is a ... television series"
3. film/show categories
4. weaker media evidence only when stronger evidence is absent

Later references to an adaptation, sequel, franchise or television spin-off
must not change the type of the current page. For example, `Taken (film)` is a
movie even though its article later mentions a television series. Stored
records self-correct from saved Wikipedia title, lead and category metadata
during normalization.

### 30.4 AI tagging contract

AI is the only active title-tag generation path. Old seed tags, hardcoded rule
tags and the local fallback tagger must not be used as an alternative source of
title tags.

Current parameters:

```js
AI_TAG_PROMPT_VERSION = 'cinelens-tags-v3'
AI_TAG_MIN_COUNT = 10
AI_TAG_MAX_COUNT = 20
AI_TAG_BATCH_SIZE = 20
```

Every committed AI tag must be:

- grounded in the saved narrative text
- distinct after normalization
- non-generic
- non-meta
- different from genres
- supported by returned evidence
- absent from the title's suppression lists

The raw Wikipedia narrative is sent to Gemini unchanged for title tagging.
CineLens must not soften, paraphrase or work around a Gemini `PROHIBITED_CONTENT`
block in order to retain a title whose central subject falls outside the user's
interest.

When Gemini returns a `PROHIBITED_CONTENT` block for one title:

1. CineLens removes that title from active and Hidden libraries.
2. It writes a synchronized permanent exclusion record with reason
   `ai-sensitive-content-excluded` so the collector cannot fetch or tag it again.
3. It removes any pending AI-tag state instead of leaving a retry card.
4. It continues tagging other titles. In a mixed batch, it retries titles
   individually first so only the actually blocked title is removed.
5. Existing pending records carrying a saved `PROHIBITED_CONTENT` error are
   purged during startup maintenance and Drive restore.

This rule applies only to the explicit Gemini safety code, not to ordinary
empty responses, rate limits or generic tagging failures.

Fewer than ten tags is not treated as a completed result. It is also not simply
discarded. Partial grounded results are accumulated through continuation calls:

1. preserve the usable partial tags and evidence
2. send the existing tags back to AI
3. request the exact missing number of additional tags
4. exclude suppressed and already accepted tags
5. merge only new distinct grounded tags
6. continue for up to three continuation calls
7. commit the title once the accumulated set reaches at least ten tags

If continuation still ends below ten, persist the usable partial tags and their
evidence on the title. Do not throw that work away.

Daily AI quota exhaustion is not a Wikipedia/parser failure. Do not refetch the
article or retry the same AI request immediately. Keep the title and any partial
tags, show the real quota message and offer `choose tags` or a later Retag.

The UI may show progress such as `AI building tags 7/10`. An incomplete set must
not be marked `verified`.

Bulk and Expand Pool tagging fill requests through the shared 20-title batch
builder. A card-level Retag operation is intentionally focused on that one title
so unrelated batch titles cannot delay or obscure its result.

### 30.5 Retagging and rating

Retag uses the stored narrative first. Wikipedia is refreshed only when story
text is missing or when an AI attempt needs a fresh narrative.

Retag must:

- preserve rating, watchlist, notes, suppression lists and stable identity
- generate a fresh AI tag set
- use continuation tagging when the first response is underfilled
- expose the actual failure reason if completion still fails
- save locally and sync Drive after success

Rating changes do not trigger Retag. Rating updates taste weights immediately;
Retag remains an explicit title action for refreshing tag evidence.

An underfilled title provides `choose tags`. The chooser:

- starts with Gemini's persisted partial tags
- searches normalized tags already present in the CineLens cloud
- allows the user to add relevant existing tags up to the normal maximum
- requires at least ten total tags before saving
- records manual selection evidence and then treats the completed title as
  tagged

Star behavior:

- selecting a different star changes the rating to that value
- clicking five on a five-star title keeps the five-star rating
- clicking four on a five-star title changes it to four
- only clicking the active first star on a one-star title clears the rating

### 30.6 Tag removal and vocabulary optimization

Removing a tag from a title is a permanent per-title exclusion.

- Store normalized exclusions in `suppressedTags` and
  `suppressedRawTags`.
- Tag cleanup, migration, reload, Drive merge, Retag and AI continuation must
  preserve these lists.
- AI requests receive the exclusions.
- Returned excluded tags are filtered before commitment.
- A removed tag must not return to the same title.

Tag consolidation rewrites the stored tag cloud in place.

- Each verified title keeps grounded AI evidence, but every stored occurrence
  of a replaced tag is changed to the chosen existing canonical tag.
- The rewrite covers active and hidden titles, `tags`, `coreTags`, `plotTags`,
  `descriptorTags`, AI partials and evidence, per-title suppressions, tag
  preferences and the currently selected tag.
- Rewritten arrays are deduplicated. If a title had both `abduction` and
  `abduction-mystery`, and Gemini chooses `abduction`, the title stores one
  `abduction` tag afterwards.
- Recommendation overlap uses these rewritten stored tags directly. There is
  no alias map, tag-family layer or parallel canonical vocabulary.
- CineLens must not contain a hand-authored synonym dictionary or infer
  semantic equivalence from shared words, prefixes or phrase containment.
- Whenever the unique stored tag cloud grows by another 500 tags, CineLens
  sends the complete vocabulary and frequencies to Gemini for a conservative
  normalization pass.
- The control deck also provides `Consolidate Tag Cloud`, which forces the same
  Gemini normalization immediately regardless of the 500-tag threshold.
- Gemini must choose canonical targets from tags already present in the cloud.
  It may merge genuinely interchangeable phrases but must keep materially
  different causes, actions, settings, relationships and outcomes separate.
- Gemini cannot introduce any new tag during consolidation.
- Removing a tag suppresses that exact stored tag for that title.
- The Tags statistic reports the unique stored vocabulary after rewriting.
- Old datasets containing `tagAliases` are migrated once by applying those
  mappings to stored records, then the legacy field is cleared and is not
  persisted again.

The Gemini Apps Script endpoint must support this dedicated request shape:

```json
{
  "task": "normalize-tag-cloud",
  "items": [],
  "normalizeVocabularyOnly": true,
  "optimizeVocabulary": true,
  "normalizationVersion": "cinelens-tag-cloud-v2",
  "tagVocabulary": [
    {"tag": "abduction", "count": 2},
    {"tag": "abduction-mystery", "count": 1}
  ],
  "instructions": "conservative semantic normalization instructions"
}
```

For this task the Apps Script must not run the title/story tagging path or
require non-empty `items`. It should ask Gemini to choose canonical targets only
from `tagVocabulary` and return:

```json
{
  "ok": true,
  "model": "gemini model name",
  "rewriteGroups": [
    {
      "canonical": "abduction",
      "replace": ["abduction-mystery"],
      "confidence": 0.94
    }
  ]
}
```

The server must omit uncertain mappings, must not invent canonical tags absent
from the submitted vocabulary and accepts only groups with confidence at least
`0.90`:

```json
{
  "canonical": "abduction",
  "replace": ["abduction-mystery"],
  "confidence": 0.94
}
```

### 30.7 Title lifecycle

There are two user-facing title removal operations.

`hide`

- reversible
- retains the complete title record in `state.hiddenTitles`
- appears in the Hidden tab
- blocks automatic rediscovery while hidden
- Restore returns it to the active collection

`remove`

- removes the title from all visible collections
- stores a small internal block/tombstone
- prevents automatic refetching and retagging
- has no visible Wrong Pick or Rejected tab
- can be overridden only by deliberately adding the title through unified
  search

The old visible `wrong pick` wording and separate rejected-title history are
retired. Internal removal records are housekeeping data, not a browsable
collection.

### 30.8 Reset All

`Reset All` means a genuinely empty CineLens dataset.

It clears:

- active titles
- hidden titles
- ratings
- watchlist
- tags and tag evidence
- tag preferences
- internal removal blocks and tombstones
- discovery cursors
- recommendation weights and statistics

Reset writes a `resetAt` dataset marker and directly overwrites the connected
Drive file with the empty dataset. It must not perform a normal pre-upload merge
that can resurrect old Drive titles. A newer local or remote reset marker wins
during future convergence.

### 30.9 Persistence and sync

Google Drive holds one canonical CineLens library. Each browser keeps a local
cache so the app can render immediately, but a device-local copy is not a
second competing library.

- The canonical file is `cinelens_data.json` and, after migration, stores its
  own immutable Drive file ID in `meta.canonicalDriveFileId` with
  `meta.driveSyncModel = "canonical-drive-v1"`.
- On a new device or after reconnecting, CineLens reads the canonical Drive
  file first and replaces the local cache before collection, maintenance or
  background tagging can write data.
- A stale local `fileId`, a recently modified tiny duplicate or a browser's
  local timestamp must never redirect a device to another same-named Drive
  file.
- During the one-time migration from earlier same-name copies, CineLens picks
  the fullest readable library, stamps that file as canonical and pins every
  later device to the embedded canonical file ID. It does not keep choosing the
  largest or newest file after the marker exists.
- A normal save writes to that one canonical file. Before upload, the app reads
  the canonical copy and converges title, hidden-title, removal and preference
  records by their own timestamps, then writes the single converged dataset
  back to the canonical file. This protects a change made on one device from a
  stale cache on another device.
- Active-vs-hidden conflicts use the newer record; on an exact timestamp tie,
  Hidden wins so an older active cache cannot resurrect a removed title.
- A deliberate later Reset remains the only whole-library overwrite. It writes
  the empty reset dataset directly to the canonical file and wins over older
  records during later synchronization.
- At the end of a successful sync, the canonical Drive file and that browser's
  local cache contain the same dataset.

The persisted dataset includes movies, hidden titles, removal records,
settings and tag preferences, tag normalization state, discovery cursors,
statistics and reset metadata.

### 30.10 Deferred OTT availability

OTT/streaming availability is explicitly deferred.

- No OTT provider filter is part of the current product.
- No TMDB, JustWatch or grounded-search integration should be added.
- Do not add provider forms, API keys, billing or background availability
  requests without a new explicit user decision.

### 30.11 Verification baseline

Recent focused tests cover:

- exact Wikipedia title lookup before fuzzy search
- movie/show precedence using `Taken (film)` and `3 Body Problem (TV series)`
- correction of incorrectly stored title types
- AI partial accumulation (`3 + 4 + 3 = 10`)
- under-minimum records remaining unverified
- optimizer and alias passes preserving the ten-tag minimum
- focused single-title Retag
- persistent removed-tag exclusions
- one-star-only rating removal
- hide/restore and permanent remove/manual-search override
- true local/Drive reset semantics
- shared 20-title bulk batch filling

Required release checks for app changes remain:

```text
node --check app.js
git diff --check
focused behavior smoke for the changed path
temporary harness/profile cleanup
```

`index.html`, `styles.css` and `app.js` are application release files.
`spec.md`, `.gitattributes` and the committed `dev/` smoke harness plus
per-release assertion files are permanent repository files. Future behavior
smokes must run through `node dev/harness.mjs dev/assert-vNNN.mjs`; if a smoke
needs new shared capability, extend the harness instead of creating a
throwaway rig. Workspace files, temporary browser profiles, logs, downloads,
server output and generated artifacts must not be staged, committed or pushed.

### 30.12 Reception-Aware Watch-Worthiness

CineLens shows one recommendation percentage. That single score is final
watch-worthiness: the existing personal tag/genre taste prediction corrected
by compact Wikipedia reception evidence. Reception is never a second visible
engine and must not add visible Taste Fit, Reception, Execution, Critic or
Confidence chips, badges, filters or card sections.

Reception extraction is parse-only for newly fetched titles. The Wikipedia
fetch path already downloads the full article plaintext and wikitext, so new,
manual and retagged titles reuse that same response and store only a compact
`reception` object with parser version, aggregator figures when explicitly
stated, consensus tier, execution praise/criticism facets, `qualitySignal`,
`strength` and `parsedAt`. Raw reception text is not persisted. Old records
without reception continue to render and score normally; `RECEPTION_VERSION`
marks records eligible for selective future refresh.

Reception adjusts score only, never eligibility. Documentary, disliked-ending
or avoided tags, conventional horror, hidden, removed, wrong-pick,
rolling-pool, Hindi-show, language and Wikipedia validation gates remain
authoritative regardless of glowing reception.

The blend happens in stars inside `predictTasteFit`, after the taste-only star
prediction and before `matchScore`:

```text
shift = clamp(laneCoefficient * qualitySignal * strength,
              -RECEPTION_MAX_DOWN,
              +RECEPTION_MAX_UP)
```

The downward cap is larger than the upward cap, so bad execution can pull down
an otherwise strong title while good execution gives only a modest lift.
Missing or zero-strength reception has shift `0`; there is no penalty for
absent Reception sections. A title with no usable reception evidence is capped
below 100% for display and ranking, so a shown 100% requires both perfect taste
fit and positive execution evidence.

Lane coefficients are learned from the user's own rated titles as a residual
correction: actual rating minus taste-only leave-one-out prediction regressed
against `qualitySignal * strength`. The app stores only compact calibration
metadata in the profile/meta path. Each lane (`hindiMovies`, `englishMovies`,
`englishShows`) uses its own coefficient after the lane sample threshold,
falls back to pooled global calibration after the global threshold, and uses a
fixed conservative baseline below that. Learned coefficients are regularized
and clamped so taste remains dominant.

Existing-title reception backfill is bounded, idle, resumable and scoped. It
does not refetch the whole library at startup, does not block initial render,
Drive restore, IndexedDB hydration, rating, search or normal recommendation
rendering, and persists only changed record ids through scoped IndexedDB saves.
The local database remains opened version-less for `cinelens_local_v3`; do not
reintroduce an explicit lower IndexedDB schema version.

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

Cards no longer display a ranked dump of five near-identical chips. This was later tightened further by the sticky-control-deck release.

- `Why`: at most two positively weighted concepts that contributed to this recommendation, ordered by actual weighted contribution.
- `Concepts`: all other visible canonical concepts, with comparatively rare concepts ordered earlier.
- `Tags`: raw tags before canonical concept grouping.
- Cards do not use a More/Less toggle; visible concepts and raw tags are always shown.
- The selected concept is shown on cards inside its own concept workspace so the user can see why the title matched the selected concept.
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
Concept rows are compact and do not reserve an empty label gutter: true
numeric chip ranks removed: true
selected workspace concept shown on its cards: true
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

Cards continue showing raw descriptors separately from canonical concepts. Recommendations, match scoring, Tag Brain and the top `Concepts` count use canonical tags. The control deck shows canonical and raw totals for comparison.

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

## Final Precedence Notice

Section 30, `Authoritative Current Specification - June 22, 2026`, is the
current CineLens contract. Every section after it in this file is retained only
as historical changelog material, regardless of its position or heading
number. In particular, trailing references to concepts, Rejected, Wrong Pick,
manual card URL repair, local fallback tagging, streaming availability or old
reset behavior are obsolete and must not be implemented.


### 30.12 Recommendation reserve and quiet orchestration

CineLens maintains a reserve of strong unseen recommendations, not a raw count of unseen titles.

- A strong candidate must meet the active taste model’s minimum positive-overlap and match-score thresholds.
- Background collection begins when the strong reserve falls below 20 and continues until it reaches 40.
- Before the user has enough rated/tagged titles for personalization, the app may build a modest tagged starter pool; once personalized, raw pool size does not satisfy collection health.
- Newly fetched titles are not recommendation stock until AI tagging completes.
- Pending AI tags are retried automatically with backoff. A Gemini rate-limit response pauses background collection rather than generating a user task.
- Background work updates a persistent progress strip for every checked candidate. Card rendering may remain batched for performance.
- The main header exposes a compact Library status. Drive, expansion, AI retry and tag consolidation live in the Library maintenance panel.
- Reset is isolated in a Danger zone and requires typing `RESET` before local and Drive data are cleared.
- The sticky control deck must remain below an active progress strip and must not overlap it or the current card list.

### 30.13 Sort semantics, search completion and card consistency

The global Sort menu means:

- **Recommended**: On For You, order by the recommendation engine: positive tag overlap first, then weighted taste fit, then fewer disliked overlaps. In non-recommendation views, where recommendation ordering is not the purpose of the view, the relevant view's normal fallback ordering is used.
- **Rating high**: Sort by the user's own star rating from 5 down to 1. Unrated titles tie-break alphabetically.
- **Year newest / oldest**: Sort by release or debut year descending / ascending.
- **Recently changed**: Sort by the latest stored record update time.
- **Title A–Z**: Alphabetical title order.
- **Random / Shuffle**: A stable shuffled order until the user chooses Shuffle again.

A successful manual Wikipedia add keeps the global title-search field and temporary Wikipedia result visible so the added card can be rated. The search clears only when that same added title receives a rating.

The newly added title must remain visibly rendered immediately after a successful add, even when the retained search text is a pasted Wikipedia URL or any other string that does not literally occur in the final title. This temporary visibility pin also overrides the active year, language and genre filters for that one newly added card only. It expires when that same title is rated or the user clears the unified search.

All title cards use the same complete card component in recommendations, title search, Rated, Recently Added, Pool, Hidden and Tag detail. Once there are enough ratings to create a taste model, every card displays the same current-taste match panel, including match percentage, overlap summary, matched tags and matched genres. Recommendation cards additionally show their rank. A card viewed through Tags must not fake the selected tag as a positive recommendation match merely because that tag was used to open the view.

### 3.13 A Story for You

`A Story for You` is a separate creative feature in the Tags view. It does not
change, replace or feed back into title tagging, tag-cloud consolidation,
recommendation scoring, collection or Drive conflict handling.

- Gemini writes a complete original story from the current rating-derived taste
  profile: positively weighted tags, negatively weighted tags and genre signals.
- The story has a title, protagonist, concrete setting, escalating conflict and
  a real ending. It is not a prose summary of the user’s preferences.
- A rating change queues an updated story in the background. Existing story text
  remains visible while the replacement is written.
- The feature is saved in `state.tasteStory` and is included in normal Drive
  persistence, but has no authority over title records or recommendation data.
- The card uses the full available content width on desktop. Its text must use that width; do not cap the card to a narrow centred column or leave large unused interior space.
- A title added from unified search remains visible in the search results until
  that same title is rated. Adding it must not clear the search field or remove
  its card prematurely.


### 30.14 AI tag retry resilience

AI title tagging is distinct from taste-story generation and tag-cloud consolidation because it sends long plot material and requires a separate structured tag-and-evidence result for each title.

- Tagging requests use small batches of three titles, rather than a large all-pending batch.
- When Gemini returns an empty/blocked response for a multi-title batch, CineLens retries the affected titles one at a time so one failure cannot stop or strand the remaining queue.
- A non-rate-limit failure on one title is saved on that title as pending AI tagging and the retry run continues with later titles.
- The Apps Script must surface prompt-block and candidate finish-reason information when Gemini returns no usable content, rather than collapsing every such failure to the uninformative message `Gemini returned no result`.
- The Apps Script returns a machine-readable `PROHIBITED_CONTENT` code when Gemini blocks an individual title for safety. CineLens removes and permanently excludes that title instead of sanitizing its plot, retrying it indefinitely or leaving it pending.


### Permanent removal, mobile controls and sync timing

- **Remove permanently** and **Forget** create synchronized removal tombstones. During record-level Drive convergence, a removal tombstone suppresses stale active or Hidden copies of the same title, so a title cannot reappear after sync. A deliberate manual Wikipedia re-add creates a synchronized release record, allowing that specific title back across devices.
- On mobile, the navigation menu expands in normal document flow rather than overlaying the control deck or title grids. The control deck remains compact when collapsed, while Library maintenance stays reachable without opening the full filter/tool section. When expanded, the deck returns to normal flow so it does not sit over the list below.
- Normal Drive saves are debounced and deferred while collection, background AI tagging, tag-cloud normalization or Taste Story generation is running. Local changes persist immediately; Drive convergence runs after foreground work becomes idle. Automatic background syncs do not show a success toast after every small change.

### Language validation precedence

- A clear `Language` value from a film/show infobox is primary evidence.
- Citation and maintenance categories such as `CS1 Italian-language sources` must never be interpreted as the title’s language.
- Only genuine language-classifying film/show categories or lead text can reject a title when the infobox has no allowed language.
