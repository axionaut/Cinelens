// ─────────────────────────────────────────────
// WIKIPEDIA FILM SOURCES
// These are the Wikipedia list pages we pull from.
// The API returns page titles which we then individually fetch.
// ─────────────────────────────────────────────
const WIKI_SOURCES = {
  englishMovies: ['Category:English-language_films'],
  hindiMovies: ['Category:Hindi-language_films']
};
const WIKI_YEAR_INDEX_SOURCES = {
  englishMovies: 'Category:English-language_films_by_year',
  hindiMovies: 'Category:Hindi-language_films_by_year',
  englishShows: [
    'Category:American_television_series_debuts_by_year',
    'Category:British_television_series_debuts_by_year',
    'Category:Canadian_television_series_debuts_by_year',
    'Category:Australian_television_series_debuts_by_year',
    'Category:New_Zealand_television_series_debuts_by_year',
    'Category:Irish_television_series_debuts_by_year'
  ]
};
const AI_TAGGER_URL = 'https://script.google.com/macros/s/AKfycbyN5QBVU3YS2Nmp9-xEduGkOQOAVxkmAzsrzPfQSDX7HfSYxYJvusuZbpLXQk5k-EsWtg/exec';
const APP_VERSION = 14;
const AI_TAG_PROMPT_VERSION = 'cinelens-tags-v3';
const AI_TAG_MIN_CONFIDENCE = 0.55;
const AI_TAG_MIN_COUNT = 10;
const AI_TAG_MAX_COUNT = 20;
const AI_TAG_MIGRATION_VERSION = 1;
const AI_TAG_BATCH_SIZE = 3;
const AI_TAG_RETRY_LIMIT = 3;
const AI_VOCABULARY_SAMPLE_SIZE = 240;
const AI_TAG_CLOUD_NORMALIZE_EVERY = 100;
const AI_TAG_CLOUD_NORMALIZE_VERSION = 'cinelens-tag-cloud-v2';
const AI_REQUEST_DELAY_MS = 12000;
const WIKI_LIST_SOURCES = {
  showsIndex: 'Lists of television programs',
  englishShows: ['List of television programs: A','List of television programs: B','List of television programs: C','List of British television programmes','List of Netflix original programming','List of Amazon Prime Video original programming']
};

const WIKI_NAVIGATION_LISTS = {
  englishMovies: ['Lists of English-language films','List of American films of the 2020s','List of British films of 2020','List of films considered the best'],
  hindiMovies: ['Lists of Hindi films','List of Hindi films of 2024','List of Hindi films of 2023','List of Hindi films of 2022','List of Bollywood films of 2021'],
  topicMovies: ['List of films considered the best','List of cult films','List of films based on actual events','List of films based on awards','List of films with a 100% rating on Rotten Tomatoes'],
  englishShows: ['List of Netflix original programming','List of Amazon Prime Video original programming','List of British television programmes']
};

const COLLECTION_LANES = [
  { key:'englishMovies', label:'English movies', mode:'movies', language:'English', weight:4 },
  { key:'hindiMovies', label:'Hindi movies', mode:'movies', language:'Hindi', weight:3 },
  { key:'englishShows', label:'English shows', mode:'shows', language:'English', weight:2 }
];


// Curated expansion packs — well-known films by title, fetched from Wikipedia
const EXPANSION_ENGLISH = [
  "Citizen Kane","Vertigo (film)","Tokyo Story","2001: A Space Odyssey (film)","Singin' in the Rain",
  "Sunrise: A Song of Two Humans","The Searchers","Man with a Movie Camera","Jeanne Dielman, 23, quai du Commerce, 1080 Bruxelles",
  "Apocalypse Now","Taxi Driver","Rear Window","Lawrence of Arabia (film)","Psycho (1960 film)",
  "Chinatown (1974 film)","Some Like It Hot","Sunset Boulevard (film)","All About Eve (film)",
  "The Rules of the Game","Casablanca (film)","Raging Bull","Network (1976 film)","Barry Lyndon",
  "Dr. Strangelove","A Clockwork Orange (film)","2001: A Space Odyssey (film)","The Shining (film)",
  "Full Metal Jacket","Eyes Wide Shut","GoodFellas","Casino (1995 film)","Heat (1995 film)",
  "L.A. Confidential (film)","Mulholland Drive (film)","Blue Velvet (film)","Wild at Heart (film)",
  "No Country for Old Men (film)","There Will Be Blood (film)","The Master (film)","Phantom Thread",
  "Boogie Nights","Magnolia (film)","Punch-Drunk Love","Paul Thomas Anderson",
  "Zodiac (film)","Zodiac","The Social Network (film)","Gone Girl (film)","Mank (film)",
  "Dunkirk (film)","Tenet (film)","Oppenheimer (film)","Killers of the Flower Moon (film)",
  "The Wolf of Wall Street (film)","Shutter Island (film)","The Departed","Goodfellas",
  "Reservoir Dogs","Jackie Brown (film)","Kill Bill","Inglourious Basterds","The Hateful Eight",
  "Once Upon a Time in Hollywood","Jaws (film)","E.T. the Extra-Terrestrial","Schindler's List",
  "Saving Private Ryan","Lincoln (film)","Munich (film)","Bridge of Spies (film)",
  "Spotlight (film)","The Revenant (film)","1917 (film)","Dunkirk (film)",
  "Mad Max: Fury Road","Children of Men","Alfonso Cuarón","Gravity (film)","Roma (film)",
  "Birdman (film)","The Grand Budapest Hotel","Isle of Dogs (film)","Asteroid City",
  "Her (film)","Being John Malkovich","Adaptation (film)","Synecdoche, New York",
  "Requiem for a Dream","Pi (film)","Black Swan (film)","Whiplash (film)",
  "La La Land (film)","Babylon (2022 film)","The Fabelmans","American Beauty (film)",
  "Road to Perdition","A Beautiful Mind (film)","Russell Crowe","Gladiator (film)",
  "Training Day","Crash (2004 film)","Million Dollar Baby","Mystic River (film)",
  "Unforgiven (film)","The Silence of the Lambs (film)","Philadelphia (film)",
  "Forrest Gump","The Shawshank Redemption","Se7en","Fight Club","American History X",
  "The Truman Show","Eternal Sunshine of the Spotless Mind","Memento (film)","Inception",
  "The Dark Knight","Interstellar (film)","The Prestige","Batman Begins",
  "Blade Runner","Blade Runner 2049","Arrival (film)","Dune (2021 film)","Dune: Part Two",
  "The Matrix","The Matrix Reloaded","V for Vendetta (film)","Cloud Atlas (film)",
  "Ex Machina (film)","Annihilation (film)","Moon (2009 film)","Coherence (film)",
  "Prisoners (film)","Sicario (film)","Villeneuve","Enemy (film)","Incendies",
  "Heat","L.A. Confidential (film)","Collateral (film)","Michael Mann",
  "American Gangster (film)","Training Day","End of Watch",
  "Get Out (film)","Us (film)","Nope (film)","Hereditary (film)","Midsommar (film)",
  "The Witch (film)","It Follows","A Quiet Place (film)","Don't Look Now",
  "Parasite (film)","Burning (film)","The Handmaiden","Oldboy (film)","I Saw the Devil",
  "Train to Busan","A Tale of Two Sisters","Memories of Murder","Mother (2009 film)",
  "Portrait of a Lady on Fire","The Son's Room","The Great Beauty","Amarcord","8½",
  "La Dolce Vita","Rome, Open City","Bicycle Thieves","Umberto D.","Il Posto",
  "The 400 Blows","Jules and Jim","Breathless (1960 film)","Contempt (film)",
  "Pierrot le Fou","My Neighbour Totoro","Princess Mononoke","Nausicaä of the Valley of the Wind",
  "Castle in the Sky","Howl's Moving Castle","The Wind Rises","When Marnie Was There",
  "Perfect Blue","Millennium Actress","Tokyo Godfathers","Paprika (2006 film)",
  "In the Mood for Love","Chungking Express","Fallen Angels (film)","Happy Together (1997 film)",
  "The Grandmaster","Ip Man (film)","A Better Tomorrow","Hard Boiled","The Killer (1989 film)",
  "Crouching Tiger, Hidden Dragon","Hero (2002 film)","House of Flying Daggers",
  "Pan's Labyrinth","The Others (film)","Open Your Eyes (1997 film)","Talk to Her",
  "All About My Mother","Volver","The Skin I Live In","Julieta (film)",
  "Amelie","The Intouchables","A Prophet","Cache (film)","The Class (film)",
  "Capernaum (film)","A Separation","The Salesman (film)","About Elly","Close-Up (film)",
  "City of God (film)","Central Station (film)","The Secret in Their Eyes (film)",
  "Wild Tales (film)","Son of Saul","The White Ribbon","Amour (film)","Cache (film)",
  "The Lives of Others","Run Lola Run","Downfall (film)","Das Boot","M (1931 film)",
  "Nosferatu","The Cabinet of Dr. Caligari","Metropolis (1927 film)",
  "The Seventh Seal","Wild Strawberries (film)","Persona (1966 film)","Fanny and Alexander",
  "Scenes from a Marriage","Cries and Whispers","Winter Light (film)",
  "Stalker (film)","Andrei Rublev (film)","The Mirror (film)","Solaris (1972 film)","Ivan's Childhood",
  "Seven Samurai","Rashomon (film)","Yojimbo","Sanjuro (film)","High and Low (film)","Ran (film)",
  "Harakiri (1962 film)","In the Realm of the Senses","Ugetsu","Sansho the Bailiff",
  "Shoplifters (film)","Nobody Knows (film)","Like Father, Like Son (film)","Monster (2023 film)",
  "Drive (2011 film)","Only God Forgives","The Neon Demon","Valhalla Rising",
  "Melancholia (film)","The Hunt (film)","A Royal Affair","The Square (film)",
  "Force Majeure (film)","The Hunt (2012 film)","Toni Erdmann","Never Look Away (film)",
  "4 Months, 3 Weeks and 2 Days","The Death of Mr. Lazarescu","12:08 East of Bucharest",
  "A Touch of Sin","Still Life (2013 film)","Mountains May Depart","Ash Is Purest White",
  "The Handmaiden","Burning (film)","Poetry (film)","Secret Sunshine",
  "Certified Copy (film)","The Past (film)","Le Havre (film)","Compartment No. 6"
];

const EXPANSION_HINDI = [
  "Sholay","Mother India (film)","Mughal-E-Azam","Guide (film)","Pyaasa",
  "Kaagaz Ke Phool","Sahib Bibi Aur Ghulam","Pather Panchali","Aparajito","The World of Apu",
  "Dil Chahta Hai","Lagaan","3 Idiots","Gangs of Wasseypur","Gangs of Wasseypur – Part 2",
  "Andhadhun (film)","Masaan (film)","Article 15 (film)","Tumbbad",
  "Court (film)","Dil Se (film)","Roja (film)","Bombay (film)","Guru (film)",
  "Rang De Basanti","Taare Zameen Par","Dangal (film)","Secret Superstar",
  "PK (film)","3 Idiots","Dhoom 3","Dhoom 2",
  "Dilwale Dulhania Le Jayenge","Kuch Kuch Hota Hai","Kabhi Khushi Kabhie Gham...",
  "Dil Dhadakne Do","Zindagi Na Milegi Dobara","Tamasha (film)","Jab We Met",
  "Cocktail (film)","Queen (film)","Dum Laga Ke Haisha","Bareilly Ki Barfi",
  "Stree (film)","Bala (2019 film)","Shubh Mangal Saavdhan","Badhaai Ho",
  "Pink (film)","Thappad (film)","Kahaani","Kahaani 2","Dirty Picture",
  "Fashion (film)","Mary Kom (film)","Sarbjit","Neerja (film)","Airlift (film)",
  "Baby (film)","A Wednesday","Special 26","Rustom (film)",
  "Talaash (film)","Drishyam (film)","Badlapur (film)","Kaabil","Ittefaq (2017 film)",
  "Andhadhun (film)","Raazi (film)","Uri: The Surgical Strike","Shershaah",
  "Bharat (film)","War (2019 film)","Tiger Zinda Hai","Pathaan","Jawan (film)",
  "Bard of Blood","Mirzapur (TV series)","Sacred Games (TV series)","Scam 1992",
  "Delhi Crime","Panchayat (TV series)","Kota Factory","TVF Pitchers",
  "Paan Singh Tomar","Gangs of Wasseypur","Dev.D","Oye Lucky! Lucky Oye!",
  "Udaan (film)","Lootera","Trapped (2017 film)","Omerta (film)",
  "Manto (film)","Aligarh (film)","Shahid (film)","Bhaag Milkha Bhaag",
  "M.S. Dhoni: The Untold Story","Sanju (film)","Thalaivii",
  "Guru (film)","Black (film)","Devdas (2002 film)","Saawariya",
  "Jodhaa Akbar","Bajirao Mastani","Padmaavat","Tanhaji","Manikarnika: The Queen of Jhansi",
  "Kabir Singh","Arjun Reddy","Animal (film)","Fighter (2024 film)",
  "RRR (film)","Baahubali: The Beginning","Baahubali 2: The Conclusion",
  "KGF: Chapter 1","KGF: Chapter 2","Pushpa: The Rise","Kantara (film)",
  "Vikram (2022 film)","Jailer (film)","Leo (2023 film)","Indian 2"
];

const EXPANSION_SHOWS = [
  "Better Call Saul","Fargo (TV series)","The Bear (TV series)","The Last of Us (TV series)","The Crown (TV series)",
  "The Boys (TV series)","Fleabag","Sherlock (TV series)","Mr. Robot","Narcos","Mad Men","House of Cards (American TV series)",
  "The Office (American TV series)","Black Mirror","Stranger Things","The Mandalorian","Andor (TV series)","The Queen's Gambit (miniseries)",
  "Mare of Easttown","The Night Of","Delhi Crime","Made in Heaven (TV series)","Paatal Lok","Aspirants (web series)",
  "Special Ops (Indian TV series)","Rocket Boys","Gullak","Tabbar","Kohrra","Farzi","Dahaad","The Family Man (Indian TV series)"
];

const TITLE_BLOCKLIST = new Set([
  'paul thomas anderson','alfonso cuaron','russell crowe','villeneuve','michael mann'
]);

const HIGH_CONFIDENCE_ENGLISH = [
  'The Avengers (2012 film)','Avengers: Infinity War','Avengers: Endgame','Iron Man (2008 film)','Captain America: The Winter Soldier',
  'Guardians of the Galaxy (film)','Spider-Man: Homecoming','Logan (film)','Deadpool (film)','The Batman (film)',
  'Dune (2021 film)','Dune: Part Two','Oppenheimer (film)','Top Gun: Maverick','Mission: Impossible - Fallout',
  'Mad Max: Fury Road','John Wick (film)','John Wick: Chapter 4','Knives Out','Glass Onion: A Knives Out Mystery',
  'The Martian (film)','Edge of Tomorrow','A Quiet Place (film)','Get Out (film)','Gone Girl (film)',
  'Prisoners (film)','Sicario (2015 film)','Nightcrawler (film)','The Social Network','The Wolf of Wall Street (2013 film)',
  'Interstellar (film)','Inception','The Dark Knight','The Prestige (film)','Memento (film)',
  'Arrival (film)','Blade Runner 2049','Ex Machina (film)','Annihilation (film)','Her (film)',
  'Whiplash (2014 film)','La La Land','The Grand Budapest Hotel','No Country for Old Men','There Will Be Blood',
  'The Departed','Shutter Island','Zodiac (film)','Se7en','Fight Club'
];

const HIGH_CONFIDENCE_HINDI = [
  'Andhadhun','Drishyam (2015 film)','Kahaani','Talaash: The Answer Lies Within','Special 26',
  'Gangs of Wasseypur','Gangs of Wasseypur - Part 2','Article 15 (film)','Raazi','Uri: The Surgical Strike',
  'Dangal (film)','3 Idiots','Taare Zameen Par','Lagaan','Rang De Basanti',
  'Zindagi Na Milegi Dobara','Dil Chahta Hai','Queen (2013 film)','Barfi!','Jab We Met',
  'Tumbbad','Stree (2018 film)','Badhaai Ho','Pink (2016 film)','Masaan',
  'Piku','Swades','Chak De! India','Bhaag Milkha Bhaag','A Wednesday!'
];

const HIGH_CONFIDENCE_SHOWS = [
  'Breaking Bad','Better Call Saul','Chernobyl (miniseries)','True Detective','Fargo (TV series)','The Bear (TV series)',
  'The Last of Us (TV series)','Black Mirror','Mindhunter (TV series)','Stranger Things','The Boys (TV series)',
  'Sherlock (TV series)','Mr. Robot','Narcos','Mad Men','House of Cards (American TV series)',
  'Delhi Crime','Scam 1992','Paatal Lok','The Family Man (Indian TV series)','Panchayat (TV series)',
  'Kota Factory','Rocket Boys','Made in Heaven (TV series)','Kohrra','Farzi'
];

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let activeTab = 'all';
let tagFilter = 'all';
let selectedTag = '';
let tagDetailView = 'all';
let tagDetailVisibleLimit = 40;
let poolExpansionInProgress = false;
let fetchAbortRequested = false;
let lastAutoExpandAt = 0;
let lastWikiRequestAt = 0;
const WIKI_REQUEST_DELAY_MS = 850;
const WIKI_BATCH_PAUSE_MS = 2500;
const CARD_REFRESH_BATCH_SIZE = 20;
const WIKI_PARSER_VERSION = 5;
const REC_INFINITE_PAGE_SIZE = 20;
const STRONG_REC_TARGET = 40;
const STRONG_REC_REFILL_THRESHOLD = 20;
const STRONG_REC_MIN_OVERLAP = 3;
const STRONG_REC_MIN_MATCH_SCORE = 0.55;
const INITIAL_TAGGED_POOL_FLOOR = 80;
const AI_BACKGROUND_RETRY_MS = 2 * 60 * 1000;
const FETCH_AUTO_ATTEMPT_BUDGET = 55;
const FETCH_MANUAL_ATTEMPT_BUDGET = 100;
const FETCH_MAX_ADDED_PER_RUN = 35;
const RECEPTION_VERSION = 1;
const RECEPTION_MAX_DOWN = 1.25;
const RECEPTION_MAX_UP = 0.5;
const RECEPTION_UNCORROBORATED_CAP = 0.97;
const RECEPTION_BASELINE_COEFFICIENT = 0.9;
const RECEPTION_COEFFICIENT_MIN = 0.25;
const RECEPTION_COEFFICIENT_MAX = 1.1;
const RECEPTION_LANE_MIN_SAMPLE = 25;
const RECEPTION_GLOBAL_MIN_SAMPLE = 15;
const RECEPTION_BACKFILL_BATCH_SIZE = 3;
const RECEPTION_BACKFILL_RETRY_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const ENGLISH_PREFERENCE_STAR_BONUS = 0.3;
const CROSS_FORMAT_TASTE_WEIGHT = 0.4;
const SHOW_STORY_MAX_CHARS = 12000;
// The active unseen catalogue is intentionally bounded, but not by one global cap.
// Ratings, watchlist items, manual additions and hidden records are personal history
// and are never rotated. Automatic unseen titles compete within their own
// year × language × format segment so older eras and both movies/shows remain represented.
const ROLLING_POOL_MIN_PER_SEGMENT = 24;
const ROLLING_POOL_MAX_PER_SEGMENT = 90;
const ROLLING_POOL_PENDING_MIN_PER_SEGMENT = 2;
const ROLLING_POOL_PENDING_MAX_PER_SEGMENT = 8;
const ROLLING_POOL_EXCLUSION_CAP = 5000;
const DRIVE_TOKEN_REFRESH_LEEWAY_MS = 5 * 60 * 1000;
const TASTE_STORY_VERSION = 'cinelens-taste-story-v1';
const TASTE_STORY_MIN_RATINGS = 3;
const TASTE_STORY_DEBOUNCE_MS = 1200;
let recVisibleLimit = 10;
let currentWikiAbortController = null;
let currentSleepCancel = null;
let lastAiRequestAt = 0;
let autoFetchPaused = false;
let autoExpandTimer = null;
let receptionBackfillTimer = null;
let receptionBackfillInProgress = false;
let receptionCalibrationTimer = null;
let backgroundAiTaggingInProgress = false;
let backgroundAiTimer = null;
let startupDriveRestoreDone = false;
// A browser with no local library must restore Drive before background work can
// create titles or advance the dataset timestamp.
let libraryWritesUnlocked = false;
let startupInitialLibraryPresent = false;
let startupFinalized = false;
let driveTokenRefreshTimer = null;
let settingsSyncTimer = null;
let tagCloudNormalizationTimer = null;
let tagCloudNormalizationInProgress = false;
let tagCloudNormalizationAttemptedCount = 0;
let tasteStoryTimer = null;
let tasteStoryInProgress = false;
let tasteStoryRefreshPending = false;
let poolVisibleLimit = 80;
let hiddenVisibleLimit = 80;
let wikiSearchResults = [];
let wikiSearchQuery = '';
let localBlockedSearchResults = [];
let similarTitleSourceId = '';
// A searched title remains visible after adding. Its search is cleared only when
// that same title is subsequently rated.
let pendingSearchResetAfterRatingId = '';
const yearCategoryIndexCache = {};
const yearCategoryMembersCache = {};
let state = {
  movies: {},
  tagWeights: {},
  genreWeights: {},
  settings: { topN: 10, minYear: 1970, languageFilter: 'all', genreFilter: 'all', ratingFilter:'all', sortMode:'recommended', shuffleSeed:Date.now(), titleSearch:'', controlDeckCollapsed:false, tagDeleteMode:false, tagPreferences:{} },
  drive: { connected: false, accessToken: '', folderId: '', fileId: '', manifestFileId:'', enabled: false, lastConnectedAt: 0 },
  hiddenTitles: {},
  wrongPicks: {},
  deletedMovieRecords: {},
  unblockedTitleRecords: {},
  // Lightweight fingerprints for automatically evicted low-value candidates.
  // This prevents the collector from repeatedly fetching and tagging the same
  // titles without retaining their plot/tag payloads.
  rollingPoolExclusions: {},
  legacyTagAliases: {},
  tagStats: { candidates:0, tags:0, rebuiltAt:'' },
  tagNormalization: { version:'', lastRawTagCount:0, normalizedAt:'', model:'', error:'' },
  tasteStory: { version:TASTE_STORY_VERSION, profileHash:'', title:'', story:'', generatedAt:'', status:'idle', error:'' },
  discoveryCursor: {},
  meta: { updatedAt:'' },
  poolFetched: false
};

let pendingManualRatingId = '';
let manualTagMovieId = '';
let manualTagSelections = new Set();
const PERFECT_REC_TARGET = STRONG_REC_TARGET;
const PERFECT_REC_MIN_RATIO = 0.995;
const MAX_STORY_TAGS = 34;
const MIN_STORY_SECTION_CHARS = 140;
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

const CONTAMINATED_FALLBACK_TAGS = new Set([...LOW_CONFIDENCE_PLOT_TAGS]);
const GENERIC_TAG_TOKENS = new Set('crime thriller child relationship father mother family return discover learn decide sent college school workplace time there around away full other first'.split(' '));
const USER_AVOID_TAGS = new Set([
  'unresolved-ending',
  'open-ending',
  'ambiguous-ending',
  'anticlimactic-ending',
  'cliffhanger-ending',
  'political-agenda',
  'culture-war',
  'identity-politics',
  'preachy-social-message',
  'propaganda-driven'
]);
const USER_AVOID_GENRES = new Set(['documentary']);
const MAX_RECOMMENDATION_TAG_SHARE = 0.10;
let tagCorpusStatsCache = null;
let cardMatchCache = null;
let tasteModelCache = new Map();
// Derived data is versioned in memory. UI-only actions such as changing a
// filter must not rebuild the rating model or rescore the whole library.
let tagVocabularyCache = null;
let scoredMovieCache = null;
let titleSearchRenderTimer = null;
let titleSearchPersistTimer = null;
const TITLE_SEARCH_RENDER_DEBOUNCE_MS = 90;
const TITLE_SEARCH_PERSIST_DEBOUNCE_MS = 500;

const GENRE_RULES = [
  ['science-fiction', /\b(science fiction|sci-fi)\b/],
  ['action', /\baction(?:-|\s)(?:film|comedy|drama|thriller|series)\b|\baction film\b/],
  ['adventure', /\badventure(?:-|\s)(?:film|comedy|drama|series)\b|\badventure film\b/],
  ['animation', /\banimat(?:ed|ion)(?:-|\s)(?:film|series|comedy|drama)\b/],
  ['comedy', /\bcomedy(?:-|\s)(?:film|drama|series|thriller)\b|\bromantic comedy\b/],
  ['crime', /\bcrime(?:-|\s)(?:film|drama|series|thriller|comedy)\b/],
  ['documentary', /\bdocumentary(?:-|\s)(?:film|series)\b/],
  ['drama', /\bdrama(?:-|\s)(?:film|series)\b|\b(?:film|television) drama\b/],
  ['kids', /\b(?:children'?s|kids?|pre-school|preschool)\b[^\n]{0,90}\b(?:film|films|movie|movies|television|tv|series|show|shows|programme|program|animation|animated)\b|\b(?:children'?s|kids?)\s+(?:films?|television|tv|series|shows?|programmes?|programs?)\b/],
  ['family', /\bfamily(?:-|\s)(?:film|drama|series|comedy)\b/],
  ['fantasy', /\bfantasy(?:-|\s)(?:film|drama|series|comedy)\b/],
  ['historical', /\bhistorical(?:-|\s)(?:film|drama|series|fiction)\b/],
  ['horror', /\bhorror(?:-|\s)(?:films?|movies?|comedy|drama|series|television)\b|\b(?:slasher|supernatural|psychological|science fiction|sci-fi) horror\b|\b(?:slasher|splatter|gore|ghost|haunted|demonic|possession)\s+(?:films?|movies?|series)\b/],
  ['musical', /\bmusical(?:-|\s)(?:film|comedy|drama|series)\b/],
  ['mystery', /\bmystery(?:-|\s)(?:film|drama|series|thriller)\b/],
  ['romance', /\bromance(?:-|\s)(?:film|drama|series)\b|\bromantic(?:-|\s)(?:film|drama|thriller)\b/],
  ['sports', /\bsports?(?:-|\s)(?:film|drama|series|comedy)\b/],
  ['thriller', /\bthriller(?:-|\s)(?:film|drama|series)\b|\b(?:action|crime|mystery|psychological|political|spy) thriller\b/],
  ['war', /\bwar(?:-|\s)(?:film|drama|series)\b/],
  ['western', /\bwestern(?:-|\s)(?:film|drama|series)\b/]
];
const GENRE_SCORE_FACTOR = 0.35;

function deriveGenres(leadText='', categories=[]) {
  const categoryText = Array.isArray(categories) ? categories.join(' ') : String(categories || '');
  const metadata = `${leadText} ${categoryText}`.toLowerCase();
  return GENRE_RULES.filter(([, pattern]) => pattern.test(metadata)).map(([genre]) => genre);
}

function movieGenres(movie) {
  const stored = Array.isArray(movie?.genres) ? movie.genres : [];
  return [...new Set(stored.length ? stored : deriveGenres(movie?.leadText || '', movie?.categoryText || ''))];
}

function normaliseTagName(tag) {
  return String(tag || '').toLowerCase().trim().replace(/\s+/g, '-');
}

const CANONICAL_FUNCTION_WORDS = new Set('a an the and or but nor so yet of in on at to from into onto by for with without as is are was were be been being has have had do does did will would can could may might must shall should this that these those it its he she they them his her their who whom whose which what when where while after before during then than also just still already again ever never very more most less least much many some any each every both either neither keeps keep kept starts start started begins begin began continues continue continued tries try tried'.split(' '));

function stemCanonicalToken(token) {
  let word = String(token || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) word = word.slice(0, -3) + 'y';
  else if (word.endsWith('ing') && word.length > 5) word = word.slice(0, -3);
  else if (word.endsWith('ed') && word.length > 4) word = word.slice(0, -2);
  else if (/(ses|xes|zes|ches|shes)$/.test(word) && word.length > 5) word = word.slice(0, -2);
  else if (word.endsWith('s') && word.length > 4 && !/(ss|us|is)$/.test(word)) word = word.slice(0, -1);
  if (/(.)\1$/.test(word) && word.length > 4) word = word.slice(0, -1);
  return word;
}

function canonicalTagFeatures(tag) {
  const normalisedTag = normaliseTagName(tag);
  const tokens = normalisedTag.split(/[^a-z0-9]+/).filter(Boolean)
    .filter(token => !CANONICAL_FUNCTION_WORDS.has(token))
    .map(stemCanonicalToken)
    .filter(Boolean);
  const unique = [...new Set(tokens)];
  return {
    tag: normalisedTag,
    tokens: unique,
    signature: [...unique].sort().join('-'),
    phrase: unique.join('-'),
    acronym: unique.length > 1 ? unique.map(token => token[0]).join('') : ''
  };
}

function rawScoringTags(movie) {
  const base = movie?.tags && movie.tags.length ? movie.tags : (movie?.coreTags && movie.coreTags.length ? movie.coreTags : (movie?.plotTags && movie.plotTags.length ? movie.plotTags : (movie?.descriptorTags || [])));
  return [...new Set((base || []).filter(t => rawTagAllowed(movie, t)).filter(t => !isMetaTag(t)).filter(t => !LOW_CONFIDENCE_PLOT_TAGS.has(t)))];
}

function suppressedTagSet(movie) {
  return new Set((movie?.suppressedTags || []).map(normaliseTagName).filter(Boolean));
}

function suppressedRawTagSet(movie) {
  return new Set((movie?.suppressedRawTags || []).map(normaliseTagName).filter(Boolean));
}

function tagIsSuppressed(movie, tag) {
  return suppressedTagSet(movie).has(normaliseTagName(tag));
}

function tagAllowed(movie, tag) {
  return !tagIsSuppressed(movie, tag);
}

function rawTagAllowed(movie, tag) {
  return !suppressedRawTagSet(movie).has(normaliseTagName(tag));
}

function probableEntityTokens(movie) {
  const text = String(movie?.storyText || '');
  const counts = new Map();
  const pattern = /[a-z0-9,'")\]]\s+([A-Z][a-z]{2,})\b/g;
  let match;
  while ((match = pattern.exec(text))) {
    const token = stemCanonicalToken(match[1]);
    if (token) counts.set(token, (counts.get(token) || 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, count]) => count >= 2).map(([token]) => token));
}

function invalidateTagCaches() {
  tagCorpusStatsCache = null;
  tagVocabularyCache = null;
  cardMatchCache = null;
  scoredMovieCache = null;
  tasteModelCache = new Map();
}

function rebuildTagBrain() {
  const records = [...Object.values(state.movies || {}), ...Object.values(state.hiddenTitles || {})];
  const tags = new Set();
  records.forEach(movie => rawScoringTags(movie).forEach(tag => tags.add(tag)));
  records.forEach(movie => {
    delete movie.canonicalTags;
    delete movie.canonicalTagVersion;
  });
  state.tagStats = {
    candidates:tags.size,
    tags:tags.size,
    rebuiltAt:new Date().toISOString()
  };
  delete state.canonicalTagStats;
  tagCorpusStatsCache = null;
  return 0;
}

function tagCorpusStats() {
  if (tagCorpusStatsCache) return tagCorpusStatsCache;
  const records=[...Object.values(state.movies || {}),...Object.values(state.hiddenTitles || {})];
  const df={};
  records.forEach(movie=>new Set(scoringTags(movie)).forEach(tag=>{df[tag]=(df[tag]||0)+1;}));
  tagCorpusStatsCache={docCount:Math.max(1,records.length),df};
  return tagCorpusStatsCache;
}

function tagSpecificity(tag) {
  const stats=tagCorpusStats();
  const docs=stats.df[tag]||1;
  return Math.max(0.08,Math.log((stats.docCount+1)/(docs+1))/Math.log(stats.docCount+1));
}

function tagDocumentShare(tag) {
  const stats=tagCorpusStats();
  return (stats.df[tag] || 0) / Math.max(1, stats.docCount);
}

function tagTooCommon(tag) {
  return tagDocumentShare(tag) > MAX_RECOMMENDATION_TAG_SHARE;
}

function tagIsPresentable(tag) {
  const feature=canonicalTagFeatures(tag);
  if (!feature.tokens.length) return false;
  if (feature.tokens.length===1 && GENERIC_TAG_TOKENS.has(feature.tokens[0])) return false;
  if (tagTooCommon(tag)) return false;
  return true;
}

function recommendationScoringTags(movie) {
  return scoringTags(movie).filter(tagIsPresentable);
}

function cleanTagArray(tags, movie=null, keepLowConfidence=false) {
  return [...new Set((tags || [])
    .map(normaliseTagName)
    .filter(Boolean)
    .filter(t => keepLowConfidence || !CONTAMINATED_FALLBACK_TAGS.has(t))
    .filter(t => !movie || tagEvidenceOk(t, movie))
  )];
}


function wikiPageIdFromMovie(movie) {
  if (!movie) return '';
  if (movie.wikiPageId) return String(movie.wikiPageId).replace(/^wiki_/, '');
  if (String(movie.id || '').startsWith('wiki_')) return String(movie.id).replace(/^wiki_/, '');
  return '';
}

function wikiUrlFromTitle(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(String(title || '').replace(/ /g, '_'))}`;
}

function attrSafe(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wikiUrlForMovie(movie) {
  if (!movie) return '';
  if (movie.wikiUrl) return movie.wikiUrl;
  const title = movie.wikiTitle || movie.pageTitle;
  if (title) return wikiUrlFromTitle(title);
  return '';
}

function googleSearchUrlForMovie(movie) {
  if (!movie || !movie.title) return '';
  const parts = [movie.title];
  if (movie.year) parts.push(String(movie.year));
  parts.push(isShow(movie) ? 'tv series' : 'movie');
  return `https://www.google.com/search?q=${encodeURIComponent(parts.join(' '))}`;
}

function clampPaletteNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function wrapHue(hue) {
  return ((Number(hue) % 360) + 360) % 360;
}

function cssHsl(h, s, l, alpha=null) {
  const hue = Math.round(wrapHue(h));
  const sat = Math.round(clampPaletteNumber(s, 0, 100));
  const light = Math.round(clampPaletteNumber(l, 0, 100));
  if (alpha === null || alpha === undefined) return `hsl(${hue} ${sat}% ${light}%)`;
  return `hsl(${hue} ${sat}% ${light}% / ${clampPaletteNumber(alpha, 0, 1).toFixed(3)})`;
}

function paletteRandomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function paletteRandomFloat(min, max) {
  return min + Math.random() * (max - min);
}

function randomHexSeed() {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

function hexToRgb(hex) {
  const clean = String(hex || '').replace(/[^a-f0-9]/gi, '').slice(0, 6).padEnd(6, '0');
  return {
    r:parseInt(clean.slice(0, 2), 16),
    g:parseInt(clean.slice(2, 4), 16),
    b:parseInt(clean.slice(4, 6), 16)
  };
}

function rgbToHsl({ r=0, g=0, b=0 }={}) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h:wrapHue(h), s:s * 100, l:l * 100 };
}

function hslToRgb(h, s, l) {
  h = wrapHue(h) / 360;
  s = clampPaletteNumber(s, 0, 100) / 100;
  l = clampPaletteNumber(l, 0, 100) / 100;
  if (s === 0) {
    const grey = Math.round(l * 255);
    return { r:grey, g:grey, b:grey };
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r:Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g:Math.round(hue2rgb(p, q, h) * 255),
    b:Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  };
}

function rgbToHex({ r=0, g=0, b=0 }={}) {
  const part = value => clampPaletteNumber(Math.round(value), 0, 255).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

function hslToHex(h, s, l) {
  return rgbToHex(hslToRgb(h, s, l));
}

function paletteLuminance({ r=0, g=0, b=0 }={}) {
  const channel = value => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function paletteContrast(rgbA, rgbB) {
  const a = paletteLuminance(rgbA);
  const b = paletteLuminance(rgbB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function readableTextForHsl(bgH, bgS, bgL) {
  const dark = { h:wrapHue(bgH), s:paletteRandomFloat(10, 28), l:paletteRandomFloat(5, 12) };
  const light = { h:wrapHue(bgH), s:paletteRandomFloat(8, 24), l:paletteRandomFloat(92, 98) };
  const bg = hslToRgb(bgH, bgS, bgL);
  const darkContrast = paletteContrast(bg, hslToRgb(dark.h, dark.s, dark.l));
  const lightContrast = paletteContrast(bg, hslToRgb(light.h, light.s, light.l));
  return darkContrast >= lightContrast ? dark : light;
}

function mutedTextFor(text, bgH) {
  return text.l < 50
    ? cssHsl(bgH, paletteRandomFloat(12, 28), paletteRandomFloat(25, 39))
    : cssHsl(bgH, paletteRandomFloat(10, 24), paletteRandomFloat(66, 82));
}

function secondaryMutedTextFor(text, bgH) {
  return text.l < 50
    ? cssHsl(bgH, paletteRandomFloat(8, 22), paletteRandomFloat(42, 56))
    : cssHsl(bgH, paletteRandomFloat(8, 20), paletteRandomFloat(50, 64));
}

function normalizeSeedHsl(seedHex) {
  const seed = rgbToHsl(hexToRgb(seedHex));
  return {
    h:seed.h,
    s:clampPaletteNumber(Math.max(seed.s, paletteRandomFloat(74, 96)), 72, 98),
    l:clampPaletteNumber(seed.l < 35 || seed.l > 76 ? paletteRandomFloat(42, 66) : seed.l, 38, 72)
  };
}

function paletteHueDistance(a, b) {
  const delta = Math.abs(wrapHue(a) - wrapHue(b));
  return Math.min(delta, 360 - delta);
}

function paletteToneRange(tone, role='page') {
  const map = {
    dark:{
      page:[5, 17], surface:[8, 19], control:[8, 22], card:[9, 24], chip:[13, 27]
    },
    light:{
      page:[78, 96], surface:[82, 98], control:[75, 94], card:[76, 96], chip:[70, 92]
    }
  };
  const range = (map[tone] || map.dark)[role] || (map[tone] || map.dark).page;
  return paletteRandomFloat(range[0], range[1]);
}

function paletteSaturationFor(tone, role='page') {
  const limits = {
    dark:{ page:[22, 58], surface:[18, 46], control:[26, 66], card:[34, 76], chip:[36, 82] },
    light:{ page:[18, 60], surface:[16, 52], control:[24, 68], card:[28, 74], chip:[32, 86] }
  };
  const range = (limits[tone] || limits.dark)[role] || (limits[tone] || limits.dark).page;
  return paletteRandomFloat(range[0], range[1]);
}

function randomizedBackground({ h, s, l, h2=h + 120, s2=s, l2=l, role='page' }={}) {
  const roll = Math.random();
  let style = 'solid';
  if (roll > 0.38 && roll <= 0.66) style = 'linear';
  else if (roll > 0.66 && roll <= 0.84) style = 'radial';
  else if (roll > 0.84) style = 'layered';

  const first = cssHsl(h, s, l);
  const second = cssHsl(h2, s2, l2);
  const third = cssHsl(h + paletteRandomFloat(24, 70), Math.max(14, s * 0.72), l + paletteRandomFloat(-4, 4));
  const angle = paletteRandomInt(8, 172);
  if (style === 'solid') return { css:first, style };
  if (style === 'linear') return { css:`linear-gradient(${angle}deg, ${first} 0%, ${second} 100%)`, style };
  if (style === 'radial') {
    const x = paletteRandomInt(8, 82);
    const y = paletteRandomInt(-12, 44);
    return { css:`radial-gradient(circle at ${x}% ${y}%, ${second} 0%, ${first} ${role === 'page' ? 58 : 72}%)`, style };
  }
  return {
    css:`radial-gradient(circle at ${paletteRandomInt(8, 28)}% ${paletteRandomInt(-12, 18)}%, ${cssHsl(h2, s2, l2, 0.78)}, transparent ${role === 'page' ? 36 : 48}%), radial-gradient(circle at ${paletteRandomInt(68, 94)}% ${paletteRandomInt(4, 38)}%, ${cssHsl(h + 210, s * 0.9, l + (l > 50 ? -10 : 10), 0.62)}, transparent ${role === 'page' ? 34 : 50}%), linear-gradient(${angle}deg, ${first}, ${third})`,
    style
  };
}

function buildRandomPalette() {
  // Main colour is a fresh random hex seed. Everything else is derived from
  // numeric colour relationships, but background tone and gradient use are also
  // randomized. Readability, not darkness, is the constraint.
  const seedHex = randomHexSeed();
  const seed = normalizeSeedHsl(seedHex);
  const hue = seed.h;
  const scheme = [
    [180, 32], [150, -36], [118, 238], [210, 46], [92, 196], [72, 228], [165, 288], [132, 24]
  ][paletteRandomInt(0, 7)];
  const appTone = Math.random() < 0.52 ? 'dark' : 'light';
  const cardTone = Math.random() < 0.72 ? appTone : (appTone === 'dark' ? 'light' : 'dark');
  const filmHue = hue + paletteRandomFloat(-18, 18);
  let showHue = hue + scheme[0] + paletteRandomFloat(-18, 18);
  const accent2Hue = hue + scheme[1] + paletteRandomFloat(-14, 14);
  if (paletteHueDistance(filmHue, showHue) < 80) showHue = filmHue + 160 + paletteRandomFloat(-20, 20);

  const pageL = paletteToneRange(appTone, 'page');
  const pageS = paletteSaturationFor(appTone, 'page');
  const surfaceL = paletteToneRange(appTone, 'surface');
  const surface2L = appTone === 'light' ? Math.max(62, surfaceL - paletteRandomFloat(4, 11)) : Math.min(30, surfaceL + paletteRandomFloat(4, 10));
  const controlL = paletteToneRange(appTone, 'control');
  const cardL = paletteToneRange(cardTone, 'card');
  const cardS = paletteSaturationFor(cardTone, 'card');
  const accentL = appTone === 'light' ? paletteRandomFloat(36, 52) : paletteRandomFloat(56, 72);
  const cardAccentL = cardTone === 'light' ? paletteRandomFloat(34, 50) : paletteRandomFloat(58, 74);
  const accent = hslToHex(hue, seed.s, accentL);
  const accent2 = hslToHex(accent2Hue, paletteRandomFloat(82, 98), appTone === 'light' ? paletteRandomFloat(34, 52) : paletteRandomFloat(55, 70));
  const filmAccent = hslToHex(filmHue, paletteRandomFloat(86, 100), cardAccentL);
  const showAccent = hslToHex(showHue, paletteRandomFloat(76, 98), cardAccentL);

  const pageBg = randomizedBackground({
    h:hue + paletteRandomFloat(-16, 16),
    s:pageS,
    l:pageL,
    h2:accent2Hue,
    s2:paletteSaturationFor(appTone, 'page'),
    l2:paletteToneRange(appTone, 'page'),
    role:'page'
  });
  const controlBg = randomizedBackground({
    h:hue + paletteRandomFloat(-24, 24),
    s:paletteSaturationFor(appTone, 'control'),
    l:controlL,
    h2:showHue,
    s2:paletteSaturationFor(appTone, 'control'),
    l2:paletteToneRange(appTone, 'control'),
    role:'control'
  });
  const filmBg = randomizedBackground({
    h:filmHue,
    s:cardS,
    l:cardL,
    h2:filmHue + paletteRandomFloat(20, 72),
    s2:Math.max(18, cardS - paletteRandomFloat(4, 18)),
    l2:paletteToneRange(cardTone, 'card'),
    role:'card'
  });
  const showBg = randomizedBackground({
    h:showHue,
    s:cardS,
    l:cardL,
    h2:showHue + paletteRandomFloat(-72, -20),
    s2:Math.max(18, cardS - paletteRandomFloat(4, 18)),
    l2:paletteToneRange(cardTone, 'card'),
    role:'card'
  });

  const text = readableTextForHsl(hue, pageS, pageL);
  const cardText = readableTextForHsl(filmHue, cardS, cardL);
  const chipL = paletteToneRange(cardTone, 'chip');
  const chipS = paletteSaturationFor(cardTone, 'chip');
  const sourceL = appTone === 'light' ? paletteRandomFloat(68, 88) : paletteRandomFloat(14, 28);
  const sourceS = paletteRandomFloat(42, 88);

  return {
    version:3,
    seedHex,
    mainHex:accent,
    tone:appTone,
    cardTone,
    backgroundStyles:{ page:pageBg.style, control:controlBg.style, film:filmBg.style, show:showBg.style },
    updatedAt:nowStamp(),
    colors:{
      accent,
      accent2,
      text:cssHsl(text.h, text.s, text.l),
      cardText:cssHsl(cardText.h, cardText.s, cardText.l),
      surface:hslToHex(hue, paletteSaturationFor(appTone, 'surface'), surfaceL),
      surface2:hslToHex(hue + 8, paletteSaturationFor(appTone, 'surface'), surface2L),
      border:cssHsl(accent2Hue, paletteRandomFloat(38, 78), appTone === 'light' ? paletteRandomFloat(46, 68) : paletteRandomFloat(26, 46), 0.72),
      muted:mutedTextFor(text, hue),
      muted2:secondaryMutedTextFor(text, hue),
      cardMuted:mutedTextFor(cardText, filmHue),
      tagBg:cssHsl(hue, chipS, chipL, appTone === 'light' ? 0.92 : 0.82),
      tagBorder:cssHsl(hue, paletteRandomFloat(56, 86), appTone === 'light' ? paletteRandomFloat(42, 62) : paletteRandomFloat(34, 54), 0.82),
      pageBg:pageBg.css,
      headerBg:cssHsl(hue, paletteRandomFloat(18, 52), appTone === 'light' ? paletteRandomFloat(86, 96) : paletteRandomFloat(4, 13), 0.94),
      controlBg:controlBg.css,
      controlBorder:cssHsl(accent2Hue, 80, appTone === 'light' ? paletteRandomFloat(42, 60) : paletteRandomFloat(48, 66), 0.48),
      filmCardBg:filmBg.css,
      filmCardBorder:filmAccent,
      showCardBg:showBg.css,
      showCardBorder:showAccent,
      chipBg:cssHsl(hue, sourceS, sourceL, appTone === 'light' ? 0.62 : 0.36),
      chipBorder:cssHsl(hue, 92, appTone === 'light' ? paletteRandomFloat(38, 54) : paletteRandomFloat(56, 72), 0.68),
      sourceBg:cssHsl(accent2Hue, sourceS, sourceL, appTone === 'light' ? 0.72 : 0.36),
      sourceBorder:cssHsl(accent2Hue, 90, appTone === 'light' ? paletteRandomFloat(34, 52) : paletteRandomFloat(56, 74), 0.62)
    }
  };
}

function applyPalette(palette=state.settings?.palette) {
  const colors = palette?.colors || {};
  const root = document.documentElement;
  const pairs = {
    '--accent':colors.accent,
    '--accent2':colors.accent2,
    '--text':colors.text,
    '--card-text':colors.cardText,
    '--surface':colors.surface,
    '--surface2':colors.surface2,
    '--border':colors.border,
    '--muted':colors.muted,
    '--muted2':colors.muted2,
    '--card-muted':colors.cardMuted,
    '--tag-bg':colors.tagBg,
    '--tag-border':colors.tagBorder,
    '--page-bg':colors.pageBg,
    '--header-bg':colors.headerBg,
    '--control-bg':colors.controlBg,
    '--control-border':colors.controlBorder,
    '--film-card-bg':colors.filmCardBg,
    '--film-card-border':colors.filmCardBorder,
    '--show-card-bg':colors.showCardBg,
    '--show-card-border':colors.showCardBorder,
    '--palette-chip-bg':colors.chipBg,
    '--palette-chip-border':colors.chipBorder,
    '--source-link-bg':colors.sourceBg,
    '--source-link-border':colors.sourceBorder
  };
  Object.entries(pairs).forEach(([name, value]) => {
    if (value) root.style.setProperty(name, value);
  });
}

function generateRandomPalette(event) {
  if (event) event.stopPropagation();
  state.settings.palette = buildRandomPalette();
  applyPalette(state.settings.palette);
  saveSettingsState();
  showToast('Random palette applied', 'success');
}

function canonicalTitle(s) {
  return String(s || '').toLowerCase().replace(/\s*\([^)]*\)\s*/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

function sameCanonicalTitle(a, b) {
  return canonicalTitle(a) && canonicalTitle(a) === canonicalTitle(b);
}

const DESCRIPTOR_STOP = new Set('a an the and or but of in on at to from into by for with without as is are was were be been being has have had he she they them his her their its it this that these those who whom whose when where while after before over under out up down about against through during between among begins begin find finds found makes make made takes take took goes go went gets get got becomes become became tells told says said later soon then however eventually meanwhile years year day night man woman boy girl young old film movie story life lives world people name named'.split(' '));
const NAME_DETECTION_STOP = new Set('The A An In On At To From Into By For With Without As After Before During Meanwhile Later Soon However Eventually When While He She They It His Her Their Its This That These Those British American Indian English Hindi London Egypt UK USA MI5 MI6 CIA FBI BBC Channel Wikipedia'.split(' '));

function tokeniseStory(text) {
  return String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
}

function detectLikelyNameTokens(text) {
  const counts = new Map();
  const multiword = new Set();
  const add = token => {
    const clean = String(token || '').replace(/[^A-Za-z'-]/g, '');
    if (!clean || clean.length < 3 || NAME_DETECTION_STOP.has(clean)) return;
    if (!/^[A-Z][a-z][A-Za-z'-]*$/.test(clean)) return;
    counts.set(clean.toLowerCase(), (counts.get(clean.toLowerCase()) || 0) + 1);
  };
  const source = String(text || '');
  source.replace(/\b([A-Z][a-z][A-Za-z'-]+(?:\s+[A-Z][a-z][A-Za-z'-]+)+)\b/g, match => {
    match.split(/\s+/).forEach(token => {
      add(token);
      const clean = String(token || '').replace(/[^A-Za-z'-]/g, '');
      if (clean && !NAME_DETECTION_STOP.has(clean)) multiword.add(clean.toLowerCase());
    });
    return match;
  });
  source.replace(/\b([A-Z][a-z][A-Za-z'-]+)\b/g, (_, word, offset) => {
    const prev = source.slice(Math.max(0, offset - 3), offset);
    if (/[.!?]\s*$/.test(prev)) return word;
    add(word);
    return word;
  });
  return new Set([...counts.entries()].filter(([token, count]) => count >= 2 || multiword.has(token)).map(([token]) => token));
}

function removeNameTokensFromWords(words, nameTokens) {
  if (!nameTokens || !nameTokens.size) return words;
  return words.filter(word => !nameTokens.has(stemCanonicalToken(word)) && !nameTokens.has(normaliseTagName(word)));
}

function phraseLooksUseful(words) {
  if (words.length < 2 || words.length > 5) return false;
  if (DESCRIPTOR_STOP.has(words[0]) || DESCRIPTOR_STOP.has(words[words.length-1])) return false;
  const useful = words.filter(w => !DESCRIPTOR_STOP.has(w) && w.length > 2);
  if (useful.length < Math.min(2, words.length)) return false;
  const phrase = words.join(' ');
  if (/^\d+$/.test(phrase)) return false;
  if (/\b(film|movie|story|life|people|years|day|night)\b$/.test(phrase)) return false;
  return true;
}

function extractRawDescriptors(text) {
  const nameTokens = detectLikelyNameTokens(text);
  const tokens = tokeniseStory(text);
  const counts = new Map();
  const firstSeen = new Map();
  for (let n = 2; n <= 5; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const words = removeNameTokensFromWords(tokens.slice(i, i+n), nameTokens);
      if (!phraseLooksUseful(words)) continue;
      const phrase = words.join(' ');
      counts.set(phrase, (counts.get(phrase) || 0) + 1);
      if (!firstSeen.has(phrase)) firstSeen.set(phrase, i);
    }
  }
  const actionWords = /\b(kills|murder|discovers|investigates|escapes|travels|betrays|rescues|kidnaps|frames|steals|falls|returns|reveals|protects|survives|learns|decides|plans|joins|fights|seeks|finds|sent|trapped|forced|accused|wrongfully|time|machine|kingdom|throne|war|battle|mission|case|conspiracy|prison|court|killer|alien|space|relationship|family|marriage|village|workplace|school|college)\b/;
  const storyAttributeWords = /\b(setting|relationship|mystery|investigation|revenge|escape|survival|conspiracy|courtroom|prison|workplace|family|marriage|friendship|identity|grief|war|space|time|village|school|college|detective|spy|mission|crime)\b/;
  const totalTokens = Math.max(1, tokens.length);
  return [...counts.entries()].map(([phrase, count]) => {
    const words = phrase.split(' ');
    const useful = words.filter(w => !DESCRIPTOR_STOP.has(w) && w.length > 2);
    const lengthScore = words.length === 2 ? 1.15 : words.length === 3 ? 1.55 : words.length === 4 ? 1.3 : 1.05;
    const positionScore = 1 + Math.max(0, 1 - (firstSeen.get(phrase) || 0) / totalTokens) * 0.35;
    const usefulRatio = useful.length / words.length;
    const repetitionScore = 1 + Math.log1p(count) * 0.65;
    let score = repetitionScore * lengthScore * positionScore * usefulRatio;
    if (actionWords.test(phrase)) score *= 1.65;
    if (storyAttributeWords.test(phrase)) score *= 1.35;
    if (words.some(w => GENERIC_TAG_TOKENS.has(stemCanonicalToken(w)))) score *= 0.72;
    return { phrase, count, score, first:firstSeen.get(phrase) || 0 };
  }).sort((a,b) => b.score - a.score || a.phrase.localeCompare(b.phrase)).slice(0, 40);
}

function descriptorCorpusStats() {
  const docCount = Math.max(1, Object.values(state.movies || {}).filter(m => m.storyText).length);
  const df = {};
  Object.values(state.movies || {}).forEach(m => {
    const raw = (m.rawDescriptors && m.rawDescriptors.length ? m.rawDescriptors : extractRawDescriptors(m.storyText || '')).map(x => typeof x === 'string' ? x : x.phrase);
    new Set(raw).forEach(p => { if (p) df[p] = (df[p] || 0) + 1; });
  });
  return { docCount, df };
}

function selectContrastiveDescriptors(raw, stats, limit=12) {
  const list = (raw || []).map(x => typeof x === 'string' ? { phrase:x, score:1, count:1 } : x).filter(x => x && x.phrase);
  const docCount = stats?.docCount || 1;
  const df = stats?.df || {};
  return list.map(x => {
    const rarity = Math.log((docCount + 1) / ((df[x.phrase] || 1) + 0.5));
    return { phrase:x.phrase, score:(x.score || 1) * Math.max(0.25, rarity) };
  }).sort((a,b) => b.score - a.score || a.phrase.localeCompare(b.phrase)).slice(0, limit).map(x => normaliseTagName(x.phrase));
}

function explicitAvoidTags(storyText='') {
  const text = String(storyText || '').toLowerCase();
  const tags = [];
  if (/\b(unresolved|ambiguous|open|anti[-\s]?climactic|cliffhanger)\s+(ending|finale|conclusion)\b/.test(text)) tags.push('ambiguous-ending');
  if (/\b(political agenda|agenda[-\s]?driven|propaganda|culture war|identity politics)\b/.test(text)) tags.push('political-agenda');
  if (/\b(preachy|didactic|message[-\s]?driven|social message|challenging norms)\b/.test(text) && /\b(patriarchy|oppression|privilege|identity|activis[mt])\b/.test(text)) tags.push('preachy-social-message');
  return tags;
}

function buildStoryTagSet(storyText, meta={}, stats=descriptorCorpusStats(), opts={}) {
  const maxTags = opts.maxTags || MAX_STORY_TAGS;
  const rawDescriptors = extractRawDescriptors(storyText || '');
  const tagMeta = opts.includeContext ? meta : { ...meta, leadText: '', categoryText: '' };
  const evidenceTags = cleanTagArray(deriveTagsFromText(storyText || '', tagMeta), meta, false)
    .filter(t => !isMetaTag(t))
    .filter(t => !LOW_CONFIDENCE_PLOT_TAGS.has(t))
    .slice(0, opts.evidenceLimit || 14);
  const tags = cleanTagArray([...explicitAvoidTags(storyText), ...evidenceTags], meta, false).slice(0, maxTags);
  return {
    rawDescriptors,
    descriptorTags: tags,
    tags,
    coreTags: tags,
    plotTags: tags,
    tagged: tags.length > 0
  };
}

function aiStoryHash(storyText='') {
  return String(stableHash(`${AI_TAG_PROMPT_VERSION}:${String(storyText || '').trim()}`));
}

function hasCurrentAiTags(movie) {
  return !!(
    movie?.aiTagging?.status === 'verified' &&
    movie.aiTagging.promptVersion === AI_TAG_PROMPT_VERSION &&
    movie.aiTagging.storyHash === aiStoryHash(movie.storyText) &&
    Array.isArray(movie.tags) &&
    movie.tags.length > 0
  );
}

function clearGeneratedTags(movie) {
  if (!movie) return;
  const suppressedTags = [...new Set((movie.suppressedTags || []).map(normaliseTagName).filter(Boolean))];
  const suppressedRawTags = [...new Set((movie.suppressedRawTags || []).map(normaliseTagName).filter(Boolean))];
  movie.tags = [];
  movie.coreTags = [];
  movie.plotTags = [];
  movie.descriptorTags = [];
  movie.rawDescriptors = [];
  movie.aiTagEvidence = {};
  movie.aiTagging = null;
  movie.tagged = false;
  movie.suppressedTags = suppressedTags;
  movie.suppressedRawTags = suppressedRawTags;
  if (movie.source === 'wikipedia' && movie.storyText) {
    movie.retagStatus = 'needs-ai-tags';
    movie.retagMessage = 'AI tags pending';
  }
}

function purgeLegacyTagsForAi() {
  if (Number(state.meta?.aiTagMigrationVersion || 0) >= AI_TAG_MIGRATION_VERSION) return false;
  const stamp = new Date().toISOString();
  Object.values(state.movies || {}).forEach(movie => { clearGeneratedTags(movie); touchRecord(movie, stamp); });
  Object.values(state.hiddenTitles || {}).forEach(movie => { clearGeneratedTags(movie); touchRecord(movie, stamp); });
  state.tagWeights = {};
  state.genreWeights = {};
  state.tagStats = { candidates:0, tags:0, rebuiltAt:'' };
  state.settings.tagPreferences = {};
  state.meta = state.meta || {};
  state.meta.aiTagMigrationVersion = AI_TAG_MIGRATION_VERSION;
  state.meta.aiTagMigrationAt = new Date().toISOString();
  return true;
}

function cleanAiTagResults(result, movie) {
  const genres = new Set((movieGenres(movie) || []).map(normaliseTagName));
  const suppressedTags = suppressedTagSet(movie);
  const evidence = {};
  const tags = [];
  (result?.tags || []).forEach(item => {
    const rawTag = normaliseTagName(item?.tag);
    const tag = rawTag;
    const confidence = Number(item?.confidence);
    const support = String(item?.evidence || '').trim().slice(0, 240);
    if (!tag || confidence < AI_TAG_MIN_CONFIDENCE || !support || genres.has(tag) || isMetaTag(tag) || suppressedTags.has(tag) || !tagAllowed(movie, tag) || !rawTagAllowed(movie, tag)) return;
    const cleaned = cleanTagArray([tag], movie, false)[0];
    if (!cleaned || tags.includes(cleaned)) return;
    tags.push(cleaned);
    evidence[cleaned] = { confidence, evidence:support };
  });
  return {tags:tags.slice(0, AI_TAG_MAX_COUNT), evidence};
}

function buildTagVocabularyCache() {
  if (tagVocabularyCache) return tagVocabularyCache;
  const frequency = new Map();
  const activeRawTags = new Set();
  Object.values(state.movies || {}).forEach(movie => {
    rawScoringTags(movie).forEach(tag => {
      activeRawTags.add(tag);
      frequency.set(tag, (frequency.get(tag) || 0) + 1);
    });
  });
  Object.values(state.hiddenTitles || {}).forEach(movie => {
    rawScoringTags(movie).forEach(tag => frequency.set(tag, (frequency.get(tag) || 0) + 1));
  });
  const entries = [...frequency.entries()];
  tagVocabularyCache = {
    activeRawCount: activeRawTags.size,
    full: entries
      .slice()
      .sort((a,b) => a[1] - b[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({tag, count})),
    sample: entries
      .slice()
      .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, AI_VOCABULARY_SAMPLE_SIZE)
      .map(([tag, count]) => ({tag, count}))
  };
  return tagVocabularyCache;
}

function aiTagVocabulary() {
  return buildTagVocabularyCache().sample;
}

function fullAiTagVocabulary() {
  return buildTagVocabularyCache().full;
}

function normaliseRewritePayload(groups={}) {
  if (Array.isArray(groups)) {
    const out = {};
    groups.forEach(group => {
      const canonical = normaliseTagName(group?.canonical || group?.tag || '');
      (group?.replace || []).forEach(source => {
        const from = normaliseTagName(source);
        if (from && canonical && from !== canonical) out[from] = canonical;
      });
    });
    return out;
  }
  return groups && typeof groups === 'object' ? groups : {};
}

function tagRewriteMap(value={}) {
  const rawVocabulary = new Set(fullAiTagVocabulary().map(item => item.tag));
  const direct = new Map();
  Object.entries(normaliseRewritePayload(value))
    .map(([from, to]) => [normaliseTagName(from), normaliseTagName(to)])
    .filter(([from, to]) => from && to && from !== to && rawVocabulary.has(from) && rawVocabulary.has(to))
    .forEach(([from, to]) => {
      if (!direct.has(from)) direct.set(from, to);
    });
  const rewrite = new Map();
  direct.forEach((to, from) => {
    const seen = new Set([from]);
    let target = to;
    while (direct.has(target) && !seen.has(target)) {
      seen.add(target);
      target = direct.get(target);
    }
    if (!seen.has(target) && target !== from) rewrite.set(from, target);
  });
  return rewrite;
}

function rewriteTagList(tags, rewrite) {
  return [...new Set((tags || [])
    .map(normaliseTagName)
    .map(tag => rewrite.get(tag) || tag)
    .filter(Boolean))];
}

function rewriteTagEvidence(evidence, rewrite) {
  const output = {};
  Object.entries(evidence || {}).forEach(([tag, value]) => {
    const canonical = rewrite.get(normaliseTagName(tag)) || normaliseTagName(tag);
    if (!canonical) return;
    const current = output[canonical];
    if (!current || Number(value?.confidence || 0) > Number(current?.confidence || 0)) output[canonical] = value;
  });
  return output;
}

function applyTagCloudRewrite(groups={}) {
  const rewrite = tagRewriteMap(groups);
  if (!rewrite.size) {
    state.legacyTagAliases = {};
    return {changedTitles:0, rewrites:0};
  }
  let changedTitles = 0;
  [...Object.values(state.movies || {}), ...Object.values(state.hiddenTitles || {})].forEach(movie => {
    const before = JSON.stringify({
      tags:movie.tags || [],
      coreTags:movie.coreTags || [],
      plotTags:movie.plotTags || [],
      descriptorTags:movie.descriptorTags || [],
      partial:movie.aiTagPartial || null,
      evidence:movie.aiTagEvidence || {},
      suppressedTags:movie.suppressedTags || [],
      suppressedRawTags:movie.suppressedRawTags || []
    });
    ['tags','coreTags','plotTags','descriptorTags'].forEach(key => {
      movie[key] = rewriteTagList(movie[key], rewrite);
    });
    if (movie.aiTagPartial) {
      movie.aiTagPartial.tags = rewriteTagList(movie.aiTagPartial.tags, rewrite);
      movie.aiTagPartial.evidence = rewriteTagEvidence(movie.aiTagPartial.evidence, rewrite);
    }
    movie.aiTagEvidence = rewriteTagEvidence(movie.aiTagEvidence, rewrite);
    movie.suppressedTags = rewriteTagList(movie.suppressedTags, rewrite);
    movie.suppressedRawTags = rewriteTagList(movie.suppressedRawTags, rewrite);
    movie.tagged = (movie.tags || []).length > 0;
    const after = JSON.stringify({
      tags:movie.tags || [],
      coreTags:movie.coreTags || [],
      plotTags:movie.plotTags || [],
      descriptorTags:movie.descriptorTags || [],
      partial:movie.aiTagPartial || null,
      evidence:movie.aiTagEvidence || {},
      suppressedTags:movie.suppressedTags || [],
      suppressedRawTags:movie.suppressedRawTags || []
    });
    if (before !== after) {
      changedTitles++;
      touchRecord(movie);
    }
  });
  const nextPreferences = {};
  Object.entries(state.settings?.tagPreferences || {}).forEach(([tag, value]) => {
    const canonical = rewrite.get(normaliseTagName(tag)) || normaliseTagName(tag);
    nextPreferences[canonical] = Math.max(-4, Math.min(4, Number(nextPreferences[canonical] || 0) + Number(value || 0)));
  });
  state.settings.tagPreferences = nextPreferences;
  if (selectedTag) selectedTag = rewrite.get(normaliseTagName(selectedTag)) || normaliseTagName(selectedTag);
  state.legacyTagAliases = {};
  invalidateTagCaches();
  return {changedTitles, rewrites:rewrite.size};
}

function migrateLegacyTagAliases() {
  if (!state.legacyTagAliases || !Object.keys(state.legacyTagAliases).length) return {changedTitles:0, rewrites:0};
  return applyTagCloudRewrite(state.legacyTagAliases);
}

function tagCloudNormalizationDue(rawCount=fullAiTagVocabulary().length) {
  const status = state.tagNormalization || {};
  if (rawCount < AI_TAG_CLOUD_NORMALIZE_EVERY) return false;
  if (status.version !== AI_TAG_CLOUD_NORMALIZE_VERSION) return true;
  return rawCount - Number(status.lastRawTagCount || 0) >= AI_TAG_CLOUD_NORMALIZE_EVERY;
}

function scheduleTagCloudNormalization(delay=1200) {
  if (
    !startupDriveRestoreDone ||
    tagCloudNormalizationTimer ||
    tagCloudNormalizationInProgress ||
    poolExpansionInProgress
  ) {
    return;
  }

  const rawCount = fullAiTagVocabulary().length;

  if (
    !tagCloudNormalizationDue(rawCount) ||
    tagCloudNormalizationAttemptedCount === rawCount
  ) {
    return;
  }

  tagCloudNormalizationTimer = setTimeout(() => {
    tagCloudNormalizationTimer = null;

    normalizeTagCloudWithAi({
      force: true,
      toast: false
    }).catch(error => {
      console.warn('Tag cloud normalization failed', error);
    });
  }, delay);
}

async function normalizeTagCloudWithAi(opts={}) {
  if (tagCloudNormalizationInProgress || poolExpansionInProgress) return false;
  const vocabulary = fullAiTagVocabulary();
  const rawCount = vocabulary.length;
  if (!opts.force && !tagCloudNormalizationDue(rawCount)) return false;
  if (!rawCount) return false;
  tagCloudNormalizationInProgress = true;
  tagCloudNormalizationAttemptedCount = rawCount;
  const wait = Math.max(0, AI_REQUEST_DELAY_MS - (Date.now() - lastAiRequestAt));
  if (wait) await abortableSleep(wait);
  lastAiRequestAt = Date.now();
  try {
    const response = await fetch(AI_TAGGER_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({
        task:'normalize-tag-cloud',
        items:[],
        normalizeVocabularyOnly:true,
        optimizeVocabulary:true,
        normalizationVersion:AI_TAG_CLOUD_NORMALIZE_VERSION,
        tagVocabulary:vocabulary,
        instructions:[
          'Review the complete CineLens tag vocabulary as a semantic normalization task.',
          'Return rewrite groups only for tags that are genuinely interchangeable.',
          'Choose the clearest existing tag in tagVocabulary as the canonical target. Never invent a new tag.',
          'Merge synonyms and equivalent phrasing such as a base idea and a redundant qualified variant when they represent the same recommendation signal.',
          'Do not merge tags merely because they share one modifier or topic word.',
          'Preserve materially different causes, actions, settings, relationships and outcomes.',
          'Be conservative: uncertain pairs must remain separate.'
        ].join(' ')
      })
    });
    if (!response.ok) throw new Error(`AI tag normalization HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.ok === false) throw new Error(payload.error || 'AI tag normalization failed');
    const groups = payload.rewriteGroups || payload.tagRewrites || {};
    const result = applyTagCloudRewrite(groups);
    state.tagNormalization = {
      version:AI_TAG_CLOUD_NORMALIZE_VERSION,
      lastRawTagCount:fullAiTagVocabulary().length,
      normalizedAt:nowStamp(),
      model:String(payload.model || ''),
      rewrittenTitles:result.changedTitles,
      rewrites:result.rewrites,
      error:''
    };
    rebuildTagBrain();
    computeTagWeights();
    saveLocalState();
    queueDriveSync();
    render();
    if (opts.toast !== false) showToast(`Gemini rewrote ${result.rewrites} tags across ${result.changedTitles} titles`, 'success');
    return result;
  } catch(error) {
    state.tagNormalization = {
      ...(state.tagNormalization || {}),
      version:AI_TAG_CLOUD_NORMALIZE_VERSION,
      error:String(error?.message || error),
      attemptedAt:nowStamp()
    };
    saveLocalState();
    if (opts.toast) showToast(`Tag normalization failed: ${error?.message || error}`, 'error');
    throw error;
  } finally {
    tagCloudNormalizationInProgress = false;
  }
}

async function consolidateTagCloud() {
  const btn = document.getElementById('normalizeTagCloudBtn');
  const maxPasses = 3;

  if (tagCloudNormalizationInProgress) {
    showToast('Tag-cloud consolidation is already running.', '');
    return;
  }

  const before = fullAiTagVocabulary().length;

  if (before < 2) {
    showToast('Add more tagged titles before consolidating the tag cloud.', '');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Consolidating...';
  }

  let totalRewrites = 0;
  let totalChangedTitles = 0;
  let completedPasses = 0;

  try {
    for (let pass = 1; pass <= maxPasses; pass++) {
      const currentCount = fullAiTagVocabulary().length;

      showFetchProgress(
        `Gemini consolidating tag cloud, pass ${pass}/${maxPasses}...`,
        35 + Math.min(55, pass * 15),
        `${currentCount} current tags`
      );

      const result = await normalizeTagCloudWithAi({
        force: true,
        toast: false
      });

      completedPasses = pass;

      const rewrites = Number(result?.rewrites || 0);
      const changedTitles = Number(result?.changedTitles || 0);

      totalRewrites += rewrites;
      totalChangedTitles += changedTitles;

      if (!rewrites || !changedTitles) {
        break;
      }

      if (pass < maxPasses) {
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    const after = fullAiTagVocabulary().length;

    showToast(
      `Tag cloud consolidated in ${completedPasses} pass${completedPasses === 1 ? '' : 'es'}: ${before} → ${after} tags, ${totalRewrites} rewrites across ${totalChangedTitles} title updates`,
      'success'
    );
  } catch (error) {
    showToast(
      `Could not consolidate tag cloud: ${error?.message || error}`,
      'error'
    );
  } finally {
    hideFetchProgress();

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Consolidate Tag Cloud';
    }
  }
}

function commitAiTagSet(movie, cleaned, model='') {
  if (cleaned.tags.length < AI_TAG_MIN_COUNT) throw new Error(`AI returned too few usable tags for ${movie.title}`);
  movie.tags = cleaned.tags;
  movie.coreTags = [...cleaned.tags];
  movie.plotTags = [...cleaned.tags];
  movie.descriptorTags = [...cleaned.tags];
  movie.rawDescriptors = [];
  movie.tagged = true;
  movie.aiTagEvidence = cleaned.evidence;
  delete movie.aiTagPartial;
  movie.aiTagging = {
    status:'verified',
    model:String(model || ''),
    promptVersion:AI_TAG_PROMPT_VERSION,
    storyHash:aiStoryHash(movie.storyText),
    completedTagCount:cleaned.tags.length,
    taggedAt:new Date().toISOString()
  };
  movie.retagStatus = 'verified';
  movie.retagMessage = '';
  touchRecord(movie);
  invalidateTagCaches();
  return movie;
}

function applyAiTagResult(movie, result, model='') {
  return commitAiTagSet(movie, cleanAiTagResults(result, movie), model);
}

function mergeAiTagPartials(previous={tags:[], evidence:{}}, next={tags:[], evidence:{}}) {
  const tags = [...new Set([...(previous.tags || []), ...(next.tags || [])])].slice(0, AI_TAG_MAX_COUNT);
  return {tags, evidence:{...(previous.evidence || {}), ...(next.evidence || {})}};
}

function aiTagFailureMessage(error, movie=null) {
  const reason = String(error?.message || error || movie?.aiTagging?.error || 'AI tagging failed');
  const partialCount = movie?.aiTagPartial?.tags?.length || 0;
  if (/daily cinelens tagging limit reached/i.test(reason)) {
    return partialCount
      ? `Daily AI limit reached · ${partialCount}/${AI_TAG_MIN_COUNT} tags saved · choose tags or retry later`
      : 'Daily AI limit reached · choose tags or retry later';
  }
  if (partialCount) return `AI built ${partialCount}/${AI_TAG_MIN_COUNT} tags · choose tags or retry`;
  if (/too few usable tags|fewer than/i.test(reason)) return `AI returned fewer than ${AI_TAG_MIN_COUNT} usable tags · choose tags or retry`;
  return `${reason} · choose tags or retry`;
}

function isAiSensitiveContentBlock(error) {
  return !!error?.cinelensSensitiveContentBlock || /PROHIBITED_CONTENT/i.test(String(error?.message || error || ''));
}

function makeAiSensitiveContentError(message='Title excluded after Gemini safety block') {
  const error = new Error(message);
  error.cinelensSensitiveContentBlock = true;
  error.cinelensTitleExcluded = true;
  return error;
}

function excludeTitleForAiSensitiveContent(movie, error) {
  if (!movie?.id || movie._aiSensitiveContentExcluded) return false;
  const stamp = nowStamp();
  const id = String(movie.id);
  const key = normaliseTitleKey(movie.wikiTitle || movie.pageTitle || movie.title) || id;
  state.wrongPicks = state.wrongPicks || {};
  state.deletedMovieRecords = state.deletedMovieRecords || {};
  state.unblockedTitleRecords = state.unblockedTitleRecords || {};
  delete state.unblockedTitleRecords[key];
  state.wrongPicks[key] = {
    id, title:movie.title || '', wikiTitle:movie.wikiTitle || '', pageTitle:movie.pageTitle || '',
    wikiPageId:movie.wikiPageId || wikiPageIdFromMovie(movie),
    reason:'ai-sensitive-content-excluded', at:stamp, updatedAt:stamp
  };
  state.deletedMovieRecords[id] = { id, titleKey:key, reason:'ai-sensitive-content-excluded', at:stamp, updatedAt:stamp };
  delete state.movies[id];
  delete state.hiddenTitles?.[id];
  movie._aiSensitiveContentExcluded = true;
  movie.aiTagging = {
    ...(movie.aiTagging || {}),
    status:'excluded',
    error:String(error?.message || error || 'Gemini safety block: PROHIBITED_CONTENT'),
    excludedAt:stamp
  };
  invalidateTagCaches();
  invalidateTasteModel();
  rebuildTagBrain();
  computeTagWeights();
  saveLocalState();
  queueDriveSync();
  return true;
}

function purgeAiSensitiveContentExclusions() {
  let removed = 0;
  [...Object.values(state.movies || {}), ...Object.values(state.hiddenTitles || {})].forEach(movie => {
    const errorText = String(movie?.aiTagging?.error || movie?.retagMessage || '');
    if (/PROHIBITED_CONTENT/i.test(errorText) && excludeTitleForAiSensitiveContent(movie, errorText)) removed++;
  });
  return removed;
}

async function requestAiTags(movies, opts={}) {
  const items = (movies || []).filter(movie => movie?.storyText).slice(0, AI_TAG_BATCH_SIZE);
  if (!items.length) return {tagged:0, failed:0};
  const savedPartials = Object.fromEntries(items
    .filter(movie => movie.aiTagPartial?.tags?.length)
    .map(movie => [String(movie.id), movie.aiTagPartial]));
  const partials = opts.partials || savedPartials;
  const wait = Math.max(0, AI_REQUEST_DELAY_MS - (Date.now() - lastAiRequestAt));
  if (wait) await abortableSleep(wait);
  if (fetchAbortRequested) throw new DOMException('Aborted', 'AbortError');
  lastAiRequestAt = Date.now();
  const response = await fetch(AI_TAGGER_URL, {
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({
      items:items.map((movie, index) => {
        const partial = partials[String(movie.id)] || {tags:[]};
        const existingTags = partial.tags || [];
        const missingTags = Math.max(0, AI_TAG_MIN_COUNT - existingTags.length);
        const continuationInstruction = existingTags.length
          ? `\n\nCINELENS TAG CONTINUATION: ${existingTags.length} grounded tags are already accepted: ${existingTags.join(', ')}. Generate at least ${missingTags} additional distinct story tags. Do not repeat, rename, or paraphrase the accepted tags.`
          : '';
        const coverageInstruction = `\n\nCINELENS COVERAGE: Return ${AI_TAG_MIN_COUNT}-${AI_TAG_MAX_COUNT} distinct, reusable recommendation tags when the narrative supports them. For a long-running series, cover the central premise, relationships, social dynamics, work or academic setting, recurring interests, character development, romance, friendship and major long-term arcs across the full supplied narrative. Evidence must come from the supplied narrative; do not return fewer tags merely because the page describes several seasons.`;
        return {
          id:movie.id,
          title:movie.title,
          year:movie.year,
          format:movie.format ? 'show' : 'movie',
          language:movie.language,
          genres:movieGenres(movie),
          storyText:`${movie.storyText}${coverageInstruction}${continuationInstruction}`,
          existingTags,
          minimumAdditionalTags:missingTags,
          excludedTags:[...new Set([...(movie.suppressedTags || []), ...(movie.suppressedRawTags || []), ...existingTags])],
          preferredTagVocabulary:index === 0 ? aiTagVocabulary().map(item => item.tag) : undefined
        };
      }),
      optimizeVocabulary:false,
      continueTagging:Object.keys(partials).length > 0,
      tagVocabulary:aiTagVocabulary(),
      minimumTags:AI_TAG_MIN_COUNT,
      maximumTags:AI_TAG_MAX_COUNT,
      retryReason:opts.retryReason || ''
    })
  });
  if (!response.ok) throw new Error(`AI tagger HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload.ok) {
    const error = new Error(payload.error || 'AI tagging failed');
    if (String(payload.code || '').toUpperCase() === 'PROHIBITED_CONTENT' || isAiSensitiveContentBlock(error)) {
      error.cinelensSensitiveContentBlock = true;
      if (items.length > 1) {
        let tagged = 0;
        let failed = 0;
        let excluded = 0;
        for (const movie of items) {
          const single = await requestAiTags([movie], {
            ...opts,
            partials:partials[String(movie.id)] ? {[String(movie.id)]:partials[String(movie.id)]} : {}
          });
          tagged += Number(single?.tagged || 0);
          failed += Number(single?.failed || 0);
          excluded += Number(single?.excluded || 0);
        }
        return {tagged, failed, excluded};
      }
      excludeTitleForAiSensitiveContent(items[0], error);
      return {tagged:0, failed:0, excluded:1};
    }
    throw error;
  }
  const byId = new Map((payload.results || []).map(result => [String(result.id), result]));
  let tagged = 0;
  let failed = 0;
  let excluded = 0;
  const retryItems = [];
  const retryPartials = {};
  items.forEach(movie => {
    try {
      const result = byId.get(String(movie.id));
      if (!result) throw new Error('AI returned no result');
      const previous = partials[String(movie.id)] || {tags:[], evidence:{}};
      const merged = mergeAiTagPartials(previous, cleanAiTagResults(result, movie));
      if (merged.tags.length >= AI_TAG_MIN_COUNT) {
        commitAiTagSet(movie, merged, payload.model);
        tagged++;
      } else {
        retryItems.push(movie);
        retryPartials[String(movie.id)] = merged;
        throw new Error(`AI has built ${merged.tags.length}/${AI_TAG_MIN_COUNT} usable tags`);
      }
    } catch(e) {
      if (!retryItems.includes(movie)) {
        retryItems.push(movie);
        retryPartials[String(movie.id)] = partials[String(movie.id)] || {tags:[], evidence:{}};
      }
      const partialCount = retryPartials[String(movie.id)]?.tags?.length || 0;
      movie.aiTagPartial = retryPartials[String(movie.id)] || {tags:[], evidence:{}};
      movie.aiTagging = {
        status:'building',
        promptVersion:AI_TAG_PROMPT_VERSION,
        storyHash:aiStoryHash(movie.storyText),
        error:String(e?.message || e),
        partialCount,
        attemptedAt:new Date().toISOString()
      };
      movie.retagStatus = 'needs-ai-tags';
      movie.retagMessage = `AI building tags ${partialCount}/${AI_TAG_MIN_COUNT}`;
      failed++;
    }
  });
  if (retryItems.length && Number(opts.retry || 0) < AI_TAG_RETRY_LIMIT) {
    const retryResult = await requestAiTags(retryItems, {
      retry:Number(opts.retry || 0) + 1,
      partials:retryPartials,
      retryReason:`Continue the existing tag sets. Add at least the requested minimumAdditionalTags for each title. Return only new, distinct, story-grounded tags; do not repeat existingTags or excludedTags.`
    });
    tagged += retryResult.tagged;
    failed = Math.max(0, failed - retryResult.tagged);
  }
  return {tagged, failed, excluded};
}

async function applyAiTags(movie, opts={}) {
  if (!movie?.storyText) return movie;
  if (!opts.force && hasCurrentAiTags(movie)) return movie;
  if (opts.force) delete movie.aiTagPartial;
  await requestAiTags([movie]);
  if (movie._aiSensitiveContentExcluded) throw makeAiSensitiveContentError();
  if (!hasCurrentAiTags(movie)) throw new Error(movie.aiTagging?.error || 'AI returned no usable tags');
  return movie;
}

function completeAiBatch(priorityMovies=[]) {
  const batch = [];
  const seen = new Set();
  const add = movie => {
    if (!movie?.id || !movie.storyText || seen.has(String(movie.id)) || batch.length >= AI_TAG_BATCH_SIZE) return;
    seen.add(String(movie.id));
    batch.push(movie);
  };
  priorityMovies.forEach(add);
  aiTagCandidates().forEach(add);
  return batch;
}

function meaningfulTagCount(movie) { return rawScoringTags(movie).length; }

function migrateLegacyPoolItems() {
  Object.values(state.movies || {}).forEach(m => {
    if (m.source === 'wikipedia') return;
    m.source = 'legacy';
    m.tags = [];
    m.coreTags = [];
    m.plotTags = [];
    m.descriptorTags = [];
    m.rawDescriptors = [];
    m.tagged = false;
    m.needsManualUrl = false;
    m.retagStatus = 'needs-refresh';
    m.retagMessage = 'automatic Wikipedia refresh pending';
  });
}

function rebuildDescriptorBrain() {
  let changed = 0;
  [...Object.values(state.movies || {}), ...Object.values(state.hiddenTitles || {})].forEach(m => {
    const before = JSON.stringify({tags:m.tags||[], coreTags:m.coreTags||[], plotTags:m.plotTags||[], descriptorTags:m.descriptorTags||[], tagged:m.tagged});
    if (hasCurrentAiTags(m)) {
      m.tags = cleanTagArray(m.tags || [], m, false);
      m.coreTags = [...m.tags];
      m.plotTags = [...m.tags];
      m.descriptorTags = [...m.tags];
      m.rawDescriptors = [];
      m.tagged = m.tags.length > 0;
      m.needsManualUrl = false;
      if (!m.wikiUrl && (m.wikiTitle || m.pageTitle)) m.wikiUrl = wikiUrlFromTitle(m.wikiTitle || m.pageTitle);
      if (!m.wikiPageId && String(m.id || '').startsWith('wiki_')) m.wikiPageId = String(m.id).replace(/^wiki_/, '');
      if (!m.wikiTitle && m.pageTitle) m.wikiTitle = m.pageTitle;
      if (!m.pageTitle && m.wikiTitle) m.pageTitle = m.wikiTitle;
    } else if (m.source === 'wikipedia' && m.storyText) {
      clearGeneratedTags(m);
    } else if (m.source !== 'wikipedia') {
      m.source = 'legacy';
      clearGeneratedTags(m);
      m.needsManualUrl = false;
      m.retagStatus = 'needs-refresh';
      m.retagMessage = 'automatic Wikipedia refresh pending';
    }
    const after = JSON.stringify({tags:m.tags||[], coreTags:m.coreTags||[], plotTags:m.plotTags||[], descriptorTags:m.descriptorTags||[], tagged:m.tagged});
    if (before !== after) changed++;
  });
  return changed;
}

function cleanContaminatedTags(silent=true) {
  migrateLegacyPoolItems();
  const purged = purgeLegacyTagsForAi();
  const changed = rebuildDescriptorBrain() + rebuildTagBrain() + (purged ? 1 : 0);
  computeTagWeights();
  if (changed) saveLocalState();
  if (purged) queueDriveSync();
  if (changed && !silent) showToast(purged ? 'Cleared legacy tags. AI rebuild ready.' : `Cleaned tag data on ${changed} titles`, 'success');
  return changed;
}

function runStartupMaintenance() {
  const run = () => {
    try {
      const removedHindiShows = purgeDisallowedHindiShows();
      const removedConventionalHorror = purgeDisallowedConventionalHorror();
      const excludedSensitiveTitles = purgeAiSensitiveContentExclusions();
      const addedAtMigrated = ensureAddedAtMetadata();
      const ratedAtMigrated = ensureRatedAtMetadata();
      const retiredWatchlist = retireWatchlistForRecentlyAdded();
      const changed = cleanContaminatedTags(true);
      const rotation = pruneRollingCandidatePool({reason:'startup'});
      if (removedHindiShows || removedConventionalHorror || excludedSensitiveTitles || addedAtMigrated || ratedAtMigrated || retiredWatchlist || changed || rotation.evicted) {
        saveLocalState();
        queueDriveSync();
        render();
      }
    } catch (err) {
      console.error('Startup maintenance failed', err);
    }
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, {timeout: 1500});
  } else {
    setTimeout(run, 50);
  }
}


// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
function libraryRecordCount(dataset=state) {
  return Object.keys(dataset?.movies || {}).length + Object.keys(dataset?.hiddenTitles || {}).length;
}

function ratedTitleCount(dataset=state) {
  return Object.values(dataset?.movies || {}).filter(movie => Number(movie?.rating || 0) > 0).length;
}

function finalizeStartupAfterDrive({allowCollection=false}={}) {
  if (startupFinalized) return;
  startupFinalized = true;
  startupDriveRestoreDone = true;
  libraryWritesUnlocked = !!allowCollection;

  // Maintenance can rewrite stored data, so it must follow the Drive decision.
  if (libraryWritesUnlocked) {
    const migratedWrongPicks = migrateVisibleWrongPicks();
    const migratedAliases = migrateLegacyTagAliases();
    const purgedTags = purgeLegacyTagsForAi();
    if (migratedWrongPicks || purgedTags || migratedAliases.rewrites) {
      rebuildTagBrain();
      computeTagWeights();
      saveLocalState();
      queueDriveSync();
    }
    runStartupMaintenance();
    scheduleTagCloudNormalization(1800);
    scheduleReceptionBackfill(4500);
  }

  render();
  if (libraryWritesUnlocked && Object.keys(state.movies).length < 50) {
    scheduleAutoExpand(800);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  renderAppVersion();
  loadLocalState();
  applyPalette();
  await loadIndexedDbState();
  // Import a legacy localStorage library once, then remove its large payload only
  // after the IndexedDB write has been queued.
  if (libraryRecordCount() > 0) queueIndexedDbSave(0);
  const startupRemovedHindiShows = purgeDisallowedHindiShows();
  const startupRemovedConventionalHorror = purgeDisallowedConventionalHorror();
  const startupAddedAtMigrated = ensureAddedAtMetadata();
  const startupRatedAtMigrated = ensureRatedAtMetadata();
  const startupRetiredWatchlist = retireWatchlistForRecentlyAdded();
  if (startupRemovedHindiShows || startupRemovedConventionalHorror || startupAddedAtMigrated || startupRatedAtMigrated || startupRetiredWatchlist) saveLocalState({preserveUpdatedAt:true});
  startupInitialLibraryPresent = libraryRecordCount() > 0;
  recVisibleLimit = Math.max(REC_INFINITE_PAGE_SIZE, parseInt(state.settings.topN || 10));
  // A Drive-enabled device must not treat a catalogue-only cache as a usable
  // personal library. The authoritative profile is restored before normal UI
  // work and collection are unlocked below.
  if (!state.drive.enabled || ratedTitleCount() > 0) render();

  // A previously connected browser may restore silently. A new browser remains
  // read-only until the user taps Drive, so it cannot manufacture a newer local
  // dataset before Drive is checked.
  let restored = false;
  try {
    // Startup restore is authoritative: Drive must populate this browser before
    // timestamp-based merging or background collection is allowed.
    restored = await restoreDriveSession(false, {preferDrive:true});
  } catch (error) {
    console.warn('Drive startup restore failed', error);
  }
  // Until Drive has been checked, a browser-local starter/partial library has no
  // authority to start collection. Existing offline-only libraries can still run
  // when Drive was never enabled on that browser.
  finalizeStartupAfterDrive({allowCollection: restored || (!state.drive.enabled && startupInitialLibraryPresent)});
  window.addEventListener('scroll', handleScroll);
});

// ─────────────────────────────────────────────
// SEED (hardcoded starter pack — always present)
// ─────────────────────────────────────────────
const SEED = [
  {id:'tt0111161',title:'The Shawshank Redemption',year:1994,director:'Frank Darabont',language:'English',country:'USA'},
  {id:'tt0068646',title:'The Godfather',year:1972,director:'Francis Ford Coppola',language:'English',country:'USA'},
  {id:'tt0468569',title:'The Dark Knight',year:2008,director:'Christopher Nolan',language:'English',country:'USA'},
  {id:'tt0137523',title:'Fight Club',year:1999,director:'David Fincher',language:'English',country:'USA'},
  {id:'tt0816692',title:'Interstellar',year:2014,director:'Christopher Nolan',language:'English',country:'USA'},
  {id:'tt1375666',title:'Inception',year:2010,director:'Christopher Nolan',language:'English',country:'USA'},
  {id:'tt0110912',title:'Pulp Fiction',year:1994,director:'Quentin Tarantino',language:'English',country:'USA'},
  {id:'tt0133093',title:'The Matrix',year:1999,director:'The Wachowskis',language:'English',country:'USA'},
  {id:'tt0114369',title:'Se7en',year:1995,director:'David Fincher',language:'English',country:'USA'},
  {id:'tt0102926',title:'The Silence of the Lambs',year:1991,director:'Jonathan Demme',language:'English',country:'USA'},
  {id:'tt0317248',title:'City of God',year:2002,director:'Fernando Meirelles',language:'English',country:'Brazil'},
  {id:'tt0482571',title:'The Prestige',year:2006,director:'Christopher Nolan',language:'English',country:'USA'},
  {id:'tt0209144',title:'Memento',year:2000,director:'Christopher Nolan',language:'English',country:'USA'},
  {id:'tt2267998',title:'Gone Girl',year:2014,director:'David Fincher',language:'English',country:'USA'},
  {id:'tt1291584',title:'Prisoners',year:2013,director:'Denis Villeneuve',language:'English',country:'USA'},
  {id:'tt6751668',title:'Parasite',year:2019,director:'Bong Joon-ho',language:'English',country:'South Korea'},
  {id:'tt2582802',title:'Whiplash',year:2014,director:'Damien Chazelle',language:'English',country:'USA'},
  {id:'tt0816711',title:'Arrival',year:2016,director:'Denis Villeneuve',language:'English',country:'USA'},
  {id:'tt0364569',title:'Oldboy',year:2003,director:'Park Chan-wook',language:'English',country:'South Korea'},
  {id:'tt0338013',title:'Eternal Sunshine of the Spotless Mind',year:2004,director:'Michel Gondry',language:'English',country:'USA'},
  {id:'tt0172495',title:'Gladiator',year:2000,director:'Ridley Scott',language:'English',country:'USA'},
  {id:'tt0120689',title:'The Green Mile',year:1999,director:'Frank Darabont',language:'English',country:'USA'},
  {id:'tt1853728b',title:'Django Unchained',year:2012,director:'Quentin Tarantino',language:'English',country:'USA'},
  {id:'tt0120586',title:'American History X',year:1998,director:'Tony Kaye',language:'English',country:'USA'},
  {id:'tt1853728c',title:'Blade Runner 2049',year:2017,director:'Denis Villeneuve',language:'English',country:'USA'},
  {id:'tt0047478',title:'Seven Samurai',year:1954,director:'Akira Kurosawa',language:'English',country:'Japan'},
  {id:'tt0087843',title:'Once Upon a Time in America',year:1984,director:'Sergio Leone',language:'English',country:'USA'},
  {id:'tt0253474',title:'The Pianist',year:2002,director:'Roman Polanski',language:'English',country:'Poland'},
  {id:'tt0405094',title:'The Lives of Others',year:2006,director:'Florian Henckel',language:'English',country:'Germany'},
  {id:'tt0050083',title:'12 Angry Men',year:1957,director:'Sidney Lumet',language:'English',country:'USA'},
  // Hindi
  {id:'in001',title:'Sholay',year:1975,director:'Ramesh Sippy',language:'Hindi',country:'India'},
  {id:'in002',title:'Dil Chahta Hai',year:2001,director:'Farhan Akhtar',language:'Hindi',country:'India'},
  {id:'in003',title:'Lagaan',year:2001,director:'Ashutosh Gowariker',language:'Hindi',country:'India'},
  {id:'in004',title:'3 Idiots',year:2009,director:'Rajkumar Hirani',language:'Hindi',country:'India'},
  {id:'in005',title:'Gangs of Wasseypur',year:2012,director:'Anurag Kashyap',language:'Hindi',country:'India'},
  {id:'in006',title:'Andhadhun',year:2018,director:'Sriram Raghavan',language:'Hindi',country:'India'},
  {id:'in007',title:'Tumbbad',year:2018,director:'Rahi Barve',language:'Hindi',country:'India'},
  {id:'in008',title:'Article 15',year:2019,director:'Anubhav Sinha',language:'Hindi',country:'India'},
  {id:'in009',title:'Masaan',year:2015,director:'Neeraj Ghaywan',language:'Hindi',country:'India'},
  {id:'in010',title:'Dangal',year:2016,director:'Nitesh Tiwari',language:'Hindi',country:'India'},
  {id:'in011',title:'Rang De Basanti',year:2006,director:'Rakeysh Mehra',language:'Hindi',country:'India'},
  {id:'in012',title:'Taare Zameen Par',year:2007,director:'Aamir Khan',language:'Hindi',country:'India'},
  {id:'in013',title:'Raazi',year:2018,director:'Meghna Gulzar',language:'Hindi',country:'India'},
  {id:'in014',title:'Pink',year:2016,director:'Aniruddha Roy Chowdhury',language:'Hindi',country:'India'},
  {id:'in015',title:'Kahaani',year:2012,director:'Sujoy Ghosh',language:'Hindi',country:'India'},
  // Shows
  {id:'tv001',title:'Breaking Bad',year:2008,director:'Vince Gilligan',language:'English',country:'USA',format:'series'},
  {id:'tv002',title:'Chernobyl',year:2019,director:'Johan Renck',language:'English',country:'UK',format:'miniseries'},
  {id:'tv003',title:'True Detective S1',year:2014,director:'Cary Fukunaga',language:'English',country:'USA',format:'series'},
  {id:'tv004',title:'Succession',year:2018,director:'Jesse Armstrong',language:'English',country:'USA',format:'series'},
  {id:'tv005',title:'The Wire',year:2002,director:'David Simon',language:'English',country:'USA',format:'series'},
  {id:'tv006',title:'Mindhunter',year:2017,director:'David Fincher',language:'English',country:'USA',format:'series'},
  {id:'tv007',title:'Dark',year:2017,director:'Baran bo Odar',language:'English',country:'Germany',format:'series'},
  {id:'tv008',title:'Scam 1992',year:2020,director:'Hansal Mehta',language:'Hindi',country:'India',format:'series'},
  {id:'tv009',title:'Mirzapur',year:2018,director:'Karan Anshuman',language:'Hindi',country:'India',format:'series'},
  {id:'tv010',title:'Panchayat',year:2020,director:'Deepak Kumar Mishra',language:'Hindi',country:'India',format:'series'},
  {id:'tv011',title:'Sacred Games',year:2018,director:'Anurag Kashyap',language:'Hindi',country:'India',format:'series'},
  {id:'tv012',title:'Peaky Blinders',year:2013,director:'Steven Knight',language:'English',country:'UK',format:'series'},
  {id:'tv013',title:'The Sopranos',year:1999,director:'David Chase',language:'English',country:'USA',format:'series'},
  {id:'tv014',title:'Band of Brothers',year:2001,director:'Steven Spielberg',language:'English',country:'USA',format:'miniseries'},
  {id:'tv015',title:'Severance',year:2022,director:'Ben Stiller',language:'English',country:'USA',format:'series'},
];

function seedPool() {
  // Seeds disabled: fetched Wikipedia items only. Existing legacy seed items are preserved but not rehydrated.
}


// ─────────────────────────────────────────────
// WIKIPEDIA POOL EXPANSION
// ─────────────────────────────────────────────
function normaliseTitleKey(title) {
  return (title||'').replace(/^Category:/,'').replace(/\s+\(.*?\)$/,'').trim().toLowerCase();
}

function movieIdentityKeys(movie) {
  if (!movie) return [];
  const keys = new Set();
  const pageId = wikiPageIdFromMovie(movie);
  if (pageId) keys.add(`page:${pageId}`);
  const format = movie.format || 'movie';
  const year = movie.year || '';
  [movie.title, movie.wikiTitle, movie.pageTitle].forEach(title => {
    const key = normaliseTitleKey(title);
    if (key) keys.add(`title:${key}|${year}|${format}`);
  });
  return [...keys];
}

function sameMovieIdentity(a, b) {
  const bKeys = new Set(movieIdentityKeys(b));
  return movieIdentityKeys(a).some(key => bKeys.has(key));
}

function findExistingMovieByIdentity(movie, collection=state.movies) {
  return Object.values(collection || {}).find(existing => sameMovieIdentity(existing, movie));
}

function mergeUserState(target, source) {
  if (!target || !source) return target;
  if (!Number(target.rating || 0) && Number(source.rating || 0)) {
    target.rating = Number(source.rating || 0);
    if (source.ratedAt && !target.ratedAt) target.ratedAt = source.ratedAt;
  }
  if (source.watchlist) target.watchlist = true;
  if (source.manualAdded) target.manualAdded = true;
  if (source.skipped) target.skipped = true;
  if (!target.userNotes && source.userNotes) target.userNotes = source.userNotes;
  target.suppressedTags = [...new Set([...(target.suppressedTags || []), ...(source.suppressedTags || [])])];
  target.suppressedRawTags = [...new Set([...(target.suppressedRawTags || []), ...(source.suppressedRawTags || [])])];
  return target;
}

function ratingTimestamp(movie) {
  return Date.parse(movie?.ratedAt || '') || 0;
}

function legacyRatingTimestamp(movie) {
  return movie?._updatedAt || movie?.updatedAt || movie?.addedAt || movie?.fetchedAt || movie?.createdAt || '';
}

function ensureRatedAtMetadata() {
  let changed = 0;
  Object.values(state.movies || {}).forEach(movie => {
    if (Number(movie?.rating || 0) <= 0 || movie.ratedAt) return;
    const stamp = legacyRatingTimestamp(movie);
    if (!stamp) return;
    movie.ratedAt = stamp;
    changed++;
  });
  return changed;
}

function movieAddedTime(movie) {
  return Date.parse(movie?.addedAt || movie?.fetchedAt || movie?.createdAt || movie?._updatedAt || movie?.updatedAt || '') || 0;
}

function ensureAddedAtMetadata() {
  let changed = 0;
  const stamp = nowStamp();
  Object.values(state.movies || {}).forEach(movie => {
    if (movie?.addedAt) return;
    movie.addedAt = movie?.fetchedAt || movie?.createdAt || movie?._updatedAt || movie?.updatedAt || stamp;
    changed++;
  });
  return changed;
}

function retireWatchlistForRecentlyAdded() {
  let changed = 0;
  Object.values(state.movies || {}).forEach(movie => {
    if (!movie?.watchlist) return;
    // The old watchlist becomes a normal retained title rather than being lost.
    // manualAdded protects it from rolling-pool eviction after its watchlist flag is retired.
    movie.watchlist = false;
    movie.manualAdded = true;
    touchRecord(movie);
    changed++;
  });
  return changed;
}

function normaliseFetchedWikiMovie(movie, previous=null) {
  if (!movie) return null;
  const next = { ...movie };
  next.addedAt = previous?.addedAt || next.addedAt || next.fetchedAt || next.createdAt || nowStamp();
  next.source = 'wikipedia';
  next.wikiVerified = true;
  next.needsManualUrl = false;
  next.retagStatus = 'verified';
  next.retagMessage = '';
  next.wikiPageId = next.wikiPageId || previous?.wikiPageId || wikiPageIdFromMovie(next) || wikiPageIdFromMovie(previous);
  next.wikiTitle = next.wikiTitle || next.pageTitle || previous?.wikiTitle || previous?.pageTitle || next.title;
  next.pageTitle = next.pageTitle || next.wikiTitle;
  next.wikiUrl = next.wikiUrl || wikiUrlForMovie(next) || wikiUrlForMovie(previous);
  next.tags = cleanTagArray(next.tags || next.coreTags || next.plotTags || next.descriptorTags || [], next, false);
  next.coreTags = cleanTagArray(next.coreTags && next.coreTags.length ? next.coreTags : next.tags, next, false);
  next.plotTags = cleanTagArray(next.plotTags && next.plotTags.length ? next.plotTags : next.tags, next, false);
  next.descriptorTags = cleanTagArray(next.descriptorTags && next.descriptorTags.length ? next.descriptorTags : next.tags, next, false);
  next.tagged = !!(next.tags.length || next.coreTags.length || next.plotTags.length || next.descriptorTags.length);
  next.reception = normaliseReceptionRecord(next.reception);
  next.retagStatus = next.tagged ? 'verified' : 'needs-ai-tags';
  next.retagMessage = next.tagged ? '' : 'AI tags pending';
  return next;
}

function normaliseReceptionRecord(reception=null) {
  if (!reception || typeof reception !== 'object') return null;
  return {
    version:Number(reception.version || 0) || 0,
    present:!!reception.present,
    rtScore:reception.rtScore == null ? null : clamp(Number(reception.rtScore), 0, 100),
    rtCount:reception.rtCount == null ? null : Math.max(0, parseInt(reception.rtCount, 10) || 0),
    mcScore:reception.mcScore == null ? null : clamp(Number(reception.mcScore), 0, 100),
    mcCount:reception.mcCount == null ? null : Math.max(0, parseInt(reception.mcCount, 10) || 0),
    consensus:['acclaimed','positive','mixed','negative'].includes(reception.consensus) ? reception.consensus : '',
    praise:[...new Set((reception.praise || []).filter(facet => ['acting','direction','writing','dialogue','pacing','editing','coherence'].includes(facet)))],
    criticism:[...new Set((reception.criticism || []).filter(facet => ['acting','direction','writing','dialogue','pacing','editing','coherence','melodrama'].includes(facet)))],
    qualitySignal:clamp(Number(reception.qualitySignal || 0), -1, 1),
    strength:clamp(Number(reception.strength || 0), 0, 1),
    parsedAt:reception.parsedAt || ''
  };
}

function normaliseStoredTitleRecord(movie) {
  if (!movie) return movie;
  if (!movie.wikiPageId && String(movie.id || '').startsWith('wiki_')) {
    movie.wikiPageId = String(movie.id).replace(/^wiki_/, '');
  }
  if (!movie.wikiUrl && (movie.wikiTitle || movie.pageTitle)) movie.wikiUrl = wikiUrlFromTitle(movie.wikiTitle || movie.pageTitle);
  if (!movie.wikiTitle && movie.pageTitle) movie.wikiTitle = movie.pageTitle;
  if (!movie.pageTitle && movie.wikiTitle) movie.pageTitle = movie.wikiTitle;
  const correctedFormat = inferPageFormat(movie.wikiTitle || movie.pageTitle || movie.title, movie.leadText || '', String(movie.categoryText || '').split(' category:').filter(Boolean).map(value => value.startsWith('category:') ? value : `category:${value}`));
  if (correctedFormat.strong) movie.format = correctedFormat.format;

  const isWikiRecord = movie.source === 'wikipedia' || !!movie.storyText || !!movie.wikiPageId || !!movie.wikiUrl;
  if (isWikiRecord && movie.storyText) {
    movie.source = 'wikipedia';
    movie.wikiVerified = true;
    movie.tags = cleanTagArray(movie.tags || movie.coreTags || movie.plotTags || movie.descriptorTags || [], movie, false);
    movie.coreTags = cleanTagArray(movie.coreTags && movie.coreTags.length ? movie.coreTags : movie.tags, movie, false);
    movie.plotTags = cleanTagArray(movie.plotTags && movie.plotTags.length ? movie.plotTags : movie.tags, movie, false);
    movie.descriptorTags = cleanTagArray(movie.descriptorTags && movie.descriptorTags.length ? movie.descriptorTags : movie.tags, movie, false);
    movie.tagged = !!(movie.tags.length || movie.coreTags.length || movie.plotTags.length || movie.descriptorTags.length);
    movie.reception = normaliseReceptionRecord(movie.reception);
    if (movie.tagged || movie.wikiUrl || movie.wikiPageId) {
      movie.needsManualUrl = false;
      if (movie.retagStatus === 'failed' || movie.retagStatus === 'needs-url') {
        movie.retagStatus = 'verified';
        movie.retagMessage = '';
      }
    }
  } else if (isWikiRecord) {
    movie.source = 'wikipedia';
    movie.tags = cleanTagArray(movie.tags || movie.coreTags || movie.plotTags || movie.descriptorTags || [], movie, false);
    movie.coreTags = cleanTagArray(movie.coreTags && movie.coreTags.length ? movie.coreTags : movie.tags, movie, false);
    movie.plotTags = cleanTagArray(movie.plotTags || [], movie, false);
    movie.descriptorTags = cleanTagArray(movie.descriptorTags || [], movie, false);
    movie.tagged = !!(movie.tags.length || movie.coreTags.length || movie.plotTags.length || movie.descriptorTags.length);
    movie.reception = normaliseReceptionRecord(movie.reception);
    movie.needsManualUrl = true;
    if (!movie.retagStatus || movie.retagStatus === 'verified') movie.retagStatus = 'needs-refresh';
    if (!movie.retagMessage) movie.retagMessage = 'needs Wikipedia refresh';
  } else if (!isWikiRecord) {
    movie.source = 'legacy';
    movie.tags = [];
    movie.coreTags = [];
    movie.plotTags = [];
    movie.descriptorTags = [];
    movie.rawDescriptors = [];
    movie.tagged = false;
    movie.needsManualUrl = false;
    movie.retagStatus = 'needs-refresh';
    movie.retagMessage = 'automatic Wikipedia refresh pending';
  }
  return movie;
}

function upsertMoviePreservingUserState(fresh, existing=null) {
  const previous = existing || state.movies?.[fresh?.id] || findExistingMovieByIdentity(fresh);
  const normalised = normaliseFetchedWikiMovie(fresh, previous);
  const next = previous ? mergeUserState(normalised, previous) : normalised;
  if (!next) return null;
  touchRecord(next);
  if (previous?.id && previous.id !== next.id) {
    delete state.movies[previous.id];
    state.deletedMovieRecords = state.deletedMovieRecords || {};
    state.deletedMovieRecords[previous.id] = { id:previous.id, replacementId:next.id, at:next._updatedAt, updatedAt:next._updatedAt };
  }
  state.movies[next.id] = next;
  return next;
}

function collapseDuplicateMovies(collection=state.movies) {
  const map = collection || {};
  const byIdentity = new Map();
  let changed = false;
  const keepScore = movie => (movie.tagged ? 100 : 0)
    + (!movie.needsManualUrl ? 50 : 0)
    + (movie.storyText ? 25 : 0)
    + (movie.wikiPageId || String(movie.id || '').startsWith('wiki_') ? 10 : 0)
    + (Number(movie.rating || 0) > 0 ? 5 : 0);
  Object.entries(map).forEach(([id, movie]) => {
    const keys = movieIdentityKeys(movie);
    const existingId = keys.map(key => byIdentity.get(key)).find(Boolean);
    if (!existingId || existingId === id) {
      keys.forEach(key => byIdentity.set(key, id));
      return;
    }
    const existing = map[existingId];
    if (!existing) return;
    const keepId = keepScore(movie) > keepScore(existing) ? id : existingId;
    const dropId = keepId === id ? existingId : id;
    const keep = map[keepId];
    const drop = map[dropId];
    mergeUserState(keep, drop);
    if (recordTimestamp(drop) > recordTimestamp(keep)) touchRecord(keep, recordTimestamp(drop) ? drop._updatedAt || drop.updatedAt : undefined);
    delete map[dropId];
    keys.forEach(key => byIdentity.set(key, keepId));
    movieIdentityKeys(keep).forEach(key => byIdentity.set(key, keepId));
    changed = true;
  });
  return changed;
}

function obviousNonMovieTitle(title) {
  const value = String(title || '').trim();
  // Treat only actual Wikipedia list/namespace pages as non-title pages.
  // A normal title may legitimately contain words such as “List”, “Timeline”
  // or “Universe” (for example, The Bucket List) and must not be rejected.
  return /^(?:list of|category:|template:|wikipedia:|portal:)/i.test(value)
    || /^(?:filmography|discography|soundtrack)\s*(?:of|:)\b/i.test(value);
}

function isFranchiseOverviewPage(pageTitle, extract, cats=[], opts={}) {
  // A pasted Wikipedia URL is an explicit request for that page. Keep the
  // actual content/type/language checks below, but do not reject it merely
  // because a broad title heuristic thinks a word in its title looks generic.
  if (!opts.directLink && obviousNonMovieTitle(pageTitle)) return true;
  const lead = String(extract || '').slice(0, 700);
  if (!opts.directLink && /\b(film series|media franchise|shared universe)\b/i.test(pageTitle)) return true;
  if ((cats || []).some(categoryMarksOverviewPage)) return true;
  return /^\s*.+\s+is an? (?:American |British |Indian |English-language |Hindi-language )?(?:media franchise|film series|shared universe)\b/i.test(lead);
}

function categoryMarksOverviewPage(category) {
  const cat = String(category || '').toLowerCase();
  return /^category:(film series|media franchises|fictional universes)\b/.test(cat)
    || /^category:.*(?:media franchise|fictional universe) articles\b/.test(cat);
}

function isPersonOrOrganizationPage(pageTitle, leadText, cats=[]) {
  const title = String(pageTitle || '');
  const lead = String(leadText || '').slice(0, 900);
  const catText = (cats || []).join(' ');
  const personLead = /^\s*.+\s+is an? .{0,90}\b(actor|actress|director|producer|screenwriter|writer|filmmaker|composer|singer|politician|business(?:man|woman)|executive)\b/i.test(lead);
  const organizationLead = /^\s*.+\s+is an? .{0,90}\b(company|studio|organization|organisation|network|channel|label|agency)\b/i.test(lead);
  if (personLead || organizationLead) return true;
  if (/\bcategory:(?:\d{4} births|\d{4} deaths|living people|people from|.* alumni)\b/i.test(catText)) return true;
  if (/\bcategory:.*(?:film directors|screenwriters|film producers|television producers|chief executives|founders)\b/i.test(catText) && !/\((?:film|tv series|television series|miniseries|web series)\)$/i.test(title)) return true;
  if (/\bcategory:.*(?:companies established|film production companies|television production companies|entertainment companies|organizations established|organisations established|television networks|television channels|record labels|talent agencies)\b/i.test(catText) && !/\btelevision series\b/i.test(catText)) return true;
  if (!/\((?:film|tv series|television series|miniseries|web series)\)$/i.test(title) && /\b(biography|filmography)\b/i.test(catText)) return true;
  return false;
}

function stripWikiMarkup(value='') {
  let text = String(value || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<ref[\s\S]*?<\/ref\s*>/gi, ' ')
    .replace(/<ref[^>]*\/>/gi, ' ')
    // Preserve content from common multiline infobox wrappers.
    .replace(/\{\{\s*(?:plainlist|flatlist|ubl|unbulleted list|hlist|nowrap)\s*\|/gi, ' ')
    .replace(/\{\{\s*lang(?:ue)?\s*\|[^|{}]+\|([^{}]+)\}\}/gi, '$1')
    .replace(/\{\{\s*(?:small|nowrap|nobr|color|flagicon)\s*\|([^{}]+)\}\}/gi, '$1');

  let previous = '';
  while (previous !== text) {
    previous = text;
    text = text.replace(/\{\{[^{}]*\}\}/g, ' ');
  }

  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'''[^']*'''/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[{}]/g, ' ')
    .replace(/^\s*[*•]+\s*/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function infoboxField(wikitext='', fieldName='') {
  const text = String(wikitext || '');
  if (!text || !fieldName) return '';
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`\\|\\s*${escaped}\\s*=`, 'i').exec(text);
  if (!match) return '';

  // Fields such as Language are often {{plainlist}} blocks spanning multiple
  // lines. Stop only at the next top-level infobox parameter.
  let i = match.index + match[0].length;
  let templateDepth = 0;
  let linkDepth = 0;
  let value = '';
  for (; i < text.length; i++) {
    const pair = text.slice(i, i + 2);
    if (pair === '{{') { templateDepth++; value += pair; i++; continue; }
    if (pair === '}}' && templateDepth > 0) { templateDepth--; value += pair; i++; continue; }
    if (pair === '[[') { linkDepth++; value += pair; i++; continue; }
    if (pair === ']]' && linkDepth > 0) { linkDepth--; value += pair; i++; continue; }
    if (text[i] === '\n' && templateDepth === 0 && linkDepth === 0 && /^\s*\|\s*[A-Za-z][^=\n]{0,80}=/.test(text.slice(i + 1))) break;
    value += text[i];
  }
  return stripWikiMarkup(value);
}

function infoboxMediaInfo(wikitext='') {
  const text = String(wikitext || '');
  const head = text.slice(0, 18000);
  const kind = (head.match(/\{\{\s*infobox\s*([^\n|}]+)/i) || [])[1] || '';
  const normalizedKind = stripWikiMarkup(kind).toLowerCase();
  const language = infoboxField(head, 'language');
  const country = infoboxField(head, 'country');
  const type = /\b(film|movie)\b/.test(normalizedKind) ? 'film'
    : /\b(television|tv|web series|series|miniseries|show|program)\b/.test(normalizedKind) ? 'show'
    : '';
  return {type, language, country, rawKind:normalizedKind};
}

function explicitDisallowedLanguageEvidence(cats=[], leadText='', infoboxLanguage='') {
  const other = '(?:afrikaans|arabic|bengali|cantonese|chinese|danish|dutch|french|german|greek|gujarati|hebrew|italian|japanese|kannada|korean|malayalam|mandarin|marathi|persian|polish|portuguese|punjabi|russian|spanish|tamil|telugu|thai|turkish|urdu|vietnamese)';
  const categoryText = (cats || []).join(' ').toLowerCase();
  const infoboxText = String(infoboxLanguage || '').toLowerCase();
  const lead = String(leadText || '').toLowerCase();

  // Do not scan every Wikipedia category for a bare language word. Article
  // pages often carry hidden citation/maintenance categories such as
  // “CS1 Italian-language sources”, which describe a reference, not the title.
  const languageCategory = new RegExp(
    `\bcategory:(?:\d{4} )?${other}-language (?:films?|television|tv|web|series|shows?|miniseries)\b`,
    'i'
  );
  const languageLead = new RegExp(
    `\b${other}-language (?:film|television series|tv series|web series|miniseries|show)\b`,
    'i'
  );
  const namedInfoboxLanguage = new RegExp(`\b${other}\b`, 'i');

  return languageCategory.test(categoryText)
    || languageLead.test(lead)
    || namedInfoboxLanguage.test(infoboxText);
}

function languageFromInfobox(info) {
  const value = String(info?.language || '').toLowerCase().trim();
  if (!value) return '';
  if (/\bhindi\b/.test(value)) return 'Hindi';
  if (/\benglish\b|\ben\b/.test(value)) return 'English';
  // Do not turn malformed template residue into a fake \"Other\" language.
  // Only a named non-supported language is disqualifying here.
  if (/\b(?:afrikaans|arabic|bengali|cantonese|chinese|danish|dutch|french|german|greek|gujarati|hebrew|italian|japanese|kannada|korean|malayalam|mandarin|marathi|persian|polish|portuguese|punjabi|russian|spanish|tamil|telugu|thai|turkish|urdu|vietnamese)\b/.test(value)) return 'Other';
  return '';
}

function hasAllowedLanguageEvidence(cats, leadText) {
  const catText = (cats || []).join(' ');
  return {
    english: /\bcategory:\d{4} english-language films\b|\bcategory:english-language (?:films|television shows|web series|netflix original programming|amazon prime video original programming)\b/i.test(catText)
      || /\benglish-language (?:film|television series|tv series|web series|miniseries|sitcom)\b/i.test(leadText)
      || /\b(?:american|british|canadian|australian|new zealand|irish)\b.{0,80}\b(?:film|television series|tv series|web series|miniseries|streaming television series|sitcom)\b/i.test(leadText)
      || /\bcategory:(?:american|british|canadian|australian|new zealand|irish) (?:.* )?(?:films|television series|web series)\b/i.test(catText),
    hindi: /\bcategory:\d{4} hindi-language films\b|\bcategory:hindi-language (?:films|television shows|web series)\b/i.test(catText)
      || /\bhindi-language (?:film|television series|tv series|web series|miniseries)\b/i.test(leadText)
      || /\bhindi (?:film|television series|tv series|web series|miniseries)\b/i.test(leadText)
  };
}

function pageMediaEvidence(leadText, cats=[]) {
  const catText = (cats || []).join(' ');
  const show = /\bcategory:.*(?:television series|tv series|web series|miniseries|netflix original programming|amazon prime video original programming)\b/i.test(catText)
    || /\b(?:is an?|was an?) .{0,140}\b(?:television series|tv series|web series|miniseries|streaming television series|sitcom)\b/i.test(leadText);
  const film = /\bcategory:\d{4} .*films\b|\bcategory:.*(?:action|adventure|animated|comedy|crime|drama|fantasy|horror|musical|mystery|romance|science fiction|sports|thriller|war|western|superhero).* films\b/i.test(catText)
    || /\b(?:is an?|was an?) .{0,140}\bfilm\b/i.test(leadText);
  return {film, show};
}

function inferPageFormat(pageTitle='', leadText='', cats=[], mediaEvidence=null) {
  const title = String(pageTitle || '').trim();
  const lead = String(leadText || '').slice(0, 700);
  const definition = (lead.match(/^[\s\S]*?[.!?](?:\s|$)/) || [lead.slice(0, 320)])[0];
  const catText = (cats || []).join(' ');
  const titleFilm = /\((?:\d{4}\s+)?film\)$/i.test(title);
  const titleShow = /\((?:tv|television|web) series\)$|\(miniseries\)$/i.test(title);
  if (titleFilm) return {format:null, strong:true, source:'title'};
  if (titleShow) return {format:/miniseries/i.test(title) ? 'miniseries' : 'series', strong:true, source:'title'};

  const leadFilm = /^\s*.{1,180}\b(?:is|was)\b.{0,180}\bfilm\b/i.test(definition);
  const leadShow = /^\s*.{1,180}\b(?:is|was)\b.{0,180}\b(?:television series|tv series|web series|miniseries|streaming series|television sitcom|sitcom)\b/i.test(definition);
  if (leadFilm && !leadShow) return {format:null, strong:true, source:'lead'};
  if (leadShow && !leadFilm) return {format:/\bminiseries\b/i.test(definition) ? 'miniseries' : 'series', strong:true, source:'lead'};

  const showCategory = /\bcategory:.*(?:television series debuts|television series endings|television series|tv series|web series|miniseries)\b/i.test(catText);
  const filmCategory = /\bcategory:\d{4} .*films\b|\bcategory:.* films\b/i.test(catText);
  if (filmCategory && !showCategory) return {format:null, strong:true, source:'category'};
  if (showCategory && !filmCategory) return {format:/\bminiseries\b/i.test(catText) ? 'miniseries' : 'series', strong:true, source:'category'};

  const evidence = mediaEvidence || pageMediaEvidence(lead, cats);
  return {format:evidence.show && !evidence.film ? 'series' : null, strong:false, source:'fallback'};
}

function isMetaTag(tag) {
  return /^(english-language|hindi-language|usa|uk|india|south-korea|brazil|poland|germany|japan|film|series|miniseries|prestige-tv|\d{4}s)$/.test(tag);
}

function recommendationTags(tags) {
  return [...new Set((tags||[]).filter(t => !isMetaTag(t)))];
}

function expansionMode() {
  if (activeTab === 'movie') return 'movies';
  if (activeTab === 'show') return 'shows';
  return 'all';
}

function sourceCategoriesForMode(mode) {
  return collectionLanesForMode(mode).flatMap(lane => WIKI_SOURCES[lane.key] || []);
}

function curatedTitlesForMode(mode) {
  if (mode === 'englishMovies') return [...HIGH_CONFIDENCE_ENGLISH, ...EXPANSION_ENGLISH].map(title => ({title, lane:COLLECTION_LANES.find(l => l.key === 'englishMovies'), tier:0}));
  if (mode === 'hindiMovies') return [...HIGH_CONFIDENCE_HINDI, ...EXPANSION_HINDI].map(title => ({title, lane:COLLECTION_LANES.find(l => l.key === 'hindiMovies'), tier:0}));
  if (mode === 'englishShows') return [...HIGH_CONFIDENCE_SHOWS, ...EXPANSION_SHOWS].map(title => ({title, lane:COLLECTION_LANES.find(l => l.key === 'englishShows'), tier:0}));
  return collectionLanesForMode(mode).flatMap(lane => curatedTitlesForMode(lane.key));
}

function matchesExpansionMode(movie, mode) {
  if (mode === 'movies') return !movie.format;
  if (mode === 'shows') return !!movie.format;
  return true;
}

function collectionLanesForMode(mode) {
  const exact = COLLECTION_LANES.find(lane => lane.key === mode);
  if (exact) return [exact];
  if (mode === 'movies') return COLLECTION_LANES.filter(lane => lane.mode === 'movies');
  if (mode === 'shows') return COLLECTION_LANES.filter(lane => lane.mode === 'shows');
  return COLLECTION_LANES;
}

function laneMatchesMovie(movie, lane) {
  return matchesExpansionMode(movie, lane.mode) && movie.language === lane.language;
}

function yearFromTitleText(title) {
  const years = String(title || '').match(/\b(19\d{2}|20\d{2})\b/g);
  if (!years || !years.length) return 0;
  return Math.max(...years.map(Number));
}

function newestTitleFirst(titles) {
  return [...titles].sort((a,b)=>yearFromTitleText(b)-yearFromTitleText(a)||String(a).localeCompare(String(b)));
}

function rejectKey(title, mode) { return `${mode}:${normaliseTitleKey(title)}`; }

function isShowListPage(title) {
  return /^List of .*television/i.test(title)
    || /^Lists of .*television/i.test(title)
    || /^List of .*web series/i.test(title)
    || /television (programmes|programs|series)$/i.test(title);
}


async function wikiApiJson(url) {
  if (fetchAbortRequested) throw new DOMException('Aborted', 'AbortError');
  const wait = Math.max(0, WIKI_REQUEST_DELAY_MS - (Date.now() - lastWikiRequestAt));
  if (wait) await abortableSleep(wait);
  if (fetchAbortRequested) throw new DOMException('Aborted', 'AbortError');
  lastWikiRequestAt = Date.now();
  const controller = new AbortController();
  currentWikiAbortController = controller;
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error('Wikipedia request failed: ' + resp.status);
    return await resp.json();
  } finally {
    if (currentWikiAbortController === controller) currentWikiAbortController = null;
  }
}

function hiddenTitleMatches(value) {
  const key = normaliseTitleKey(typeof value === 'string' ? value : value?.title);
  if (!key) return false;
  return Object.values(state.hiddenTitles || {}).some(movie => [movie.title, movie.wikiTitle, movie.pageTitle]
    .some(title => normaliseTitleKey(title) === key));
}

function wrongPickMatches(value) {
  const key = normaliseTitleKey(typeof value === 'string' ? value : value?.title);
  if (!key) return false;
  return Object.values(state.wrongPicks || {}).some(item => [item.title, item.wikiTitle, item.pageTitle]
    .some(title => normaliseTitleKey(title) === key));
}

function isHindiShowRecord(movie) {
  return !!movie?.format && String(movie.language || '').trim().toLowerCase() === 'hindi';
}

function horrorSourceText(movie) {
  return [
    movie?.leadText,
    movie?.categoryText,
    movie?.storyText,
    ...(movie?.genres || []),
    ...(movie?.tags || []),
    ...(movie?.plotTags || [])
  ].join(' ').toLowerCase();
}

function isConventionalHorrorTitle(movie) {
  const source = horrorSourceText(movie);
  // Monster/creature adventure is not horror by itself. Exclude only titles
  // whose metadata or narrative carries an actual conventional-horror signal.
  const explicitHorror = /\b(?:horror|slasher|splatter|gore|haunted|haunting|possession|exorcism|demon(?:ic)?|ghost|paranormal)\b/.test(source);
  if (!explicitHorror) return false;
  const hybridHorror = /\b(?:psychological|science[ -]?fiction|sci[ -]?fi|comedy|satirical|dark comedy)\s+(?:horror|thriller)\b|\b(?:horror[- ]comedy|psychological-horror|science-fiction-horror)\b/.test(source);
  return !hybridHorror;
}

function excludeStoredTitles(predicate, reason) {
  let removed = 0;
  const stamp = nowStamp();
  state.wrongPicks = state.wrongPicks || {};
  state.deletedMovieRecords = state.deletedMovieRecords || {};
  state.unblockedTitleRecords = state.unblockedTitleRecords || {};
  ['movies', 'hiddenTitles'].forEach(mapName => {
    Object.entries(state[mapName] || {}).forEach(([id, movie]) => {
      if (!predicate(movie)) return;
      const key = normaliseTitleKey(movie.wikiTitle || movie.pageTitle || movie.title) || id;
      delete state.unblockedTitleRecords[key];
      state.wrongPicks[key] = {
        id,
        title:movie.title || '',
        wikiTitle:movie.wikiTitle || '',
        pageTitle:movie.pageTitle || '',
        wikiPageId:movie.wikiPageId || wikiPageIdFromMovie(movie),
        reason,
        at:stamp,
        updatedAt:stamp
      };
      state.deletedMovieRecords[id] = {id, titleKey:key, reason, at:stamp, updatedAt:stamp};
      delete state[mapName][id];
      removed++;
    });
  });
  if (removed) {
    invalidateTagCaches();
    invalidateTasteModel();
    rebuildTagBrain();
    computeTagWeights();
  }
  return removed;
}

function purgeDisallowedHindiShows() {
  return excludeStoredTitles(isHindiShowRecord, 'hindi-show-excluded');
}

function purgeDisallowedConventionalHorror() {
  return excludeStoredTitles(isConventionalHorrorTitle, 'conventional-horror-excluded');
}

function unblockTitleForManualSearch(value) {
  const key = normaliseTitleKey(typeof value === 'string' ? value : value?.title);
  if (!key) return false;
  let changed = false;
  const stamp = nowStamp();
  state.unblockedTitleRecords = state.unblockedTitleRecords || {};
  state.unblockedTitleRecords[key] = { key, at:stamp, updatedAt:stamp };
  Object.entries(state.wrongPicks || {}).forEach(([recordKey, item]) => {
    const matches = [item.title, item.wikiTitle, item.pageTitle]
      .some(title => normaliseTitleKey(title) === key);
    if (!matches || item?.reason === 'ai-sensitive-content-excluded') return;
    delete state.wrongPicks[recordKey];
    if (item.id && state.deletedMovieRecords?.[item.id]) delete state.deletedMovieRecords[item.id];
    changed = true;
  });
  return changed;
}

function migrateVisibleWrongPicks() {
  state.wrongPicks = state.wrongPicks || {};
  let changed = false;
  Object.entries(state.hiddenTitles || {}).forEach(([id, movie]) => {
    if (!movie?.wrongPick) return;
    const key = normaliseTitleKey(movie.wikiTitle || movie.pageTitle || movie.title) || id;
    state.wrongPicks[key] = {
      id,
      title:movie.title || '',
      wikiTitle:movie.wikiTitle || '',
      pageTitle:movie.pageTitle || '',
      wikiPageId:movie.wikiPageId || wikiPageIdFromMovie(movie),
      at:movie.hiddenAt || nowStamp(),
      updatedAt:movie._updatedAt || movie.hiddenAt || nowStamp()
    };
    delete state.hiddenTitles[id];
    changed = true;
  });
  return changed;
}

function isMovieHidden(movie) {
  if (!movie) return false;
  if (wrongPickMatches(movie)) return true;
  if (movie.id && state.hiddenTitles?.[movie.id]) return true;
  return [movie.title, movie.wikiTitle, movie.pageTitle].some(title => hiddenTitleMatches(title));
}

function rollingPoolExclusionMatches(value) {
  const key = normaliseTitleKey(typeof value === 'string' ? value : value?.title);
  if (!key) return false;
  return Object.values(state.rollingPoolExclusions || {}).some(record =>
    [record?.title, record?.wikiTitle, record?.pageTitle]
      .some(title => normaliseTitleKey(title) === key)
  );
}

function isRollingPoolExcluded(movie) {
  if (!movie) return false;
  if (movie.id && state.rollingPoolExclusions?.[movie.id]) return true;
  return [movie.title, movie.wikiTitle, movie.pageTitle].some(title => rollingPoolExclusionMatches(title));
}

function releaseRollingPoolExclusion(value) {
  const key = normaliseTitleKey(typeof value === 'string' ? value : value?.title);
  if (!key || !state.rollingPoolExclusions) return false;
  let changed = false;
  Object.entries(state.rollingPoolExclusions).forEach(([recordKey, record]) => {
    const matches = [record?.title, record?.wikiTitle, record?.pageTitle]
      .some(title => normaliseTitleKey(title) === key);
    if (!matches) return;
    delete state.rollingPoolExclusions[recordKey];
    changed = true;
  });
  return changed;
}

function isReplaceableRollingCandidate(movie) {
  return !!movie
    && Number(movie.rating || 0) === 0
    && !movie.watchlist
    && !movie.manualAdded;
}

function trimRollingPoolExclusions() {
  const records = Object.entries(state.rollingPoolExclusions || {});
  if (records.length <= ROLLING_POOL_EXCLUSION_CAP) return 0;
  records
    .sort(([, a], [, b]) => recordTimestamp(a) - recordTimestamp(b))
    .slice(0, records.length - ROLLING_POOL_EXCLUSION_CAP)
    .forEach(([key]) => delete state.rollingPoolExclusions[key]);
  return Math.max(0, records.length - ROLLING_POOL_EXCLUSION_CAP);
}

function rollingPoolSegmentYear(movie) {
  const year = Number(movie?.year);
  return Number.isFinite(year) && year >= 1900 ? year : 'unknown';
}

function rollingPoolSegmentKey(movie) {
  const year = rollingPoolSegmentYear(movie);
  const language = String(movie?.language || 'Unknown').trim() || 'Unknown';
  const format = movie?.format ? 'show' : 'movie';
  return [year, language, format].join('│');
}

function rollingPoolSegmentStats(segmentKey, items) {
  const pool = Array.isArray(items) ? items : [];
  const count = pool.length;
  const taggedCount = pool.filter(item => item.type === 'tagged').length;
  const pendingCount = count - taggedCount;
  const strongCount = pool.filter(item => item.type === 'tagged' && item.predictedRating >= 4 && item.posOverlap >= STRONG_REC_MIN_OVERLAP).length;
  const avgPredicted = taggedCount ? pool.filter(item => item.type === 'tagged').reduce((sum, item) => sum + item.predictedRating, 0) / taggedCount : 3;

  const history = [
    ...Object.values(state.movies || {}),
    ...Object.values(state.hiddenTitles || {})
  ].filter(movie => Number(movie?.rating || 0) > 0 && rollingPoolSegmentKey(movie) === segmentKey);

  const ratingCount = history.length;
  const avgRating = ratingCount ? history.reduce((sum, movie) => sum + Number(movie.rating || 0), 0) / ratingCount : 0;
  const ratingAffinity = ratingCount ? Math.max(0, Math.min(1, (avgRating - 2.5) / 2.5)) : 0;
  const engagement = Math.max(0, Math.min(1, ratingCount / 12));
  const strongShare = taggedCount ? strongCount / taggedCount : 0;
  const quality = Math.max(0, Math.min(1,
    0.45 * ((avgPredicted - 1) / 4) +
    0.30 * strongShare +
    0.15 * ratingAffinity +
    0.10 * engagement
  ));
  const year = pool[0]?.yearValue ?? rollingPoolSegmentYear(pool[0]?.movie || {});
  const currentYear = new Date().getFullYear();
  const recency = typeof year === 'number' ? Math.max(0, Math.min(1, (year - 1970) / Math.max(1, currentYear - 1970))) : 0.35;
  const supply = Math.max(0, Math.min(1, Math.log(count + 1) / Math.log(90)));

  const keepRatio = Math.max(0.58, Math.min(0.95,
    0.66 +
    0.16 * quality +
    0.07 * engagement +
    0.06 * recency +
    0.03 * supply
  ));

  const minKeep = Math.max(
    ROLLING_POOL_MIN_PER_SEGMENT,
    Math.min(
      ROLLING_POOL_MAX_PER_SEGMENT,
      Math.round(ROLLING_POOL_MIN_PER_SEGMENT + 12 * quality + 8 * engagement + 4 * recency)
    )
  );

  const pendingAllowance = Math.max(
    ROLLING_POOL_PENDING_MIN_PER_SEGMENT,
    Math.min(
      ROLLING_POOL_PENDING_MAX_PER_SEGMENT,
      Math.round(ROLLING_POOL_PENDING_MIN_PER_SEGMENT + 4 * quality + 2 * engagement)
    )
  );

  return {
    count,
    taggedCount,
    pendingCount,
    strongCount,
    avgPredicted,
    ratingCount,
    avgRating,
    ratingAffinity,
    engagement,
    quality,
    recency,
    supply,
    keepRatio,
    minKeep,
    pendingAllowance
  };
}

function pruneRollingCandidatePool({reason='rotation'}={}) {
  const replaceable = Object.values(state.movies || {}).filter(isReplaceableRollingCandidate);
  if (!replaceable.length) return {evicted:0, retained:0, pending:0, reason};

  const hasTasteModel = personalizedEnough();
  const segments = new Map();
  const pendingBySegment = new Map();

  replaceable.forEach(movie => {
    const segmentKey = rollingPoolSegmentKey(movie);
    if (!segments.has(segmentKey)) segments.set(segmentKey, []);
    if (!pendingBySegment.has(segmentKey)) pendingBySegment.set(segmentKey, []);
    const yearValue = rollingPoolSegmentYear(movie);
    const tagCount = rawScoringTags(movie).length;

    if (!tagCount) {
      pendingBySegment.get(segmentKey).push({movie, type:'pending', yearValue, updatedAt:recordTimestamp(movie)});
      return;
    }

    const fit = hasTasteModel ? predictTasteFit(movie) : null;
    segments.get(segmentKey).push({
      movie,
      type:'tagged',
      yearValue,
      predictedRating:Number(fit?.predictedRating || 3),
      positiveScore:Number(fit?.positiveScore || 0),
      negativePenalty:Number(fit?.negativePenalty || 0),
      posOverlap:Number(fit?.posOverlap || 0),
      updatedAt:recordTimestamp(movie)
    });
  });

  const keepIds = new Set();
  let retainedTagged = 0;
  let retainedPending = 0;
  const poolStats = [];

  const taggedSorter = (a, b) =>
    b.predictedRating - a.predictedRating ||
    b.positiveScore - a.positiveScore ||
    a.negativePenalty - b.negativePenalty ||
    b.posOverlap - a.posOverlap ||
    b.updatedAt - a.updatedAt ||
    String(a.movie.title || '').localeCompare(String(b.movie.title || ''));

  const pendingSorter = (a, b) =>
    b.updatedAt - a.updatedAt ||
    String(a.movie.title || '').localeCompare(String(b.movie.title || ''));

  const segmentKeys = new Set([...segments.keys(), ...pendingBySegment.keys()]);
  [...segmentKeys].sort().forEach(segmentKey => {
    const tagged = (segments.get(segmentKey) || []).sort(taggedSorter);
    const pending = (pendingBySegment.get(segmentKey) || []).sort(pendingSorter);
    const stats = rollingPoolSegmentStats(segmentKey, [...tagged, ...pending]);
    const keepTagged = Math.min(
      tagged.length,
      Math.max(stats.minKeep, Math.ceil(tagged.length * stats.keepRatio))
    );
    const keepPending = Math.min(pending.length, stats.pendingAllowance);

    tagged.slice(0, keepTagged).forEach(item => keepIds.add(String(item.movie.id)));
    pending.slice(0, keepPending).forEach(item => keepIds.add(String(item.movie.id)));
    retainedTagged += keepTagged;
    retainedPending += keepPending;
    poolStats.push({segmentKey, keepTagged, keepPending, ...stats});
  });

  const evicted = replaceable.filter(movie => !keepIds.has(String(movie.id)));
  if (!evicted.length) {
    trimRollingPoolExclusions();
    state.meta = state.meta || {};
    state.meta.rollingPool = {
      policy:'adaptive-segmented',
      segmentCount:poolStats.length,
      retainedTagged,
      retainedPending,
      lastRotatedAt:nowStamp(),
      lastEvicted:0,
      reason
    };
    return {evicted:0, retained:keepIds.size, pending:retainedPending, segmentCount:poolStats.length, reason};
  }

  const stamp = nowStamp();
  state.rollingPoolExclusions = state.rollingPoolExclusions || {};
  evicted.forEach(movie => {
    const key = normaliseTitleKey(movie.wikiTitle || movie.pageTitle || movie.title) || String(movie.id);
    state.rollingPoolExclusions[key] = {
      id:String(movie.id || ''),
      title:movie.title || '',
      wikiTitle:movie.wikiTitle || '',
      pageTitle:movie.pageTitle || '',
      wikiPageId:movie.wikiPageId || wikiPageIdFromMovie(movie),
      reason:'rolling-pool',
      at:stamp,
      updatedAt:stamp
    };
    delete state.movies[movie.id];
  });
  trimRollingPoolExclusions();
  state.meta = state.meta || {};
  state.meta.rollingPool = {
    policy:'adaptive-segmented',
    segmentCount:poolStats.length,
    retainedTagged,
    retainedPending,
    lastRotatedAt:stamp,
    lastEvicted:evicted.length,
    reason,
    sample: poolStats.slice(0, 12).map(item => ({
      segment:item.segmentKey,
      keepTagged:item.keepTagged,
      keepPending:item.keepPending,
      tagged:item.taggedCount,
      pending:item.pendingCount,
      avgPredicted:Number(item.avgPredicted.toFixed(2)),
      strong:item.strongCount,
      rated:item.ratingCount,
      ratio:Number(item.keepRatio.toFixed(2))
    }))
  };
  invalidateTagCaches();
  invalidateTasteModel();
  rebuildTagBrain();
  computeTagWeights();
  return {evicted:evicted.length, retained:keepIds.size, pending:retainedPending, segmentCount:poolStats.length, reason};
}

function stopOrExpandPool() {
  if (poolExpansionInProgress) stopFetching();
  else {
    autoFetchPaused = false;
    expandPool(true);
  }
}

function stopFetching(opts={}) {
  fetchAbortRequested = true;
  autoFetchPaused = true;
  if (autoExpandTimer) {
    clearTimeout(autoExpandTimer);
    autoExpandTimer = null;
  }
  if (backgroundAiTimer) {
    clearTimeout(backgroundAiTimer);
    backgroundAiTimer = null;
  }
  if (currentWikiAbortController) currentWikiAbortController.abort();
  if (currentSleepCancel) currentSleepCancel();
  hideFetchProgress();
  const btn = document.getElementById('expandBtn');
  if (btn) { btn.disabled = false; btn.textContent = '＋ Expand Pool'; }
  updateLibraryHealth();
  if (!opts.silent) showToast('Background collection paused.', '');
}

async function waitForPoolIdle(timeoutMs=2500) {
  const start = Date.now();
  while (poolExpansionInProgress && Date.now() - start < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 80));
  }
}

function stableHash(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function titleSortKey(movie) {
  return String(movie?.title || '').toLowerCase();
}

function movieTime(movie) {
  return Date.parse(movie?._updatedAt || movie?.hiddenAt || movie?.updatedAt || movie?.at || '') || 0;
}

function sortMovies(rows, fallback='title-asc') {
  const mode = state.settings.sortMode || fallback;
  const effective = mode === 'recommended' ? fallback : mode;
  const sorted = [...rows];
  if (effective === 'random') {
    const seed = String(state.settings.shuffleSeed || 1);
    return sorted.sort((a,b)=>stableHash(`${seed}:${a.id || a.key || a.title}`)-stableHash(`${seed}:${b.id || b.key || b.title}`));
  }
  if (effective === 'rating-desc') return sorted.sort((a,b)=>Number(b.rating||0)-Number(a.rating||0)||titleSortKey(a).localeCompare(titleSortKey(b)));
  if (effective === 'year-desc') return sorted.sort((a,b)=>Number(b.year||0)-Number(a.year||0)||titleSortKey(a).localeCompare(titleSortKey(b)));
  if (effective === 'year-asc') return sorted.sort((a,b)=>Number(a.year||9999)-Number(b.year||9999)||titleSortKey(a).localeCompare(titleSortKey(b)));
  if (effective === 'updated-desc') return sorted.sort((a,b)=>movieTime(b)-movieTime(a)||titleSortKey(a).localeCompare(titleSortKey(b)));
  return sorted.sort((a,b)=>titleSortKey(a).localeCompare(titleSortKey(b)));
}

async function fetchWikiPageLinks(title, limit=500) {
  const links = [];
  let plcontinue = '';
  try {
    do {
      const cont = plcontinue ? `&plcontinue=${encodeURIComponent(plcontinue)}` : '';
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=links&pllimit=${limit}&plnamespace=0&format=json&origin=*${cont}`;
      const data = await wikiApiJson(url);
      const page = Object.values(data.query?.pages||{})[0];
      (page?.links||[]).forEach(link => links.push(link.title));
      plcontinue = data.continue?.plcontinue || '';
    } while (plcontinue && links.length < limit * 2);
  } catch(e) {}
  return links;
}

async function fetchShowSourceTitles(laneKey='englishShows') {
  const indexLinks = await fetchWikiPageLinks(WIKI_LIST_SOURCES.showsIndex, 500);
  const listPages = [...new Set([
    ...(WIKI_LIST_SOURCES[laneKey] || []),
    ...indexLinks.filter(isShowListPage)
  ])].slice(0, 28);
  const titles = [];
  for (const listPage of listPages) {
    const links = await fetchWikiPageLinks(listPage, 500);
    links.forEach(title => {
      if (!obviousNonMovieTitle(title) && !isShowListPage(title)) titles.push(title);
    });
  }
  return newestTitleFirst([...new Set(titles)]);
}

async function fetchWikiSearchResults(query, opts={}) {
  const q = (query || '').trim();
  if (!q) return [];
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=8&format=json&origin=*`;
    const data = await wikiApiJson(url);
    return (data.query?.search || []).map(item => ({
      title:item.title,
      pageId:String(item.pageid || ''),
      snippet:stripWikiMarkup(item.snippet || '')
    }));
  } catch(e) {
    if (opts.throwOnError) throw e;
    return [];
  }
}

async function fetchWikiSearchTitles(query, opts={}) {
  const results = await fetchWikiSearchResults(query, opts);
  return results.map(item => item.title);
}


async function fetchNavigationLaneTitles(mode, limitPerPage=180) {
  const pages = [];
  collectionLanesForMode(mode).forEach(lane => {
    pages.push(...(WIKI_NAVIGATION_LISTS[lane.key] || []));
    if (lane.mode === 'movies') pages.push(...WIKI_NAVIGATION_LISTS.topicMovies);
  });
  const titles = [];
  for (const page of [...new Set(pages)].slice(0, 14)) {
    if (fetchAbortRequested) break;
    const links = await fetchWikiPageLinks(page, limitPerPage);
    links.forEach(title => {
      if (!obviousNonMovieTitle(title) && !isShowListPage(title)) titles.push(title);
    });
  }
  return newestTitleFirst([...new Set(titles)]);
}

function collectionMinYear() {
  return Math.max(1900, Math.min(new Date().getFullYear(), Number(state.settings?.minYear) || 1970));
}

function resetYearBoundedDiscovery() {
  Object.keys(yearCategoryIndexCache).forEach(key => delete yearCategoryIndexCache[key]);
  Object.keys(yearCategoryMembersCache).forEach(key => delete yearCategoryMembersCache[key]);
  if (!state.discoveryCursor || typeof state.discoveryCursor !== 'object') state.discoveryCursor = {};
  COLLECTION_LANES.forEach(lane => {
    state.discoveryCursor[lane.key] = {categoryIndex:0, categoryTitle:'', offset:0, cycles:0};
  });
}

async function fetchYearCategoryIndex(laneKey) {
  const source = WIKI_YEAR_INDEX_SOURCES[laneKey];
  if (!source) return [];
  const minYear = collectionMinYear();
  const cacheKey = `${laneKey}:${minYear}`;
  if (yearCategoryIndexCache[cacheKey]) return yearCategoryIndexCache[cacheKey];
  const roots = Array.isArray(source) ? source : [source];
  const categories = [];
  for (const [rootIndex, root] of roots.entries()) {
    let cmcontinue = '';
    try {
      do {
        const cont = cmcontinue ? `&cmcontinue=${encodeURIComponent(cmcontinue)}` : '';
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(root)}&cmlimit=500&cmnamespace=14&format=json&origin=*${cont}`;
        const data = await wikiApiJson(url);
        (data.query?.categorymembers || []).forEach(item => {
          const title = item.title || '';
          const year = Number((title.match(/\b(19\d{2}|20\d{2})\b/) || [])[1] || 0);
          if (year >= minYear) categories.push({title, year, rootIndex});
        });
        cmcontinue = data.continue?.cmcontinue || '';
      } while (cmcontinue && !fetchAbortRequested);
    } catch(e) {}
  }
  yearCategoryIndexCache[cacheKey] = categories
    .sort((a,b)=>b.year-a.year||a.rootIndex-b.rootIndex||a.title.localeCompare(b.title))
    .map(item=>item.title);
  return yearCategoryIndexCache[cacheKey];
}

function ensureDiscoveryCursor() {
  if (!state.discoveryCursor || typeof state.discoveryCursor !== 'object') state.discoveryCursor = {};
  COLLECTION_LANES.forEach(lane => {
    const current = state.discoveryCursor[lane.key] || {};
    state.discoveryCursor[lane.key] = {
      categoryIndex: Math.max(0, Number(current.categoryIndex) || 0),
      categoryTitle: String(current.categoryTitle || ''),
      offset: Math.max(0, Number(current.offset) || 0),
      cycles: Math.max(0, Number(current.cycles) || 0)
    };
  });
}

function clearYearMemberCacheForCategories(categories=[]) {
  categories.forEach(category => { delete yearCategoryMembersCache[category]; });
}

async function fetchYearCategoryMembers(category) {
  if (!category) return [];
  if (yearCategoryMembersCache[category]) return yearCategoryMembersCache[category];
  const titles = [];
  let cmcontinue = '';
  try {
    do {
      const cont = cmcontinue ? `&cmcontinue=${encodeURIComponent(cmcontinue)}` : '';
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(category)}&cmlimit=500&cmnamespace=0&cmsort=sortkey&format=json&origin=*${cont}`;
      const data = await wikiApiJson(url);
      (data.query?.categorymembers || []).forEach(item => {
        if (!obviousNonMovieTitle(item.title)) titles.push({title:item.title, pageid:String(item.pageid || '')});
      });
      cmcontinue = data.continue?.cmcontinue || '';
    } while (cmcontinue && !fetchAbortRequested);
  } catch(e) {}
  yearCategoryMembersCache[category] = [...new Map(titles.map(item => [item.pageid || normaliseTitleKey(item.title), item])).values()];
  return yearCategoryMembersCache[category];
}

function discoveryCandidateAllowed(title, lane, existing, seenThisRun) {
  const candidateTitle = typeof title === 'string' ? title : title?.title;
  const pageId = String(typeof title === 'string' ? '' : title?.pageid || '');
  const clean = normaliseTitleKey(candidateTitle);
  if (!clean || TITLE_BLOCKLIST.has(clean) || obviousNonMovieTitle(candidateTitle)) return false;
  if (existing.titles.has(clean) || (pageId && existing.pageIds.has(pageId)) || hiddenTitleMatches(candidateTitle) || wrongPickMatches(candidateTitle) || seenThisRun.has(clean)) return false;
  return true;
}

async function nextLaneDiscoveryCandidates(lane, limit, existing, seenThisRun) {
  ensureDiscoveryCursor();
  const categories = await fetchYearCategoryIndex(lane.key);
  if (!categories.length) return [];
  const cursor = state.discoveryCursor[lane.key];
  if (cursor.categoryTitle) {
    const savedIndex = categories.indexOf(cursor.categoryTitle);
    if (savedIndex >= 0) cursor.categoryIndex = savedIndex;
  }
  const out = [];
  let scannedCategories = 0;
  let scannedTitles = 0;
  while (out.length < limit && !fetchAbortRequested && scannedCategories < 24 && scannedTitles < 900) {
    if (cursor.categoryIndex >= categories.length) {
      cursor.categoryIndex = 0;
      cursor.categoryTitle = '';
      cursor.offset = 0;
      cursor.cycles += 1;
      Object.keys(yearCategoryIndexCache).filter(key => key.startsWith(`${lane.key}:`)).forEach(key => delete yearCategoryIndexCache[key]);
      clearYearMemberCacheForCategories(categories);
      break;
    }
    const category = categories[cursor.categoryIndex];
    cursor.categoryTitle = category;
    const members = await fetchYearCategoryMembers(category);
    if (!members.length || cursor.offset >= members.length) {
      cursor.categoryIndex += 1;
      cursor.categoryTitle = categories[cursor.categoryIndex] || '';
      cursor.offset = 0;
      scannedCategories += 1;
      continue;
    }
    const member = members[cursor.offset];
    const title = typeof member === 'string' ? member : member.title;
    cursor.offset += 1;
    scannedTitles += 1;
    if (discoveryCandidateAllowed(member, lane, existing, seenThisRun)) {
      seenThisRun.add(normaliseTitleKey(title));
      out.push({title, pageid:String(member?.pageid || ''), lane, tier:0, sourceCategory:category});
    }
  }
  return out;
}

async function nextDiscoveryCandidates(mode, limit, seenThisRun=new Set()) {
  ensureDiscoveryCursor();
  const lanes = collectionLanesForMode(mode);
  const knownRecords = [...Object.values(state.movies || {}), ...Object.values(state.hiddenTitles || {})];
  const existing = {
    titles:new Set(knownRecords.flatMap(movie => [movie.title, movie.wikiTitle, movie.pageTitle].map(normaliseTitleKey).filter(Boolean))),
    pageIds:new Set(knownRecords.map(wikiPageIdFromMovie).filter(Boolean))
  };
  const laneLimit = Math.max(1, Math.ceil(limit / Math.max(1, lanes.length)));
  const out = [];
  for (const lane of lanes) {
    if (fetchAbortRequested) break;
    out.push(...await nextLaneDiscoveryCandidates(lane, laneLimit, existing, seenThisRun));
  }
  return out;
}


async function fetchWikiSourceTitles(mode, pagesPerCategory=4) {
  const titles = [];
  for (const category of sourceCategoriesForMode(mode)) {
    let cmcontinue = '';
    try {
      for (let page = 0; page < pagesPerCategory; page++) {
        const cont = cmcontinue ? `&cmcontinue=${encodeURIComponent(cmcontinue)}` : '';
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(category)}&cmlimit=200&cmnamespace=0&cmsort=sortkey&format=json&origin=*${cont}`;
        const data = await wikiApiJson(url);
        (data.query?.categorymembers||[]).forEach(item => {
          if (!obviousNonMovieTitle(item.title)) titles.push(item.title);
        });
        cmcontinue = data.continue?.cmcontinue || '';
        if (!cmcontinue) break;
      }
    } catch(e) {}
  }
  const lane = COLLECTION_LANES.find(item => item.key === mode);
  if (lane?.mode === 'shows') {
    titles.push(...await fetchShowSourceTitles(lane.key));
  }
  return newestTitleFirst([...new Set(titles)]);
}

function isExternalRateLimitError(error) {
  const message = String(error?.message || error || '').toLowerCase();

  return (
    /\b429\b/.test(message) ||
    /too many requests/.test(message) ||
    /resource exhausted/.test(message) ||
    /rate limit/.test(message) ||
    /quota exceeded/.test(message) ||
    /quota exhausted/.test(message)
  );
}

async function expandPool(manual=true) {
  if (poolExpansionInProgress) return;
  if (!libraryWritesUnlocked) {
    showToast('Connect Drive first to restore this device before collecting titles.', '');
    return;
  }
  if (!manual && (autoFetchPaused || !shouldRunBackgroundCollection())) return;

  if (manual) {
    autoFetchPaused = false;
    state.meta = state.meta || {};
    state.meta.collectionActive = true;
  }

  poolExpansionInProgress = true;
  fetchAbortRequested = false;

  const btn = document.getElementById('expandBtn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Stop Fetching';
  }

  const mode = expansionMode();
  const attemptBudget = manual ? FETCH_MANUAL_ATTEMPT_BUDGET : FETCH_AUTO_ATTEMPT_BUDGET;
  const outcomes = {parser:0, hidden:0, filtered:0, duplicate:0, ai:0};
  const parserReasons = {};
  const seenThisRun = new Set();
  const pendingAiMovies = [];
  let added = 0;
  let rotatedOut = 0;
  let attempts = 0;
  let aiFailure = '';
  let collectionSatisfied = false;
  let pendingCollectionSaveIds = new Set();

  const noteCollectionSave = movie => {
    if (movie?.id) pendingCollectionSaveIds.add(String(movie.id));
  };

  const saveCollectionState = (opts={}) => {
    const changedMovieIds = [...pendingCollectionSaveIds];
    pendingCollectionSaveIds.clear();
    saveLocalState({...opts, changedMovieIds});
  };

  const progress = (label, title='') => {
    const health = collectionHealth();
    const pct = Math.min(98, Math.round((attempts / Math.max(1, attemptBudget)) * 100));
    const kept = Math.max(0, added - rotatedOut);
    showFetchProgress(
      label,
      pct,
      `${attempts}/${attemptBudget} checked · ${added} fetched · ${rotatedOut} rotated out · +${kept} kept · ${health.strongCount}/${health.target} strong matches${title ? ` · ${title}` : ''}`
    );
  };

  const noteRotation = rotation => {
    rotatedOut += Number(rotation?.evicted || 0);
  };

  const flushPendingAiMovies = async () => {
    if (!pendingAiMovies.length || fetchAbortRequested) return;

    const movies = pendingAiMovies.splice(0, AI_TAG_BATCH_SIZE)
      .map(item => item.movie)
      .filter(movie => movie?.storyText && !hasCurrentAiTags(movie));

    if (!movies.length) return;
    movies.forEach(noteCollectionSave);

    progress('AI tagging new titles…', movies.map(movie => movie.title).join(' · '));

    try {
      const result = await requestAiTags(movies);
      outcomes.ai += Number(result?.failed || 0);
      const rotation = pruneRollingCandidatePool({reason:'collection'});
      noteRotation(rotation);
      rebuildTagBrain();
      computeTagWeights();
      if (rotation.evicted) {
        pendingCollectionSaveIds.clear();
        saveLocalState();
      } else saveCollectionState();
      if (rotation.evicted) console.info('CineLens rolling pool rotated', rotation);
      if (!manual && !shouldRunBackgroundCollection()) collectionSatisfied = true;
    } catch (error) {
      const message = String(error?.message || error);
      outcomes.ai += movies.length;
      movies.forEach(movie => {
        movie.aiTagging = {
          ...(movie.aiTagging || {}),
          status:'building',
          promptVersion:AI_TAG_PROMPT_VERSION,
          storyHash:aiStoryHash(movie.storyText),
          error:message,
          attemptedAt:nowStamp()
        };
        movie.retagStatus = 'needs-ai-tags';
        movie.retagMessage = 'AI retry pending';
        touchRecord(movie);
      });
      saveCollectionState();

      if (isExternalRateLimitError(error)) {
        aiFailure = message;
        autoFetchPaused = true;
        collectionSatisfied = true;
        return;
      }

      console.warn('Background AI tagging deferred for this batch:', message);
      if (manual) aiFailure = message;
    }
  };

  try {
    progress(`Collecting ${mode === 'all' ? 'titles' : mode} that may fit your taste…`);
    await nextPaint();

    while (
      !fetchAbortRequested &&
      !collectionSatisfied &&
      attempts < attemptBudget &&
      added < FETCH_MAX_ADDED_PER_RUN &&
      (manual || shouldRunBackgroundCollection())
    ) {
      const cursorBeforeBatch = JSON.parse(JSON.stringify(state.discoveryCursor || {}));
      const remaining = Math.min(8, attemptBudget - attempts);
      const toFetch = await nextDiscoveryCandidates(mode, Math.max(1, remaining), seenThisRun);
      if (!toFetch.length) break;

      let processedCandidates = 0;

      for (const candidate of toFetch) {
        if (fetchAbortRequested || collectionSatisfied || attempts >= attemptBudget || added >= FETCH_MAX_ADDED_PER_RUN) break;

        const title = typeof candidate === 'string' ? candidate : candidate.title;
        const lane = typeof candidate === 'string' ? null : candidate.lane;
        const pageId = typeof candidate === 'string' ? '' : candidate.pageid;
        const fetchMode = lane?.mode || mode;

        seenThisRun.add(normaliseTitleKey(title));
        attempts++;
        progress(`Checking ${fetchMode === 'shows' ? 'show' : fetchMode === 'movies' ? 'movie' : 'title'}…`, title);
        await nextPaint();

        try {
          const diagnostics = {};
          const movie = pageId
            ? await fetchWikiMovieByPageId(pageId, fetchMode, {ai:false, diagnostics, trustedLane:lane})
            : await fetchWikiMovie(title, fetchMode, diagnostics, {ai:false, trustedLane:lane});

          if (movie && (isMovieHidden(movie) || isRollingPoolExcluded(movie))) {
            outcomes.hidden++;
          } else if (movie && meetsYearCutoff(movie) && matchesExpansionMode(movie, fetchMode) && (!lane || laneMatchesMovie(movie, lane))) {
            const existingMovie = state.movies[movie.id] || findExistingMovieByIdentity(movie);
            const stored = upsertMoviePreservingUserState(movie, existingMovie);
            noteCollectionSave(stored);

            if (existingMovie) outcomes.duplicate++;
            else {
              added++;
            }

            if (!hasCurrentAiTags(stored)) pendingAiMovies.push({movie:stored, lane});
            if (pendingAiMovies.length >= AI_TAG_BATCH_SIZE) await flushPendingAiMovies();
          } else if (movie) {
            outcomes.filtered++;
          } else {
            outcomes.parser++;
            const reason = diagnostics.reason || 'Wikipedia parser rejected page';
            parserReasons[reason] = (parserReasons[reason] || 0) + 1;
          }
        } catch (error) {
          if (fetchAbortRequested || error?.name === 'AbortError') break;
          outcomes.parser++;
          const reason = String(error?.message || 'Wikipedia request failed');
          parserReasons[reason] = (parserReasons[reason] || 0) + 1;
        }

        processedCandidates++;
        progress('Evaluating collection health…', title);

        if (attempts % 20 === 0 && !fetchAbortRequested) await abortableSleep(WIKI_BATCH_PAUSE_MS);
      }

      if (fetchAbortRequested && processedCandidates < toFetch.length) {
        state.discoveryCursor = cursorBeforeBatch;
        ensureDiscoveryCursor();
        saveLocalState({preserveUpdatedAt:true});
      }

      if (!fetchAbortRequested) await flushPendingAiMovies();
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error('Pool expansion failed:', error);
      if (manual) aiFailure = String(error?.message || error);
    }
  } finally {
    const stopped = fetchAbortRequested || autoFetchPaused;
    fetchAbortRequested = false;
    poolExpansionInProgress = false;

    if (btn) {
      btn.disabled = false;
      btn.textContent = '＋ Expand Pool';
    }

    hideFetchProgress();
    const finalRotation = pruneRollingCandidatePool({reason:'collection-finalize'});
    noteRotation(finalRotation);
    rebuildTagBrain();
    computeTagWeights();
    if (finalRotation.evicted) {
      pendingCollectionSaveIds.clear();
      saveLocalState();
    } else saveCollectionState();
    if (finalRotation.evicted) console.info('CineLens rolling pool rotated', finalRotation);
    queueDriveSync();
    scheduleTagCloudNormalization(1500);
    render();

    const outcomeSummary = `parser ${outcomes.parser}, duplicate ${outcomes.duplicate}, hidden ${outcomes.hidden}, filters ${outcomes.filtered}, AI pending ${outcomes.ai}`;
    const kept = Math.max(0, added - rotatedOut);
    console.info('CineLens expansion outcomes', {attempts, added, rotatedOut, kept, outcomes, parserReasons, health:collectionHealth()});

    if (manual && aiFailure) {
      showToast(`Checked ${attempts}, fetched ${added}, rotated out ${rotatedOut}, kept +${kept}. AI tagging deferred: ${aiFailure}`, 'error');
    } else if (manual) {
      showToast(`Checked ${attempts}, fetched ${added}, rotated out ${rotatedOut}, kept +${kept}. ${outcomeSummary}.`, kept ? 'success' : '');
    } else if (stopped && aiFailure) {
      console.warn('Background expansion paused:', aiFailure);
    }
  }
}

function wikipediaTitleFromUrl(value) {
  const raw = (value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^m\./, '');
    if (!host.endsWith('wikipedia.org')) return '';

    if (url.pathname.startsWith('/wiki/')) {
      const slug = url.pathname.replace(/^\/wiki\//, '').split('/')[0];
      if (!slug) return '';
      return decodeURIComponent(slug).replace(/_/g, ' ').trim();
    }

    const title = url.searchParams.get('title');
    if (title) return decodeURIComponent(title).replace(/_/g, ' ').trim();
  } catch(e) {}
  return '';
}

function handleUnifiedSearchKey(event) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  searchWikipediaFromUnifiedInput();
}

function renderWikiSearchResults() {
  const box = document.getElementById('wikiSearchResults');
  if (!box) return;
  if (!wikiSearchResults.length) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  box.hidden = false;
  box.innerHTML = `<span class="wiki-search-label">Wikipedia</span>${wikiSearchResults.map((result, index) => {
    const title = typeof result === 'string' ? result : result.title;
    const url = typeof result === 'string' ? wikiUrlFromTitle(result) : (result.wikiUrl || wikiUrlFromTitle(title));
    return `<span class="wiki-search-choice"><a class="wiki-search-result" href="${attrSafe(url)}" target="_blank" rel="noopener noreferrer">open ${attrSafe(title)}</a><button class="wiki-search-result" onclick="addWikiSearchResult(${index})">add</button></span>`;
  }).join('')}`;
}

async function addWikiSearchResult(index) {
  const result = wikiSearchResults[index];
  if (!result) return false;
  const title = typeof result === 'string' ? result : result.title;
  return fetchUnifiedWikiResult(title, '', {
    preloaded:result.preloaded || null,
    pageId:result.pageId || '',
    directUrl:result.wikiUrl || ''
  });
}

async function searchWikipediaFromUnifiedInput() {
  const input = document.getElementById('titleSearch');
  const btn = document.getElementById('unifiedSearchBtn');
  const query = String(input?.value || '').trim();
  if (!query) {
    wikiSearchResults = [];
    wikiSearchQuery = '';
    renderWikiSearchResults();
    return;
  }
  const urlTitle = wikipediaTitleFromUrl(query);
  if (btn) { btn.disabled = true; btn.textContent = 'searching...'; }
  try {
    fetchAbortRequested = false;
    wikiSearchQuery = query;
    const diagnostics = {};
    const exactTitle = urlTitle || query;
    if (urlTitle) {
      // A pasted Wikipedia link is an add request, not merely a text search.
      await fetchUnifiedWikiResult(urlTitle, query, {directUrl:query});
      return;
    }
    const exactMovie = await fetchWikiTitleAcrossModes(exactTitle, ['all'], diagnostics, {ai:false});
    if (exactMovie) {
      wikiSearchResults = [{
        title:exactMovie.wikiTitle || exactMovie.pageTitle || exactTitle,
        wikiUrl:exactMovie.wikiUrl || wikiUrlFromTitle(exactMovie.wikiTitle || exactTitle),
        pageId:exactMovie.wikiPageId || '',
        preloaded:exactMovie
      }];
      renderWikiSearchResults();
      return;
    }
    wikiSearchResults = (await fetchWikiSearchResults(exactTitle, {throwOnError:true}))
      .filter(result => !obviousNonMovieTitle(result.title))
      .map(result => ({...result, wikiUrl:wikiUrlFromTitle(result.title)}))
      .slice(0, 8);
    renderWikiSearchResults();
    if (!wikiSearchResults.length) showToast(`Wikipedia returned no matching title for "${query}".`, '');
  } catch(e) {
    showToast(`Wikipedia search failed: ${e.message || e}`, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'search wiki'; }
  }
}

async function fetchUnifiedWikiResult(title, rawUrl='', opts={}) {
  const btn = document.getElementById('unifiedSearchBtn');
  const mode = expansionMode();
  let existing = Object.values(state.movies || {}).find(movie =>
    sameCanonicalTitle(movie.title, title)
    || sameCanonicalTitle(movie.wikiTitle, title)
    || sameCanonicalTitle(movie.pageTitle, title)
  );
  const hiddenRecord = Object.values(state.hiddenTitles || {}).find(movie =>
    [movie.title, movie.wikiTitle, movie.pageTitle].some(value => sameCanonicalTitle(value, title))
  );
  if (hiddenRecord) {
    restoreHiddenMovie(hiddenRecord.id);
    pendingSearchResetAfterRatingId = String(hiddenRecord.id || '');
    render();
    showToast(`Restored "${hiddenRecord.title}" from Hidden`, 'success');
    return true;
  }
  if (existing) {
    // A direct link or Wikipedia result that already belongs to the library is
    // a navigation/search action, not a reason to fetch and retag the same title.
    // Keep the current query, render the local card and make its existing state visible.
    pendingSearchResetAfterRatingId = String(existing.id || '');
    render();
    showToast(`Already in your library: "${existing.title}"`, '');
    return true;
  }
  unblockTitleForManualSearch(title);
  releaseRollingPoolExclusion(title);
  if (btn) { btn.disabled = true; btn.textContent = 'fetching...'; }
  showFetchProgress('Fetching from Wikipedia...', 12, title);
  try {
    const diagnostics = {};
    const movie = opts.preloaded || (opts.pageId
      ? await fetchWikiPageIdAcrossModes(opts.pageId, mode === 'all' ? ['all'] : [mode, 'all'], {
          ai:false,
          diagnostics,
          directLink:!!opts.directUrl
        })
      : rawUrl
        ? await refreshTitleFromWikipedia(existing, {url:rawUrl, mode, diagnostics, acceptDifferentTitle:true, ai:false})
        : await fetchWikiTitleAcrossModes(title, mode === 'all' ? ['all'] : [mode, 'all'], diagnostics, {ai:false}));
    if (!movie) throw new Error(diagnostics.reason || 'Wikipedia page is not a usable movie or show');
    if (isMovieHidden(movie)) throw new Error('Title is hidden or blocked');
    existing = existing || state.movies[movie.id] || findExistingMovieByIdentity(movie);
    const stored = existing
      ? applyFreshWikiMovie(existing.id, movie, existing)
      : upsertMoviePreservingUserState(movie);
    stored.manualAdded = true;
    touchRecord(stored);
    if (!hasCurrentAiTags(stored)) {
      try {
        await applyAiTags(stored, {force:true});
      } catch(e) {
        stored.retagStatus = 'needs-ai-tags';
        stored.retagMessage = aiTagFailureMessage(e, stored);
        touchRecord(stored);
      }
    }
    // Keep the searched card visible so it can be rated. The matching search
    // is cleared by rateMovie only after this same title receives a rating.
    pendingSearchResetAfterRatingId = String(stored.id || '');
    rebuildTagBrain();
    computeTagWeights();
    saveLocalState();
    queueDriveSync();
    scheduleTagCloudNormalization(1200);
    render();
    showToast(existing ? `Refreshed "${stored.title}"` : `Added "${stored.title}"`, 'success');
    return true;
  } catch(e) {
    if (e?.cinelensTitleExcluded || isAiSensitiveContentBlock(e)) {
      saveLocalState();
      queueDriveSync();
      render();
      showToast(`Skipped "${title}" because its subject triggered the content exclusion rule.`, '');
      return false;
    }
    showToast(`Could not fetch "${title}": ${e.message || e}`, 'error');
    return false;
  } finally {
    hideFetchProgress();
    if (btn) { btn.disabled = false; btn.textContent = 'search wiki'; }
  }
}

function showManualRatingPrompt(movie) {
  if (!movie || !movie.id) return;
  pendingManualRatingId = movie.id;
  const modal = document.getElementById('manualRatingModal');
  const title = document.getElementById('manualRatingTitle');
  const meta = document.getElementById('manualRatingMeta');
  if (title) title.textContent = movie.title || 'Untitled';
  if (meta) {
    const bits = [movie.year || '', movie.format ? 'show' : 'movie', movie.language || '', movie.country || ''].filter(Boolean);
    meta.textContent = bits.join(' · ');
  }
  if (modal) modal.classList.remove('hidden');
}

function closeManualRatingPrompt() {
  pendingManualRatingId = '';
  const modal = document.getElementById('manualRatingModal');
  if (modal) modal.classList.add('hidden');
}

function ratePendingManualMovie(rating) {
  const id = pendingManualRatingId;
  if (!id) return;
  closeManualRatingPrompt();
  pendingSearchResetAfterRatingId = String(id);
  rateMovie(id, rating);
}

function manualTagCloud(movie) {
  const counts = new Map();
  fullAiTagVocabulary().forEach(({tag, count}) => {
    const normalised = normaliseTagName(tag);
    if (!normalised || !tagAllowed(movie, normalised) || isMetaTag(normalised) || movieGenres(movie).includes(normalised)) return;
    counts.set(normalised, (counts.get(normalised) || 0) + Number(count || 0));
  });
  return [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function openManualTagChooser(id, event) {
  if (event) event.stopPropagation();
  const movie = state.movies[id];
  if (!movie) return;
  manualTagMovieId = id;
  manualTagSelections = new Set([
    ...(movie.aiTagPartial?.tags || []),
    ...(hasCurrentAiTags(movie) ? movie.tags || [] : [])
  ].map(normaliseTagName).filter(Boolean));
  const search = document.getElementById('manualTagSearch');
  if (search) search.value = '';
  document.getElementById('manualTagModal')?.classList.remove('hidden');
  renderManualTagChooser();
}

function closeManualTagChooser() {
  manualTagMovieId = '';
  manualTagSelections = new Set();
  document.getElementById('manualTagModal')?.classList.add('hidden');
}

function toggleManualTagChoice(encodedTag) {
  const tag = decodeURIComponent(encodedTag);
  if (manualTagSelections.has(tag)) manualTagSelections.delete(tag);
  else if (manualTagSelections.size < AI_TAG_MAX_COUNT) manualTagSelections.add(tag);
  renderManualTagChooser();
}

function renderManualTagChooser() {
  const movie = state.movies[manualTagMovieId];
  const grid = document.getElementById('manualTagGrid');
  if (!movie || !grid) return;
  const query = String(document.getElementById('manualTagSearch')?.value || '').trim().toLowerCase();
  const cloud = manualTagCloud(movie).filter(([tag]) => !query || tag.includes(query));
  const title = document.getElementById('manualTagTitle');
  if (title) title.textContent = movie.title;
  const count = document.getElementById('manualTagCount');
  if (count) count.textContent = `${manualTagSelections.size}/${AI_TAG_MIN_COUNT} required · ${AI_TAG_MAX_COUNT} maximum`;
  const save = document.getElementById('manualTagSaveBtn');
  if (save) save.disabled = manualTagSelections.size < AI_TAG_MIN_COUNT;
  grid.innerHTML = cloud.slice(0, 500).map(([tag, uses]) => {
    const selected = manualTagSelections.has(tag);
    return `<button class="manual-tag-option${selected ? ' selected' : ''}" onclick="toggleManualTagChoice('${encodeURIComponent(tag)}')">${tag}<span>${uses}</span></button>`;
  }).join('') || '<span class="manual-tag-empty">No existing tags match this filter.</span>';
}

function saveManualTagChoices() {
  const movie = state.movies[manualTagMovieId];
  if (!movie || manualTagSelections.size < AI_TAG_MIN_COUNT) return;
  const tags = [...manualTagSelections].slice(0, AI_TAG_MAX_COUNT);
  const evidence = {...(movie.aiTagPartial?.evidence || {})};
  tags.forEach(tag => {
    if (!evidence[tag]) evidence[tag] = {confidence:1, evidence:'Selected manually from the existing CineLens tag cloud'};
  });
  commitAiTagSet(movie, {tags, evidence}, 'manual-tag-cloud');
  rebuildTagBrain();
  computeTagWeights();
  saveLocalState();
  queueDriveSync();
  closeManualTagChooser();
  render();
  showToast(`Saved ${tags.length} tags for "${movie.title}"`, 'success');
}

async function fetchWikiMovie(wikiTitle, mode='all', diagnostics=null, opts={}) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&redirects=1&titles=${encodeURIComponent(wikiTitle)}&prop=extracts|categories|pageimages|revisions&explaintext=1&exlimit=1&cllimit=80&pithumbsize=360&rvprop=content&rvslots=main&pithumbsize=360&formatversion=2&format=json&origin=*`;
  const data = await wikiApiJson(url);
  const movie = parseWikiMovieResponse(data, wikiTitle, mode, diagnostics, opts);
  if (movie && opts.ai !== false) await applyAiTags(movie);
  return movie;
}

async function fetchWikiMovieByPageId(pageId, mode='all', opts={}) {
  const clean = String(pageId || '').replace(/^wiki_/, '');
  if (!clean) return null;
  const url = `https://en.wikipedia.org/w/api.php?action=query&pageids=${encodeURIComponent(clean)}&prop=extracts|categories|pageimages|revisions&explaintext=1&exlimit=1&cllimit=80&rvprop=content&rvslots=main&pithumbsize=360&formatversion=2&format=json&origin=*`;
  const data = await wikiApiJson(url);
  const movie = parseWikiMovieResponse(data, clean, mode, opts.diagnostics || null, opts);
  if (movie && opts.ai !== false) await applyAiTags(movie);
  return movie;
}

function needsReceptionBackfill(movie) {
  if (!movie || movie.source !== 'wikipedia') return false;
  if (!movie.storyText || (!movie.wikiPageId && !movie.wikiTitle && !movie.pageTitle)) return false;
  return !movie.reception || Number(movie.reception.version || 0) < RECEPTION_VERSION;
}

function receptionBackfillRecentlyAttempted(movie, now=Date.now()) {
  const attemptedAt = Date.parse(movie?.receptionBackfillAttemptedAt || '') || 0;
  return !!attemptedAt && now - attemptedAt < RECEPTION_BACKFILL_RETRY_COOLDOWN_MS;
}

function receptionBackfillCandidates() {
  const now = Date.now();
  const candidates = Object.values(state.movies || {})
    .filter(needsReceptionBackfill)
    .filter(movie => !receptionBackfillRecentlyAttempted(movie, now));
  const scored = new Map(scoreMovies().map(item => [String(item.movie.id), item]));
  return candidates.sort((a,b) => {
    const aRated = Number(a.rating || 0) > 0;
    const bRated = Number(b.rating || 0) > 0;
    if (aRated !== bRated) return aRated ? -1 : 1;
    if (aRated && bRated) return Number(b.rating || 0) - Number(a.rating || 0) || titleSortKey(a).localeCompare(titleSortKey(b));
    const aScore = Number(scored.get(String(a.id))?.matchScore || -1);
    const bScore = Number(scored.get(String(b.id))?.matchScore || -1);
    const aRecommended = aScore >= 0;
    const bRecommended = bScore >= 0;
    if (aRecommended !== bRecommended) return aRecommended ? -1 : 1;
    if (aRecommended && bRecommended) return bScore - aScore || titleSortKey(a).localeCompare(titleSortKey(b));
    return titleSortKey(a).localeCompare(titleSortKey(b));
  });
}

function scheduleReceptionBackfill(delay=3500) {
  if (!libraryWritesUnlocked || receptionBackfillInProgress) return;
  const hasWork = Object.values(state.movies || {}).some(needsReceptionBackfill);
  if (!hasWork) return;
  if (receptionBackfillTimer) {
    clearTimeout(receptionBackfillTimer);
    receptionBackfillTimer = null;
  }
  const run = () => {
    receptionBackfillTimer = null;
    runReceptionBackfill();
  };
  if ('requestIdleCallback' in window) {
    receptionBackfillTimer = setTimeout(() => requestIdleCallback(run, {timeout: 1500}), delay);
  } else {
    receptionBackfillTimer = setTimeout(run, delay);
  }
}

async function runReceptionBackfill() {
  if (!libraryWritesUnlocked || receptionBackfillInProgress || poolExpansionInProgress || backgroundAiTaggingInProgress) {
    scheduleReceptionBackfill(3000);
    return;
  }
  const candidates = receptionBackfillCandidates();
  if (!candidates.length) return;
  receptionBackfillInProgress = true;
  const changedMovieIds = [];
  try {
    for (const movie of candidates.slice(0, RECEPTION_BACKFILL_BATCH_SIZE)) {
      if (poolExpansionInProgress || backgroundAiTaggingInProgress) break;
      try {
        const mode = movie.format ? 'shows' : 'movies';
        const fresh = movie.wikiPageId
          ? await fetchWikiMovieByPageId(movie.wikiPageId, mode, {ai:false, directLink:!!movie.manualAdded})
          : await fetchWikiMovie(movie.wikiTitle || movie.pageTitle || movie.title, mode, null, {ai:false, directLink:!!movie.manualAdded});
        if (!fresh?.reception) {
          movie.receptionBackfillAttemptedAt = nowStamp();
          touchRecord(movie);
          changedMovieIds.push(String(movie.id));
          continue;
        }
        movie.reception = normaliseReceptionRecord(fresh.reception);
        delete movie.receptionBackfillAttemptedAt;
        movie.wikiParserVersion = Math.max(Number(movie.wikiParserVersion || 0), Number(fresh.wikiParserVersion || WIKI_PARSER_VERSION));
        touchRecord(movie);
        changedMovieIds.push(String(movie.id));
      } catch(error) {
        movie.receptionBackfillAttemptedAt = nowStamp();
        touchRecord(movie);
        changedMovieIds.push(String(movie.id));
      }
    }
    if (changedMovieIds.length) {
      updateReceptionCalibration();
      saveLocalState({preserveUpdatedAt:true, changedMovieIds});
      queueDriveSync();
      invalidateTasteModel();
      render();
    }
  } catch(error) {
    console.warn('Reception backfill paused', error);
  } finally {
    receptionBackfillInProgress = false;
    scheduleReceptionBackfill(9000);
  }
}

function rejectWikiParse(diagnostics, reason) {
  if (diagnostics) diagnostics.reason = reason;
  return null;
}

function parseWikiMovieResponse(data, requestedTitle, mode='all', diagnostics=null, opts={}) {
  const pages = data.query?.pages;
  if (!pages) return rejectWikiParse(diagnostics, 'Wikipedia returned no page data');
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return rejectWikiParse(diagnostics, 'Wikipedia page not found');

  const extract = page.extract || '';
  const pageTitle = page.title || requestedTitle;
  const thumbnailUrl = page.thumbnail?.source || '';
  const title = pageTitle.replace(/ \(.*\)$/, '').trim();
  const wikiPageId = String(page.pageid || '').trim();
  const id = 'wiki_' + wikiPageId;

  const cats = (page.categories || []).map(c => c.title.toLowerCase());
  const wikitext = page.revisions?.[0]?.slots?.main?.content || page.revisions?.[0]?.['*'] || '';
  const infobox = infoboxMediaInfo(wikitext);
  const directLink = !!opts.directLink;
  if (isFranchiseOverviewPage(pageTitle, extract, cats, {directLink})) return rejectWikiParse(diagnostics, 'franchise or overview page, not one title');
  const catText = cats.join(' ');
  const leadText = extract.slice(0, 1400);
  const mediaEvidence = pageMediaEvidence(leadText, cats);
  const preliminaryFormat = inferPageFormat(pageTitle, leadText, cats, mediaEvidence);
  const infoboxMedia = infobox.type === 'film' || infobox.type === 'show';
  // A genuine film/show infobox is stronger evidence than a loose lead sentence.
  // This prevents an ambiguous film title from being rejected merely because the
  // page also names its creator or production company in the first sentence.
  if (isPersonOrOrganizationPage(pageTitle, leadText, cats) && !infoboxMedia && !mediaEvidence.film && !mediaEvidence.show && !preliminaryFormat.strong) return rejectWikiParse(diagnostics, 'person or organization page, not a movie/show');
  const trustedLane = opts.trustedLane || null;
  if (!mediaEvidence.film && !mediaEvidence.show && !preliminaryFormat.strong && !infoboxMedia && !trustedLane) return rejectWikiParse(diagnostics, 'no film/show evidence');
  const formatDecision = preliminaryFormat;
  const format = formatDecision.strong ? formatDecision.format : (infobox.type === 'show' ? 'series' : (trustedLane ? (trustedLane.mode === 'shows' ? 'series' : null) : formatDecision.format));
  const storyText = buildStoryTextForFormat(extract, format);
  if (!storyText || storyText.length < MIN_STORY_SECTION_CHARS) return rejectWikiParse(diagnostics, 'no usable narrative section');
  const reception = parseReceptionFromExtract(extract);

  let language = languageFromInfobox(infobox);
  const languageEvidence = hasAllowedLanguageEvidence(cats, leadText);
  const englishEvidence = languageEvidence.english;
  const hindiEvidence = languageEvidence.hindi;

  // A clear media-infobox language is the primary source. It must win over
  // unrelated maintenance/citation categories or incidental foreign-language
  // words elsewhere in the page metadata.
  if (language === 'Other') return rejectWikiParse(diagnostics, 'title language is not Hindi or English');
  if (!language && explicitDisallowedLanguageEvidence(cats, leadText, infobox.language)) {
    return rejectWikiParse(diagnostics, 'title language is not Hindi or English');
  }
  if (!language && hindiEvidence) language = 'Hindi';
  else if (!language && englishEvidence) language = 'English';
  else if (!language && trustedLane?.language) language = trustedLane.language;

  if (!format && !mediaEvidence.film && trustedLane?.mode !== 'movies' && !(formatDecision.strong && formatDecision.format === null)) return rejectWikiParse(diagnostics, 'not a movie page');
  if (mode === 'movies' && format) return rejectWikiParse(diagnostics, 'title is a show, not a movie');
  if (mode === 'shows' && !format) return rejectWikiParse(diagnostics, 'title is a movie, not a show');

  const year = deriveReleaseYear(leadText, extract, cats, format);

  if (language !== 'English' && language !== 'Hindi') return rejectWikiParse(diagnostics, 'English or Hindi language evidence missing');
  if (format && language === 'Hindi') return rejectWikiParse(diagnostics, 'Hindi shows are excluded');

  let country = language === 'Other' ? 'Unknown' : 'USA';
  if (language === 'Hindi') country = 'India';
  else if (mode === 'shows' && (cats.some(c => c.includes('indian television') || c.includes('indian web series')) || /\bindian\b/i.test(leadText))) country = 'India';
  else if (cats.some(c => c.includes('british film') || c.includes('united kingdom') || c.includes('british television'))) country = 'UK';
  else if (cats.some(c => c.includes('indian film') || c.includes('indian television'))) country = 'India';

  const dirMatch = leadText.match(/directed by ([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,3})/);
  const creatorMatch = leadText.match(/created by ([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,3})/);
  const director = dirMatch ? dirMatch[1] : (creatorMatch ? creatorMatch[1] : 'Unknown');

  if (!year || !title || !wikiPageId) return rejectWikiParse(diagnostics, 'missing release year, title or Wikipedia page ID');

  const genres = deriveGenres(leadText, cats);
  const candidate = {
    id, title, year, director, language, country, format: format||null,
    genres, categoryText: cats.join(' '),
    tags: [], coreTags: [], plotTags: [], descriptorTags: [], rawDescriptors: [],
    tagged: false, rating: 0, source: 'wikipedia', wikiPageId, wikiUrl: wikiUrlFromTitle(pageTitle), wikiTitle: pageTitle, pageTitle, thumbnailUrl, storyText, leadText, reception, wikiVerified: true, retagStatus: 'needs-ai-tags', retagMessage: 'AI tags pending',
    wikiParserVersion: WIKI_PARSER_VERSION
  };
  if (isConventionalHorrorTitle(candidate)) return rejectWikiParse(diagnostics, 'conventional horror is excluded');
  return candidate;
}

function wikiHeadingInfo(line) {
  const raw = String(line || '').trim();
  const match = raw.match(/^(=+)\s*(.*?)\s*\1$/);
  if (!match || match[1].length < 2) return null;
  return { title:match[2].trim().toLowerCase(), level:match[1].length };
}

function wikiSectionBlocks(extract) {
  const text = (extract || '').replace(/\r/g, '').trim();
  if (!text) return [];
  const lines = text.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const headingInfo = wikiHeadingInfo(lines[i]);
    if (!headingInfo) continue;
    const out = [];
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      const nextHeading = wikiHeadingInfo(line);
      if (nextHeading) {
        if (nextHeading.level <= headingInfo.level) break;
        continue;
      }
      if (line) out.push(line);
      if (out.join(' ').length > 12000) break;
    }
    const section = out.join(' ').replace(/\s+/g, ' ').trim();
    blocks.push({ heading:headingInfo.title, level:headingInfo.level, section });
  }
  return blocks;
}

function extractNarrativeSection(extract) {
  const text = (extract || '').replace(/\r/g, '').trim();
  if (!text) return '';
  const candidates = [];
  wikiSectionBlocks(text).forEach(({heading, section}) => {
    if (/\bepisodes?\b/i.test(heading)) return;
    const score = narrativeSectionScore(heading, section);
    if (score > 0) candidates.push({ section, score });
  });
  candidates.sort((a,b) => b.score - a.score || b.section.length - a.section.length);
  return candidates[0]?.section || extractInlineNarrative(text);
}

function cleanEpisodeSynopsisBlock(block) {
  return String(block || '')
    .replace(/\bDirected by\s+.*?(?=\b(?:Written by|Story by|Teleplay by)\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|\b\d[A-Z]{2,}\d{2,}\b|$)/gi, ' ')
    .replace(/\b(?:Written by|Story by|Teleplay by)\s+.*?(?=\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|\b\d[A-Z]{2,}\d{2,}\b|$)/gi, ' ')
    .replace(/^\s*\d+\s+"[^"]+"\s*/g, ' ')
    .replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/g, ' ')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d+(?:\.\d+)?\s+million\b/gi, ' ')
    .replace(/\(in millions\)/gi, ' ')
    .replace(/\b\d[A-Z]{2,}\d{2,}\b/g, ' ')
    .replace(/\b[A-Z]{2,}\d{2,}[A-Z0-9]*\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function episodeSynopsisCandidate(line) {
  const text = cleanEpisodeSynopsisBlock(line);
  if (text.length < 120) return '';
  if (!/[.!?]/.test(text)) return '';
  if (/\b(No\.?|Title|Directed by|Written by|Original release date|Air date|Prod\.?\s*code|Series|Season|U\.S\. viewers?)\b/i.test(text)) return '';
  if (!narrativeSectionScore('plot', text)) return '';
  return text;
}

function extractEpisodeSynopses(extract, capChars=SHOW_STORY_MAX_CHARS) {
  const sections = wikiSectionBlocks(extract).filter(({heading}) => /episodes?/i.test(heading));
  const synopses = [];
  sections.forEach(({section}) => {
    const pieces = String(section || '')
      .split(/\n+|\s{2,}|\s(?=\d+\s+"[^"]+")/);
    pieces.forEach(piece => {
      if (synopses.join(' ').length >= capChars) return;
      const candidate = episodeSynopsisCandidate(piece);
      if (candidate) synopses.push(candidate);
    });
  });
  return synopses.join(' ').replace(/\s+/g, ' ').trim().slice(0, capChars).trim();
}

function buildStoryTextForFormat(extract, format) {
  const primary = extractNarrativeSection(extract);
  if (!format) return primary;
  const episodeText = extractEpisodeSynopses(extract, SHOW_STORY_MAX_CHARS);
  return [primary, episodeText]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, SHOW_STORY_MAX_CHARS)
    .trim();
}

function emptyReception(present=false) {
  return {
    version:RECEPTION_VERSION,
    present:!!present,
    rtScore:null,
    rtCount:null,
    mcScore:null,
    mcCount:null,
    consensus:'',
    praise:[],
    criticism:[],
    qualitySignal:0,
    strength:0,
    parsedAt:nowStamp()
  };
}

function receptionSectionText(extract) {
  const wanted = /\b(reception|critical response|critical reception|reviews?|response)\b/i;
  const block = wikiSectionBlocks(extract).find(item => wanted.test(item.heading));
  return block?.section || '';
}

function parseCountNear(text, index) {
  const value = String(text || '');
  const after = value.slice(index, index + 200);
  const before = value.slice(Math.max(0, index - 120), index);
  const match = after.match(/based on\s+([\d,]+)\s+(?:critic\s+)?reviews?/i)
    || after.match(/([\d,]+)\s+(?:critic\s+)?reviews?/i)
    || before.match(/based on\s+([\d,]+)\s+(?:critic\s+)?reviews?/i)
    || before.match(/([\d,]+)\s+(?:critic\s+)?reviews?/i);
  return match ? Math.max(0, parseInt(match[1].replace(/,/g, ''), 10) || 0) : null;
}

function parseAggregatorScores(text) {
  const value = {rtScore:null, rtCount:null, mcScore:null, mcCount:null};
  const compact = String(text || '').replace(/\s+/g, ' ');
  const rtMatch = compact.match(/Rotten Tomatoes.{0,160}?(\d{1,3})\s*%/i);
  if (rtMatch) {
    value.rtScore = clamp(Number(rtMatch[1]), 0, 100);
    value.rtCount = parseCountNear(compact, rtMatch.index || 0);
  }
  const mcMatch = compact.match(/Metacritic.{0,120}?(?:score|weighted average)?\s*(?:of|:)?\s*(\d{1,3})(?:\s*\/\s*100)?/i);
  if (mcMatch) {
    value.mcScore = clamp(Number(mcMatch[1]), 0, 100);
    value.mcCount = parseCountNear(compact, mcMatch.index || 0);
  }
  return value;
}

function receptionConsensus(text) {
  const value = String(text || '').toLowerCase();
  if (/\b(?:critically|widely|universally)\s+acclaimed\b|\buniversal acclaim\b/.test(value)) return 'acclaimed';
  if (/\bpositive reviews?\b|\bfavourable reviews?\b|\bfavorable reviews?\b/.test(value)) return 'positive';
  if (/\bmixed (?:reviews?|reception)\b|\bmixed or average reviews?\b/.test(value)) return 'mixed';
  if (/\bnegative reviews?\b|\bpanned\b|\bwidely criticis(?:ed|ized)\b|\bpoorly received\b/.test(value)) return 'negative';
  return '';
}

function receptionFacets(text) {
  const value = String(text || '').toLowerCase();
  const praise = new Set();
  const criticism = new Set();
  const add = (set, facet) => set.add(facet);
  if (/\bprais(?:ed|ing|es)[^.]{0,90}\b(?:performances?|acting|cast)\b|\b(?:performances?|acting|cast)[^.]{0,70}\bprais(?:ed|eworthy|ed)\b/.test(value)) add(praise, 'acting');
  if (/\bprais(?:ed|ing|es)[^.]{0,90}\b(?:direction|directing|director)\b/.test(value)) add(praise, 'direction');
  if (/\bprais(?:ed|ing|es)[^.]{0,90}\b(?:writing|screenplay|script)\b/.test(value)) add(praise, 'writing');
  if (/\bprais(?:ed|ing|es)[^.]{0,90}\bdialogue\b/.test(value)) add(praise, 'dialogue');
  if (/\bprais(?:ed|ing|es)[^.]{0,90}\bpacing\b/.test(value)) add(praise, 'pacing');
  if (/\bprais(?:ed|ing|es)[^.]{0,90}\bediting\b/.test(value)) add(praise, 'editing');
  if (/\b(?:coherent|well-structured|tightly constructed)\b/.test(value)) add(praise, 'coherence');
  if (/\bcriticis(?:ed|ed|ing|es)[^.]{0,90}\b(?:performances?|acting|cast)\b|\bweak performances?\b|\bpoor acting\b/.test(value)) add(criticism, 'acting');
  if (/\bcriticis(?:ed|ed|ing|es)[^.]{0,90}\b(?:direction|directing|director)\b/.test(value)) add(criticism, 'direction');
  if (/\bcriticis(?:ed|ed|ing|es)[^.]{0,90}\b(?:writing|screenplay|script)\b|\bpoorly written\b/.test(value)) add(criticism, 'writing');
  if (/\bcriticis(?:ed|ed|ing|es)[^.]{0,90}\bdialogue\b|\bclunky dialogue\b/.test(value)) add(criticism, 'dialogue');
  if (/\bcriticis(?:ed|ed|ing|es)[^.]{0,90}\bpacing\b|\bslow pacing\b|\bpoorly paced\b/.test(value)) add(criticism, 'pacing');
  if (/\bcriticis(?:ed|ed|ing|es)[^.]{0,90}\bediting\b|\bpoor editing\b/.test(value)) add(criticism, 'editing');
  if (/\bincoherent\b|\bconfusing plot\b|\bnarrative incoherence\b/.test(value)) add(criticism, 'coherence');
  if (/\bmelodramatic\b|\bmelodrama\b/.test(value)) add(criticism, 'melodrama');
  return {praise:[...praise], criticism:[...criticism]};
}

function aggregatorSignal(score) {
  if (score == null) return null;
  return clamp((Number(score) - 58) / 42, -1, 1);
}

function parseReceptionFromExtract(extract) {
  const section = receptionSectionText(extract);
  if (!section || section.length < 24) return emptyReception(false);
  const reception = emptyReception(true);
  Object.assign(reception, parseAggregatorScores(section));
  reception.consensus = receptionConsensus(section);
  const facets = receptionFacets(section);
  reception.praise = facets.praise;
  reception.criticism = facets.criticism;

  const signals = [];
  const rt = aggregatorSignal(reception.rtScore);
  const mc = aggregatorSignal(reception.mcScore);
  if (rt != null) signals.push({value:rt, weight:reception.rtCount ? 3 : 2});
  if (mc != null) signals.push({value:mc, weight:reception.mcCount ? 3 : 2});
  const consensusSignal = {acclaimed:0.85, positive:0.45, mixed:0, negative:-0.75}[reception.consensus];
  if (consensusSignal != null) signals.push({value:consensusSignal, weight:1.4});
  const facetSignal = clamp((reception.praise.length - reception.criticism.length) / 4, -0.6, 0.6);
  if (reception.praise.length || reception.criticism.length) signals.push({value:facetSignal, weight:0.8});
  const totalWeight = signals.reduce((sum, item) => sum + item.weight, 0);
  reception.qualitySignal = totalWeight ? clamp(signals.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight, -1, 1) : 0;
  const reviewCount = Math.max(Number(reception.rtCount || 0), Number(reception.mcCount || 0));
  let strength = 0;
  if (reviewCount) strength = 0.55 + Math.min(0.4, Math.log10(reviewCount + 1) / 5);
  else if (reception.rtScore != null || reception.mcScore != null) strength = 0.55;
  else if (reception.consensus) strength = 0.4;
  else if (reception.praise.length || reception.criticism.length) strength = 0.25;
  else strength = section.length > 140 ? 0.18 : 0.08;
  reception.strength = clamp(strength, 0, 1);
  if (!reception.strength) reception.present = false;
  return reception;
}

function extractInlineNarrative(text) {
  const beforeHeadings = String(text || '').split(/\n\s*==/)[0] || '';
  const compact = beforeHeadings.replace(/\s+/g, ' ').trim();
  const sentences = compact.match(/[^.!?]+[.!?]+/g) || [];
  const start = sentences.findIndex(sentence =>
    /^\s*In the (?:film|series|show),/i.test(sentence)
    || /\b(?:film|series|show|story|narrative|premise|synopsis)\s+(?:follows?|revolves?|cent(?:er|re)s?|focuses?|chronicles?|depicts?)\b/i.test(sentence)
    || /\b(?:follows?|revolves around|cent(?:er|re)s on|focuses on|chronicles)\s+(?:the life|the story|a |an |two |three |four |several )/i.test(sentence)
  );
  if (start < 0) return '';
  const out = [];
  for (let i = start; i < sentences.length && out.length < 8; i++) {
    const sentence = sentences[i].trim();
    if (out.length && /\b(production|filming|casting|cast members?|development began|premiered|released|received praise|grossed|box office|accolades|sequel)\b/i.test(sentence)) break;
    out.push(sentence);
    if (out.join(' ').length > 1800) break;
  }
  const section = out.join(' ').replace(/\s+/g, ' ').trim();
  return section.length >= MIN_STORY_SECTION_CHARS ? section : '';
}

function narrativeSectionScore(heading, section) {
  const text = String(section || '').replace(/\s+/g, ' ').trim();
  if (text.length < MIN_STORY_SECTION_CHARS) return 0;
  const narrativeSignals = (text.match(/\b(revolves?|follows?|cent(?:er|re)s? on|chronicles?|depicts?|portrays?|focuses? on|story of|lives? of|protagonist|character|moves? into|falls? in love|discovers?|learns?|decides?|attempts?|struggles?|must|returns?|begins?|becomes?|finds?|joins?|leaves?|dies?|killed|marries?|divorces?|relationship|family|brother|sister|father|mother|son|daughter)\b/gi) || []).length;
  const productionSignals = (text.match(/\b(production|filming|casting|cast members?|developed by|created by|executive producer|network|broadcast rights|renewed|canceled|cancelled|ratings|reception|viewership|episodes? ordered|premiered on|released on)\b/gi) || []).length;
  const actionSentences = (text.match(/(?:^|[.!?]\s+)[A-Z][^.!?]{20,220}\b(?:is|are|was|were|has|have|must|tries?|attempts?|discovers?|learns?|finds?|meets?|returns?|becomes?|begins?|leaves?|joins?|kills?|dies?|falls?|struggles?|decides?)\b[^.!?]*[.!?]/g) || []).length;
  const narrativeOpening = /\b(series|film|show|story)\s+(revolves?|follows?|cent(?:er|re)s?|chronicles?|depicts?|focuses?)\b/i.test(text.slice(0, 500));
  const headingHint = /^(plot|story|premise|synopsis|plot summary|story summary)$/i.test(heading)
    ? 500
    : /\b(plot|story|narrative|premise|synopsis|summary|overview|character)\b/i.test(heading) ? 12 : 0;
  const nonStoryHeading = /\b(cast|casting|characters? list|episodes?|production|development|filming|release|broadcast|reception|ratings?|awards?|music|soundtrack|marketing|references?|external links?|see also)\b/i.test(heading);
  const contentIsNarrative = narrativeSignals >= 3
    && (narrativeOpening || actionSentences >= 2 || narrativeSignals >= productionSignals * 2 + 2);
  if (!contentIsNarrative || (nonStoryHeading && narrativeSignals < productionSignals * 3 + 5)) return 0;
  return narrativeSignals * 3 + actionSentences * 2 + headingHint - productionSignals * 4 - (nonStoryHeading ? 8 : 0);
}

function normaliseWikiHeading(line) {
  return wikiHeadingInfo(line)?.title || '';
}

function deriveReleaseYear(leadText, extract, cats, format) {
  const catText = (cats || []).join(' ');
  const catPatterns = format
    ? [/\b(19[3-9]\d|20[0-3]\d) [a-z -]*television series debuts\b/, /\b(19[3-9]\d|20[0-3]\d) [a-z -]*web series debuts\b/]
    : [/\b(19[3-9]\d|20[0-3]\d) [a-z -]*films\b/];
  for (const rx of catPatterns) {
    const m = catText.match(rx);
    if (m) return parseInt(m[1], 10);
  }
  const lead = leadText || '';
  const releaseMatch = lead.match(/\b(released|premiered|debuted|aired|broadcast|streamed)\D{0,80}\b(19[3-9]\d|20[0-3]\d)\b/i);
  if (releaseMatch) return parseInt(releaseMatch[2], 10);
  const firstYear = (lead.match(/\b(19[3-9]\d|20[0-3]\d)\b/) || String(extract || '').match(/\b(19[3-9]\d|20[0-3]\d)\b/));
  return firstYear ? parseInt(firstYear[1], 10) : null;
}

// ─────────────────────────────────────────────
// TAG DERIVATION FROM PLOT TEXT
// This is the core intelligence — no API needed.
// We match plot keywords to a comprehensive tag vocabulary.
// ─────────────────────────────────────────────
function deriveTagsFromText(text, meta) {
  const story = (text || '').toLowerCase();
  const lead = (meta.leadText || '').toLowerCase();
  const cat = (meta.categoryText || '').toLowerCase();
  const all = `${lead} ${story}`;
  const tags = new Set();
  const add = tag => { if (tag) tags.add(tag); };
  const has = rx => rx.test(all);
  const storyHas = rx => rx.test(story);
  const leadHas = rx => rx.test(lead);
  const catHas = rx => rx.test(cat);

  const lang = (meta.language || 'English').toLowerCase().replace(/\s+/g,'-') + '-language';
  const country = (meta.country || 'usa').toLowerCase().replace(/\s+/g,'-');
  const decade = meta.year ? Math.floor(meta.year/10)*10 + 's' : '2000s';
  const fmt = meta.format || 'film';
  add(lang); add(country); add(decade); add(fmt);
  if (fmt !== 'film') add('prestige-tv');

  // Broad genre labels require corroborating evidence; one plot word must not classify the whole title.
  const crimeSignals = [
    /\b(murder|homicide|killing)\b/,
    /\b(detective|investigation|investigates|police procedural)\b/,
    /\b(heist|robbery|theft)\b/,
    /\b(gangster|mob|mafia|cartel|crime syndicate)\b/,
    /\b(criminal conspiracy|crime lord|organised crime|organized crime)\b/
  ].filter(rx => rx.test(story)).length;
  if (crimeSignals >= 2 || leadHas(/\b(crime thriller|crime drama|mystery thriller|detective drama)\b/) || catHas(/\bcrime (films|television series)\b/)) add('crime-thriller');
  if (has(/\b(serial killer|psychopath|criminal profiler|profiling unit|fbi profiler)\b/)) add('serial-killer-thriller');
  if (has(/\b(ghost|haunted|supernatural|demon|possession|exorcism|exorcist|witchcraft|occult)\b/)) add('supernatural-horror');
  if (has(/\b(zombie|undead|global outbreak|viral outbreak|post-apocalyptic|wasteland)\b/)) add('apocalyptic');
  if (has(/\b(spacecraft|astronaut|alien|extraterrestrial|interstellar|planetary mission|space mission|nasa|spaceship|space station)\b/)) add('space-sci-fi');
  if (has(/\b(robot|android|artificial intelligence|\bai\b|sentient machine|cyborg|simulation|virtual reality)\b/)) add('artificial-intelligence');
  if (has(/\b(time travel|travels? (back|forward) in time|time loop|temporal|paradox|alternate timeline|parallel timeline)\b/)) add('time-manipulation');
  if (has(/\b(dream world|subconscious|surreal|hallucination|psychedelic|blurs reality|dreams within dreams)\b/)) add('surreal-dreamlike');
  if (has(/\b(world war|wwii|world war ii|nazi|nazis|soldier|military unit|army officer|battlefield|combat mission|war-torn|wartime)\b/) || catHas(/\bwar films\b|\bworld war ii films\b/)) add('war-drama');
  if (has(/\b(prison|inmate|incarcerated|jail|penitentiary|wrongfully imprisoned)\b/)) add('prison-setting');
  if (has(/\b(courtroom|trial|judge|jury|lawyer|attorney|verdict|legal case)\b/)) add('courtroom-drama');
  if (has(/\b(political conspiracy|government corruption|election campaign|regime|authoritarian government|state corruption)\b/)) add('political-thriller');
  if (has(/\b(spy|espionage|secret agent|intelligence agency|cia|mi6|undercover agent|surveillance operation)\b/)) add('spy-thriller');
  if (has(/\b(drug cartel|narcotics|drug trafficking|drug dealer|addiction|heroin|cocaine|methamphetamine)\b/)) add('drug-trade');
  if (has(/\b(heist|bank robbery|vault|steal|theft|con artist|confidence trick|grift)\b/)) add('heist-thriller');
  if (has(/\b(western|cowboy|frontier|gunfighter|outlaw|sheriff|saloon)\b/)) add('western');
  if (has(/\b(musician|band|concert|jazz singer|rock band|composer|music career|recording artist)\b/)) add('music-world');
  if (has(/\b(cricket|football|basketball|baseball|tennis|boxing|wrestling|racing driver|athlete|sports coach|tournament|championship|world cup|olympics|sports team|hockey|kabaddi)\b/)) add('sports-drama');
  if (leadHas(/\bcomedy\b/) || catHas(/\bcomedy (films|television series)\b/) || storyHas(/\b(comic misunderstanding|farce|satirical comedy|dark comedy)\b/)) add('comedy');
  if (leadHas(/\bdrama\b/) || catHas(/\bdrama (films|television series)\b/)) add('drama');
  if (leadHas(/\bromantic\b/) || has(/\b(falls in love|love affair|romantic relationship|heartbreak|wedding|marriage proposal)\b/)) add('romance');
  if (leadHas(/\bhorror\b/) || catHas(/\bhorror films\b/) || has(/\b(terrifying|slasher|haunting|creature stalks)\b/)) add('horror');
  if (has(/\b(based on a true story|based on actual events|true story|real-life|biographical|biopic|historical figure)\b/) || catHas(/\bbiographical films\b/)) add('based-on-true-story');
  if (leadHas(/\banimated\b/) || catHas(/\banimated films\b/)) add('animated');
  if (leadHas(/\bdocumentary\b/) || catHas(/\bdocumentary films\b/)) add('documentary');
  if (has(/\b(superhero|marvel comics|dc comics|batman|spider-man|avenger|x-men)\b/)) add('superhero');
  if (has(/\b(magic|wizard|dragon|mythical kingdom|fairy tale|enchanted|fantasy world)\b/) || leadHas(/\bfantasy\b/)) add('fantasy');
  if (has(/\b(mythology|folklore|legendary creature|ancient legend|gods|goddess)\b/)) add('mythology-folklore');

  // Narrative and character tags. These require clear phrases, not generic single words.
  if (has(/\b(plot twist|twist ending|shocking revelation|final revelation|unexpected revelation)\b/)) add('twist-ending');
  if (has(/\b(unresolved ending|unresolved plot|unresolved storyline|unresolved mystery|left unresolved|remain unresolved|remains unresolved|without resolution|no resolution|wonders? if .{0,80}\\b(is|are|remains?|remain) (still )?out there|threat .{0,40}\\b(is|remains?) (still )?out there)\b/)) add('unresolved-ending');
  if (has(/\b(open ending|open-ended ending|open ended ending|open-ended finale|open ended finale|ending is left open|future is left open)\b/)) add('open-ending');
  if (has(/\b(ambiguous ending|ambiguous finale|ending is ambiguous|left ambiguous|deliberately ambiguous|ambiguous fate|fate is unknown|uncertain fate)\b/)) add('ambiguous-ending');
  if (has(/\b(anticlimactic ending|anti-climactic ending|anticlimax|anti-climax|ends anticlimactically|ends anti-climactically)\b/)) add('anticlimactic-ending');
  if (has(/\b(cliffhanger ending|ends on a cliffhanger|ends with a cliffhanger|cliffhanger finale|season cliffhanger)\b/)) add('cliffhanger-ending');
  if (has(/\b(non-linear|nonlinear|flashback sequence|parallel timelines|interwoven storylines|fragmented narrative)\b/)) add('non-linear-narrative');
  if (has(/\b(unreliable narrator|false memory|subjective reality|ambiguous reality)\b/)) add('unreliable-narration');
  if (has(/\b(ensemble cast|multiple protagonists|interwoven lives|anthology)\b/)) add('ensemble-cast');
  if (has(/\b(single location|one room|confined space|trapped in a room|claustrophobic setting)\b/)) add('single-location');
  if (has(/\b(real time|one night|one day|24 hours|single night)\b/)) add('compressed-timeline');
  if (has(/\b(anti-hero|antihero|morally ambiguous|morally grey|flawed protagonist)\b/)) add('morally-ambiguous-protagonist');
  if (has(/\b(main antagonist|ruthless villain|primary villain|crime lord|serial killer)\b/)) add('compelling-villain');
  if (has(/\b(female protagonist|woman protagonist|female lead|women-led|heroine)\b/)) add('female-lead-protagonist');
  if (has(/\b(coming of age|teenage protagonist|adolescent protagonist|child protagonist|growing up)\b/)) add('coming-of-age-story');
  if (has(/\b(father and son|father-son|mother and daughter|mother-daughter|family business|estranged family|dysfunctional family|family conflict)\b/)) add('family-dynamics');
  if (has(/\b(close friendship|best friends|unlikely friendship|bond between friends|brotherhood|sisterhood)\b/)) add('friendship-bond');
  if (has(/\b(mentor and student|teacher and student|master and pupil|coach and student)\b/)) add('mentor-student');
  if (has(/\b(obsessed with|obsession with|becomes obsessed|fixated on)\b/)) add('obsession');
  if (has(/\b(seeks revenge|takes revenge|vengeance|avenges|payback)\b/)) add('revenge-driven');
  if (has(/\b(redemption|atone|second chance|seeks forgiveness)\b/)) add('redemption-arc');
  if (has(/\b(grief|mourning|bereavement|death of his|death of her|widow|widower)\b/)) add('grief-and-loss');
  if (has(/\b(cancer|terminal illness|diagnosed with|illness|disease|medical diagnosis)\b/)) add('illness-story');
  if (has(/\b(suicide|end his life|end her life|take his own life|take her own life|kill himself|kill herself)\b/)) add('suicide-theme');
  if (has(/\b(identity crisis|secret identity|double life|mistaken identity|false identity)\b/)) add('identity-crisis');
  if (has(/\b(power struggle|political ambition|rises to power|greed|corrupt ambition)\b/)) add('power-and-ambition');
  if (has(/\b(class divide|poverty|wealth inequality|working class|upper class|rich and poor)\b/)) add('class-divide');
  if (has(/\b(racism|discrimination|prejudice|segregation|caste discrimination|social stigma)\b/)) add('social-discrimination');

  // Tone and setting.
  if (leadHas(/\bneo-noir\b/) || has(/\b(bleak atmosphere|grim world|gritty crime|disturbing events|harrowing ordeal)\b/)) add('dark-tone');
  if (has(/\b(slow burn|contemplative|meditative|quiet character study|understated drama|atmospheric)\b/)) add('slow-burn');
  if (leadHas(/\bpsychological\b/) || has(/\b(mental illness|psychiatrist|therapy|psychological manipulation|mind games)\b/)) add('psychological');
  if (leadHas(/\bsatirical\b/) || has(/\b(satire|satirizes|social satire|political satire|darkly comic)\b/)) add('satirical');
  if (has(/\b(heartwarming|inspiring|optimistic ending|feel-good|joyful)\b/)) add('uplifting-tone');
  if (has(/\b(epic scale|sweeping saga|grand spectacle|large-scale battle)\b/)) add('epic-scale');
  if (has(/\b(intimate portrait|small-scale story|chamber drama|personal story)\b/)) add('intimate-scale');
  if (has(/\b(visually stunning|beautiful cinematography|striking imagery|visual spectacle)\b/)) add('visually-striking');
  if (has(/\b(emotionally devastating|deeply moving|heartbreaking|tragic ending)\b/)) add('emotionally-devastating');

  const cityMatch = all.match(/\b(new york|manhattan|brooklyn|los angeles|chicago|london|paris|berlin|mumbai|delhi|lahore)\b/);
  if (cityMatch) add(cityMatch[1].replace(/\s/g,'-') + '-setting');
  if (has(/\b(rural village|small town|remote village|isolated village|countryside)\b/)) add('rural-setting');
  if (has(/\b(urban crime|city streets|metropolis|downtown|inner city)\b/)) add('urban-setting');
  if (leadHas(/\bperiod\b/) || has(/\b(19th century|18th century|medieval|ancient kingdom|victorian era|1920s|1930s|1940s|1950s|1960s)\b/)) add('period-drama');
  if (has(/\b(dystopian|totalitarian state|surveillance state|authoritarian regime)\b/)) add('dystopian');
  if (has(/\b(post-apocalyptic|after the apocalypse|wasteland|ruined world)\b/)) add('post-apocalyptic');
  if (meta.country === 'India' || has(/\b(mumbai|delhi|kolkata|chennai|punjab|rajasthan|bengal|maharashtra)\b/)) add('india-setting');

  if (meta.director) {
    const d = meta.director.toLowerCase();
    if (/nolan/.test(d)) add('nolan-style');
    if (/fincher/.test(d)) add('fincher-style');
    if (/tarantino/.test(d)) add('tarantino-style');
    if (/villeneuve/.test(d)) add('villeneuve-style');
    if (/scorsese/.test(d)) add('scorsese-style');
    if (/kubrick/.test(d)) add('kubrick-style');
    if (/kurosawa/.test(d)) add('kurosawa-style');
    if (/anurag kashyap|kashyap/.test(d)) add('anurag-kashyap-style');
    if (/mani ratnam/.test(d)) add('mani-ratnam-style');
  }

  if (has(/\b(fight sequence|car chase|rescue mission|assassin|mercenary|kidnapping|gunfight|martial arts)\b/) || leadHas(/\baction thriller\b/)) add('action-thriller');
  if (has(/\b(mystery|missing person|hidden clue|solves the case|unknown killer|secret behind)\b/)) add('mystery-thriller');
  if (has(/\b(life of|biographical|memoir|real-life account)\b/)) add('biographical-drama');
  if (has(/\b(expedition|quest|voyage|treasure hunt|dangerous journey|escape across)\b/)) add('adventure');
  if (has(/\b(stranded|fight for survival|survive in|trapped underground|trapped inside|survival)\b/)) add('survival');
  if (has(/\b(conspiracy|cover-up|classified secret|whistleblower|secret organization)\b/)) add('conspiracy');
  if (has(/\b(betrayal|betrays|traitor|double-cross|deception)\b/)) add('betrayal');
  if (has(/\b(loyalty to|duty to|honour|honor|allegiance)\b/)) add('loyalty-conflict');
  if (has(/\b(marriage|husband and wife|divorce|spouse|wedding)\b/)) add('marriage-family');
  if (has(/\b(father.*son|son.*father|father.*daughter|daughter.*father)\b/)) add('father-child-relationship');
  if (has(/\b(mother.*son|son.*mother|mother.*daughter|daughter.*mother)\b/)) add('mother-child-relationship');
  if (has(/\b(school|college|university|student life|campus)\b/)) add('school-college-setting');
  if (has(/\b(office|corporate|workplace|employee|boss|business empire)\b/)) add('workplace-setting');
  if (has(/\b(journalist|newspaper|reporter|newsroom|broadcast journalist)\b/)) add('media-world');
  if (has(/\b(king|queen|prince|princess|royal family|throne|palace|empire)\b/)) add('royal-politics');
  if (has(/\b(village council|panchayat|local election|village politics)\b/)) add('village-politics');
  if (has(/\b(underdog|outsider|against the odds|unlikely hero)\b/)) add('underdog-story');
  if (has(/\b(moral dilemma|ethical dilemma|must choose|crisis of conscience)\b/)) add('moral-dilemma');
  if (has(/\b(two families|rival family|family feud|clan|dynasty)\b/)) add('family-dynasty');
  if (has(/\b(detective|police officer|cop|inspector|constable)\b/)) add('detective-protagonist');
  if (has(/\b(monster|creature|beast|kaiju)\b/)) add('creature-feature');
  if (has(/\b(future society|space colony|fictional world|alternate world)\b/)) add('world-building');

  return [...tags];
}

function ensureMinimumPlotTags(coreTags, text, meta={}) {
  return cleanTagArray(coreTags || [], meta, false).filter(t => !isMetaTag(t));
}

function tagEvidenceOk(tag, movie) {
  if (!movie || movie.source !== 'wikipedia') return true;
  const normalised = normaliseTagName(tag);
  const t = `${movie.storyText || ''} ${movie.leadText || ''}`.toLowerCase();
  if (!t.trim()) return !['time-manipulation','sports-drama','war-drama'].includes(tag);
  const evidenceRules = {
    'time-manipulation': /\b(time travel|travels? (back|forward) in time|time loop|temporal|paradox|alternate timeline|parallel timeline)\b/,
    'sports-drama': /\b(cricket|football|basketball|baseball|tennis|boxing|wrestling|racing driver|athlete|sports coach|tournament|championship|world cup|olympics|sports team|hockey|kabaddi)\b/,
    'war-drama': /\b(world war|wwii|world war ii|nazi|nazis|soldier|military unit|army officer|battlefield|combat mission|war-torn|wartime)\b/,
    'rape-case': /\b(rape|sexual assault|sexual violence)\b/,
    'sexual-assault': /\b(rape|sexual assault|sexual violence)\b/,
    'delhi-set': /\b(delhi|new delhi)\b/,
    'delhi-setting': /\b(delhi|new delhi)\b/,
    'class-divide': /\b(class divide|poverty|wealth inequality|working class|upper class|rich and poor)\b/,
    'crime-boss': /\b(crime boss|crime lord|gang boss|mafia boss|cartel boss|underworld boss)\b/,
    'major-case': /\b(major case|high-profile case|criminal case|legal case|court case)\b/,
    'high-rise': /\b(high-rise|high rise|tower block|apartment tower)\b/,
    'gay-school': /\b(gay|queer|homosexual|lgbt).{0,80}\b(school|student|classmate)|\b(school|student|classmate).{0,80}\b(gay|queer|homosexual|lgbt)\b/,
    'marriage-proposal': /\b(marriage proposal|proposes marriage|propose to marry|wedding proposal)\b/,
    'revenge-driven': /\b(seeks revenge|takes revenge|vengeance|avenges|payback)\b/,
    'betrayal': /\b(betrayal|betrays|traitor|double-cross|deception)\b/
  };
  if (evidenceRules[normalised]) return evidenceRules[normalised].test(t);
  return true;
}

function scoringTags(movie) {
  if (!movie) return [];
  return rawScoringTags(movie).filter(tag => tagAllowed(movie, tag));
}

function abortableSleep(ms) {
  if (fetchAbortRequested || ms <= 0) return Promise.resolve();
  return new Promise(resolve => {
    let timer = null;
    const done = () => {
      if (timer) clearTimeout(timer);
      if (currentSleepCancel === done) currentSleepCancel = null;
      resolve();
    };
    currentSleepCancel = done;
    timer = setTimeout(done, ms);
  });
}

function sleep(ms) { return abortableSleep(ms); }

function nextPaint() {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });
}

function showFetchProgress(label, pct, sub) {
  const el = document.getElementById('fetchProgress');
  if (!el) return;
  const safePct = Math.max(0, Math.min(100, Number(pct) || 0));
  el.classList.add('visible');
  el.setAttribute('aria-busy', 'true');
  const labelEl = document.getElementById('fetchLabel');
  const fillEl = document.getElementById('fetchFill');
  const subEl = document.getElementById('fetchSub');
  if (labelEl) labelEl.textContent = label || 'Working…';
  if (fillEl) fillEl.style.width = `${safePct}%`;
  if (subEl) subEl.textContent = sub || '';
  document.body.classList.add('fetching');
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--fetch-progress-height', `${el.offsetHeight + 10}px`);
  });
}
function hideFetchProgress() {
  const el = document.getElementById('fetchProgress');
  if (el) {
    el.classList.remove('visible');
    el.setAttribute('aria-busy', 'false');
  }
  document.body.classList.remove('fetching');
  document.documentElement.style.removeProperty('--fetch-progress-height');
}

// ─────────────────────────────────────────────
// HARDCODED TAGS for seed movies (instant, no fetch needed)
// ─────────────────────────────────────────────
const SEED_TAGS = {
  'tt0111161':['drama','english-language','usa','1990s','film','wrongful-imprisonment','prison-setting','friendship-bond','hope-and-redemption','institutional-oppression','slow-burn','uplifting-tone','moral-courage','based-on-novella','corrupt-authority','long-haul-narrative'],
  'tt0068646':['crime-thriller','english-language','usa','1970s','film','organised-crime-saga','family-dynasty','power-and-ambition','morally-ambiguous-protagonist','loyalty-and-betrayal','slow-burn','dark-tone','ensemble-cast','operatic-tone','patriarch-protagonist'],
  'tt0468569':['superhero','english-language','usa','2000s','film','compelling-villain','moral-philosophy','chaos-vs-order','dark-tone','cat-and-mouse-thriller','morally-ambiguous-protagonist','action-thriller','psychological','nolan-style','iconic-villain'],
  'tt0137523':['psychological-thriller','english-language','usa','1990s','film','unreliable-narration','twist-ending','identity-crisis','dark-comedy','satirical','non-linear-narrative','morally-ambiguous-protagonist','anti-establishment','fincher-style','dark-tone'],
  'tt0816692':['space-sci-fi','english-language','usa','2010s','film','time-manipulation','parent-child-relationship','grief-and-loss','hard-sci-fi','emotionally-devastating','non-linear-narrative','nolan-style','visually-striking','slow-burn'],
  'tt1375666':['space-sci-fi','english-language','usa','2010s','film','surreal-dreamlike','heist-thriller','non-linear-narrative','nolan-style','ensemble-cast','twist-ending','action-thriller','layered-reality'],
  'tt0110912':['crime-thriller','english-language','usa','1990s','film','non-linear-narrative','dark-comedy','ensemble-cast','tarantino-style','multiple-storylines','morally-ambiguous-protagonist','violence-and-humor','dialogue-driven'],
  'tt0133093':['space-sci-fi','english-language','usa','1990s','film','dystopian','chosen-one','action-thriller','philosophical','twist-ending','artificial-intelligence','cyberpunk','visually-striking'],
  'tt0114369':['crime-thriller','english-language','usa','1990s','film','serial-killer-thriller','detective-protagonist','dark-tone','urban-setting','fincher-style','cat-and-mouse-thriller','seven-deadly-sins','bleak-worldview'],
  'tt0102926':['psychological-thriller','english-language','usa','1990s','film','serial-killer-thriller','female-lead-protagonist','cat-and-mouse-thriller','compelling-villain','suspense','gender-dynamics'],
  'tt0317248':['crime-thriller','english-language','brazil','2000s','film','coming-of-age-story','urban-poverty','non-linear-narrative','ensemble-cast','based-on-true-story','gang-culture','kinetic-direction','dark-tone'],
  'tt0482571':['mystery-thriller','english-language','usa','2000s','film','twist-ending','rivalry','obsession','non-linear-narrative','unreliable-narration','nolan-style','period-drama','dark-tone'],
  'tt0209144':['psychological-thriller','english-language','usa','2000s','film','unreliable-narration','non-linear-narrative','twist-ending','identity-crisis','nolan-style','revenge-driven'],
  'tt2267998':['psychological-thriller','english-language','usa','2010s','film','unreliable-narration','twist-ending','toxic-marriage','dark-tone','fincher-style','female-villain','media-manipulation','suburban-setting'],
  'tt1291584':['crime-thriller','english-language','usa','2010s','film','missing-child','moral-dilemma','vigilante-justice','dark-tone','villeneuve-style','emotionally-devastating','parallel-investigation'],
  'tt6751668':['crime-thriller','english-language','south-korea','2010s','film','class-divide','dark-comedy','twist-ending','ensemble-cast','satirical','emotionally-devastating','visually-striking'],
  'tt2582802':['drama','english-language','usa','2010s','film','music-world','obsession','mentor-student','psychological','dark-tone','intense-pacing','coming-of-age-story'],
  'tt0816711':['space-sci-fi','english-language','usa','2010s','film','linguistics','time-manipulation','grief-and-loss','slow-burn','female-lead-protagonist','philosophical','villeneuve-style'],
  'tt0364569':['psychological-thriller','english-language','south-korea','2000s','film','revenge-driven','twist-ending','dark-tone','identity-crisis','disturbing','isolation'],
  'tt0338013':['romance','english-language','usa','2000s','film','memory-and-identity','non-linear-narrative','grief-and-loss','surreal-dreamlike','emotionally-devastating'],
  'tt0172495':['historical-action','english-language','usa','2000s','film','ancient-rome','revenge-driven','epic-scale','compelling-villain','honour-and-duty'],
  'tt0120689':['drama','english-language','usa','1990s','film','death-row','prison-setting','supernatural','empathy-and-compassion','slow-burn','uplifting-tone'],
  'tt1853728b':['western','english-language','usa','2010s','film','slavery','revenge-driven','dark-comedy','tarantino-style','violence-and-humor','morally-ambiguous-protagonist'],
  'tt0120586':['drama','english-language','usa','1990s','film','social-discrimination','redemption-arc','prison','dark-tone','emotionally-devastating'],
  'tt1853728c':['space-sci-fi','english-language','usa','2010s','film','artificial-intelligence','identity-crisis','slow-burn','visually-striking','dystopian','villeneuve-style'],
  'tt0047478':['historical-action','english-language','japan','1950s','film','honour-and-duty','class-divide','ensemble-cast','kurosawa-style','action-choreography','slow-burn'],
  'tt0087843':['crime-thriller','english-language','usa','1980s','film','organised-crime-saga','memory-and-identity','friendship-bond','non-linear-narrative','slow-burn','period-drama'],
  'tt0253474':['war-drama','english-language','poland','2000s','film','world-war-ii','survival','based-on-true-story','emotionally-devastating','historical-drama','slow-burn'],
  'tt0405094':['political-thriller','english-language','germany','2000s','film','surveillance','cold-war','redemption-arc','slow-burn','dark-tone'],
  'tt0050083':['courtroom-drama','english-language','usa','1950s','film','single-location','ensemble-cast','justice-system','class-divide','slow-burn','moral-courage'],
  // Hindi seeds
  'in001':['action-adventure','hindi-language','india','1970s','film','revenge-driven','friendship-bond','rural-setting','ensemble-cast','classic-bollywood','dacoit-western'],
  'in002':['coming-of-age-story','hindi-language','india','2000s','film','friendship-bond','romance','urban-setting','feel-good','dialogue-driven'],
  'in003':['sports-drama','hindi-language','india','2000s','film','underdog-story','epic-scale','based-on-true-story','period-drama','ensemble-cast','uplifting-tone'],
  'in004':['comedy','hindi-language','india','2000s','film','coming-of-age-story','friendship-bond','satirical','uplifting-tone','ensemble-cast'],
  'in005':['crime-thriller','hindi-language','india','2010s','film','organised-crime-saga','revenge-driven','dark-tone','non-linear-narrative','anurag-kashyap-style','ensemble-cast'],
  'in006':['crime-thriller','hindi-language','india','2010s','film','twist-ending','unreliable-narration','dark-comedy','cat-and-mouse-thriller','non-linear-narrative'],
  'in007':['horror','hindi-language','india','2010s','film','mythology-folklore','greed-and-curse','slow-burn','visually-striking','supernatural-horror','dark-tone'],
  'in008':['political-thriller','hindi-language','india','2010s','film','social-discrimination','police-procedural','dark-tone','institutional-corruption','based-on-true-story'],
  'in009':['drama','hindi-language','india','2010s','film','grief-and-loss','class-divide','slow-burn','emotionally-devastating','romance'],
  'in010':['sports-drama','hindi-language','india','2010s','film','father-child-relationship','based-on-true-story','female-lead-protagonist','underdog-story','uplifting-tone'],
  'in011':['political-drama','hindi-language','india','2000s','film','youth-activism','india-setting','ensemble-cast','non-linear-narrative','emotionally-devastating'],
  'in012':['drama','hindi-language','india','2000s','film','disability-representation','child-protagonist','mentor-student','emotionally-devastating','uplifting-tone'],
  'in013':['spy-thriller','hindi-language','india','2010s','film','based-on-true-story','female-lead-protagonist','india-setting','emotional','cold-war'],
  'in014':['drama','hindi-language','india','2010s','film','social-discrimination','female-lead-protagonist','courtroom-drama','dark-tone','india-setting'],
  'in015':['crime-thriller','hindi-language','india','2010s','film','missing-person','mystery','twist-ending','female-lead-protagonist','india-setting'],
  // Shows
  'tv001':['crime-thriller','english-language','usa','2000s','series','prestige-tv','drug-trade','anti-hero','transformation-arc','morally-ambiguous-protagonist','slow-burn','dark-tone','ensemble-cast'],
  'tv002':['historical-drama','english-language','uk','2010s','miniseries','prestige-tv','nuclear-disaster','based-on-true-story','slow-burn','emotionally-devastating','ensemble-cast'],
  'tv003':['crime-thriller','english-language','usa','2010s','series','prestige-tv','detective-protagonist','psychological','serial-killer-thriller','slow-burn','non-linear-narrative','dark-tone'],
  'tv004':['drama','english-language','usa','2010s','series','prestige-tv','family-dynamics','power-and-ambition','dark-comedy','satirical','ensemble-cast'],
  'tv005':['crime-thriller','english-language','usa','2000s','series','prestige-tv','drug-trade','ensemble-cast','social-discrimination','slow-burn','institutional-corruption'],
  'tv006':['crime-thriller','english-language','usa','2010s','series','prestige-tv','serial-killer-profiling','psychological','based-on-true-story','slow-burn','dark-tone'],
  'tv007':['mystery-thriller','english-language','germany','2010s','series','prestige-tv','time-manipulation','non-linear-narrative','family-mystery','dark-tone','ensemble-cast'],
  'tv008':['biographical-drama','hindi-language','india','2020s','series','prestige-tv','based-on-true-story','financial-thriller','india-setting','ensemble-cast'],
  'tv009':['crime-drama','hindi-language','india','2010s','series','prestige-tv','organised-crime-saga','power-and-ambition','ensemble-cast','dark-tone','india-setting'],
  'tv010':['comedy','hindi-language','india','2020s','series','prestige-tv','rural-setting','satirical','feel-good','india-setting','ensemble-cast'],
  'tv011':['crime-thriller','hindi-language','india','2010s','series','prestige-tv','political-thriller','dark-tone','india-setting','ensemble-cast'],
  'tv012':['crime-thriller','english-language','uk','2010s','series','prestige-tv','organised-crime-saga','period-drama','family-dynasty','anti-hero'],
  'tv013':['crime-thriller','english-language','usa','2000s','series','prestige-tv','organised-crime-saga','family-dynamics','anti-hero','ensemble-cast','slow-burn'],
  'tv014':['war-drama','english-language','usa','2000s','miniseries','prestige-tv','world-war-ii','based-on-true-story','ensemble-cast','heroism','emotionally-devastating'],
  'tv015':['mystery-thriller','english-language','usa','2020s','series','prestige-tv','corporate-dystopia','identity-crisis','slow-burn','visually-striking','ensemble-cast'],
};

function aiTagCandidates() {
  return [
    ...Object.values(state.movies || {}),
    ...Object.values(state.hiddenTitles || {}).filter(movie => movie.storyText)
  ]
    .filter(movie => movie.title && !hasCurrentAiTags(movie))
    .sort((a,b)=>Number(b.rating || 0)-Number(a.rating || 0)||String(a.title || '').localeCompare(String(b.title || '')));
}

async function enrichLegacyTitleForAi(movie) {
  if (!movie || hasCurrentAiTags(movie)) return movie;
  if (movie.storyText) return movie;
  try {
    const fresh = await refreshTitleFromWikipedia(movie, {ai:false});
    if (!fresh) throw new Error('Wikipedia title could not be resolved');
    return applyFreshWikiMovie(movie.id, fresh, movie);
  } catch(e) {
    movie.needsManualUrl = false;
    movie.retagStatus = 'needs-refresh';
    movie.retagMessage = 'automatic Wikipedia refresh pending';
    touchRecord(movie);
    return null;
  }
}

function updateAiTagButton() {
  const btn = document.getElementById('tagUntaggedBtn');
  if (!btn) return;
  const remaining = aiTagCandidates().length;
  btn.style.display = remaining ? 'inline-flex' : 'none';
  btn.textContent = remaining ? `Retry ${remaining} pending AI tags` : 'AI tags complete';
}

function isBlankGeminiResponseError(error) {
  return /gemini returned no result|gemini returned no usable output|prompt was blocked|finish reason/i.test(
    String(error?.message || error || '')
  );
}

function markAiBatchRetryFailure(movie, error) {
  const message = String(error?.message || error || 'AI tagging failed');
  movie.aiTagging = {
    ...(movie.aiTagging || {}),
    status:'building',
    promptVersion:AI_TAG_PROMPT_VERSION,
    storyHash:aiStoryHash(movie.storyText),
    error:message,
    attemptedAt:nowStamp()
  };
  movie.retagStatus = 'needs-ai-tags';
  movie.retagMessage = aiTagFailureMessage(error, movie);
  touchRecord(movie);
}

async function tagAllUntagged() {
  // AI tagging owns the same request/abort machinery as pool expansion.
  // Stop the worker itself, wait for it to release, then continue automatically.
  if (poolExpansionInProgress || autoExpandTimer) {
    stopFetching({silent:true});
    await waitForPoolIdle(10000);
  }

  if (poolExpansionInProgress) {
    showToast('Pool expansion is still stopping. Try again in a moment.', 'error');
    return;
  }

  const queue = aiTagCandidates();
  if (!queue.length) {
    showToast('All eligible titles have AI tags', '');
    return;
  }

  fetchAbortRequested = false;
  const btn = document.getElementById('tagUntaggedBtn');
  if (btn) btn.disabled = true;

  let tagged = 0;
  let failed = 0;

  try {
    let index = 0;

    while (index < queue.length && !fetchAbortRequested) {
      const batch = [];

      while (index < queue.length && batch.length < AI_TAG_BATCH_SIZE && !fetchAbortRequested) {
        const candidate = queue[index++];
        showFetchProgress(
          `Resolving title data · ${index}/${queue.length}`,
          Math.round((index / queue.length) * 100),
          candidate.title
        );

        const enriched = await enrichLegacyTitleForAi(candidate);
        if (enriched?.storyText && !hasCurrentAiTags(enriched)) batch.push(enriched);
      }

      if (!batch.length) continue;

      showFetchProgress(
        `AI tagging batch · ${index}/${queue.length}`,
        Math.round((index / queue.length) * 100),
        batch.map(movie => movie.title).join(' · ')
      );

      // Tag exactly this queue batch. Do not append unrelated titles from Pool.
      // A blocked or empty Gemini response must not strand the rest of the queue.
      let result;
      try {
        result = await requestAiTags(batch);
      } catch (batchError) {
        if (isExternalRateLimitError(batchError)) throw batchError;

        result = {tagged:0, failed:0};
        if (batch.length > 1 && isBlankGeminiResponseError(batchError)) {
          showFetchProgress(
            `AI response was empty · retrying titles individually`,
            Math.round((index / queue.length) * 100),
            batch.map(movie => movie.title).join(' · ')
          );
          for (const movie of batch) {
            if (fetchAbortRequested) break;
            try {
              const single = await requestAiTags([movie]);
              result.tagged += Number(single?.tagged || 0);
              result.failed += Number(single?.failed || 0);
            } catch (singleError) {
              if (isExternalRateLimitError(singleError)) throw singleError;
              markAiBatchRetryFailure(movie, singleError);
              result.failed++;
            }
          }
        } else {
          batch.forEach(movie => markAiBatchRetryFailure(movie, batchError));
          result.failed = batch.length;
        }
      }
      tagged += Number(result?.tagged || 0);
      failed += Number(result?.failed || 0);

      rebuildTagBrain();
      computeTagWeights();
      saveLocalState();
      render();
      await nextPaint();
    }

    queueDriveSync();
    scheduleTagCloudNormalization(1200);
    showToast(
      `AI tagged ${tagged} titles${failed ? ` · ${failed} need retry` : ''}`,
      tagged ? 'success' : ''
    );
  } catch (error) {
    saveLocalState();
    queueDriveSync();
    const message = String(error?.message || error);
    showToast(`AI tagging stopped: ${message}`, 'error');
  } finally {
    fetchAbortRequested = false;
    hideFetchProgress();
    if (btn) btn.disabled = false;
    updateAiTagButton();
  }
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
function setTab(tab, btn) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelector('.tab-bar')?.classList.remove('open');
  recVisibleLimit = Math.max(recVisibleLimit, parseInt(state.settings.topN || 10), REC_INFINITE_PAGE_SIZE);
  render();
}
function isShow(m) { return !!m.format; }
function matchesTab(m) {
  if (activeTab === 'all' || activeTab === 'pool' || activeTab === 'hidden' || activeTab === 'rated' || activeTab === 'recent' || activeTab === 'tags') return true;
  if (activeTab === 'show') return isShow(m);
  if (activeTab === 'movie') return !isShow(m);
  return true;
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function render() {
  updateStats();
  updateAiTagButton();
  updateVisibleSections();
  updateControlDeck();
  if (activeTab === 'rated') renderRatedGrid();
  else if (activeTab === 'recent') renderRecentlyAdded();
  else if (activeTab === 'tags') renderTagBrain();
  else if (activeTab === 'pool') renderPoolGrid();
  else if (activeTab === 'hidden') renderHiddenGrid();
  else renderRecs();
  maybeAutoExpandPool();
}

function renderAppVersion() {
  const label = document.getElementById('appVersion');
  if (!label) return;
  label.textContent = String(APP_VERSION);
  label.title = `CineLens version ${APP_VERSION}`;
}

function updateControlDeck() {
  applyPalette();
  const modeBtn=document.getElementById('tagDeleteModeBtn');
  if (modeBtn) {
    modeBtn.classList.toggle('active', !!state.settings.tagDeleteMode);
    modeBtn.textContent=state.settings.tagDeleteMode ? 'Tag clicks: remove' : 'Tag clicks: explore';
  }
  const genreFilter=document.getElementById('genreFilter');
  if (genreFilter && genreFilter.value !== (state.settings.genreFilter || 'all')) genreFilter.value=state.settings.genreFilter || 'all';
  const languageFilter=document.getElementById('languageFilter');
  if (languageFilter && languageFilter.value !== (state.settings.languageFilter || 'all')) languageFilter.value=state.settings.languageFilter || 'all';
  const ratingFilter=document.getElementById('ratingFilter');
  if (ratingFilter && ratingFilter.value !== (state.settings.ratingFilter || 'all')) ratingFilter.value=state.settings.ratingFilter || 'all';
  const sortMode=document.getElementById('sortMode');
  if (sortMode && sortMode.value !== (state.settings.sortMode || 'recommended')) sortMode.value=state.settings.sortMode || 'recommended';
  const shuffleBtn=document.getElementById('shuffleAgainBtn');
  if (shuffleBtn) shuffleBtn.hidden = (state.settings.sortMode || 'recommended') !== 'random';
  const titleSearch=document.getElementById('titleSearch');
  if (titleSearch && titleSearch.value !== (state.settings.titleSearch || '')) titleSearch.value=state.settings.titleSearch || '';
  syncUnifiedSearchClearButton();
  const deck=document.querySelector('.control-deck');
  if (deck) deck.classList.toggle('collapsed', !!state.settings.controlDeckCollapsed);
  const toggle=document.getElementById('controlToggle');
  if (toggle) toggle.textContent = state.settings.controlDeckCollapsed ? 'Show filters & tools' : 'Hide filters & tools';
  updateLibraryHealth();
}

function updateLanguageFilter(language) {
  state.settings.languageFilter = language || 'all';
  saveViewState();
  renderActiveCards();
}

function updateGenreFilter(genre) {
  state.settings.genreFilter = genre || 'all';
  saveViewState();
  renderActiveCards();
}

function updateRatingFilter(rating) {
  state.settings.ratingFilter = String(rating || 'all');
  saveViewState();
  renderActiveCards();
}

function filterByGenreFromCard(genre, event) {
  if (event) event.stopPropagation();
  updateGenreFilter(genre);
  updateControlDeck();
}

function updateSortMode(mode) {
  state.settings.sortMode = mode || 'recommended';
  if (state.settings.sortMode === 'random' && !state.settings.shuffleSeed) state.settings.shuffleSeed = Date.now();
  saveViewState();
  renderActiveCards();
  updateControlDeck();
}

function shuffleAgain() {
  state.settings.sortMode = 'random';
  state.settings.shuffleSeed = Date.now();
  saveViewState();
  renderActiveCards();
  updateControlDeck();
}

function syncUnifiedSearchClearButton() {
  const button = document.getElementById('clearUnifiedSearchBtn');
  if (!button) return;
  const value = String(document.getElementById('titleSearch')?.value || state.settings?.titleSearch || '').trim();
  button.hidden = !value;
}

function clearUnifiedTitleSearch() {
  similarTitleSourceId = '';
  state.settings.titleSearch = '';
  wikiSearchQuery = '';
  wikiSearchResults = [];
  localBlockedSearchResults = [];
  const input = document.getElementById('titleSearch');
  if (input) input.value = '';
  syncUnifiedSearchClearButton();
  renderWikiSearchResults();
  saveViewState();
  renderActiveCards();
}

function updateTitleSearch(value) {
  similarTitleSourceId = '';
  state.settings.titleSearch = String(value || '').trim();
  syncUnifiedSearchClearButton();
  if (!state.settings.titleSearch || state.settings.titleSearch !== wikiSearchQuery) {
    wikiSearchResults = [];
    localBlockedSearchResults = [];
    renderWikiSearchResults();
  }
  recVisibleLimit = Math.max(parseInt(state.settings.topN || 10), REC_INFINITE_PAGE_SIZE);
  poolVisibleLimit = 80;
  hiddenVisibleLimit = 80;

  // Typing must never serialize the entire catalogue or rescore it on every
  // keystroke. Persist and repaint after the user pauses briefly instead.
  touchSettings();
  clearTimeout(titleSearchPersistTimer);
  titleSearchPersistTimer = setTimeout(() => {
    saveViewState();
  }, TITLE_SEARCH_PERSIST_DEBOUNCE_MS);
  clearTimeout(titleSearchRenderTimer);
  titleSearchRenderTimer = setTimeout(() => renderActiveCards(), TITLE_SEARCH_RENDER_DEBOUNCE_MS);
}

function toggleControlDeck() {
  state.settings.controlDeckCollapsed = !state.settings.controlDeckCollapsed;
  saveViewState();
  updateControlDeck();
}

function toggleMobileNav() {
  const bar=document.querySelector('.tab-bar');
  const header=document.querySelector('header');
  if (!bar) return;
  const open=bar.classList.toggle('open');
  header?.classList.toggle('nav-open', open);
}

function renderActiveCards() {
  if (activeTab === 'pool') renderPoolGrid();
  else if (activeTab === 'hidden') renderHiddenGrid();
  else if (activeTab === 'tags') renderTagBrain();
  else if (activeTab === 'rated') renderRatedGrid();
  else if (activeTab === 'recent') renderRecentlyAdded();
  else renderRecs();
}

function isPendingManualSearchResult(movie) {
  return !!movie?.id && String(movie.id) === String(pendingSearchResetAfterRatingId || '');
}

function matchesGlobalFilters(movie) {
  // A title just added through search must stay visible immediately, including
  // when the search text is a pasted Wikipedia URL that cannot match its title.
  // It remains pinned until that same card is rated, which clears the search.
  if (isPendingManualSearchResult(movie)) return true;
  return matchesLanguageFilter(movie) && matchesGenreFilter(movie) && matchesRatingFilter(movie) && matchesTitleSearch(movie) && meetsYearCutoff(movie);
}

function discoveryPool() {
  return Object.values(state.movies).filter(m => m.rating===0 && !m.skipped && !m.watchlist && matchesTab(m) && matchesGlobalFilters(m) && recommendableTitle(m));
}

function matchesLanguageFilter(movie) {
  const filter = state.settings.languageFilter || 'all';
  return filter === 'all' || movie.language === filter;
}

function matchesGenreFilter(movie) {
  const filter = state.settings.genreFilter || 'all';
  return filter === 'all' || movieGenres(movie).includes(filter);
}

function matchesRatingFilter(movie) {
  const filter = String(state.settings.ratingFilter || 'all');
  if (filter === 'all') return true;
  const rating = Number(movie?.rating || 0);
  if (filter === 'unrated') return rating === 0;
  return rating === Number(filter);
}

function titleSearchNeedle(value=state.settings.titleSearch) {
  return canonicalTitle(String(value || ''));
}

function matchesTitleSearch(movie) {
  const needle = titleSearchNeedle();
  if (!needle) return true;
  return [movie?.title, movie?.wikiTitle, movie?.pageTitle]
    .some(value => canonicalTitle(value).includes(needle));
}

function localTitleSearchMatches() {
  const needle = titleSearchNeedle();
  if (!needle) return {active:[], hidden:[], blocked:[]};
  const byNewest = (a, b) => movieAddedTime(b) - movieAddedTime(a) || movieTime(b) - movieTime(a) || titleSortKey(a).localeCompare(titleSortKey(b));
  const matchesRecord = record => [record?.title, record?.wikiTitle, record?.pageTitle]
    .some(value => canonicalTitle(value).includes(needle));
  const active = Object.values(state.movies || {}).filter(matchesTitleSearch).sort(byNewest);
  const hidden = Object.values(state.hiddenTitles || {}).filter(matchesTitleSearch).sort(byNewest);
  const represented = new Set([...active, ...hidden].map(movie => canonicalTitle(movie.title || movie.wikiTitle || movie.pageTitle)));
  const blocked = [
    ...Object.values(state.wrongPicks || {}),
    ...Object.values(state.rollingPoolExclusions || {})
  ].filter(matchesRecord).filter(record => !represented.has(canonicalTitle(record.title || record.wikiTitle || record.pageTitle)));
  return {active, hidden, blocked};
}

async function reAddBlockedTitleFromSearch(index) {
  const record = localBlockedSearchResults[index];
  if (!record) return false;
  const title = record.wikiTitle || record.pageTitle || record.title;
  if (!title) return false;
  return fetchUnifiedWikiResult(title, '', {pageId:record.wikiPageId || ''});
}

function titleSearchActive() {
  return !!String(state.settings.titleSearch || '').trim();
}

function meetsYearCutoff(m) {
  return !m.year || m.year >= state.settings.minYear;
}

function hasUserAvoidedTag(movie) {
  const tags = new Set([...scoringTags(movie), ...rawScoringTags(movie)].map(normaliseTagName));
  return [...USER_AVOID_TAGS].some(tag => tags.has(tag));
}

function recommendableTitle(movie) {
  return !hasUserAvoidedTag(movie) && !movieGenres(movie).some(genre => USER_AVOID_GENRES.has(genre));
}

function personalizedEnough() {
  return Object.values(state.movies).filter(m => m.rating > 0 && m.tagged).length >= 3;
}

function recommendationCandidates() {
  return scoreMovies().filter(x => matchesTab(x.movie) && matchesGlobalFilters(x.movie) && !x.movie.watchlist && recommendableTitle(x.movie));
}

function perfectRecommendationCount(scored) {
  if (!scored || !scored.length) return 0;
  const maxMatch = scored[0].matchScore || 0;
  return scored.filter(x => maxMatch && x.matchScore / maxMatch >= PERFECT_REC_MIN_RATIO).length;
}

function recommendationReserveCandidates() {
  return scoreMovies().filter(item => !item.movie.watchlist && recommendableTitle(item.movie));
}

function recommendationFetchStatus(scored=recommendationReserveCandidates()) {
  const strong = scored.filter(item =>
    Number(item.posOverlap || 0) >= STRONG_REC_MIN_OVERLAP &&
    Number(item.matchScore || 0) >= STRONG_REC_MIN_MATCH_SCORE &&
    Number(item.positiveScore || 0) > 0
  );

  return {
    strongCount: strong.length,
    target: STRONG_REC_TARGET,
    refillThreshold: STRONG_REC_REFILL_THRESHOLD,
    bestOverlap: scored[0]?.posOverlap || 0,
    total: scored.length
  };
}

function taggedUnseenPoolCount() {
  return Object.values(state.movies || {}).filter(movie =>
    Number(movie.rating || 0) === 0 &&
    !movie.watchlist &&
    !movie.skipped &&
    hasCurrentAiTags(movie) &&
    recommendableTitle(movie)
  ).length;
}

function pendingBackgroundAiMovies() {
  const now = Date.now();
  return Object.values(state.movies || {})
    .filter(movie => movie?.storyText && !hasCurrentAiTags(movie) && !movie.hidden)
    .filter(movie => {
      const attemptedAt = Date.parse(movie.aiTagging?.attemptedAt || '') || 0;
      return !attemptedAt || now - attemptedAt >= AI_BACKGROUND_RETRY_MS;
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.aiTagging?.attemptedAt || '') || 0;
      const bTime = Date.parse(b.aiTagging?.attemptedAt || '') || 0;
      return aTime - bTime || String(a.title || '').localeCompare(String(b.title || ''));
    });
}

function collectionHealth() {
  const status = recommendationFetchStatus();
  const taggedUnseen = taggedUnseenPoolCount();
  const pendingTags = pendingBackgroundAiMovies().length;
  const personalized = personalizedEnough();

  return {
    ...status,
    personalized,
    taggedUnseen,
    pendingTags,
    collectionActive: !!state.meta?.collectionActive
  };
}

function shouldRunBackgroundCollection() {
  state.meta = state.meta || {};
  const health = collectionHealth();

  if (!health.personalized) {
    state.meta.collectionActive = health.taggedUnseen < INITIAL_TAGGED_POOL_FLOOR;
    return state.meta.collectionActive;
  }

  let active = !!state.meta.collectionActive;
  if (!active && health.strongCount < STRONG_REC_REFILL_THRESHOLD) active = true;
  if (active && health.strongCount >= STRONG_REC_TARGET) active = false;
  state.meta.collectionActive = active;
  return active;
}

function needsMoreStrongRecommendations(target=STRONG_REC_TARGET) {
  if (!personalizedEnough()) return taggedUnseenPoolCount() < INITIAL_TAGGED_POOL_FLOOR;
  return recommendationFetchStatus().strongCount < target;
}

function needsMorePerfectRecommendations() {
  return needsMoreStrongRecommendations();
}

function updateLibraryHealth() {
  const health = collectionHealth();
  const label = document.getElementById('libraryHealthLabel');
  const maintenance = document.getElementById('maintenanceHealth');
  const drive = state.drive?.connected ? 'Drive synced' : state.drive?.enabled ? 'Drive reconnect needed' : 'Local only';
  const receptionNeedCount = Object.values(state.movies || {}).filter(needsReceptionBackfill).length;
  const receptionSegment = receptionNeedCount ? ` · ${receptionNeedCount} titles need quality data` : '';

  let text;
  if (autoFetchPaused) text = 'Collection paused';
  else if (poolExpansionInProgress) text = `Collecting ${health.strongCount}/${health.target} strong matches`;
  else if (backgroundAiTaggingInProgress) text = `Tagging ${health.pendingTags} pending titles`;
  else if (health.personalized && health.strongCount >= STRONG_REC_TARGET) text = `Library healthy · ${health.strongCount} strong matches`;
  else if (!health.personalized) text = `Building starter pool · ${health.taggedUnseen}/${INITIAL_TAGGED_POOL_FLOOR}`;
  else text = `Refilling strong matches · ${health.strongCount}/${health.target}`;

  if (label) label.textContent = text;
  if (maintenance) {
    maintenance.textContent = `${text} · ${health.pendingTags} pending AI tags${receptionSegment} · ${drive}`;
  }
}

function toggleMaintenancePanel() {
  const panel = document.getElementById('maintenancePanel');
  if (!panel) return;
  panel.open = !panel.open;
  if (panel.open) updateLibraryHealth();
}

function scheduleBackgroundAiQueue(delay = 700) {
  if (
    autoFetchPaused ||
    backgroundAiTaggingInProgress ||
    backgroundAiTimer ||
    poolExpansionInProgress ||
    !pendingBackgroundAiMovies().length
  ) {
    return;
  }

  backgroundAiTimer = setTimeout(() => {
    backgroundAiTimer = null;
    runBackgroundAiQueue();
  }, delay);
}

async function runBackgroundAiQueue() {
  if (backgroundAiTaggingInProgress || poolExpansionInProgress || autoFetchPaused) return;
  const batch = pendingBackgroundAiMovies().slice(0, AI_TAG_BATCH_SIZE);
  if (!batch.length) return;

  backgroundAiTaggingInProgress = true;
  try {
    showFetchProgress(
      'AI tagging pending titles…',
      45,
      `${batch.length} titles queued · ${batch.map(movie => movie.title).join(' · ')}`
    );
    const result = await requestAiTags(batch);
    rebuildTagBrain();
    computeTagWeights();
    saveLocalState();
    if (Number(result?.failed || 0)) {
      console.info('CineLens AI queue retained pending titles for a later retry.', result);
    }
  } catch (error) {
    const message = String(error?.message || error);
    batch.forEach(movie => {
      movie.aiTagging = {
        ...(movie.aiTagging || {}),
        status: 'building',
        promptVersion: AI_TAG_PROMPT_VERSION,
        storyHash: aiStoryHash(movie.storyText),
        error: message,
        attemptedAt: nowStamp()
      };
      movie.retagStatus = 'needs-ai-tags';
      movie.retagMessage = 'AI retry pending';
      touchRecord(movie);
    });
    saveLocalState();
    if (isExternalRateLimitError(error)) {
      autoFetchPaused = true;
      showToast('Background collection paused by Gemini rate limit. It will resume when you reopen or resume collection.', 'error');
    } else {
      console.warn('Background AI tagging deferred:', message);
    }
  } finally {
    backgroundAiTaggingInProgress = false;
    hideFetchProgress();
    updateLibraryHealth();
    render();
  }
}

function maybeAutoExpandPool() {
  if (
    !startupDriveRestoreDone ||
    !libraryWritesUnlocked ||
    autoFetchPaused ||
    poolExpansionInProgress ||
    backgroundAiTaggingInProgress ||
    autoExpandTimer ||
    backgroundAiTimer
  ) {
    updateLibraryHealth();
    return;
  }

  if (pendingBackgroundAiMovies().length) {
    scheduleBackgroundAiQueue();
    updateLibraryHealth();
    return;
  }

  if (!shouldRunBackgroundCollection()) {
    updateLibraryHealth();
    return;
  }

  lastAutoExpandAt = Date.now();
  scheduleAutoExpand(2500);
  updateLibraryHealth();
}

function scheduleAutoExpand(delay = 2500) {
  if (
    !startupDriveRestoreDone ||
    !libraryWritesUnlocked ||
    autoFetchPaused ||
    autoExpandTimer ||
    poolExpansionInProgress ||
    backgroundAiTaggingInProgress ||
    !shouldRunBackgroundCollection()
  ) {
    return;
  }

  autoExpandTimer = setTimeout(() => {
    autoExpandTimer = null;
    if (!autoFetchPaused && !poolExpansionInProgress && shouldRunBackgroundCollection()) {
      expandPool(false);
    }
  }, delay);
}

function renderRecs() {
  if (activeTab === 'pool' || activeTab === 'hidden' || activeTab === 'rated' || activeTab === 'recent' || activeTab === 'tags') return;
  const grid = document.getElementById('recsGrid');
  if (similarTitleActive() && renderSimilarTitles(grid)) return;
  if (titleSearchActive()) {
    renderGlobalTitleSearch(grid);
    return;
  }
  const ratedTagged = Object.values(state.movies).filter(m => m.rating > 0 && m.tagged);
  grid.innerHTML = '';

  if (ratedTagged.length >= 3) {
    const scored = recommendationCandidates();
    const visibleLimit = Math.max(recVisibleLimit, parseInt(state.settings.topN || 10));
      const ordered = (state.settings.sortMode || 'recommended') === 'recommended'
        ? scored
        : (() => {
            const scoredById = new Map(scored.map(item => [String(item.movie.id), item]));
            return sortMovies(scored.map(item => item.movie), 'title-asc')
              .map(movie => scoredById.get(String(movie.id)))
              .filter(Boolean);
          })();
      const top = ordered.slice(0, visibleLimit);
    const fetchStatus = recommendationFetchStatus(scored);
    if (top.length) {
      document.getElementById('recCount').textContent = fetchStatus.strongCount < STRONG_REC_TARGET
        ? `improving recommendations · ${fetchStatus.strongCount}/${STRONG_REC_TARGET} strong · showing ${top.length} of ${scored.length}`
        : `showing ${top.length} of ${scored.length} matches`;
      const fragment = document.createDocumentFragment();
      top.forEach((item, i) => fragment.appendChild(buildCard(item.movie, { rank:i+1, score:item.score, matchedTags:item.matchedTags, matchedGenres:item.matchedGenres, posOverlap:item.posOverlap, genreOverlap:item.genreOverlap, negativeOverlap:item.negativeOverlap, tasteFit:item.tasteFit, matchScore:item.matchScore, predictedRating:item.predictedRating, receptionEffect:item.receptionEffect })));
      grid.appendChild(fragment);
      return;
    }
  }

  const browseLimit = Math.max(recVisibleLimit, parseInt(state.settings.topN || 10), REC_INFINITE_PAGE_SIZE);
  const batch = sortMovies(discoveryPool(), 'title-asc').slice(0, browseLimit);
  document.getElementById('recCount').textContent = ratedTagged.length < 3 ? `rate ${Math.max(0,3-ratedTagged.length)} more to personalize` : `building recommendation pool · showing ${batch.length} unrated`;
  if (!batch.length) { grid.innerHTML = `<div class="empty-state"><div class="icon">?</div><h3>No Titles Here</h3><p>Expanding the pool in the background.</p></div>`; return; }
  const fragment = document.createDocumentFragment();
  batch.forEach(m => fragment.appendChild(buildCard(m, {})));
  grid.appendChild(fragment);
}

function renderGlobalTitleSearch(grid) {
  // Search is a direct library lookup. It deliberately ignores the current tab,
  // Since, language, genre and rating filters so a title already saved in CineLens
  // can never look absent merely because another filter is active.
  const {active, hidden, blocked} = localTitleSearchMatches();
  localBlockedSearchResults = blocked;
  const results = active;
  const limit = Math.max(recVisibleLimit, REC_INFINITE_PAGE_SIZE);
  const total = active.length + hidden.length + blocked.length;
  document.getElementById('recCount').textContent = total
    ? `library search found ${total}${hidden.length ? ` · ${hidden.length} hidden` : ''}${blocked.length ? ` · ${blocked.length} previously removed` : ''}`
    : 'no title matches';
  grid.innerHTML = '';
  if (!total) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">?</div><h3>No Title Matches</h3><p>Try Wikipedia search below the field.</p></div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  results.slice(0, limit).forEach(movie => {
    const contextLabel = movie.rating > 0 ? 'Rated' : 'In Library';
    fragment.appendChild(buildCard(movie, {
      showEdit:movie.rating > 0,
      poolView:Number(movie.rating || 0) === 0,
      contextLabel
    }));
  });
  hidden.forEach(movie => {
    fragment.appendChild(buildCard(movie, { hiddenView:true, contextLabel:'Hidden' }));
  });
  grid.appendChild(fragment);

  if (blocked.length) {
    const blockedBox = document.createElement('div');
    blockedBox.className = 'empty-state';
    blockedBox.innerHTML = `<div class="icon">↻</div><h3>Previously removed from the active library</h3><p>${blocked.map((record, index) => `<button class="btn btn-warning" onclick="reAddBlockedTitleFromSearch(${index})">Re-add ${attrSafe(record.title || record.wikiTitle || record.pageTitle || 'title')}</button>`).join(' ')}</p>`;
    grid.appendChild(blockedBox);
  }
  if (results.length > limit) grid.insertAdjacentHTML('beforeend',`<div class="empty-state"><button class="btn btn-warning" onclick="showMoreSearchResults()">Show ${Math.min(REC_INFINITE_PAGE_SIZE, results.length-limit)} more · ${results.length-limit} remaining</button></div>`);
}

function showMoreSearchResults() {
  recVisibleLimit += REC_INFINITE_PAGE_SIZE;
  renderRecs();
}

function similarTitleActive() {
  return !!similarTitleSourceId && !!state.movies?.[similarTitleSourceId];
}

function similarFingerprint(movie) {
  return new Set([
    ...recommendationScoringTags(movie),
    ...movieGenres(movie).map(genre => `genre:${genre}`)
  ]);
}

function similarTitleResults() {
  const source = state.movies?.[similarTitleSourceId];
  if (!source) return [];
  const sourceTags = new Set(recommendationScoringTags(source));
  const sourceGenres = new Set(movieGenres(source));
  const sourceAll = similarFingerprint(source);
  return Object.values(state.movies || {})
    .filter(movie => movie.id !== source.id)
    .filter(movie => !movie.skipped && matchesTab(movie) && recommendableTitle(movie))
    .filter(movie => matchesLanguageFilter(movie) && matchesGenreFilter(movie) && matchesRatingFilter(movie) && meetsYearCutoff(movie))
    .map(movie => {
      const tags = recommendationScoringTags(movie);
      const genres = movieGenres(movie);
      const matchedTags = new Set(tags.filter(tag => sourceTags.has(tag)));
      const matchedGenres = new Set(genres.filter(genre => sourceGenres.has(genre)));
      const targetAll = similarFingerprint(movie);
      let union = new Set([...sourceAll, ...targetAll]).size || 1;
      let shared = 0;
      targetAll.forEach(token => { if (sourceAll.has(token)) shared++; });
      const similarity = (shared / union) + (matchedTags.size * 0.08) + (matchedGenres.size * 0.04);
      return {movie, matchedTags, matchedGenres, similarity, shared};
    })
    .filter(item => item.shared > 0)
    .sort((a,b) => b.similarity - a.similarity || movieTime(b.movie) - movieTime(a.movie) || titleSortKey(a.movie).localeCompare(titleSortKey(b.movie)));
}

function showSimilarTitles(id, event) {
  if (event) event.stopPropagation();
  const movie = state.movies?.[id];
  if (!movie) return;
  similarTitleSourceId = id;
  state.settings.titleSearch = '';
  wikiSearchQuery = '';
  wikiSearchResults = [];
  localBlockedSearchResults = [];
  recVisibleLimit = Math.max(REC_INFINITE_PAGE_SIZE, parseInt(state.settings.topN || 10));
  activeTab = 'all';
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const allBtn = [...document.querySelectorAll('.tab-btn')].find(btn => /all/i.test(btn.textContent || ''));
  if (allBtn) allBtn.classList.add('active');
  updateControlDeck();
  renderWikiSearchResults();
  renderRecs();
  window.scrollTo({top:0, behavior:'smooth'});
}

function clearSimilarTitles(event) {
  if (event) event.stopPropagation();
  similarTitleSourceId = '';
  renderRecs();
}

function renderSimilarTitles(grid) {
  const source = state.movies?.[similarTitleSourceId];
  if (!source) { similarTitleSourceId = ''; return false; }
  grid.innerHTML = '';
  const results = similarTitleResults();
  const top = results.slice(0, Math.max(recVisibleLimit, REC_INFINITE_PAGE_SIZE));
  const count = document.getElementById('recCount');
  if (count) {
    count.innerHTML = `similar to ${attrSafe(source.title)} · showing ${top.length} of ${results.length} <button class="inline-clear-btn" onclick="clearSimilarTitles(event)">clear</button>`;
  }
  if (!top.length) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">?</div><h3>No Similar Titles Found</h3><p>Try another title or clear this view.</p></div>`;
    return true;
  }
  const fragment = document.createDocumentFragment();
  top.forEach((item, index) => fragment.appendChild(buildCard(item.movie, {
    rank:index + 1,
    matchedTags:item.matchedTags,
    matchedGenres:item.matchedGenres,
    posOverlap:item.matchedTags.size,
    genreOverlap:item.matchedGenres.size,
    tasteFit:Math.max(0, Math.min(1, item.similarity)),
    matchScore:Math.max(0, Math.min(1, item.similarity)),
    contextLabel:`Similar to ${source.title}`
  })));
  grid.appendChild(fragment);
  return true;
}

function renderRatedGrid() {
  const grid = document.getElementById('ratedGrid');
  if (!grid) return;
  const rated = Object.values(state.movies || {})
    .filter(m => Number(m.rating || 0) > 0)
    .filter(matchesGlobalFilters)
    .sort((a,b) => (ratingTimestamp(b) || recordTimestamp(b) || movieAddedTime(b)) - (ratingTimestamp(a) || recordTimestamp(a) || movieAddedTime(a)) || titleSortKey(a).localeCompare(titleSortKey(b)));
  updateAiTagButton();
  const count = document.getElementById('ratedCount');
  if (count) count.textContent = rated.length ? `${rated.length} titles` : 'none yet';
  grid.innerHTML = '';
  if (!rated.length) { grid.innerHTML = `<div class="empty-state"><div class="icon">★</div><h3>Nothing Rated Yet</h3></div>`; return; }
  const fragment = document.createDocumentFragment();
  rated.forEach(m => fragment.appendChild(buildCard(m, { showEdit:true })));
  grid.appendChild(fragment);
}

function renderRecentlyAdded() {
  const grid = document.getElementById('recentGrid');
  if (!grid) return;
  const recent = Object.values(state.movies || {})
    .filter(m => matchesGlobalFilters(m))
    .sort((a, b) => movieAddedTime(b) - movieAddedTime(a) || movieTime(b) - movieTime(a) || titleSortKey(a).localeCompare(titleSortKey(b)));
  const count = document.getElementById('recentCount');
  if (count) count.textContent = recent.length ? `${recent.length} titles · newest first` : 'nothing added yet';
  grid.innerHTML = '';
  if (!recent.length) { grid.innerHTML = `<div class="empty-state"><div class="icon">+</div><h3>Nothing Added Yet</h3></div>`; return; }
  const fragment = document.createDocumentFragment();
  recent.forEach(m => fragment.appendChild(buildCard(m, { showEdit:Number(m.rating || 0) > 0, poolView:Number(m.rating || 0) === 0, contextLabel:'Added' })));
  grid.appendChild(fragment);
}


function updateVisibleSections() {
  const recMode = activeTab === 'all' || activeTab === 'movie' || activeTab === 'show';
  const ratedMode = activeTab === 'rated';
  const recentMode = activeTab === 'recent';
  const tagMode = activeTab === 'tags';

  setSectionVisibility('.normal-only', recMode);
  setSectionVisibility('.rated-only', ratedMode);
  setSectionVisibility('.watchlist-only', recentMode);
  setSectionVisibility('.tag-only', tagMode);
  document.querySelectorAll('.audit-only').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.control-deck').forEach(el => el.style.display = '');

  if (activeTab === 'pool') {
    showAuditSection(['poolSep','poolHeader','poolGrid']);
  }
  if (activeTab === 'hidden') {
    showAuditSection(['hiddenSep','hiddenHeader','hiddenGrid']);
  }
}

function showAuditSection(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.classList.contains('movies-grid')) el.style.display = 'grid';
    else if (el.classList.contains('section-header')) el.style.display = 'flex';
    else el.style.display = 'block';
  });
}

function setSectionVisibility(selector, visible) {
  document.querySelectorAll(selector).forEach(el => {
    if (!visible) {
      el.style.display = 'none';
      return;
    }
    if (el.classList.contains('movies-grid')) el.style.display = 'grid';
    else if (el.classList.contains('section-header') || el.classList.contains('tag-brain-controls')) el.style.display = 'flex';
    else el.style.display = 'block';
  });
}

function invalidateTasteModel() {
  tasteModelCache = new Map();
  cardMatchCache = null;
  scoredMovieCache = null;
}

function invalidateCardMatchCache() {
  cardMatchCache = null;
}

function buildCardMatchCache() {
  // Card fits are intentionally lazy. Building leave-one-out models for every
  // rated title during every render was the largest UI freeze at a few thousand
  // titles. Visible cards populate this cache on demand instead.
  return new Map();
}
function cardMatchData(movie) {
  if (!personalizedEnough() || !movie?.id) return null;
  if (!cardMatchCache) cardMatchCache = buildCardMatchCache();
  const id = String(movie.id);
  if (!cardMatchCache.has(id)) {
    const model = Number(movie.rating || 0) > 0 ? getTasteModel(id, formatClass(movie)) : getTasteModel('', formatClass(movie));
    cardMatchCache.set(id, predictTasteFit(movie, model));
  }
  return cardMatchCache.get(id) || {
    movie,
    matchScore: 0,
    tasteFit: 0,
    posOverlap: 0,
    genreOverlap: 0,
    negativeOverlap: 0,
    matchedTags: new Set(),
    matchedGenres: new Set()
  };
}

function renderPoolGrid() {
  const grid = document.getElementById('poolGrid');
  if (!grid) return;
  const rows = sortMovies(Object.values(state.movies).filter(matchesTab).filter(matchesGlobalFilters), 'rating-desc');
  const visible = rows.slice(0, poolVisibleLimit);
  document.getElementById('poolCount').textContent = rows.length ? `showing ${visible.length} of ${rows.length} titles` : 'nothing loaded';
  grid.innerHTML = '';
  if (!rows.length) { grid.innerHTML = `<div class="empty-state"><div class="icon">?</div><h3>Pool Empty</h3></div>`; return; }
  const fragment = document.createDocumentFragment();
  visible.forEach(m => fragment.appendChild(buildCard(m, { poolView:true })));
  grid.appendChild(fragment);
  if (rows.length > visible.length) grid.insertAdjacentHTML('beforeend',`<div class="empty-state"><button class="btn btn-warning" onclick="showMorePoolTitles()">Show ${Math.min(80, rows.length-visible.length)} more · ${rows.length-visible.length} remaining</button></div>`);
}

function renderHiddenGrid() {
  const grid = document.getElementById('hiddenGrid');
  if (!grid) return;
  const rows = sortMovies(Object.values(state.hiddenTitles || {}).filter(matchesGlobalFilters), 'updated-desc');
  const visible = rows.slice(0, hiddenVisibleLimit);
  document.getElementById('hiddenCount').textContent = rows.length ? `showing ${visible.length} of ${rows.length} hidden` : 'nothing hidden';
  grid.innerHTML = '';
  if (!rows.length) { grid.innerHTML = `<div class="empty-state"><div class="icon">x</div><h3>Nothing Hidden</h3></div>`; return; }
  const fragment = document.createDocumentFragment();
  visible.forEach(m => fragment.appendChild(buildCard({ ...m, _expanded:true }, { hiddenView:true })));
  grid.appendChild(fragment);
  if (rows.length > visible.length) grid.insertAdjacentHTML('beforeend',`<div class="empty-state"><button class="btn btn-warning" onclick="showMoreHiddenTitles()">Show ${Math.min(80, rows.length-visible.length)} more · ${rows.length-visible.length} remaining</button></div>`);
}

function showMorePoolTitles() {
  poolVisibleLimit += 80;
  renderPoolGrid();
}

function showMoreHiddenTitles() {
  hiddenVisibleLimit += 80;
  renderHiddenGrid();
}

function renderRateGrid() { renderRecs(); }
function renderStars(id, rating=0) {
  const safeId = String(id).replace(/'/g,"\\'");
  const current = Number(rating || 0);
  return `<div class="star-rating" data-rating="${current}">${[1,2,3,4,5].map(s => `<span class="star${current >= s ? ' active' : ''}" data-star="${s}" onclick="rateMovie('${safeId}',${s})" onmouseenter="previewStars(this,${s})" onmouseleave="restoreStars(this)">★</span>`).join('')}</div>`;
}
function previewStars(el, n) {
  const box = el.closest('.star-rating');
  if (!box) return;
  box.querySelectorAll('.star').forEach(st => st.classList.toggle('active', Number(st.dataset.star) <= n));
}
function restoreStars(el) {
  const box = el.closest('.star-rating');
  if (!box) return;
  const rating = Number(box.dataset.rating || 0);
  box.querySelectorAll('.star').forEach(st => st.classList.toggle('active', Number(st.dataset.star) <= rating));
}
function previewManualStars(n) {
  const box = document.getElementById('manualStars');
  if (!box) return;
  box.querySelectorAll('.star').forEach(st => st.classList.toggle('active', Number(st.dataset.rating) <= n));
}
function restoreManualStars() {
  const box = document.getElementById('manualStars');
  if (!box) return;
  box.querySelectorAll('.star').forEach(st => st.classList.remove('active'));
}
function formatReceptionEffect(effect) {
  const rounded = Math.round(Number(effect || 0) * 10) / 10;
  if (Object.is(rounded, -0)) return '±0.0★';
  if (rounded === 0) return '±0.0★';
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}★`;
}

function buildCard(movie, opts={}) {
  const { rank, score, matchedTags, matchedGenres, posOverlap, genreOverlap, negativeOverlap, tasteFit, matchScore, predictedRating, receptionEffect, showEdit, watchlistView, poolView, hiddenView, contextLabel, contextTag } = opts;
  const hasSuppliedMatch = Number.isFinite(Number(matchScore)) || Number.isFinite(Number(tasteFit));
  const automaticMatch = hasSuppliedMatch ? null : cardMatchData(movie);
  const resolvedMatch = hasSuppliedMatch
    ? { matchScore:Number(matchScore ?? tasteFit) || 0, tasteFit:Number(tasteFit ?? matchScore) || 0, predictedRating:Number(predictedRating || 0), receptionEffect:Number(receptionEffect || 0), posOverlap:Number(posOverlap || 0), genreOverlap:Number(genreOverlap || 0), negativeOverlap:Number(negativeOverlap || 0), matchedTags:matchedTags || new Set(), matchedGenres:matchedGenres || new Set() }
    : automaticMatch;
  const showMatch = !!resolvedMatch;
  const resolvedMatchScore = Number(resolvedMatch?.matchScore ?? resolvedMatch?.tasteFit ?? 0) || 0;
  const resolvedPosOverlap = Number(resolvedMatch?.posOverlap || 0);
  const resolvedGenreOverlap = Number(resolvedMatch?.genreOverlap || 0);
  const resolvedNegativeOverlap = Number(resolvedMatch?.negativeOverlap || 0);
  const resolvedMatchedTags = resolvedMatch?.matchedTags || new Set();
  const resolvedMatchedGenres = resolvedMatch?.matchedGenres || new Set();
  const resolvedPredictedRating = Number(resolvedMatch?.predictedRating || 0);
  const resolvedReceptionEffect = Number(resolvedMatch?.receptionEffect || 0);
  const card = document.createElement('div');
  card.className = `movie-card ${isShow(movie) ? 'show-card' : 'film-card'}` + (movie.rating > 0 ? ' rated' : '');
  card.id = 'card-' + movie.id;
  const matchPct = Math.round(resolvedMatchScore * 100);
  const receptionHint = usableReception(movie) ? ` · reception ${formatReceptionEffect(resolvedReceptionEffect)}` : '';
  const matchSummary = resolvedPosOverlap
    ? `${resolvedPosOverlap} learned tag signal${resolvedPosOverlap===1?'':'s'}${resolvedGenreOverlap?` · ${resolvedGenreOverlap} genre signal${resolvedGenreOverlap===1?'':'s'}`:''} · ${matchPct}% predicted fit${resolvedPredictedRating?` · model ${resolvedPredictedRating.toFixed(1)}★`:''}${resolvedNegativeOverlap?` · ${resolvedNegativeOverlap} negative`:''}${receptionHint}`
    : 'no current positive taste overlap';
  const safeId = movie.id.replace(/'/g,"\\'");
  const formatLabel = isShow(movie) ? 'Show' : 'Movie';
  const wikiUrl = wikiUrlForMovie(movie);
  const googleUrl = googleSearchUrlForMovie(movie);
  const displayTitle = attrSafe(movie.title);
  const titleHtml = `<button class="card-title-button" onclick="showSimilarTitles('${safeId}',event)" title="Show similar titles">${displayTitle}</button>`;
  const sourceLinksHtml = [
    wikiUrl ? `<a class="source-link-btn" href="${attrSafe(wikiUrl)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Wiki</a>` : '',
    googleUrl ? `<a class="source-link-btn" href="${attrSafe(googleUrl)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" title="Search Google for ${displayTitle}">Google</a>` : ''
  ].filter(Boolean).join('');
  card.innerHTML = `
    <div class="card-poster">
      <div class="card-poster-inner" style="background:${posterGrad(movie.title)}">
        <div class="card-poster-year">${movie.year||''}${movie.format?' · '+movie.format.toUpperCase():''}</div>
        <div class="card-poster-title">${movie.title}</div>
        <div class="card-poster-dir">${movie.director||''}</div>
      </div>
      ${rank?`<div class="rank-badge">#${rank}</div>`:''}
      ${movie.rating>0?`<div class="score-badge">${'★'.repeat(movie.rating)}${'☆'.repeat(5-movie.rating)}</div>`:''}
    </div>
    <div class="card-body">
      <div class="card-head">
        ${movie.thumbnailUrl ? `<img class="card-thumb" src="${movie.thumbnailUrl}" alt="" loading="lazy" decoding="async">` : ''}
        <div class="card-head-copy"><div class="card-title">${titleHtml}</div>
        <div class="format-row"><span class="title-format">${formatLabel}</span>${showMatch?`<span class="match-percent">${matchPct}% match</span>`:''}</div>
        ${sourceLinksHtml ? `<div class="source-link-row">${sourceLinksHtml}</div>` : ''}
        <div class="card-meta">${movie.language}·${movie.country}·${movie.year||'?'}</div>
        ${showMatch?`<div class="match-label">${matchSummary}</div><div class="match-bar"><div class="match-fill" style="width:${matchPct}%"></div></div>`:''}</div>
      </div>
      ${renderStars(safeId, movie.rating || 0)}
      ${renderGenres(movie, resolvedMatchedGenres)}
      ${poolView && movie.retagMessage ? `<div class="pool-card-note">${movie.retagMessage}</div>`:''}
      <div class="card-tags" id="tags-${movie.id}">${renderTagInsightChips(movie, safeId, true, resolvedMatchedTags, contextTag)}</div>
      <div class="card-actions">
        <button class="card-act retag" onclick="retagMovie('${safeId}',event)">↺ re-tag</button>
        ${!hiddenView && movie.storyText && !hasCurrentAiTags(movie) ? `<button class="card-act" onclick="openManualTagChooser('${safeId}',event)">choose tags</button>` : ''}
        ${!hiddenView?`<button class="card-act" onclick="deleteMovie('${safeId}',event)">hide</button>`:''}
        <button class="card-act del" onclick="removeTitlePermanently('${safeId}',event)">remove</button>
      </div>
      ${contextLabel ? `<div class="tag-status">${contextLabel}</div>` : ''}
    </div>`;
  if (hiddenView) {
    const stars = card.querySelector('.star-rating');
    if (stars) stars.querySelectorAll('.star').forEach(star => {
      star.removeAttribute('onclick');
      star.removeAttribute('onmouseenter');
      star.removeAttribute('onmouseleave');
    });
    const tags = card.querySelector('.card-tags');
    if (tags) tags.querySelectorAll('.tag-insight-chip').forEach(tag => {
      tag.removeAttribute('onclick');
      tag.removeAttribute('title');
      tag.classList.remove('removable');
    });
    const actions = card.querySelector('.card-actions');
    if (actions) actions.innerHTML = `<button class="card-act retag" onclick="restoreHiddenMovie('${safeId}',event)">restore</button><button class="card-act del" onclick="forgetHiddenMovie('${safeId}',event)">forget</button>`;
  }
  return card;
}

function renderGenres(movie, matchedGenres=null) {
  const genres = movieGenres(movie);
  if (!genres.length) return '';
  const matched = matchedGenres || new Set();
  return `<div class="genre-row"><span class="genre-label">Genres</span>${genres.map(genre => {
    const safeGenre = String(genre).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<button type="button" class="genre-chip clickable${matched.has?.(genre) ? ' matched' : ''}" onclick="filterByGenreFromCard('${safeGenre}',event)">${genre}</button>`;
  }).join('')}</div>`;
}

function renderTagChips(tags, matchedTags, expanded) {
  if (!tags||!tags.length) return '';
  const matched = matchedTags||new Set();
  const ordered = [...tags].sort((a,b)=>(matched.has&&matched.has(b)?1:0)-(matched.has&&matched.has(a)?1:0));
  const list = expanded ? ordered : ordered.slice(0,5);
  return list.map(t=>`<span class="tag${matched.has&&matched.has(t)?' matched':''}">${t}</span>`).join('')
    + (tags.length>5&&!expanded?`<span class="tag" style="color:var(--muted2)">+${tags.length-5}</span>`:'');
}

function tagInsightChipHtml(tag, movieId, kind='', impact='') {
    const safeTag = String(tag).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const weight = Number(state.tagWeights[tag] || 0);
    const title = weight ? `Taste weight ${weight > 0 ? '+' : ''}${weight}. Click to ${state.settings.tagDeleteMode ? 'remove permanently from this title' : 'explore this tag'}.` : `Click to ${state.settings.tagDeleteMode ? 'remove permanently from this title' : 'explore this tag'}.`;
    return `<span class="tag-insight-chip ${kind}" title="${title}" onclick="handleTagClick('${movieId}','${safeTag}',event)">${tag}${impact ? `<span class="impact">${impact}</span>` : ''}</span>`;
}

function rawTagChipHtml(tag, movieId) {
    const safeTag = String(tag).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const title = state.settings.tagDeleteMode ? 'Click to remove this raw tag permanently from this title.' : 'Raw candidate used before tag cleanup. Turn on remove mode to delete it from this title.';
    return `<span class="tag-insight-chip raw-tag" title="${title}" onclick="handleRawTagClick('${movieId}','${safeTag}',event)">${tag}</span>`;
}

function cardTagGroups(movie, matchedTags=null, contextTag='') {
  const tags=scoringTags(movie).filter(tagIsPresentable);
  const matched=matchedTags || new Set();
  const scored=tags.map(tag => {
    const weight=Number(state.tagWeights[tag]||0);
    const contribution=weight*tagSpecificity(tag);
    return {tag,weight,contribution,matched:matched.has?.(tag)};
  });
  const matchedPositive=scored.filter(item=>item.matched && item.contribution>0)
    .sort((a,b)=>b.contribution-a.contribution||a.tag.localeCompare(b.tag));
  const matchedNegative=scored.filter(item=>item.matched && item.weight<0)
    .sort((a,b)=>Math.abs(b.contribution)-Math.abs(a.contribution)||a.tag.localeCompare(b.tag));
  const highlighted=new Set([...matchedPositive,...matchedNegative].map(item=>item.tag));
  const distinctive=tags.filter(tag=>!highlighted.has(tag) && tagSpecificity(tag)>=0.2)
    .sort((a,b)=>tagSpecificity(b)-tagSpecificity(a)||Math.abs(state.tagWeights[b]||0)-Math.abs(state.tagWeights[a]||0)||a.localeCompare(b))
    .slice(0,10);
  const shown=new Set([...highlighted,...distinctive]);
  const more=tags.filter(tag=>!shown.has(tag)).sort((a,b)=>tagSpecificity(b)-tagSpecificity(a)||a.localeCompare(b));
  return {matchedPositive,matchedNegative,distinctive,more,matchedTotal:matchedPositive.length};
}

function renderTagInsightChips(movie, movieId, expanded, matchedTags=null, contextTag='') {
  const groups=cardTagGroups(movie,matchedTags,contextTag);
  if (!groups.matchedPositive.length && !groups.matchedNegative.length && !groups.distinctive.length && !groups.more.length) return '';
  const scoringChips=[
    ...groups.matchedPositive.map(item=>tagInsightChipHtml(item.tag,movieId,'score-positive',`+${item.contribution.toFixed(1)}`)),
    ...groups.matchedNegative.map(item=>tagInsightChipHtml(item.tag,movieId,'score-negative',`${item.contribution.toFixed(1)}`))
  ].join('');
  const otherTags=[...groups.distinctive,...groups.more].map(tag=>tagInsightChipHtml(tag,movieId,'')).join('');
  const scoringRow=scoringChips?`<div class="score-chip-row">${scoringChips}</div>`:'';
  const tagRow=otherTags?`<div class="tag-chip-row">${otherTags}</div>`:'';
  return `<div class="tag-explanation">${scoringRow}${tagRow}</div>`;
}

function handleTagClick(id, tag, event) {
  if (event) event.stopPropagation();
  if (state.settings.tagDeleteMode) removeTagFromMovie(id, tag, event);
  else openTagFromCard(tag);
}

function handleRawTagClick(id, tag, event) {
  if (event) event.stopPropagation();
  if (state.settings.tagDeleteMode) removeRawTagFromMovie(id, tag, event);
}

function removeTagFromMovie(id, tag, event) {
  if (event) event.stopPropagation();
  const movie = state.movies[id] || state.hiddenTitles?.[id];
  if (!movie) return;
  suppressTagOnMovie(movie, tag);
  computeTagWeights();
  saveLocalState();
  queueDriveSync();
  render();
  showToast(`Removed tag from "${movie.title}": ${tag}`, 'success');
}

function suppressTagOnMovie(movie, tag) {
  const suppressedTag = normaliseTagName(tag);
  movie.suppressedTags = [...new Set([...(movie.suppressedTags || []), suppressedTag])];
  ['tags','coreTags','plotTags','descriptorTags'].forEach(key => {
    movie[key] = (movie[key] || []).filter(t => normaliseTagName(t) !== suppressedTag);
  });
  movie.tagged = scoringTags(movie).length > 0;
  touchRecord(movie);
  invalidateTagCaches();
}

function removeRawTagFromMovie(id, tag, event) {
  if (event) event.stopPropagation();
  const movie = state.movies[id] || state.hiddenTitles?.[id];
  if (!movie) return;
  const normalised = normaliseTagName(tag);
  movie.suppressedRawTags = [...new Set([...(movie.suppressedRawTags || []), normalised])];
  ['tags','coreTags','plotTags','descriptorTags'].forEach(key => {
    movie[key] = (movie[key] || []).filter(t => normaliseTagName(t) !== normalised);
  });
  movie.tagged = scoringTags(movie).length > 0 || rawScoringTags(movie).length > 0;
  touchRecord(movie);
  invalidateTagCaches();
  computeTagWeights();
  saveLocalState();
  queueDriveSync();
  render();
  showToast(`Removed raw tag from "${movie.title}": ${tag}`, 'success');
}

function posterGrad(title) {
  const h=[...title].reduce((a,c)=>a+c.charCodeAt(0),0);
  return `linear-gradient(135deg,hsl(${h%360},15%,10%) 0%,hsl(${(h*7)%360},20%,16%) 100%)`;
}

// ─────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────
function tasteEvidenceMovies() {
  return [
    ...Object.values(state.movies || {}),
    ...Object.values(state.hiddenTitles || {}).filter(m => Number(m.rating || 0) > 0)
  ];
}

const TASTE_MODEL_TAG_REGULARIZATION = 2.8;
const TASTE_MODEL_GENRE_REGULARIZATION = 3.5;
const TASTE_MODEL_PASSES = 9;
const TASTE_MODEL_TAG_LEARNING_RATE = 0.38;
const TASTE_MODEL_GENRE_LEARNING_RATE = 0.24;
const TASTE_MODEL_MANUAL_PREFERENCE_UNIT = 0.16;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatClass(movie) {
  return movie?.format ? 'show' : 'movie';
}

function formatTasteWeight(row, targetFormatClass) {
  if (!targetFormatClass || targetFormatClass === 'all') return 1;
  return row?.formatClass === targetFormatClass ? 1 : CROSS_FORMAT_TASTE_WEIGHT;
}

function ratingEvidenceRows(excludeMovieId='') {
  const excluded = String(excludeMovieId || '');
  return tasteEvidenceMovies()
    .filter(movie => Number(movie?.rating || 0) > 0)
    .filter(movie => !excluded || String(movie.id) !== excluded)
    .filter(movie => recommendationScoringTags(movie).length > 0)
    .map(movie => ({
      movie,
      rating:Number(movie.rating),
      formatClass:formatClass(movie),
      tags:recommendationScoringTags(movie),
      genres:movieGenres(movie)
    }));
}

function tagFeatureValue(tag) {
  // Very common tags remain available to the model, but cannot overwhelm a
  // personal rating signal simply because they appear everywhere.
  return Math.max(0.18, tagSpecificity(tag));
}

function manualTagPreferenceEffect(tag) {
  const preference = Number(state.settings?.tagPreferences?.[normaliseTagName(tag)] || 0);
  return clamp(preference, -4, 4) * TASTE_MODEL_MANUAL_PREFERENCE_UNIT;
}

function trainTasteModel(excludeMovieId='', targetFormatClass='all') {
  const rows = ratingEvidenceRows(excludeMovieId);
  const weightedRating = rows.reduce((sum, row) => sum + row.rating * formatTasteWeight(row, targetFormatClass), 0);
  const totalWeight = rows.reduce((sum, row) => sum + formatTasteWeight(row, targetFormatClass), 0);
  const fallbackRating = totalWeight
    ? weightedRating / totalWeight
    : 3;
  const model = {
    baseline:fallbackRating,
    tagEffects:{},
    genreEffects:{},
    calibrationSlope:1,
    calibrationIntercept:0,
    evidenceCount:rows.length,
    excludedMovieId:String(excludeMovieId || ''),
    targetFormatClass:targetFormatClass || 'all'
  };

  if (rows.length < 3) return model;

  const rawPredictions = rows.map(() => fallbackRating);

  for (let pass = 0; pass < TASTE_MODEL_PASSES; pass++) {
    const tagStats = {};
    rows.forEach((row, index) => {
      const weight = formatTasteWeight(row, targetFormatClass);
      const residual = row.rating - rawPredictions[index];
      row.tags.forEach(tag => {
        const feature = tagFeatureValue(tag);
        const stat = tagStats[tag] || (tagStats[tag] = {sum:0, strength:0});
        stat.sum += residual * feature * weight;
        stat.strength += feature * feature * weight;
      });
    });

    const tagDeltas = {};
    Object.entries(tagStats).forEach(([tag, stat]) => {
      const delta = clamp(
        (stat.sum / (stat.strength + TASTE_MODEL_TAG_REGULARIZATION)) * TASTE_MODEL_TAG_LEARNING_RATE,
        -0.42,
        0.42
      );
      if (!delta) return;
      model.tagEffects[tag] = (model.tagEffects[tag] || 0) + delta;
      tagDeltas[tag] = delta;
    });
    rows.forEach((row, index) => {
      row.tags.forEach(tag => {
        rawPredictions[index] += (tagDeltas[tag] || 0) * tagFeatureValue(tag);
      });
    });

    const genreStats = {};
    rows.forEach((row, index) => {
      const weight = formatTasteWeight(row, targetFormatClass);
      const residual = row.rating - rawPredictions[index];
      row.genres.forEach(genre => {
        const stat = genreStats[genre] || (genreStats[genre] = {sum:0, strength:0});
        stat.sum += residual * GENRE_SCORE_FACTOR * weight;
        stat.strength += GENRE_SCORE_FACTOR * GENRE_SCORE_FACTOR * weight;
      });
    });

    const genreDeltas = {};
    Object.entries(genreStats).forEach(([genre, stat]) => {
      const delta = clamp(
        (stat.sum / (stat.strength + TASTE_MODEL_GENRE_REGULARIZATION)) * TASTE_MODEL_GENRE_LEARNING_RATE,
        -0.30,
        0.30
      );
      if (!delta) return;
      model.genreEffects[genre] = (model.genreEffects[genre] || 0) + delta;
      genreDeltas[genre] = delta;
    });
    rows.forEach((row, index) => {
      row.genres.forEach(genre => {
        rawPredictions[index] += (genreDeltas[genre] || 0) * GENRE_SCORE_FACTOR;
      });
      rawPredictions[index] = clamp(rawPredictions[index], 1, 5);
    });
  }

  // Calibrate the learned raw score against the actual 1–5 ratings. This makes
  // the displayed percentage a rating prediction rather than a relative overlap
  // score that merely makes the top title look like 100%.
  const calibrationWeight = totalWeight || rows.length || 1;
  const meanRaw = rawPredictions.reduce((sum, value, index) => sum + value * formatTasteWeight(rows[index], targetFormatClass), 0) / calibrationWeight;
  const meanActual = rows.reduce((sum, row) => sum + row.rating * formatTasteWeight(row, targetFormatClass), 0) / calibrationWeight;
  let variance = 0;
  let covariance = 0;
  rawPredictions.forEach((value, index) => {
    const weight = formatTasteWeight(rows[index], targetFormatClass);
    const rawDelta = value - meanRaw;
    variance += rawDelta * rawDelta * weight;
    covariance += rawDelta * (rows[index].rating - meanActual) * weight;
  });
  if (variance > 0.001) {
    model.calibrationSlope = clamp(covariance / variance, 0.45, 2.4);
    model.calibrationIntercept = meanActual - model.calibrationSlope * meanRaw;
  }

  return model;
}

function getTasteModel(excludeMovieId='', targetFormatClass='all') {
  const formatKey = targetFormatClass || 'all';
  const key = `${String(excludeMovieId || '__full__')}|${formatKey}`;
  if (!tasteModelCache.has(key)) tasteModelCache.set(key, trainTasteModel(excludeMovieId, formatKey));
  return tasteModelCache.get(key);
}

function receptionLaneForMovie(movie) {
  if (movie?.format) return 'englishShows';
  return movie?.language === 'Hindi' ? 'hindiMovies' : 'englishMovies';
}

function usableReception(movie) {
  const reception = normaliseReceptionRecord(movie?.reception);
  return !!(reception?.present && reception.version >= RECEPTION_VERSION && reception.strength > 0);
}

function defaultReceptionCalibration() {
  return {
    version:RECEPTION_VERSION,
    updatedAt:'',
    global:{coefficient:RECEPTION_BASELINE_COEFFICIENT, sample:0},
    lanes:{
      hindiMovies:{coefficient:RECEPTION_BASELINE_COEFFICIENT, sample:0},
      englishMovies:{coefficient:RECEPTION_BASELINE_COEFFICIENT, sample:0},
      englishShows:{coefficient:RECEPTION_BASELINE_COEFFICIENT, sample:0}
    }
  };
}

function receptionCalibration() {
  const base = defaultReceptionCalibration();
  const current = state.meta?.receptionCalibration || {};
  return {
    ...base,
    ...current,
    global:{...base.global, ...(current.global || {})},
    lanes:{
      hindiMovies:{...base.lanes.hindiMovies, ...(current.lanes?.hindiMovies || {})},
      englishMovies:{...base.lanes.englishMovies, ...(current.lanes?.englishMovies || {})},
      englishShows:{...base.lanes.englishShows, ...(current.lanes?.englishShows || {})}
    }
  };
}

function laneCoefficient(lane, calibration=receptionCalibration()) {
  const global = calibration.global || {};
  const laneStat = calibration.lanes?.[lane] || {};
  if (Number(laneStat.sample || 0) >= RECEPTION_LANE_MIN_SAMPLE) return clamp(Number(laneStat.coefficient || RECEPTION_BASELINE_COEFFICIENT), RECEPTION_COEFFICIENT_MIN, RECEPTION_COEFFICIENT_MAX);
  if (Number(global.sample || 0) >= RECEPTION_GLOBAL_MIN_SAMPLE) return clamp(Number(global.coefficient || RECEPTION_BASELINE_COEFFICIENT), RECEPTION_COEFFICIENT_MIN, RECEPTION_COEFFICIENT_MAX);
  return RECEPTION_BASELINE_COEFFICIENT;
}

function receptionShift(movie, lane=receptionLaneForMovie(movie), calibration=receptionCalibration()) {
  const reception = normaliseReceptionRecord(movie?.reception);
  if (!reception?.present || !reception.strength) return 0;
  const rawShift = laneCoefficient(lane, calibration) * Number(reception.qualitySignal || 0) * Number(reception.strength || 0);
  return clamp(rawShift, -RECEPTION_MAX_DOWN, RECEPTION_MAX_UP);
}

function fitReceptionCoefficient(samples=[]) {
  if (!samples.length) return {coefficient:RECEPTION_BASELINE_COEFFICIENT, sample:0};
  let xy = 0;
  let xx = 0;
  samples.forEach(sample => {
    xy += sample.signal * sample.residual;
    xx += sample.signal * sample.signal;
  });
  const slope = xy / (xx + 2.5);
  return {coefficient:clamp(slope, RECEPTION_COEFFICIENT_MIN, RECEPTION_COEFFICIENT_MAX), sample:samples.length};
}

function updateReceptionCalibration() {
  const samples = [];
  Object.values(state.movies || {}).forEach(movie => {
    if (Number(movie?.rating || 0) <= 0 || !usableReception(movie)) return;
    const model = getTasteModel(movie.id, formatClass(movie));
    const tasteOnly = predictTasteFit(movie, model, {tasteOnly:true});
    const reception = normaliseReceptionRecord(movie.reception);
    const signal = Number(reception.qualitySignal || 0) * Number(reception.strength || 0);
    if (!signal) return;
    samples.push({
      lane:receptionLaneForMovie(movie),
      signal,
      residual:Number(movie.rating || 0) - Number(tasteOnly.tasteOnlyPredictedRating || tasteOnly.predictedRating || 3)
    });
  });
  const lanes = {};
  ['hindiMovies','englishMovies','englishShows'].forEach(lane => {
    lanes[lane] = fitReceptionCoefficient(samples.filter(sample => sample.lane === lane));
  });
  const global = fitReceptionCoefficient(samples);
  state.meta = state.meta || {};
  state.meta.receptionCalibration = {
    version:RECEPTION_VERSION,
    updatedAt:nowStamp(),
    global,
    lanes
  };
  return state.meta.receptionCalibration;
}

function scheduleReceptionCalibrationUpdate() {
  clearTimeout(receptionCalibrationTimer);
  receptionCalibrationTimer = setTimeout(() => {
    receptionCalibrationTimer = null;
    updateReceptionCalibration();
    saveLocalState({preserveUpdatedAt:true});
    queueDriveSync();
  }, 300);
}

function predictTasteFit(movie, model=null, opts={}) {
  const activeModel = model || getTasteModel('', formatClass(movie));
  const tags = recommendationScoringTags(movie);
  const genres = movieGenres(movie);
  let rawRating = Number(activeModel?.baseline || 3);
  let posOverlap = 0;
  let genreOverlap = 0;
  let negativeOverlap = 0;
  let positiveScore = 0;
  let negativePenalty = 0;
  const matchedTags = new Set();
  const matchedGenres = new Set();

  tags.forEach(tag => {
    const contribution = ((Number(activeModel?.tagEffects?.[tag] || 0) + manualTagPreferenceEffect(tag)) * tagFeatureValue(tag));
    rawRating += contribution;
    if (contribution > 0.015) {
      posOverlap++;
      positiveScore += contribution;
      matchedTags.add(tag);
    } else if (contribution < -0.015) {
      negativeOverlap++;
      negativePenalty += Math.abs(contribution);
    }
  });

  genres.forEach(genre => {
    const contribution = Number(activeModel?.genreEffects?.[genre] || 0) * GENRE_SCORE_FACTOR;
    rawRating += contribution;
    if (contribution > 0.012) {
      genreOverlap++;
      positiveScore += contribution;
      matchedGenres.add(genre);
    } else if (contribution < -0.012) {
      negativePenalty += Math.abs(contribution);
    }
  });

  const tasteOnlyPredictedRating = clamp(
    Number(activeModel?.calibrationIntercept || 0) + Number(activeModel?.calibrationSlope || 1) * rawRating,
    1,
    5
  );
  const shift = opts.tasteOnly ? 0 : receptionShift(movie, receptionLaneForMovie(movie), receptionCalibration());
  const withReception = clamp(tasteOnlyPredictedRating + shift, 1, 5);
  const receptionEffect = withReception - tasteOnlyPredictedRating;
  const languageBonus = (!opts.tasteOnly && movie?.language === 'English') ? ENGLISH_PREFERENCE_STAR_BONUS : 0;
  let predictedRating = opts.tasteOnly ? tasteOnlyPredictedRating : clamp(withReception + languageBonus, 1, 5);
  let finalMatchScore = clamp((predictedRating - 1) / 4, 0, 1);
  if (!opts.tasteOnly && !usableReception(movie) && finalMatchScore > RECEPTION_UNCORROBORATED_CAP) {
    finalMatchScore = RECEPTION_UNCORROBORATED_CAP;
    predictedRating = 1 + finalMatchScore * 4;
  }

  return {
    movie,
    score:predictedRating,
    predictedRating,
    tasteOnlyPredictedRating,
    receptionShift:shift,
    receptionEffect,
    languageBonus,
    matchScore:finalMatchScore,
    tasteFit:finalMatchScore,
    posOverlap,
    genreOverlap,
    negativeOverlap,
    positiveScore,
    negativePenalty,
    matchedTags,
    matchedGenres
  };
}

function computeTagWeights() {
  const model = getTasteModel();
  const weights = {};
  const genres = {};
  Object.entries(model.tagEffects || {}).forEach(([tag, effect]) => {
    const value = Number(effect || 0) + manualTagPreferenceEffect(tag);
    if (Math.abs(value) > 0.001) weights[tag] = value;
  });
  Object.entries(model.genreEffects || {}).forEach(([genre, effect]) => {
    if (Math.abs(Number(effect || 0)) > 0.001) genres[genre] = Number(effect);
  });
  state.tagWeights = weights;
  state.genreWeights = genres;
}

function scoreMovies() {
  if (scoredMovieCache) return scoredMovieCache;
  computeTagWeights();
  const ranked = Object.values(state.movies)
    .filter(movie => movie.rating === 0 && scoringTags(movie).length > 0)
    .map(movie => predictTasteFit(movie, getTasteModel('', formatClass(movie))))
    // Discovery still needs some learned positive evidence. We do not fill For
    // You with neutral baseline guesses merely because every title has a rating.
    .filter(item => item.posOverlap > 0 && item.predictedRating > Number(getTasteModel('', formatClass(item.movie)).baseline || 3));

  ranked.sort((a, b) =>
    b.predictedRating - a.predictedRating ||
    b.positiveScore - a.positiveScore ||
    a.negativePenalty - b.negativePenalty ||
    b.posOverlap - a.posOverlap ||
    b.genreOverlap - a.genreOverlap ||
    a.movie.title.localeCompare(b.movie.title)
  );
  scoredMovieCache = ranked;
  return scoredMovieCache;
}
// ─────────────────────────────────────────────
// RATING
// ─────────────────────────────────────────────
function rateMovie(id, rating) {
  const movie = state.movies[id];
  if (!movie) return;
  const currentRating = Number(movie.rating || 0);
  const clickedRating = Number(rating);
  const nextRating = currentRating === 1 && clickedRating === 1 ? 0 : clickedRating;
  const ratingChanged = currentRating !== nextRating;
  movie.rating = nextRating;
  if (ratingChanged) movie.ratedAt = nowStamp();
  if (nextRating > 0) movie.watchlist = false;
  touchRecord(movie);
  collapseDuplicateMovies(state.movies);
  invalidateTasteModel();
  computeTagWeights();
  scheduleReceptionCalibrationUpdate();
  if (nextRating > 0 && String(id) === pendingSearchResetAfterRatingId) {
    pendingSearchResetAfterRatingId = '';
    clearUnifiedTitleSearch();
  }
  saveLocalState({changedMovieIds:[id]}); queueDriveSync(); render();
  scheduleTasteStoryUpdate();
  showToast(nextRating ? `"${movie.title}" → ${nextRating}/5` : `Removed rating from "${movie.title}"`, nextRating ? 'success' : '');
}

// ─────────────────────────────────────────────
// CARD ACTIONS
// ─────────────────────────────────────────────
function deleteMovie(id, e) {
  if (e) e.stopPropagation();
  const m = state.movies[id];
  if (!m||!confirm(`Hide "${m.title}"? It will not be fetched again.`)) return;
  const stamp = nowStamp();
  state.hiddenTitles[id] = touchRecord({ ...m, hiddenAt: stamp }, stamp);
  delete state.movies[id];
  invalidateTagCaches();
  computeTagWeights();
  saveLocalState(); queueDriveSync(); render();
  showToast(`Hidden "${m.title}"`, '');
}

function removeTitlePermanently(id, e) {
  if (e) e.stopPropagation();
  const m = state.movies[id] || state.hiddenTitles?.[id];
  if (!m || !confirm(`Remove "${m.title}" from CineLens? It will stay blocked from automatic fetching and tagging, but you can add it again deliberately through search.`)) return;
  const stamp = nowStamp();
  state.wrongPicks = state.wrongPicks || {};
  const key = normaliseTitleKey(m.wikiTitle || m.pageTitle || m.title) || id;
  state.wrongPicks[key] = {
    id,
    title:m.title || '',
    wikiTitle:m.wikiTitle || '',
    pageTitle:m.pageTitle || '',
    wikiPageId:m.wikiPageId || wikiPageIdFromMovie(m),
    at:stamp,
    updatedAt:stamp
  };
  state.deletedMovieRecords = state.deletedMovieRecords || {};
  state.unblockedTitleRecords = state.unblockedTitleRecords || {};
  delete state.unblockedTitleRecords[key];
  state.deletedMovieRecords[id] = { id, titleKey:key, reason:'removed', at:stamp, updatedAt:stamp };
  delete state.movies[id];
  delete state.hiddenTitles[id];
  invalidateTagCaches();
  rebuildTagBrain();
  computeTagWeights();
  saveLocalState(); queueDriveSync(); render();
  showToast(`Removed "${m.title}"`, 'success');
}

function restoreHiddenMovie(id, e) {
  if (e) e.stopPropagation();
  const movie = state.hiddenTitles?.[id];
  if (!movie) return;
  const { hiddenAt, wrongPick, retagStatus, retagMessage, ...restored } = movie;
  touchRecord(restored);
  state.movies[id] = restored;
  delete state.hiddenTitles[id];
  if (state.deletedMovieRecords) delete state.deletedMovieRecords[id];
  invalidateTagCaches();
  computeTagWeights();
  saveLocalState(); queueDriveSync(); render();
  showToast(`Restored "${movie.title}"`, 'success');
}
function forgetHiddenMovie(id, e) {
  if (e) e.stopPropagation();
  const movie = state.hiddenTitles?.[id];
  if (!movie) return;
  removeTitlePermanently(id, e);
}
function toggleWatchlist(id, e) {
  if (e) e.stopPropagation();
  const m = state.movies[id];
  if (!m) return;
  m.watchlist = !m.watchlist;
  m.skipped = false;
  touchRecord(m);
  saveLocalState(); queueDriveSync(); render();
  showToast(m.watchlist?`Added "${m.title}" to watchlist`:`Removed "${m.title}" from watchlist`, m.watchlist?'success':'');
}
function skipMovie(id, e) { toggleWatchlist(id, e); }

function applyFreshWikiMovie(oldId, fresh, previous={}) {
  const stamp = nowStamp();
  const normalisedFresh = normaliseFetchedWikiMovie(fresh, previous);
  const preserved = {
    rating: Number(previous.rating || 0),
    watchlist: !!previous.watchlist,
    skipped: !!previous.skipped,
    userNotes: previous.userNotes || '',
    suppressedTags: previous.suppressedTags || [],
    suppressedRawTags: previous.suppressedRawTags || [],
    thumbnailUrl: normalisedFresh.thumbnailUrl || previous.thumbnailUrl || ''
  };
  const next = {
    ...normalisedFresh,
    ...preserved,
    addedAt: previous.addedAt || normalisedFresh.addedAt || previous.fetchedAt || previous.createdAt || stamp,
    wikiPageId: normalisedFresh.wikiPageId || previous.wikiPageId,
    wikiTitle: normalisedFresh.wikiTitle || previous.wikiTitle,
    pageTitle: normalisedFresh.pageTitle || previous.pageTitle,
    wikiUrl: normalisedFresh.wikiUrl || previous.wikiUrl
  };
  touchRecord(next, stamp);
  if (oldId && oldId !== next.id) {
    delete state.movies[oldId];
    state.deletedMovieRecords = state.deletedMovieRecords || {};
    state.deletedMovieRecords[oldId] = { id:oldId, replacementId:next.id, at:stamp, updatedAt:stamp };
  }
  state.movies[next.id] = next;
  return next;
}

function refreshMovieTags(movie, opts={}) {
  if (!movie?.storyText) return movie;
  if (!hasCurrentAiTags(movie)) clearGeneratedTags(movie);
  touchRecord(movie);
  return movie;
}

function wikiModesFor(movie=null, preferred='all') {
  const primary = preferred && preferred !== 'all' ? preferred : (movie?.format ? 'shows' : 'movies');
  return [...new Set([primary, 'all'].filter(Boolean))];
}

async function fetchWikiTitleAcrossModes(title, modes, diagnostics=null, opts={}) {
  if (!title) return null;
  for (const mode of modes) {
    try {
      const fresh = await fetchWikiMovie(title, mode, diagnostics, opts);
      if (fresh) return fresh;
    } catch(e) {}
  }
  return null;
}

async function fetchWikiPageIdAcrossModes(pageId, modes, opts={}) {
  if (!pageId) return null;
  for (const mode of modes) {
    try {
      const fresh = await fetchWikiMovieByPageId(pageId, mode, opts);
      if (fresh) return fresh;
    } catch(e) {}
  }
  return null;
}

function freshMatchesTitleRecord(fresh, movie, title='') {
  if (!fresh || !movie) return !!fresh;
  if (sameMovieIdentity(fresh, movie)) return true;
  if (sameCanonicalTitle(fresh.title, movie.title)) return true;
  if (sameCanonicalTitle(fresh.pageTitle, movie.pageTitle || movie.wikiTitle || movie.title)) return true;
  if (title && sameCanonicalTitle(fresh.pageTitle, title)) return true;
  return false;
}

async function refreshTitleFromWikipedia(movie=null, opts={}) {
  const rawUrl = (opts.url || '').trim();
  const urlTitle = wikipediaTitleFromUrl(rawUrl) || wikipediaTitleFromUrl(wikiUrlForMovie(movie));
  const modes = wikiModesFor(movie, opts.mode || 'all');
  const acceptDifferentTitle = !!opts.acceptDifferentTitle || !movie;
  const diagnostics = opts.diagnostics || null;

  if (rawUrl && !urlTitle && !movie) {
    throw new Error('Use a valid Wikipedia page URL');
  }

  if (movie) {
    if (!movie.wikiPageId && String(movie.id || '').startsWith('wiki_')) {
      movie.wikiPageId = String(movie.id).replace(/^wiki_/, '');
    }
    const byPageId = await fetchWikiPageIdAcrossModes(wikiPageIdFromMovie(movie), modes, {ai:opts.ai !== false, manualLanguageOverride:!!opts.manualLanguageOverride});
    if (byPageId && (acceptDifferentTitle || freshMatchesTitleRecord(byPageId, movie))) return byPageId;
  }

  if (urlTitle) {
    const fresh = await fetchWikiTitleAcrossModes(urlTitle, modes, diagnostics, {
      ai:opts.ai !== false,
      manualLanguageOverride:!!opts.manualLanguageOverride,
      directLink:!!rawUrl
    });
    if (fresh && (acceptDifferentTitle || freshMatchesTitleRecord(fresh, movie, urlTitle))) return fresh;
  }

  if (!movie) return null;

  const candidates = [
    movie.wikiTitle,
    movie.pageTitle,
    movie.title,
    movie.format ? `${movie.title} (TV series)` : `${movie.title} (film)`,
    movie.year ? `${movie.title} (${movie.year} film)` : '',
    movie.year ? `${movie.title} (${movie.year} TV series)` : '',
    movie.format ? `${movie.title} television series` : `${movie.title} film`,
    movie.language === 'Hindi' && movie.country === 'India' ? `${movie.title} (Hindi film)` : '',
    movie.language === 'Hindi' && movie.country === 'India' && movie.format ? `${movie.title} (Hindi TV series)` : ''
  ].filter(Boolean);

  for (const title of [...new Set(candidates)]) {
    const fresh = await fetchWikiTitleAcrossModes(title, modes, null, {ai:opts.ai !== false, manualLanguageOverride:!!opts.manualLanguageOverride});
    if (fresh && freshMatchesTitleRecord(fresh, movie, title)) return fresh;
  }

  try {
    const searchTitles = await fetchWikiSearchTitles(`${movie.title} ${movie.year || ''} ${movie.format ? 'television series' : 'film'}`);
    for (const title of searchTitles) {
      const fresh = await fetchWikiTitleAcrossModes(title, modes, null, {ai:opts.ai !== false, manualLanguageOverride:!!opts.manualLanguageOverride});
      if (fresh && freshMatchesTitleRecord(fresh, movie, title)) return fresh;
    }
  } catch(e) {}

  return null;
}

async function findFreshWikiForMovie(movie) {
  try {
    return await refreshTitleFromWikipedia(movie);
  } catch(e) {
    return null;
  }
}

async function retagFromStoredData(id, opts={}) {
  const movie = state.movies[id];
  if (!movie) return null;
  const beforeTags = new Set(scoringTags(movie));
  showFetchProgress(opts.progressLabel || 'Refreshing AI tags...', 20, movie.wikiTitle || movie.pageTitle || movie.title);
  try {
    let updated = movie;
    if (movie.storyText && Number(movie.wikiParserVersion || 0) >= WIKI_PARSER_VERSION) {
      try {
        await applyAiTags(movie, {force:true});
      } catch(firstError) {
        if (/daily cinelens tagging limit reached/i.test(String(firstError?.message || firstError))) throw firstError;
        const fresh = await refreshTitleFromWikipedia(movie, {ai:false});
        if (!fresh) throw firstError;
        updated = applyFreshWikiMovie(id, fresh, movie);
        await applyAiTags(updated, {force:true});
      }
    } else {
      const fresh = await refreshTitleFromWikipedia(movie, {ai:false});
      if (!fresh) throw new Error('Stored Wikipedia page could not be refreshed');
      updated = applyFreshWikiMovie(id, fresh, movie);
      await applyAiTags(updated, {force:true});
    }
    updated.needsManualUrl = false;
    updated.retagStatus = 'verified';
    updated.retagMessage = '';
    rebuildTagBrain();
    computeTagWeights();
    saveLocalState();
    queueDriveSync();
    scheduleTagCloudNormalization(1200);
    render();
    if (opts.successToast !== false) {
      const addedTags = scoringTags(updated).filter(tag => !beforeTags.has(tag));
      showToast(addedTags.length ? `Re-tagged "${updated.title}" · +${addedTags.length} tags` : `Re-tagged "${updated.title}" · tags refreshed`, 'success');
    }
    return updated;
  } catch(err) {
    if (err?.cinelensTitleExcluded || isAiSensitiveContentBlock(err)) {
      saveLocalState();
      queueDriveSync();
      render();
      if (opts.errorToast !== false) showToast(`Removed "${movie.title}" because its subject triggered the content exclusion rule.`, '');
      return null;
    }
    const current = state.movies[id] || movie;
    current.needsManualUrl = false;
    current.retagStatus = 'needs-ai-tags';
    current.retagMessage = aiTagFailureMessage(err, current);
    saveLocalState();
    render();
    if (opts.errorToast !== false) showToast(`Could not re-tag "${current.title}": ${current.retagMessage}`, 'error');
    return null;
  } finally {
    hideFetchProgress();
  }
}

async function retagMovie(id, e) {
  if (e) e.stopPropagation();
  const m = state.movies[id];
  if (!m) return;

  if (poolExpansionInProgress || autoExpandTimer) {
    stopFetching({silent:true});
    await waitForPoolIdle();
    if (poolExpansionInProgress) {
      showToast('Stopping fetch. Try re-tag again in a moment.', 'error');
      return;
    }
  }

  return await retagFromStoredData(id);
}
function toggleTags(id, e) {
  if (e) e.stopPropagation();
  const m = state.movies[id];
  if (!m) return;
  const tags = scoringTags(m);
  if (!tags||!tags.length) return;
  m._expanded = !m._expanded;
  const el = document.getElementById('tags-'+id);
  if (el) el.innerHTML = renderTagInsightChips(m, id, m._expanded);
  const card = document.getElementById('card-'+id);
  if (card) { const b=card.querySelector('.card-act'); if(b&&(b.textContent.includes('tags')||b.textContent.includes('less'))) b.textContent=m._expanded?'▲ less':'▼ tags'; }
}

// ─────────────────────────────────────────────
// HOUSEKEEPING (local dedup)
// ─────────────────────────────────────────────
function runHousekeeping(manual=true, deferCanonical=false) {
  Object.values(state.movies).forEach(m => {
    m.genres = movieGenres(m);
    if (hasCurrentAiTags(m)) {
      m.tags = cleanTagArray(m.tags || [], m, false);
      m.coreTags = [...m.tags];
      m.plotTags = [...m.tags];
      m.descriptorTags = [...m.tags];
      m.rawDescriptors = [];
    } else {
      clearGeneratedTags(m);
    }
    m.tagged = !!(m.tags.length || m.coreTags.length || m.plotTags.length || (m.descriptorTags && m.descriptorTags.length));
  });
  const collapsed = collapseDuplicateMovies(state.movies);
  if (!deferCanonical) {
    if (collapsed) rebuildTagBrain();
    computeTagWeights();
  }
  if (manual) {
    saveLocalState();
    queueDriveSync();
    showToast('Tags cleaned', 'success');
  }
  updateHKStatus(tagStatusText());
}

function countUniqueTags() {
  return fullAiTagVocabulary().length;
}
function countRawTags() { return buildTagVocabularyCache().activeRawCount; }
function tagStatusText() { return `tags: ${countUniqueTags()} · candidates: ${countRawTags()}`; }
function updateHKStatus(msg) {
  const el = document.getElementById('hkStatus');
  if (el) el.textContent = msg;
}

// ─────────────────────────────────────────────
// TASTE STORY — independent creative feature
// ─────────────────────────────────────────────
function normaliseTasteStory(value={}) {
  return {
    version:String(value?.version || TASTE_STORY_VERSION),
    profileHash:String(value?.profileHash || ''),
    title:String(value?.title || '').trim().slice(0, 180),
    story:String(value?.story || '').trim().slice(0, 14000),
    generatedAt:String(value?.generatedAt || ''),
    status:['idle','queued','writing','ready','error'].includes(value?.status) ? value.status : 'idle',
    error:String(value?.error || '').slice(0, 240),
    ratingCount:Math.max(0, Number(value?.ratingCount || 0))
  };
}

function tasteStoryRatingCount() {
  return tasteEvidenceMovies().filter(movie => Number(movie?.rating || 0) > 0).length;
}

function buildTasteStoryProfile() {
  computeTagWeights();
  const weighted=Object.entries(state.tagWeights || {})
    .map(([tag, weight]) => ({tag:normaliseTagName(tag), weight:Number(weight || 0)}))
    .filter(item => item.tag && item.weight)
    .sort((a,b) => Math.abs(b.weight) - Math.abs(a.weight) || a.tag.localeCompare(b.tag));
  const likedTags=weighted.filter(item => item.weight > 0).slice(0, 42);
  const avoidedTags=weighted.filter(item => item.weight < 0).slice(0, 28);
  const preferredGenres=Object.entries(state.genreWeights || {})
    .map(([genre, weight]) => ({genre:normaliseTagName(genre), weight:Number(weight || 0)}))
    .filter(item => item.genre && item.weight > 0)
    .sort((a,b) => b.weight - a.weight || a.genre.localeCompare(b.genre))
    .slice(0, 10);
  const avoidedGenres=Object.entries(state.genreWeights || {})
    .map(([genre, weight]) => ({genre:normaliseTagName(genre), weight:Number(weight || 0)}))
    .filter(item => item.genre && item.weight < 0)
    .sort((a,b) => a.weight - b.weight || a.genre.localeCompare(b.genre))
    .slice(0, 10);
  const ratingCount=tasteStoryRatingCount();
  const profile={
    version:TASTE_STORY_VERSION,
    ratingCount,
    likedTags,
    avoidedTags,
    preferredGenres,
    avoidedGenres
  };
  return {...profile, profileHash:String(stableHash(JSON.stringify(profile)))};
}

function ensureTasteStoryCard() {
  let card=document.getElementById('tasteStoryCard');
  if (card) return card;
  const anchor=document.getElementById('tagBrainSep');
  if (!anchor) return null;
  anchor.insertAdjacentHTML('beforebegin', `
    <section class="tag-only taste-story-card" id="tasteStoryCard">
      <div class="taste-story-head">
        <div>
          <div class="taste-story-kicker">A Story for You</div>
          <div id="tasteStoryMeta" class="taste-story-meta"></div>
        </div>
        <button class="card-act taste-story-refresh" id="tasteStoryRefreshBtn" onclick="refreshTasteStory()">write a new story</button>
      </div>
      <div id="tasteStoryBody" class="taste-story-body"></div>
    </section>`);
  return document.getElementById('tasteStoryCard');
}

function renderTasteStoryCard() {
  const card=ensureTasteStoryCard();
  if (!card) return;
  const body=document.getElementById('tasteStoryBody');
  const meta=document.getElementById('tasteStoryMeta');
  const button=document.getElementById('tasteStoryRefreshBtn');
  const ratingCount=tasteStoryRatingCount();
  const story=normaliseTasteStory(state.tasteStory || {});
  state.tasteStory=story;
  card.style.display=activeTab === 'tags' ? 'block' : 'none';
  if (activeTab !== 'tags' || !body || !meta) return;
  if (ratingCount < TASTE_STORY_MIN_RATINGS) {
    meta.textContent=`Rate ${TASTE_STORY_MIN_RATINGS - ratingCount} more ${TASTE_STORY_MIN_RATINGS - ratingCount === 1 ? 'title' : 'titles'} to begin your story`;
    body.innerHTML='<span style="color:var(--muted)">Your rated tags will become the creative ingredients for an original story made for you.</span>';
    if (button) button.disabled=true;
    return;
  }
  if (button) {
    button.disabled=!!tasteStoryInProgress;
    button.textContent=tasteStoryInProgress ? 'writing…' : 'write a new story';
  }
  if (story.story) {
    const title=story.title ? `<div class="taste-story-title">${attrSafe(story.title)}</div>` : '';
    const paragraphs=attrSafe(story.story).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
    body.innerHTML=title+paragraphs;
    meta.textContent=story.status === 'writing'
      ? 'Your next story is being written from your latest ratings…'
      : `Written from ${ratingCount} ratings${story.generatedAt ? ` · updated ${new Date(story.generatedAt).toLocaleString()}` : ''}`;
  } else if (story.status === 'writing' || story.status === 'queued') {
    body.innerHTML='<span style="color:var(--muted)">Gemini is writing an original story from the story patterns your ratings favour.</span>';
    meta.textContent='Writing your first story…';
  } else {
    body.innerHTML='<span style="color:var(--muted)">Your first story is ready to be written from the tags your ratings have shaped.</span>';
    meta.textContent=`${ratingCount} ratings ready`;
  }
}

async function generateTasteStory({force=false}={}) {
  if (tasteStoryInProgress) {
    tasteStoryRefreshPending = true;
    return false;
  }
  const profile=buildTasteStoryProfile();
  if (profile.ratingCount < TASTE_STORY_MIN_RATINGS) return false;
  const existing=normaliseTasteStory(state.tasteStory || {});
  if (!force && existing.profileHash === profile.profileHash && existing.story) return true;
  tasteStoryInProgress=true;
  state.tasteStory={...existing, version:TASTE_STORY_VERSION, profileHash:profile.profileHash, status:'writing', error:'', ratingCount:profile.ratingCount};
  renderTasteStoryCard();
  const wait=Math.max(0, AI_REQUEST_DELAY_MS - (Date.now() - lastAiRequestAt));
  if (wait) await abortableSleep(wait);
  lastAiRequestAt=Date.now();
  try {
    const response=await fetch(AI_TAGGER_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({task:'generate-taste-story', profile})
    });
    if (!response.ok) throw new Error(`Taste story HTTP ${response.status}`);
    const payload=await response.json();
    if (!payload.ok) throw new Error(payload.error || 'Taste story generation failed');
    const title=String(payload.title || '').trim();
    const story=String(payload.story || '').trim();
    if (!title || !story) throw new Error('Gemini returned no usable story');
    state.tasteStory={
      version:TASTE_STORY_VERSION,
      profileHash:profile.profileHash,
      title:title.slice(0,180),
      story:story.slice(0,14000),
      generatedAt:nowStamp(),
      status:'ready',
      error:'',
      ratingCount:profile.ratingCount
    };
    saveLocalState();
    queueDriveSync();
    renderTasteStoryCard();
    return true;
  } catch(error) {
    state.tasteStory={...existing, version:TASTE_STORY_VERSION, profileHash:existing.profileHash || profile.profileHash, status:'error', error:String(error?.message || error), ratingCount:profile.ratingCount};
    renderTasteStoryCard();
    console.warn('Taste story generation failed', error);
    return false;
  } finally {
    tasteStoryInProgress=false;
    renderTasteStoryCard();
    if (tasteStoryRefreshPending) {
      tasteStoryRefreshPending=false;
      scheduleTasteStoryUpdate();
    }
  }
}

function scheduleTasteStoryUpdate({force=false}={}) {
  clearTimeout(tasteStoryTimer);
  if (tasteStoryInProgress) {
    tasteStoryRefreshPending=true;
    return;
  }
  const profile=buildTasteStoryProfile();
  if (profile.ratingCount < TASTE_STORY_MIN_RATINGS) return;
  const existing=normaliseTasteStory(state.tasteStory || {});
  if (!force && existing.profileHash === profile.profileHash && existing.story) return;
  state.tasteStory={...existing, version:TASTE_STORY_VERSION, profileHash:profile.profileHash, status:'queued', error:'', ratingCount:profile.ratingCount};
  renderTasteStoryCard();
  tasteStoryTimer=setTimeout(() => generateTasteStory({force}), TASTE_STORY_DEBOUNCE_MS);
}

function refreshTasteStory() {
  scheduleTasteStoryUpdate({force:true});
}

// ─────────────────────────────────────────────
// TAG BRAIN
// ─────────────────────────────────────────────
function setTagFilter(filter, btn) {
  tagFilter=filter;
  document.querySelectorAll('.taste-filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTagBrain();
}

function formatTagBrainWeight(value) {
  const num = Number(value || 0);
  if (Math.abs(num) < 0.005) return '~';
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}`;
}

function renderTagBrain() {
  computeTagWeights();
  if (!state.settings.tagPreferences) state.settings.tagPreferences = {};
  renderTasteStoryCard();
  const profile=buildTasteStoryProfile();
  if (profile.ratingCount >= TASTE_STORY_MIN_RATINGS && (!state.tasteStory?.story || state.tasteStory?.profileHash !== profile.profileHash)) scheduleTasteStoryUpdate();
  const grid=document.getElementById('tagBrainGrid');
  const countEl=document.getElementById('tagBrainCount');
  const search=(document.getElementById('tagSearch')?.value || '').trim().toLowerCase();
  updateControlDeck();
  const map={};
  [...Object.values(state.movies || {}), ...Object.values(state.hiddenTitles || {})].forEach(m => {
    if (!m.tagged) return;
    if (!matchesGlobalFilters(m)) return;
    scoringTags(m).filter(tagIsPresentable).forEach(tag => {
      if (!map[tag]) map[tag]={weight:state.tagWeights[tag]||0,preference:Number(state.settings.tagPreferences[tag]||0),movieCount:0,movies:[]};
      map[tag].movieCount++; map[tag].movies.push(m);
    });
  });
  let entries=Object.entries(map);
  if (!entries.length) { grid.innerHTML='<span style="font-size:12px;color:var(--muted)">No useful tags yet.</span>'; countEl.textContent='rate movies to populate'; return; }
  if (tagFilter==='positive') entries=entries.filter(([,v])=>v.weight>0);
  else if (tagFilter==='negative') entries=entries.filter(([,v])=>v.weight<0);
  else if (tagFilter==='neutral') entries=entries.filter(([,v])=>v.weight===0);
  if (search) entries=entries.filter(([tag])=>tag.includes(search));
  entries.sort((a,b)=>Math.abs(b[1].weight)-Math.abs(a[1].weight)||a[0].localeCompare(b[0]));
  countEl.textContent=`${entries.length} tags${tagFilter!=='all'||search?' · filtered':''}`;
  grid.innerHTML=entries.map(([tag,data])=>{
    const cls=data.weight>0?'positive':data.weight<0?'negative':'neutral';
    const ws=formatTagBrainWeight(data.weight);
    const pref=data.preference ? `<span class="tb-pref">${data.preference > 0 ? 'pref +' : 'pref '}${data.preference}</span>` : '';
    const safe=tag.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const title = state.settings.tagDeleteMode
      ? `Remove "${tag}" from ${data.movieCount} ${data.movieCount === 1 ? 'title' : 'titles'}`
      : `Explore "${tag}"`;
    return `<span class="tb-tag ${cls}${state.settings.tagDeleteMode ? ' remove-mode' : ''}" title="${title}" onclick="handleTagBrainClick('${safe}',event)">${tag}<span class="tb-weight">${ws}</span>${pref}<span class="tb-count">${data.movieCount}</span></span>`;
  }).join('');
  renderTagDetail();
}

function handleTagBrainClick(tag, event) {
  if (event) event.stopPropagation();
  if (state.settings.tagDeleteMode) removeTagFromBrain(tag);
  else openTagPanel(tag);
}

function removeTagFromBrain(tag) {
  const normalised = normaliseTagName(tag);
  const affected = [...Object.values(state.movies || {}), ...Object.values(state.hiddenTitles || {})]
    .filter(movie => scoringTags(movie).some(t => normaliseTagName(t) === normalised));
  if (!affected.length) return;
  affected.forEach(movie => suppressTagOnMovie(movie, tag));
  if (normaliseTagName(selectedTag) === normalised) selectedTag = '';
  rebuildTagBrain();
  computeTagWeights();
  saveLocalState();
  queueDriveSync();
  render();
  showToast(`Removed "${tag}" from ${affected.length} ${affected.length === 1 ? 'title' : 'titles'}`, 'success');
}

function openTagPanel(tag) {
  selectedTag=tag;
  tagDetailVisibleLimit=40;
  renderTagDetail();
  document.getElementById('tagDetail')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function openTagFromCard(tag) {
  selectedTag=tag;
  tagDetailView='all';
  tagDetailVisibleLimit=40;
  activeTab='tags';
  document.querySelectorAll('.tab-btn').forEach(button=>button.classList.toggle('active', button.textContent.trim()==='Tags'));
  render();
  document.getElementById('tagDetail')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function toggleTagDeleteMode() {
  state.settings.tagDeleteMode=!state.settings.tagDeleteMode;
  saveViewState();
  renderActiveCards();
  updateControlDeck();
}

function setTagDetailView(view, btn) {
  tagDetailView=view;
  tagDetailVisibleLimit=40;
  document.querySelectorAll('.tag-detail-view-btn').forEach(button=>button.classList.remove('active'));
  btn?.classList.add('active');
  renderTagDetail();
}

function clearSelectedTag() {
  selectedTag='';
  renderTagDetail();
}

function showMoreTagTitles() {
  tagDetailVisibleLimit+=40;
  renderTagDetail();
}

function tagPreferenceValue(tag) {
  return Number(state.settings?.tagPreferences?.[normaliseTagName(tag)] || 0);
}

function setTagPreference(tag, value) {
  const normalised = normaliseTagName(tag);
  if (!normalised) return;
  if (!state.settings.tagPreferences) state.settings.tagPreferences = {};
  const next = Math.max(-4, Math.min(4, Number(value || 0)));
  if (next) state.settings.tagPreferences[normalised] = next;
  else delete state.settings.tagPreferences[normalised];
  computeTagWeights();
  saveSettingsState();
  render();
  if (selectedTag) renderTagDetail();
  showToast(next ? `Set "${normalised}" preference to ${next > 0 ? '+' : ''}${next}` : `Cleared "${normalised}" preference`, next ? 'success' : '');
}

function renderTagPreferenceControls(tag) {
  const current = tagPreferenceValue(tag);
  const safe = tag.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  const options = [[-4,'Avoid'],[-2,'Dislike'],[0,'Neutral'],[2,'Like'],[4,'Love']];
  return `<div class="tag-pref-panel">
    <span class="tag-pref-label">Tag preference</span>
    <div class="tag-pref-buttons">
      ${options.map(([value,label]) => `<button class="tb-filter-btn tag-pref-btn${current===value?' active':''}" onclick="setTagPreference('${safe}',${value})">${label}</button>`).join('')}
    </div>
  </div>`;
}

function renderTagDetail() {
  const detail=document.getElementById('tagDetail');
  const grid=document.getElementById('tagMoviesGrid');
  if (!detail || !grid) return;
  if (!selectedTag) { detail.hidden=true; grid.innerHTML=''; return; }
  detail.hidden=false;
  computeTagWeights();
  document.getElementById('tagDetailName').textContent=selectedTag;
  const activeMovies=Object.values(state.movies || {}).filter(m=>m.tagged&&scoringTags(m).includes(selectedTag));
  const hiddenMovies=Object.values(state.hiddenTitles || {}).filter(m=>m.tagged&&scoringTags(m).includes(selectedTag));
  const all=[...activeMovies.map(movie=>({movie,status:movie.rating>0?'rated':'pool'})),...hiddenMovies.map(movie=>({movie,status:'hidden'}))];
  const weight=state.tagWeights[selectedTag]||0;
  const preference=tagPreferenceValue(selectedTag);
  const prefText=preference ? `, preference ${preference > 0 ? '+' : ''}${preference}` : '';
  const ws=weight>0?`+${weight} (you like this${prefText})`:weight<0?`${weight} (you dislike this${prefText})`:`~ unweighted${prefText}`;
  const counts={rated:all.filter(x=>x.status==='rated').length,pool:all.filter(x=>x.status==='pool').length,hidden:all.filter(x=>x.status==='hidden').length};
  document.getElementById('tagDetailStat').textContent=`weight ${ws} · ${all.length} titles · ${counts.rated} rated · ${counts.pool} pool · ${counts.hidden} hidden`;
  const prefSlot=document.getElementById('tagPreferenceControls');
  if (prefSlot) prefSlot.innerHTML=renderTagPreferenceControls(selectedTag);
  let rows=(tagDetailView==='all'?all:all.filter(item=>item.status===tagDetailView)).filter(item=>matchesGlobalFilters(item.movie));
  rows.sort((a,b)=>(a.status==='rated'?0:a.status==='pool'?1:2)-(b.status==='rated'?0:b.status==='pool'?1:2)||Number(b.movie.rating||0)-Number(a.movie.rating||0)||a.movie.title.localeCompare(b.movie.title));
  grid.innerHTML='';
  if (!rows.length) { grid.innerHTML='<div class="empty-state"><h3>No Titles In This Group</h3></div>'; return; }
  rows.slice(0,tagDetailVisibleLimit).forEach(({movie,status})=>grid.appendChild(buildCard(movie,{hiddenView:status==='hidden',showEdit:status==='rated',poolView:status==='pool',contextLabel:status==='rated'?'Rated':status==='hidden'?'Hidden':'In Pool',contextTag:selectedTag})));
  if (rows.length>tagDetailVisibleLimit) grid.insertAdjacentHTML('beforeend',`<div class="empty-state"><button class="btn btn-warning" onclick="showMoreTagTitles()">Show 40 more · ${rows.length-tagDetailVisibleLimit} remaining</button></div>`);
}
// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
function updateStats() {
  const movies=Object.values(state.movies);
  const rated=movies.filter(m=>m.rating>0);
  const tagged=movies.filter(m=>m.tagged);
  const avg=rated.length?(rated.reduce((s,m)=>s+m.rating,0)/rated.length).toFixed(1):'—';
  document.getElementById('statRated').textContent=rated.length;
  document.getElementById('statTagged').textContent=tagged.length;
  document.getElementById('statTags').textContent=countUniqueTags();
  document.getElementById('statPool').textContent=movies.length;
  document.getElementById('statAvg').textContent=avg;
  updateHKStatus(tagStatusText());
}
function updateTopN(val) { document.getElementById('topNVal').textContent=val; state.settings.topN=parseInt(val); recVisibleLimit=Math.max(parseInt(val), REC_INFINITE_PAGE_SIZE); saveViewState(); renderRecs(); }
function updateMinYear(val) {
  const year = Math.max(1900, Math.min(new Date().getFullYear(), parseInt(val, 10) || 1970));
  const changed = Number(state.settings.minYear) !== year;
  state.settings.minYear = year;
  const input = document.getElementById('minYear');
  if (input) input.value = year;
  if (changed) resetYearBoundedDiscovery();
  saveViewState();
  renderActiveCards();
}

async function resetAllData() {
  const confirmation = prompt('This erases every CineLens title, rating, tag and Drive copy. Type RESET to continue.');
  if (confirmation !== 'RESET') return;

  stopFetching({silent:true});
  if (backgroundAiTimer) {
    clearTimeout(backgroundAiTimer);
    backgroundAiTimer = null;
  }

  const resetAt = nowStamp();
  state.movies = {};
  state.tagWeights = {};
  state.genreWeights = {};
  state.hiddenTitles = {};
  state.wrongPicks = {};
  state.deletedMovieRecords = {};
  state.rollingPoolExclusions = {};
  state.unblockedTitleRecords = {};
  state.legacyTagAliases = {};
  invalidateTagCaches();
  state.tagStats = { candidates:0, tags:0, rebuiltAt:'' };
  state.tagNormalization = { version:'', lastRawTagCount:0, normalizedAt:'', model:'', error:'' };
  state.settings.tagPreferences = {};
  state.settings.titleSearch = '';
  delete state.canonicalTagStats;
  state.discoveryCursor = {};
  ensureDiscoveryCursor();
  state.poolFetched = false;
  state.meta = {...(state.meta || {}), resetAt, updatedAt:resetAt, collectionActive:false};
  autoFetchPaused = true;
  recVisibleLimit = Math.max(REC_INFINITE_PAGE_SIZE, parseInt(state.settings.topN || 10));
  saveLocalState();
  render();

  if ((state.drive.connected || state.drive.accessToken) && state.drive.fileId) {
    try {
      setDriveStatus('syncing');
      await uploadDriveData();
      setDriveStatus('connected');
    } catch(e) {
      setDriveStatus('');
      showToast('Local data reset. Drive could not be cleared yet; reconnect and reset again.', 'error');
      return;
    }
  }

  showToast('CineLens reset completely.', 'success');
}

// ─────────────────────────────────────────────
// LOCAL DATABASE — IndexedDB record cache
// ─────────────────────────────────────────────
const LOCAL_DB_NAME='cinelens_local_v3';
const LOCAL_DB_PROFILE_KEY='profile';
let localDbPromise=null;
let localDbSaveTimer=null;
let localDbSaveInProgress=false;
let localDbSaveQueued=false;
let localDbMovieSignatureCache=new Map();
let localDbHiddenSignatureCache=new Map();
let localDbProfileSignature='';
let localDbSaveGeneration=0;
let pendingDirtyMovieIds=new Set();
let pendingFullSave=true;

function openLocalDatabase() {
  if (localDbPromise) return localDbPromise;
  localDbPromise=new Promise((resolve,reject) => {
    if (!('indexedDB' in window)) { reject(new Error('IndexedDB unavailable')); return; }
    // Never request a lower schema version than an existing device database.
    // The reverted candidate-index migration may have already upgraded this DB.
    // Opening without an explicit version safely reuses that database and its
    // normal movies/hidden/meta stores.
    const request=indexedDB.open(LOCAL_DB_NAME);
    request.onupgradeneeded=() => {
      const db=request.result;
      if (!db.objectStoreNames.contains('movies')) db.createObjectStore('movies',{keyPath:'id'});
      if (!db.objectStoreNames.contains('hidden')) db.createObjectStore('hidden',{keyPath:'id'});
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error || new Error('IndexedDB open failed'));
  });
  return localDbPromise;
}

function idbRequest(request) {
  return new Promise((resolve,reject) => {
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error || new Error('IndexedDB request failed'));
  });
}

function idbTransactionDone(transaction) {
  return new Promise((resolve,reject) => {
    transaction.oncomplete=()=>resolve();
    transaction.onerror=()=>reject(transaction.error || new Error('IndexedDB transaction failed'));
    transaction.onabort=()=>reject(transaction.error || new Error('IndexedDB transaction aborted'));
  });
}

function localProfilePayload() {
  return {
    meta:state.meta,
    settings:state.settings,
    wrongPicks:state.wrongPicks,
    deletedMovieRecords:state.deletedMovieRecords,
    rollingPoolExclusions:state.rollingPoolExclusions,
    unblockedTitleRecords:state.unblockedTitleRecords,
    legacyTagAliases:state.legacyTagAliases,
    tagStats:state.tagStats,
    tagNormalization:state.tagNormalization,
    tasteStory:state.tasteStory,
    discoveryCursor:state.discoveryCursor,
    poolFetched:state.poolFetched,
    drive:{
      enabled:state.drive.enabled,
      folderId:state.drive.folderId,
      fileId:state.drive.fileId,
      manifestFileId:state.drive.manifestFileId || '',
      lastConnectedAt:state.drive.lastConnectedAt
    }
  };
}

function queueIndexedDbSave(delay=450, changedMovieIds=null) {
  if (Array.isArray(changedMovieIds)) {
    changedMovieIds.forEach(id => {
      const key = String(id || '').trim();
      if (key) pendingDirtyMovieIds.add(key);
    });
  } else {
    pendingFullSave = true;
  }
  localDbSaveGeneration++;
  clearTimeout(localDbSaveTimer);
  localDbSaveTimer=setTimeout(() => persistStateToIndexedDb(), Math.max(0, Number(delay)||0));
}

async function persistStateToIndexedDb() {
  if (localDbSaveInProgress) { localDbSaveQueued=true; return; }
  localDbSaveInProgress=true;
  const saveGeneration=localDbSaveGeneration;
  const saveFull=pendingFullSave;
  const dirtyMovieIds=[...pendingDirtyMovieIds];
  try {
    const db=await openLocalDatabase();
    const tx=db.transaction(['movies','hidden','meta'],'readwrite');
    const moviesStore=tx.objectStore('movies');
    const hiddenStore=tx.objectStore('hidden');
    let nextMovies=localDbMovieSignatureCache;
    let nextHidden=localDbHiddenSignatureCache;

    if (saveFull) {
      nextMovies=new Map();
      nextHidden=new Map();
      Object.entries(state.movies || {}).forEach(([id,movie]) => {
        const signature=JSON.stringify(movie);
        nextMovies.set(String(id),signature);
        if (localDbMovieSignatureCache.get(String(id)) !== signature) moviesStore.put({...movie,id:String(movie.id || id)});
      });
      Object.entries(state.hiddenTitles || {}).forEach(([id,movie]) => {
        const signature=JSON.stringify(movie);
        nextHidden.set(String(id),signature);
        if (localDbHiddenSignatureCache.get(String(id)) !== signature) hiddenStore.put({...movie,id:String(movie.id || id)});
      });
      localDbMovieSignatureCache.forEach((_,id) => { if (!nextMovies.has(id)) moviesStore.delete(id); });
      localDbHiddenSignatureCache.forEach((_,id) => { if (!nextHidden.has(id)) hiddenStore.delete(id); });
    } else {
      nextMovies=new Map(localDbMovieSignatureCache);
      nextHidden=new Map(localDbHiddenSignatureCache);
      dirtyMovieIds.forEach(id => {
        const movie=state.movies?.[id];
        const hidden=state.hiddenTitles?.[id];
        if (movie) {
          const signature=JSON.stringify(movie);
          nextMovies.set(id,signature);
          if (localDbMovieSignatureCache.get(id) !== signature) moviesStore.put({...movie,id:String(movie.id || id)});
        } else if (hidden) {
          const signature=JSON.stringify(hidden);
          nextHidden.set(id,signature);
          if (localDbHiddenSignatureCache.get(id) !== signature) hiddenStore.put({...hidden,id:String(hidden.id || id)});
        }
      });
    }

    const profile=localProfilePayload();
    const profileSignature=JSON.stringify(profile);
    if (profileSignature !== localDbProfileSignature) tx.objectStore('meta').put(profile,LOCAL_DB_PROFILE_KEY);
    await idbTransactionDone(tx);
    localDbMovieSignatureCache=nextMovies;
    localDbHiddenSignatureCache=nextHidden;
    localDbProfileSignature=profileSignature;
    if (localDbSaveGeneration === saveGeneration) {
      pendingDirtyMovieIds.clear();
      pendingFullSave=false;
    }
    try { localStorage.removeItem('cinelens_v2'); } catch(_) {}
  } catch(error) {
    console.warn('IndexedDB local save failed',error);
  } finally {
    localDbSaveInProgress=false;
    if (localDbSaveQueued) { localDbSaveQueued=false; queueIndexedDbSave(200); }
  }
}

async function loadIndexedDbState() {
  try {
    const db=await openLocalDatabase();
    const tx=db.transaction(['movies','hidden','meta'],'readonly');
    const [movies,hidden,profile]=await Promise.all([
      idbRequest(tx.objectStore('movies').getAll()),
      idbRequest(tx.objectStore('hidden').getAll()),
      idbRequest(tx.objectStore('meta').get(LOCAL_DB_PROFILE_KEY))
    ]);
    await idbTransactionDone(tx);
    if (!profile && !movies.length && !hidden.length) return false;
    const incoming={
      ...(profile || {}),
      movies:Object.fromEntries(movies.map(movie=>[String(movie.id),movie])),
      hiddenTitles:Object.fromEntries(hidden.map(movie=>[String(movie.id),movie]))
    };
    const indexedStamp=dataTimestamp(incoming);
    const currentStamp=dataTimestamp(exportCinelensData());
    if (indexedStamp >= currentStamp || !Object.keys(state.movies || {}).length) {
      replaceStateFromDataset(incoming);
      if (profile?.drive) {
        state.drive.enabled=!!profile.drive.enabled || !!profile.drive.fileId || !!profile.drive.manifestFileId;
        state.drive.folderId=profile.drive.folderId || '';
        state.drive.fileId=profile.drive.fileId || '';
        state.drive.manifestFileId=profile.drive.manifestFileId || '';
        state.drive.lastConnectedAt=profile.drive.lastConnectedAt || 0;
      }
    }
    localDbMovieSignatureCache=new Map(movies.map(movie=>[String(movie.id),JSON.stringify(movie)]));
    localDbHiddenSignatureCache=new Map(hidden.map(movie=>[String(movie.id),JSON.stringify(movie)]));
    localDbProfileSignature=JSON.stringify(localProfilePayload());
    pendingDirtyMovieIds.clear();
    pendingFullSave=false;
    return true;
  } catch(error) {
    console.warn('IndexedDB local load failed',error);
    return false;
  }
}

// ─────────────────────────────────────────────
// PERSISTENCE
// ─────────────────────────────────────────────
function nowStamp() {
  return new Date().toISOString();
}

function touchRecord(record, stamp=nowStamp()) {
  if (!record || typeof record !== 'object') return record;
  record._updatedAt = stamp;
  return record;
}

function recordTimestamp(record) {
  if (!record || typeof record !== 'object') return 0;
  return Date.parse(record._updatedAt || record.updatedAt || record.hiddenAt || record.at || '') || 0;
}

function dataTimestamp(data) {
  const recordTimes = [
    ...Object.values(data?.movies || {}),
    ...Object.values(data?.hiddenTitles || {}),
    ...Object.values(data?.wrongPicks || {}),
    ...Object.values(data?.deletedMovieRecords || {}),
    ...Object.values(data?.rollingPoolExclusions || {})
  ].map(recordTimestamp);
  return Math.max(
    Date.parse(data?.meta?.updatedAt || data?.updatedAt || '') || 0,
    Date.parse(data?.meta?.resetAt || '') || 0,
    Date.parse(data?.settings?.updatedAt || data?.meta?.settingsUpdatedAt || '') || 0,
    ...recordTimes,
    0
  );
}

function settingsTimestamp(data) {
  return Date.parse(data?.settings?.updatedAt || data?.meta?.settingsUpdatedAt || '') || 0;
}

function touchSettings(stamp=nowStamp()) {
  if (!state.settings) state.settings = {};
  state.settings.updatedAt = stamp;
  if (!state.meta) state.meta = {};
  state.meta.settingsUpdatedAt = stamp;
}


function syncMustWaitForForegroundWork({respectHardCap=false}={}) {
  if (respectHardCap && driveSyncDeferredSince && Date.now() - driveSyncDeferredSince >= DRIVE_SYNC_MAX_DEFER_MS) return false;
  return !!(
    poolExpansionInProgress ||
    receptionBackfillInProgress ||
    backgroundAiTaggingInProgress ||
    tagCloudNormalizationInProgress ||
    tasteStoryInProgress
  );
}

function queueDriveSync(delay=DRIVE_SYNC_DEBOUNCE_MS) {
  if (!state.drive?.enabled && !state.drive?.connected && !state.drive?.accessToken) return;
  if (!driveSyncDeferredSince) driveSyncDeferredSince = Date.now();
  driveSyncDeferred=true;
  clearTimeout(driveSyncTimer);
  const requestedDelay = Number(delay);
  driveSyncTimer=setTimeout(() => {
    driveSyncTimer=null;
    if (syncMustWaitForForegroundWork({respectHardCap:true})) {
      queueDriveSync(Math.max(1000, delay));
      return;
    }
    driveSyncDeferred=false;
    syncDrive(false);
  }, Math.max(0, Number.isFinite(requestedDelay) ? requestedDelay : DRIVE_SYNC_DEBOUNCE_MS));
}

function queueSettingsSync() {
  if (!state.drive?.enabled && !state.drive?.connected && !state.drive?.accessToken) return;
  clearTimeout(settingsSyncTimer);
  settingsSyncTimer = setTimeout(() => queueDriveSync(900), 900);
}

function saveSettingsState() {
  touchSettings();
  saveLocalState();
  queueSettingsSync();
}

function saveViewState() {
  touchSettings();
  saveLocalState();
}

function ensureSyncMetadata({touchDataset=false}={}) {
  const stamp = nowStamp();
  Object.values(state.movies || {}).forEach(movie => {
    if (!movie._updatedAt) touchRecord(movie, stamp);
  });
  Object.values(state.hiddenTitles || {}).forEach(movie => {
    if (!movie._updatedAt) touchRecord(movie, movie.hiddenAt || stamp);
  });
  Object.values(state.deletedMovieRecords || {}).forEach(record => {
    if (record && typeof record === 'object' && !record.updatedAt) record.updatedAt = record.at || stamp;
  });
  Object.values(state.unblockedTitleRecords || {}).forEach(record => {
    if (record && typeof record === 'object' && !record.updatedAt) record.updatedAt = record.at || stamp;
  });
  Object.values(state.wrongPicks || {}).forEach(record => {
    if (record && typeof record === 'object' && !record.updatedAt) record.updatedAt = record.at || stamp;
  });
  Object.values(state.rollingPoolExclusions || {}).forEach(record => {
    if (record && typeof record === 'object' && !record.updatedAt) record.updatedAt = record.at || stamp;
  });
  if (!state.meta) state.meta = {};
  if (touchDataset || !state.meta.updatedAt) state.meta.updatedAt = stamp;
  if (!state.settings) state.settings = {};
  if (state.settings.updatedAt) state.meta.settingsUpdatedAt = state.settings.updatedAt;
}

function exportCinelensData() {
  ensureSyncMetadata();
  ensureDiscoveryCursor();
  return {
    meta: state.meta,
    movies: state.movies,
    settings: state.settings,
    hiddenTitles: state.hiddenTitles,
    wrongPicks: state.wrongPicks,
    deletedMovieRecords: state.deletedMovieRecords,
    rollingPoolExclusions: state.rollingPoolExclusions,
    unblockedTitleRecords: state.unblockedTitleRecords,
    tagStats: state.tagStats,
    tagNormalization: state.tagNormalization,
    tasteStory: state.tasteStory,
    discoveryCursor: state.discoveryCursor
  };
}

function normaliseDiscoveryCursor(cursor={}) {
  const clean = {};
  Object.entries(cursor || {}).forEach(([key, value]) => {
    clean[key] = {
      categoryIndex: Math.max(0, Number(value?.categoryIndex) || 0),
      categoryTitle: String(value?.categoryTitle || ''),
      offset: Math.max(0, Number(value?.offset) || 0),
      cycles: Math.max(0, Number(value?.cycles) || 0)
    };
  });
  return clean;
}

function compareDiscoveryCursor(a={}, b={}) {
  const ac = Number(a.cycles) || 0;
  const bc = Number(b.cycles) || 0;
  if (ac !== bc) return ac - bc;
  const ai = Number(a.categoryIndex) || 0;
  const bi = Number(b.categoryIndex) || 0;
  if (ai !== bi) return ai - bi;
  return (Number(a.offset) || 0) - (Number(b.offset) || 0);
}

function mergeDiscoveryCursor(local={}, remote={}) {
  const merged = {};
  let localChanged = false;
  let remoteChanged = false;
  new Set([...Object.keys(local || {}), ...Object.keys(remote || {})]).forEach(key => {
    const a = local?.[key] || {};
    const b = remote?.[key] || {};
    if (compareDiscoveryCursor(a, b) >= 0) {
      merged[key] = a;
      if (compareDiscoveryCursor(a, b) > 0) remoteChanged = true;
    } else {
      merged[key] = b;
      localChanged = true;
    }
  });
  return {merged:normaliseDiscoveryCursor(merged), localChanged, remoteChanged};
}

function normaliseIncomingData(d={}) {
  const tagStats = d.tagStats || (d.canonicalTagStats ? {candidates:d.canonicalTagStats.raw||0,tags:d.canonicalTagStats.canonical||0,rebuiltAt:d.canonicalTagStats.rebuiltAt||''} : state.tagStats);
  const settings = {...(d.settings || {})};
  settings.tagPreferences = settings.tagPreferences || {};
  return {
    meta: d.meta || (d.updatedAt ? {updatedAt:d.updatedAt} : {}),
    movies: d.movies || {},
    settings,
    hiddenTitles: d.hiddenTitles || {},
    wrongPicks: d.wrongPicks || {},
    deletedMovieRecords: d.deletedMovieRecords || {},
    rollingPoolExclusions: d.rollingPoolExclusions || {},
    unblockedTitleRecords: d.unblockedTitleRecords || {},
    legacyTagAliases: d.tagAliases || d.legacyTagAliases || {},
    tagStats,
    tagNormalization: d.tagNormalization || {version:'', lastRawTagCount:0, normalizedAt:'', model:'', error:''},
    tasteStory: normaliseTasteStory(d.tasteStory || {}),
    discoveryCursor: normaliseDiscoveryCursor(d.discoveryCursor || {})
  };
}

function replaceStateFromDataset(dataset) {
  const incoming = normaliseIncomingData(dataset);
  state.movies = incoming.movies;
  state.settings = {...state.settings, ...incoming.settings};
  state.settings.tagPreferences = state.settings.tagPreferences || {};
  state.hiddenTitles = incoming.hiddenTitles;
  state.wrongPicks = incoming.wrongPicks;
  state.deletedMovieRecords = incoming.deletedMovieRecords;
  state.rollingPoolExclusions = incoming.rollingPoolExclusions || {};
  state.unblockedTitleRecords = incoming.unblockedTitleRecords || {};
  state.legacyTagAliases = incoming.legacyTagAliases;
  state.tagStats = incoming.tagStats;
  state.tagNormalization = incoming.tagNormalization;
  state.tasteStory = incoming.tasteStory;
  state.discoveryCursor = incoming.discoveryCursor;
  state.meta = incoming.meta;
  Object.values(state.movies || {}).forEach(normaliseStoredTitleRecord);
  Object.values(state.hiddenTitles || {}).forEach(normaliseStoredTitleRecord);
  ensureDiscoveryCursor();
  invalidateTagCaches();
}

function copyRecord(record) {
  return record && typeof record === 'object' ? JSON.parse(JSON.stringify(record)) : record;
}

function newestRecord(localRecord, remoteRecord, {preferHiddenOnTie=false}={}) {
  if (!localRecord) return copyRecord(remoteRecord);
  if (!remoteRecord) return copyRecord(localRecord);
  const localTime = recordTimestamp(localRecord);
  const remoteTime = recordTimestamp(remoteRecord);
  if (remoteTime > localTime) return copyRecord(remoteRecord);
  if (localTime > remoteTime) return copyRecord(localRecord);
  return copyRecord(preferHiddenOnTie ? remoteRecord : localRecord);
}

function mergeRecordMap(localMap={}, remoteMap={}) {
  const merged={};
  new Set([...Object.keys(localMap || {}), ...Object.keys(remoteMap || {})]).forEach(id => {
    const selected=newestRecord(localMap?.[id], remoteMap?.[id]);
    if (selected) merged[id]=selected;
  });
  return merged;
}

function newestTasteStory(localStory={}, remoteStory={}) {
  const local=normaliseTasteStory(localStory);
  const remote=normaliseTasteStory(remoteStory);
  const localTime=Date.parse(local.generatedAt || '') || 0;
  const remoteTime=Date.parse(remote.generatedAt || '') || 0;
  if (remoteTime > localTime) return remote;
  if (localTime > remoteTime) return local;
  return remote.story.length > local.story.length ? remote : local;
}

function mergeCanonicalDatasets(localRaw={}, remoteRaw={}) {
  const local=normaliseIncomingData(localRaw);
  const remote=normaliseIncomingData(remoteRaw);
  const localResetAt=Date.parse(local.meta?.resetAt || '') || 0;
  const remoteResetAt=Date.parse(remote.meta?.resetAt || '') || 0;

  // A later deliberate reset is the only whole-library overwrite rule.
  if (localResetAt > remoteResetAt) return {dataset:local, source:'local-reset'};
  if (remoteResetAt > localResetAt) return {dataset:remote, source:'drive-reset'};

  const movies={...mergeRecordMap(local.movies, remote.movies)};
  const hiddenTitles={...mergeRecordMap(local.hiddenTitles, remote.hiddenTitles)};
  const unblockedTitleRecords=mergeRecordMap(local.unblockedTitleRecords, remote.unblockedTitleRecords);
  const wrongPicks=mergeRecordMap(local.wrongPicks, remote.wrongPicks);
  const deletedMovieRecords=mergeRecordMap(local.deletedMovieRecords, remote.deletedMovieRecords);
  const rollingPoolExclusions=mergeRecordMap(local.rollingPoolExclusions, remote.rollingPoolExclusions);

  // A deliberate manual re-add is also synchronized. It clears an older wrong-pick
  // block across devices instead of letting an old Drive tombstone undo the re-add.
  Object.entries(wrongPicks).forEach(([key, record]) => {
    const titleKey=normaliseTitleKey(record?.wikiTitle || record?.pageTitle || record?.title || key);
    const release=unblockedTitleRecords[titleKey];
    if (release && recordTimestamp(release) >= recordTimestamp(record)) delete wrongPicks[key];
  });

  // Permanent removal/forget must win over any stale active or hidden copy on
  // another device. A title is allowed back only after an explicit manual re-add.
  const removalBlocksMovie = movie => {
    if (!movie) return false;
    const titleKey=normaliseTitleKey(movie.wikiTitle || movie.pageTitle || movie.title);
    const release=unblockedTitleRecords[titleKey];
    const idRecord=deletedMovieRecords[movie.id];
    const titleRecord=Object.values(wrongPicks).find(record =>
      [record?.title, record?.wikiTitle, record?.pageTitle].some(title => normaliseTitleKey(title) === titleKey)
    );
    const tombstone=[idRecord,titleRecord].filter(Boolean).sort((a,b)=>recordTimestamp(b)-recordTimestamp(a))[0];
    if (!tombstone) return false;
    if (release && recordTimestamp(release) > recordTimestamp(tombstone)) return false;
    return recordTimestamp(tombstone) >= recordTimestamp(movie);
  };
  Object.keys(movies).forEach(id => { if (removalBlocksMovie(movies[id])) delete movies[id]; });
  Object.keys(hiddenTitles).forEach(id => { if (removalBlocksMovie(hiddenTitles[id])) delete hiddenTitles[id]; });

  // Rolling-pool exclusions are not user rejections. They only suppress stale,
  // replaceable unseen candidates from another device; rated, watchlisted and
  // manual titles always survive.
  const rollingBlocksMovie = movie => {
    if (!isReplaceableRollingCandidate(movie)) return false;
    const titleKey=normaliseTitleKey(movie.wikiTitle || movie.pageTitle || movie.title);
    const record=rollingPoolExclusions[movie.id] || Object.values(rollingPoolExclusions).find(item =>
      [item?.title, item?.wikiTitle, item?.pageTitle].some(title => normaliseTitleKey(title) === titleKey)
    );
    return !!record && recordTimestamp(record) >= recordTimestamp(movie);
  };
  Object.keys(movies).forEach(id => { if (rollingBlocksMovie(movies[id])) delete movies[id]; });

  // A title cannot be active and hidden at once. Newer state wins; on an exact
  // timestamp tie, hidden wins so an old active cache cannot resurrect it.
  new Set([...Object.keys(movies), ...Object.keys(hiddenTitles)]).forEach(id => {
    const active=movies[id];
    const hidden=hiddenTitles[id];
    if (!active || !hidden) return;
    const activeTime=recordTimestamp(active);
    const hiddenTime=recordTimestamp(hidden);
    if (hiddenTime >= activeTime) delete movies[id];
    else delete hiddenTitles[id];
  });

  const localSettingsTime=settingsTimestamp(local);
  const remoteSettingsTime=settingsTimestamp(remote);
  const settings={
    ...(remoteSettingsTime > localSettingsTime ? remote.settings : local.settings),
    tagPreferences:{
      ...((remoteSettingsTime > localSettingsTime ? remote.settings : local.settings)?.tagPreferences || {})
    }
  };
  const cursor=mergeDiscoveryCursor(local.discoveryCursor, remote.discoveryCursor).merged;
  const chosenMeta=dataTimestamp(remote) > dataTimestamp(local) ? remote.meta : local.meta;
  const dataset={
    meta:{...chosenMeta, updatedAt:nowStamp()},
    movies,
    settings,
    hiddenTitles,
    wrongPicks,
    deletedMovieRecords,
    rollingPoolExclusions,
    unblockedTitleRecords,
    legacyTagAliases:{...remote.legacyTagAliases, ...local.legacyTagAliases},
    tagStats:{candidates:0, tags:0, rebuiltAt:''},
    tagNormalization:dataTimestamp(remote) > dataTimestamp(local) ? remote.tagNormalization : local.tagNormalization,
    tasteStory:newestTasteStory(local.tasteStory, remote.tasteStory),
    discoveryCursor:cursor
  };
  return {dataset, source:'record-merge'};
}

// Retained for legacy callers. It no longer chooses one whole library by a
// dataset timestamp; it converges records into the canonical Drive dataset.
function mergeRemoteData(remoteRaw={}) {
  const result=mergeCanonicalDatasets(exportCinelensData(), remoteRaw);
  replaceStateFromDataset(result.dataset);
  ensureSyncMetadata({touchDataset:true});
  return {localChanged:true, remoteChanged:true, winner:'merged', source:result.source};
}

function stampCanonicalDriveFile(fileId) {
  if (!fileId) return false;
  if (!state.meta) state.meta={};
  const changed=state.meta.canonicalDriveFileId !== fileId || state.meta.driveSyncModel !== 'canonical-drive-v1';
  state.meta.canonicalDriveFileId=fileId;
  state.meta.driveSyncModel='canonical-drive-v1';
  if (changed) state.meta.updatedAt=nowStamp();
  return changed;
}

function saveLocalState(opts={}) {
  ensureSyncMetadata({touchDataset:!opts.preserveUpdatedAt});
  // localStorage now carries only the tiny bootstrap needed before IndexedDB opens.
  // The title library itself is record-based IndexedDB, so a rating does not rewrite
  // a multi-megabyte JSON string or silently fail on mobile storage limits.
  try {
    localStorage.setItem('cinelens_v2_bootstrap',JSON.stringify({
      schema:'cinelens-local-v3',
      settings:{minYear:state.settings?.minYear,languageFilter:state.settings?.languageFilter,genreFilter:state.settings?.genreFilter,sortMode:state.settings?.sortMode,titleSearch:state.settings?.titleSearch,topN:state.settings?.topN},
      drive:{enabled:state.drive.enabled,folderId:state.drive.folderId,fileId:state.drive.fileId,manifestFileId:state.drive.manifestFileId||'',lastConnectedAt:state.drive.lastConnectedAt},
      updatedAt:state.meta?.updatedAt || nowStamp()
    }));
  } catch(e) { console.warn('Local bootstrap save failed',e); }
  queueIndexedDbSave(450, opts.changedMovieIds);
  updateStats();
}
function loadLocalState() {
  try {
    // First run after this migration may still have a legacy full localStorage
    // snapshot. Once IndexedDB has persisted it, startup reads only the tiny
    // bootstrap and does not parse the old multi-megabyte JSON again.
    const raw=localStorage.getItem('cinelens_v2_bootstrap') || localStorage.getItem('cinelens_v2');
    if (raw) {
      const s=JSON.parse(raw);
      if (s.movies) state.movies=s.movies;
      if (s.settings) state.settings={...state.settings,...s.settings};
      state.settings.tagPreferences = state.settings.tagPreferences || {};
      if (s.hiddenTitles) state.hiddenTitles=s.hiddenTitles;
      if (s.wrongPicks) state.wrongPicks=s.wrongPicks;
      if (s.deletedMovieRecords) state.deletedMovieRecords=s.deletedMovieRecords;
      if (s.unblockedTitleRecords) state.unblockedTitleRecords=s.unblockedTitleRecords;
      if (s.tagAliases || s.legacyTagAliases) state.legacyTagAliases=s.tagAliases || s.legacyTagAliases;
      if (s.tagStats) state.tagStats=s.tagStats;
      else if (s.canonicalTagStats) state.tagStats={candidates:s.canonicalTagStats.raw||0,tags:s.canonicalTagStats.canonical||0,rebuiltAt:s.canonicalTagStats.rebuiltAt||''};
      if (s.tagNormalization) state.tagNormalization=s.tagNormalization;
      if (s.tasteStory) state.tasteStory=normaliseTasteStory(s.tasteStory);
      delete state.canonicalTagStats;
      if (s.meta) state.meta={...state.meta,...s.meta};
      if (s.discoveryCursor) state.discoveryCursor=normaliseDiscoveryCursor(s.discoveryCursor);
      ensureDiscoveryCursor();
      if (s.drive) {
        state.drive.connected=false;
        state.drive.enabled=!!s.drive.enabled || !!s.drive.fileId || !!s.drive.manifestFileId;
        state.drive.folderId=s.drive.folderId||'';
        state.drive.fileId=s.drive.canonicalFileId||s.drive.fileId||'';
        state.drive.lastConnectedAt=s.drive.lastConnectedAt||0;
      }
      state.drive.accessToken=getStoredDriveToken()||'';
      document.getElementById('minYear').value=state.settings.minYear;
      document.getElementById('languageFilter').value=state.settings.languageFilter||'all';
      const genreFilter=document.getElementById('genreFilter');
      if (genreFilter) genreFilter.value=state.settings.genreFilter||'all';
      const sortMode=document.getElementById('sortMode');
      if (sortMode) sortMode.value=state.settings.sortMode||'recommended';
      const titleSearch=document.getElementById('titleSearch');
      if (titleSearch) titleSearch.value=state.settings.titleSearch||'';

      Object.values(state.movies || {}).forEach(normaliseStoredTitleRecord);
      Object.values(state.hiddenTitles || {}).forEach(normaliseStoredTitleRecord);
    }
  } catch(e) {}
  ensureDiscoveryCursor();
  Object.values(state.movies).forEach(normaliseStoredTitleRecord);
  if (collapseDuplicateMovies(state.movies)) saveLocalState({preserveUpdatedAt:true});
}

// ─────────────────────────────────────────────
// GOOGLE DRIVE
// ─────────────────────────────────────────────
const DRIVE_FILE='cinelens_data.json'; // legacy monolithic backup; never deleted by v2 migration
const DRIVE_MANIFEST_FILE='cinelens_manifest_v2.json';
const DRIVE_PROFILE_FILE='cinelens_profile_v2.json';
const DRIVE_CHUNK_PREFIX='cinelens_catalog_v2_';
const DRIVE_SYNC_MODEL_V2='chunked-drive-v2';
const DRIVE_CHUNK_SPAN_YEARS=5;
const GOOGLE_CLIENT_ID='984899607223-h5oadg1cfb7o7ksfb4400vhidknk9soc.apps.googleusercontent.com';
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
let driveTokenClient=null;
let driveRestoreInProgress=false;
let gisScriptLoading=false;
let driveSyncInProgress=false;
let driveSyncQueued=false;
let driveSyncTimer=null;
let driveSyncDeferred=false;
let driveSyncDeferredSince=0;
const DRIVE_SYNC_DEBOUNCE_MS=1200;
const DRIVE_SYNC_MAX_DEFER_MS=10000;
const DRIVE_TOKEN_KEY='cinelens_drive_token_v1';
const DRIVE_TOKEN_EXPIRY_KEY='cinelens_drive_token_expiry_v1';
const DRIVE_SILENT_TOKEN_TIMEOUT_MS=8000;


function rememberDriveToken(token, expiresInSeconds=3300) {
  if (!token) return;
  const expiry=Date.now()+Math.max(60, Number(expiresInSeconds)||3300)*1000;
  try {
    sessionStorage.setItem('cinelens_drive_token', token);
    sessionStorage.setItem('cinelens_drive_token_expiry', String(expiry));
    localStorage.setItem(DRIVE_TOKEN_KEY, token);
    localStorage.setItem(DRIVE_TOKEN_EXPIRY_KEY, String(expiry));
  } catch(e) {}
  scheduleDriveTokenRefresh(expiry);
}

function scheduleDriveTokenRefresh(expiry=0) {
  clearTimeout(driveTokenRefreshTimer);
  if (!expiry) return;
  const delay = Math.max(60000, Number(expiry) - Date.now() - DRIVE_TOKEN_REFRESH_LEEWAY_MS);
  driveTokenRefreshTimer = setTimeout(async () => {
    if (!state.drive.enabled && !state.drive.connected) return;
    try {
      state.drive.accessToken = '';
      await requestDriveTokenSilent({allowPromptlessRequest:true});
      state.drive.connected = true;
      setDriveStatus('connected');
    } catch(e) {
      state.drive.connected = false;
      setDriveStatus('');
    }
  }, delay);
}

function getStoredDriveToken() {
  try {
    const sessionToken=sessionStorage.getItem('cinelens_drive_token')||'';
    const sessionExpiry=parseInt(sessionStorage.getItem('cinelens_drive_token_expiry')||'0',10);
    if (sessionToken && sessionExpiry>Date.now()+30000) return sessionToken;
    const localToken=localStorage.getItem(DRIVE_TOKEN_KEY)||'';
    const localExpiry=parseInt(localStorage.getItem(DRIVE_TOKEN_EXPIRY_KEY)||'0',10);
    if (localToken && localExpiry>Date.now()+30000) {
      sessionStorage.setItem('cinelens_drive_token', localToken);
      sessionStorage.setItem('cinelens_drive_token_expiry', String(localExpiry));
      scheduleDriveTokenRefresh(localExpiry);
      return localToken;
    }
  } catch(e) {}
  return '';
}
function clearStoredDriveToken() {
  try {
    sessionStorage.removeItem('cinelens_drive_token');
    sessionStorage.removeItem('cinelens_drive_token_expiry');
    localStorage.removeItem(DRIVE_TOKEN_KEY);
    localStorage.removeItem(DRIVE_TOKEN_EXPIRY_KEY);
  } catch(e) {}
}

function openDriveModal() { connectDrive(); }
function skipDrive() { showToast('Using local storage',''); }

function googleIdentityReady() {
  return !!window.google?.accounts?.oauth2;
}

function loadGoogleIdentityScript() {
  if (googleIdentityReady()) return Promise.resolve();
  if (gisScriptLoading) return new Promise((resolve,reject) => {
    let tries=0;
    const timer=setInterval(() => {
      tries++;
      if (googleIdentityReady()) { clearInterval(timer); resolve(); }
      if (tries > 60) { clearInterval(timer); reject(new Error('Google Identity Services unavailable')); }
    },100);
  });
  gisScriptLoading=true;
  return new Promise((resolve,reject) => {
    const existing=[...document.scripts].find(sc => (sc.src||'').includes('accounts.google.com/gsi/client'));
    if (existing) {
      existing.addEventListener('load', () => resolve(), {once:true});
      existing.addEventListener('error', () => reject(new Error('Google Identity Services blocked')), {once:true});
      setTimeout(() => googleIdentityReady() ? resolve() : reject(new Error('Google Identity Services unavailable')), 6000);
      return;
    }
    const sc=document.createElement('script');
    sc.src='https://accounts.google.com/gsi/client';
    sc.async=true;
    sc.defer=true;
    sc.onload=() => resolve();
    sc.onerror=() => reject(new Error('Google Identity Services blocked'));
    document.head.appendChild(sc);
  }).finally(() => { gisScriptLoading=false; });
}

function initDriveTokenClient() {
  if (driveTokenClient) return driveTokenClient;
  if (!googleIdentityReady()) throw new Error('Google sign-in script not loaded yet');
  driveTokenClient=google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: () => {},
    error_callback: err => console.error('Drive token error', err)
  });
  return driveTokenClient;
}

window.addEventListener('load', () => {
  loadGoogleIdentityScript().then(() => {
    try { initDriveTokenClient(); } catch(e) {}
  }).catch(e => console.warn(e));
});

async function connectDrive() {
  if (!GOOGLE_CLIENT_ID) { showToast('Missing Google client ID','error'); return; }
  let connected = false;
  setDriveStatus('syncing');
  try {
    if (!googleIdentityReady()) await waitForGoogleIdentity();
    await requestDriveTokenInteractive({forcePrompt:true});
    state.drive.enabled=true;
    const manifest=await findDriveManifest();
    if (manifest) {
      state.drive.manifestFileId=manifest.id;
      await loadFromChunkedDrive(await readDriveJson(manifest.id),{preferDrive: !startupFinalized || !libraryWritesUnlocked});
    } else {
      // Legacy data is read once only so it can be split into v2 chunks. The old
      // monolithic file remains untouched as a recovery backup.
      const fileId=await findDriveFile();
      if (fileId) {
        state.drive.fileId=fileId;
        await loadFromDrive({preferDrive: !startupFinalized || !libraryWritesUnlocked});
      }
      await syncChunkedDrive(false);
    }
    state.drive.connected=true;
    connected = true;
    state.drive.lastConnectedAt=Date.now();
    saveLocalState({preserveUpdatedAt:true});
    setDriveStatus('connected');
    if (!startupFinalized || !libraryWritesUnlocked) {
      startupFinalized = false;
      finalizeStartupAfterDrive({allowCollection:true});
    } else {
      render();
    }
    showToast('Drive connected','success');
  } catch(e) {
    console.error('Drive sign-in failed', e);
    state.drive.connected=false;
    setDriveStatus('');
    showToast(driveErrorMessage(e),'error');
  } finally {
    if (!connected) setDriveStatus('');
  }
}

async function restoreDriveSession(showFailure=false, opts={}) {
  if (driveRestoreInProgress) return false;
  if (!state.drive.enabled || (!state.drive.fileId && !state.drive.manifestFileId && !state.drive.accessToken)) return false;
  driveRestoreInProgress=true;
  setDriveStatus('syncing');
  try {
    await requestDriveTokenSilent();
    // V2 checks a tiny manifest first. It never downloads the catalogue merely
    // to discover whether another device changed anything.
    const manifest=await findDriveManifest();
    if (manifest) {
      state.drive.manifestFileId=manifest.id;
      const data=await readDriveJson(manifest.id);
      await loadFromChunkedDrive(data,{preferDrive:!!opts.preferDrive});
    } else {
      // One legacy full-file read is retained only for migration/recovery.
      state.drive.fileId=await findDriveFile();
      if (state.drive.fileId) {
        await loadFromDrive({preferDrive: !!opts.preferDrive});
        // One-time migration happens immediately while the canonical legacy data
        // is already in memory. Subsequent opens use the manifest path only.
        await syncChunkedDrive(false);
      }
    }
    state.drive.connected=true;
    state.drive.lastConnectedAt=Date.now();
    saveLocalState({preserveUpdatedAt:true});
    setDriveStatus('connected');
    return true;
  } catch(e) {
    state.drive.connected=false;
    state.drive.accessToken='';
    setDriveStatus('');
    if (showFailure) showToast(driveErrorMessage(e),'error');
  } finally {
    driveRestoreInProgress=false;
  }
  return false;
}

function setDriveStatus(s) {
  const dot = document.getElementById('driveDot');
  const label = document.getElementById('driveLabel');
  if (dot) dot.className = 'drive-dot ' + s;
  if (label) label.textContent = s === 'connected'
    ? 'drive connected'
    : s === 'syncing'
      ? 'syncing...'
      : state.drive.enabled ? 'drive ready' : 'not connected';
}
function driveErrorMessage(e) {
  const code = e?.error || e?.message || 'unknown';
  if (String(code).includes('Google sign-in script not loaded')) return 'Google sign-in loading. Tap Drive again.';
  if (String(code).includes('unavailable')) return 'Google sign-in script unavailable';
  if (String(code).includes('blocked')) return 'Google sign-in blocked by browser settings';
  if (String(code).includes('popup')) return 'Allow popups for Drive sign-in';
  if (code === 'access_denied') return 'Drive access was denied';
  if (code === 'idpiframe_initialization_failed') return 'Google sign-in blocked by browser settings';
  if (code === 'interaction_required') return 'Tap Drive to reconnect';
  if (code === 'popup_failed_to_open') return 'Allow popups for Drive sign-in';
  if (code === 'redirect_uri_mismatch' || code === 'origin_mismatch') return 'Google OAuth origin is not allowed for this site';
  return `Drive sign-in failed: ${code}`;
}
async function waitForGoogleIdentity() {
  if (googleIdentityReady()) return;
  await loadGoogleIdentityScript();
  for (let i=0; i<20; i++) {
    if (googleIdentityReady()) return;
    await sleep(100);
  }
  throw new Error('Google Identity Services unavailable');
}
function tokenRequest(prompt, opts={}) {
  initDriveTokenClient();
  const timeoutMs = Number(opts.timeoutMs || 0);
  return new Promise((resolve,reject) => {
    let settled = false;
    let timer = null;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      fn(value);
    };
    if (timeoutMs > 0) {
      timer = setTimeout(() => finish(reject, new Error('Drive silent sign-in timed out')), timeoutMs);
    }
    driveTokenClient.callback = resp => {
      if (resp.error) { finish(reject, resp); return; }
      state.drive.accessToken=resp.access_token;
      rememberDriveToken(resp.access_token, resp.expires_in || 3300);
      finish(resolve, resp.access_token);
    };
    try { driveTokenClient.requestAccessToken({prompt}); }
    catch(e) { finish(reject, e); }
  });
}
async function requestDriveTokenInteractive(opts={}) {
  const stored=opts.forcePrompt ? '' : getStoredDriveToken();
  if (stored) { state.drive.accessToken=stored; return stored; }
  await waitForGoogleIdentity();
  return tokenRequest('');
}
async function requestDriveTokenSilent(opts={}) {
  if (state.drive.accessToken) return state.drive.accessToken;
  const stored=getStoredDriveToken();
  if (stored) { state.drive.accessToken=stored; return stored; }
  if (!opts.allowPromptlessRequest) throw {error:'interaction_required'};
  await waitForGoogleIdentity();
  return tokenRequest('none', {timeoutMs:DRIVE_SILENT_TOKEN_TIMEOUT_MS});
}
async function requestDriveToken(prompt='select_account') {
  return prompt === 'none' ? requestDriveTokenSilent() : requestDriveTokenInteractive();
}
function clearDriveToken() {
  state.drive.accessToken='';
  clearStoredDriveToken();
}
function driveHeaders(extra={}) { return {...extra, Authorization:`Bearer ${state.drive.accessToken}`}; }
async function driveFetch(url, opts={}) {
  if (!state.drive.accessToken) await requestDriveTokenSilent();
  let resp=await fetch(url,{...opts,headers:driveHeaders(opts.headers||{})});
  if (resp.status===401) {
    clearDriveToken();
    await requestDriveTokenSilent();
    resp=await fetch(url,{...opts,headers:driveHeaders(opts.headers||{})});
  }
  return resp;
}
function driveChunkKey(movie) {
  const year=Number(movie?.year);
  const start=Number.isFinite(year) && year >= 1900 ? Math.floor(year / DRIVE_CHUNK_SPAN_YEARS) * DRIVE_CHUNK_SPAN_YEARS : 'unknown';
  const range=typeof start === 'number' ? `${start}-${start + DRIVE_CHUNK_SPAN_YEARS - 1}` : 'unknown';
  const language=String(movie?.language || 'Unknown').replace(/[^A-Za-z0-9]+/g,'_');
  const format=movie?.format ? 'show' : 'movie';
  return `${range}_${language}_${format}`;
}

function driveHash(value) {
  const text=typeof value === 'string' ? value : JSON.stringify(value);
  let hash=2166136261;
  for (let i=0;i<text.length;i++) { hash^=text.charCodeAt(i); hash=Math.imul(hash,16777619); }
  return `${(hash>>>0).toString(36)}-${text.length}`;
}

function catalogueMovieForDrive(movie) {
  const copy={...movie};
  // Personal state syncs in profile. It must not cause a catalogue-chunk upload.
  delete copy.rating;
  delete copy.ratedAt;
  delete copy.watchlist;
  delete copy.manualAdded;
  delete copy.hiddenAt;
  delete copy._updatedAt;
  return copy;
}

function personalMovieState(movie) {
  const ratedAt = movie?.ratedAt || (Number(movie?.rating || 0) > 0 ? legacyRatingTimestamp(movie) : '');
  return {
    rating:Number(movie?.rating || 0),
    ratedAt,
    watchlist:!!movie?.watchlist,
    manualAdded:!!movie?.manualAdded,
    // Catalogue chunks intentionally omit _updatedAt. Never manufacture a
    // fresh timestamp for that blank personal overlay: doing so can beat a
    // real Drive rating during restore and reset it to zero.
    updatedAt:ratedAt || ''
  };
}

function personalOverlayRatedAt(personal={}) {
  if (personal.ratedAt) return personal.ratedAt;
  return Number(personal.rating || 0) > 0 ? String(personal.updatedAt || '') : '';
}

function buildDriveChunks() {
  const chunks={};
  Object.values(state.movies || {}).forEach(movie => {
    const key=driveChunkKey(movie);
    if (!chunks[key]) chunks[key]={};
    chunks[key][String(movie.id)]=catalogueMovieForDrive(movie);
  });
  return chunks;
}

function exportDriveProfile() {
  const personalTitles={};
  Object.values(state.movies || {}).forEach(movie => { personalTitles[String(movie.id)]=personalMovieState(movie); });
  const profileMeta={...(state.meta || {}), driveSyncModel:DRIVE_SYNC_MODEL_V2};
  delete profileMeta.driveChunkHashes;
  delete profileMeta.driveProfileHash;
  delete profileMeta.driveManifestFileId;
  return {
    schema:DRIVE_SYNC_MODEL_V2,
    updatedAt:profileMeta.updatedAt || nowStamp(),
    meta:profileMeta,
    settings:state.settings,
    personalTitles,
    hiddenTitles:state.hiddenTitles,
    wrongPicks:state.wrongPicks,
    deletedMovieRecords:state.deletedMovieRecords,
    rollingPoolExclusions:state.rollingPoolExclusions,
    unblockedTitleRecords:state.unblockedTitleRecords,
    legacyTagAliases:state.legacyTagAliases,
    tagStats:state.tagStats,
    tagNormalization:state.tagNormalization,
    tasteStory:state.tasteStory,
    discoveryCursor:state.discoveryCursor
  };
}

function applyDriveProfile(profile,{merge=true,preferDrive=false}={}) {
  if (!profile || !profile.personalTitles || typeof profile.personalTitles !== 'object') {
    throw new Error('Drive profile is missing personal title data');
  }
  const chosenSettings=settingsTimestamp(profile) >= settingsTimestamp({settings:state.settings,meta:state.meta}) ? profile.settings : state.settings;
  state.settings={...state.settings,...(chosenSettings || {})};
  state.hiddenTitles=merge ? mergeRecordMap(state.hiddenTitles,profile.hiddenTitles || {}) : (profile.hiddenTitles || {});
  state.wrongPicks=merge ? mergeRecordMap(state.wrongPicks,profile.wrongPicks || {}) : (profile.wrongPicks || {});
  state.deletedMovieRecords=merge ? mergeRecordMap(state.deletedMovieRecords,profile.deletedMovieRecords || {}) : (profile.deletedMovieRecords || {});
  state.rollingPoolExclusions=merge ? mergeRecordMap(state.rollingPoolExclusions,profile.rollingPoolExclusions || {}) : (profile.rollingPoolExclusions || {});
  state.unblockedTitleRecords=merge ? mergeRecordMap(state.unblockedTitleRecords,profile.unblockedTitleRecords || {}) : (profile.unblockedTitleRecords || {});
  state.legacyTagAliases={...(profile.legacyTagAliases || {}),...(state.legacyTagAliases || {})};
  state.tagStats=profile.tagStats || state.tagStats;
  state.tagNormalization=profile.tagNormalization || state.tagNormalization;
  state.tasteStory=newestTasteStory(state.tasteStory,profile.tasteStory || {});
  state.discoveryCursor=mergeDiscoveryCursor(state.discoveryCursor,profile.discoveryCursor || {}).merged;
  Object.entries(profile.personalTitles || {}).forEach(([id,remotePersonal]) => {
    const movie=state.movies?.[id];
    if (!movie) return;
    const localPersonal=personalMovieState(movie);
    const remoteStamp=Date.parse(personalOverlayRatedAt(remotePersonal) || '') || 0;
    const localStamp=Date.parse(personalOverlayRatedAt(localPersonal) || '') || 0;
    const remoteHasRating=Number(remotePersonal.rating || 0) > 0;
    const localHasRating=Number(localPersonal.rating || 0) > 0;
    // During startup restore, Drive is the canonical personal profile. On
    // later background convergence, retain the newer genuine personal edit.
    let chosen = localPersonal;
    if (preferDrive && (remoteStamp || !localHasRating)) chosen = remotePersonal;
    else if (remoteStamp > localStamp) chosen = remotePersonal;
    else if (!localHasRating && remoteHasRating && remoteStamp === localStamp) chosen = remotePersonal;
    movie.rating=Number(chosen.rating || 0);
    movie.ratedAt=personalOverlayRatedAt(chosen);
    movie.watchlist=!!chosen.watchlist;
    movie.manualAdded=!!chosen.manualAdded;
  });
  if (profile.meta) state.meta={...state.meta,...profile.meta};
  invalidateTagCaches();
}

async function driveListByName(name) {
  const q=`name='${name.replace(/'/g,"\\'")}' and trashed=false`;
  const response=await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&spaces=drive&orderBy=modifiedTime%20desc&pageSize=20&fields=files(id,name,modifiedTime,description)`);
  if (!response.ok) throw new Error(`Drive file search failed (${response.status})`);
  return (await response.json()).files || [];
}

async function readDriveJson(fileId) {
  const response=await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
  if (!response.ok) throw new Error(`Drive JSON read failed (${response.status})`);
  return response.json();
}

async function uploadDriveJson(fileId,data) {
  const response=await driveFetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  if (!response.ok) throw new Error(`Drive JSON upload failed (${response.status})`);
  return response.json().catch(()=>({id:fileId}));
}

async function createDriveJson(name,data) {
  const form=new FormData();
  form.append('metadata',new Blob([JSON.stringify({name,mimeType:'application/json'})],{type:'application/json'}));
  form.append('file',new Blob([JSON.stringify(data)],{type:'application/json'}));
  const response=await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime',{method:'POST',body:form});
  if (!response.ok) throw new Error(`Drive JSON create failed (${response.status})`);
  return response.json();
}

async function findDriveManifest() {
  const files=await driveListByName(DRIVE_MANIFEST_FILE);
  return files[0] || null;
}

async function readChunkedDriveState(manifest) {
  const profile=await readDriveJson(manifest.profile.id);
  const chunkEntries=Object.entries(manifest.chunks || {});
  const chunks=await Promise.all(chunkEntries.map(async ([key,info]) => [key,await readDriveJson(info.id)]));
  const movies={};
  chunks.forEach(([,chunk]) => Object.assign(movies,chunk.movies || chunk));
  return {profile,movies};
}

async function migrateLegacyDriveToChunked() {
  const chunks=buildDriveChunks();
  const manifest={schema:DRIVE_SYNC_MODEL_V2,version:2,updatedAt:nowStamp(),profile:null,chunks:{},legacyBackupFileId:state.drive.fileId || ''};
  const profile=exportDriveProfile();
  const profileFile=await createDriveJson(DRIVE_PROFILE_FILE,profile);
  manifest.profile={id:profileFile.id,hash:driveHash(profile),updatedAt:profile.updatedAt};
  for (const [key,movies] of Object.entries(chunks)) {
    const payload={schema:DRIVE_SYNC_MODEL_V2,chunk:key,movies};
    const file=await createDriveJson(`${DRIVE_CHUNK_PREFIX}${key}.json`,payload);
    manifest.chunks[key]={id:file.id,hash:driveHash(payload),updatedAt:nowStamp(),count:Object.keys(movies).length};
  }
  const manifestFile=await createDriveJson(DRIVE_MANIFEST_FILE,manifest);
  state.drive.manifestFileId=manifestFile.id;
  state.meta=state.meta || {};
  state.meta.driveSyncModel=DRIVE_SYNC_MODEL_V2;
  state.meta.driveManifestFileId=manifestFile.id;
  state.meta.driveChunkHashes=Object.fromEntries(Object.entries(manifest.chunks).map(([key,info])=>[key,info.hash]));
  state.meta.driveProfileHash=manifest.profile.hash;
  return manifest;
}

async function loadFromChunkedDrive(manifest,{preferDrive=false}={}) {
  const localHashes=state.meta?.driveChunkHashes || {};
  const localProfileHash=state.meta?.driveProfileHash || '';
  const remoteChunks=manifest.chunks || {};
  const needsFullLoad=!Object.keys(state.movies || {}).length;
  const changedKeys=Object.keys(remoteChunks).filter(key => needsFullLoad || localHashes[key] !== remoteChunks[key].hash);
  const profileChanged=needsFullLoad || localProfileHash !== manifest.profile?.hash;
  // The profile is intentionally small. On a Drive-authoritative startup,
  // always read it even when a stale local hash claims it is current.
  const mustReadProfile=!!preferDrive || profileChanged;
  if (!manifest.profile?.id) throw new Error('Drive manifest has no profile');
  const incomingProfile=mustReadProfile ? await readDriveJson(manifest.profile.id) : null;
  for (const key of changedKeys) {
    const info=remoteChunks[key];
    const payload=await readDriveJson(info.id);
    const incoming=payload.movies || payload || {};
    // A stable chunk is authoritative only for that segment. Replace records in
    // that segment, then apply personal overlays after all required chunks exist.
    Object.keys(state.movies || {}).forEach(id => { if (driveChunkKey(state.movies[id]) === key) delete state.movies[id]; });
    Object.assign(state.movies,incoming);
  }
  if (incomingProfile) applyDriveProfile(incomingProfile,{merge:!preferDrive,preferDrive:!!preferDrive});
  else if (preferDrive) throw new Error('Drive profile did not load');
  state.drive.manifestFileId=state.drive.manifestFileId || state.meta?.driveManifestFileId || '';
  state.meta=state.meta || {};
  state.meta.driveSyncModel=DRIVE_SYNC_MODEL_V2;
  state.meta.driveChunkHashes=Object.fromEntries(Object.entries(remoteChunks).map(([key,info])=>[key,info.hash]));
  state.meta.driveProfileHash=manifest.profile?.hash || '';
  state.meta.driveProfileReadyAt=nowStamp();
  state.meta.driveManifestFileId=state.drive.manifestFileId || state.meta.driveManifestFileId || '';
  Object.values(state.movies || {}).forEach(normaliseStoredTitleRecord);
  invalidateTagCaches();
  rebuildTagBrain();
  computeTagWeights();
  saveLocalState({preserveUpdatedAt:true});
  render();
  return {changedKeys,profileChanged};
}

async function syncChunkedDrive(manual=false) {
  let manifestFile=state.drive.manifestFileId ? {id:state.drive.manifestFileId} : await findDriveManifest();
  if (!manifestFile) {
    await migrateLegacyDriveToChunked();
    return;
  }
  state.drive.manifestFileId=manifestFile.id;
  let manifest=await readDriveJson(manifestFile.id);
  if (manifest.schema !== DRIVE_SYNC_MODEL_V2) throw new Error('Unsupported CineLens Drive manifest');
  const chunks=buildDriveChunks();
  const cachedHashes=state.meta?.driveChunkHashes || {};
  const remoteChunks=manifest.chunks || {};
  const nextChunks={...remoteChunks};

  for (const key of new Set([...Object.keys(chunks),...Object.keys(remoteChunks)])) {
    const localPayload={schema:DRIVE_SYNC_MODEL_V2,chunk:key,movies:chunks[key] || {}};
    const localHash=driveHash(localPayload);
    const remote=remoteChunks[key];
    const cached=cachedHashes[key] || '';
    const localChanged=localHash !== cached;
    const remoteChanged=!!remote && remote.hash !== cached;
    if (!remote) {
      const file=await createDriveJson(`${DRIVE_CHUNK_PREFIX}${key}.json`,localPayload);
      nextChunks[key]={id:file.id,hash:localHash,updatedAt:nowStamp(),count:Object.keys(localPayload.movies).length};
      continue;
    }
    if (!localChanged && remoteChanged) {
      const payload=await readDriveJson(remote.id);
      Object.keys(state.movies || {}).forEach(id => { if (driveChunkKey(state.movies[id]) === key) delete state.movies[id]; });
      Object.assign(state.movies,payload.movies || {});
      nextChunks[key]=remote;
      continue;
    }
    if (localChanged && remoteChanged && localHash !== remote.hash) {
      const remotePayload=await readDriveJson(remote.id);
      const merged=mergeRecordMap(localPayload.movies,remotePayload.movies || {});
      const mergedPayload={schema:DRIVE_SYNC_MODEL_V2,chunk:key,movies:merged};
      const mergedHash=driveHash(mergedPayload);
      if (mergedHash !== remote.hash) await uploadDriveJson(remote.id,mergedPayload);
      Object.keys(state.movies || {}).forEach(id => { if (driveChunkKey(state.movies[id]) === key) delete state.movies[id]; });
      Object.assign(state.movies,merged);
      nextChunks[key]={...remote,hash:mergedHash,updatedAt:nowStamp(),count:Object.keys(merged).length};
      continue;
    }
    if (localChanged && localHash !== remote.hash) {
      await uploadDriveJson(remote.id,localPayload);
      nextChunks[key]={...remote,hash:localHash,updatedAt:nowStamp(),count:Object.keys(localPayload.movies).length};
    }
  }

  const localProfile=exportDriveProfile();
  const localProfileHash=driveHash(localProfile);
  const cachedProfileHash=state.meta?.driveProfileHash || '';
  const remoteProfile=manifest.profile;
  if (!remoteProfile) {
    const file=await createDriveJson(DRIVE_PROFILE_FILE,localProfile);
    manifest.profile={id:file.id,hash:localProfileHash,updatedAt:nowStamp()};
  } else {
    const localChanged=localProfileHash !== cachedProfileHash;
    const remoteChanged=remoteProfile.hash !== cachedProfileHash;
    if (!localChanged && remoteChanged) {
      applyDriveProfile(await readDriveJson(remoteProfile.id),{merge:true});
    } else if (localChanged && remoteChanged && localProfileHash !== remoteProfile.hash) {
      const remote=await readDriveJson(remoteProfile.id);
      applyDriveProfile(remote,{merge:true});
      const merged=exportDriveProfile();
      const mergedHash=driveHash(merged);
      await uploadDriveJson(remoteProfile.id,merged);
      manifest.profile={...remoteProfile,hash:mergedHash,updatedAt:nowStamp()};
    } else if (localChanged && localProfileHash !== remoteProfile.hash) {
      await uploadDriveJson(remoteProfile.id,localProfile);
      manifest.profile={...remoteProfile,hash:localProfileHash,updatedAt:nowStamp()};
    }
  }
  manifest.schema=DRIVE_SYNC_MODEL_V2;
  manifest.version=2;
  manifest.updatedAt=nowStamp();
  manifest.chunks=nextChunks;
  await uploadDriveJson(manifestFile.id,manifest);
  state.meta=state.meta || {};
  state.meta.driveSyncModel=DRIVE_SYNC_MODEL_V2;
  state.meta.driveManifestFileId=manifestFile.id;
  state.meta.driveChunkHashes=Object.fromEntries(Object.entries(nextChunks).map(([key,info])=>[key,info.hash]));
  state.meta.driveProfileHash=manifest.profile?.hash || driveHash(exportDriveProfile());
  rebuildTagBrain();
  computeTagWeights();
  saveLocalState({preserveUpdatedAt:true});
  if (manual) showToast('Drive synchronized.', 'success');
}

async function readDriveDataset(fileId) {
  const response=await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
  if (!response.ok) throw new Error(`Drive library read failed (${response.status})`);
  return normaliseIncomingData(await response.json());
}

async function findDriveFile() {
  try {
    const q=`name='${DRIVE_FILE}' and trashed=false`;
    const response=await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&spaces=drive&orderBy=modifiedTime%20desc&pageSize=100&fields=files(id,name,modifiedTime)`);
    if (!response.ok) throw new Error('Drive file search failed');
    const listing=await response.json();
    const files=listing.files || [];
    if (!files.length) return null;

    const candidates=[];
    for (const file of files) {
      try {
        const dataset=await readDriveDataset(file.id);
        candidates.push({
          id:file.id,
          dataset,
          recordCount:libraryRecordCount(dataset),
          marker:String(dataset?.meta?.canonicalDriveFileId || ''),
          model:String(dataset?.meta?.driveSyncModel || ''),
          modifiedStamp:Date.parse(file.modifiedTime || '') || 0
        });
      } catch(error) {
        console.warn('Skipping unreadable CineLens Drive file', file.id, error);
      }
    }
    if (!candidates.length) return null;

    // Once migration has marked a canonical file, every device follows that
    // embedded identity. A stale browser fileId and a newer duplicate cannot
    // redirect the app to another library.
    const marked=candidates.filter(candidate => candidate.marker === candidate.id && candidate.model === 'canonical-drive-v1');
    if (marked.length) {
      marked.sort((a,b)=>b.modifiedStamp-a.modifiedStamp || b.recordCount-a.recordCount);
      return marked[0].id;
    }

    // One-time migration only: existing same-name files predate a canonical ID.
    // Select the fullest recoverable library, then loadFromDrive stamps it so
    // future runs never use this fallback again.
    candidates.sort((a,b)=>b.recordCount-a.recordCount || b.modifiedStamp-a.modifiedStamp);
    return candidates[0].id;
  } catch(error) {
    console.warn('Drive file search failed', error);
    return null;
  }
}

async function loadFromDrive(opts={}) {
  if (!state.drive.fileId) return false;
  try {
    setDriveStatus('syncing');
    const remote=await readDriveDataset(state.drive.fileId);
    // Drive is the canonical library at restore time. Local storage is a cache,
    // never a competing whole-library source when opening another device.
    replaceStateFromDataset(remote);
    const marked=stampCanonicalDriveFile(state.drive.fileId);
    const migratedAliases=migrateLegacyTagAliases();
    migrateLegacyPoolItems();
    const removedHindiShows = purgeDisallowedHindiShows();
    const removedConventionalHorror = purgeDisallowedConventionalHorror();
    const addedAtMigrated = ensureAddedAtMetadata();
    const retiredWatchlist = retireWatchlistForRecentlyAdded();
    const cleaned=cleanContaminatedTags(true);
    rebuildTagBrain();
    computeTagWeights();
    saveLocalState({preserveUpdatedAt:true});
    render();
    state.drive.connected=true;
    setDriveStatus('connected');
    if (marked || cleaned || migratedAliases.rewrites || removedHindiShows || removedConventionalHorror || addedAtMigrated || retiredWatchlist) await uploadDriveData();
    scheduleTagCloudNormalization(1600);
    return true;
  } catch(error) {
    state.drive.connected=false;
    setDriveStatus('');
    throw error;
  }
}

async function uploadDriveData() {
  const resp=await driveFetch(`https://www.googleapis.com/upload/drive/v3/files/${state.drive.fileId}?uploadType=media`,{
    method:'PATCH',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(exportCinelensData())
  });
  if (!resp.ok) throw new Error('Drive sync failed');
}

async function createDriveFile() {
  if(!state.drive.accessToken)return;
  try {
    const meta={name:DRIVE_FILE,mimeType:'application/json'};
    const form=new FormData();
    form.append('metadata',new Blob([JSON.stringify(meta)],{type:'application/json'}));
    form.append('file',new Blob([JSON.stringify(exportCinelensData())],{type:'application/json'}));
    const resp=await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',body:form});
    if (!resp.ok) throw new Error('Drive create failed');
    const d=await resp.json();
    state.drive.fileId=d.id;
    stampCanonicalDriveFile(d.id);
    await uploadDriveData();
    saveLocalState({preserveUpdatedAt:true});
  } catch(e){showToast('Drive file create failed','error');}
}
async function syncDrive(manual=false) {
  if (!manual && syncMustWaitForForegroundWork({respectHardCap:true})) {
    queueDriveSync(1200);
    return;
  }
  if (driveSyncInProgress) {
    driveSyncQueued=true;
    return;
  }
  const finishSync=() => {
    driveSyncInProgress=false;
    driveSyncDeferredSince=0;
    if (driveSyncQueued) {
      driveSyncQueued=false;
      queueDriveSync(350);
    }
  };
  driveSyncInProgress=true;
  try {
    if (!state.drive.connected && !state.drive.accessToken) {
      if (state.drive.enabled) await restoreDriveSession(manual, {preferDrive:true});
      if (!state.drive.connected && !state.drive.accessToken) {
        if (manual) await connectDrive();
        return;
      }
    }

    setDriveStatus('syncing');
    // The first sync after installing v2 performs a one-time split from the
    // legacy file. All later syncs read one tiny manifest and transfer only the
    // profile and catalogue chunks whose hashes changed.
    await syncChunkedDrive(manual);
    state.drive.connected=true;
    state.drive.lastConnectedAt=Date.now();
    saveLocalState({preserveUpdatedAt:true});
    render();
    setDriveStatus('connected');
  } catch(error) {
    console.error('Drive sync failed', error);
    state.drive.connected=false;
    setDriveStatus('');
    if (manual) showToast(driveErrorMessage(error) || 'Drive sync failed', 'error');
  } finally {
    finishSync();
  }
}

// ─────────────────────────────────────────────
// INFINITE RECOMMENDATIONS + GO TO TOP
// ─────────────────────────────────────────────
function recommendationPageActive() {
  return activeTab === 'all' || activeTab === 'movie' || activeTab === 'show';
}

function handleScroll() {
  const btn = document.getElementById('goTopBtn');
  if (btn) btn.classList.toggle('visible', window.scrollY > 520);
  if (!recommendationPageActive()) return;
  if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 700) return;
  const total = similarTitleActive()
    ? similarTitleResults().length
    : titleSearchActive()
      ? Object.values(state.movies || {}).filter(matchesTab).filter(matchesGlobalFilters).length
      : personalizedEnough() ? recommendationCandidates().length : discoveryPool().length;
  if (recVisibleLimit >= total) return;
  recVisibleLimit += REC_INFINITE_PAGE_SIZE;
  renderRecs();
}

function goToTop() {
  window.scrollTo({top:0, behavior:'smooth'});
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
let _tt;
function showToast(msg,type='') { const el=document.getElementById('toast'); el.textContent=msg; el.className='show '+type; clearTimeout(_tt); _tt=setTimeout(()=>el.className='',3000); }
