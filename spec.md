# CineLens Specification

## 1. Product Summary

CineLens is a single-file browser app that builds a personal movie/show recommendation engine from verified Wikipedia pages.

The app now uses a **contrastive descriptor brain**:

```text
Wikipedia plot/premise/synopsis/story text
→ raw descriptor candidates from the actual page wording
→ cross-title rarity scoring across the saved pool
→ per-title descriptor set
→ user rating weights
→ recommendations
```

The app must never invent tags. It must never add seed tags, fallback tags, title-specific tags or minimum-count padding. The recommendation brain must grow from text evidence and user ratings only.

## 2. Packaging

The app is currently implemented as one self-contained HTML file:

```text
index.html
```

The app contains:

- HTML layout
- CSS styling
- JavaScript app logic
- Wikipedia API integration
- TMDB availability lookup
- Google Drive sync
- Local storage persistence

## 3. Core Requirements

### 3.1 Content Scope

Supported content:

- Hindi movies
- English movies
- Hindi shows / series / miniseries
- English shows / series / miniseries

Rejected/skipped content:

- Person pages
- Actor/director pages
- Franchise pages
- Film-series pages
- Soundtrack pages
- Category/list/template pages
- Pages without a usable plot, synopsis, premise, story or series overview section
- Pages outside Hindi/English scope

### 3.2 Wikipedia Source Rule

Wikipedia is the only title/story source.

The app should fetch real pages from Wikipedia category/list navigation and manual Wikipedia URLs. It should not depend on seed movies or manually written title packs.

The current implementation keeps the old expansion arrays present as empty arrays only for compatibility:

```js
EXPANSION_ENGLISH = []
EXPANSION_HINDI = []
EXPANSION_SHOWS = []
SEED = []
SEED_TAGS = {}
```

These must remain empty unless a future design deliberately reintroduces non-Wikipedia data. Reintroducing hardcoded seed titles or seed tags violates this spec.

## 4. Wikipedia Identity and Retagging

### 4.1 Page Identity

Every successful Wikipedia fetch must store:

```js
wikiPageId
wikiTitle
pageTitle
wikiUrl
wikiVerified
storyText
leadText
```

`wikiPageId` is the trusted identifier. Page title fallback is legacy support only.

### 4.2 Retagging Priority

Retagging must use this order:

1. Fetch by `wikiPageId`.
2. Use title fallback only when page ID is unavailable.
3. Verify that fallback title matches the existing title.
4. If retagging fails, preserve existing descriptors and ratings.
5. Mark failed items with `retagStatus = 'failed'` and a useful `retagMessage`.

Retagging must never wipe good data because a fetch produced weak descriptors.

## 5. Story Section Extraction

Descriptors must be extracted only from plot-like sections:

- `Plot`
- `Synopsis`
- `Premise`
- `Story`
- `Plot summary`
- `Series overview`

Intro/lead text may help identify title, year, language, country and format, but it must not drive descriptors.

The app must not use these sections for descriptors:

- Cast
- Production
- Reception
- Box office
- Awards
- Marketing
- Music
- Release
- Legacy

## 6. Contrastive Descriptor Brain

### 6.1 Principle

A descriptor should answer:

```text
What makes this title different from most other titles in the current pool?
```

The app must not start from a fixed vocabulary like `time travel`, `royal politics`, `revenge driven` or similar. It must extract candidate phrases from the page text itself.

### 6.2 Raw Candidates

The app extracts 2–5 word phrases from the title’s `storyText`.

Candidate phrases are normalized to lower-case phrase form, not hyphen tags:

```text
time machine
sent back to 1955
parents from falling
wrongful imprisonment
serial murder investigation
```

The engine removes filler words using stopword and weak-word filters. These filters are allowed because they are hygiene filters, not recommendation tags.

### 6.3 Cross-Title Contrast

Each raw phrase receives a score based on:

```text
local phrase quality
× rarity across the saved pool
× position weight inside the story text
```

A phrase appearing in many titles becomes weaker. A phrase that is specific to one or a small number of titles becomes stronger.

For small pools, commonness penalty is softened so the first fetched titles can still receive descriptors.

### 6.4 Stored Descriptor Fields

Each movie/show stores:

```js
rawDescriptors     // high-volume extracted candidates from the page text
descriptorTags     // selected contrastive descriptors used by the brain
tags               // same as descriptorTags for UI compatibility
coreTags           // same as descriptorTags for scoring compatibility
plotTags           // same as descriptorTags for audit compatibility
tagged             // true when descriptorTags exists
```

The old names remain for compatibility with existing UI functions. Conceptually, the brain now uses descriptors, not old-style tags.

### 6.5 Metadata Separation

Metadata must not be used as taste signal.

These may be displayed as identity/filter information:

- language
- country
- decade
- format
- year

These must not count as descriptors or scoring tags.

## 7. Removed Systems

The following systems are removed from active logic:

- Seed movies
- Seed tags
- Fallback tags
- Title-specific curated tags
- Minimum tag count
- Generic narrative padding
- Hardcoded title packs for discovery

Old constants may remain empty for compatibility, but they must not contain active data.

