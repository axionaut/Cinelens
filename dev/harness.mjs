import http from 'node:http';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assertionPath = process.argv[2] ? path.resolve(process.argv[2]) : '';

if (!assertionPath) {
  console.error('Usage: node dev/harness.mjs dev/assert-vNNN.mjs');
  process.exit(2);
}

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8']
]);

function chromeCandidates() {
  const env = process.env.CHROME_PATH ? [process.env.CHROME_PATH] : [];
  if (process.platform === 'win32') {
    return [
      ...env,
      path.join(process.env.PROGRAMFILES || '', 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Microsoft/Edge/Application/msedge.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft/Edge/Application/msedge.exe')
    ];
  }
  if (process.platform === 'darwin') {
    return [
      ...env,
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    ];
  }
  return [...env, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];
}

function findChrome() {
  for (const candidate of chromeCandidates()) {
    if (!candidate) continue;
    if (candidate.includes(path.sep) || candidate.includes('/')) {
      if (fssync.existsSync(candidate)) return candidate;
    } else {
      return candidate;
    }
  }
  throw new Error('Chrome executable not found. Set CHROME_PATH to the browser executable.');
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      if (url.pathname === '/__blank') {
        res.writeHead(200, {'content-type':'text/html; charset=utf-8'});
        res.end('<!doctype html><title>CineLens harness blank</title>');
        return;
      }
      const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
      const filePath = path.resolve(root, `.${decodeURIComponent(pathname)}`);
      if (!filePath.startsWith(root) || !['index.html', 'styles.css', 'app.js'].includes(path.basename(filePath))) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const body = await fs.readFile(filePath);
      res.writeHead(200, {'content-type':mimeTypes.get(path.extname(filePath)) || 'application/octet-stream'});
      res.end(body);
    } catch (error) {
      res.writeHead(500);
      res.end(String(error?.stack || error));
    }
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl:`http://127.0.0.1:${port}` });
    });
  });
}

function requestJson(url, method='GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) reject(new Error(`${method} ${url} -> ${res.statusCode}: ${data}`));
        else resolve(data ? JSON.parse(data) : {});
      });
    });
    req.on('error', reject);
    req.end();
  });
}

class WebSocketCdp {
  constructor(wsUrl) {
    this.wsUrl = new URL(wsUrl);
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Set();
  }

  async connect() {
    const key = crypto.randomBytes(16).toString('base64');
    this.socket = net.createConnection({ host:this.wsUrl.hostname, port:Number(this.wsUrl.port) });
    await once(this.socket, 'connect');
    this.socket.write([
      `GET ${this.wsUrl.pathname}${this.wsUrl.search} HTTP/1.1`,
      `Host: ${this.wsUrl.host}`,
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Key: ${key}`,
      'Sec-WebSocket-Version: 13',
      '\r\n'
    ].join('\r\n'));
    await new Promise((resolve, reject) => {
      const chunks = [];
      const onData = chunk => {
        chunks.push(chunk);
        const joined = Buffer.concat(chunks);
        const headerEnd = joined.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;
        this.socket.off('data', onData);
        const header = joined.slice(0, headerEnd).toString('utf8');
        if (!header.includes(' 101 ')) reject(new Error(`WebSocket upgrade failed: ${header.split('\r\n')[0]}`));
        this.buffer = joined.slice(headerEnd + 4);
        this.socket.on('data', data => this.readFrames(data));
        this.readFrames(Buffer.alloc(0));
        resolve();
      };
      this.socket.on('data', onData);
      this.socket.once('error', reject);
    });
  }

  readFrames(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      let length = second & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        length = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }
      const masked = !!(second & 0x80);
      const maskLength = masked ? 4 : 0;
      if (this.buffer.length < offset + maskLength + length) return;
      let payload = this.buffer.slice(offset + maskLength, offset + maskLength + length);
      if (masked) {
        const mask = this.buffer.slice(offset, offset + 4);
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      }
      this.buffer = this.buffer.slice(offset + maskLength + length);
      const opcode = first & 0x0f;
      if (opcode === 1) this.dispatch(JSON.parse(payload.toString('utf8')));
      if (opcode === 8) this.socket.end();
    }
  }

  dispatch(message) {
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message}: ${message.error.data || ''}`));
      else resolve(message.result || {});
      return;
    }
    this.handlers.forEach(handler => handler(message));
  }

  send(method, params={}, sessionId='') {
    const id = this.nextId++;
    const message = JSON.stringify({ id, method, params, ...(sessionId ? {sessionId} : {}) });
    const payload = Buffer.from(message);
    let header;
    if (payload.length < 126) {
      header = Buffer.alloc(6);
      header[1] = 0x80 | payload.length;
      header.writeUInt32BE(crypto.randomBytes(4).readUInt32BE(0), 2);
    } else {
      header = Buffer.alloc(8);
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
      header.writeUInt32BE(crypto.randomBytes(4).readUInt32BE(0), 4);
    }
    header[0] = 0x81;
    const mask = header.slice(header.length - 4);
    const masked = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
    this.socket.write(Buffer.concat([header, masked]));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  close() {
    if (this.socket) this.socket.end();
  }
}

