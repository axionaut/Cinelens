// v127 — Drive repair distrusts stale local transfer hashes.
export default async function run(t) {
  await t.resetStorage();
  await t.page.goto('/');
  await t.sleep(300);
  const result = await t.page.evaluate(async () => {
    const remoteMovie = {id:'repair-1',title:'Recovered',rating:0,source:'wikipedia',sourceShed:true,
      tags:['friendship'],coreTags:['friendship'],tagged:true,
      aiTagging:{status:'verified',promptVersion:AI_TAG_PROMPT_VERSION,storyHash:'saved'}};
    const key = driveChunkKey(remoteMovie);
    const remotePayload = {schema:DRIVE_SYNC_MODEL_V2,chunk:key,movies:{'repair-1':remoteMovie}};
    const remoteHash = driveHash(remotePayload);
    state.movies = {'repair-1':{...remoteMovie,tags:[],coreTags:[],tagged:false,aiTagging:null}};
    state.meta = {legacyTagRecoveryVersion:2,driveChunkHashes:{[key]:remoteHash},driveProfileHash:'same-profile'};
    state.drive.manifestFileId = 'manifest';
    const manifest = {schema:DRIVE_SYNC_MODEL_V2,profile:{id:'profile',hash:'same-profile'},
      chunks:{[key]:{id:'chunk',hash:remoteHash,count:1}}};
    const originalRead = readDriveJson;
    let chunkReads = 0;
    readDriveJson = async id => {
      if (id === 'chunk') { chunkReads++; return remotePayload; }
      return {schema:DRIVE_SYNC_MODEL_V2,settings:{},personalTitles:{'repair-1':{rating:0}},
        hiddenTitles:{},wrongPicks:{},deletedMovieRecords:{},unblockedTitleRecords:{},meta:{legacyTagRecoveryVersion:2}};
    };
    try {
      const loaded = await loadFromChunkedDrive(manifest,{preferDrive:true});
      return {version:String(APP_VERSION),recoveryVersion:LEGACY_TAG_RECOVERY_VERSION,
        chunkReads,changedKeys:loaded.changedKeys,tags:state.movies['repair-1']?.tags || [],
        recoveryPending:legacyTagRecoveryPending()};
    } finally { readDriveJson = originalRead; }
  });
  console.log(JSON.stringify(result, null, 2));
  t.equal(result.version, '127', 'release version is current');
  t.equal(result.recoveryVersion, 3, 'incident recovery advances beyond the stale v2 marker');
  t.equal(result.chunkReads, 1, 'authoritative startup rereads a chunk despite equal cached hashes');
  t.equal(result.changedKeys.length, 1, 'the repair chunk participates in restore');
  t.deepEqual(result.tags, ['friendship'], 'Drive catalogue data replaces damaged local records');
  t.assert(result.recoveryPending, 'revision recovery remains pending after the authoritative read');
}
