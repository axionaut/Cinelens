const stamp = '2026-07-05T00:00:00.000Z';

function extract(acclaim='positive') {
  const reception = acclaim === 'none' ? '' : acclaim === 'vague'
    ? '== Reception ==\nSeveral reviewers responded to the film after release.'
    : acclaim === 'negative'
      ? '== Reception ==\nOn Rotten Tomatoes, the film has an approval rating of 18% based on 240 reviews. Metacritic assigned a score of 32 out of 100 based on 55 reviews. It was panned by critics, who criticised the pacing and described the plot as incoherent and melodramatic.'
      : '== Reception ==\nOn Rotten Tomatoes, the film has an approval rating of 84% based on 210 reviews. Metacritic assigned a score of 72 out of 100 based on 45 reviews. The film was critically acclaimed; critics praised the performances and direction.';
  return `Lead sentence.\n\n== Plot ==\nA character faces a difficult choice and the story follows the consequences across family and work.\n\n${reception}`;
}

export default async function run(t) {
  await t.resetStorage();
  await t.openApp();

  const result = await t.page.evaluate(async (positiveExtract, vagueExtract, noneExtract) => {
    const evidence = tag => ({confidence:1, evidence:`${tag} evidence`});
    const reception = {
      positive:{version:RECEPTION_VERSION,present:true,rtScore:96,rtCount:300,mcScore:90,mcCount:60,consensus:'acclaimed',praise:['acting','direction'],criticism:[],qualitySignal:0.95,strength:1,parsedAt:'x'},
      negative:{version:RECEPTION_VERSION,present:true,rtScore:12,rtCount:220,mcScore:25,mcCount:70,consensus:'negative',praise:[],criticism:['pacing','coherence','melodrama'],qualitySignal:-0.95,strength:1,parsedAt:'x'},
      vague:{version:RECEPTION_VERSION,present:true,rtScore:null,rtCount:null,mcScore:null,mcCount:null,consensus:'',praise:[],criticism:[],qualitySignal:0,strength:0.08,parsedAt:'x'}
    };
    const make = (id, tags, rec=null, extra={}) => ({
      id, title:id, year:2024, language:'English', country:'USA', format:null,
      source:'wikipedia', storyText:`${id} story`, wikiPageId:id.replace('wiki_', ''),
      tags, coreTags:tags, plotTags:tags, descriptorTags:[], rawDescriptors:[],
      aiTagEvidence:Object.fromEntries(tags.map(tag => [tag, evidence(tag)])),
      aiTagging:{status:'verified',promptVersion:AI_TAG_PROMPT_VERSION,storyHash:aiStoryHash(`${id} story`)},
      tagged:tags.length > 0, rating:0, addedAt:'2026-01-01T00:00:00.000Z', _updatedAt:'2026-01-01T00:00:00.000Z',
      reception:rec,
      ...extra
    });
    const model = {
      baseline:3,
      tagEffects:{great:2.4, good:8.0, modest:0.25, weak:0.05, r1:0.7, r2:0.7, r3:0.7},
      genreEffects:{},
      calibrationSlope:1,
      calibrationIntercept:0
    };
    state.meta = state.meta || {};
    state.meta.receptionCalibration = {version:RECEPTION_VERSION,global:{coefficient:RECEPTION_BASELINE_COEFFICIENT,sample:0},lanes:{
      englishMovies:{coefficient:RECEPTION_BASELINE_COEFFICIENT,sample:0},
      hindiMovies:{coefficient:RECEPTION_BASELINE_COEFFICIENT,sample:0},
      englishShows:{coefficient:RECEPTION_BASELINE_COEFFICIENT,sample:0}
    }};

    const parsed = parseReceptionFromExtract(positiveExtract);
    const vague = parseReceptionFromExtract(vagueExtract);
    const none = parseReceptionFromExtract(noneExtract);
    const noEvidence = make('wiki_no_evidence', ['good']);
    const noEvidenceTaste = predictTasteFit(noEvidence, model, {tasteOnly:true});
    const noEvidenceFinal = predictTasteFit(noEvidence, model);
    const negativeHigh = make('wiki_negative_high', ['great'], reception.negative);
    const negativeTaste = predictTasteFit(negativeHigh, model, {tasteOnly:true});
    const negativeFinal = predictTasteFit(negativeHigh, model);
    const modestPositive = make('wiki_modest_positive', ['modest'], reception.positive);
    const betterTaste = make('wiki_better_taste', ['good']);
    const modestScore = predictTasteFit(modestPositive, model);
    const betterScore = predictTasteFit(betterTaste, model);
    const perfectModel = {baseline:5, tagEffects:{}, genreEffects:{}, calibrationSlope:1, calibrationIntercept:0};
    const perfectNoReception = predictTasteFit(make('wiki_perfect_no_rec', []), perfectModel);
    const perfectPositive = predictTasteFit(make('wiki_perfect_pos', [], reception.positive), perfectModel);

    getTasteModel = () => model;
    state.movies = {
      wiki_rank_bad:make('wiki_rank_bad', ['r1','r2','r3'], reception.negative),
      wiki_rank_good:make('wiki_rank_good', ['r1','r2','r3'], reception.positive),
      wiki_rank_none:make('wiki_rank_none', ['r1','r2','r3'])
    };
    state.hiddenTitles = {};
    state.settings = {...state.settings, minYear:1970, languageFilter:'all', genreFilter:'all', ratingFilter:'all', sortMode:'recommended', tagPreferences:{}};
    state.rollingPoolExclusions = {};
    scoredMovieCache = null;
    const ranked = scoreMovies();
    const status = recommendationFetchStatus(ranked);
    for (let i = 0; i < 95; i++) {
      const id = `wiki_pool_${i}`;
      state.movies[id] = make(id, ['r1','r2','r3'], i === 94 ? reception.negative : null);
    }
    state.movies.wiki_pool_keep = make('wiki_pool_keep', ['r1','r2','r3'], reception.positive);
    const rotation = pruneRollingCandidatePool({reason:'harness'});

    const rated = make('wiki_rated', ['good'], reception.negative, {rating:5});
    const recEquivalent = make('wiki_equiv', ['good'], reception.negative);
    const looRated = predictTasteFit(rated, model);
    const looRec = predictTasteFit(recEquivalent, model);

    const calibrationMovies = {};
    for (let i = 0; i < 14; i++) calibrationMovies[`wiki_cal_g_${i}`] = make(`wiki_cal_g_${i}`, ['good'], reception.positive, {rating:5});
    state.movies = calibrationMovies;
    let calibration = updateReceptionCalibration();
    const belowGlobal = laneCoefficient('englishMovies', calibration);
    state.movies.wiki_cal_g_14 = make('wiki_cal_g_14', ['good'], reception.positive, {rating:5});
    calibration = updateReceptionCalibration();
    const pooled = laneCoefficient('englishMovies', calibration);
    for (let i = 15; i < 25; i++) state.movies[`wiki_cal_g_${i}`] = make(`wiki_cal_g_${i}`, ['good'], reception.positive, {rating:5});
    calibration = updateReceptionCalibration();
    const lane = laneCoefficient('englishMovies', calibration);

    state.movies = {
      wiki_doc:make('wiki_doc', ['great'], reception.positive, {genres:['documentary']}),
      wiki_hidden:make('wiki_hidden', ['great'], reception.positive)
    };
    state.hiddenTitles = {wiki_hidden:state.movies.wiki_hidden};
    delete state.movies.wiki_hidden;
    scoredMovieCache = null;
    const excluded = scoreMovies().filter(item => recommendableTitle(item.movie)).map(item => item.movie.id);

    state.movies = {wiki_old:make('wiki_old', ['good'], null), wiki_rate:make('wiki_rate', ['good'], null)};
    scoredMovieCache = null;
    const oldScore = predictTasteFit(state.movies.wiki_old, model);
    rateMovie('wiki_rate', 4);

    return {
      parsed, vague, none,
      noEvidenceDelta:Math.abs(noEvidenceFinal.predictedRating - noEvidenceTaste.predictedRating),
      negativeDrop:negativeTaste.predictedRating - negativeFinal.predictedRating,
      modestScore:modestScore.predictedRating,
      betterScore:betterScore.predictedRating,
      perfectNoReception:perfectNoReception.matchScore,
      perfectPositive:perfectPositive.matchScore,
      ranked:ranked.map(item => ({id:item.movie.id, score:item.matchScore})),
      statusStrong:status.strongCount,
      rotation,
      evictedBad:!state.movies.wiki_pool_94,
      looDelta:Math.abs(looRated.predictedRating - looRec.predictedRating),
      belowGlobal, pooled, lane, calibration,
      excluded,
      oldScore:oldScore.matchScore,
      v5Rating:state.movies.wiki_rate.rating,
      version:String(APP_VERSION)
    };
  }, extract('positive'), extract('vague'), extract('none'));

  t.assert(result.parsed.rtScore === 84 && result.parsed.rtCount === 210 && result.parsed.mcScore === 72 && result.parsed.mcCount === 45 && result.parsed.consensus === 'acclaimed' && result.parsed.praise.includes('acting') && result.parsed.qualitySignal > 0.4 && result.parsed.strength > 0.7, 'reception extraction captures aggregators, consensus, praise and strong positive signal', JSON.stringify(result.parsed));
  t.assert(result.vague.present && result.vague.strength > 0 && result.vague.strength < 0.2, 'vague reception stays low strength', JSON.stringify(result.vague));
  t.assert(!result.none.present && result.none.strength === 0, 'missing reception is present:false with zero strength', JSON.stringify(result.none));
  t.assert(result.noEvidenceDelta < 0.0001, 'no reception evidence is neutral below cap', String(result.noEvidenceDelta));
  t.assert(result.negativeDrop > 0.7, 'strong negative reception pulls high taste fit down meaningfully', String(result.negativeDrop));
  t.assert(result.modestScore > 3.2 && result.modestScore < result.betterScore, 'positive reception lifts modestly without leapfrogging clearly better taste fit', JSON.stringify({modest:result.modestScore, better:result.betterScore}));
  t.assert(result.perfectNoReception < 1 && result.perfectPositive === 1, '100 percent is reserved for positive corroborated perfect taste fit', JSON.stringify({none:result.perfectNoReception, positive:result.perfectPositive}));
  t.assert(result.ranked[0]?.id === 'wiki_rank_good' && result.statusStrong >= 1 && result.evictedBad, 'rank, strong count and rolling eviction use reception-adjusted scores', JSON.stringify({ranked:result.ranked, strong:result.statusStrong, rotation:result.rotation, evictedBad:result.evictedBad}));
  t.assert(result.looDelta < 0.0001, 'leave-one-out rated card uses the same reception shift as recommendation card', String(result.looDelta));
  t.assert(result.belowGlobal === 0.9 && result.pooled >= 0.25 && result.lane >= 0.25 && result.lane <= 1.1 && result.calibration.global.sample >= 15 && result.calibration.lanes.englishMovies.sample >= 25, 'calibration thresholds and clamps behave as specified', JSON.stringify({belowGlobal:result.belowGlobal, pooled:result.pooled, lane:result.lane, calibration:result.calibration}));
  t.assert(!result.excluded.includes('wiki_doc') && !result.excluded.includes('wiki_hidden'), 'glowing reception does not resurrect excluded or hidden titles', JSON.stringify(result.excluded));
  t.assert(result.oldScore > 0 && result.v5Rating === 4 && result.version === '6', 'old records, v5 scoped rating and version 6 render path remain compatible', JSON.stringify({oldScore:result.oldScore, rating:result.v5Rating, version:result.version}));
}
