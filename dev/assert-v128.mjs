// v128 — Google token renewal must perform a real Drive restore.
export default async function run(t) {
  await t.resetStorage();
  await t.page.goto('/');
  await t.sleep(300);
  const result = await t.page.evaluate(async () => {
    const originalToken = requestDriveTokenSilent;
    const originalRestore = restoreDriveSession;
    const originalFlush = flushPendingDriveSync;
    const originalBlocked = silentDriveRenewalBlocked;
    const originalLastAttempt = driveSilentRenewLastAttemptAt;
    state.drive.enabled = true;
    libraryWritesUnlocked = true;
    let restoreCalls = 0;
    let flushCalls = 0;
    requestDriveTokenSilent = async () => { state.drive.accessToken='fresh-token'; return 'fresh-token'; };
    silentDriveRenewalBlocked = () => false;
    driveSilentRenewLastAttemptAt = 0;
    restoreDriveSession = async () => {
      restoreCalls++;
      state.drive.connected=true;
      setDriveStatus('connected');
      return true;
    };
    flushPendingDriveSync = () => { flushCalls++; };
    const succeeded = await silentlyRenewDriveToken();
    const successStatus = driveStatusState;

    state.drive.connected=false;
    setDriveStatus('');
    driveSilentRenewLastAttemptAt = 0;
    restoreDriveSession = async () => { restoreCalls++; return false; };
    const failed = await silentlyRenewDriveToken();
    const failedStatus = driveStatusState;

    requestDriveTokenSilent = originalToken;
    restoreDriveSession = originalRestore;
    flushPendingDriveSync = originalFlush;
    silentDriveRenewalBlocked = originalBlocked;
    driveSilentRenewLastAttemptAt = originalLastAttempt;
    return {version:String(APP_VERSION),succeeded,failed,restoreCalls,flushCalls,
      successStatus,failedStatus,connectedAfterFailure:state.drive.connected,
      restoreGuardAllowsEnabledOnly:/if \(!state\.drive\.enabled\) return false/.test(restoreDriveSession.toString())};
  });
  console.log(JSON.stringify(result, null, 2));
  t.equal(result.version, '128', 'release version is current');
  t.equal(result.succeeded, true, 'silent renewal succeeds only after restore');
  t.equal(result.restoreCalls, 2, 'every renewed token attempts catalogue restore');
  t.equal(result.flushCalls, 1, 'pending writes flush only after successful restore');
  t.equal(result.successStatus, 'connected', 'successful restore may report connected');
  t.equal(result.failed, false, 'a no-op restore fails the renewal');
  t.equal(result.failedStatus, '', 'failed restore cannot retain Backed up status');
  t.equal(result.connectedAfterFailure, false, 'failed restore leaves Drive disconnected');
  t.assert(result.restoreGuardAllowsEnabledOnly, 'enabled Drive can restore without a cached token or file id');
}
