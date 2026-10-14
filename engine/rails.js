(function () {
  'use strict';

  const Deckhand = (window.Deckhand = window.Deckhand || {});
  const NNBSP = '\u202F';
  const R = {
    width: 380,
    height: 1080,
    axis: 104,
    top: 178,
    bottom: 814,
    labelX: 204,
    labelTop: 48,
    labelBottom: 1032,
  };

  const round = (value) => Math.round(value * 10) / 10;
  const escapeXml = (text) =>
    String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const formatNumber = (value) =>
    Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 }).replace(/,/g, NNBSP);
  const posToY = (pos, ctx) => R.top + (clampPos(pos, ctx) / ctx.max) * (R.bottom - R.top);
  const clampPos = (pos, ctx) => Math.min(ctx.max, Math.max(0, Number(pos) || 0));

  function buildScale(ctx) {
    const parts = [];
    const minorStep = ctx.ticks >= 2 && Number.isInteger(ctx.ticks) && ctx.ticks % 2 !== 0 ? ctx.ticks : ctx.ticks / 2;
    for (let pos = 0; pos <= ctx.max + 1e-9; pos += minorStep) {
      const y = round(posToY(pos, ctx));
      const isMajor = Math.abs(pos / ctx.ticks - Math.round(pos / ctx.ticks)) < 1e-9;
      parts.push(`<line class="r-tick" x1="${isMajor ? 48 : 53}" x2="58" y1="${y}" y2="${y}"/>`);
      if (isMajor) {
        parts.push(`<text class="r-scale" x="44" y="${round(y + 3.5)}" text-anchor="end">${formatNumber(round(pos))}</text>`);
      }
    }
    if (ctx.unit) {
      parts.push(`<text class="r-scale" x="44" y="${R.top - 12}" text-anchor="end">${escapeXml(ctx.unit)}</text>`);
    }
    if (ctx.caption) {
      parts.push(
        `<text class="r-cap" transform="translate(14 ${R.height - 36}) rotate(-90)">${escapeXml(ctx.caption.toUpperCase())}</text>`
      );
    }
    return parts.join('');
  }

  function buildLabels(ctx, anchorOf) {
    const slides = ctx.slides;
    const step = (R.labelBottom - R.labelTop) / Math.max(1, slides.length - 1);
    const compact = step < 46;
    return slides
      .map((slide, index) => {
        const labelY = round(R.labelTop + index * step);
        const anchor = anchorOf(slide, index);
        const elbowX = Math.max(anchor.x + 8, R.labelX - 36);
        const leadY = compact ? labelY - 5 : labelY - 4;
        const lead = `M${round(anchor.x)} ${round(anchor.y)} H${round(elbowX)} L${R.labelX - 14} ${round(leadY)} H${R.labelX - 6}`;
        const titleY = compact ? labelY : round(labelY + 19);
        return (
          `<g class="rl is-future" data-index="${index}">` +
          `<rect class="rl-hit" x="${R.labelX - 10}" y="${round(labelY - 18)}" width="${R.width - R.labelX + 6}" height="${compact ? 30 : 46}"/>` +
          `<path class="rl-lead" d="${lead}"/>` +
          `<circle class="rl-dot" cx="${round(anchor.x)}" cy="${round(anchor.y)}" r="3.4"/>` +
          (compact ? '' : `<text class="rl-meta" x="${R.labelX}" y="${labelY}">${escapeXml(slide.meta)}</text>`) +
          `<text class="rl-title" x="${R.labelX}" y="${titleY}">${escapeXml(slide.label)}</text>` +
          `</g>`
        );
      })
      .join('');
  }

  function svg(content) {
    return `<svg viewBox="0 0 ${R.width} ${R.height}" width="${R.width}" height="${R.height}" aria-hidden="true">${content}</svg>`;
  }

  /* ---------- well: a drilling schematic, depth = position ---------- */

  const RIG_FLOOR = 152;
  const DERRICK_TOP = 30;
  const OPEN_HOLE = 7;
  const CASINGS = [
    { halfWidth: 36, shoe: 0.052 },
    { halfWidth: 27, shoe: 0.37 },
    { halfWidth: 19, shoe: 0.67 },
    { halfWidth: 12, shoe: 0.944 },
  ];
  const derrickHalfWidthAt = (y) => 38 - 30 * ((RIG_FLOOR - y) / (RIG_FLOOR - DERRICK_TOP));
  const wellHalfWidthAt = (fraction) => {
    const casing = CASINGS.find((item) => fraction <= item.shoe);
    return casing ? casing.halfWidth : OPEN_HOLE;
  };

  function buildDerrick() {
    const a = R.axis;
    const parts = [
      `<path class="r-line" d="M${a - 38} ${RIG_FLOOR} L${a - 8} ${DERRICK_TOP} M${a + 38} ${RIG_FLOOR} L${a + 8} ${DERRICK_TOP}"/>`,
    ];
    const levels = [RIG_FLOOR, 122, 94, 68, 46];
    for (let index = 0; index < levels.length - 1; index++) {
      const lowerY = levels[index];
      const upperY = levels[index + 1];
      const lower = derrickHalfWidthAt(lowerY);
      const upper = derrickHalfWidthAt(upperY);
      parts.push(
        `<path class="r-thin" d="M${round(a - lower)} ${lowerY} L${round(a + upper)} ${upperY} M${round(a + lower)} ${lowerY} L${round(a - upper)} ${upperY} M${round(a - upper)} ${upperY} H${round(a + upper)}"/>`
      );
    }
    parts.push(`<rect class="r-fill" x="${a - 13}" y="${DERRICK_TOP - 8}" width="26" height="8"/>`);
    parts.push(`<path class="r-thin" d="M${a} ${DERRICK_TOP} V76"/>`);
    parts.push(`<rect class="r-fill" x="${a - 6}" y="76" width="12" height="15" rx="2"/>`);
    parts.push(`<path class="r-thin" d="M${a} 91 v6 a4 4 0 1 0 4 4"/>`);
    parts.push(`<path class="r-line" style="stroke-width:3" d="M${a - 64} ${RIG_FLOOR} H${a + 64}"/>`);
    parts.push(
      `<path class="r-thin" d="M${a - 54} ${RIG_FLOOR} V${R.top} M${a + 54} ${RIG_FLOOR} V${R.top} M${a - 54} ${RIG_FLOOR + 2} L${a - 30} ${R.top} M${a + 54} ${RIG_FLOOR + 2} L${a + 30} ${R.top}"/>`
    );
    parts.push(`<rect class="r-fill" x="${a - 11}" y="${RIG_FLOOR + 4}" width="22" height="7"/>`);
    parts.push(`<rect class="r-fill" x="${a - 8}" y="${RIG_FLOOR + 13}" width="16" height="7"/>`);
    return parts.join('');
  }

  function buildWellbore(ctx) {
    const a = R.axis;
    const parts = [
      `<defs><pattern id="dh-soil" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="r-hatch" x1="0" y1="0" x2="0" y2="7"/></pattern></defs>`,
      `<rect x="62" y="${R.top}" width="122" height="10" fill="url(#dh-soil)"/>`,
      `<rect x="${a - 36}" y="${R.top}" width="72" height="10" style="fill:var(--bg-2)"/>`,
      `<line class="r-ground" x1="0" x2="${R.width}" y1="${R.top}" y2="${R.top}"/>`,
    ];
    CASINGS.forEach((casing) => {
      const shoeY = round(R.top + casing.shoe * (R.bottom - R.top));
      const left = a - casing.halfWidth;
      const right = a + casing.halfWidth;
      parts.push(`<path class="r-line" d="M${left} ${R.top} V${shoeY} M${right} ${R.top} V${shoeY}"/>`);
      parts.push(
        `<path class="r-fill" d="M${left} ${shoeY - 9} V${shoeY} H${left - 7} Z M${right} ${shoeY - 9} V${shoeY} H${right + 7} Z"/>`
      );
    });
    const openTop = round(R.top + CASINGS[CASINGS.length - 1].shoe * (R.bottom - R.top));
    parts.push(
      `<path class="r-open" d="M${a - OPEN_HOLE} ${openTop} V${R.bottom} Q${a} ${R.bottom + 12} ${a + OPEN_HOLE} ${R.bottom} V${openTop}"/>`
    );
    const wellhead = R.top - 6;
    parts.push(`<rect class="r-progress" x="${a - 2.5}" y="${R.top}" width="5" height="${R.bottom - R.top}"/>`);
    parts.push(`<line class="r-tubing" x1="${a}" x2="${a}" y1="${wellhead}" y2="${R.bottom - 6}"/>`);
    parts.push(`<line class="r-flow" x1="${a}" x2="${a}" y1="${wellhead}" y2="${R.bottom - 6}"/>`);
    parts.push(`<path class="r-flowline" d="M${a} ${wellhead} H${a + 90} m-8 -5 l8 5 l-8 5"/>`);
    parts.push(
      `<g class="r-marker"><path class="r-marker-body" d="M-9 -7 H9 L7 1 L0 10 L-7 1 Z"/><path class="r-marker-line" d="M-5 -2 H5"/></g>`
    );
    return parts.join('');
  }

  const well = {
    build(ctx) {
      let introCount = 0;
      const anchorOf = (slide) => {
        if (slide.phase === 'intro') {
          introCount += 1;
          if (introCount === 1) {
            const y = 66;
            return { x: R.axis + derrickHalfWidthAt(y) + 6, y };
          }
          return { x: R.axis + 70, y: RIG_FLOOR };
        }
        if (slide.phase === 'main') {
          const fraction = clampPos(slide.pos, ctx) / ctx.max;
          return { x: R.axis + wellHalfWidthAt(fraction) + 6, y: posToY(slide.pos, ctx) };
        }
        return { x: R.axis + OPEN_HOLE + 8, y: R.bottom };
      };
      return svg(buildScale(ctx) + buildDerrick() + buildWellbore(ctx) + buildLabels(ctx, anchorOf));
    },
    update(rail, state, ctx) {
      const progress = state.phase === 'main' ? clampPos(state.pos, ctx) / ctx.max : state.phase === 'intro' ? 0 : 1;
      const bar = rail.querySelector('.r-progress');
      const marker = rail.querySelector('.r-marker');
      if (bar) bar.style.transform = `scaleY(${progress})`;
      if (marker) marker.style.transform = `translate(${R.axis}px, ${R.top + progress * (R.bottom - R.top)}px)`;
    },
  };

  /* ---------- timeline: a plain vertical axis, for any topic ---------- */

  const timeline = {
    build(ctx) {
      const a = R.axis;
      const startY = R.top - 46;
      const endY = R.bottom + 46;
      const parts = [
        `<line class="r-axis" x1="${a}" x2="${a}" y1="${startY}" y2="${endY}"/>`,
        `<rect class="r-fill" x="${a - 7}" y="${startY - 7}" width="14" height="14"/>`,
        `<circle cx="${a}" cy="${endY}" r="7" style="fill:var(--bg-2);stroke:var(--ink);stroke-width:2"/>`,
        `<rect class="r-progress" x="${a - 2.5}" y="${R.top}" width="5" height="${R.bottom - R.top}"/>`,
        `<line class="r-ground" x1="${a - 16}" x2="${a + 16}" y1="${R.top}" y2="${R.top}"/>`,
        `<line class="r-ground" x1="${a - 16}" x2="${a + 16}" y1="${R.bottom}" y2="${R.bottom}"/>`,
        `<g class="r-marker"><circle class="r-marker-dot" r="9"/></g>`,
      ];
      const anchorOf = (slide) => {
        if (slide.phase === 'intro') return { x: a + 12, y: startY };
        if (slide.phase === 'main') return { x: a + 10, y: posToY(slide.pos, ctx) };
        return { x: a + 12, y: endY };
      };
      return svg(buildScale(ctx) + parts.join('') + buildLabels(ctx, anchorOf));
    },
    update(rail, state, ctx) {
      const progress = state.phase === 'main' ? clampPos(state.pos, ctx) / ctx.max : state.phase === 'intro' ? 0 : 1;
      const bar = rail.querySelector('.r-progress');
      const marker = rail.querySelector('.r-marker');
      let y = R.top + progress * (R.bottom - R.top);
      if (state.phase === 'intro') y = R.top - 46;
      if (state.phase === 'outro' || state.phase === 'finale') y = R.bottom + 46;
      if (bar) bar.style.transform = `scaleY(${progress})`;
      if (marker) marker.style.transform = `translate(${R.axis}px, ${y}px)`;
    },
  };

  const none = {
    build() {
      return '';
    },
    update() {},
  };

  Deckhand.rails = Object.assign({ well, timeline, none }, Deckhand.rails || {});
  Deckhand.railGeometry = R;
  Deckhand.formatNumber = formatNumber;
  Deckhand.railsLoaded = true;
})();
