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

The settings panel includes a Random palette action. It generates a fresh random
hex seed for the main colour, then builds a full theme from numeric
colour-theory relationships rather than named or hand-picked colour presets.
The generator maps derived colours into explicit UI roles: main accent,
secondary accent, page background, header, control deck, chips, source links,
Movie card tint and Show card tint.

Dark backgrounds are not a requirement. The only requirement is readability.
The palette engine may generate light, dark or mixed-tone themes. It may also
randomly choose flat backgrounds or gradient backgrounds per role; gradients
must never be the fixed default. Text, muted text, card text and control
surfaces are derived with contrast checks so generated palettes remain usable.
The generated palette is applied through CSS variables, saved in normal settings
state and restored on later launches/devices through the existing settings
persistence path. Movie and Show cards must have visibly different card-level
coloring, not only different Movie/Show chips.

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

Cards must show whether the title is a Movie or Show. The front of a card is
image-forward: a Wikipedia thumbnail fills the card when available, otherwise a
generated poster surface is used. Hover on desktop, or tap on touch devices,
reveals the full metadata/actions back of the card. Wikipedia and Google are
separate compact source buttons on the action side and always open in a new
browser tab without changing card selection, rating or permanent-remove
behavior. The Movie/Show marker and the match percentage are visible on the
poster side so the card remains scannable before reveal.

Title search is a global filter. It applies to recommendation, Pool, Rated,
Watchlist and Rejected title grids together with year/language/genre filters.

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
- Silent/startup/refresh/re-auth token requests must use `prompt:'none'` so a
  browser that cannot issue silently fails quietly instead of opening Google
  sign-in UI.
- If browser blocks silent auth, render from the local cache, show the quiet
  Drive reconnect state and keep the manual Drive button interactive.

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

- Version 35 uses a bounded union of direct Wikipedia year categories. English
  movies use the English-language, American and British film categories for
  each year. Hindi movies use the Hindi-language and Indian film categories.
  English shows retain the American, British, Canadian, Australian, New Zealand
  and Irish television-series-debut categories. Hindi shows are not collected.
- Each lane persists an independent, versioned cursor containing `year`,
  `sourceIndex`, `sourceTitle`, `offset` and `cycles`. A source-definition
  version change invalidates old positions instead of silently reinterpreting
  an old numeric index.
- A year is complete only after every configured source for that lane has had
  every continuation page and every member traversed. The cursor then moves
  backward one year; after 2014 it continues with 2013.
- Category continuation pages are consumed into a bounded, session-cached
  member array only for the source at the active cursor. CineLens does not
  rebuild or persist a giant Wikimedia candidate index during startup. An
  interrupted or failed continuation chain is never cached as a complete
  source and resumes from the same durable cursor on the next run.
- Candidate offsets become durable only after evaluation. If a run stops after
  part of a prefetched batch, the cursor is restored and advanced only through
  the last candidate actually evaluated, so the unprocessed tail is never lost.
- Collection progress identifies the exact lane, year, source number and
  member position, for example `English movies · 2014 · source 2/3 · member
  431/1260`. Showing a year never implies that the year or another lane is
  complete.
- Wikipedia page ID is the primary identity for active, hidden, manually
  removed, rolling-exclusion and same-run checks. Canonical title is a fallback
  only when stable page identity is unavailable. Final duplicate collapse keeps
  year and format safeguards, so remakes and film/show names do not collapse.
- Only impossible Wikipedia namespaces are rejected from title text before a
  fetch. Namespace-0 wording such as `List` is a hint, not a final rejection;
  pageprops, infobox, lead, format, language, year and narrative evidence make
  the acceptance decision.
- Automatic rolling-pool exclusions suppress an exact identity for one full
  traversal cycle, then permit reconsideration if supply is needed. Manual
  removal records remain permanent until a deliberate re-add.
- A compact synchronized discovery ledger records encounter status, source and
  exact skip/rejection reason. `auditTitleDiscovery(titleOrWikipediaUrl)` returns
  expected lane/year, membership in every configured source, encounter and
  exclusion state, cursor relation, pre-fetch decision and final validation.

Wikipedia request architecture in version 35:

- Discovery before: one comprehensive Wikipedia article request, followed by a
  TMDB search and one combined TMDB details/providers request; AI tagging is a
  later three-title batch. Discovery after: the same three-request behavior,
  because all three payloads are behaviorally distinct.
- The Wikipedia article request retrieves redirects, page ID, extract,
  categories, pageprops, thumbnail and raw revision content together. Infobox,
  story, reception, language, year and format are parsed locally from that one
  payload; no extra Wikipedia parse/category request is made per title.
- Reception refresh before: the comprehensive Wikipedia request plus the two
  unrelated TMDB requests inherited from the normal fetch helper. Reception
  refresh after: one Wikipedia-only request. Poster, genres and availability
  remain owned by the separate TMDB backfill loop.

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
casting, release, reception and similar sections must not be mistaken for story
text. For shows only, `Episodes` sections may contribute story text after the
parser strips table metadata and keeps only genuine multi-sentence synopsis
prose. Movies do not harvest episode sections.

Narrative sections are hierarchical. When a parent narrative section such as
`Plot` contains season, chapter or period subsections, CineLens combines those
descendant subsections until the next peer heading. It must not send Gemini only
one season range from a comprehensive series article. Existing titles fetched
under an older parser version refresh Wikipedia before their next Retag; the
episode-synopsis parser is gated by `WIKI_PARSER_VERSION = 5`.

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

Returned evidence is not trusted merely because it is non-empty. CineLens
normalizes the evidence quote and the saved story the same way: lowercase,
diacritics stripped, non-alphanumeric runs collapsed to spaces. Evidence passes
only when it appears as a normalized story substring, or, for evidence longer
than eight words, at least 80% of its distinct normalized content tokens of
length four or more appear in the story. Tags with fabricated or unsupported
evidence are dropped before the minimum-count check.

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
- keep existing verified tags when the story hash is unchanged and their stored
  evidence still passes the story-evidence gate, then merge new supported tags
  into that keeper set up to the normal maximum
- fully replace tags when the story hash changes, because the underlying article
  actually changed
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
- Startup, refresh and 401 re-auth Drive token attempts are non-interactive and
  use Google `prompt:'none'`. If a mobile browser cannot issue a silent token,
  CineLens must not open the Google sign-in page by itself; it keeps rendering
  the local IndexedDB cache and shows the existing Drive reconnect state until
  the user explicitly taps Drive. The explicit Drive button remains the only
  path that may request interactive sign-in.
- When startup Drive restore failed and background library writes are still
  locked, a later successful silent token renewal must run the same Drive
  restore/merge sequence used after an explicit Drive connection before
  unlocking collection, AI tagging, reception backfill or TMDB backfill. The
  `visibilitychange` renewal check must also run while Drive is enabled and
  writes are locked, even if the stored token is not near expiry.

The persisted dataset includes movies, hidden titles, removal records,
settings and tag preferences, tag normalization state, discovery cursors,
statistics and reset metadata.

### 30.10 TMDB poster art and where-to-watch (v17, redesigned v18) — narrows the prior OTT deferral

The prior blanket ban on TMDB/JustWatch integration is narrowed, not lifted, by
Nitin's explicit 2026-07-09 decision: **poster art and read-only
where-to-watch display are approved.** A country selector and any filter that
changes which titles are recommended remain out of scope — that part of the
original deferral stands. No grounded-search integration was added.

- `TMDB_API_KEY` (v3, read-only, non-billing) lives in `app.js` alongside the
  existing `GOOGLE_CLIENT_ID`/`AI_TAGGER_URL` public client-side identifiers —
  same established pattern, no new precedent.
