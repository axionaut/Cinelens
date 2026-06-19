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
  ],
  hindiShows: 'Category:Indian_television_series_debuts_by_year'
};
const AI_TAGGER_URL = 'https://script.google.com/macros/s/AKfycbyN5QBVU3YS2Nmp9-xEduGkOQOAVxkmAzsrzPfQSDX7HfSYxYJvusuZbpLXQk5k-EsWtg/exec';
const AI_TAG_PROMPT_VERSION = 'cinelens-tags-v3';
const AI_TAG_MIN_CONFIDENCE = 0.55;
const AI_TAG_MIN_COUNT = 10;
const AI_TAG_MAX_COUNT = 20;
const AI_TAG_MIGRATION_VERSION = 1;
const AI_TAG_BATCH_SIZE = 20;
const AI_TAG_RETRY_LIMIT = 3;
const AI_VOCABULARY_SAMPLE_SIZE = 240;
const AI_REQUEST_DELAY_MS = 12000;
const WIKI_LIST_SOURCES = {
  showsIndex: 'Lists of television programs',
  englishShows: ['List of television programs: A','List of television programs: B','List of television programs: C','List of British television programmes','List of Netflix original programming','List of Amazon Prime Video original programming'],
  hindiShows: ['List of Indian television series','List of Hindi-language television shows']
};

const WIKI_NAVIGATION_LISTS = {
  englishMovies: ['Lists of English-language films','List of American films of the 2020s','List of British films of 2020','List of films considered the best'],
  hindiMovies: ['Lists of Hindi films','List of Hindi films of 2024','List of Hindi films of 2023','List of Hindi films of 2022','List of Bollywood films of 2021'],
  topicMovies: ['List of films considered the best','List of cult films','List of films based on actual events','List of films based on awards','List of films with a 100% rating on Rotten Tomatoes'],
  englishShows: ['List of Netflix original programming','List of Amazon Prime Video original programming','List of British television programmes'],
  hindiShows: ['List of Hindi-language television shows','List of Indian television series']
};

const COLLECTION_LANES = [
  { key:'englishMovies', label:'English movies', mode:'movies', language:'English', weight:4 },
  { key:'hindiMovies', label:'Hindi movies', mode:'movies', language:'Hindi', weight:3 },
  { key:'englishShows', label:'English shows', mode:'shows', language:'English', weight:2 },
  { key:'hindiShows', label:'Hindi shows', mode:'shows', language:'Hindi', weight:1 }
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
const WIKI_PARSER_VERSION = 3;
const REC_INFINITE_PAGE_SIZE = 20;
const STRONG_REC_TARGET = 10;
const STRONG_REC_MIN_OVERLAP = 3;
const FETCH_AUTO_ATTEMPT_BUDGET = 55;
const FETCH_MANUAL_ATTEMPT_BUDGET = 100;
const FETCH_MAX_ADDED_PER_RUN = 35;
const DRIVE_TOKEN_REFRESH_LEEWAY_MS = 5 * 60 * 1000;
let recVisibleLimit = 10;
let currentWikiAbortController = null;
let currentSleepCancel = null;
let lastAiRequestAt = 0;
let autoFetchPaused = false;
let autoExpandTimer = null;
let startupDriveRestoreDone = false;
let driveTokenRefreshTimer = null;
let settingsSyncTimer = null;
let poolVisibleLimit = 80;
let hiddenVisibleLimit = 80;
let wikiSearchResults = [];
let wikiSearchQuery = '';
const yearCategoryIndexCache = {};
const yearCategoryMembersCache = {};
let state = {
  movies: {},
  tagWeights: {},
  genreWeights: {},
  settings: { topN: 10, minYear: 1970, languageFilter: 'all', genreFilter: 'all', sortMode:'recommended', shuffleSeed:Date.now(), titleSearch:'', controlDeckCollapsed:false, tagDeleteMode:false, tagPreferences:{} },
  drive: { connected: false, accessToken: '', folderId: '', fileId: '', enabled: false, lastConnectedAt: 0 },
  hiddenTitles: {},
  wrongPicks: {},
  deletedMovieRecords: {},
  tagAliases: {},
  tagStats: { candidates:0, tags:0, rebuiltAt:'' },
  discoveryCursor: {},
  meta: { updatedAt:'' },
  poolFetched: false
};

let pendingManualRatingId = '';
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

const GENRE_RULES = [
  ['science-fiction', /\b(science fiction|sci-fi)\b/],
  ['action', /\baction(?:-|\s)(?:film|comedy|drama|thriller|series)\b|\baction film\b/],
  ['adventure', /\badventure(?:-|\s)(?:film|comedy|drama|series)\b|\badventure film\b/],
  ['animation', /\banimat(?:ed|ion)(?:-|\s)(?:film|series|comedy|drama)\b/],
  ['comedy', /\bcomedy(?:-|\s)(?:film|drama|series|thriller)\b|\bromantic comedy\b/],
  ['crime', /\bcrime(?:-|\s)(?:film|drama|series|thriller|comedy)\b/],
  ['documentary', /\bdocumentary(?:-|\s)(?:film|series)\b/],
  ['drama', /\bdrama(?:-|\s)(?:film|series)\b|\b(?:film|television) drama\b/],
  ['family', /\bfamily(?:-|\s)(?:film|drama|series|comedy)\b/],
  ['fantasy', /\bfantasy(?:-|\s)(?:film|drama|series|comedy)\b/],
  ['historical', /\bhistorical(?:-|\s)(?:film|drama|series|fiction)\b/],
  ['horror', /\bhorror(?:-|\s)(?:film|comedy|drama|series)\b/],
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
  const tokens = normaliseTagName(tag).split(/[^a-z0-9]+/).filter(Boolean)
    .filter(token => !CANONICAL_FUNCTION_WORDS.has(token))
    .map(stemCanonicalToken)
    .filter(Boolean);
  const unique = [...new Set(tokens)];
  return {
    tag: normaliseTagName(tag),
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

function tagAllowed(movie, tag) {
  return !suppressedTagSet(movie).has(normaliseTagName(tag));
}

function rawTagAllowed(movie, tag) {
  return !suppressedRawTagSet(movie).has(normaliseTagName(tag));
}

function canonicalTokenSimilarity(a, b) {
  if (a === b) return 1;
  const min = Math.min(a.length, b.length);
  const max = Math.max(a.length, b.length);
  if (min >= 3 && (a.startsWith(b) || b.startsWith(a))) return min / max;
  const grams = word => {
    const padded = `^${word}$`;
    const out = new Set();
    for (let i = 0; i < padded.length - 1; i++) out.add(padded.slice(i, i + 2));
    return out;
  };
  const ga = grams(a), gb = grams(b);
  let overlap = 0;
  ga.forEach(g => { if (gb.has(g)) overlap++; });
  return (2 * overlap) / Math.max(1, ga.size + gb.size);
}

function canonicalPhraseSimilarity(a, b) {
  if (!a.tokens.length || !b.tokens.length) return 0;
  if (a.signature === b.signature) return 1;
  if (a.acronym && a.acronym === b.acronym && a.tokens.length === b.tokens.length) {
    const aligned = a.tokens.every((token, i) => canonicalTokenSimilarity(token, b.tokens[i]) >= 0.28);
    if (aligned) return 0.9;
  }
  const best = a.tokens.map(token => Math.max(...b.tokens.map(other => canonicalTokenSimilarity(token, other))));
  const reverse = b.tokens.map(token => Math.max(...a.tokens.map(other => canonicalTokenSimilarity(token, other))));
  const coverage = (best.reduce((sum, value) => sum + value, 0) + reverse.reduce((sum, value) => sum + value, 0)) / (best.length + reverse.length);
  const lengthPenalty = Math.min(a.tokens.length, b.tokens.length) / Math.max(a.tokens.length, b.tokens.length);
  return coverage * (0.7 + 0.3 * lengthPenalty);
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

function rebuildTagBrain() {
  const records = [...Object.values(state.movies || {}), ...Object.values(state.hiddenTitles || {})];
  const now = new Date().toISOString();
  const frequency = new Map();
  records.forEach(movie => rawScoringTags(movie).forEach(tag => frequency.set(tag, (frequency.get(tag) || 0) + 1)));
  const tags = [...frequency.keys()];
  const features = new Map(tags.map(tag => [tag, canonicalTagFeatures(tag)]));
  const parent = new Map(tags.map(tag => [tag, tag]));
  const find = tag => {
    let root = parent.get(tag);
    while (root !== parent.get(root)) root = parent.get(root);
    let current = tag;
    while (parent.get(current) !== root) { const next = parent.get(current); parent.set(current, root); current = next; }
    return root;
  };
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };
  const blocks = new Map();
  const signatureGroups = new Map();
  const addBlock = (key, tag) => {
    if (!key) return;
    if (!blocks.has(key)) blocks.set(key, []);
    blocks.get(key).push(tag);
  };
  tags.forEach(tag => {
    const feature = features.get(tag);
    if (!signatureGroups.has(feature.signature)) signatureGroups.set(feature.signature, []);
    signatureGroups.get(feature.signature).push(tag);
    if (feature.acronym) addBlock(`a:${feature.acronym}:${feature.tokens.length}`, tag);
    feature.tokens.forEach(token => addBlock(`t:${token.slice(0, 4)}`, tag));
  });
  signatureGroups.forEach(group => {
    for (let i = 1; i < group.length; i++) union(group[0], group[i]);
  });
  blocks.forEach(group => {
    if (group.length > 140) return;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        if (find(a) === find(b)) continue;
        if (canonicalPhraseSimilarity(features.get(a), features.get(b)) >= 0.84) union(a, b);
      }
    }
  });
  const clusters = new Map();
  tags.forEach(tag => {
    const root = find(tag);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(tag);
  });
  const labelFor = new Map();
  const supportFor = new Map();
  clusters.forEach(group => {
    const label = [...group].sort((a, b) => (frequency.get(b) || 0) - (frequency.get(a) || 0) || canonicalTagFeatures(a).tokens.length - canonicalTagFeatures(b).tokens.length || a.length - b.length || a.localeCompare(b))[0];
    const support = group.reduce((sum, tag) => sum + (frequency.get(tag) || 0), 0);
    group.forEach(tag => { labelFor.set(tag, label); supportFor.set(tag, support); });
  });
  let changed = 0;
  records.forEach(movie => {
    const before = JSON.stringify(rawScoringTags(movie));
    const learned = [];
    rawScoringTags(movie).forEach(tag => {
      const feature = features.get(tag) || canonicalTagFeatures(tag);
      if ((supportFor.get(tag) || 0) > 1) learned.push(labelFor.get(tag) || feature.phrase);
    });
    const fallback = rawScoringTags(movie).map(tag => labelFor.get(tag) || canonicalTagFeatures(tag).phrase).filter(Boolean);
    const normalizedTags = cleanTagArray([...new Set(learned.length ? learned : fallback)].filter(tag => tagAllowed(movie, tag)), movie, false);
    const originalTags = cleanTagArray(rawScoringTags(movie).filter(tag => tagAllowed(movie, tag)), movie, false);
    const optimizedTags = originalTags.length >= AI_TAG_MIN_COUNT && normalizedTags.length < AI_TAG_MIN_COUNT
      ? originalTags
      : normalizedTags;
    movie.tags = optimizedTags;
    movie.coreTags = optimizedTags;
    movie.plotTags = optimizedTags;
    movie.descriptorTags = optimizedTags;
    movie.tagged = optimizedTags.length > 0;
    delete movie.canonicalTags;
    delete movie.canonicalTagVersion;
    if (before !== JSON.stringify(optimizedTags)) {
      changed++;
      touchRecord(movie, now);
    }
  });
  state.tagStats = { candidates:tags.length, tags:new Set(records.flatMap(movie => movie.tags || [])).size, rebuiltAt:new Date().toISOString() };
  delete state.canonicalTagStats;
  tagCorpusStatsCache = null;
  return changed;
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
    movie.tags.length >= AI_TAG_MIN_COUNT
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
  const evidence = {};
  const tags = [];
  (result?.tags || []).forEach(item => {
    const rawTag = normaliseTagName(item?.tag);
    const tag = normaliseTagName(state.tagAliases?.[rawTag] || rawTag);
    const confidence = Number(item?.confidence);
    const support = String(item?.evidence || '').trim().slice(0, 240);
    if (!tag || confidence < AI_TAG_MIN_CONFIDENCE || !support || genres.has(tag) || isMetaTag(tag) || !tagAllowed(movie, tag) || !rawTagAllowed(movie, tag)) return;
    const cleaned = cleanTagArray([tag], movie, false)[0];
    if (!cleaned || tags.includes(cleaned)) return;
    tags.push(cleaned);
    evidence[cleaned] = { confidence, evidence:support };
  });
  return {tags:tags.slice(0, AI_TAG_MAX_COUNT), evidence};
}

function aiTagVocabulary() {
  const frequency = new Map();
  [...Object.values(state.movies || {}), ...Object.values(state.hiddenTitles || {})].forEach(movie => {
    rawScoringTags(movie).forEach(tag => frequency.set(tag, (frequency.get(tag) || 0) + 1));
  });
  return [...frequency.entries()]
    .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, AI_VOCABULARY_SAMPLE_SIZE)
    .map(([tag, count]) => ({tag, count}));
}

