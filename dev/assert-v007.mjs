const stamp = '2026-07-05T00:00:00.000Z';

function profile(drive={enabled:false}) {
  return {
    meta:{updatedAt:stamp, aiTagMigrationVersion:1},
    settings:{topN:10, minYear:1970, languageFilter:'all', genreFilter:'all', ratingFilter:'all', sortMode:'recommended', titleSearch:'', tagPreferences:{}},
    drive:{enabled:!!drive.enabled, folderId:'', fileId:drive.fileId || '', manifestFileId:drive.manifestFileId || '', lastConnectedAt:0},
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

function movie(id, tags=['good'], extra={}) {
  return {
    id,
    title:id,
    wikiTitle:id,
    pageTitle:id,
    year:2024,
    language:'English',
    country:'USA',
    director:'Harness',
    source:'wikipedia',
    storyText:`${id} story text with enough narrative detail for the harness.`,
    wikiPageId:id.replace(/^wiki_/, ''),
    tags,
    coreTags:tags,
    plotTags:tags,
    descriptorTags:[],
    rawDescriptors:[],
    aiTagEvidence:Object.fromEntries(tags.map(tag => [tag, {confidence:1, evidence:`${tag} evidence`}])) ,
    tagged:tags.length > 0,
    rating:0,
    addedAt:stamp,
    _updatedAt:stamp,
    ...extra
  };
}

export default async function run(t) {
  await t.resetStorage();
  await t.seedIndexedDb({movies:{wiki_seed:movie('wiki_seed', ['good'], {rating:5})}, profile:profile()});
  await t.openApp();

  const cardResult = await t.page.evaluate(() => {
    const rec = {version:RECEPTION_VERSION,present:true,rtScore:90,rtCount:100,mcScore:null,mcCount:null,consensus:'acclaimed',praise:['acting'],criticism:[],qualitySignal:0.8,strength:0.9,parsedAt:'x'};
    const withReception = {id:'wiki_hint_yes', title:'Hint Yes', year:2024, language:'English', country:'USA', storyText:'story', tags:['good'], coreTags:['good'], plotTags:['good'], tagged:true, reception:rec};
    const withoutReception = {...withReception, id:'wiki_hint_no', title:'Hint No', reception:null};
    const noOverlap = {...withReception, id:'wiki_hint_fallback', title:'Hint Fallback'};
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    mount.appendChild(buildCard(withReception, {matchScore:0.82,tasteFit:0.82,predictedRating:4.3,posOverlap:2,matchedTags:new Set(['good'])}));
    mount.appendChild(buildCard(withoutReception, {matchScore:0.82,tasteFit:0.82,predictedRating:4.3,posOverlap:2,matchedTags:new Set(['good'])}));
    mount.appendChild(buildCard(noOverlap, {matchScore:0.2,tasteFit:0.2,predictedRating:1.8,posOverlap:0,matchedTags:new Set()}));
    const cards = [...mount.querySelectorAll('.movie-card')];
    return {
      labels:cards.map(card => card.querySelector('.match-label')?.textContent || ''),
      percentCount:cards[0].querySelectorAll('.match-percent').length,
      barCount:cards[0].querySelectorAll('.match-bar').length
    };
  });
  t.assert(cardResult.labels[0].includes('reception-aware') && !cardResult.labels[1].includes('reception-aware') && !cardResult.labels[2].includes('reception-aware'), 'hint appears only for usable reception on positive-overlap match line', JSON.stringify(cardResult.labels));
  t.assert(cardResult.percentCount === 1 && cardResult.barCount === 1, 'single score UI remains one percent and one bar', JSON.stringify({percent:cardResult.percentCount, bar:cardResult.barCount}));

  const backfillResult = await t.page.evaluate(async (baseMovie) => {
    const rec = {version:RECEPTION_VERSION,present:true,rtScore:88,rtCount:90,mcScore:null,mcCount:null,consensus:'positive',praise:['writing'],criticism:[],qualitySignal:0.7,strength:0.8,parsedAt:'x'};
    state.settings = {...state.settings, minYear:1970, languageFilter:'all', genreFilter:'all', ratingFilter:'all', sortMode:'recommended', tagPreferences:{}};
    state.movies = {
      wiki_low: {...baseMovie, id:'wiki_low', title:'Low', tags:['weak'], coreTags:['weak'], plotTags:['weak']},
      wiki_high: {...baseMovie, id:'wiki_high', title:'High', tags:['great'], coreTags:['great'], plotTags:['great']},
      wiki_rated: {...baseMovie, id:'wiki_rated', title:'Rated', rating:5},
      wiki_other: {...baseMovie, id:'wiki_other', title:'Other', tags:[], coreTags:[], plotTags:[], tagged:false}
    };
    state.hiddenTitles = {};
    getTasteModel = () => ({baseline:3, tagEffects:{great:1.5, good:0.4, weak:0.1}, genreEffects:{}, calibrationSlope:1, calibrationIntercept:0});
    invalidateTasteModel();
    const order = receptionBackfillCandidates().map(item => item.id);

    fetchWikiMovieByPageId = async (pageId) => {
      if (pageId === 'fail') throw new Error('fixture failure');
      return {...baseMovie, id:`wiki_${pageId}`, wikiPageId:pageId, reception:rec};
    };
    state.movies = {
      wiki_fail:{...baseMovie, id:'wiki_fail', title:'Fail', wikiPageId:'fail'},
      wiki_ok:{...baseMovie, id:'wiki_ok', title:'Okay', wikiPageId:'ok'}
    };
    await runReceptionBackfill();
    const forward = {
      failAttempt:!!state.movies.wiki_fail.receptionBackfillAttemptedAt,
      okFilled:!!state.movies.wiki_ok.reception
    };

    state.movies = {wiki_stop:{...baseMovie, id:'wiki_stop', title:'Stop', wikiPageId:'stop'}};
    autoFetchPaused = false;
    stopFetching({silent:true});
    scheduleReceptionBackfill(0);
    await new Promise(resolve => setTimeout(resolve, 300));
    const stopResult = {
      filled:!!state.movies.wiki_stop.reception,
      poolStopped:autoFetchPaused && !poolExpansionInProgress
    };

    state.movies = {
      wiki_need_one:{...baseMovie, id:'wiki_need_one', title:'Need One'},
      wiki_need_two:{...baseMovie, id:'wiki_need_two', title:'Need Two'}
    };
    updateLibraryHealth();
    const visible = document.getElementById('maintenanceHealth')?.textContent || '';
    Object.values(state.movies).forEach(movie => { movie.reception = rec; });
    updateLibraryHealth();
    const hidden = document.getElementById('maintenanceHealth')?.textContent || '';
    return {order, forward, stopResult, visible, hidden};
  }, movie('wiki_base', ['good']));
  t.assert(backfillResult.order[0] === 'wiki_rated' && backfillResult.order[1] === 'wiki_high', 'backfill priority is rated first, then high-fit recommendation candidates', JSON.stringify(backfillResult.order));
  t.assert(backfillResult.forward.failAttempt && backfillResult.forward.okFilled, 'failed backfill stamps backoff and does not block later title', JSON.stringify(backfillResult.forward));
  t.assert(backfillResult.stopResult.filled && backfillResult.stopResult.poolStopped, 'Stop Fetching does not freeze reception backfill but keeps pool stopped', JSON.stringify(backfillResult.stopResult));
  t.assert(backfillResult.visible.includes('2 titles need quality data') && !backfillResult.hidden.includes('need quality data'), 'maintenance line shows quality-data count only while work remains', JSON.stringify({visible:backfillResult.visible, hidden:backfillResult.hidden}));

  await t.resetStorage();
  await t.page.command('Page.addScriptToEvaluateOnNewDocument', {source:`
    (() => {
      window.__drivePrompts = [];
      window.google = {accounts:{oauth2:{initTokenClient() {
        const client = {callback:null, requestAccessToken(opts={}) {
          window.__drivePrompts.push(opts.prompt || '');
          setTimeout(() => {
            if ((opts.prompt || '') === 'none') client.callback && client.callback({error:'interaction_required'});
            else client.callback && client.callback({access_token:'interactive-token', expires_in:3600});
          }, 0);
        }};
        return client;
      }}}};
    })();
  `});
  await t.seedIndexedDb({movies:{wiki_seed:movie('wiki_seed', ['good'], {rating:5})}, profile:profile()});
  await t.openApp();
  const driveResult = await t.page.evaluate(async () => {
    window.__drivePrompts = [];
    window.google = {accounts:{oauth2:{initTokenClient() {
      const client = {callback:null, requestAccessToken(opts={}) {
        window.__drivePrompts.push(opts.prompt || '');
        setTimeout(() => {
          if ((opts.prompt || '') === 'none') client.callback && client.callback({error:'interaction_required'});
          else client.callback && client.callback({access_token:'interactive-token', expires_in:3600});
        }, 0);
      }};
      return client;
    }}}};
    driveTokenClient = null;
    state.drive.enabled = true;
    state.drive.manifestFileId = 'manifest-1';
    state.drive.connected = false;
    state.drive.accessToken = '';
    restoreDriveSession(false, {preferDrive:true});
    await new Promise(resolve => setTimeout(resolve, 80));
    const startupPrompts = [...(window.__drivePrompts || [])];
    const renderedTitle = state.movies.wiki_seed?.title || '';
    const driveLabel = document.getElementById('driveLabel')?.textContent || '';
    findDriveManifest = async () => null;
    findDriveFile = async () => '';
    syncChunkedDrive = async () => {};
    connectDrive();
    await new Promise(resolve => setTimeout(resolve, 80));
    const afterConnect = [...window.__drivePrompts];
    window.__drivePrompts.length = 0;
    localStorage.setItem(DRIVE_TOKEN_KEY, 'stored-token');
    localStorage.setItem(DRIVE_TOKEN_EXPIRY_KEY, String(Date.now() + 600000));
    state.drive.accessToken = '';
    await requestDriveTokenSilent();
    const storedPrompts = [...window.__drivePrompts];
    return {startupPrompts, afterConnect, storedPrompts, renderedTitle, driveLabel};
  });
  t.assert(driveResult.startupPrompts.includes('none') && !driveResult.startupPrompts.includes('') && !driveResult.startupPrompts.includes('select_account'), 'startup silent auth uses prompt none without interactive prompt', JSON.stringify(driveResult.startupPrompts));
  t.assert(driveResult.renderedTitle === 'wiki_seed' && /drive ready|not connected/i.test(driveResult.driveLabel), 'silent auth failure degrades quietly while local cache renders', JSON.stringify({title:driveResult.renderedTitle, label:driveResult.driveLabel}));
  t.assert(driveResult.afterConnect.includes('') || driveResult.afterConnect.includes('select_account'), 'explicit Drive connect may request interactive auth', JSON.stringify(driveResult.afterConnect));
  t.assert(driveResult.storedPrompts.length === 0, 'valid stored token short-circuits silent auth without token request', JSON.stringify(driveResult.storedPrompts));

  const regression = await t.page.evaluate(() => ({
    version:String(APP_VERSION),
    title:state.movies.wiki_seed?.title || ''
  }));
  t.assert(regression.version === '7' && regression.title === 'wiki_seed', 'app renders version 7 from seeded IndexedDB with no console errors', JSON.stringify(regression));
}
