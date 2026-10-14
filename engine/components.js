(function () {
  'use strict';

  const Deckhand = (window.Deckhand = window.Deckhand || {});
  const round = (value) => Math.round(value * 10) / 10;
  const escapeXml = (text) =>
    String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  let measureContext = null;

  function measureText(text, font) {
    measureContext = measureContext || document.createElement('canvas').getContext('2d');
    measureContext.font = font;
    return measureContext.measureText(text).width;
  }

  /* ---------- diffbar: data-plus / data-minus ---------- */

  function diffbars(root) {
    root.querySelectorAll('.diffbar').forEach((bar) => {
      const additions = Number(bar.dataset.plus) || 0;
      const deletions = Number(bar.dataset.minus) || 0;
      const blocks = Number(bar.dataset.blocks) || 24;
      let additionBlocks = Math.round((additions / Math.max(1, additions + deletions)) * blocks);
      if (additions > 0 && additionBlocks === 0) additionBlocks = 1;
      if (deletions > 0 && additionBlocks === blocks) additionBlocks = blocks - 1;
      bar.innerHTML = Array.from({ length: blocks }, (_, index) => `<i class="${index < additionBlocks ? 'p' : 'm'}"></i>`).join('');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', `${additions} additions, ${deletions} deletions`);
    });
  }

  /* ---------- cycle: data-nodes="A, B, C, D" data-center="48" data-center-label="fixes" ---------- */

  function cycles(root) {
    root.querySelectorAll('.cycle[data-nodes]').forEach((figure) => {
      const nodes = figure.dataset.nodes.split(',').map((node) => node.trim()).filter(Boolean);
      if (nodes.length < 2) return;
      const center = 300;
      const radius = 200;
      const fontFamily = getComputedStyle(figure).getPropertyValue('--font-body').trim() || 'sans-serif';
      const parts = [`<circle class="cycle-ring" cx="${center}" cy="${center}" r="${radius}"/>`];
      const angleOf = (index) => -90 + (index * 360) / nodes.length;
      const point = (angle) => {
        const radians = (angle * Math.PI) / 180;
        return { x: center + radius * Math.cos(radians), y: center + radius * Math.sin(radians) };
      };
      nodes.forEach((_, index) => {
        const mid = angleOf(index) + 180 / nodes.length;
        const { x, y } = point(mid);
        parts.push(`<path class="cycle-arrow" d="M-6 -9 L4 0 L-6 9" transform="translate(${round(x)} ${round(y)}) rotate(${round(mid + 90)})"/>`);
      });
      parts.push(`<g class="cycle-orbit"><circle cx="${center}" cy="${center - radius}" r="11"/></g>`);
      nodes.forEach((label, index) => {
        const { x, y } = point(angleOf(index));
        const width = Math.ceil(measureText(label, `600 25px ${fontFamily}`)) + 48;
        const clampedX = Math.min(600 - width / 2 - 2, Math.max(width / 2 + 2, x));
        parts.push(
          `<g class="cycle-node" transform="translate(${round(clampedX)} ${round(y)})">` +
            `<rect x="${round(-width / 2)}" y="-27" width="${width}" height="54" rx="27"/>` +
            `<text y="9">${escapeXml(label)}</text></g>`
        );
      });
      const existingCenter = figure.querySelector('.cycle-center');
      figure.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 600 600" aria-hidden="true">${parts.join('')}</svg>`);
      if (!existingCenter && figure.dataset.center) {
        figure.insertAdjacentHTML(
          'beforeend',
          `<div class="cycle-center"><b>${escapeXml(figure.dataset.center)}</b>${
            figure.dataset.centerLabel ? `<span>${escapeXml(figure.dataset.centerLabel)}</span>` : ''
          }</div>`
        );
      }
      if (!figure.getAttribute('aria-label')) {
        figure.setAttribute('role', 'img');
        figure.setAttribute('aria-label', `Cycle: ${nodes.join(' → ')} → ${nodes[0]}`);
      }
    });
  }

  /* ---------- logtrack: a vertical log-style chart from data-series ---------- */

  function logtracks(root) {
    root.querySelectorAll('.logtrack[data-series]').forEach((figure) => {
      const series = figure.dataset.series.split(',').map((value) => Number(value.trim()) || 0);
      if (series.length < 2) return;
      const width = 300;
      const top = 104;
      const bottom = 816;
      const depthColumn = 46;
      const left = 52;
      const right = 290;
      const max = Number(figure.dataset.max) || Math.max(...series, 1);
      const useSqrt = (figure.dataset.scale || 'linear') === 'sqrt';
      const rows = series.length - 1;
      const every = Number(figure.dataset.labelEvery) || Math.max(1, Math.ceil(rows / 5));
      const prefix = figure.dataset.labelPrefix || '';
      const yOf = (row) => top + 10 + (row / rows) * (bottom - top - 20);
      const xOf = (value) => left + (useSqrt ? Math.sqrt(Math.max(0, value) / max) : Math.max(0, value) / max) * (right - left);
      const curve = series.map((value, row) => `${round(xOf(value))},${round(yOf(row))}`).join(' ');
      const parts = [
        `<svg viewBox="0 0 ${width} 860" preserveAspectRatio="xMidYMin meet" role="img" aria-label="${escapeXml(figure.dataset.title || 'Chart')}${figure.dataset.unit ? `, ${escapeXml(figure.dataset.unit)}` : ''}">`,
        `<defs><pattern id="dh-lt-hatch-${Math.random().toString(36).slice(2, 8)}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="lt-hatch-line" x1="0" y1="0" x2="0" y2="6"/></pattern></defs>`,
        `<rect class="lt-frame" x="0.6" y="0.6" width="${width - 1.2}" height="92"/>`,
        `<text class="lt-name" x="14" y="26">${escapeXml(figure.dataset.title || '')}</text>`,
        `<text class="lt-small" x="${width - 14}" y="26" text-anchor="end">${escapeXml(figure.dataset.tag || '')}</text>`,
        `<line class="lt-sample" x1="${left}" x2="${right}" y1="50" y2="50"/>`,
        `<text class="lt-small" x="${left}" y="70">0</text>`,
        `<text class="lt-small" x="${right}" y="70" text-anchor="end">${escapeXml(Deckhand.formatNumber ? Deckhand.formatNumber(max) : max)}</text>`,
        `<text class="lt-small" x="${(left + right) / 2}" y="70" text-anchor="middle">${escapeXml(figure.dataset.unit || '')}</text>`,
        `<text class="lt-small" x="${(left + right) / 2}" y="84" text-anchor="middle">${useSqrt ? 'sqrt scale' : 'linear scale'}</text>`,
        `<rect class="lt-frame" x="0.6" y="${top - 4}" width="${width - 1.2}" height="${bottom - top + 8}"/>`,
        `<line class="lt-frame" x1="${depthColumn}" x2="${depthColumn}" y1="${top - 4}" y2="${bottom + 4}"/>`,
      ];
      const hatchId = parts[1].match(/id="([^"]+)"/)[1];
      for (let quarter = 1; quarter < 4; quarter++) {
        const x = round(left + (quarter / 4) * (right - left));
        parts.push(`<line class="lt-grid" x1="${x}" x2="${x}" y1="${top}" y2="${bottom}"/>`);
      }
      const minorEvery = every % 2 === 0 ? every / 2 : every;
      for (let row = 0; row <= rows; row += minorEvery) {
        const y = round(yOf(row));
        const isMajor = row % every === 0;
        parts.push(`<line class="lt-grid${isMajor ? ' is-major' : ''}" x1="${depthColumn}" x2="${right}" y1="${y}" y2="${y}"/>`);
        if (isMajor) {
          parts.push(`<text class="lt-depth" x="${depthColumn - 8}" y="${round(y + 3.5)}" text-anchor="end">${escapeXml(prefix + String(row).padStart(2, '0'))}</text>`);
        }
      }
      const shade = (figure.dataset.shade || '').split('-').map(Number);
      if (shade.length === 2 && shade.every((value) => Number.isFinite(value))) {
        const [from, to] = shade;
        parts.push(`<rect x="${left}" y="${round(yOf(from))}" width="${right - left}" height="${round(yOf(to) - yOf(from))}" fill="url(#${hatchId})"/>`);
        if (figure.dataset.shadeLabel) {
          parts.push(`<text class="lt-note" x="${right - 6}" y="${round((yOf(from) + yOf(to)) / 2 + 3)}" text-anchor="end">${escapeXml(figure.dataset.shadeLabel)}</text>`);
        }
      }
      parts.push(`<polygon class="lt-area" points="${left},${round(yOf(0))} ${curve} ${left},${round(yOf(rows))}"/>`);
      parts.push(`<polyline class="lt-curve" pathLength="1" points="${curve}"/>`);
      if (figure.dataset.peak !== 'false') {
        const peakRow = series.indexOf(Math.max(...series));
        parts.push(`<text class="lt-peak" x="${right - 4}" y="${round(yOf(peakRow) - 8)}" text-anchor="end">${escapeXml(Deckhand.formatNumber ? Deckhand.formatNumber(series[peakRow]) : series[peakRow])}</text>`);
      }
      if (figure.dataset.footnote) {
        parts.push(`<text class="lt-note" x="0" y="846">${escapeXml(figure.dataset.footnote)}</text>`);
      }
      parts.push('</svg>');
      figure.innerHTML = parts.join('');
    });
  }

  /* ---------- segmented: buttons with data-value set data-value on the .segmented container ---------- */

  function segmented(root) {
    root.querySelectorAll('.segmented').forEach((widget) => {
      const buttons = Array.from(widget.querySelectorAll('.segmented-control button[data-value]'));
      if (!buttons.length) return;
      const select = (button) => {
        widget.dataset.value = button.dataset.value;
        buttons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
      };
      const initial = buttons.find((button) => button.getAttribute('aria-pressed') === 'true') || buttons[0];
      select(initial);
      buttons.forEach((button) => {
        button.type = 'button';
        button.addEventListener('click', () => {
          select(button);
          button.blur();
        });
      });
    });
  }

  Deckhand.components = (Deckhand.components || []).concat([diffbars, cycles, logtracks, segmented]);
  Deckhand.componentsLoaded = true;
})();