function applyAiTagAliases(aliases={}) {
  const entries = Object.entries(aliases || {})
    .map(([from, to]) => [normaliseTagName(from), normaliseTagName(to)])
    .filter(([from, to]) => from && to && from !== to);
  if (!entries.length) return 0;
  const aliasMap = new Map(entries);
  state.tagAliases = {...(state.tagAliases || {})};
  entries.forEach(([from, to]) => { state.tagAliases[from] = to; });
  let changed = 0;
  [...Object.values(state.movies || {}), ...Object.values(state.hiddenTitles || {})].forEach(movie => {
    const before = JSON.stringify(movie.tags || []);
    ['tags','coreTags','plotTags','descriptorTags'].forEach(key => {
      const original = [...new Set((movie[key] || []).map(normaliseTagName).filter(Boolean))];
      const optimized = [...new Set(original
        .map(tag => aliasMap.get(normaliseTagName(tag)) || normaliseTagName(tag))
        .filter(tag => tag && tagAllowed(movie, tag)))];
      movie[key] = original.length >= AI_TAG_MIN_COUNT && optimized.length < AI_TAG_MIN_COUNT
        ? original.filter(tag => tagAllowed(movie, tag))
        : optimized;
    });
    if (before !== JSON.stringify(movie.tags || [])) {
      changed++;
      touchRecord(movie);
    }
  });
  return changed;
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
  movie.aiTagging = {
    status:'verified',
    model:String(model || ''),
    promptVersion:AI_TAG_PROMPT_VERSION,
    storyHash:aiStoryHash(movie.storyText),
    taggedAt:new Date().toISOString()
  };
  movie.retagStatus = 'verified';
  movie.retagMessage = '';
  touchRecord(movie);
  return movie;
}

function applyAiTagResult(movie, result, model='') {
  return commitAiTagSet(movie, cleanAiTagResults(result, movie), model);
}

function mergeAiTagPartials(previous={tags:[], evidence:{}}, next={tags:[], evidence:{}}) {
  const tags = [...new Set([...(previous.tags || []), ...(next.tags || [])])].slice(0, AI_TAG_MAX_COUNT);
  return {tags, evidence:{...(previous.evidence || {}), ...(next.evidence || {})}};
}

async function requestAiTags(movies, opts={}) {
  const items = (movies || []).filter(movie => movie?.storyText).slice(0, AI_TAG_BATCH_SIZE);
  if (!items.length) return {tagged:0, failed:0};
  const partials = opts.partials || {};
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
        return {
          id:movie.id,
          title:movie.title,
          year:movie.year,
          format:movie.format ? 'show' : 'movie',
          language:movie.language,
          genres:movieGenres(movie),
          storyText:`${movie.storyText}${continuationInstruction}`,
          existingTags,
          minimumAdditionalTags:missingTags,
          excludedTags:[...new Set([...(movie.suppressedTags || []), ...(movie.suppressedRawTags || []), ...existingTags])],
          preferredTagVocabulary:index === 0 ? aiTagVocabulary().map(item => item.tag) : undefined
        };
      }),
      optimizeVocabulary:true,
      continueTagging:Object.keys(partials).length > 0,
      tagVocabulary:aiTagVocabulary(),
      minimumTags:AI_TAG_MIN_COUNT,
      maximumTags:AI_TAG_MAX_COUNT,
      retryReason:opts.retryReason || ''
    })
  });
  if (!response.ok) throw new Error(`AI tagger HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload.ok) throw new Error(payload.error || 'AI tagging failed');
  applyAiTagAliases(payload.tagAliases || payload.aliases || {});
  const byId = new Map((payload.results || []).map(result => [String(result.id), result]));
  let tagged = 0;
  let failed = 0;
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
  return {tagged, failed};
}

async function applyAiTags(movie, opts={}) {
  if (!movie?.storyText) return movie;
  if (!opts.force && hasCurrentAiTags(movie)) return movie;
  await requestAiTags([movie]);
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
  if (purged) syncDrive();
  if (changed && !silent) showToast(purged ? 'Cleared legacy tags. AI rebuild ready.' : `Cleaned tag data on ${changed} titles`, 'success');
  return changed;
}

function runStartupMaintenance() {
  const run = () => {
    try {
      const changed = cleanContaminatedTags(true);
      if (changed) render();
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
window.addEventListener('DOMContentLoaded', async () => {
  loadLocalState();
  const purgedTags = purgeLegacyTagsForAi();
  const migratedWrongPicks = migrateVisibleWrongPicks();
  if (purgedTags || migratedWrongPicks) {
    rebuildTagBrain();
    computeTagWeights();
    saveLocalState();
  }
  recVisibleLimit = Math.max(REC_INFINITE_PAGE_SIZE, parseInt(state.settings.topN || 10));
  render();
  runStartupMaintenance();
  restoreDriveSession().finally(() => {
    startupDriveRestoreDone = true;
    render();
    if (Object.keys(state.movies).length < 50 && (!state.drive.enabled || state.drive.connected)) {
      scheduleAutoExpand(800);
    }
  });
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
  if (!Number(target.rating || 0) && Number(source.rating || 0)) target.rating = Number(source.rating || 0);
  if (source.watchlist) target.watchlist = true;
  if (source.skipped) target.skipped = true;
  if (!target.userNotes && source.userNotes) target.userNotes = source.userNotes;
  target.suppressedTags = [...new Set([...(target.suppressedTags || []), ...(source.suppressedTags || [])])];
  target.suppressedRawTags = [...new Set([...(target.suppressedRawTags || []), ...(source.suppressedRawTags || [])])];
  return target;
}

function normaliseFetchedWikiMovie(movie, previous=null) {
  if (!movie) return null;
  const next = { ...movie };
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
  return next;
}

function normaliseStoredTitleRecord(movie) {
  if (!movie) return movie;
  if (!movie.wikiPageId && String(movie.id || '').startsWith('wiki_')) {
    movie.wikiPageId = String(movie.id).replace(/^wiki_/, '');
  }
  if (!movie.wikiUrl && (movie.wikiTitle || movie.pageTitle)) movie.wikiUrl = wikiUrlFromTitle(movie.wikiTitle || movie.pageTitle);
  if (!movie.wikiTitle && movie.pageTitle) movie.wikiTitle = movie.pageTitle;
  if (!movie.pageTitle && movie.wikiTitle) movie.pageTitle = movie.wikiTitle;

  const isWikiRecord = movie.source === 'wikipedia' || !!movie.storyText || !!movie.wikiPageId || !!movie.wikiUrl;
  if (isWikiRecord && movie.storyText) {
    movie.source = 'wikipedia';
    movie.wikiVerified = true;
    movie.tags = cleanTagArray(movie.tags || movie.coreTags || movie.plotTags || movie.descriptorTags || [], movie, false);
    movie.coreTags = cleanTagArray(movie.coreTags && movie.coreTags.length ? movie.coreTags : movie.tags, movie, false);
    movie.plotTags = cleanTagArray(movie.plotTags && movie.plotTags.length ? movie.plotTags : movie.tags, movie, false);
    movie.descriptorTags = cleanTagArray(movie.descriptorTags && movie.descriptorTags.length ? movie.descriptorTags : movie.tags, movie, false);
    movie.tagged = !!(movie.tags.length || movie.coreTags.length || movie.plotTags.length || movie.descriptorTags.length);
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
  return /^(list of|category:|template:|wikipedia:|portal:)/i.test(title)
    || /\b(film series|media franchise|franchise|universe|timeline|soundtrack|discography|filmography|list)\b/i.test(title);
}

function isFranchiseOverviewPage(pageTitle, extract, cats=[]) {
  if (obviousNonMovieTitle(pageTitle)) return true;
  const lead = String(extract || '').slice(0, 700);
  if (/\b(film series|media franchise|shared universe)\b/i.test(pageTitle)) return true;
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

function hasAllowedLanguageEvidence(cats, leadText) {
  const catText = (cats || []).join(' ');
  return {
    english: /\bcategory:\d{4} english-language films\b|\bcategory:english-language (?:films|television shows|web series|netflix original programming|amazon prime video original programming)\b/i.test(catText)
      || /\benglish-language (?:film|television series|tv series|web series|miniseries)\b/i.test(leadText)
      || /\b(?:american|british|canadian|australian|new zealand|irish)\b.{0,80}\b(?:film|television series|tv series|web series|miniseries|streaming television series)\b/i.test(leadText)
      || /\bcategory:(?:american|british|canadian|australian|new zealand|irish) (?:.* )?(?:films|television series|web series)\b/i.test(catText),
    hindi: /\bcategory:\d{4} hindi-language films\b|\bcategory:hindi-language (?:films|television shows|web series)\b/i.test(catText)
      || /\bhindi-language (?:film|television series|tv series|web series|miniseries)\b/i.test(leadText)
      || /\bhindi (?:film|television series|tv series|web series|miniseries)\b/i.test(leadText)
  };
}

function pageMediaEvidence(leadText, cats=[]) {
  const catText = (cats || []).join(' ');
  const show = /\bcategory:.*(?:television series|tv series|web series|miniseries|netflix original programming|amazon prime video original programming)\b/i.test(catText)
    || /\b(?:is an?|was an?) .{0,140}\b(?:television series|tv series|web series|miniseries|streaming television series)\b/i.test(leadText);
  const film = /\bcategory:\d{4} .*films\b|\bcategory:.*(?:action|adventure|animated|comedy|crime|drama|fantasy|horror|musical|mystery|romance|science fiction|sports|thriller|war|western|superhero).* films\b/i.test(catText)
    || /\b(?:is an?|was an?) .{0,140}\bfilm\b/i.test(leadText);
  return {film, show};
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
  if (mode === 'hindiShows') return [...HIGH_CONFIDENCE_SHOWS, ...EXPANSION_SHOWS].map(title => ({title, lane:COLLECTION_LANES.find(l => l.key === 'hindiShows'), tier:0}));
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

function unblockTitleForManualSearch(value) {
  const key = normaliseTitleKey(typeof value === 'string' ? value : value?.title);
  if (!key) return false;
  let changed = false;
  Object.entries(state.wrongPicks || {}).forEach(([recordKey, item]) => {
    const matches = [item.title, item.wikiTitle, item.pageTitle]
      .some(title => normaliseTitleKey(title) === key);
    if (!matches) return;
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
  if (currentWikiAbortController) currentWikiAbortController.abort();
  if (currentSleepCancel) currentSleepCancel();
  hideFetchProgress();
  const btn = document.getElementById('expandBtn');
  if (btn) { btn.disabled = false; btn.textContent = '＋ Expand Pool'; }
  if (!opts.silent) showToast('Fetching stopped.', '');
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

async function fetchWikiSearchTitles(query, opts={}) {
  const q = (query || '').trim();
  if (!q) return [];
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=8&format=json&origin=*`;
    const data = await wikiApiJson(url);
    return (data.query?.search || []).map(item => item.title);
  } catch(e) {
    if (opts.throwOnError) throw e;
    return [];
  }
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