- **Posters (superseded by 31.15/31.20 — TMDB data is resolved by id, and a
  title search must clear a similarity floor):** `fetchTmdbDetails(title, year,
  format)` searches `/search/movie` or `/search/tv`, matching a candidate whose
  release year is within ±1 of the stored year; every movie
  search adds `region=IN` (`TMDB_SEARCH_REGION`; TMDB's `/search/tv` endpoint
  has no region parameter, so shows use year-window + popularity only) purely
  to disambiguate identically-titled results — it does not limit which
  countries' availability data gets stored. A match's `poster_path` becomes
  `movie.posterUrl` (`https://image.tmdb.org/t/p/w500{path}`). Card rendering
  prefers `posterUrl`, then falls back to the existing Wikipedia
  `thumbnailUrl`, then the generated gradient.
- **Where to watch is platform-picked, not region-fixed (v18).** v17 shipped a
  fixed-India-only display; Nitin explicitly asked instead to choose OTT
  platforms and see which countries carry the title on them. The matched
  title's detail endpoint is called once with
  `append_to_response=watch/providers,reviews`, which returns TMDB's **entire**
  multi-region result and first audience-review page in that same call (no
  extra request per country or for reviews). `buildWatchAvailability` scans every region and
  reduces it to a compact `movie.watchAvailability = {platformName:
  [countryCode, ...]}` map, restricted to the curated `OTT_PLATFORM_PATTERNS`
  list (Netflix, Amazon Prime Video, Disney+, Apple TV+, Max, Hulu,
  Paramount+, Peacock, JioCinema, SonyLIV, ZEE5) matched by regex against
  TMDB's `provider_name` (which spells the same platform differently by
  region, e.g. "Disney Plus" vs "Disney+ Hotstar" both normalise to
  "Disney+") — unrecognised regional providers are dropped rather than stored.
  This is the full raw multi-region response reduced to the minimum needed to
  answer "which countries have this on the platforms I picked," never stored
  as country-by-country provider objects/logos/links.
  - `toggleWatchPlatform(platform)` (in Library maintenance, chip picker
    populated from `OTT_PLATFORM_NAMES`) adds/removes from
    `state.settings.watchPlatforms`. This is a personal viewing-service
    preference, not a recommendation filter — it only changes what a card's
    watch row shows and never affects scoring, ranking or which titles are
    recommended. Persisted as an ordinary view setting (v9 sync discipline:
    local-only, rides along passively with the next real data sync).
  - Card rendering (`renderWatchProviders`) shows **nothing** until at least
    one platform is selected. Once selected, for each chosen platform the
    title is actually on, a chip lists its available countries (capped at 6
    shown, `+N` overflow) plus a "via JustWatch" link to
    `themoviedb.org/{movie|tv}/{tmdbId}/watch` — required whenever TMDB/
    JustWatch provider data is displayed. Still informational only.
  - `TMDB_DATA_VERSION` (**currently 7** — see 31.15; this line's original
    value of 2 is historical) lets `needsTmdbBackfill` pick up a
    record that already has a poster but predates (or was built under) an
    older watch-data shape for exactly one refresh, without re-touching
    records already on the current version.
- **A TMDB source link joins Wiki and Google** on every card
  (`tmdbUrlForMovie`, `themoviedb.org/{movie|tv}/{tmdbId}`) — natural given the
  app already stores `tmdbId`/`tmdbMediaType` for every matched title.
- **New titles:** `attachTmdbDetails` is called once inside
  `fetchWikiMovie`/`fetchWikiMovieByPageId`, after Wikipedia validation accepts
  the candidate — covering automatic collection, manual URL add and direct
  Wikipedia-link add from one insertion point, and never firing for a
  Wikipedia-rejected candidate.
- **Retag:** `retagFromStoredData` calls `attachTmdbDetails` unconditionally
  before finalizing, even on its fast path for an already-healthy record that
  skips a Wikipedia refetch entirely — so Retag always has the chance to
  correct a wrong or missing TMDB match, not only when Wikipedia happens to be
  refetched.
- **Existing-library backfill** runs as its own fast, independent idle loop
  (`runTmdbBackfill`/`scheduleTmdbBackfill`, batch size `TMDB_BACKFILL_BATCH_SIZE`),
  deliberately separate from the slower reception backfill: it needs only a
  TMDB lookup against already-stored title/year/format, never a Wikipedia
  refetch, so it can move through the existing library much faster. It
  prioritizes untouched current recommendation candidates in the exact
  **Best match** order, then rated and otherwise unranked titles
  (`sortByBackfillPriority`, shared with the reception backfill). A failed
  title remains behind untouched work according to its persisted attempt
  metadata; titles within each attempt tier remain ordered by Best match.
  A no-match or failure stamps `movie.posterBackfillAttemptedAt` with a
  cooldown (`TMDB_BACKFILL_RETRY_COOLDOWN_MS`) so it does not retry every idle
  tick. It steps aside while pool expansion, AI tagging or reception backfill
  are active, and is included in `syncMustWaitForForegroundWork`.
- `posterUrl`, `tmdbId`, `tmdbMediaType`, `watchAvailability`,
  `tmdbDataVersion` and `posterBackfillAttemptedAt` are catalogue
  (non-personal) fields — they flow through `catalogueMovieForDrive`
  automatically (it only strips personal fields) and are absent from
  `personalMovieState`. `state.settings.watchPlatforms` (the selection itself)
  travels with ordinary settings sync. No new sync plumbing was needed for
  either.
- Chip colours: watch chips are added to the same palette-aware,
  film/show-differentiated chip rules as tags/genres (`.watch-chip` styled via
  the existing `--tag-bg`/`--film-chip-*`/`--show-chip-*` tokens) — no
  hardcoded colours, consistent with the v16 chip fix.

### Card sizing (v16 regression fixed v17, structural fix v18)

v16 accidentally shrank the desktop card grid (`minmax(240px,1fr)`) below the
size established everywhere else in the stylesheet; v17 reverted
`.movies-grid` to `minmax(330px,1fr)`.

That alone was not enough: the flip card's collapsed and revealed faces both
sat in one `aspect-ratio:2/3` box via `position:absolute;inset:0`, so once
real content (genres, many tags, watch availability, actions) exceeded that
fixed poster-shaped height, `.card-body{overflow:auto}` forced an internal
scrollbar — which Nitin explicitly did not want. v18 fix: the card stays
poster-shaped while collapsed (unchanged crossfade), but once revealed
(`.movie-card.revealed`/`:hover` under `(hover:hover)`), `.card-body` leaves
absolute positioning and `.movie-card` switches to `aspect-ratio:auto;height:
auto;overflow:visible` — the card's height then equals its actual revealed
content, no cap, no clipping, no scrollbar. The front face
(`.card-poster`) stays absolutely positioned and invisible (opacity 0) behind
it throughout.

v34 keeps collapsed cards bounded in sparse desktop grids. Because the v31 grid
uses `auto-fit`, a one-result grid can otherwise stretch its single occupied
track to the whole container and make a poster card fill the page. On desktop
viewports, `.movie-card:not(.expanded)` is capped around normal card width;
full dense grids remain in their usual compact tracks, `.expanded` cards remain
full-row, and mobile single-column cards remain full-width.

### 30.11 Verification baseline

Recent focused tests cover:

