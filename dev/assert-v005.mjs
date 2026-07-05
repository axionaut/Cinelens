const stamp = '2026-07-03T00:00:00.000Z';

function movie(id, title, extra={}) {
  return {
    id,
    title,
    wikiTitle:title,
    pageTitle:title,
    year:2024,
    language:'English',
    country:'USA',
    director:'Harness',
    source:'wikipedia',
    storyText:`${title} has enough narrative detail for deterministic smoke testing.`,
    tags:[],
    coreTags:[],
    plotTags:[],
    descriptorTags:[],
    rawDescriptors:[],
    tagged:false,
    rating:0,
    addedAt:stamp,
    _updatedAt:stamp,
    ...extra
  };
}

function profile() {
  return {
    meta:{updatedAt:stamp, aiTagMigrationVersion:1},
    settings:{topN:10, minYear:1970, languageFilter:'all', genreFilter:'all', ratingFilter:'all', sortMode:'title-asc', titleSearch:'', tagPreferences:{}},
    drive:{enabled:false, folderId:'', fileId:'', manifestFileId:'', lastConnectedAt:0},
    wrongPicks:{},
    deletedMovieRecords:{},
    rollingPoolExclusions:{},
    unblockedTitleRecords:{},
    legacyTagAliases:{},
    tagStats:{candidates:0, tags:0, rebuiltAt:''},
    tagNormalization:{version:'', lastRawTagCount:0, normalizedAt:'', model:'', error:''},
    tasteStory:{version:'cinelens-taste-story-v1', profileHash:'', title:'', story:'', generatedAt:'', status:'idle', error:''},
    discoveryCursor:{},
    poolFetched:false
  };
}

function tagPayload(prefix) {
  const tags = Array.from({length:10}, (_, index) => `${prefix}-tag-${index + 1}`);
  return {
    tags,
    evidence:Object.fromEntries(tags.map(tag => [tag, {confidence:0.9, evidence:`${tag} evidence`}]))
  };
}

async function installCollectionOverrides(page, {aiMode='success'}={}) {
  await page.evaluate((mode) => {
    if (autoExpandTimer) {
      clearTimeout(autoExpandTimer);
      autoExpandTimer = null;
    }
    libraryWritesUnlocked = true;
    autoFetchPaused = false;
    fetchAbortRequested = false;
    lastAiRequestAt = 0;
    nextDiscoveryCandidates = async () => [
      {title:'Existing Duplicate', pageid:'101', lane:{mode:'movies', key:'englishMovies', language:'English'}},
      {title:'Fresh New', pageid:'202', lane:{mode:'movies', key:'englishMovies', language:'English'}}
    ];
    fetchWikiMovie = async (title) => {
      if (title === 'Existing Duplicate') {
        return {
          id:'wiki_101',
          title:'Existing Duplicate',
          wikiTitle:title,
          pageTitle:title,
          year:2024,
          language:'English',
          country:'USA',
          director:'Harness',
          source:'wikipedia',
          storyText:'Existing Duplicate refreshed story from Wikipedia.',
          tags:[],
          coreTags:[],
          plotTags:[],
          descriptorTags:[],
          rawDescriptors:[],
          tagged:false,
          rating:0
        };
      }
      return {
        id:'wiki_202',
        title:'Fresh New',
        wikiTitle:title,
        pageTitle:title,
        year:2024,
        language:'English',
        country:'USA',
        director:'Harness',
        source:'wikipedia',
        storyText:'Fresh New story from Wikipedia.',
        tags:[],
        coreTags:[],
        plotTags:[],
        descriptorTags:[],
        rawDescriptors:[],
        tagged:false,
        rating:0
      };
    };
    fetchWikiMovieByPageId = async (pageId) => fetchWikiMovie(String(pageId) === '101' ? 'Existing Duplicate' : 'Fresh New');
    requestAiTags = async (movies) => {
      if (mode === 'throw') throw new Error('Harness AI failure');
      movies.forEach((movie, movieIndex) => {
        const prefix = movie.id === 'wiki_101' ? 'duplicate' : `fresh-${movieIndex + 1}`;
        const tags = Array.from({length:10}, (_, index) => `${prefix}-tag-${index + 1}`);
        const evidence = Object.fromEntries(tags.map(tag => [tag, {confidence:0.9, evidence:`${tag} evidence`}]));
        commitAiTagSet(movie, {tags, evidence}, 'harness-ai');
      });
      return {tagged:movies.length, failed:0};
    };
  }, aiMode);
}