async function fetchYearCategoryIndex(laneKey) {
  const source = WIKI_YEAR_INDEX_SOURCES[laneKey];
  if (!source) return [];
  if (yearCategoryIndexCache[laneKey]) return yearCategoryIndexCache[laneKey];
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
          if (year) categories.push({title, year, rootIndex});
        });
        cmcontinue = data.continue?.cmcontinue || '';
      } while (cmcontinue && !fetchAbortRequested);
    } catch(e) {}
  }
  yearCategoryIndexCache[laneKey] = categories
    .sort((a,b)=>b.year-a.year||a.rootIndex-b.rootIndex||a.title.localeCompare(b.title))
    .map(item=>item.title);
  return yearCategoryIndexCache[laneKey];
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
        if (!obviousNonMovieTitle(item.title)) titles.push(item.title);
      });
      cmcontinue = data.continue?.cmcontinue || '';
    } while (cmcontinue && !fetchAbortRequested);
  } catch(e) {}
  yearCategoryMembersCache[category] = [...new Set(titles)];
  return yearCategoryMembersCache[category];
}

function discoveryCandidateAllowed(title, lane, existing, seenThisRun) {
  const clean = normaliseTitleKey(title);
  if (!clean || TITLE_BLOCKLIST.has(clean) || obviousNonMovieTitle(title)) return false;
  if (existing.has(clean) || hiddenTitleMatches(title) || wrongPickMatches(title) || seenThisRun.has(clean)) return false;
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
      delete yearCategoryIndexCache[lane.key];
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
    const title = members[cursor.offset];
    cursor.offset += 1;
    scannedTitles += 1;
    if (discoveryCandidateAllowed(title, lane, existing, seenThisRun)) {
      seenThisRun.add(normaliseTitleKey(title));
      out.push({title, lane, tier:0, sourceCategory:category});
    }
  }
  return out;
}