- complete category-member continuation pagination and page-ID deduplication
- interrupted continuation chains remaining uncached and resumable
- source completion before descending to the next year
- exact cursor persistence after a normal mid-batch stop
- page-ID-first active/removal identity with guarded title fallback
- title wording reaching article validation while invalid namespaces stay blocked
- reception refresh avoiding unrelated TMDB requests
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
watch-worthiness: format-aware personal tag/genre taste prediction corrected by
compact Wikipedia reception evidence and a small English-language preference
lean. Reception is never a second visible engine and must not add visible Taste
Fit, Reception, Execution, Critic or Confidence chips, badges, filters or card
sections.

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
withReception = clamp(tasteOnlyPredictedRating + shift, 1, 5)
receptionEffect = withReception - tasteOnlyPredictedRating
languageBonus = English ? ENGLISH_PREFERENCE_STAR_BONUS : 0
predictedRating = clamp(withReception + languageBonus, 1, 5)
```

The downward cap is larger than the upward cap, so bad execution can pull down
an otherwise strong title while good execution gives only a modest lift.
Missing or zero-strength reception has shift `0`; there is no penalty for
absent Reception sections. A title with no usable reception evidence is capped
below 100% for display and ranking, so a shown 100% requires both perfect taste
fit and positive execution evidence. The card match line may expose the
reception component only as `reception +0.4*`, `reception -0.8*` or
`reception +/-0.0*`; that number is the clamp-applied `receptionEffect` only
and excludes the English preference bonus.

The English lean is controlled by `ENGLISH_PREFERENCE_STAR_BONUS` and is an
invisible ranking correction, not a collection rule or a second visible score.
It applies to English movies and English shows, gives Hindi titles no penalty,
and only matters when multiple languages are visible together.

Taste learning is format-aware. `CROSS_FORMAT_TASTE_WEIGHT` controls how much a
rated movie teaches show recommendations and how much a rated show teaches
movie recommendations. Same-format rated titles teach at full weight; opposite
format ratings still contribute at the reduced weight so the model is weighted,
not split into isolated engines.

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
Backfill prioritizes rated titles first, then current unrated recommendation
candidates by predicted fit, then the remaining eligible titles. Failed refetch
attempts stamp per-title retry metadata and are skipped for a cooldown so one
bad page cannot block later titles. Backfill is maintenance, not collection:
`Stop Fetching` stops pool expansion but does not permanently freeze reception
backfill, which resumes on idle after foreground collection or AI tagging is
clear. The existing Library maintenance line may show the remaining count as
`N titles need quality data`; cards may only add the terse reception star-effect
hint on the match line when the displayed score actually uses usable reception.
The local database remains opened version-less for `cinelens_local_v3`; do not
reintroduce an explicit lower IndexedDB schema version.

View-only settings such as tabs, sort, filters, title search, collapsed
controls, shuffle seed, top count and since-year persist locally but do not
eagerly queue Drive sync. They ride along with the next real data sync instead.
Library mutations and recommendation-signal settings such as manual tag
preferences still queue sync.

Silent Drive token acquisition must be time-boxed. If Google Identity Services
does not call back, automatic restore/sync must settle to the reconnect state,
clear the restore/sync guards and avoid background error toasts; manual Drive
actions may still surface errors.

Collection progress reports net reality when the rolling pool rotates titles:
fetched count, rotated-out count and net kept count are shown instead of a gross
added count.

Verification uses one local living harness file, `dev/assert-current.mjs`.
Per-version assertion files are retired and `dev/` remains local-only.

Ratings have their own personal timestamp, `ratedAt`. Rating changes set
`ratedAt`; retagging, reception backfill, housekeeping and other non-rating
touches must not. Drive personal overlays compare `ratedAt`, so a newer
non-rating `_updatedAt` from another device cannot wipe a real rating. Legacy
rated records derive `ratedAt` from their existing `_updatedAt`/`addedAt`, never
from the current time.

Automatic Drive sync must never open Google sign-in UI when no valid token is
available. It fails quietly to the reconnect state. Explicit Drive connection is
the only interactive path and makes a single interactive token request.

Pending Drive syncs may defer for foreground work, but only up to the hard cap;
after that a real data-change sync is allowed through so ratings and edits
converge promptly. The Rated tab defaults to newest `ratedAt` first, and tag
cloud weights display rounded compact values while preserving full stored model
weights.

### 30.13 Mobile recovery and maintenance visibility (v36)

- AI tag requests are independently abortable and time-boxed at 45 seconds.
  A timeout or a user Pause collection action releases the foreground add flow;
  the accepted title remains saved with `needs-ai-tags` for a later retry.
- Manual Wikipedia adds update their progress state after article validation to
  `Fetching poster & tags...`, so AI work is not presented as a stalled
  Wikipedia request.
- Startup restore and Drive request retries attempt the existing non-interactive
  `prompt:'none'` token path when a prior Drive connection is known. They never
  open interactive sign-in; an unsuccessful attempt settles to the existing
  reconnect state.
- Background collection reports why it is idle: it explicitly waits for a
  Drive reconnect while writes are locked, and it reports the current strong
  match count plus the 20-title refill threshold once the 40-title reserve is
  satisfied.
- The TMDB attribution is a persistent page footer. On mobile, Library
  maintenance moves into the Menu alongside tabs; desktop retains the existing
  Filters & tools placement.

### 30.14 Silent Drive renewal recovery (v37)

- Automatic `prompt:'none'` renewal is serialized. Visibility resumes, startup
  restore, request retries and timer refreshes share the active token request
  instead of replacing the Google Identity callback.
- A failed silent renewal enters a ten-minute local reconnect cooldown, with a
  thirty-second visibility debounce before any attempt. During that period,
  automatic restore and sync paths settle quietly to the reconnect state and
  never reopen a Google sign-in surface. The user may still explicitly tap
  Drive; a successful manual connection clears the cooldown.
- A remote manifest or chunk update from another device remains ordinary
  convergence data. It is merged by record hash/timestamp and never treated as
  an authentication failure or a reason to start a repeated re-auth flow.

### 30.15 CSS-owned black and crimson theme (v38)

- Theme tokens are defined once in the top-level `styles.css` `:root`; runtime
  JavaScript no longer writes palette values or participates in theming.
- CineLens uses near-black surfaces with crimson film identity (`#E5383B`) and
  steel-blue show identity (`#5AA9E6`). Solid crimson controls and film badges
  use light text for contrast.
- Accent glows derive from CSS RGB token helpers. The old gold palette and
  favicon colour are removed without changing application behavior, layout,
  spacing, fonts or component structure.

### 30.16 Explicit Drive reconnect handoff (v39)

- An explicit Drive tap is never consumed by a pending automatic
  `prompt:'none'` token request. CineLens lets that serialized request settle,
  then makes the one interactive request the user asked for when it failed.
- A successful explicit token request continues through the normal Drive
  restore, merge, sync and startup-unlock path in the same action.

### 30.17 Silent-auth choke point (v40)

- Every real promptless Drive token request consumes the same persisted
  debounce and cooldown budget, including cold startup and 401 recovery.
- A failed silent request blocks further automatic attempts across page loads;
  an explicit successful Drive reconnect clears that stored block.

### 30.18 Show episode-table narratives and adaptive AI tag floor (v41)

- Show story text may draw from grounded `ShortSummary` episode-table wikitext
  when the plain-text extract has no substantial episode narrative. Movie
  story construction remains extract-only.
- AI tagging keeps its evidence gate, but titles with genuinely short supplied
  narratives may verify with a smaller deterministic floor: 5 below 400
  characters, 6 below 800, 8 below 1500 and 10 for longer stories.

### 30.19 Taste-story variety (v42)

- Taste Story keeps its strongest positive and negative tags as fixed identity
  anchors, then uses weighted sampling without replacement to rotate additional
  tags from the same weighted taste cloud into each newly written story.
- Its profile hash is derived from the complete deterministic weighted cloud,
  before sampling, so automatic regeneration still occurs only when taste
  evidence changes. A forced refresh deliberately resamples its ingredients.
- Taste Story requests include a variation seed plus the previous story title
  and a rolling history of up to three titles. The current Apps Script may
  ignore these optional fields without affecting story generation.

### 30.20 Permanent candidate pool (v43)

- Unrated candidates are no longer evicted or excluded by a rolling-pool
  policy. Discovery retains every accepted candidate so future ratings can
  change its relevance without making it unavailable.
