#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HELP = `Check a deck in headless Chrome or Edge: screenshots, overflow, fonts, console errors, timing.

Usage:
  npm run verify -- <deck-folder-or-html> [--steps] [--wait 2600] [--out <folder>] [--browser <path>] [--json]

Options:
  --steps     Screenshot every reveal step, not only the final state of each slide
  --wait      Milliseconds to wait for animations before measuring (default 2600)
  --out       Output folder (default: <deck>/.verify)
  --browser   Path to Chrome, Edge or Chromium (or set DECKHAND_BROWSER)
  --json      Print the full report as JSON
`;

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const pad = (value) => String(value).padStart(2, '0');
const duration = (seconds) => `${Math.floor(Math.round(seconds) / 60)}:${pad(Math.round(seconds) % 60)}`;

function parseArgs(argv) {
  const options = { wait: 2600, steps: false, json: false, positional: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--steps') options.steps = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--wait') options.wait = Number(argv[++index]) || options.wait;
    else if (arg === '--out') options.out = argv[++index];
    else if (arg === '--browser') options.browser = argv[++index];
    else if (arg.startsWith('--')) throw new Error(`Unknown option ${arg}`);
    else options.positional.push(arg);
  }
  return options;
}

function findBrowser(explicit) {
  const local = process.env.LOCALAPPDATA;
  const candidates = [
    explicit,
    process.env.DECKHAND_BROWSER,
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    local && join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/snap/bin/chromium',
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

async function launch(browserPath) {
  const profile = mkdtempSync(join(tmpdir(), 'deckhand-verify-'));
  const child = spawn(
    browserPath,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1920,1080',
      ...(process.env.CI ? ['--no-sandbox'] : []),
      'about:blank',
    ],
    { stdio: 'ignore' }
  );
  let spawnError = null;
  child.on('error', (error) => {
    spawnError = error;
  });
  const close = async () => {
    try {
      child.kill();
    } catch {
      /* already gone */
    }
    await sleep(400);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* the profile can stay locked for a moment on Windows */
    }
  };
  try {
    const portFile = join(profile, 'DevToolsActivePort');
    let port = 0;
    for (let attempt = 0; attempt < 100 && !port && !spawnError; attempt++) {
      if (existsSync(portFile)) port = Number(readFileSync(portFile, 'utf8').split('\n')[0]) || 0;
      if (!port) await sleep(150);
    }
    if (spawnError) throw new Error(`Could not start ${browserPath}: ${spawnError.message}`);
    if (!port) throw new Error('The browser did not start a DevTools endpoint. Try another browser with --browser <path>.');
    let targets = [];
    for (let attempt = 0; attempt < 40 && !targets.length; attempt++) {
      try {
        targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).filter((target) => target.type === 'page');
      } catch {
        await sleep(150);
      }
    }
    if (!targets.length) throw new Error('No page target found in the browser.');
    return { webSocketUrl: targets[0].webSocketDebuggerUrl, close };
  } catch (error) {
    await close();
    throw error;
  }
}

async function connect(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', () => rejectOpen(new Error('Could not connect to the browser.')), { once: true });
  });
  let nextId = 1;
  let closed = false;
  const pending = new Map();
  const events = [];
  const failAll = (reason) => {
    closed = true;
    pending.forEach(({ reject, timer }) => {
      clearTimeout(timer);
      reject(new Error(reason));
    });
    pending.clear();
  };
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve: resolveSend, timer } = pending.get(message.id);
      clearTimeout(timer);
      pending.delete(message.id);
      resolveSend(message);
    } else if (message.method) {
      events.push(message);
    }
  });
  socket.addEventListener('close', () => failAll('The browser closed the connection unexpectedly.'));
  socket.addEventListener('error', () => failAll('The connection to the browser failed.'));
  const send = (method, params = {}, timeoutMs = 30000) =>
    new Promise((resolveSend, rejectSend) => {
      if (closed) {
        rejectSend(new Error('The browser connection is closed.'));
        return;
      }
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        rejectSend(new Error(`The browser did not answer ${method} within ${timeoutMs / 1000} s. Is the deck stuck in a loop?`));
      }, timeoutMs);
      pending.set(id, { resolve: resolveSend, reject: rejectSend, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.exception?.description || 'evaluation failed');
    return response.result?.result?.value;
  };
  return { send, evaluate, events, close: () => socket.close() };
}

function pageProblems(events) {
  const problems = [];
  events.forEach((event) => {
    if (event.method === 'Runtime.exceptionThrown') problems.push(`Exception: ${event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text}`);
    if (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error') problems.push(`Console error: ${event.params.args.map((arg) => arg.value ?? arg.description).join(' ')}`);
    if (event.method === 'Log.entryAdded' && event.params.entry.level === 'error') problems.push(`Browser error: ${event.params.entry.text} ${event.params.entry.url || ''}`.trim());
  });
  return [...new Set(problems)];
}

const READY = `new Promise((done) => {
  if (window.Deckhand && window.Deckhand.go && window.Deckhand.slides) return done(true);
  document.addEventListener('deckhand:ready', () => done(true), { once: true });
  setTimeout(() => done(false), 8000);
})`;

const PROBE = (index) => `(() => {
  const slide = document.querySelectorAll('.deck > .slide')[${index}];
  const deck = document.querySelector('.deck').getBoundingClientRect();
  const describe = (element) => element.tagName.toLowerCase() + (element.classList.length ? '.' + [...element.classList].filter((name) => !name.startsWith('is-') && name !== 'rise').join('.') : '');
  const overflow = new Set();
  const small = new Set();
  slide.querySelectorAll('*').forEach((element) => {
    if (element.closest('.notes, .watermark, svg, .wf, .mini-bars')) return;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (rect.right > 1890 || rect.bottom > 1050 || rect.left < deck.left + 20 || rect.top < 20) {
      overflow.add(describe(element) + ' (right ' + Math.round(rect.right) + ', bottom ' + Math.round(rect.bottom) + ')');
    }
    const ownText = [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim());
    if (ownText && parseFloat(style.fontSize) < 12) small.add(describe(element) + ' ' + style.fontSize);
  });
  const heading = slide.querySelector('h1');
  const lines = heading ? Math.round(heading.getBoundingClientRect().height / parseFloat(getComputedStyle(heading).lineHeight)) : 0;
  const images = [...slide.querySelectorAll('img')].map((image) => ({ src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0, alt: image.hasAttribute('alt') && image.alt.trim() !== '' }));
  const railTitle = document.querySelectorAll('.rl-title')[${index}];
  const railOverflow = railTitle ? railTitle.getBBox().x + railTitle.getBBox().width > 374 : false;
  return { overflow: [...overflow].slice(0, 8), small: [...small].slice(0, 6), headingLines: lines, images, railOverflow, hasNotes: !!slide.querySelector(':scope > .notes') };
})()`;

const FONTS = `(() => {
  const failed = [...document.fonts].filter((face) => face.status === 'error').map((face) => face.family);
  const root = getComputedStyle(document.documentElement);
  const missing = ['--font-display', '--font-body', '--font-mono']
    .map((token) => (root.getPropertyValue(token).split(',')[0] || '').trim().replace(/^["']|["']$/g, ''))
    .filter((family) => family && !document.fonts.check('16px "' + family + '"'));
  return { failed: [...new Set(failed)], missing };
})()`;

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP);
    return 0;
  }
  if (typeof WebSocket === 'undefined') throw new Error('Node 22 or newer is required (global WebSocket).');
  const initDir = process.env.INIT_CWD;
  const firstArg = options.positional[0] || '.';
  const baseDir = initDir && existsSync(resolve(initDir, firstArg)) ? initDir : process.cwd();
  let target = resolve(baseDir, firstArg);
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
  if (!existsSync(target)) throw new Error(`No deck found at ${target}`);
  const deckDir = dirname(target);
  const outDir = resolve(baseDir, options.out || join(deckDir, '.verify'));
  mkdirSync(outDir, { recursive: true });
  const browserPath = findBrowser(options.browser);
  if (!browserPath) throw new Error('No Chrome, Edge or Chromium found. Pass --browser <path> or set DECKHAND_BROWSER.');

  const browser = await launch(browserPath);
  let page = null;
  const errors = [];
  const warnings = [];
  const report = { deck: target, browser: browserPath, slides: [], presenter: null };
  try {
    page = await connect(browser.webSocketUrl);
    await page.send('Runtime.enable');
    await page.send('Log.enable');
    await page.send('Page.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    const url = pathToFileURL(target).href;
    await page.send('Page.navigate', { url });
    if (!(await page.evaluate(READY))) {
      const problems = pageProblems(page.events);
      throw new Error(
        problems.length
          ? `Deckhand did not start:\n  ${problems.join('\n  ')}`
          : 'Deckhand did not start. Check the script and stylesheet paths in the deck.'
      );
    }
    await sleep(600);

    const fonts = await page.evaluate(FONTS);
    fonts.failed.forEach((family) => errors.push(`Font file failed to load: ${family}`));
    fonts.missing.forEach((family) => warnings.push(`Font "${family}" is not available; a fallback font is used.`));

    const slides = await page.evaluate('window.Deckhand.slides');
    const shot = async (name) => {
      const result = await page.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(outDir, name), Buffer.from(result.result.data, 'base64'));
    };

    for (const slide of slides) {
      const number = pad(slide.index + 1);
      if (options.steps) {
        for (let step = 0; step <= slide.maxStep; step++) {
          await page.evaluate(`window.Deckhand.go(${slide.index}, ${step})`);
          await sleep(step === 0 ? options.wait : 900);
          await shot(`slide-${number}-step-${step}.png`);
        }
      } else {
        await page.evaluate(`window.Deckhand.go(${slide.index}, ${slide.maxStep})`);
        await sleep(options.wait);
        await shot(`slide-${number}.png`);
      }
      const probe = await page.evaluate(PROBE(slide.index));
      const entry = { number, title: slide.title, label: slide.label, phase: slide.phase, pos: slide.pos, steps: slide.maxStep, targetSeconds: slide.targetSeconds, spokenSeconds: Math.round(slide.spokenSeconds), ...probe, errors: [], warnings: [] };
      probe.overflow.forEach((item) => entry.errors.push(`Outside the safe area: ${item}`));
      probe.images.filter((image) => !image.loaded).forEach((image) => entry.errors.push(`Image did not load: ${image.src}`));
      probe.images.filter((image) => !image.alt).forEach((image) => entry.warnings.push(`Image without alt text: ${image.src}`));
      probe.small.forEach((item) => entry.warnings.push(`Text smaller than 12px: ${item}`));
      if (probe.headingLines > 3) entry.warnings.push(`Title wraps to ${probe.headingLines} lines; aim for 1–2 (max 3).`);
      if (probe.railOverflow) entry.warnings.push(`Rail label "${slide.label}" is too long; keep data-label under ~22 characters.`);
      if (!probe.hasNotes) entry.warnings.push('No speaker notes (<aside class="notes">).');
      if (slide.spokenSeconds > slide.targetSeconds * 1.3 + 10) entry.warnings.push(`Notes take ≈ ${duration(slide.spokenSeconds)} to say but data-time is ${duration(slide.targetSeconds)}.`);
      report.slides.push(entry);
      errors.push(...entry.errors.map((message) => `Slide ${number}: ${message}`));
      warnings.push(...entry.warnings.map((message) => `Slide ${number}: ${message}`));
    }

    await page.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 820, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${url}?view=presenter#/1` });
    await page.evaluate(READY);
    await sleep(900);
    report.presenter = await page.evaluate(`({ title: document.querySelector('.dh-p-title')?.textContent || '', runSheet: document.querySelectorAll('.dh-p-agenda li').length })`);
    if (!report.presenter.title) errors.push('The presenter view did not render a title.');
    await shot('presenter.png');

    errors.push(...pageProblems(page.events));
  } finally {
    if (page) page.close();
    await browser.close();
  }

  report.errors = [...new Set(errors)];
  report.warnings = [...new Set(warnings)];
  report.plannedSeconds = report.slides.reduce((sum, slide) => sum + slide.targetSeconds, 0);
  report.spokenSeconds = report.slides.reduce((sum, slide) => sum + slide.spokenSeconds, 0);
  writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Deck: ${relative(baseDir, target) || target}`);
    console.log(`Slides: ${report.slides.length} · planned ${duration(report.plannedSeconds)} · notes ≈ ${duration(report.spokenSeconds)} spoken\n`);
    report.slides.forEach((slide) => {
      const mark = slide.errors.length ? '✗' : slide.warnings.length ? '!' : '✓';
      console.log(`${mark} ${slide.number}  ${slide.title}  [${slide.headingLines} line${slide.headingLines === 1 ? '' : 's'}, ${slide.steps} step${slide.steps === 1 ? '' : 's'}, ${duration(slide.targetSeconds)}]`);
      slide.errors.forEach((message) => console.log(`     error: ${message}`));
      slide.warnings.forEach((message) => console.log(`     warn:  ${message}`));
    });
    const deckLevel = (list) => list.filter((message) => !message.startsWith('Slide '));
    deckLevel(report.errors).forEach((message) => console.log(`error: ${message}`));
    deckLevel(report.warnings).forEach((message) => console.log(`warn:  ${message}`));
    console.log(`\n${report.errors.length} error(s), ${report.warnings.length} warning(s). Screenshots: ${outDir}`);
    console.log('Look at every screenshot before calling the deck done.');
  }
  return report.errors.length ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`verify: ${error.message}`);
    process.exit(2);
  });
