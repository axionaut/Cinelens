// v129 — Drive revision recovery exposes measurable progress.
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
    legacyTagRecoveryProgress={phase:'backup',totalChunks:0,completedChunks:0,checkedRevisions:0,recoveredTitles:0,currentChunk:'',startedAt:Date.now(),lastActivityAt:Date.now()};
    const recovered=await recoverTagsFromDriveRevisions({revisionDatasets:fixtures});
    const status=legacyTagRecoveryProgressText();
    const stage=pipelineStages.get('drive-recovery');
    legacyTagRecoveryInProgress=false;
    pipelineStageFinished('drive-recovery');
    return {version:String(APP_VERSION),recovered:recovered.size,progress:{...legacyTagRecoveryProgress},status,
      stageRemaining:stage?.remaining,stageDetail:stage?.detail,stageClosed:!pipelineStages.has('drive-recovery')};
  });
  console.log(JSON.stringify(result, null, 2));
  t.equal(result.version, '129', 'release version is current');
  t.equal(result.recovered, 2, 'fixture restores two title tag sets');
  t.equal(result.progress.completedChunks, 2, 'completed chunk count is visible');
  t.equal(result.progress.totalChunks, 2, 'total chunk count is visible');
  t.equal(result.progress.checkedRevisions, 2, 'revision reads are counted');
  t.equal(result.progress.recoveredTitles, 2, 'restored title count is visible');
  t.assert(result.status.includes('2/2 chunks · 2 revisions · 2 titles restored'), 'maintenance text publishes recovery evidence');
  t.equal(result.stageRemaining, 0, 'progress bar reaches zero remaining chunks');
  t.assert(result.stageDetail.includes('2/2 chunks'), 'progress bar names completed recovery work');
  t.assert(result.stageClosed, 'the recovery stage can close cleanly');
}