- Startup removes legacy rolling-pool exclusion data. The next normal Drive
  profile sync removes that retired field from the canonical library.
- The existing 40/20 strong-match hysteresis still controls collection pace;
  it no longer controls retention. The candidate library therefore grows
  gradually in IndexedDB, Drive and scoring by deliberate product choice.

### 30.21 MovieLens ratings import (v44)

- Library maintenance provides a CSV file-picker import for the exact MovieLens
  ratings header. It reads the personal `rating` column, supports quoted titles,
  and rounds half-star values up to CineLens's whole-star scale.
- Ratings match existing active or hidden records by TMDB ID first, then by
  canonical title with a one-year tolerance. Each import batches its immediate
  local persistence and Drive sync, while preserving normal rating timestamps.
- Unmatched titles persist as a resumable metadata queue. A single background
  worker respects the normal Wikipedia pacing and collection pause state,
  fetches Wikipedia identity plus TMDB data without AI, then lets the standard
  background tag queue fill tags later. Rejected titles remain as counted skip
  records, and a repeated import of the same file neither duplicates pending
  work nor overwrites already-imported records again.

### 30.22 Batched MovieLens reconciliation (v45)

- The full unresolved MovieLens set is durably staged immediately at import.
  Reconciliation then uses the same bounded three-at-a-time request pattern as
  pool collection, with serial state mutation and one local save plus Drive sync
  for each completed batch.
- While staged rows remain, the importer continues fetching the next batch
  without yielding to AI tagging. Once the queue is drained, normal background
  AI tagging takes over for the newly verified Wikipedia records.

### 30.23 Immediate MovieLens library staging (v46)

- Import writes every unmatched CSV row as a durable rated library record before
  any network reconciliation begins. Pending records stay out of normal card
  and recommendation rendering until Wikipedia metadata verifies them; rejected
  records remain stored with an explicit skip reason.
- Reconciliation now hydrates up to eight pending records concurrently per
  batch, then commits each batch through one local save and one Drive sync.

### 30.24 Continuous MovieLens reconciliation (v47)

- The selected CSV is read exactly once in full. CineLens parses and stages all
  usable ratings in the local library before metadata reconciliation starts.
- Reconciliation runs as one continuous bounded worker pool with up to sixteen
  metadata requests in flight. It has no artificial delay between groups and
  does not wait for an idle-browser callback when an import is explicitly
  started.
- Taste-model recomputation, rendering, local persistence scheduling and Drive
  sync scheduling happen once after the continuous pass instead of once per
  eight-title group. The initial staged-library write is scheduled immediately.

### 30.25 Background work must not hold the UI thread (v63)

Background collection, reconciliation and backfill are allowed to be slow. They
are not allowed to make the foreground stutter. No background or per-render
path may walk, re-score, re-serialize or re-sort the whole library to produce
something a bounded computation already answers.

- **Status text and control labels never re-score.** `updateLibraryHealth()`
  runs on every render and after every background batch. It uses the cheap
  `receptionBackfillPendingCount()` / `tmdbBackfillPendingCount()` counters for
  every displayed number, including the TMDB pause-button label. Building a
  sorted candidate list (`sortByBackfillPriority()`, which trains and scores
  the whole library through `scoreMovies()`) is reserved for the loops that
  actually consume that ordering.
- **Discovery scans use per-pass indexes.** A discovery pass may examine
  hundreds of candidate titles without yielding. Hidden-title and manual-removal
  exclusions are therefore resolved against `buildDiscoveryExclusionIndex()`
  sets built once per pass and handed to `discoveryCandidateDecision()` on the
  `existing` object, instead of re-scanning `state.hiddenTitles` and
  `state.wrongPicks` per candidate. The index must reproduce
  `recordMatchesDiscoveryCandidate()` exactly: page ID wins when both sides have
  one, with a title-key fallback that still applies when the stored record has
  no page ID. Callers that do not supply the indexes keep the direct scans.
- **The discovery ledger trim is amortized.** `DISCOVERY_LEDGER_CAP` is a
  storage bound, not a per-title invariant. The ledger is only sorted and cut
  once it drifts `DISCOVERY_LEDGER_TRIM_SLACK` past the cap, and only when a
  genuinely new key was added; re-noting an existing candidate cannot grow it.
- **MovieLens matching is indexed.** `buildMovieLensMatchIndex()` is built once
  per import and once per startup queue reconciliation, and passed to
  `movieLensLibraryMatch()`. It must return exactly what the previous linear
  scan returned: TMDB ID takes precedence, canonical title matching keeps the
  ±1 year tolerance, `includePending:false` skips staged pending records, and
  ties resolve to the first record in movies-then-hidden order.
- **The collection checkpoint is a scoped save.** Pool expansion's per-batch
  checkpoint persists the discovery cursor and the titles that batch touched.
  It is a scoped IndexedDB save, not a full one — the cursor rides in the
  profile payload, which every save compares regardless of scope. A full save
  (`JSON.stringify` of every stored title) must not run once per batch of
  candidates.
- **Scroll and resize work is frame-coalesced.** The scroll listener is passive
  and runs at most once per animation frame, because the infinite-scroll check
  reads `scrollHeight` and so forces a synchronous layout. Resize handling is
  coalesced the same way.
- **Repeated DOM writes are guarded by value.** The fetch progress strip, the
  card-size custom property and section visibility only write when the value
  actually changes. `classList.add` of a token already present still rewrites
  the class attribute, so it is guarded too. A progress tick that changes
  nothing must produce no DOM mutation.

### 30.26 Non-intrusive maintenance and fair retries (v64)

Background refresh, synchronization and tagging must remain informative without
disturbing the foreground workspace.

- The shared activity indicator is a compact fixed overlay. Showing, updating
  or hiding it must not add document height, move the sticky control deck,
  change the user's scroll position or reflow the card grid.
- Reception, TMDB, MovieLens and background AI maintenance batches update their
  compact status and persist their changed records without calling the global
  `render()` merely because one batch completed. User navigation and deliberate
  foreground edits continue to render normally.
- Background record checkpoints remain local and interruption-safe, while
  card-grid refreshes accumulate until a meaningful batch boundary and Drive
  uploads use a longer shared debounce so adjacent batches converge into one
  sync. Foreground actions that change taste data, such as rating, re-rating,
  tag removal or re-tagging one title, refresh recommendations immediately.
  Search, filtering, sorting and navigation update the visible view immediately
  but do not invalidate or recompute the recommendation model.
- Failed AI-tag titles use escalating retry cooldowns and oldest-attempt-first
  rotation in both automatic and maintenance retry queues. Never-attempted and
  older eligible titles therefore get a turn before a recent persistent
  failure. A batch-level failure increments the same persisted failure count;
  repeatedly reopening the app must not reset a bad title to the head of the
  queue.

### 30.27 Continuous background activity session (v65)

- The activity surface is a slim full-width bar fixed to the bottom viewport
  edge, never a floating corner card and never part of document flow.
- It is absent while idle. During a continuing background queue it remains
  steadily visible across the short scheduled gaps between batches; the next
  batch cancels the pending dismissal instead of flashing a new bar.
- When a queue actually drains, the bar dismisses immediately. Foreground
  operations retain their normal immediate completion dismissal.
- Background AI failures update retry metadata but do not trigger a card-grid
  render. Successful recommendation-affecting changes accumulate toward the
  shared card refresh batch, with one final refresh when that queue drains.

### 30.28 MovieLens importer retirement (v65)

The MovieLens CSV import was a one-time migration and is no longer a product
workflow. Library maintenance does not show a ratings-import control, startup
and foreground recovery do not schedule MovieLens reconciliation, and the
maintenance status line does not report an import queue. Ratings already
imported remain ordinary CineLens ratings and are not removed. As of v69, the
retired parser, matcher, importer and reconciliation implementation is also
removed from the shipped JavaScript; only the resulting ordinary title records
remain.