async function runCollection(page, t, aiMode='success') {
  await page.evaluate(async () => {
    if (poolExpansionInProgress || autoExpandTimer) {
      stopFetching({silent:true});
      await waitForPoolIdle(10000);
    }
    if (autoExpandTimer) {
      clearTimeout(autoExpandTimer);
      autoExpandTimer = null;
    }
  });
  await installCollectionOverrides(page, {aiMode});
  await page.evaluate(async () => { await expandPool(true); });
  await page.evaluate(async () => { await waitForPoolIdle(10000); });
  await t.waitForNoPendingLocalSave();
}

export default async function run(t) {
  const unrelated = movie('wiki_303', 'Unrelated Control', {
    storyText:'',
    source:'manual'
  });

  await t.resetStorage();
  await t.seedIndexedDb({
    movies:{
      wiki_101:movie('wiki_101', 'Existing Duplicate'),
      wiki_303:unrelated
    },
    profile:profile()
  });
  await t.openApp();
  await t.waitForNoPendingLocalSave();
  const baseline = await t.readIndexedDb();
  await runCollection(t.page, t, 'success');
  let stored = await t.readIndexedDb();
  t.assert(stored.movies.wiki_101?.tags?.includes('duplicate-tag-1'), 'duplicate collection record receives AI tags through scoped save', JSON.stringify(stored.movies.wiki_101?.tags || []));
  t.assert(!!stored.movies.wiki_202, 'new collection record exists after scoped save');
  t.deepEqual(stored.movies.wiki_303, baseline.movies.wiki_303, 'unrelated IndexedDB record remains byte-identical');

  await t.resetStorage();
  await t.seedIndexedDb({
    movies:{
      wiki_101:movie('wiki_101', 'Existing Duplicate'),
      wiki_303:unrelated
    },
    profile:profile()
  });
  await t.openApp();
  await runCollection(t.page, t, 'throw');
  stored = await t.readIndexedDb();
  t.equal(stored.movies.wiki_101?.retagMessage, 'AI retry pending', 'duplicate AI failure metadata persists through scoped save');
  t.equal(stored.movies.wiki_101?.retagStatus, 'needs-ai-tags', 'duplicate AI failure status persists through scoped save');

  await t.resetStorage();
  await t.seedIndexedDb({
    movies:{wiki_101:movie('wiki_101', 'Existing Duplicate')},
    profile:profile()
  });
  await t.openApp();
  await t.waitForNoPendingLocalSave();
  await t.page.evaluate(() => { rateMovie('wiki_101', 4); });
  await t.waitForNoPendingLocalSave();
  await t.openApp();
  const rating = await t.page.evaluate(() => state.movies.wiki_101?.rating || 0);
  t.equal(rating, 4, 'scoped rating persists after reload');

  await t.resetStorage();
  await t.seedIndexedDb({
    movies:{wiki_101:movie('wiki_101', 'Existing Duplicate', {rating:5})},
    profile:profile()
  });
  await t.openApp();
  const rendered = await t.page.evaluate(() => ({
    version:document.getElementById('appVersion')?.textContent || '',
    expectedVersion:String(APP_VERSION),
    cards:document.querySelectorAll('.movie-card').length,
    title:state.movies.wiki_101?.title || ''
  }));
  t.assert(rendered.version === rendered.expectedVersion && rendered.title === 'Existing Duplicate', 'app reaches initial render from seeded IndexedDB cache with no console errors', JSON.stringify(rendered));
}
