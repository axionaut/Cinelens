// v130 — recovered chunks update the visible library immediately.
export default async function run(t) {
  await t.resetStorage();
  await t.page.goto('/');
  await t.sleep(300);
  const result = await t.page.evaluate(async () => {
    const makeCurrent=(id,year) => ({id,title:`Title ${id}`,year,language:'English',source:'wikipedia',storyText:`Story evidence ${id}`,tags:[],tagged:false});
    const a=makeCurrent('a',2001); const b=makeCurrent('b',2011);
    const previous=current => ({...current,tags:['friendship-bond'],coreTags:['friendship-bond'],tagged:true,
      aiTagEvidence:{'friendship-bond':{confidence:.9,evidence:current.storyText}},
      aiTagging:{status:'verified',promptVersion:AI_TAG_PROMPT_VERSION,storyHash:aiStoryHash(aiTagSourceText(current))}});
    state.movies={a,b};
    const fixtures={
      [driveChunkKey(a)]:[{movies:{a:previous(a)}}],
      [driveChunkKey(b)]:[{movies:{b:previous(b)}}]
    };
    legacyTagRecoveryInProgress=true;
    legacyTagRecoveryPublishedIds=new Set();
    legacyTagRecoveryProgress={phase:'backup',totalChunks:0,completedChunks:0,checkedRevisions:0,recoveredTitles:0,currentChunk:'',startedAt:Date.now(),lastActivityAt:Date.now()};
    const originalRender=render;
    let renders=0;
    render=() => { renders++; updateStats(); };
    const recovered=await recoverTagsFromDriveRevisions({revisionDatasets:fixtures});
    render=originalRender;
    state.meta.legacyTagRecoveryVersion=LEGACY_TAG_RECOVERY_VERSION;
    state.meta.legacyTagRecoveryCount=recovered.size;
    state.meta.legacyTagRecoveryChunks=legacyTagRecoveryProgress.totalChunks;
    state.meta.legacyTagRecoveryRevisions=legacyTagRecoveryProgress.checkedRevisions;
    legacyTagRecoveryInProgress=false;
    return {version:String(APP_VERSION),recovered:recovered.size,renders,published:legacyTagRecoveryPublishedIds.size,
      visibleTagged:document.getElementById('statTagged').textContent,resultText:legacyTagRecoveryResultText()};
  });
  console.log(JSON.stringify(result, null, 2));
  t.equal(result.version, '130', 'release version is current');
  t.equal(result.recovered, 2, 'both recoverable titles are restored');
  t.equal(result.published, 2, 'restored IDs are checkpointed exactly once');
  t.assert(result.renders >= 1, 'recovery repaints before the full scan finishes');
  t.equal(result.visibleTagged, '2', 'the Tagged counter updates during recovery');
  t.assert(result.resultText.includes('2 titles restored from 2 revisions across 2 chunks'), 'final recovery evidence remains visible');
}
