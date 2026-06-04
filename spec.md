# CineLens Spec

## Purpose

CineLens is a single-file movie and show discovery app. It helps a user rate titles, learn their taste through descriptive tags, and recommend unrated titles whose tags overlap with what the user tends to like.

## Current App Shape

- Main app file: `index.html`
- App type: static browser app with embedded HTML, CSS, and JavaScript
- Storage: browser `localStorage`, with optional Google Drive JSON sync
- External data: Wikipedia API for expanding the title pool
- Primary UI sections:
  - `For You`: unified discovery surface for recommended/unrated titles
  - `Rated`: titles the user has already rated
  - `Watchlist`: unseen titles the user wants to save
  - `Tag Brain`: tag weights and title/tag exploration

## Core User Flow

1. The app loads saved local state.
2. The built-in seed pool is added if missing.
3. The user reviews titles in `For You`.
4. If the user has seen a title, they rate it directly from the card.
5. If the user has not seen a title, they add it to `Watchlist`.
6. Rated titles are tagged from source metadata, plot, story, and synopsis text.
7. Tags are converted into taste weights based on rating.
8. Unrated tagged titles are scored.
9. The highest-scoring matches appear in `For You`.

## Data Model

The app keeps runtime state in a global `state` object:

```js
{
  movies: {},
  tagWeights: {},
  settings: {
    topN: 10,
    batchSize: 12,
    minYear: 1970,
    watchCountry: 'IN',
    platforms: ['Netflix', 'Prime Video', 'Hotstar']
  },
  rejectedWikiTitles: {},
  drive: {
    connected: false,
    accessToken: '',
    folderId: '',
    fileId: ''
  },
  poolFetched: false
}
```

Each movie/show record generally contains:

```js
{
  id: 'tt0111161',
  title: 'The Shawshank Redemption',
  year: 1994,
  director: 'Frank Darabont',
  language: 'English',
  country: 'USA',
  format: 'series', // optional
  tags: [],
  plotTags: [],
  rating: 0,
  tagged: false,
  watchlist: false,
  availability: {
    tmdbId: 123,
    tmdbType: 'movie',
    countries: {}
  },
  skipped: false
}
```

## Source And Tagging Rules

Wikipedia expansion pulls candidate titles from language-specific film categories:

- `Category:English-language_films`
- `Category:Hindi-language_films`

These categories are part of Wikipedia's `Category:Films by language` taxonomy: <https://en.wikipedia.org/wiki/Category:Films_by_language>.

When the active tab is `Shows`, expansion switches to television-specific list-page sources navigated from Wikipedia's `Lists of television programs`: <https://en.wikipedia.org/wiki/Lists_of_television_programs>. It does not rely on language-specific TV categories. When the active tab is `Movies`, expansion rejects TV/web-series pages. When the active tab is `All`, expansion can use both movie and show sources.

For fetched Wikipedia titles, tags are derived from the page extract, categories, and parsed metadata. The app should keep moving toward source-derived tagging from plot, story, synopsis, category, country, language, year, format, and director signals. Hardcoded seed tags are allowed as startup data so the initial local pool can be scoreable immediately, but the expansion brain should not depend on hardcoded per-title tags.

## Recommendation Rules

Tag weights are calculated from rated titles:

- 5 stars: each tag contributes `+2`
- 4 stars: each tag contributes `+1`
- 3 stars: each tag contributes `0`
- 2 stars: each tag contributes `-1`
- 1 star: each tag contributes `-2`

An unrated title is recommended when:

- it has tags,
- at least one tag overlaps with a positive user preference,
- and its total tag score is positive.

Recommendations start once there are at least 3 rated/tagged titles. They are recalculated after each rating, tag update, watchlist change, or pool expansion. Positive plot/story tag overlap is the main ranking signal; disliked plot/story tags apply a smaller penalty so they push titles down without erasing every useful match. Metadata tags such as language, country, decade, and format are not used for recommendations.

