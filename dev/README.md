# CineLens Smoke Harness

Run a named assertion file from the repository root:

```sh
node dev/harness.mjs dev/assert-v005.mjs
```

The harness serves the real split app (`index.html`, `styles.css`, `app.js`),
launches system Chrome headlessly with a temporary profile under the operating
system temp directory, and deletes that profile after the run. Assertion files
should contain release-specific checks only; extend `dev/harness.mjs` when a
future smoke needs more shared plumbing.