async function nextDiscoveryCandidates(mode, limit, seenThisRun=new Set()) {
  ensureDiscoveryCursor();
  const lanes = collectionLanesForMode(mode);
  const existing = new Set(Object.values(state.movies).map(m => normaliseTitleKey(m.title)));
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

async function expandPool(manual=true) {
  if (poolExpansionInProgress) return;
  if (!manual && autoFetchPaused) return;
  if (!manual && !recommendationPageActive()) return;
  if (manual) autoFetchPaused = false;
  poolExpansionInProgress = true;
  fetchAbortRequested = false;
  const btn = document.getElementById('expandBtn');
  if (btn) { btn.disabled = false; btn.textContent = 'Stop Fetching'; }
  const mode = expansionMode();
  const chasingStrong = needsMoreStrongRecommendations();
  const chasingPerfect = chasingStrong;
  let fetchStatus = recommendationFetchStatus();
  if (manual || chasingStrong) showFetchProgress(chasingStrong ? `Improving recommendations...` : `Expanding ${mode === 'all' ? 'movies and shows' : mode} from Wikipedia...`, 0, '');
  await nextPaint();

  let added = 0;
  let attempts = 0;
  const attemptBudget = manual ? FETCH_MANUAL_ATTEMPT_BUDGET : FETCH_AUTO_ATTEMPT_BUDGET;
  const seenThisRun = new Set();
  const pendingAiMovies = [];
  let aiFailure = '';

  const flushPendingAiMovies = async () => {
    if (!pendingAiMovies.length || fetchAbortRequested) return;
    const pendingBatch = pendingAiMovies.splice(0, AI_TAG_BATCH_SIZE);
    const batch = completeAiBatch(pendingBatch.map(item => item.movie));
    try {
      showFetchProgress('AI tagging batch...', Math.min(96, attempts % 100), batch.map(movie => movie.title).join(' · '));
      await requestAiTags(batch);
      pendingBatch.forEach(({movie}) => {
        if (!hasCurrentAiTags(movie) || isMovieHidden(movie)) return;
        const existingMovie = state.movies[movie.id] || findExistingMovieByIdentity(movie);
        upsertMoviePreservingUserState(movie, existingMovie);
        if (!existingMovie) added++;
      });
      rebuildTagBrain();
      computeTagWeights();
      saveLocalState();
      updateStats();
      fetchStatus = recommendationFetchStatus();
    } catch(e) {
      aiFailure = String(e?.message || e);
      fetchAbortRequested = true;
    }
  };

  while (!fetchAbortRequested) {
    const cursorBeforeBatch = JSON.parse(JSON.stringify(state.discoveryCursor || {}));
    const toFetch = await nextDiscoveryCandidates(mode, Math.max(4, Math.min(8, attemptBudget - attempts)), seenThisRun);

    if (!toFetch.length) {
      break;
    }
    saveLocalState({preserveUpdatedAt:true});
    let processedCandidates = 0;

    for (let i = 0; i < toFetch.length; i++) {
      if (fetchAbortRequested) break;
      if (attempts >= attemptBudget || added >= FETCH_MAX_ADDED_PER_RUN) {
        await flushPendingAiMovies();
        fetchAbortRequested = true;
        break;
      }
      const candidate = toFetch[i];
      const title = typeof candidate === 'string' ? candidate : candidate.title;
      const lane = typeof candidate === 'string' ? null : candidate.lane;
      const fetchMode = lane?.mode || mode;
      seenThisRun.add(normaliseTitleKey(title));
      attempts++;
      if (manual || chasingPerfect || needsMorePerfectRecommendations()) {
        if (attempts === 1 || attempts % 8 === 0) fetchStatus = recommendationFetchStatus();
        const perfectCount = fetchStatus.strongCount;
        showFetchProgress(
          needsMorePerfectRecommendations() ? `Improving recommendations · ${perfectCount}/${PERFECT_REC_TARGET} strong` : `Finding new ${mode === 'shows' ? 'shows' : mode === 'movies' ? 'movies' : 'titles'} · added ${added}`,
          Math.min(96, (attempts % 100)),
          `${attempts}/${attemptBudget} checked · ${title}`
        );
      }
      try {
        const movie = await fetchWikiMovie(title, fetchMode, null, {ai:false});
        if (movie && isMovieHidden(movie)) {
          // Keep hidden and internally blocked titles out of the pool.
        } else if (movie) {
          if ((movie.language === 'English' || movie.language === 'Hindi') && meetsYearCutoff(movie) && matchesExpansionMode(movie, fetchMode) && (!lane || laneMatchesMovie(movie, lane))) {
            pendingAiMovies.push({movie, lane});
            if (pendingAiMovies.length >= AI_TAG_BATCH_SIZE) await flushPendingAiMovies();
            if (!needsMoreStrongRecommendations() && !manual) { fetchAbortRequested = true; break; }
          }
        }
      } catch(e) {
        if (fetchAbortRequested || e.name === 'AbortError') break;
      }
      if (fetchAbortRequested) break;
      processedCandidates++;
      if (attempts % 20 === 0) await abortableSleep(WIKI_BATCH_PAUSE_MS);
    }

    if (fetchAbortRequested && processedCandidates < toFetch.length) {
      state.discoveryCursor = cursorBeforeBatch;
      ensureDiscoveryCursor();
      saveLocalState({preserveUpdatedAt:true});
    }
    if (!fetchAbortRequested) await flushPendingAiMovies();
    if (!needsMoreStrongRecommendations() && !manual) break;
  }

  if (manual || chasingStrong || added) hideFetchProgress();
  if (btn) { btn.disabled = false; btn.textContent = '＋ Expand Pool'; }
  poolExpansionInProgress = false;
  const stopped = fetchAbortRequested || autoFetchPaused;
  fetchAbortRequested = false;
  if (!stopped) autoFetchPaused = false;
  rebuildTagBrain();
  computeTagWeights();
  saveLocalState(); syncDrive(); render();
  if (aiFailure) showToast(aiFailure.includes('Daily CineLens tagging limit reached') ? `Daily free AI limit reached. Added ${added}; resume later.` : `AI tagging stopped: ${aiFailure}`, 'error');
  else if (stopped && manual) showToast(`Stopped. Added ${added} titles.`, added?'success':'');
  else if (manual || added) showToast(`Added ${added} new ${mode === 'shows' ? 'shows' : mode === 'movies' ? 'movies' : 'titles'} to pool.`, added?'success':'');
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
  box.innerHTML = `<span class="wiki-search-label">Wikipedia</span>${wikiSearchResults.map(title => {
    const encoded = encodeURIComponent(title);
    return `<button class="wiki-search-result" onclick="fetchUnifiedWikiResult(decodeURIComponent('${encoded}'))">${attrSafe(title)}</button>`;
  }).join('')}`;
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
  if (urlTitle) {
    await fetchUnifiedWikiResult(urlTitle, query);
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'searching...'; }
  try {
    fetchAbortRequested = false;
    wikiSearchQuery = query;
    const diagnostics = {};
    const exactMovie = await fetchWikiTitleAcrossModes(query, ['all'], diagnostics, {ai:false});
    if (exactMovie) {
      await fetchUnifiedWikiResult(exactMovie.wikiTitle || exactMovie.pageTitle || query, '', {preloaded:exactMovie});
      return;
    }
    wikiSearchResults = (await fetchWikiSearchTitles(query, {throwOnError:true}))
      .filter(title => !obviousNonMovieTitle(title))
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
    return;
  }
  unblockTitleForManualSearch(title);
  if (btn) { btn.disabled = true; btn.textContent = 'fetching...'; }
  showFetchProgress('Fetching from Wikipedia...', 12, title);
  try {
    const diagnostics = {};
    const movie = opts.preloaded || (rawUrl
      ? await refreshTitleFromWikipedia(existing, {url:rawUrl, mode, diagnostics, acceptDifferentTitle:true})
      : await fetchWikiTitleAcrossModes(title, mode === 'all' ? ['all'] : [mode, 'all'], diagnostics));
    if (!movie) throw new Error(diagnostics.reason || 'Wikipedia page is not a usable movie or show');
    if (isMovieHidden(movie)) throw new Error('Title is hidden or blocked');
    existing = existing || state.movies[movie.id] || findExistingMovieByIdentity(movie);
    const stored = existing
      ? applyFreshWikiMovie(existing.id, movie, existing)
      : upsertMoviePreservingUserState(movie);
    if (!hasCurrentAiTags(stored)) {
      try {
        await applyAiTags(stored, {force:true});
      } catch(e) {
        stored.retagStatus = 'needs-ai-tags';
        stored.retagMessage = `AI returned fewer than ${AI_TAG_MIN_COUNT} usable tags`;
        touchRecord(stored);
      }
    }
    wikiSearchResults = [];
    wikiSearchQuery = '';
    renderWikiSearchResults();
    const input = document.getElementById('titleSearch');
    if (input) input.value = stored.title;
    state.settings.titleSearch = stored.title;
    rebuildTagBrain();
    computeTagWeights();
    saveLocalState();
    syncDrive();
    render();
    showToast(existing ? `Refreshed "${stored.title}"` : `Added "${stored.title}"`, 'success');
    return true;
  } catch(e) {
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
  rateMovie(id, rating);
}

async function fetchWikiMovie(wikiTitle, mode='all', diagnostics=null, opts={}) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&redirects=1&titles=${encodeURIComponent(wikiTitle)}&prop=extracts|categories|pageimages&explaintext=1&exlimit=1&cllimit=80&pithumbsize=360&format=json&origin=*`;
  const data = await wikiApiJson(url);
  const movie = parseWikiMovieResponse(data, wikiTitle, mode, diagnostics);
  if (movie && opts.ai !== false) await applyAiTags(movie);
  return movie;
}

async function fetchWikiMovieByPageId(pageId, mode='all', opts={}) {
  const clean = String(pageId || '').replace(/^wiki_/, '');
  if (!clean) return null;
  const url = `https://en.wikipedia.org/w/api.php?action=query&pageids=${encodeURIComponent(clean)}&prop=extracts|categories|pageimages&explaintext=1&exlimit=1&cllimit=80&pithumbsize=360&format=json&origin=*`;
  const data = await wikiApiJson(url);
  const movie = parseWikiMovieResponse(data, clean, mode);
  if (movie && opts.ai !== false) await applyAiTags(movie);
  return movie;
}

function rejectWikiParse(diagnostics, reason) {
  if (diagnostics) diagnostics.reason = reason;
  return null;
}

function parseWikiMovieResponse(data, requestedTitle, mode='all', diagnostics=null) {
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
  if (isFranchiseOverviewPage(pageTitle, extract, cats)) return rejectWikiParse(diagnostics, 'franchise or overview page, not one title');
  const catText = cats.join(' ');
  const leadText = extract.slice(0, 1400);
  if (isPersonOrOrganizationPage(pageTitle, leadText, cats)) return rejectWikiParse(diagnostics, 'person or organization page, not a movie/show');
  const mediaEvidence = pageMediaEvidence(leadText, cats);
  if (!mediaEvidence.film && !mediaEvidence.show) return rejectWikiParse(diagnostics, 'no film/show evidence');
  const storyText = extractNarrativeSection(extract);
  if (!storyText || storyText.length < MIN_STORY_SECTION_CHARS) return rejectWikiParse(diagnostics, 'no usable narrative section');

  let language = '';
  const languageEvidence = hasAllowedLanguageEvidence(cats, leadText);
  const englishEvidence = languageEvidence.english;
  const hindiEvidence = languageEvidence.hindi;
  if (hindiEvidence) language = 'Hindi';
  else if (englishEvidence) language = 'English';

  let format = null;
  if (cats.some(c => c.includes('television series') || c.includes('tv series') || c.includes('web series'))) format = 'series';
  if (cats.some(c => c.includes('miniseries'))) format = 'miniseries';
  if (!format && /\b(television series|tv series|web series|miniseries|streaming television series)\b/i.test(leadText)) format = 'series';
  if (!format && mediaEvidence.show && !mediaEvidence.film) format = 'series';
  if (!format && !mediaEvidence.film) return rejectWikiParse(diagnostics, 'not a movie page');
  if (mode === 'movies' && format) return rejectWikiParse(diagnostics, 'title is a show, not a movie');
  if (mode === 'shows' && !format) return rejectWikiParse(diagnostics, 'title is a movie, not a show');

  const year = deriveReleaseYear(leadText, extract, cats, format);

  if (language !== 'English' && language !== 'Hindi') return rejectWikiParse(diagnostics, 'English or Hindi language evidence missing');

  let country = 'USA';
  if (language === 'Hindi') country = 'India';
  else if (mode === 'shows' && (cats.some(c => c.includes('indian television') || c.includes('indian web series')) || /\bindian\b/i.test(leadText))) { country = 'India'; language = 'Hindi'; }
  else if (cats.some(c => c.includes('british film') || c.includes('united kingdom') || c.includes('british television'))) country = 'UK';
  else if (cats.some(c => c.includes('indian film') || c.includes('indian television'))) { country = 'India'; language = language || 'Hindi'; }

  const dirMatch = leadText.match(/directed by ([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,3})/);
  const creatorMatch = leadText.match(/created by ([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,3})/);
  const director = dirMatch ? dirMatch[1] : (creatorMatch ? creatorMatch[1] : 'Unknown');

  if (!year || !title || !wikiPageId) return rejectWikiParse(diagnostics, 'missing release year, title or Wikipedia page ID');

  const genres = deriveGenres(leadText, cats);
  return {
    id, title, year, director, language, country, format: format||null,
    genres, categoryText: cats.join(' '),
    tags: [], coreTags: [], plotTags: [], descriptorTags: [], rawDescriptors: [],
    tagged: false, rating: 0, source: 'wikipedia', wikiPageId, wikiUrl: wikiUrlFromTitle(pageTitle), wikiTitle: pageTitle, pageTitle, thumbnailUrl, storyText, leadText, wikiVerified: true, retagStatus: 'needs-ai-tags', retagMessage: 'AI tags pending'
  };
}

function extractNarrativeSection(extract) {
  const text = (extract || '').replace(/\r/g, '').trim();
  if (!text) return '';
  const lines = text.split('\n');
  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const heading = normaliseWikiHeading(lines[i]);
    if (!heading) continue;
    const out = [];
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (normaliseWikiHeading(line)) break;
      if (line) out.push(line);
      if (out.join(' ').length > 6500) break;
    }
    const section = out.join(' ').replace(/\s+/g, ' ').trim();
    const score = narrativeSectionScore(heading, section);
    if (score > 0) candidates.push({ section, score });
  }
  candidates.sort((a,b) => b.score - a.score || b.section.length - a.section.length);
  return candidates[0]?.section || extractInlineNarrative(text);
}

function extractInlineNarrative(text) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
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
  const headingHint = /\b(plot|story|narrative|premise|synopsis|summary|overview|character)\b/i.test(heading) ? 2 : 0;
  const nonStoryHeading = /\b(cast|casting|characters? list|episodes?|production|development|filming|release|broadcast|reception|ratings?|awards?|music|soundtrack|marketing|references?|external links?|see also)\b/i.test(heading);
  const contentIsNarrative = narrativeSignals >= 3
    && (narrativeOpening || actionSentences >= 2 || narrativeSignals >= productionSignals * 2 + 2);
  if (!contentIsNarrative || (nonStoryHeading && narrativeSignals < productionSignals * 3 + 5)) return 0;
  return narrativeSignals * 3 + actionSentences * 2 + headingHint - productionSignals * 4 - (nonStoryHeading ? 8 : 0);
}

function normaliseWikiHeading(line) {
  const raw = String(line || '').trim();
  if (!raw) return '';
  const stripped = raw.replace(/^=+\s*/, '').replace(/\s*=+$/, '').trim();
  if (stripped === raw && !/^=+.*=+$/.test(raw)) return '';
  return stripped.toLowerCase();
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
  if (leadHas(/\bhorror\b/) || catHas(/\bhorror films\b/) || has(/\b(terrifying|monster attacks|slasher|haunting|creature stalks)\b/)) add('horror');
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
  return [...new Set(rawScoringTags(movie).map(tag => canonicalTagFeatures(tag).phrase).filter(Boolean))].filter(tag => tagAllowed(movie, tag));
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
  el.classList.add('visible');
  document.getElementById('fetchLabel').textContent = label;
  document.getElementById('fetchFill').style.width = pct + '%';
  document.getElementById('fetchSub').textContent = sub;
}
function hideFetchProgress() {
  document.getElementById('fetchProgress').classList.remove('visible');
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
  btn.textContent = remaining ? `AI tag ${remaining} titles` : 'AI tags complete';
}

