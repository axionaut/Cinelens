// v126 — cached recommendations/tags survive Gemini maintenance.
export default async function run(t) {
  await t.resetStorage();
  await t.page.goto('/');
  await t.sleep(300);
  const result = await t.page.evaluate(() => {
    const stale = {id:'cached-1',title:'Cached title',rating:5,
      tags:['friendship','coming-of-age'],coreTags:['friendship','coming-of-age'],tagged:true,
      aiTagging:{status:'verified',promptVersion:'older-prompt',storyHash:'older-hash'}};
    state.movies = {[stale.id]:stale};
    state.meta = {aiRateLimitUntil:Date.now() + 60000};
    state.settings.tagPreferences = {friendship:2};
    const before = JSON.stringify(stale.tags);
    const usableDuringCooldown = hasUsableStoredTags(stale);
    const currentDuringCooldown = hasCurrentAiTags(stale);
    state.movies = {a:{...stale,id:'a'},b:{...stale,id:'b'},c:{...stale,id:'c'}};
    const personalized = personalizedEnough();
    delete state.meta.aiTagMigrationVersion;
    const migrated = purgeLegacyTagsForAi();
    const after = JSON.stringify(state.movies.a.tags);
    const preferences = JSON.stringify(state.settings.tagPreferences);
    recVisibleLimit = 6200; poolVisibleLimit = 6200; activeTab = 'movie';
    setTab('show', null);
    return {version:String(APP_VERSION),before,after,preferences,migrated,
      usableDuringCooldown,currentDuringCooldown,personalized,recVisibleLimit,poolVisibleLimit};
  });
  console.log(JSON.stringify(result, null, 2));
  t.equal(result.version, '126', 'release version is current');
  t.assert(result.usableDuringCooldown, 'persisted tags stay usable during cooldown');
  t.equal(result.currentDuringCooldown, false, 'stale tags remain background refresh debt');
  t.assert(result.personalized, 'cached tags keep personalization ready');
  t.assert(result.migrated, 'a missing legacy marker is repaired');
  t.equal(result.after, result.before, 'repairing the marker does not clear tags');
  t.equal(result.preferences, '{"friendship":2}', 'repairing the marker preserves preferences');
  t.equal(result.recVisibleLimit, 20, 'tab switch resets recommendation paging');
  t.equal(result.poolVisibleLimit, 80, 'tab switch resets pool paging');
}
