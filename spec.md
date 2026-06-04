# CineLens Spec

## Purpose

CineLens is a single-file movie and show discovery app. It helps a user rate titles, learn their taste through descriptive tags, and recommend unrated titles whose tags overlap with what the user tends to like.

## Current App Shape

- Main app file: `index.html`
- App type: static browser app with embedded HTML, CSS, and JavaScript
- Storage: browser `localStorage`, with optional Google Drive JSON sync
- External data: Wikipedia API for expanding the title pool
- Primary UI sections:
  - `For You`: recommended unrated titles
  - `Rated`: titles the user has already rated
  - `Rate These`: current batch of unrated titles
  - `Tag Brain`: tag weights and title/tag exploration

## Core User Flow

1. The app loads saved local state.
2. The built-in seed pool is added if missing.
3. The user rates movies or shows from the rating queue.
4. Rated titles are tagged.
5. Tags are converted into taste weights based on rating.
6. Unrated tagged titles are scored.
7. The highest-scoring matches appear in `For You`.

## Data Model

The app keeps runtime state in a global `state` object:

```js
{
  movies: {},
  tagWeights: {},
  settings: {
    topN: 10,
    batchSize: 12
  },
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
  rating: 0,
  tagged: false,
  skipped: false
}
```

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

Recommendations are sorted by total score, descending.

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

## Future Iterations

When making changes, update this file with:

- what changed,
- why it changed,
- affected files,
- data/storage migrations if any,
- new assumptions or limitations,
- and any manual verification performed.