### 30.29 Release asset cache busting (v66)

Every shipped version bump must update the `styles.css?v=N` and `app.js?v=N`
references in `index.html` to the same integer as `APP_VERSION`. Reusing an old
asset query can leave an open browser tab running a stale activity surface even
after GitHub Pages has deployed the new files.

### 30.30 Persisted retry demotion and per-title deadlines (v67)

- AI partial/insufficient-tag failures must call `touchRecord()` after updating
  `aiTagging.failCount` and `aiTagging.attemptedAt`. Retry history therefore
  wins record-level Drive convergence and survives reloads and other devices.
- Automatic AI and metadata queues order never-attempted titles before
  previously attempted titles, then order attempted titles oldest-first.
- TMDB no-match, unchanged stale metadata and thrown/timeout outcomes increment
  a persisted `tmdbBackfillFailCount` and stamp
  `posterBackfillAttemptedAt`. Cooldowns escalate from six hours to one day,
  three days and fourteen days.
- One complete TMDB title refresh has a hard 25-second deadline across search
  and details work. Timeout aborts the active request, releases the progress
  surface in `finally`, persists the failure, and moves on to another title.

### 30.31 Title detail modal (v68)

Clicking or keyboard-activating a title card opens its complete details in a
viewport modal instead of expanding the card inside the grid. Opening details
must not resize, reorder or reflow surrounding cards.

- The modal uses a dimmed backdrop, locks page scrolling and keeps the full
  poster, match explanation, rating, genres, tags, availability and actions.
- It closes through its close button, backdrop click or Escape.
- Rating and other foreground renders refresh the open modal from the newly
  rendered source card; removing the open title closes the modal.
- Card-internal controls remain directly actionable and do not open a second
  modal. Cards are keyboard-focusable and Enter or Space opens details.

### 30.32 Lean runtime cleanup (v69)

- The retired MovieLens import implementation is deleted rather than merely
  disconnected from startup.
- The former in-grid card expansion state, observer and reapply paths are
  deleted. The title modal is the only detail surface and uses ordinary card
  markup inside a fixed viewport overlay.
- Obsolete expansion-only CSS is deleted. Grid cards no longer carry layout
  rules for a feature that cannot run.
- A Drive sync stops being marked as deferred as soon as its bounded wait ends
  and the sync begins.
- Existing IndexedDB and Drive migration readers remain intentionally: removing
  them would strand valid libraries created by earlier shipped versions and is
  not considered safe code reduction.

### 30.33 Zero-reflow background maintenance (v70)

- Automatic collection, reception refresh, TMDB refresh, AI tagging, tag-cloud
  normalization and Drive upload must not call the global renderer or retrain
  recommendation data.
- Background writes persist changed records and may update the fixed activity
  and Library status surfaces only. They mark derived recommendation data stale;
  the next deliberate foreground render incorporates those changes.
- Maintenance ordering may reuse the last computed recommendation scores, but
  must not score the whole library merely to choose the next background batch.
- Automatic Drive uploads do not rebuild the tag brain, recompute weights,
  refresh header statistics or rebuild card grids. Explicit Drive connection
  and manual synchronization may refresh the foreground after convergence.
- Manual collection/tagging and direct title actions remain foreground
  operations and refresh their visible result normally.

### 30.34 Fast manual AI-tag refresh (v71)

- The explicit **Retry pending AI tags** action resolves title narrative data
  in bounded concurrent groups instead of awaiting one Wikipedia title at a
  time; v74 supersedes the original group size with 30.
- Narrative-only resolution must pass `tmdb:false`; poster, provider and TMDB
  metadata maintenance is independent and must not delay AI-tag repair.
- Manual Gemini requests accept up to ten titles per batch. As of v74 they use
  a controlled 1.2-second request interval and one continuation pass; automatic
  background tagging retains its smaller, more conservative batch and pacing.
- A failed or blank multi-title response retains the per-title isolation
  fallback so one problematic title cannot strand the rest of the queue.
- Each completed batch is saved as a scoped IndexedDB checkpoint without
  rendering. Tag-brain rebuilding, recommendation-weight computation and the
  foreground render happen once after the requested run completes.

### 30.35 Imported-rating identity convergence (v72)

- TMDB media type plus TMDB ID is a first-class title identity alongside
  Wikipedia page ID and canonical title/year/format.
- When an older imported record and a newer Wikipedia record identify the same
  title, duplicate collapse retains the richer Wikipedia record and transfers
  the newest explicit rating state, including its `ratedAt` timestamp.
- Chunked Drive restore must collapse cross-ID duplicates after applying the
  personal-rating profile and before rendering. The corrected catalogue/profile
  is queued back to Drive so the obsolete imported ID does not return on the
  next session.
- Background Drive convergence applies the same collapse and schedules one
  follow-up sync when remote chunks reintroduce a duplicate identity.

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

- New Wikipedia fetches request `pageimages` thumbnail/name data in the existing
  API call using `piprop=thumbnail|name` and `pithumbsize=500`.
- Cards use native lazy loading and asynchronous image decoding.
- Existing titles are not bulk-refetched merely to obtain images; they gain
  thumbnails when naturally re-tagged or refreshed. The bounded reception
  backfill pass also refreshes missing thumbnails while it is already touching
  records for current quality/reception data.

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

## 22. Removed Hidden Title Feature

The old Hide/Hidden library workflow is no longer part of the product. Cards no
longer expose a hide action, the Hidden navigation tab is gone, and tag detail
filters no longer include a Hidden bucket.

- Existing `state.hiddenTitles` records from older local or Drive profiles are
  restored into the active movie library during load/merge/restore.
- Restored records keep their rating, watchlist state, tags, thumbnail and other
  title metadata intact.
- After migration, `state.hiddenTitles` is empty so the old hidden state does
  not continue syncing forward.
- Permanent remove remains available and continues to create synchronized
  removal tombstones.
- Wrong-pick tombstones still suppress known bad matches; this is not user hide.
- Reset All clears any legacy hidden records as part of the complete app reset.

### 22.1 Hidden Removal Acceptance Test

The browser smoke test must verify:

- No Hidden tab, Hidden filter or card hide action is rendered.
- A legacy hidden title is restored into `state.movies` on load.
- A restored rated hidden title keeps its rating.
- The restored hidden map is empty after migration.
- Permanent remove still creates the expected removal tombstone.

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


### 30.12 Continuous recommendation collection and quiet orchestration

CineLens continuously improves its unseen recommendations while the browser is
idle.

- A strong candidate is one whose displayed match score is at least 95%.
- Background collection does not stop at a recommendation-count target. It
  schedules another bounded collection run whenever the app is idle, unless
  the user explicitly pauses collection or a safety/availability gate blocks
  writes.
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

### 30.13.1 Current filter and sort controls (v62)

The Genre filter remains the existing, properly sized native dropdown. It is a
multi-select (`size=1`), with no custom checkbox panel or popover. A compact
adjacent dropdown chooses the matching rule.

Selected genres support either Any (OR) or All (AND) matching. Rating choices
are thresholds: `N stars and above`, alongside All ratings and Unrated.

The sort selector chooses Best match, Your rating, Release year, Last rated,
Added to CineLens, Title, or Surprise me. Its adjacent direction button controls
ascending versus descending order for the applicable sort field; Surprise me
keeps its stable order until explicitly shuffled again.

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

## 31. Nitin-authored features (v11–v14) — cards, similar titles, palette engine

These were implemented directly by Nitin and shipped as v11-v16. Documented here
so the bible stays current; they are live at `APP_VERSION = 16`.

### 31.1 Card Google search link (v11)