async function launchChrome(baseUrl) {
  const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cinelens-smoke-'));
  const chrome = spawn(findChrome(), [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    '--disable-background-networking',
    '--disable-crash-reporter',
    '--disable-crashpad',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--no-first-run',
    '--no-default-browser-check',
    `${baseUrl}/__blank`
  ], { stdio:['ignore', 'ignore', 'pipe'] });

  let stderr = '';
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Chrome did not expose DevTools endpoint. ${stderr}`)), 15000);
    chrome.stderr.on('data', chunk => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    chrome.once('exit', code => reject(new Error(`Chrome exited before DevTools was ready (${code}). ${stderr}`)));
  });

  return { chrome, profileDir, wsUrl };
}

class Page {
  constructor(cdp, sessionId, baseUrl, errors) {
    this.cdp = cdp;
    this.sessionId = sessionId;
    this.baseUrl = baseUrl;
    this.errors = errors;
  }

  command(method, params={}) {
    return this.cdp.send(method, params, this.sessionId);
  }

  async goto(pathname='/') {
    const href = pathname.startsWith('http') ? pathname : `${this.baseUrl}${pathname}`;
    const loaded = new Promise(resolve => {
      const handler = message => {
        if (message.sessionId === this.sessionId && message.method === 'Page.loadEventFired') {
          this.cdp.handlers.delete(handler);
          resolve();
        }
      };
      this.cdp.handlers.add(handler);
    });
    await this.command('Page.navigate', { url:href });
    await loaded;
  }

  async evaluate(fn, ...args) {
    const expression = `(${fn})(...${JSON.stringify(args)})`;
    const result = await this.command('Runtime.evaluate', {
      expression,
      awaitPromise:true,
      returnByValue:true,
      userGesture:true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
    return result.result?.value;
  }

  async waitForFunction(fn, timeoutMs=5000, intervalMs=50) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this.evaluate(fn)) return true;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new Error('Timed out waiting for page condition');
  }
}

async function createPage(cdp, baseUrl, errors) {
  const { targetId } = await cdp.send('Target.createTarget', { url:'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten:true });
  const page = new Page(cdp, sessionId, baseUrl, errors);
  cdp.handlers.add(message => {
    if (message.sessionId !== sessionId) return;
    if (message.method === 'Runtime.exceptionThrown') errors.push(`exception: ${message.params?.exceptionDetails?.text || 'script error'}`);
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(message.params?.type)) {
      const text = (message.params.args || []).map(arg => arg.value || arg.description || '').join(' ');
      errors.push(`console.${message.params.type}: ${text}`);
    }
    if (message.method === 'Log.entryAdded' && ['error'].includes(message.params?.entry?.level)) {
      errors.push(`log.error: ${message.params.entry.text}`);
    }
  });
  await page.command('Runtime.enable');
  await page.command('Page.enable');
  await page.command('Log.enable');
  await page.command('Page.addScriptToEvaluateOnNewDocument', { source: harnessInitScript() });
  return page;
}

function harnessInitScript() {
  return `
(() => {
  const nativeFetch = window.fetch.bind(window);
  const harness = window.__CINELENS_HARNESS__ = {
    wikipedia: { responses: {}, errors: {} },
    ai: { response: null, error: '' },
    requests: []
  };
  window.fetch = async (input, init = {}) => {
    const url = String(input && input.url || input);
    harness.requests.push({ url, method:init.method || 'GET', body:String(init.body || '') });
    if (url.includes('en.wikipedia.org/w/api.php')) {
      const parsed = new URL(url);
      const key = parsed.searchParams.get('titles') || parsed.searchParams.get('pageids') || url;
      if (harness.wikipedia.errors[key]) throw new Error(harness.wikipedia.errors[key]);
      if (harness.wikipedia.responses[key]) {
        return new Response(JSON.stringify(harness.wikipedia.responses[key]), { status:200, headers:{'content-type':'application/json'} });
      }
    }
    if (url.includes('script.google.com/macros')) {
      if (harness.ai.error) throw new Error(harness.ai.error);
      const body = init.body ? JSON.parse(init.body) : {};
      const payload = typeof harness.ai.response === 'function' ? harness.ai.response(body) : harness.ai.response;
      if (payload) return new Response(JSON.stringify(payload), { status:200, headers:{'content-type':'application/json'} });
    }
    return nativeFetch(input, init);
  };
})();
`;
}

async function main() {
  const output = [];
  let server;
  let chrome;
  let cdp;
  let profileDir = '';
  let exitCode = 0;
  const errors = [];

  const api = {
    pass(message) {
      output.push(`PASS: ${message}`);
    },
    fail(message) {
      output.push(`FAIL: ${message}`);
      exitCode = 1;
    },
    assert(condition, message, detail='') {
      if (condition) this.pass(detail ? `${message} :: ${detail}` : message);
      else this.fail(detail ? `${message} :: ${detail}` : message);
    },
    equal(actual, expected, message) {
      this.assert(Object.is(actual, expected), message, `${JSON.stringify(actual)} === ${JSON.stringify(expected)}`);
    },
    deepEqual(actual, expected, message) {
      this.assert(JSON.stringify(actual) === JSON.stringify(expected), message, `${JSON.stringify(actual)} === ${JSON.stringify(expected)}`);
    },
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  };

  try {
    const started = await startServer();
    server = started.server;
    const launched = await launchChrome(started.baseUrl);
    chrome = launched.chrome;
    profileDir = launched.profileDir;
    cdp = new WebSocketCdp(launched.wsUrl);
    await cdp.connect();
    const page = await createPage(cdp, started.baseUrl, errors);

    Object.assign(api, {
      page,
      baseUrl:started.baseUrl,
      profileDir,
      consoleErrors:errors,
      async resetStorage() {
        await page.goto('/__blank');
        await page.evaluate(async () => {
          localStorage.clear();
          await new Promise(resolve => {
            const request = indexedDB.deleteDatabase('cinelens_local_v3');
            request.onsuccess = request.onerror = request.onblocked = () => resolve();
          });
        });
        errors.length = 0;
      },
      async seedIndexedDb({movies={}, hiddenTitles={}, profile={}}={}) {
        await page.goto('/__blank');
        await page.evaluate(async (payload) => {
          localStorage.setItem('cinelens_v2_bootstrap', JSON.stringify({
            schema:'cinelens-local-v3',
            settings:payload.profile.settings || {},
            drive:payload.profile.drive || {enabled:false},
            updatedAt:payload.profile.meta?.updatedAt || new Date().toISOString()
          }));
          const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('cinelens_local_v3');
            request.onupgradeneeded = () => {
              const db = request.result;
              if (!db.objectStoreNames.contains('movies')) db.createObjectStore('movies', {keyPath:'id'});
              if (!db.objectStoreNames.contains('hidden')) db.createObjectStore('hidden', {keyPath:'id'});
              if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          await new Promise((resolve, reject) => {
            const tx = db.transaction(['movies', 'hidden', 'meta'], 'readwrite');
            tx.objectStore('movies').clear();
            tx.objectStore('hidden').clear();
            Object.values(payload.movies || {}).forEach(movie => tx.objectStore('movies').put(movie));
            Object.values(payload.hiddenTitles || {}).forEach(movie => tx.objectStore('hidden').put(movie));
            tx.objectStore('meta').put(payload.profile || {}, 'profile');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
          });
          db.close();
        }, {movies, hiddenTitles, profile});
      },
      async readIndexedDb() {
        return page.evaluate(async () => {
          const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('cinelens_local_v3');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          const result = await new Promise((resolve, reject) => {
            const tx = db.transaction(['movies', 'hidden', 'meta'], 'readonly');
            const moviesReq = tx.objectStore('movies').getAll();
            const hiddenReq = tx.objectStore('hidden').getAll();
            const profileReq = tx.objectStore('meta').get('profile');
            tx.oncomplete = () => resolve({
              movies:Object.fromEntries((moviesReq.result || []).map(movie => [String(movie.id), movie])),
              hiddenTitles:Object.fromEntries((hiddenReq.result || []).map(movie => [String(movie.id), movie])),
              profile:profileReq.result || null
            });
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
          });
          db.close();
          return result;
        });
      },
      async openApp() {
        errors.length = 0;
        await page.goto(`/?smoke=${Date.now()}`);
        await page.waitForFunction(() => !!document.getElementById('appVersion')?.textContent && startupFinalized, 8000);
      },
      async waitForNoPendingLocalSave(timeoutMs=4000) {
        await page.waitForFunction(() => !localDbSaveInProgress && !localDbSaveQueued && !pendingDirtyMovieIds.size && !pendingFullSave, timeoutMs);
        await api.sleep(650);
        await page.waitForFunction(() => !localDbSaveInProgress && !localDbSaveQueued && !pendingDirtyMovieIds.size && !pendingFullSave, timeoutMs);
      }
    });

    const mod = await import(pathToFileURL(assertionPath).href);
    await (mod.default || mod.run)(api);
    if (errors.length) {
      output.push(`FAIL: page emitted fatal console/script errors :: ${errors.join(' | ')}`);
      exitCode = 1;
    }
  } catch (error) {
    output.push(`FAIL: harness error :: ${error?.stack || error}`);
    exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    if (chrome && !chrome.killed) {
      chrome.kill();
      await new Promise(resolve => chrome.once('exit', resolve));
    }
    if (server) await new Promise(resolve => server.close(resolve));
    if (profileDir) {
      let removed = false;
      let cleanupError = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          await fs.rm(profileDir, { recursive:true, force:true, maxRetries:3, retryDelay:250 });
          removed = !fssync.existsSync(profileDir);
          if (removed) break;
        } catch (error) {
          cleanupError = error;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (removed) output.push(`PASS: temporary Chrome profile removed :: ${profileDir}`);
      else {
        output.push(`FAIL: temporary Chrome profile remains :: ${profileDir}${cleanupError ? ` :: ${cleanupError.message}` : ''}`);
        exitCode = 1;
      }
    }
    output.push(exitCode ? 'FAIL: smoke harness failed' : 'PASS: smoke harness completed');
    console.log(output.join('\n'));
    process.exit(exitCode);
  }
}

main();