async function tagAllUntagged() {
  if (poolExpansionInProgress) {
    showToast('Stop pool expansion before rebuilding tags.', 'error');
    return;
  }
  const queue = aiTagCandidates();
  if (!queue.length) { showToast('All eligible titles have AI tags',''); return; }
  fetchAbortRequested = false;
  const btn = document.getElementById('tagUntaggedBtn');
  if (btn) btn.disabled = true;
  let tagged = 0;
  let failed = 0;
  try {
    let index = 0;
    while (index < queue.length) {
      if (fetchAbortRequested) break;
      const batch = [];
      while (index < queue.length && batch.length < AI_TAG_BATCH_SIZE && !fetchAbortRequested) {
        const candidate = queue[index++];
        showFetchProgress(
          `Resolving title data · ${index}/${queue.length}`,
          Math.round(index / queue.length * 100),
          candidate.title
        );
        const enriched = await enrichLegacyTitleForAi(candidate);
        if (enriched?.storyText && !hasCurrentAiTags(enriched)) batch.push(enriched);
      }
      if (!batch.length) continue;
      showFetchProgress(
        `AI tagging batch · ${index}/${queue.length}`,
        Math.round(index / queue.length * 100),
        batch.map(movie => movie.title).join(' · ')
      );
      const result = await requestAiTags(completeAiBatch(batch));
      tagged += result.tagged;
      failed += result.failed;
      rebuildTagBrain();
      computeTagWeights();
      saveLocalState();
      render();
      await nextPaint();
    }
    syncDrive();
    showToast(`AI tagged ${tagged} titles${failed ? ` · ${failed} need retry` : ''}`, tagged ? 'success' : '');
  } catch(e) {
    saveLocalState();
    syncDrive();
    const message = String(e?.message || e);
    showToast(message.includes('Daily CineLens tagging limit reached') ? `Daily free AI limit reached · tagged ${tagged}. Resume tomorrow.` : `AI tagging stopped: ${message}`, 'error');
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
  if (!recommendationPageActive()) stopFetching({silent:true});
  recVisibleLimit = Math.max(recVisibleLimit, parseInt(state.settings.topN || 10), REC_INFINITE_PAGE_SIZE);
  render();
}
function isShow(m) { return !!m.format; }
function matchesTab(m) {
  if (activeTab === 'all' || activeTab === 'pool' || activeTab === 'hidden' || activeTab === 'rated' || activeTab === 'watchlist' || activeTab === 'tags') return true;
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
  else if (activeTab === 'watchlist') renderWatchlist();
  else if (activeTab === 'tags') renderTagBrain();
  else if (activeTab === 'pool') renderPoolGrid();
  else if (activeTab === 'hidden') renderHiddenGrid();
  else renderRecs();
  maybeAutoExpandPool();
}

function updateControlDeck() {
  const modeBtn=document.getElementById('tagDeleteModeBtn');
  if (modeBtn) {
    modeBtn.classList.toggle('active', !!state.settings.tagDeleteMode);
    modeBtn.textContent=state.settings.tagDeleteMode ? 'Tag clicks: remove' : 'Tag clicks: explore';
  }
  const genreFilter=document.getElementById('genreFilter');
  if (genreFilter && genreFilter.value !== (state.settings.genreFilter || 'all')) genreFilter.value=state.settings.genreFilter || 'all';
  const languageFilter=document.getElementById('languageFilter');
  if (languageFilter && languageFilter.value !== (state.settings.languageFilter || 'all')) languageFilter.value=state.settings.languageFilter || 'all';
  const sortMode=document.getElementById('sortMode');
  if (sortMode && sortMode.value !== (state.settings.sortMode || 'recommended')) sortMode.value=state.settings.sortMode || 'recommended';
  const shuffleBtn=document.getElementById('shuffleAgainBtn');
  if (shuffleBtn) shuffleBtn.hidden = (state.settings.sortMode || 'recommended') !== 'random';
  const titleSearch=document.getElementById('titleSearch');
  if (titleSearch && titleSearch.value !== (state.settings.titleSearch || '')) titleSearch.value=state.settings.titleSearch || '';
  const deck=document.querySelector('.control-deck');
  if (deck) deck.classList.toggle('collapsed', !!state.settings.controlDeckCollapsed);
  const toggle=document.getElementById('controlToggle');
  if (toggle) toggle.textContent = state.settings.controlDeckCollapsed ? 'Show filters & tools' : 'Hide filters & tools';
}

function updateLanguageFilter(language) {
  state.settings.languageFilter = language || 'all';
  saveSettingsState();
  renderActiveCards();
}

function updateGenreFilter(genre) {
  state.settings.genreFilter = genre || 'all';
  saveSettingsState();
  renderActiveCards();
}

function updateSortMode(mode) {
  state.settings.sortMode = mode || 'recommended';
  if (state.settings.sortMode === 'random' && !state.settings.shuffleSeed) state.settings.shuffleSeed = Date.now();
  saveSettingsState();
  renderActiveCards();
  updateControlDeck();
}

function shuffleAgain() {
  state.settings.sortMode = 'random';
  state.settings.shuffleSeed = Date.now();
  saveSettingsState();
  renderActiveCards();
  updateControlDeck();
}

function updateTitleSearch(value) {
  state.settings.titleSearch = String(value || '').trim();
  if (!state.settings.titleSearch || state.settings.titleSearch !== wikiSearchQuery) {
    wikiSearchResults = [];
    renderWikiSearchResults();
  }
  recVisibleLimit = Math.max(parseInt(state.settings.topN || 10), REC_INFINITE_PAGE_SIZE);
  poolVisibleLimit = 80;
  hiddenVisibleLimit = 80;
  saveSettingsState();
  renderActiveCards();
}

function toggleControlDeck() {
  state.settings.controlDeckCollapsed = !state.settings.controlDeckCollapsed;
  saveSettingsState();
  updateControlDeck();
}

function toggleMobileNav() {
  document.querySelector('.tab-bar')?.classList.toggle('open');
}

function renderActiveCards() {
  if (activeTab === 'pool') renderPoolGrid();
  else if (activeTab === 'hidden') renderHiddenGrid();
  else if (activeTab === 'tags') renderTagBrain();
  else if (activeTab === 'rated') renderRatedGrid();
  else if (activeTab === 'watchlist') renderWatchlist();
  else renderRecs();
}

function matchesGlobalFilters(movie) {
  return matchesLanguageFilter(movie) && matchesGenreFilter(movie) && matchesTitleSearch(movie) && meetsYearCutoff(movie);
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

function matchesTitleSearch(movie) {
  const q = String(state.settings.titleSearch || '').trim().toLowerCase();
  if (!q) return true;
  return [movie?.title, movie?.wikiTitle, movie?.pageTitle].some(value => String(value || '').toLowerCase().includes(q));
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

function recommendationFetchStatus(scored=recommendationCandidates()) {
  const bestOverlap = scored[0]?.posOverlap || 0;
  const minOverlap = Math.max(1, Math.min(bestOverlap || 1, STRONG_REC_MIN_OVERLAP));
  const strongCount = scored.filter(x => Number(x.posOverlap || 0) >= minOverlap && Number(x.positiveScore || 0) > 0).length;
  return {strongCount, target:STRONG_REC_TARGET, bestOverlap, minOverlap, total:scored.length};
}

function needsMoreStrongRecommendations(target=STRONG_REC_TARGET) {
  if (!personalizedEnough()) return false;
  return recommendationFetchStatus().strongCount < target;
}

function needsMorePerfectRecommendations() {
  return needsMoreStrongRecommendations();
}

function maybeAutoExpandPool() {
  if (activeTab === 'pool' || activeTab === 'hidden' || activeTab === 'rated' || activeTab === 'tags' || autoFetchPaused) return;
  const available = discoveryPool().length;
  const needsStrong = needsMoreStrongRecommendations();
  const gap = needsStrong ? 15000 : 120000;
  if ((available < 30 || needsStrong) && !poolExpansionInProgress && Date.now()-lastAutoExpandAt > gap) {
    lastAutoExpandAt = Date.now();
    scheduleAutoExpand(600);
  }
}

function scheduleAutoExpand(delay=600) {
  if (!startupDriveRestoreDone) return;
  if (autoExpandTimer || autoFetchPaused) return;
  autoExpandTimer = setTimeout(() => {
    autoExpandTimer = null;
    if (!recommendationPageActive() || autoFetchPaused || poolExpansionInProgress) return;
    expandPool(false);
  }, delay);
}

function renderRecs() {
  if (activeTab === 'pool' || activeTab === 'hidden' || activeTab === 'rated' || activeTab === 'watchlist' || activeTab === 'tags') return;
  const grid = document.getElementById('recsGrid');
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
        : sortMovies(scored.map(item => item.movie), 'title-asc').map(movie => scored.find(item => item.movie.id === movie.id)).filter(Boolean);
      const top = ordered.slice(0, visibleLimit);
    const fetchStatus = recommendationFetchStatus(scored);
    if (fetchStatus.strongCount < STRONG_REC_TARGET && !poolExpansionInProgress && !autoFetchPaused) {
      lastAutoExpandAt = Date.now();
      scheduleAutoExpand(100);
    }
    if (top.length) {
      document.getElementById('recCount').textContent = fetchStatus.strongCount < STRONG_REC_TARGET
        ? `improving recommendations · ${fetchStatus.strongCount}/${STRONG_REC_TARGET} strong · showing ${top.length} of ${scored.length}`
        : `showing ${top.length} of ${scored.length} matches`;
      top.forEach((item, i) => grid.appendChild(buildCard(item.movie, { rank:i+1, score:item.score, matchedTags:item.matchedTags, matchedGenres:item.matchedGenres, posOverlap:item.posOverlap, genreOverlap:item.genreOverlap, negativeOverlap:item.negativeOverlap, tasteFit:item.tasteFit, matchScore:item.matchScore })));
      return;
    }
  }

  const browseLimit = Math.max(recVisibleLimit, parseInt(state.settings.topN || 10), REC_INFINITE_PAGE_SIZE);
  const batch = sortMovies(discoveryPool(), 'title-asc').slice(0, browseLimit);
  if (ratedTagged.length >= 3 && !poolExpansionInProgress && !autoFetchPaused) {
    lastAutoExpandAt = Date.now();
    scheduleAutoExpand(100);
  }
  document.getElementById('recCount').textContent = ratedTagged.length < 3 ? `rate ${Math.max(0,3-ratedTagged.length)} more to personalize` : `building recommendation pool · showing ${batch.length} unrated`;
  if (!batch.length) { grid.innerHTML = `<div class="empty-state"><div class="icon">?</div><h3>No Titles Here</h3><p>Expanding the pool in the background.</p></div>`; return; }
  batch.forEach(m => grid.appendChild(buildCard(m, {})));
}

function renderGlobalTitleSearch(grid) {
  const results = sortMovies(Object.values(state.movies || {})
    .filter(matchesTab)
    .filter(matchesGlobalFilters), 'updated-desc');
  const limit = Math.max(recVisibleLimit, REC_INFINITE_PAGE_SIZE);
  document.getElementById('recCount').textContent = results.length ? `search found ${Math.min(limit, results.length)} of ${results.length}` : 'no title matches';
  grid.innerHTML = '';
  if (!results.length) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">?</div><h3>No Title Matches</h3></div>`;
    return;
  }
  results.slice(0, limit).forEach(movie => {
    const contextLabel = movie.rating > 0 ? 'Rated' : movie.watchlist ? 'Watchlist' : 'In Pool';
    grid.appendChild(buildCard(movie, {showEdit:movie.rating > 0, watchlistView:!!movie.watchlist, poolView:!movie.rating && !movie.watchlist, contextLabel}));
  });
  if (results.length > limit) grid.insertAdjacentHTML('beforeend',`<div class="empty-state"><button class="btn btn-warning" onclick="showMoreSearchResults()">Show ${Math.min(REC_INFINITE_PAGE_SIZE, results.length-limit)} more · ${results.length-limit} remaining</button></div>`);
}

function showMoreSearchResults() {
  recVisibleLimit += REC_INFINITE_PAGE_SIZE;
  renderRecs();
}

function renderRatedGrid() {
  const grid = document.getElementById('ratedGrid');
  if (!grid) return;
  const rated = sortMovies(Object.values(state.movies || {}).filter(m => Number(m.rating || 0) > 0).filter(matchesGlobalFilters), 'rating-desc');
  updateAiTagButton();
  const count = document.getElementById('ratedCount');
  if (count) count.textContent = rated.length ? `${rated.length} titles` : 'none yet';
  grid.innerHTML = '';
  if (!rated.length) { grid.innerHTML = `<div class="empty-state"><div class="icon">★</div><h3>Nothing Rated Yet</h3></div>`; return; }
  rated.forEach(m => grid.appendChild(buildCard(m, { showEdit:true })));
}

function renderWatchlist() {
  const grid = document.getElementById('watchlistGrid');
  const watchlist = sortMovies(Object.values(state.movies).filter(m => m.watchlist && matchesTab(m) && matchesGlobalFilters(m)), 'title-asc');
  document.getElementById('watchlistCount').textContent = watchlist.length ? `${watchlist.length} saved` : 'nothing saved yet';
  grid.innerHTML = '';
  if (!watchlist.length) { grid.innerHTML = `<div class="empty-state"><div class="icon">+</div><h3>Nothing Saved Yet</h3></div>`; return; }
  watchlist.forEach(m => grid.appendChild(buildCard(m, { watchlistView:true })));
}


function updateVisibleSections() {
  const recMode = activeTab === 'all' || activeTab === 'movie' || activeTab === 'show';
  const ratedMode = activeTab === 'rated';
  const watchlistMode = activeTab === 'watchlist';
  const tagMode = activeTab === 'tags';

  setSectionVisibility('.normal-only', recMode);
  setSectionVisibility('.rated-only', ratedMode);
  setSectionVisibility('.watchlist-only', watchlistMode);
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

function renderPoolGrid() {
  const grid = document.getElementById('poolGrid');
  if (!grid) return;
  const rows = sortMovies(Object.values(state.movies).filter(matchesTab).filter(matchesGlobalFilters), 'rating-desc');
  const visible = rows.slice(0, poolVisibleLimit);
  document.getElementById('poolCount').textContent = rows.length ? `showing ${visible.length} of ${rows.length} titles` : 'nothing loaded';
  grid.innerHTML = '';
  if (!rows.length) { grid.innerHTML = `<div class="empty-state"><div class="icon">?</div><h3>Pool Empty</h3></div>`; return; }
  visible.forEach(m => grid.appendChild(buildCard(m, { poolView:true })));
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
  visible.forEach(m => grid.appendChild(buildCard({ ...m, _expanded:true }, { hiddenView:true })));
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
function buildCard(movie, opts={}) {
  const { rank, score, matchedTags, matchedGenres, posOverlap, genreOverlap, negativeOverlap, tasteFit, matchScore, showEdit, watchlistView, poolView, hiddenView, contextLabel, contextTag } = opts;
  const card = document.createElement('div');
  card.className = `movie-card ${isShow(movie) ? 'show-card' : 'film-card'}` + (movie.rating > 0 ? ' rated' : '');
  card.id = 'card-' + movie.id;
  const matchPct = rank ? Math.round((Number(matchScore ?? tasteFit) || 0) * 100) : 0;
  const safeId = movie.id.replace(/'/g,"\\'");
  const formatLabel = isShow(movie) ? 'Show' : 'Movie';
  const wikiUrl = wikiUrlForMovie(movie);
  const titleHtml = wikiUrl
    ? `<a class="card-title-link" href="${wikiUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${movie.title}</a>`
    : movie.title;
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
        <div class="format-row"><span class="title-format">${formatLabel}</span></div>
        ${rank?`<div class="match-percent">${matchPct}% match</div>`:''}
        <div class="card-meta">${movie.language}·${movie.country}·${movie.year||'?'}</div>
        ${rank?`<div class="match-label">${posOverlap || 0} shared tag${posOverlap===1?'':'s'}${genreOverlap?` · ${genreOverlap} genre match${genreOverlap===1?'':'es'}`:''} · ${matchPct}% weighted fit${negativeOverlap?` · ${negativeOverlap} disliked`:''}</div><div class="match-bar"><div class="match-fill" style="width:${matchPct}%"></div></div>`:''}</div>
      </div>
      ${renderStars(safeId, movie.rating || 0)}
      ${renderGenres(movie, matchedGenres)}
      ${poolView && movie.retagMessage ? `<div class="pool-card-note">${movie.retagMessage}</div>`:''}
      <div class="card-tags" id="tags-${movie.id}">${renderTagInsightChips(movie, safeId, true, matchedTags, contextTag)}</div>
      <div class="card-actions">
        <button class="card-act retag" onclick="retagMovie('${safeId}',event)">↺ re-tag</button>
        ${!showEdit?`<button class="card-act" onclick="toggleWatchlist('${safeId}',event)">${watchlistView?'remove':'watchlist'}</button>`:''}
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
  return `<div class="genre-row"><span class="genre-label">Genres</span>${genres.map(genre => `<span class="genre-chip${matched.has?.(genre) ? ' matched' : ''}">${genre}</span>`).join('')}</div>`;
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
  syncDrive();
  render();
  showToast(`Removed tag from "${movie.title}": ${tag}`, 'success');
}

function suppressTagOnMovie(movie, tag) {
  movie.suppressedTags = [...new Set([...(movie.suppressedTags || []), normaliseTagName(tag)])];
  ['tags','coreTags','plotTags','descriptorTags'].forEach(key => {
    movie[key] = (movie[key] || []).filter(t => normaliseTagName(t) !== normaliseTagName(tag));
  });
  movie.tagged = scoringTags(movie).length > 0;
  touchRecord(movie);
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
  computeTagWeights();
  saveLocalState();
  syncDrive();
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

function computeTagWeights() {
  const w={}, genres={};
  tasteEvidenceMovies().forEach(m => {
    const tags = recommendationScoringTags(m);
    if (m.rating>0) {
      const wt = m.rating-3;
      tags.forEach(t => { w[t]=(w[t]||0)+wt; });
      movieGenres(m).forEach(genre => { genres[genre]=(genres[genre]||0)+wt; });
    }
  });
  Object.entries(state.settings?.tagPreferences || {}).forEach(([tag, preference]) => {
    const normalised = normaliseTagName(tag);
    const value = Math.max(-4, Math.min(4, Number(preference || 0)));
    if (!normalised || !value) return;
    w[normalised] = (w[normalised] || 0) + value;
  });
  state.tagWeights=w;
  state.genreWeights=genres;
}

function scoreMovies() {
  computeTagWeights();
  const totalPositiveWeight=Object.entries(state.tagWeights).reduce((sum,[tag,weight])=>weight>0?sum+weight*tagSpecificity(tag):sum,0);
  const totalPositiveGenreWeight=Object.values(state.genreWeights).reduce((sum,weight)=>weight>0?sum+weight*GENRE_SCORE_FACTOR:sum,0);
  const ranked = Object.values(state.movies)
    .filter(m => m.rating===0&&scoringTags(m).length>0)
    .map(m => {
      let score=0, posOverlap=0, genreOverlap=0, negativeOverlap=0, positiveScore=0, negativePenalty=0;
      const matched=new Set();
      const matchedGenres=new Set();
      const tags = recommendationScoringTags(m);
      tags.forEach(t => {
        const w=state.tagWeights[t] || 0;
        const specificity=tagSpecificity(t);
        if (w>0) { positiveScore+=w*specificity; matched.add(t); posOverlap++; }
        else if (w<0) { negativePenalty+=Math.abs(w)*specificity*0.5; negativeOverlap++; }
      });
      movieGenres(m).forEach(genre => {
        const weight=state.genreWeights[genre] || 0;
        if (weight>0) { positiveScore+=weight*GENRE_SCORE_FACTOR; matchedGenres.add(genre); genreOverlap++; }
        else if (weight<0) { negativePenalty+=Math.abs(weight)*GENRE_SCORE_FACTOR*0.5; }
      });
      score = positiveScore - negativePenalty;
      const totalTasteWeight=totalPositiveWeight+totalPositiveGenreWeight;
      const tasteFit=totalTasteWeight?Math.max(0,Math.min(1,positiveScore/totalTasteWeight)):0;
      return { movie:m, score, matchedTags:matched, matchedGenres, posOverlap, genreOverlap, negativeOverlap, positiveScore, negativePenalty, tasteFit };
    })
    .filter(x => x.posOverlap>0&&x.positiveScore>0&&x.score>0);
  const maxOverlap = Math.max(...ranked.map(item => item.posOverlap || 0), 0);
  const maxScore = Math.max(...ranked.map(item => item.score || 0), 0);
  const maxGenreOverlap = Math.max(...ranked.map(item => item.genreOverlap || 0), 0);
  ranked.forEach(item => {
    const overlapPart = maxOverlap ? item.posOverlap / maxOverlap : 0;
    const scorePart = maxScore ? Math.max(0, Math.min(1, item.score / maxScore)) : 0;
    const genrePart = maxGenreOverlap ? item.genreOverlap / maxGenreOverlap : 0;
    const penalty = Math.min(0.25, item.negativeOverlap * 0.06);
    item.matchScore = Math.max(0, Math.min(1, overlapPart * 0.7 + scorePart * 0.25 + genrePart * 0.05 - penalty));
  });
  ranked.sort((a,b) => b.matchScore-a.matchScore||b.score-a.score||b.positiveScore-a.positiveScore||b.posOverlap-a.posOverlap||a.negativeOverlap-b.negativeOverlap||b.genreOverlap-a.genreOverlap||a.movie.title.localeCompare(b.movie.title));
  return ranked;
}

// ─────────────────────────────────────────────
// RATING
// ─────────────────────────────────────────────
async function rateMovie(id, rating) {
  const movie = state.movies[id];
  if (!movie) return;
  const currentRating = Number(movie.rating || 0);
  const clickedRating = Number(rating);
  const nextRating = currentRating === 1 && clickedRating === 1 ? 0 : clickedRating;
  movie.rating = nextRating;
  if (nextRating > 0) movie.watchlist = false;
  touchRecord(movie);
  collapseDuplicateMovies(state.movies);
  computeTagWeights();
  saveLocalState(); syncDrive(); render();
  if (nextRating > 0) {
    await retagFromStoredData(id, {
      progressLabel:'Refreshing AI tags after rating...',
      successToast:false
    });
  }
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
  computeTagWeights();
  saveLocalState(); syncDrive(); render();
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
  state.deletedMovieRecords[id] = { id, reason:'removed', at:stamp, updatedAt:stamp };
  delete state.movies[id];
  delete state.hiddenTitles[id];
  rebuildTagBrain();
  computeTagWeights();
  saveLocalState(); syncDrive(); render();
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
  computeTagWeights();
  saveLocalState(); syncDrive(); render();
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
  saveLocalState(); syncDrive(); render();
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
    const byPageId = await fetchWikiPageIdAcrossModes(wikiPageIdFromMovie(movie), modes, {ai:opts.ai !== false});
    if (byPageId && (acceptDifferentTitle || freshMatchesTitleRecord(byPageId, movie))) return byPageId;
  }

  if (urlTitle) {
    const fresh = await fetchWikiTitleAcrossModes(urlTitle, modes, diagnostics, {ai:opts.ai !== false});
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
    const fresh = await fetchWikiTitleAcrossModes(title, modes, null, {ai:opts.ai !== false});
    if (fresh && freshMatchesTitleRecord(fresh, movie, title)) return fresh;
  }

  try {
    const searchTitles = await fetchWikiSearchTitles(`${movie.title} ${movie.year || ''} ${movie.format ? 'television series' : 'film'}`);
    for (const title of searchTitles) {
      const fresh = await fetchWikiTitleAcrossModes(title, modes, null, {ai:opts.ai !== false});
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
    if (movie.storyText) {
      try {
        await applyAiTags(movie, {force:true});
      } catch(firstError) {
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
    syncDrive();
    render();
    if (opts.successToast !== false) {
      const addedTags = scoringTags(updated).filter(tag => !beforeTags.has(tag));
      showToast(addedTags.length ? `Re-tagged "${updated.title}" · +${addedTags.length} tags` : `Re-tagged "${updated.title}" · tags refreshed`, 'success');
    }
    return updated;
  } catch(err) {
    const current = state.movies[id] || movie;
    const reason = String(err?.message || current.aiTagging?.error || 'AI retag failed');
    current.needsManualUrl = false;
    current.retagStatus = 'needs-ai-tags';
    current.retagMessage = reason.includes('too few usable tags') ? `AI returned fewer than ${AI_TAG_MIN_COUNT} usable tags` : 'AI retag pending';
    saveLocalState();
    render();
    if (opts.errorToast !== false) showToast(`Could not re-tag "${current.title}": ${reason}`, 'error');
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
    syncDrive();
    showToast('Tags cleaned', 'success');
  }
  updateHKStatus(tagStatusText());
}

function countUniqueTags() { const s=new Set(); Object.values(state.movies).forEach(m=>scoringTags(m).forEach(t=>s.add(t))); return s.size; }
function countRawTags() { const s=new Set(); Object.values(state.movies).forEach(m=>rawScoringTags(m).forEach(t=>s.add(t))); return s.size; }
function tagStatusText() { return `tags: ${countUniqueTags()} · candidates: ${countRawTags()}`; }
function updateHKStatus(msg) {
  const el = document.getElementById('hkStatus');
  if (el) el.textContent = msg;
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
function renderTagBrain() {
  computeTagWeights();
  if (!state.settings.tagPreferences) state.settings.tagPreferences = {};
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
    const ws=data.weight>0?'+'+data.weight:data.weight===0?'~':data.weight;
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
  syncDrive();
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
  if (!recommendationPageActive()) stopFetching({silent:true});
  render();
  document.getElementById('tagDetail')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function toggleTagDeleteMode() {
  state.settings.tagDeleteMode=!state.settings.tagDeleteMode;
  saveSettingsState();
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
  rows.slice(0,tagDetailVisibleLimit).forEach(({movie,status})=>grid.appendChild(buildCard(movie,{hiddenView:status==='hidden',showEdit:status==='rated',poolView:status==='pool',matchedTags:new Set([selectedTag]),contextLabel:status==='rated'?'Rated':status==='hidden'?'Hidden':'In Pool',contextTag:selectedTag})));
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
function updateTopN(val) { document.getElementById('topNVal').textContent=val; state.settings.topN=parseInt(val); recVisibleLimit=Math.max(parseInt(val), REC_INFINITE_PAGE_SIZE); saveSettingsState(); renderRecs(); }
function updateMinYear(val) {
  const year = Math.max(1900, Math.min(new Date().getFullYear(), parseInt(val, 10) || 1970));
  state.settings.minYear = year;
  const input = document.getElementById('minYear');
  if (input) input.value = year;
  saveSettingsState();
  renderActiveCards();
}

async function resetAllData() {
  if (!confirm('Reset CineLens completely? This permanently clears every local and Drive title, rating, tag, hidden item, removal block and discovery position.')) return;
  stopFetching({silent:true});
  const resetAt = nowStamp();
  state.movies = {};
  state.tagWeights = {};
  state.genreWeights = {};
  state.hiddenTitles = {};
  state.wrongPicks = {};
  state.deletedMovieRecords = {};
  state.tagAliases = {};
  state.tagStats = { candidates:0, tags:0, rebuiltAt:'' };
  state.settings.tagPreferences = {};
  state.settings.titleSearch = '';
  delete state.canonicalTagStats;
  state.discoveryCursor = {};
  ensureDiscoveryCursor();
  state.poolFetched = false;
  state.meta = {...(state.meta || {}), resetAt, updatedAt:resetAt};
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
      showToast('Local data reset. Drive could not be cleared yet; reconnect and press Reset All again.', 'error');
      return;
    }
  }
  showToast('CineLens reset completely.', 'success');
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
  return Date.parse(data?.meta?.updatedAt || data?.updatedAt || '') || 0;
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

function queueSettingsSync() {
  if (!state.drive?.enabled && !state.drive?.connected && !state.drive?.accessToken) return;
  clearTimeout(settingsSyncTimer);
  settingsSyncTimer = setTimeout(() => syncDrive(false), 900);
}

function saveSettingsState() {
  touchSettings();
  saveLocalState();
  queueSettingsSync();
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
  Object.values(state.wrongPicks || {}).forEach(record => {
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
    tagAliases: state.tagAliases,
    tagStats: state.tagStats,
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
    tagAliases: d.tagAliases || {},
    tagStats,
    discoveryCursor: normaliseDiscoveryCursor(d.discoveryCursor || {})
  };
}

function mergeRecordMap(local={}, remote={}, {preferHidden=false}={}) {
  const merged = {...local};
  let localChanged = false;
  let remoteChanged = false;
  new Set([...Object.keys(local || {}), ...Object.keys(remote || {})]).forEach(key => {
    const a = local?.[key];
    const b = remote?.[key];
    if (!a && b) { merged[key] = b; localChanged = true; return; }
    if (a && !b) { remoteChanged = true; return; }
    if (!a && !b) return;
    const at = recordTimestamp(a);
    const bt = recordTimestamp(b);
    if (bt > at) { merged[key] = b; localChanged = true; }
    else if (at > bt) { remoteChanged = true; }
    else if (preferHidden && b?.hiddenAt && !a?.hiddenAt) { merged[key] = b; localChanged = true; }
  });
  return {merged, localChanged, remoteChanged};
}

function mergeRemoteData(remoteRaw={}) {
  const remote = normaliseIncomingData(remoteRaw);
  const localResetAt = Date.parse(state.meta?.resetAt || '') || 0;
  const remoteResetAt = Date.parse(remote.meta?.resetAt || '') || 0;
  if (localResetAt > remoteResetAt) {
    remote.movies = {};
    remote.hiddenTitles = {};
    remote.wrongPicks = {};
    remote.deletedMovieRecords = {};
    remote.tagAliases = {};
    remote.discoveryCursor = {};
  } else if (remoteResetAt > localResetAt) {
    state.movies = {};
    state.hiddenTitles = {};
    state.wrongPicks = {};
    state.deletedMovieRecords = {};
    state.tagAliases = {};
    state.discoveryCursor = {};
    state.meta = {...state.meta, resetAt:remote.meta.resetAt};
  }
  const remoteStamp = dataTimestamp(remote);
  const localStamp = dataTimestamp(state);
  const remoteSettingsStamp = settingsTimestamp(remote);
  const localSettingsStamp = settingsTimestamp(state);
  let localChanged = false;
  let remoteChanged = false;

  const hiddenMovieKeys = new Set(Object.keys(state.hiddenTitles || {}));
  const remoteHiddenKeys = new Set(Object.keys(remote.hiddenTitles || {}));
  const tombstoneMerge = mergeRecordMap(state.deletedMovieRecords || {}, remote.deletedMovieRecords || {});
  state.deletedMovieRecords = tombstoneMerge.merged;
  const localMovies = {...state.movies};
  const remoteMovies = {...remote.movies};
  hiddenMovieKeys.forEach(id => { delete remoteMovies[id]; });
  remoteHiddenKeys.forEach(id => { delete localMovies[id]; });
  Object.entries(state.deletedMovieRecords || {}).forEach(([id, tombstone]) => {
    const tombstoneTime = recordTimestamp(tombstone);
    if (localMovies[id] && tombstoneTime >= recordTimestamp(localMovies[id])) { delete localMovies[id]; localChanged = true; }
    if (remoteMovies[id] && tombstoneTime >= recordTimestamp(remoteMovies[id])) { delete remoteMovies[id]; remoteChanged = true; }
  });

  const movieMerge = mergeRecordMap(localMovies, remoteMovies);
  const hiddenMerge = mergeRecordMap(state.hiddenTitles || {}, remote.hiddenTitles || {}, {preferHidden:true});
  const wrongPickMerge = mergeRecordMap(state.wrongPicks || {}, remote.wrongPicks || {});
  const discoveryMerge = mergeDiscoveryCursor(state.discoveryCursor || {}, remote.discoveryCursor || {});
  state.movies = movieMerge.merged;
  state.hiddenTitles = hiddenMerge.merged;
  state.wrongPicks = wrongPickMerge.merged;
  state.tagAliases = {...(remote.tagAliases || {}), ...(state.tagAliases || {})};
  const migratedWrongPicks = migrateVisibleWrongPicks();
  Object.entries(state.movies || {}).forEach(([id, movie]) => {
    if (wrongPickMatches(movie)) {
      delete state.movies[id];
      localChanged = true;
      remoteChanged = true;
    }
  });
  Object.values(state.movies || {}).forEach(normaliseStoredTitleRecord);
  Object.values(state.hiddenTitles || {}).forEach(normaliseStoredTitleRecord);
  const collapsedMovies = collapseDuplicateMovies(state.movies);
  const collapsedHidden = collapseDuplicateMovies(state.hiddenTitles);
  state.discoveryCursor = discoveryMerge.merged;
  ensureDiscoveryCursor();
  localChanged = localChanged || tombstoneMerge.localChanged || movieMerge.localChanged || hiddenMerge.localChanged || wrongPickMerge.localChanged || discoveryMerge.localChanged || migratedWrongPicks;
  remoteChanged = remoteChanged || tombstoneMerge.remoteChanged || movieMerge.remoteChanged || hiddenMerge.remoteChanged || wrongPickMerge.remoteChanged || discoveryMerge.remoteChanged || collapsedMovies || collapsedHidden || migratedWrongPicks;

  if (remoteSettingsStamp > localSettingsStamp) {
    state.settings = {...state.settings, ...remote.settings};
    if (!state.meta) state.meta = {};
    state.meta.settingsUpdatedAt = state.settings.updatedAt || remote.meta?.settingsUpdatedAt || remote.meta?.updatedAt || '';
    localChanged = true;
  } else if (localSettingsStamp > remoteSettingsStamp) {
    remoteChanged = true;
  } else {
    state.settings = {...state.settings, ...remote.settings, updatedAt:state.settings.updatedAt || remote.settings?.updatedAt};
  }

  if (remoteStamp > localStamp) {
    state.tagStats = remote.tagStats || state.tagStats;
    state.meta = {...state.meta, ...remote.meta};
    localChanged = true;
  } else if (localStamp > remoteStamp) {
    remoteChanged = true;
  }

  delete state.canonicalTagStats;
  ensureSyncMetadata();
  return {localChanged, remoteChanged};
}

function saveLocalState(opts={}) {
  ensureSyncMetadata({touchDataset:!opts.preserveUpdatedAt});
  try {
    const data = exportCinelensData();
    localStorage.setItem('cinelens_v2',JSON.stringify({
      ...data,
      drive:{
        enabled:state.drive.enabled,
        folderId:state.drive.folderId,
        fileId:state.drive.fileId,
        lastConnectedAt:state.drive.lastConnectedAt
      }
    }));
  } catch(e) {}
  updateStats();
}
function loadLocalState() {
  try {
    const raw=localStorage.getItem('cinelens_v2');
    if (raw) {
      const s=JSON.parse(raw);
      if (s.movies) state.movies=s.movies;
      if (s.settings) state.settings={...state.settings,...s.settings};
      state.settings.tagPreferences = state.settings.tagPreferences || {};
      if (s.hiddenTitles) state.hiddenTitles=s.hiddenTitles;
      if (s.wrongPicks) state.wrongPicks=s.wrongPicks;
      if (s.deletedMovieRecords) state.deletedMovieRecords=s.deletedMovieRecords;
      if (s.tagAliases) state.tagAliases=s.tagAliases;
      if (s.tagStats) state.tagStats=s.tagStats;
      else if (s.canonicalTagStats) state.tagStats={candidates:s.canonicalTagStats.raw||0,tags:s.canonicalTagStats.canonical||0,rebuiltAt:s.canonicalTagStats.rebuiltAt||''};
      delete state.canonicalTagStats;
      if (s.meta) state.meta={...state.meta,...s.meta};
      if (s.discoveryCursor) state.discoveryCursor=normaliseDiscoveryCursor(s.discoveryCursor);
      ensureDiscoveryCursor();
      if (s.drive) {
        state.drive.connected=false;
        state.drive.enabled=!!s.drive.enabled || !!s.drive.fileId;
        state.drive.folderId=s.drive.folderId||'';
        state.drive.fileId=s.drive.fileId||'';
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
  if (collapseDuplicateMovies(state.movies)) saveLocalState();
}

// ─────────────────────────────────────────────
// GOOGLE DRIVE
// ─────────────────────────────────────────────
const DRIVE_FILE='cinelens_data.json';
const GOOGLE_CLIENT_ID='984899607223-h5oadg1cfb7o7ksfb4400vhidknk9soc.apps.googleusercontent.com';
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
let driveTokenClient=null;
let driveRestoreInProgress=false;
let gisScriptLoading=false;
let driveSyncInProgress=false;
let driveSyncQueued=false;
const DRIVE_TOKEN_KEY='cinelens_drive_token_v1';
const DRIVE_TOKEN_EXPIRY_KEY='cinelens_drive_token_expiry_v1';


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
      await requestDriveTokenSilent();
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
  setDriveStatus('syncing');
  try {
    if (!googleIdentityReady()) await waitForGoogleIdentity();
    try {
      await requestDriveTokenSilent();
    } catch(e) {
      await requestDriveTokenInteractive();
    }
    state.drive.enabled=true;
    const fileId=state.drive.fileId||await findDriveFile();
    if (fileId) { state.drive.fileId=fileId; await loadFromDrive(); }
    else await createDriveFile();
    state.drive.connected=true;
    state.drive.lastConnectedAt=Date.now();
    saveLocalState({preserveUpdatedAt:true});
    setDriveStatus('connected');
    render();
    showToast('Drive connected','success');
  } catch(e) {
    console.error('Drive sign-in failed', e);
    state.drive.connected=false;
    setDriveStatus('');
    showToast(driveErrorMessage(e),'error');
  }
}

async function restoreDriveSession(showFailure=false) {
  if (driveRestoreInProgress) return;
  if (!state.drive.enabled || (!state.drive.fileId && !state.drive.accessToken)) return;
  driveRestoreInProgress=true;
  setDriveStatus('syncing');
  try {
    await requestDriveTokenSilent();
    if (!state.drive.fileId) state.drive.fileId=await findDriveFile();
    if (state.drive.fileId) await loadFromDrive();
    state.drive.connected=true;
    state.drive.lastConnectedAt=Date.now();
    saveLocalState({preserveUpdatedAt:true});
    setDriveStatus('connected');
  } catch(e) {
    state.drive.connected=false;
    state.drive.accessToken='';
    setDriveStatus('');
    if (showFailure) showToast(driveErrorMessage(e),'error');
  } finally {
    driveRestoreInProgress=false;
  }
}

function setDriveStatus(s) {
  document.getElementById('driveDot').className='drive-dot '+s;
  document.getElementById('driveLabel').textContent=s==='connected'?'drive connected':s==='syncing'?'syncing...':state.drive.enabled?'drive ready':'not connected';
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
function tokenRequest(prompt) {
  initDriveTokenClient();
  return new Promise((resolve,reject) => {
    driveTokenClient.callback = resp => {
      if (resp.error) { reject(resp); return; }
      state.drive.accessToken=resp.access_token;
      rememberDriveToken(resp.access_token, resp.expires_in || 3300);
      resolve(resp.access_token);
    };
    try { driveTokenClient.requestAccessToken({prompt}); }
    catch(e) { reject(e); }
  });
}
async function requestDriveTokenInteractive() {
  const stored=getStoredDriveToken();
  if (stored) { state.drive.accessToken=stored; return stored; }
  await waitForGoogleIdentity();
  try {
    return await tokenRequest('');
  } catch(e) {
    return tokenRequest('select_account');
  }
}
async function requestDriveTokenSilent() {
  if (state.drive.accessToken) return state.drive.accessToken;
  const stored=getStoredDriveToken();
  if (stored) { state.drive.accessToken=stored; return stored; }
  await waitForGoogleIdentity();
  return tokenRequest('');
}
async function requestDriveToken(prompt='select_account') {
  return prompt === '' ? requestDriveTokenSilent() : requestDriveTokenInteractive();
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
async function findDriveFile() {
  try {
    const q=`name='${DRIVE_FILE}' and trashed=false`;
    const resp=await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&spaces=drive&fields=files(id,name,modifiedTime)`);
    const d=await resp.json();
    return d.files?.[0]?.id||null;
  } catch(e){return null;}
}
async function loadFromDrive() {
  if(!state.drive.fileId)return;
  try {
    setDriveStatus('syncing');
    const resp=await driveFetch(`https://www.googleapis.com/drive/v3/files/${state.drive.fileId}?alt=media`);
    if (!resp.ok) throw new Error('Drive load failed');
    const d=await resp.json();
    const merge = mergeRemoteData(d);
    migrateLegacyPoolItems();
    const cleaned = cleanContaminatedTags(true);
    computeTagWeights();
    saveLocalState({preserveUpdatedAt:true});
    render();
    showToast(merge.localChanged ? 'Merged with Drive' : 'Drive already in sync', 'success');
    state.drive.connected=true;
    setDriveStatus('connected');
    if (merge.remoteChanged || cleaned) await uploadDriveData();
  } catch(e){
    state.drive.connected=false;
    setDriveStatus('');
    throw e;
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
    state.drive.fileId=d.id; saveLocalState({preserveUpdatedAt:true});
  } catch(e){showToast('Drive file create failed','error');}
}
async function syncDrive(manual=false) {
  if (driveSyncInProgress) {
    driveSyncQueued = true;
    return;
  }
  const finishSync = () => {
    driveSyncInProgress = false;
    if (driveSyncQueued) {
      driveSyncQueued = false;
      syncDrive(manual);
    }
  };
  driveSyncInProgress = true;
  if(!state.drive.connected&&!state.drive.accessToken){
    if(state.drive.enabled) {
      try { await restoreDriveSession(manual); }
      catch(e) { state.drive.connected=false; state.drive.accessToken=''; }
    }
    if(!state.drive.connected&&!state.drive.accessToken){ if(manual) await connectDrive(); finishSync(); return; }
  }
  if(!state.drive.fileId){await createDriveFile(); if(!state.drive.fileId){finishSync(); return;}}
  setDriveStatus('syncing');
  try {
    const remoteResp=await driveFetch(`https://www.googleapis.com/drive/v3/files/${state.drive.fileId}?alt=media`);
    if (remoteResp.ok) mergeRemoteData(await remoteResp.json());
    computeTagWeights();
    await uploadDriveData();
    state.drive.connected=true;
    state.drive.lastConnectedAt=Date.now();
    saveLocalState({preserveUpdatedAt:true});
    render();
    setDriveStatus('connected'); showToast('Synced to Drive','success');
  } catch(e){state.drive.connected=false; setDriveStatus(''); showToast(driveErrorMessage(e)||'Drive sync failed','error');}
  finally {
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
  const total = titleSearchActive()
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