Every title card exposes a Google web-search link for the title.
`googleSearchUrlForMovie(movie)` builds a `https://www.google.com/search?q=…`
query from the title (with year/type context) so the user can look the title up
on the open web. This is a plain outbound link — it does not scrape or import
anything and does not affect tags, scoring or collection.

### 31.2 Similar titles (v12)

From a title card the user can open a "similar to X" view rendered in the main
grid.

- `showSimilarTitles(id)` sets `similarTitleSourceId`; `render()` routes to
  `renderSimilarTitles()` while that source is active; `clearSimilarTitles()`
  exits back to the normal view.
- Similarity is computed locally from a `similarFingerprint(movie)` (its tags ∪
  genres) using Jaccard overlap `shared / union`, plus small bonuses for matched
  tags (`+0.08` each) and matched genres (`+0.04` each), sorted by similarity
  then recency then title.
- Results reuse the shared `buildCard` component; each card's match score/taste
  fit is set to its similarity so the bar reflects closeness to the source.
- This is a view mode (like search): it is transient local state, not synced,
  and it does not change ratings, tags or the recommendation model.

### 31.3 Random palette / theme engine (v13-v16)

A `Random palette` button in the control deck generates a fresh random color
theme for the whole app; the chosen palette persists in `state.settings.palette`
and is re-applied on load via `applyPalette()` (which writes CSS custom
properties onto the document root).

As of v16 the palette engine is seed-first and readable by construction.
`buildRandomPalette()` starts from the generated seed hue/saturation/lightness,
including near-grey seeds, then adjusts derived surfaces and text only as much
as needed to pass contrast. It chooses one light/dark polarity for the whole
theme, derives page/header/control/card/chip surfaces from the seed family,
snaps every text token to a passing WCAG contrast ratio against the exact
surfaces it renders on, validates the full matrix, and retries before falling
back to the known-good default dark theme. Normal text, muted text, card text,
card muted text and tag/chip/source-link label text must clear 4.5:1; large/UI
accent fills and visible borders must clear 3:1 where they are used. The page
gradient is deliberately subtle: generated stop lightness spread is bounded to
8 L points, while cards remain opaque solid surfaces so gradient bleed cannot
undermine card text contrast.

- `buildRandomPalette()` seeds from a random hex (`randomHexSeed`), keeps the
  seed hue/saturation/lightness as the first palette authority, and derives a
  coherent set of surface/background/text variables.
- Full color math is included: `hexToRgb`/`rgbToHsl`/`hslToRgb`/`rgbToHex`/
  `hslToHex`, plus WCAG-style `paletteLuminance` and `paletteContrast`.
- **Readability is enforced** (v14): `readableTextForHsl` chooses dark vs light
  body text by measured contrast against the background; `mutedTextFor` and
  `secondaryMutedTextFor` derive readable muted tones; `randomizedBackground`
  builds multi-stop random gradient backgrounds per tone/role.
- **Supersedes the earlier fixed-theme rule.** Section 28.6 (black/neutral
  dark-grey surfaces only, yellow accent) described the previous static look.
  The palette engine deliberately allows randomized colored themes and
  backgrounds, so 28.6 no longer constrains the app; the palette's contrast
  checks keep text readable across generated themes.
- The palette is local view/appearance state; it persists locally with other
  settings and does not, by itself, force a Drive sync (consistent with the v9
  sync-discipline rule that view/appearance changes are local).

### 31.4 Image-forward shared cards and type-aware chips (v16)

All title cards are poster-first. `buildCard()` renders a front poster face with
the thumbnail or generated fallback art, type/year metadata and the current
match percentage. Desktop hover and touch tap reveal the back face with rating,
genres, tags, source links and permanent remove/retag actions. Cards no longer
include a hide action.

Film/show tag chips use palette variables rather than hardcoded fixed colors.
The palette validator checks both film and show chip text/background pairs so
random themes keep the two card types distinct without sacrificing readability.

### 31.5 Seamless foreground actions and scoped Drive writes (v73)

Foreground actions must feel immediate. Rating or unrating a title updates the
visible card/modal in the current frame; it must not synchronously collapse the
whole library, recalibrate reception models, recompute tag weights, or rebuild
every card grid. Recommendation derivation is invalidated and coalesced for an
idle period after the browser has had an opportunity to paint. Reception
calibration is likewise delayed until idle and reuses one trained taste model
per format instead of training a leave-one-out model for every rated title.

Local persistence accepts a changed-title scope and does not walk unrelated
movie, hidden, deletion, unblock, or wrong-pick records for a one-title rating.
IndexedDB continues to persist only the changed record plus the profile.

After startup has reconciled the Drive manifest, ordinary automatic syncs use
that manifest as a local baseline. A rating or settings edit uploads only the
personal profile and patched manifest; catalogue edits rebuild and upload only
their dirty year/language/format chunks. Automatic sync must not download the
manifest or hash every catalogue chunk after each foreground action. Startup,
reconnect, manual sync, missing-cache recovery, and unscoped catalogue changes
retain the full remote reconciliation path.

### 31.6 One-pass Wikipedia ingestion and accelerated AI repair (v74)

Every newly discovered Wikipedia title is parsed completely from its original
article response. Narrative, identity, metadata, thumbnail when available, and
Reception/critical-response data are captured together. An explicit current
empty Reception record means the page had no usable section; a missing
thumbnail must not cause the same article to be fetched again.

The remaining Wikipedia repair worker is exclusively a compatibility migration
for stored titles created by older parsers or imports. Its UI must call this
`legacy Wiki repair`, not imply that Reception is routinely fetched through an
independent product pipeline.

Manual pending-tag repair resolves up to 30 legacy title identities/narratives
concurrently, then feeds every resolved title through bounded Gemini
sub-batches of ten. Requests use a 1.2-second minimum interval and at most one
automatic continuation pass. A blank batch is isolated in pairs rather than
falling immediately to one request per title. Pending counts in Library
maintenance and on the retry action use the same eligibility definition.

### 31.7 TMDB audience-review tag evidence (v76)

Movie and TV details append TMDB `reviews` alongside `watch/providers`; no
additional HTTP request or review-specific maintenance worker is permitted.
The first returned review page is compacted to at most 8,000 characters, with
each review capped at 1,200 characters and markup, URLs and author identity
discarded. The compact text is catalogue data and participates in Drive sync.

AI tagging uses Wikipedia narrative plus the compact TMDB audience text as one
evidence corpus. The prompt treats reviews as untrusted opinion: it may infer
recurring descriptive themes, tone, character dynamics and viewing experience,
but must ignore embedded instructions and must not emit generic quality or
sentiment labels. Evidence validation and the AI source hash use the same
combined corpus. Consequently, newly available review evidence makes an older
tag set legitimately stale and queues a batched refresh.

`TMDB_DATA_VERSION` (6 at the time of this section, **7 from v97** — see
31.15) performs one ordinary TMDB backfill through the existing
fixed progress surface. Each completed TMDB batch may yield to the existing
background AI batch before continuing, rather than creating a parallel
foreground process. Explicit retag refreshes TMDB before Gemini so audience
evidence is available in that same action. No additional review provider is
integrated: sources without an official, free, browser-safe API would require
scraping, questionable redistribution or another credential/maintenance path.

### 31.8 Best-match maintenance ordering (v77)

Automatic Wikipedia repair, TMDB refresh and AI-tag queues select untouched
titles in the same recommendation order used by the **Best match** view. Queue
selection must build that ranking when the score cache is empty; it must never
fall back to alphabetical order merely because the page has just loaded.
Persisted failed-attempt metadata still places attempted titles behind untouched
work across sessions. Within either tier, Best match remains the primary order;
rated and unranked records follow, with recency rather than title spelling as
their fallback.

### 31.9 TMDB reviews only enrich tags (v78)