Recommendations are sorted by score, descending, then by positive tag overlap.

Discovery excludes titles older than the selected `Since` year. The default cutoff is `1970`, and the user can adjust it from the settings bar.

## Persistence

Local state is saved under the `localStorage` key:

```txt
cinelens_v2
```

Google Drive sync stores the app data in:

```txt
cinelens_data.json
```

Google Drive sync uses Google Identity Services OAuth with the `drive.file` scope. Access tokens are kept only in runtime memory and are not saved to `localStorage`.

## Availability

No paid availability API is required or planned for the personal app.

Where-to-watch data is exact only when a free TMDB API key or v4 read token is saved locally in the browser under:

```txt
cinelens_tmdb_token
```

The app uses TMDB search plus movie/TV watch provider endpoints to cache provider availability by selected country on each movie record. Without a free TMDB token, the `where` action opens a JustWatch title search as a no-API fallback. Selected OTT platforms are stored in settings and are used to highlight/filter titles once availability is known.

## Known Notes

- The app is currently implemented as one large HTML file.
- Some symbols appear to have encoding damage in the file, for example stars, arrows, and close icons may show as mojibake in text views.
- Google Drive sync is configured for the personal GitHub Pages OAuth client and uses browser-side OAuth. This is suitable for the current personal-use app, not a multi-user production service.
- Wikipedia-derived metadata and tags are heuristic and may be imperfect.

## Iteration Log

### 2026-06-04

- Added this spec as the project reference document.
- Captured the current architecture, data model, recommendation rules, persistence behavior, and known notes.
- Initialized the project for GitHub publishing.
- Renamed the app entry file from `cinelens.html` to `index.html` so GitHub Pages can serve the app at the repository root URL.
- Replaced the old Google Drive API-key dialog with a direct Google OAuth flow using Google Identity Services and bearer-token Drive API requests.
- Merged `For You` and `Rate These` into a single discovery section where users either rate seen titles or add unseen titles to `Watchlist`.
- Added a watchlist section, a favicon, and a persisted `Since` year cutoff for discovery recommendations.
- Capped each pool expansion run at 60 fetch attempts and added background auto-refill when the discovery pool runs low.
- Changed Wikipedia expansion to source candidate titles from English/Hindi language film categories and keep fetched tags source-derived from page text and metadata.
- Hydrated existing seed titles with starter tags so recommendations can start immediately from the local pool after enough ratings, while keeping Wikipedia-expanded titles source-derived.
- Adjusted recommendation scoring to prioritize positive tag overlap and apply disliked tags as a smaller penalty.
- Split recommendation tags into `plotTags` so scoring ignores metadata tags such as language, country, year, and format.
- Improved pool expansion to remember rejected Wikipedia titles, fetch deeper category pages, and reject obvious franchises/lists/universes instead of retrying them every run.
- Increased background auto-refill to trigger below 30 available discovery titles with a 2-minute cooldown; manual Expand remains a force-fetch action.
- Simplified movie cards into compact rows and warmed the visual theme with richer cinema-like colors.
- Added selected OTT platform controls, selected country, optional free TMDB token storage, per-title availability lookup/cache, and JustWatch fallback search links without adding paid API dependencies.
- Redesigned the interface around a clearer control deck, compact recommendation rows, reduced per-card tag clutter, warmer cinema colors, and a contained Tag Brain panel.
- Made `Expand Pool` respect the active tab: Movies fetches films, Shows fetches television/web-series sources, and All fetches both.
- Reworked Shows expansion to discover show list pages from `Lists of television programs` rather than relying on unavailable/incomplete TV language categories.
- Switched the visual direction to a black app background with white movie cards and selective color accents.

## Future Iterations

When making changes, update this file with:

- what changed,
- why it changed,
- affected files,
- data/storage migrations if any,
- new assumptions or limitations,
- and any manual verification performed.
