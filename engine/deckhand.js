(function () {
  'use strict';

  const currentScript = document.currentScript;
  const engineBase = currentScript ? currentScript.src.replace(/[^/]*$/, '') : 'engine/';
  const WORDS_PER_MINUTE = 130;
  const NOTES_SIZE_KEY = 'deckhand-notes-size';

  const pad = (value) => String(value).padStart(2, '0');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();
  const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const formatDuration = (seconds) => {
    const whole = Math.max(0, Math.round(seconds));
    return `${Math.floor(whole / 60)}:${pad(whole % 60)}`;
  };
  const truncate = (text, length) => (text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text);
  const niceStep = (raw) => {
    if (!(raw > 0)) return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    const fraction = raw / magnitude;
    return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * magnitude;
  };
  const textOf = (element) => {
    if (!element) return '';
    const copy = element.cloneNode(true);
    copy.querySelectorAll('br').forEach((lineBreak) => lineBreak.replaceWith(' '));
    return clean(copy.textContent);
  };
  const make = (tag, className, html) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (html) element.innerHTML = html;
    return element;
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Deckhand could not load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function boot() {
    const Deckhand = (window.Deckhand = window.Deckhand || {});
    if (!Deckhand.railsLoaded) await loadScript(`${engineBase}rails.js`);
    if (!Deckhand.componentsLoaded) await loadScript(`${engineBase}components.js`);
    if (document.readyState === 'loading') {
      await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }
    if (document.fonts && document.fonts.ready) {
      await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
    }
    start(Deckhand);
  }

  function start(Deckhand) {
    const params = new URLSearchParams(location.search);
    const isPresenter = params.get('view') === 'presenter';
    const deck = document.querySelector('main.deck') || document.querySelector('.deck');
    if (!deck) {
      console.error('Deckhand: add <main class="deck"> with <section class="slide"> children.');
      return;
    }
    const slides = Array.from(deck.children).filter((child) => child.classList.contains('slide'));
    const total = slides.length;
    if (!total) {
      console.error('Deckhand: the deck has no <section class="slide"> elements.');
      return;
    }

    /* ---------- slide model ---------- */

    const unit = deck.dataset.railUnit || '';
    const hasPositions = slides.some((slide) => slide.dataset.pos !== undefined);
    const firstPositioned = slides.findIndex((slide) => slide.dataset.pos !== undefined);
    const lastPositioned = slides.length - 1 - [...slides].reverse().findIndex((slide) => slide.dataset.pos !== undefined);
    let lastPos = 0;
    const info = slides.map((slide, index) => {
      let pos = slide.dataset.pos !== undefined ? Number(slide.dataset.pos) : hasPositions ? null : index;
      let phase = slide.dataset.phase;
      if (!phase) {
        if (pos !== null) phase = 'main';
        else if (index < firstPositioned) phase = 'intro';
        else if (index > lastPositioned) phase = 'outro';
        else phase = 'main';
      }
      if (phase === 'main' && pos === null) pos = lastPos;
      if (phase === 'main') lastPos = pos;
      const fragments = Array.from(slide.querySelectorAll('[data-step]'));
      const toggles = Array.from(slide.querySelectorAll('[data-when]'));
      const notes = slide.querySelector(':scope > .notes');
      const title = textOf(slide.querySelector('h1')) || `Slide ${index + 1}`;
      const spokenWords = notes
        ? clean(
            Array.from(notes.querySelectorAll('p:not(.direction), li'))
              .map((node) => node.textContent)
              .join(' ')
          ).split(' ').filter(Boolean).length
        : 0;
      let meta = slide.dataset.meta;
      if (!meta) {
        if (!hasPositions) meta = pad(index + 1);
        else if (phase === 'main') meta = `${Deckhand.formatNumber(pos)}${unit ? ` ${unit}` : ''}`;
        else meta = phase.toUpperCase();
      }
      return {
        slide,
        index,
        pos,
        phase,
        fragments,
        toggles,
        maxStep: [...fragments.map((element) => Number(element.dataset.step) || 0), ...toggles.map((element) => Number(element.dataset.when) || 0)].reduce(
          (max, value) => Math.max(max, value),
          0
        ),
        title,
        label: slide.dataset.label || truncate(title, 24),
        meta,
        ref: slide.dataset.ref || '',
        kicker: textOf(slide.querySelector('.kicker')),
        notesHtml: notes ? notes.innerHTML.trim() : '',
        spokenSeconds: (spokenWords / WORDS_PER_MINUTE) * 60,
        targetSeconds: Number(slide.dataset.time) || 60,
      };
    });

    /* ---------- DOM scaffolding ---------- */

    const railName = Deckhand.rails[deck.dataset.rail] ? deck.dataset.rail : 'none';
    const rail = Deckhand.rails[railName];
    const viewport = make('div', 'dh-viewport');
    viewport.id = 'dh-viewport';
    const stage = make('div', 'dh-stage dh-no-anim');
    stage.dataset.rail = railName;
    const railHost = make('aside', 'dh-rail');
    railHost.dataset.rail = railName;
    railHost.setAttribute('aria-hidden', 'true');
    deck.parentNode.insertBefore(viewport, deck);
    viewport.appendChild(stage);
    stage.appendChild(railHost);
    stage.appendChild(deck);

    const hud = make('div', 'dh-hud', `<span class="dh-hud-count"></span><span class="dh-hud-hint">→ next · O overview · P presenter · N notes · F fullscreen · ? help</span>`);
    hud.setAttribute('aria-hidden', 'true');
    const overview = make('div', 'dh-overlay dh-overview', `<h2>${escapeHtml(deck.dataset.overviewTitle || 'All slides')}</h2><ol class="dh-ov-list"></ol>`);
    overview.hidden = true;
    const help = make(
      'div',
      'dh-overlay dh-help',
      `<h2>Keys</h2><dl>
        <dt><kbd>→</kbd> <kbd>Space</kbd> <kbd>PgDn</kbd></dt><dd>Next reveal or slide (clickers work)</dd>
        <dt><kbd>←</kbd> <kbd>PgUp</kbd></dt><dd>Back</dd>
        <dt><kbd>P</kbd></dt><dd>Presenter window: notes, timer, next slide. Synced both ways</dd>
        <dt><kbd>N</kbd></dt><dd>Speaker notes drawer, for rehearsing on one screen</dd>
        <dt><kbd>O</kbd></dt><dd>Overview: every slide, click to jump</dd>
        <dt><kbd>F</kbd> <kbd>F5</kbd></dt><dd>Fullscreen</dd>
        <dt><kbd>B</kbd> <kbd>.</kbd></dt><dd>Blank the screen</dd>
        <dt><kbd>Home</kbd> <kbd>End</kbd></dt><dd>First / last slide</dd>
        <dt><kbd>Esc</kbd></dt><dd>Close overlays</dd>
      </dl>`
    );
    help.hidden = true;
    const notesDrawer = make(
      'div',
      'dh-notes',
      `<header><span>Speaker notes · N to hide</span><span>The audience can see this. Use P for a private presenter window.</span></header><div class="dh-notes-body"></div>`
    );
    notesDrawer.hidden = true;
    stage.append(hud, overview, help, notesDrawer);
    const blackout = make('div', 'dh-blackout');
    blackout.hidden = true;
    document.body.appendChild(blackout);

    if (deck.dataset.watermark === 'pos') {
      info.forEach((item) => {
        if (item.phase !== 'main') return;
        const mark = make('div', 'watermark', `${escapeHtml(Deckhand.formatNumber(item.pos))}${unit ? `<small>${escapeHtml(unit)}</small>` : ''}`);
        mark.setAttribute('aria-hidden', 'true');
        item.slide.appendChild(mark);
      });
    }

    (Deckhand.components || []).forEach((component) => {
      try {
        component(deck);
      } catch (error) {
        console.error('Deckhand component failed', error);
      }
    });

    const mainPositions = info.filter((item) => item.phase === 'main').map((item) => item.pos);
    const railMax = Number(deck.dataset.railMax) || Math.max(1, ...mainPositions);
    const integerPositions = mainPositions.every((value) => Number.isInteger(value));
    const autoTicks = niceStep(railMax / 5);
    const railContext = {
      slides: info,
      max: railMax,
      ticks: Number(deck.dataset.railTicks) || (integerPositions ? Math.max(1, Math.round(autoTicks)) : autoTicks),
      unit,
      caption: deck.dataset.railCaption || '',
    };
    railHost.innerHTML = rail.build(railContext);
    railHost.classList.toggle('is-compact', (1032 - 48) / Math.max(1, total - 1) < 46);
    const railLabels = Array.from(railHost.querySelectorAll('.rl'));

    const overviewList = overview.querySelector('.dh-ov-list');
    overviewList.innerHTML = info
      .map(
        (item) =>
          `<li><button type="button" class="dh-ov-row" data-index="${item.index}"><span class="dh-ov-node"></span>` +
          `<span class="dh-ov-ref">${escapeHtml(item.ref || '·······')}</span>` +
          `<span class="dh-ov-meta">${escapeHtml(item.meta)}</span>` +
          `<span class="dh-ov-title">${escapeHtml(item.title)}</span></button></li>`
      )
      .join('');

    /* ---------- state ---------- */

    let current = { index: -1, step: 0 };
    let hasRendered = false;
    let isBlackout = false;
    let timerStartedAt = null;
    let timerStartIndex = 0;
    let slideStartedAt = Date.now();
    const presenter = {};

    /* ---------- sync between audience and presenter windows ---------- */

    const peers = new Set();
    if (window.opener && window.opener !== window) peers.add(window.opener);
    let channel = null;
    try {
      channel = 'BroadcastChannel' in window ? new BroadcastChannel(`deckhand:${location.pathname}`) : null;
    } catch (error) {
      channel = null;
    }

    function send(message) {
      const payload = Object.assign({ ns: 'deckhand' }, message);
      let delivered = false;
      peers.forEach((peer) => {
        try {
          if (!peer || peer.closed) {
            peers.delete(peer);
            return;
          }
          peer.postMessage(payload, '*');
          delivered = true;
        } catch (error) {
          peers.delete(peer);
        }
      });
      if (!delivered && channel) {
        try {
          channel.postMessage(payload);
        } catch (error) {
          channel = null;
        }
      }
    }

    function reply(message, source) {
      const payload = Object.assign({ ns: 'deckhand' }, message);
      try {
        if (source) source.postMessage(payload, '*');
        else if (channel) channel.postMessage(payload);
      } catch (error) {
        peers.delete(source);
      }
    }

    function receive(data, source) {
      if (!data || data.ns !== 'deckhand') return;
      if (source && source !== window) peers.add(source);
      if (data.type === 'hello') {
        reply({ type: 'state', index: current.index, step: current.step, blackout: isBlackout }, source);
        return;
      }
      if (data.type === 'goto' || data.type === 'state') go(data.index, data.step, { remote: true });
      if (data.type === 'state' && typeof data.blackout === 'boolean') setBlackout(data.blackout, { remote: true });
      if (data.type === 'blackout') setBlackout(data.on, { remote: true });
    }

    window.addEventListener('message', (event) => receive(event.data, event.source));
    if (channel) channel.addEventListener('message', (event) => receive(event.data, null));

    const baseUrl = () => location.href.split('#')[0].split('?')[0];
    const openWindow = (query, name, features) => {
      const opened = window.open(`${baseUrl()}${query}#/${current.index + 1}/${current.step}`, name, features);
      if (opened) peers.add(opened);
    };
    const openPresenter = () => openWindow('?view=presenter', 'deckhand-presenter', 'popup=yes,width=1280,height=820');
    const openAudience = () => openWindow('', 'deckhand-audience');

    /* ---------- navigation ---------- */

    function go(index, step, options = {}) {
      const targetIndex = clamp(Number(index) || 0, 0, total - 1);
      const targetStep = clamp(Number(step) || 0, 0, info[targetIndex].maxStep);
      if (targetIndex === current.index && targetStep === current.step) return;
      const slideChanged = targetIndex !== current.index;
      current = { index: targetIndex, step: targetStep };
      if (slideChanged) onSlideChanged();
      render();
      if (!options.remote) send({ type: 'goto', index: targetIndex, step: targetStep });
      document.dispatchEvent(new CustomEvent('deckhand:change', { detail: { index: targetIndex, step: targetStep } }));
    }

    function next() {
      const item = info[current.index];
      if (current.step < item.maxStep) go(current.index, current.step + 1);
      else if (current.index < total - 1) go(current.index + 1, 0);
    }

    function prev() {
      if (current.step > 0) go(current.index, current.step - 1);
      else if (current.index > 0) go(current.index - 1, info[current.index - 1].maxStep);
    }

    function jump(index) {
      go(index, index < current.index ? info[index].maxStep : 0);
    }

    function onSlideChanged() {
      const now = Date.now();
      if (isPresenter && hasRendered && timerStartedAt === null) {
        timerStartedAt = now;
        timerStartIndex = current.index;
      }
      slideStartedAt = now;
    }

    function readHash() {
      const match = location.hash.match(/^#\/(\d+)(?:\/(\d+))?$/);
      return match ? { index: Number(match[1]) - 1, step: Number(match[2] || 0) } : null;
    }

    function writeHash() {
      const hash = `#/${current.index + 1}${current.step ? `/${current.step}` : ''}`;
      if (location.hash === hash) return;
      try {
        history.replaceState(null, '', hash);
      } catch (error) {
        location.hash = hash;
      }
    }

    window.addEventListener('hashchange', () => {
      const target = readHash();
      if (target) go(target.index, target.step);
    });

    /* ---------- rendering ---------- */

    function render() {
      const { index, step } = current;
      info.forEach((item, itemIndex) => {
        const isCurrent = itemIndex === index;
        item.slide.classList.toggle('is-current', isCurrent);
        item.slide.classList.toggle('is-past', itemIndex < index);
        item.slide.classList.toggle('is-future', itemIndex > index);
        item.slide.setAttribute('aria-hidden', String(!isCurrent));
        item.slide.inert = !isCurrent;
        const visibleStep = isCurrent ? step : itemIndex < index ? item.maxStep : 0;
        item.fragments.forEach((element) => element.classList.toggle('is-shown', Number(element.dataset.step) <= visibleStep));
        item.toggles.forEach((element) => element.classList.toggle('is-on', Number(element.dataset.when) <= visibleStep));
        for (let stepNumber = 1; stepNumber <= item.maxStep; stepNumber++) {
          item.slide.classList.toggle(`step-${stepNumber}`, stepNumber <= visibleStep);
        }
      });
      const item = info[index];
      const railPhase = item.phase === 'outro' && index === total - 1 ? 'finale' : item.phase;
      railHost.dataset.phase = railPhase;
      rail.update(railHost, { phase: railPhase, pos: item.pos, index }, railContext);
      railLabels.forEach((label, labelIndex) => {
        label.classList.toggle('is-current', labelIndex === index);
        label.classList.toggle('is-past', labelIndex < index);
        label.classList.toggle('is-future', labelIndex > index);
      });
      hud.querySelector('.dh-hud-count').innerHTML = `<b>${pad(index + 1)}</b> / ${pad(total)}`;
      overviewList.querySelectorAll('.dh-ov-row').forEach((row) => row.classList.toggle('is-current', Number(row.dataset.index) === index));
      renderNotesDrawer();
      if (isPresenter) renderPresenter();
      writeHash();
    }

    function markCues(container) {
      container.querySelectorAll('.cue').forEach((cue) => cue.classList.toggle('is-done', Number(cue.dataset.cue) <= current.step));
    }

    /* ---------- overlays ---------- */

    overviewList.addEventListener('click', (event) => {
      const row = event.target.closest('.dh-ov-row');
      if (!row) return;
      jump(Number(row.dataset.index));
      overview.hidden = true;
    });

    function toggleOverlay(target) {
      if (isPresenter) return;
      const willOpen = target.hidden;
      overview.hidden = true;
      help.hidden = true;
      target.hidden = !willOpen;
    }

    function closeOverlays() {
      const wasOpen = !overview.hidden || !help.hidden || !notesDrawer.hidden;
      overview.hidden = true;
      help.hidden = true;
      notesDrawer.hidden = true;
      return wasOpen;
    }

    function renderNotesDrawer() {
      if (notesDrawer.hidden) return;
      const body = notesDrawer.querySelector('.dh-notes-body');
      body.innerHTML = info[current.index].notesHtml || '<p class="opt">No speaker notes on this slide.</p>';
      markCues(body);
    }

    function toggleNotesDrawer() {
      if (isPresenter) return;
      notesDrawer.hidden = !notesDrawer.hidden;
      renderNotesDrawer();
    }

    function setBlackout(on, options = {}) {
      isBlackout = Boolean(on);
      if (!isPresenter) blackout.hidden = !isBlackout;
      if (presenter.blank) presenter.blank.hidden = !isBlackout;
      if (!options.remote) send({ type: 'blackout', on: isBlackout });
    }

    blackout.addEventListener('click', () => setBlackout(false));

    function toggleFullscreen() {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else document.documentElement.requestFullscreen().catch(() => {});
    }

    /* ---------- presenter view ---------- */

    function setNotesSize(size) {
      const value = clamp(size, 16, 44);
      document.documentElement.style.setProperty('--notes-size', `${value}px`);
      try {
        localStorage.setItem(NOTES_SIZE_KEY, String(value));
      } catch (error) {
        /* storage unavailable */
      }
    }

    function adjustNotesSize(delta) {
      if (!isPresenter) return;
      const size = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--notes-size')) || 26;
      setNotesSize(size + delta);
    }

    function setupPresenter() {
      document.body.classList.add('dh-presenter');
      viewport.hidden = true;
      const view = make(
        'div',
        'dh-presenter-view',
        `<header class="dh-p-top">
          <div class="dh-p-where"><span class="dh-p-num" data-p="num"></span><span class="dh-p-of">/ ${pad(total)}</span><span class="dh-p-kicker" data-p="kicker"></span></div>
          <div class="dh-p-timers">
            <div class="dh-p-timer"><span>Total</span><b data-p="total">0:00</b><i data-p="planned"></i></div>
            <div class="dh-p-timer"><span>This slide</span><b data-p="slide">0:00</b><i data-p="target"></i></div>
            <div class="dh-p-timer"><span>Pace</span><b data-p="pace">not started</b></div>
            <div class="dh-p-timer"><span>Clock</span><b data-p="clock">--:--</b></div>
            <button type="button" class="dh-p-btn" data-p="start">Start / reset timer</button>
          </div>
        </header>
        <div class="dh-p-body">
          <section class="dh-p-now"><h1 class="dh-p-title" data-p="title"></h1><p class="dh-p-step" data-p="step"></p><div class="dh-p-notes" data-p="notes"></div></section>
          <aside class="dh-p-side">
            <p class="dh-p-label">Up next</p>
            <h2 class="dh-p-next" data-p="next"></h2>
            <p class="dh-p-label" data-p="nextMeta"></p>
            <div class="dh-p-nav"><button type="button" class="dh-p-btn" data-p="prev">← Back</button><button type="button" class="dh-p-btn" data-p="forward">Next →</button></div>
            <div class="dh-p-tools"><button type="button" class="dh-p-btn" data-p="audience">Open audience window</button><button type="button" class="dh-p-btn" data-p="black">Blank screen</button></div>
            <p class="dh-p-blank" data-p="blank" hidden>Audience screen is blank · press B</p>
            <p class="dh-p-label">Run sheet</p>
            <ol class="dh-p-agenda" data-p="agenda"></ol>
            <p class="dh-p-hint">→ / Space next · ← back · B blank · + / − notes size · the timer starts on your first slide change</p>
          </aside>
        </div>`
      );
      document.body.appendChild(view);
      view.addEventListener('mousedown', (event) => {
        if (event.target.closest('button')) event.preventDefault();
      });
      view.querySelectorAll('[data-p]').forEach((element) => {
        presenter[element.dataset.p] = element;
      });
      document.title = `Presenter · ${document.title}`;
      presenter.planned.textContent = `planned ${formatDuration(info.reduce((sum, item) => sum + item.targetSeconds, 0))}`;
      presenter.agenda.innerHTML = info
        .map(
          (item) =>
            `<li data-index="${item.index}"><button type="button"><span class="a-n">${pad(item.index + 1)}</span>` +
            `<span>${escapeHtml(item.label)}</span><span class="a-t">${formatDuration(item.targetSeconds)}</span></button></li>`
        )
        .join('');
      presenter.agenda.addEventListener('click', (event) => {
        const row = event.target.closest('li[data-index]');
        if (row) jump(Number(row.dataset.index));
      });
      presenter.prev.addEventListener('click', prev);
      presenter.forward.addEventListener('click', next);
      presenter.audience.addEventListener('click', openAudience);
      presenter.black.addEventListener('click', () => setBlackout(!isBlackout));
      presenter.start.addEventListener('click', () => {
        timerStartedAt = Date.now();
        timerStartIndex = current.index;
        slideStartedAt = timerStartedAt;
        tick();
      });
      let savedSize = 0;
      try {
        savedSize = Number(localStorage.getItem(NOTES_SIZE_KEY));
      } catch (error) {
        savedSize = 0;
      }
      if (savedSize) setNotesSize(savedSize);
      window.setInterval(tick, 500);
    }

    function renderPresenter() {
      const item = info[current.index];
      const nextItem = info[current.index + 1];
      presenter.num.textContent = pad(current.index + 1);
      presenter.kicker.textContent = item.kicker;
      presenter.title.textContent = item.title;
      presenter.notes.innerHTML = item.notesHtml || '<p class="opt">No speaker notes on this slide.</p>';
      markCues(presenter.notes);
      if (!item.maxStep) presenter.step.textContent = '';
      else if (current.step < item.maxStep) presenter.step.textContent = `Reveal ${current.step} of ${item.maxStep} · next press reveals more`;
      else presenter.step.textContent = `All ${item.maxStep} reveals shown`;
      if (current.step < item.maxStep) {
        presenter.next.textContent = 'Next reveal on this slide';
        presenter.nextMeta.textContent = `Reveal ${current.step + 1} of ${item.maxStep}`;
      } else if (nextItem) {
        presenter.next.textContent = nextItem.title;
        presenter.nextMeta.textContent = nextItem.kicker;
      } else {
        presenter.next.textContent = 'End of talk';
        presenter.nextMeta.textContent = 'Questions';
      }
      presenter.target.textContent = `of ${formatDuration(item.targetSeconds)}${item.spokenSeconds ? ` · notes ≈ ${formatDuration(item.spokenSeconds)}` : ''}`;
      presenter.agenda.querySelectorAll('li').forEach((row) => row.classList.toggle('is-current', Number(row.dataset.index) === current.index));
      tick();
    }

    function tick() {
      if (!isPresenter || !presenter.clock) return;
      const now = Date.now();
      const item = info[current.index];
      const slideSeconds = (now - slideStartedAt) / 1000;
      presenter.clock.textContent = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      presenter.slide.textContent = formatDuration(slideSeconds);
      presenter.slide.classList.toggle('is-behind', slideSeconds > item.targetSeconds);
      if (timerStartedAt === null) {
        presenter.total.textContent = '0:00';
        presenter.pace.textContent = 'not started';
        presenter.pace.className = '';
        return;
      }
      presenter.total.textContent = formatDuration((now - timerStartedAt) / 1000);
      let plannedSeconds = 0;
      for (let index = timerStartIndex; index < current.index; index++) plannedSeconds += info[index].targetSeconds;
      const drift = (slideStartedAt - timerStartedAt) / 1000 - plannedSeconds + Math.max(0, slideSeconds - item.targetSeconds);
      if (Math.abs(drift) < 10) {
        presenter.pace.textContent = 'on time';
        presenter.pace.className = '';
      } else if (drift > 0) {
        presenter.pace.textContent = `${formatDuration(drift)} behind`;
        presenter.pace.className = 'is-behind';
      } else {
        presenter.pace.textContent = `${formatDuration(-drift)} ahead`;
        presenter.pace.className = 'is-ahead';
      }
    }

    /* ---------- input ---------- */

    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.key === ' ' || event.key === 'Enter') && target && target.closest('button')) return;
      let handled = true;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
        case 'Enter':
        case 'l':
        case 'j':
          next();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
        case 'Backspace':
        case 'h':
        case 'k':
          prev();
          break;
        case 'Home':
          go(0, 0);
          break;
        case 'End':
          go(total - 1, info[total - 1].maxStep);
          break;
        case 'o':
        case 'O':
          toggleOverlay(overview);
          break;
        case '?':
          toggleOverlay(help);
          break;
        case 'Escape':
          handled = closeOverlays();
          break;
        case 'n':
        case 'N':
          toggleNotesDrawer();
          break;
        case 'p':
        case 'P':
          if (isPresenter) openAudience();
          else openPresenter();
          break;
        case 'f':
        case 'F':
        case 'F5':
          toggleFullscreen();
          break;
        case 'b':
        case 'B':
        case '.':
          setBlackout(!isBlackout);
          break;
        case '+':
        case '=':
          adjustNotesSize(2);
          break;
        case '-':
        case '_':
          adjustNotesSize(-2);
          break;
        default:
          handled = false;
      }
      if (handled) event.preventDefault();
    });

    railHost.addEventListener('click', (event) => {
      const label = event.target.closest('.rl');
      if (label) jump(Number(label.dataset.index));
    });

    let idleTimer = null;
    function wake() {
      document.body.classList.remove('dh-idle');
      hud.classList.remove('is-quiet');
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        document.body.classList.add('dh-idle');
        hud.classList.add('is-quiet');
      }, 2600);
    }

    function fit() {
      stage.style.setProperty('--scale', String(Math.min(window.innerWidth / 1920, window.innerHeight / 1080)));
    }

    /* ---------- start ---------- */

    if (isPresenter) {
      setupPresenter();
    } else {
      document.body.classList.add('dh-audience');
      fit();
      window.addEventListener('resize', fit);
      document.addEventListener('mousemove', wake);
      window.setTimeout(() => hud.classList.add('is-quiet'), 6000);
    }

    const startAt = readHash() || { index: 0, step: 0 };
    go(startAt.index, startAt.step, { remote: true });
    hasRendered = true;
    document.body.classList.add('dh-ready');
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('dh-no-anim')));

    if (peers.size) send({ type: 'hello' });
    else if (channel) channel.postMessage({ ns: 'deckhand', type: 'hello' });

    Object.assign(Deckhand, {
      go,
      next,
      prev,
      slides: info.map(({ slide, fragments, toggles, ...rest }) => rest),
    });
    Object.defineProperty(Deckhand, 'current', {
      configurable: true,
      get: () => ({ index: current.index, step: current.step }),
    });
    document.dispatchEvent(new CustomEvent('deckhand:ready', { detail: { slides: total } }));
  }

  boot().catch((error) => {
    console.error(error);
    document.body.classList.add('dh-ready');
  });
})();