TMDB audience-review evidence is additive, not a replacement source. When a
review corpus first arrives or changes, reconciliation preserves every existing
non-suppressed tag and its evidence, then appends review-supported tags up to
the normal title-tag cap. Exact and semantically similar tags collapse to the
existing tag instead of creating duplicates. A changed review hash must never
be interpreted as a changed Wikipedia narrative or erase prior tags. Genuine
Wikipedia narrative replacement retains its separate obsolete-tag replacement
behaviour.

Per-title refresh is a two-stage fan-out/fan-in pipeline. Wikipedia and TMDB
requests start concurrently because neither depends on the other. Their results
are consolidated into one in-memory title snapshot, then AI tagging runs
against that completed snapshot because it depends on both sources. The action
performs one final save, Drive-sync enqueue and render; individual source
responses must not produce intermediate commits or UI refreshes.

Background maintenance uses the same dependency graph across batches rather
than a single global worker lock. A title becomes Gemini-eligible only after
its required Wikipedia and TMDB stages are current (or a failed source has
entered its persisted cooldown). While Gemini processes that ready batch,
Wikipedia and TMDB workers may fetch different pending titles concurrently;
neither worker pauses merely because another source is awaiting a network
response. Pool expansion remains exclusive because it already fans out through
both source systems. Background persistence remains incremental and debounced,
and Drive sync waits for a consolidated checkpoint. The fixed progress surface
shows the currently active source stages together instead of competing
per-worker bars.

### 31.10 Rated-tab bounded rendering (v79)

The Rated tab must not synchronously construct the entire rating history.
It renders 40 newest-rated cards initially and adds 40 more near the bottom of
the page. Leaving and re-entering Rated resets the window to 40. The section
count reports `showing N of total`.

Rated cards do not calculate leave-one-out predicted-match models: the user has
already supplied the title's actual rating, and calculating a prediction there
adds no decision value. This removes both the large live-DOM cost and the
per-card whole-library model multiplier. Rating interactions keep their
incremental IndexedDB write and deferred recommendation refresh.

The same 40-card incremental window applies to Recently Added, which can be
larger than Rated. Already-rated cards in that mixed view also skip prediction;
unrated cards retain it because match guidance remains useful there. Pool and
tag-detail views retain their existing bounded windows.

Ordinary renders only write section `display` styles when the value actually
changes. Background Gemini checkpoints pass their exact changed-title IDs to
local persistence, so a batch neither scans every record for sync metadata nor
marks every Drive catalogue chunk dirty. Together these rules keep foreground
clicks independent of ongoing metadata and AI maintenance. All movie cards use
browser rendering containment (`content-visibility:auto` with an intrinsic-size
placeholder), so off-screen cards in every incremental grid avoid unnecessary
layout and paint work.

### 31.11 Representation tags inside the existing pipeline (v83)

Representation tagging is an additive part of the established per-title AI
pipeline, not a library migration. It introduces no tag-version freshness
gate, no startup audit, no whole-library queue, and no automatic refresh.

Newly discovered titles and titles already entering the normal refresh pipeline
may add `black-representation`, `lgbtq-representation`, `feminist-themes`, or
`diversity-inclusion-themes` when the combined Wikipedia and TMDB audience
evidence explicitly supports them. Existing tags remain intact and equivalent
or duplicate tags consolidate normally. A direct user-requested retag may also
add a missing supported representation tag.

These are neutral descriptive recommendation signals. `political-agenda` and
`preachy-social-message` still require explicit evidence of agenda, propaganda,
culture-war, didactic, or message-driven framing. Representation must not be
inferred from names, posters, performers, casting alone, or merely the presence
of a woman or minority character.

### 31.12 Tags-only recovery after the v80 migration fault (v84)

On the first connected startup after this release, CineLens reads its preserved
legacy monolithic Drive backup once and restores only missing tag data for an
exact matching title ID. A set is accepted only when it was produced by the
current AI prompt, its stored source hash still matches the title's current
Wikipedia-plus-TMDB evidence, and its evidence remains grounded.

Recovery never replaces a non-empty current tag set and never imports ratings,
watch state, exclusions, removals, metadata, titles, or other personal state.
Restored tag fields are written through the normal chunked Drive pipeline, and
a profile marker prevents the recovery pass from repeating.

### 31.13 Quota-safe Gemini backlog processing (v85)

The preserved-backup recovery pass gets first access to missing-tag records;
background Gemini tagging cannot start until that pass has completed or been
attempted. This prevents recoverable records from consuming AI quota.

All Gemini features reserve requests through one shared start-time lane, so
independent pipelines cannot wake together and burst the endpoint. Automatic
tagging uses eight-title batches spaced by at least 20 seconds, reducing request
count while increasing recovered titles per request.

A rate-limit response creates a shared persisted cooldown with bounded
escalation. It does not increment per-title failure counts, move titles through
the retry queue, pause unrelated maintenance sources, or immediately retry.
The unobtrusive health line reports the cooldown and processing resumes
automatically when it expires.

### 31.14 Exact pre-v80 recovery from Drive revisions (v86)

The v80 fault incorrectly made representation-audit freshness part of general
tag validity. Startup cleanup consequently cleared pre-existing tag sets and
the normal Drive sync persisted those empty catalogue records. The reduced For
You result count is the number of currently tagged unseen candidates with
positive learned overlap, not a new display limit.

Recovery version 2 first checks the preserved monolithic backup, then inspects
up to ten prior revisions of every affected chunked catalogue file with three
bounded readers. It selects nothing by title text or approximate identity:
only the exact current record ID is eligible. It restores a tag only when the
old set used the current AI prompt, its story hash matches the current combined
source evidence, and that tag's stored evidence is still grounded in the
current source.

Current non-empty tag sets, ratings, exclusions, removals, watch state,
metadata, and all other fields are never replaced. Recovered chunks sync
through the normal current writer. Gemini waits until revision recovery has
finished or been attempted, then processes only records that could not be
safely restored.

### 31.15 Pipeline rebuild and TMDB identity integrity (v91–v104)

This section supersedes earlier statements about TMDB title matching, the TMDB
data version, and the treatment of tag sets below ten usable tags.

**Parallel pipeline (v91).** Every upstream was previously paced by a fixed
inter-request sleep against a shared timestamp, and Gemini additionally by a
process-wide promise chain — ceilings of roughly 70, 200 and 5 requests per
minute that came from no real quota. Collection, background tagging and both
backfills also refused to run concurrently, so approximately one request was in
flight application-wide. Each upstream now has an `AdaptiveLimiter`: a token
bucket for average rate, a bounded worker pool for concurrency, and AIMD that
halves on `429` and grows on sustained success, so each lane converges on what
the upstream actually accepts. Collection dispatches tag batches instead of
awaiting them, Gemini batches carry twenty titles (the Apps Script `MAX_ITEMS`)
with several in flight, and `aiTaggingInFlightIds` stops two producers claiming
the same title. Drive chunk uploads run concurrently.

**Source-text shedding (v94).** Titles are never evicted: a title dropped today
may match well after a later tagger change. Instead, once a title holds a
verified tag set, `storyText` and `tmdbReviewText` — which exist only to feed
the tagger — are shed above a size threshold, taking a record from roughly
10–18KB to about 2KB. Rated, manually added, watchlisted, hidden and underfilled
titles never shed. `sourceShed` marks the absence as deliberate:
`hasCurrentAiTags` skips the story-hash comparison for such a record (while
still enforcing the prompt version), and `tagEvidenceOk` returns true for it,
because re-validating tags against text the record no longer holds would delete
grounded tags on the next load.

**TMDB matching and identity (v97, v98, v104).** `tmdbSearchCandidate`
previously fell back to the most *popular* result in the year window when
nothing matched exactly, which silently attached another film's poster, id,
genres, reception and review text — and review text feeds the tagger, so
mismatched titles were tagged from the wrong film's audience reviews. A
candidate must now clear a Dice-coefficient similarity floor
(`TMDB_TITLE_MATCH_MIN = 0.6`) against the localised or original title; below it
the search returns nothing, because no poster is better than a wrong one.