## 8. Recommendation Scoring

### 8.1 Rating Weights

Ratings map to descriptor weight as:

```js
weight = rating - 3
```

Meaning:

```text
5 stars → +2
4 stars → +1
3 stars →  0
2 stars → -1
1 star  → -2
```

### 8.2 Movie Score

Unrated titles are scored by overlap with positively weighted descriptors, minus a reduced penalty for negatively weighted descriptors.

Only descriptor tags are scored. Metadata is excluded.

### 8.3 Tag Brain / Descriptor Brain

The Tags tab now represents the descriptor brain:

- positive descriptors
- negative descriptors
- neutral descriptors
- title counts
- rating-driven weights

The UI label has changed from `tags:` to `brain:`.

## 9. Reset Brain

The app includes a `Reset Brain` button.

Reset Brain clears:

- ratings
- watchlist state
- skipped state
- learned tag/descriptor weights
- retag messages
- user notes

Reset Brain preserves:

- fetched Wikipedia pool
- `wikiPageId`
- `wikiUrl`
- `storyText`
- `leadText`
- Drive connection settings
- TMDB token/settings

After reset, the app rebuilds descriptors from the existing Wikipedia story text and saves/syncs the clean state.

This allows a fresh recommendation brain without refetching the whole pool.

## 10. Manual URL Add

Manual URL flow:

1. User pastes Wikipedia URL.
2. App extracts `/wiki/...` page title.
3. App fetches page through Wikipedia API.
4. App stores `wikiPageId` and `wikiUrl`.
5. App extracts story section.
6. App extracts raw descriptors.
7. App updates existing title when matching, or creates a new title.
8. App rebuilds the descriptor brain.
9. App saves locally and syncs Drive.

Manual URL can repair a title whose earlier page identity was weak.

## 11. Pool Expansion

Automatic expansion uses Wikipedia category/list navigation only.

The app must not use hardcoded title packs as candidate sources.

Candidate title flow:

```text
Wikipedia category/list pages
→ candidate page titles
→ reject obvious non-title pages
→ fetch page
→ verify page type and language
→ extract story section
→ extract descriptors
→ save title
→ rebuild descriptor brain
```

## 12. Data Persistence

Primary storage:

```text
localStorage key: cinelens_v2
```

Optional sync:

```text
Google Drive file: cinelens_data.json
```

Saved state includes:

```js
movies
settings
rejectedWikiTitles
drive metadata
```

`tagWeights` is computed from ratings and descriptors. It does not need to be treated as permanent truth.

## 13. UI Requirements

Tabs:

- All
- Movies
- Shows
- Rated
- Watchlist
- Tags
- Pool
- Rejected

Pool cards must show:

- Wikipedia verification status
- meaningful descriptor count
- descriptor chips
- retag button
- removable chips

Normal recommendation cards may show a limited descriptor list with expand/collapse.

## 14. Current Implementation Notes

Implemented changes in the current `index.html`:

1. Seed pool disabled.
2. Seed tags emptied.
3. Expansion title packs emptied.
4. Curated title-specific tags removed.
5. Fallback tag set emptied.
6. `deriveTagsFromText()` replaced with contrastive descriptor extraction.
7. `rebuildDescriptorBrain()` added.
8. `scoringTags()` now uses descriptor tags only.
9. `runHousekeeping()` now rebuilds descriptors instead of remapping invented tags.
10. `Reset Brain` button added.
11. `resetBrain()` added.
12. Retagging remains page-ID-first and non-destructive.
13. JavaScript syntax check passes.

## 15. Non-Negotiable Tag Hygiene Rules

1. Fewer accurate descriptors beat many decorative tags.
2. Wrong shared descriptors are poison.
3. Metadata is not taste.
4. A descriptor must come from the page story text.
5. A descriptor should be useful because it distinguishes the title from the pool.
6. Failed retagging must preserve existing data.
7. No invented title-specific fixes.
8. No fallback tag stuffing.
9. No seed brain.
10. The brain must remain auditable and clean.

## 16. UI/UX Fixes Added After Mobile Review

### Mobile header

The header must not push the page sideways on iPhone-sized screens.

Implemented behaviour:

- Header stacks into compact mobile rows.
- The tab bar scrolls horizontally inside its own lane.
- The page itself must not become wider than the viewport.
- Drive status and action buttons wrap inside the header instead of forcing horizontal overflow.

### Rated / content tabs

The Rated tab previously looked empty on mobile because the large control deck occupied the first screen even after the user had selected Rated.

Implemented behaviour:

- Rated, Watchlist, Tags and Rejected hide discovery-only controls.
- Stats remain visible.
- The actual tab content appears immediately after the compact stats block.
- Rated filtering uses numeric rating checks: `Number(m.rating || 0) > 0`.

### Star rating interaction

Rating stars must behave like normal rating controls.

Implemented behaviour:

- Hovering over star 4 previews stars 1-4.
- Clicking star 5 stores rating 5 and fills stars 1-5.
- Existing ratings render cumulatively, not as a single isolated star.
- The same star renderer is used across normal cards, Rated cards and Pool cards.