Since discovery is TMDB-first, most records already hold an authoritative id.
`fetchTmdbDataForMovie` resolves by id through `fetchTmdbDetailsById` whenever
the record carries a *verified* id, and title search exists only to establish an
id for a record that has none. An id is verified when it came from discovery or
from an exact title match; a fuzzy match is deliberately not verified so it
stays re-checkable.

Records now store `tmdbTitle` and `tmdbYear` — the identity of what TMDB
actually returned. Without them a wrong pairing was undetectable, since nothing
stored disagreed. `tmdbIdentityMismatch` proves a mismatch from that stored
identity; `clearTmdbIdentity` strips every TMDB-derived field (id, media type,
poster, availability, review text and count, and the TMDB contribution to
`reception`) while preserving Wikipedia identity, story text, tags, rating and
user state, then resets `tmdbDataVersion` so the ordinary backfill re-resolves
the title. `repairMismatchedTmdbIdentities` runs this at startup and never
deletes a title. Legacy records that hold an id but no `tmdbTitle` are
unverifiable rather than wrong: `retireUnverifiableTmdbIdentities` drops only
their verified flag so they are re-resolved once through the similarity floor,
after which they are self-checking. A verified id is only trusted when
`tmdbTitle` is present and still agrees, so stickiness cannot protect a wrong
id.

Two further paths could fuse two films into one record and are now closed:

- `applyFreshWikiMovie` deliberately preserves the previous record's TMDB
  payload, and the retag path refreshes Wikipedia with `{tmdb:false}`. That is
  correct only while the refresh stays on the same title; when it landed on a
  different article the record adopted the new Wikipedia identity and kept the
  old film's poster and id. The payload is now carried over only when the
  identity still agrees, and is otherwise dropped for re-resolution.
- `movieIdentityKeys` includes a `tmdb:<type>:<id>` key, and `sameMovieIdentity`
  matched on any single key, so one wrong id merged two different films through
  `collapseDuplicateMovies` and through `findExistingMovieByIdentity` on every
  upsert. A shared Wikipedia page id or title+year+format key remains
  authoritative; a shared TMDB id alone now additionally requires the titles to
  be compatible.

`TMDB_DATA_VERSION` is **7**.

**Non-narrative formats (v96, v97, v102).** Titles without a story are excluded
entirely, since CineLens recommends on story tags and such formats have nothing
to tag. TMDB genre ids are the primary, wording-independent signal: discovery
sends `without_genres` for Reality/Talk/News, `tmdbDetailsWithAvailability`
reports the verdict (`TMDB_GENRE_MAP` drops those ids, so it would otherwise be
lost), and it is stored as a sticky `movie.nonNarrative`. A text pattern is the
fallback, covering reality, competition, talent, game, quiz, panel, talk, chat,
variety, sketch, magazine, news, current-affairs, documentary-series, awards,
telethon, wrestling and sports formats, plus stand-up specials and concert films
for cinema. It is matched only against the *declarative head* of the lead
sentence — cut at `about`, `set in`, `follows`, `which`, `starring` and similar
— so a scripted drama about a talk show host is not excluded. Already-stored
titles are purged at startup through `excludeStoredTitles`.

**Genres as tags (v92, v93, v95).** Genres participate in the tag preference
system, stored in `settings.tagPreferences` under a `genre:` prefix so Drive
merge and settings sync are unchanged and a genre can never collide with a story
tag of the same name. Preferences have three distinct states: key absent (no
opinion — the learned weight applies in full), key present with `0` (explicitly
neutral — the learned weight is suppressed), and key present with ±N (a stated
bias). Before v93 the first two collapsed together, so "Neutral" did nothing but
clear. A bare genre name is no longer a valid story tag (`isMetaTag` rejects the
canonical genre vocabulary), because the same signal was otherwise counted twice
— once through `tagEffects` and again through `genreEffects`.

**Format balance (v100, v101, v102).** `predictTasteFit` sums over tags, so a
title carrying more tags accumulates more and outranks a better-matched shorter
one on volume — document-length bias. `tagMassLengthFactor` applies BM25-style
pivoted length normalisation, `1 / ((1 - b) + b * mass / pivot)`, where mass is
total tag *feature value*, pivot is the median mass across rated titles (stored
per model, so it tracks the library), and `b = 0.75`. It is applied identically
in training and scoring so the calibration fit stays consistent. Separately,
`FORMAT_PREFERENCE_OPTIONS` exposes a *stated* format preference in the filter
bar, scaling a title's distance from the model baseline rather than its whole
score; it is excluded from `tasteOnly` callers so reception calibration does not
read a deliberate preference as model error.

### 31.16 The ten-usable-tag floor (v103, v104)

The intended condition is that a completed title carries at least ten *usable*
tags. Two defects prevented that.

First, the floor counted tags as returned, while cards and scoring use
`recommendationScoringTags` — the same list after `tagIsPresentable` removes
bare generic words and any tag appearing in more than ten per cent of the
library. Only the commit-time gates ran when the set was accepted, so a title
could legitimately commit ten tags and display six. `usableTagCount` now
measures the floor, the retry threshold, the continuation shortfall requested
from Gemini, and `aiTagSetAlreadyStable`. Gemini is asked for
`AI_TAG_MIN_COUNT + AI_TAG_USABLE_HEADROOM` (15–24) rather than 10–24, because
some of every response is filtered out and without headroom the first pass would
fall short on most titles and force a retry every time.

Second, a best-effort commit was indistinguishable from a full one. Both wrote
`status: 'verified'`, `hasCurrentAiTags` returned true, and the title left the
tagging pipeline permanently at as few as six tags. The set is still committed —
leaving it `building` re-queues it forever — but `aiTagging` now records
`usableTagCount`, `underfilled` and `topUpAttempts`. `needsTagTopUp` returns
those records to `pendingBackgroundAiMovies` and `aiTagCandidates` behind
genuinely untagged work, on an `AI_TAG_TOPUP_COOLDOWN_MS` backoff and bounded by
`AI_TAG_TOPUP_ATTEMPT_LIMIT`. A top-up seeds the request partial with the tags
already held, so it extends the committed set rather than trading a good tag for
a new one. `sourceTextShedEligible` refuses to shed an underfilled title,
because shedding would remove the very text needed to top it up.

The best-effort escape still measures the **raw** count. A title whose tags are
individually fine but mostly too common could never reach ten usable ones, and
gating the escape on the usable count would leave it retrying forever. Only a
title returning fewer than `AI_TAG_BESTEFFORT_MIN` raw tags remains uncommitted.

This raises the count at commit time; it cannot pin it there. `tagTooCommon` is a
share of the library, so a tag counted as usable today can cross the threshold as
the library grows and stop being displayed later, and such a title becomes
eligible for a bounded top-up rather than silently degrading.

### 31.17 Gemini quota-aware scheduling (v105)

The Gemini project allowance is 15 requests per minute, 250,000 tokens per
minute and 500 requests per day. This supersedes the v91 Gemini throughput
assumption of 45 requests per minute and twenty-title client batches.

All browser-originated Gemini work, including title tagging, tag-cloud
normalization and the generated taste story, now enters the same limiter. It
admits one request start every four seconds, permits at most four slow requests
to overlap, and does not use an initial burst. Title-tag payloads contain at
most two titles so worst-case 14,000-character story inputs plus structured
tag evidence retain headroom beneath the token-per-minute allowance.

The limiter also records request starts in local storage and stops after 500 in
a rolling 24-hour window, surviving reloads. This is a client-side safety guard;
Gemini remains authoritative for quota shared by another browser or device,
and its rate-limit response continues to activate the existing adaptive
cooldown without discarding pending titles.
