/*!
 * Primework v0.3.0
 * Canvas-first UI framework -- one node tree, deterministic constraint layout,
 * canvas rendering, and invisible semantic HTML aliases for accessibility, SEO,
 * find-in-page and the clipboard.
 *
 * Single file. No build step. No dependencies.
 *
 *   <div id="app" style="position:relative;width:100vw;height:100vh;"></div>
 *   <script src="primework.js"></script>
 *   <script>
 *     document.fonts.ready.then(() => {
 *       const pw = new Primework({ viewport: document.getElementById('app') });
 *       pw.add({ id:'title', type:'heading1', content:'Hello world',
 *         constraints:{ left:48, top:80, right:48 } });
 *       pw.startAnimating(24);
 *     });
 *   </script>
 *
 * Full docs: primework-docs.html (ships alongside this file in the repo).
 * License: Apache-2.0
 */

'use strict';

const PRIMEWORK_VERSION = '0.3.0';
// =============================================================================
//  STYLE DEFAULTS -- element-type baseline properties
//  These are the implicit "user-agent stylesheet" of Primework.
//  Every resolveStyle() call starts here before layering registry overrides.
// =============================================================================

const SD = {
  // Fallback — all elements inherit these unless overridden
  _: {
    // Core typography
    size:15, font:'IBM Plex Sans,system-ui,sans-serif',
    color:'#161616', weight:'400', italic:false,
    lineSpacing:1.5,              // em multiplier (size × lineSpacing = line height)
    leading:null,                 // absolute line height in px — overrides lineSpacing when set
    alignment:'left',             // 'left' | 'center' | 'right' | 'justify'
    textTransform:'none',
    letterSpacing:0,
    textDecoration:'none',
    baselineOffset:0,             // vertical nudge in px (positive = down)

    // Height reference — which typographic line 'size' is measured to
    // 'em'       (default) size = em square — matches CSS font-size
    // 'cap'               size = cap height  (top of 'H')
    // 'x'                 size = x-height    (top of 'x')
    // 'ascender'          size = ascender    (top of 'b','d','h'...)
    // 'leading'           size = full leading (ascender + descender)
    heightReference:'em',

    // Block
    background:null, paddingX:0, paddingY:0,
    borderRadius:0, border:null, borderWidth:0, borderColor:'#e0e0e0',
    shadow:false, shadowColor:'rgba(0,0,0,0.12)', shadowBlur:16, shadowOffsetY:4,
    leftIndent:0, rightIndent:0, opacity:1,

    verticalAlign:   null, // null=top | 'middle' — center text block in node height
    selectionColor:  null, // canvas text-selection highlight bg  (null → config/default)
    selectionTextColor: null, // canvas text-selection text color (null → keep original)
    firstLineIndent: 0,   // px indent on first line only (classic paragraph indent)

    // Interaction states
    disabled:false,
    cursor:'auto',

    // ── Spacing reference system ───────────────────────────────────────────
    // Which typographic line topOffset measures TO when using topAfter.
    // null = use project config (PrimeworkConfig.spaceReference).
    // 'em' | 'cap_height' | 'x_height' | 'ascender' | 'baseline' | 'descender'
    spaceBeforeRef: null,
    // Which typographic line spaceAfter measures FROM on the current element.
    spaceAfterRef:  null,

    // ── Tracking / optical margin ──────────────────────────────────────────
    charSpace:     null,   // null = project config; em units
    opticalMargin: null,   // null = project config; boolean
    smartQuotes:   null,   // null = project config; boolean

    // ── Text highlight (background behind glyphs) ──────────────────────────
    highlight:             false,
    highlightColor:        '#ffff00',
    highlightOpacity:      0.4,
    // TOP reference line of the highlight
    highlightLevel:        'cap_height',  // 'em' | 'cap_height' | 'x_height' | 'baseline'
    // BOTTOM reference line of the highlight
    highlightBottomRef:    'descender',   // 'baseline' | 'x_height' | 'descender'
    highlightExpandTop:    0,   // extra px above the top reference
    highlightExpandBottom: 0,   // extra px below the bottom reference

    // ── Underline ──────────────────────────────────────────────────────────
    underline:        false,
    underlineOffset:  2,         // px below alphabetic baseline (positive=down)
    underlineWidth:   1,
    underlineColor:   null,      // null = text color
    underlineStyle:   'solid',   // 'solid' | 'dashed' | 'dotted'

    // ── Strikethrough ──────────────────────────────────────────────────────
    strikethrough:          false,
    strikethroughOffset:    null, // null = auto (x-height midpoint from baseline)
    strikethroughWidth:     1,
    strikethroughColor:     null,

    // ── Paragraph rules ────────────────────────────────────────────────────
    ruleAbove:       false,
    ruleAboveWidth:  1,
    ruleAboveColor:  null,       // null = text color
    ruleAboveOffset: 4,          // px above cap-height of first line

    ruleBelow:       false,
    ruleBelowWidth:  1,
    ruleBelowColor:  null,
    ruleBelowOffset: 4,          // px below descender of last line

    // ── List ───────────────────────────────────────────────────────────────
    listBullet:       '',        // glyph: '\u2022', '\u25B8', '\u2013', or any char
    listCounterStyle: '',        // 'decimal'|'lower-alpha'|'upper-alpha'|'lower-roman'|'upper-roman'
    listBulletColor:  null,
    listBulletSize:   0,         // 0 = same as text size
    listBulletOffset: 0,         // horizontal nudge of bullet position
    listBulletIndent: 16,        // px indent of text from the bullet

    // ── Drop cap (renderer: future) ────────────────────────────────────────
    dropCapLines:   0,
    dropCapFont:    '',
    dropCapColor:   null,
    dropCapSpacing: 4,
    dropCapTopRef:  'cap_height',

    // ── Flow control (pagination: future) ──────────────────────────────────
    keepWithNext: false,
    allowWidows:  1,
    allowOrphans: 0,
    minLinesAfter:0,

    // ── Type variant styles ────────────────────────────────────────────────
    firstOfTypeStyle: '',
    lastOfTypeStyle:  '',

    // ── Table cell ─────────────────────────────────────────────────────────
    cellVertAlign: 'top',        // 'top' | 'middle' | 'bottom'
    cellVRef:      'cap_height', // 'em_top'|'cap_height'|'x_height'|'baseline'
  },
  // Typography elements
  heading1:   { size:38, font:'IBM Plex Sans,system-ui,sans-serif', weight:'700', lineSpacing:1.2,  color:'#161616', heightReference:'cap' },
  heading2:   { size:28, font:'IBM Plex Sans,system-ui,sans-serif', weight:'700', lineSpacing:1.25, color:'#161616', heightReference:'cap' },
  heading3:   { size:22,                       weight:'700', lineSpacing:1.3,  color:'#161616', heightReference:'cap' },
  heading4:   { size:18,                       weight:'600', lineSpacing:1.35, color:'#161616', heightReference:'cap' },
  heading5:   { size:15,                       weight:'600',                   color:'#161616' },
  heading6:   { size:12,                       weight:'600',                   color:'#161616', textTransform:'uppercase', letterSpacing:0.08 },
  subheading: { size:17,                       weight:'600', lineSpacing:1.45, color:'#161616' },
  paragraph:  { size:15,                                     lineSpacing:1.65, color:'#161616' },
  label:      { verticalAlign:'middle', size:11, weight:'600', color:'#0f62fe', textTransform:'uppercase', letterSpacing:0.08 },
  blockquote: { verticalAlign:'middle', size:16, font:'IBM Plex Sans,system-ui,sans-serif', italic:true,  lineSpacing:1.6,  color:'#161616', leftIndent:20 },
  code:       { size:13, font:'IBM Plex Mono,monospace',                       color:'#161616', background:'rgba(0,0,0,0.05)', paddingX:4, paddingY:2 },
  // Interactive
  button:     { verticalAlign:'middle', size:14, weight:'500', color:'#ffffff', background:'#0f62fe',
                paddingX:20, paddingY:0, borderRadius:0, cursor:'pointer' },
  link:       { verticalAlign:'middle', size:15, color:'#0f62fe', textDecoration:'underline', cursor:'pointer' },
  // Media & structure
  image:  { background:'#e8e8e8' },
  divider:{ color:'#e0e0e0', thickness:1 },
  rect:   { background:'#f4f4f4' },
  badge:  { size:11, weight:'600', color:'#ffffff', background:'#0f62fe',
            paddingX:6, paddingY:2, borderRadius:100 },
};

// Built-in disabled states
const SD_DISABLED = {
  button:  { background:'#c6c6c6', color:'#8d8d8d', opacity:0.6, cursor:'not-allowed' },
  link:    { color:'#8d8d8d', textDecoration:'none', cursor:'not-allowed' },
  _:       { opacity:0.5, cursor:'not-allowed' },
};

// =============================================================================
//  FONT METRICS
//  Measures cap-height, x-height, ascender and descender of any canvas font.
//  Used to convert heightReference:'cap'/'x'/'ascender' sizes to em-px sizes,
//  and to compute optical baseline offsets.
//  All measurements cached per font string.
// =============================================================================

class FontMetrics {
  constructor() { this._cache = new Map(); }

  // Measure at a fixed 100px reference so results are scale-independent ratios
  _at100(family, weight, ctx) {
    const key = `${weight}|${family}`;
    if (this._cache.has(key)) return this._cache.get(key);

    // Real, parsed font-file metrics take priority when available (see
    // FontFileMetrics above) -- falls through to the canvas heuristic below
    // for any family that hasn't been (or can't be) loaded that way.
    const real = FONT_FILE_METRICS.get(family);
    if (real) { this._cache.set(key, real); return real; }

    ctx.save();
    ctx.font = `${weight} 100px ${family}`;

    // Each metric uses its own reference string so glyphs don't contaminate each other.
    // Cap height  — pure uppercase, no ascenders above cap line
    const capM  = ctx.measureText('HBDEFIKLMNOPRSTUVWXYZ');
    // x-height    — pure x-height lowercase, no ascenders, no descenders
    const xM    = ctx.measureText('acemnorsuvwxz');
    // Ascender    — lowercase letters with ascenders only (no descenders)
    const ascM  = ctx.measureText('bdfhijklt');
    // Descender   — pure descender letters, no ascenders above x-height
    const descM = ctx.measureText('pqgjy');
    // Em box: fontBounding* covers the full em square regardless of glyphs.
    // Fallback uses accented capitals (À Á É) which carry diacritics above the
    // cap line and reach the true em ascent in virtually all Latin fonts.
    const emTopM  = ctx.measureText('\u00C0\u00C1\u00C9\u00CD\u00D3\u00DA'); // ÀÁÉÍÓÚ
    const emBotM  = ctx.measureText('pqgjy\u00FC\u00E4');  // descenders + umlauts

    const r = {
      capHeight:  capM.actualBoundingBoxAscent                                    / 100,
      xHeight:    xM.actualBoundingBoxAscent                                      / 100,
      ascender:   ascM.actualBoundingBoxAscent                                    / 100,
      descender:  descM.actualBoundingBoxDescent                                  / 100,
      emAscent:  (emTopM.fontBoundingBoxAscent  ?? emTopM.actualBoundingBoxAscent)  / 100,
      emDescent: (emBotM.fontBoundingBoxDescent ?? emBotM.actualBoundingBoxDescent) / 100,
    };
    this._cache.set(key, r);
    ctx.restore();
    return r;
  }

  // Convert a size expressed in heightReference units to the em-px value
  // that produces that optical size.
  toEmPx(size, family, weight, heightRef, ctx) {
    if (!heightRef || heightRef === 'em') return size;
    const m = this._at100(family, weight, ctx);
    const ratio = heightRef === 'cap'      ? m.capHeight
                : heightRef === 'x'        ? m.xHeight
                : heightRef === 'ascender' ? m.ascender
                : heightRef === 'leading'  ? m.emAscent + m.emDescent
                : 1;
    return ratio > 0 ? size / ratio : size;
  }

  // Return the y-offset to add when textBaseline='top' so that the
  // requested reference line aligns with the target y coordinate.
  // e.g. alignTo='cap' means the tops of capitals align with y.
  alignOffset(emPx, family, weight, alignTo, ctx) {
    if (!alignTo || alignTo === 'top') return 0;
    const m = this._at100(family, weight, ctx);
    const emTop = m.emAscent * emPx;           // distance from em-top to baseline
    switch (alignTo) {
      case 'cap':       return emTop - m.capHeight  * emPx;  // push down so cap aligns
      case 'x':         return emTop - m.xHeight    * emPx;
      case 'ascender':  return emTop - m.ascender   * emPx;
      case 'alphabetic':return emTop;                          // baseline = y
      default: return 0;
    }
  }

  // Expose raw ratios for external use (e.g. constraint calculation)
  getRatios(family, weight, ctx) { return this._at100(family, weight, ctx); }
}

const FONT_METRICS = new FontMetrics();

// =============================================================================
//  FONT FILE METRICS (optional) -- real, authored metrics read directly from
//  a font's own binary data via opentype.js, instead of estimated from how
//  the browser happens to rasterize a reference glyph on canvas.
//
//  Entirely opt-in. Has zero effect unless BOTH of the following are true:
//  (1) opentype.js is loaded as window.opentype before this file runs, and
//  (2) pw.loadFontMetrics(family, source) has been called and resolved for
//  that family. Without either, every heightReference/spaceBeforeRef
//  calculation falls back to the FontMetrics canvas heuristic above,
//  exactly as before -- this can't break a page that doesn't opt in.
//
//  Why this exists: canvas measureText() reports how a specific browser's
//  text engine rasterized a reference glyph -- real and useful, but
//  downstream of that engine's own hinting/shaping, and can differ subtly
//  across browsers and platforms. Parsing the font file's own OS/2 table
//  reads the values the type designer (or their production tooling)
//  actually declared, which are identical no matter which browser parses
//  the same bytes.
// =============================================================================
class FontFileMetrics {
  constructor() { this._byFamily = new Map(); }
  set(family, ratios) { this._byFamily.set(family, ratios); }
  // 'family' as seen by FontMetrics is often a full CSS font stack, e.g.
  // "'Inter', system-ui, sans-serif" -- match against any registered name
  // that appears in it, so callers can register just the family they loaded.
  get(fullFamilyString) {
    for (const [name, ratios] of this._byFamily) {
      if (fullFamilyString.includes(name)) return ratios;
    }
    return null;
  }
}
const FONT_FILE_METRICS = new FontFileMetrics();

// Parses raw font bytes with opentype.js (if present) into the same ratio
// shape FontMetrics._at100() produces, so the two are interchangeable.
// Never throws -- returns null on any failure (missing opentype.js,
// unparseable/corrupt bytes, WOFF2 without a decompressor, etc.), which is
// deliberate: a bad font file should degrade to the canvas heuristic, not
// break the page. Mirrors the same defensive shape as pdf-tooling that
// treats real-metric parsing as a bonus, not a prerequisite for the font
// being usable at all.
function parseFontFileMetrics(arrayBuffer) {
  if (typeof window === 'undefined' || !window.opentype) return null;
  try {
    const font = window.opentype.parse(arrayBuffer);
    const upm  = font.unitsPerEm;
    const os2  = font.tables?.os2;
    const hhea = font.tables?.hhea;

    // Declared OS/2 fields when present; otherwise measure the parsed
    // glyph's own vector outline (still deterministic across browsers,
    // since it's geometry from the parsed file, not browser rasterization)
    // before finally falling back to a plausible ratio.
    const glyphTop = (ch) => {
      try {
        const g  = font.charToGlyph(ch);
        const bb = g?.getPath(0, 0, upm)?.getBoundingBox?.();
        return (bb && bb.y2 > 0) ? bb.y2 : null;
      } catch (_) { return null; }
    };

    const capHeight = (os2?.sCapHeight || glyphTop('H') || upm * 0.70) / upm;
    const xHeight    = (os2?.sxHeight   || glyphTop('x') || upm * 0.50) / upm;
    const emAscent   = (os2?.sTypoAscender ?? Math.round(upm * 0.80)) / upm;
    const emDescent  = Math.abs(os2?.sTypoDescender ?? Math.round(upm * -0.20)) / upm;
    // opentype.js has no distinct "lowercase ascender" field the way the
    // canvas heuristic measures one directly off letters like b/d/h -- the
    // hhea table's ascender is the closest authored equivalent.
    const ascender = (hhea?.ascender ?? os2?.sTypoAscender ?? upm * 0.75) / upm;

    return { capHeight, xHeight, ascender, descender: emDescent, emAscent, emDescent };
  } catch (e) {
    console.warn('Primework: could not parse font file for real metrics (falling back to the canvas heuristic):', e);
    return null;
  }
}

// =============================================================================
//  STYLE REGISTRY
//  Named styles, dot-notation inheritance, context rules, state variants.
//
//  Resolution order for doc.resolveStyle('button', 'primary', 'nav', hover):
//    1. SD._  (universal defaults)
//    2. SD['button']  (type defaults)
//    3. registry['button']  (type-level overrides)
//    4. registry['button.primary']  (named class)
//    5. registry['nav→button']  (context rule on type)
//    6. registry['nav→button.primary']  (context rule on named class)
//    7. registry['button:hover']  (state on type)
//    8. registry['button.primary:hover']  (state on named class)
// =============================================================================

class StyleRegistry {
  constructor() { this._r = {}; }

  // Define or merge a named style
  define(name, props) {
    this._r[name] = { ...(this._r[name] || {}), ...props };
    return this;
  }

  // Define many styles at once
  many(map) {
    for (const [k, v] of Object.entries(map)) this.define(k, v);
    return this;
  }

  // Resolve the full style for a node.
  // type       -- element type ('button', 'heading1', …)
  // styleName  -- class name ('primary') or full key ('button.primary') -- optional
  // context    -- parent element type for context rules ('nav', 'hero') -- optional
  // hovered    -- apply :hover variants
  // active     -- apply :active variants
  resolve(type, styleName, context, hovered, active, disabled) {
    const fullName = styleName
      ? (styleName.includes('.') ? styleName : `${type}.${styleName}`)
      : null;

    const g = k => this._r[k];
    const m = (...layers) => Object.assign({}, ...layers.filter(Boolean));

    const base = m(
      SD._,  SD[type],
      g(type),
      fullName ? g(fullName) : null,
      context  ? g(`${context}\u2192${type}`)                  : null,
      context && fullName ? g(`${context}\u2192${fullName}`)   : null,
      hovered  ? m(g(`${type}:hover`),  fullName ? g(`${fullName}:hover`)  : null) : null,
      active   ? m(g(`${type}:active`), fullName ? g(`${fullName}:active`) : null) : null,
    );

    // Disabled: SD_DISABLED provides visual defaults, registry :disabled overrides on top
    if (disabled || base.disabled) {
      return m(base,
        SD_DISABLED._, SD_DISABLED[type] || {},
        g(`${type}:disabled`), fullName ? g(`${fullName}:disabled`) : null,
      );
    }
    return base;
  }

  list()        { return Object.keys(this._r).sort(); }
  getRaw(name)  { return this._r[name] ?? null; }

  // Resolve a named key exactly as the registry sees it (for inspector)
  resolveNamed(name) {
    // Extract type and class from key like 'button.primary:hover'
    const base = name.replace(/:.*$/, '');   // strip :state
    const type = base.includes('.') ? base.split('.')[0] : base.split('->').pop().split('.')[0];
    return this.resolve(type, base.includes('.') ? base.split('.').slice(1).join('.') : null, null, false, false);
  }
}

// =============================================================================
//  RENDERING UTILITIES
// =============================================================================

// Parse a CSS gradient string into a CanvasGradient, or return the value unchanged.
// Supports: linear-gradient(angle, stop, stop, ...)  radial-gradient(stop, stop, ...)
// Stop format: 'red', '#ff0000', 'rgba(0,0,0,0.5)', or 'red 40%'
function parseBackground(bg, g, ctx) {
  if (!bg || typeof bg !== 'string') return bg;

  const lg = bg.match(/^linear-gradient\(([^)]+)\)/i);
  if (lg) {
    const parts = lg[1].split(',').map(s => s.trim());
    const angleStr = parts[0];
    let angleDeg, stops;
    if (/^-?\d/.test(angleStr) || /deg|turn|rad/.test(angleStr)) {
      const v = parseFloat(angleStr);
      angleDeg = /turn/.test(angleStr) ? v*360 : /rad/.test(angleStr) ? v*180/Math.PI : v;
      stops = parts.slice(1);
    } else { angleDeg = 180; stops = parts; }

    const rad = (angleDeg - 90) * Math.PI / 180;
    const hw  = g.width/2, hh = g.height/2;
    const len = Math.abs(hw*Math.sin(rad)) + Math.abs(hh*Math.cos(rad));
    const grad = ctx.createLinearGradient(
      g.x+hw - Math.cos(rad)*len, g.y+hh - Math.sin(rad)*len,
      g.x+hw + Math.cos(rad)*len, g.y+hh + Math.sin(rad)*len
    );
    stops.forEach((s,i) => {
      const m = s.match(/^(.*?)\s+(\d+(?:\.\d+)?)%\s*$/);
      try { grad.addColorStop(m ? parseFloat(m[2])/100 : i/(stops.length-1), m?m[1].trim():s); } catch(_){}
    });
    return grad;
  }

  const rg = bg.match(/^radial-gradient\(([^)]+)\)/i);
  if (rg) {
    const stops = rg[1].split(',').map(s => s.trim());
    const cx = g.x+g.width/2, cy = g.y+g.height/2, r = Math.max(g.width,g.height)/2;
    const grad = ctx.createRadialGradient(cx,cy,0, cx,cy,r);
    stops.forEach((s,i) => {
      const m = s.match(/^(.*?)\s+(\d+(?:\.\d+)?)%\s*$/);
      try { grad.addColorStop(m ? parseFloat(m[2])/100 : i/(stops.length-1), m?m[1].trim():s); } catch(_){}
    });
    return grad;
  }

  return bg; // solid colour or null
}

// =============================================================================
//  PRIMEWORK  --  v0.3
// =============================================================================

// =============================================================================
//  SMART TYPOGRAPHY UTILITIES
// =============================================================================

function applySmartQuotes(text) {
  if (!text) return text;
  return text
    .replace(/"([^"]*?)"/g,  '\u201C$1\u201D')
    .replace(/'([^']*?)'/g,  '\u2018$1\u2019')
    .replace(/(^|[\s(\[{])"/g, '$1\u201C')
    .replace(/"/g, '\u201D')
    .replace(/(^|[\s(\[{])'/g, '$1\u2018')
    .replace(/(?<=[\w,.])'/, '\u2019');
}

// Optical-margin hang fractions per glyph category
const OPTICAL_HANG = {
  '\u201C':0.5, '\u2018':0.5, '"':0.5, "'":0.5,
  '-':0.5, '\u2013':0.5, '\u2014':0.3,
  ',':0.7, '.':0.7, '\u2022':0.5,
};

// =============================================================================
//  PROJECT-LEVEL CONFIGURATION
//  Provides typographic defaults that every node can override per-style.
// =============================================================================

// Roman numeral helper for ordered list rendering
function _toRoman(n) {
  const vals=[1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms=['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result='';
  for(let i=0;i<vals.length;i++){while(n>=vals[i]){result+=syms[i];n-=vals[i];}}
  return result;
}

class PrimeworkConfig {
  constructor(opts = {}) {
    // Where the FIRST LINE of every text block is placed relative to the node top.
    // 'leading' — standard (em top at node top, no nudge)
    // 'em'      — same as leading
    // 'cap_height' — cap top aligns with node top
    // 'x_height'  — x top aligns with node top
    this.topReference    = opts.topReference    ?? 'leading';

    // Default reference line for spaceBefore/spaceAfter (topOffset in topAfter).
    // Null means the raw px offset is used without typographic adjustment.
    // 'cap_height' | 'x_height' | 'baseline' | 'descender' | 'em' | null
    this.spaceReference  = opts.spaceReference  ?? null;

    // Optical margin: hang leading punctuation outside the column by a fraction
    // of the glyph width.
    this.opticalMargin   = opts.opticalMargin   ?? false;

    // Justification word-space range as % of normal space (Knuth-Plass future use)
    this.wordSpaceMin    = opts.wordSpaceMin    ?? 80;
    this.wordSpaceDesired= opts.wordSpaceDesired?? 100;
    this.wordSpaceMax    = opts.wordSpaceMax    ?? 133;

    // Extra tracking applied to all text (em units; 0 = normal)
    this.charSpace       = opts.charSpace       ?? 0;

    // Smart typographic quotes
    this.smartQuotes     = opts.smartQuotes     ?? true;

    // Ligature substitution (fi, fl, etc.) — future font feature support
    this.ligatures       = opts.ligatures       ?? false;
  }
}

// Shared text-transform helper
function applyTx(text, tx) {
  if (!text || !tx || tx === 'none') return text;
  if (tx === 'uppercase')  return text.toUpperCase();
  if (tx === 'lowercase')  return text.toLowerCase();
  if (tx === 'capitalize') return text.replace(/\b\w/g, c => c.toUpperCase());
  return text;
}

class Primework {

  constructor({ viewport, onChange, clearColor, mode = 'isolated' }) {
    this.viewport    = viewport;
    this.onChange    = onChange;
    this.clearColor  = clearColor ?? '#ffffff';
    this._config     = new PrimeworkConfig();
    // Coexistence mode:
    //  'isolated' — Primework owns scroll/focus (default, fullscreen apps)
    //  'embedded' — participates in page scroll, no internal scroll
    //  'overlay'  — canvas floats above existing DOM content
    this.mode        = mode;
    this._renderCallbacks = []; // portal/nativeInput sync hooks
    this.DOC_W       = 0;
    this.DOC_H       = 0;
    this.nodes       = [];
    this.hoveredId   = null;
    this._dpr        = Math.min(window.devicePixelRatio || 1, 2);
    this.htmlMode    = false;
    this._textSel    = null;
    this.scrollY     = 0;
    this._maxScrollY = 0;
    this.focusedId   = null;   // alias element currently focused via Tab

    this._styles = new StyleRegistry();

    this._TAGS = {
      heading1:'h1', heading2:'h2', heading3:'h3', heading4:'h4', heading5:'h5', heading6:'h6',
      subheading:'h2', paragraph:'p', label:'span', blockquote:'blockquote',
      code:'pre', button:'button', link:'a', image:'img', divider:'hr',
      rect:'section', badge:'span',
    };

    // All of these get canvas text-selection in preview mode
    this._TEXT_TYPES = new Set([
      'heading1','heading2','heading3','heading4','heading5','heading6',
      'subheading','paragraph','label','blockquote','code',
      'button','link','badge',   // interactive labels are also canvas-selectable
    ]);

    this._build();
    this._resizeRAF = null;
    this._ro = new ResizeObserver(() => {
      if (this._resizeRAF) cancelAnimationFrame(this._resizeRAF);
      this._resizeRAF = requestAnimationFrame(() => { this._resizeRAF = null; this._onResize(); });
    });
    this._ro.observe(viewport);
    this._onResize();
  }

  // ── Public style API ────────────────────────────────────────────────────────
  defineStyle(name, props) { this._styles.define(name, props); return this; }
  styles(map)               { this._styles.many(map);          return this; }
  getStyles()               { return this._styles; }

  // Project-level typographic configuration.
  // Any property set here acts as the default for all nodes.
  // Per-node style properties override these.
  config(opts) { Object.assign(this._config, opts); return this; }

  // Map PrimeworkConfig.topReference to the alignTo string FontMetrics.alignOffset understands
  _topRefToAlignTo(ref) {
    if (ref === 'cap_height') return 'cap';
    if (ref === 'x_height')   return 'x';
    if (ref === 'ascender')   return 'ascender';
    if (ref === 'alphabetic') return 'alphabetic';
    return null;  // 'leading' / 'em' = no shift
  }

  // Resolve the full computed style for a node.
  // Node can carry:
  //   styleName: 'primary'          -- class name (short form)
  //   style:     'primary'          -- same, backward compat
  //   style:     { size:14, … }     -- inline overrides (always merged last)
  _nodeStyle(node, hovered = false, active = false) {
    // Use per-relayout cache for plain (no hover/active) lookups
    if (!hovered && !active && this._styleCache) {
      const k = node.id;
      if (this._styleCache.has(k)) return this._styleCache.get(k);
      const sn = node.styleName ?? (typeof node.style === 'string' ? node.style : null);
      const overrides = (typeof node.style === 'object' && node.style) ? node.style : {};
      const resolved = this._styles.resolve(node.type, sn, node.context ?? null, false, false, node.disabled ?? false);
      const s = { ...resolved, ...overrides };
      this._styleCache.set(k, s);
      return s;
    }
    const sn = node.styleName ?? (typeof node.style === 'string' ? node.style : null);
    const overrides = (typeof node.style === 'object' && node.style) ? node.style : {};
    const resolved = this._styles.resolve(
      node.type, sn, node.context ?? null, hovered, active, node.disabled ?? false
    );
    return { ...resolved, ...overrides };
  }

  _fontSpec(node, s) {
    const type = node?.type;
    const d    = SD[type] || SD._;
    const rawSz = s.size ?? d.size ?? 15;
    const wt    = s.weight ?? d.weight ?? '400';
    const it    = (s.italic ?? d.italic) ? 'italic ' : '';
    const fm    = s.font ?? d.font ?? 'IBM Plex Sans,system-ui,sans-serif';
    const href  = s.heightReference ?? d.heightReference ?? 'em';

    // Convert size to em-px via FontMetrics when heightReference != 'em'
    let emPx = rawSz;
    if (href !== 'em' && this.ctx) {
      emPx = FONT_METRICS.toEmPx(rawSz, fm, wt, href, this.ctx);
    }
    // line height: explicit `leading` beats lineSpacing multiplier
    const ls = s.lineSpacing ?? d.lineSpacing ?? 1.5;
    const lineH = (s.leading != null) ? s.leading : emPx * ls;
    return { fontStr:`${it}${wt} ${emPx}px ${fm}`, size:emPx, lineH, family:fm };
  }
  _build() {
    // One-time, page-wide: the browser's default ::selection styling
    // overrides color/background on selected text regardless of the
    // element's own (transparent) color -- without this rule, actually
    // selecting alias text reveals it as a real, visible, wrong-font ghost
    // on top of the canvas-rendered text, since Primework draws its own
    // selection highlight on canvas and the real DOM text is meant to stay
    // fully invisible always, selected or not.
    if (!document.getElementById('primework-selection-style')) {
      const sel = document.createElement('style');
      sel.id = 'primework-selection-style';
      sel.textContent = '[data-canvas-id]::selection{background:transparent;color:transparent;}' +
                         '[data-canvas-id]::-moz-selection{background:transparent;color:transparent;}';
      document.head.appendChild(sel);
    }

    const vp = this.viewport;
    // Set only required properties — never use cssText+= which overwrites existing
    // styles like position:fixed on full-screen viewport elements (black screen bug).
    if (!vp.style.position) vp.style.position = 'relative'; // fallback only
    if (this.mode === 'isolated') vp.style.overflow = 'hidden';
    // embedded: page's scroll container handles overflow
    // overlay: canvas is position:fixed, viewport needs no overflow changes

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true'); // the DOM aliases (htmlTop/htmlLayer/htmlBottom) are the single source of accessible truth
    // overlay: canvas is position:fixed so it floats above all page content
    const canvasPos = this.mode === 'overlay' ? 'fixed' : 'absolute';
    this.canvas.style.cssText = 'position:' + canvasPos + ';top:0;left:0;z-index:1;display:block;pointer-events:none;';
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(this._dpr, this._dpr);
    // roundRect polyfill now set on prototype — see below class definition
    vp.appendChild(this.canvas);

    const LAYER_CSS = 'position:absolute;top:0;left:0;right:0;bottom:0;z-index:2;pointer-events:none;overflow:clip;';

    // Three alias layers for correct WCAG tab order:
    //   htmlTop (header/nav fixed) → htmlLayer (scrollable content) → htmlBottom (footer fixed)
    // DOM order matches keyboard navigation order.
    this.htmlTop = document.createElement('div');
    this.htmlTop.style.cssText = LAYER_CSS;

    this.htmlLayer = document.createElement('div');
    this.htmlLayer.setAttribute('role', 'document');
    this.htmlLayer.style.cssText = LAYER_CSS;

    this.htmlBottom = document.createElement('div');
    this.htmlBottom.style.cssText = LAYER_CSS;

    // backward-compat alias so any code referencing htmlFixed still works
    this.htmlFixed = this.htmlTop;

    this.interactLayer = document.createElement('div');
    this.interactLayer.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;z-index:3;pointer-events:auto;';
    this.interactLayer.setAttribute('aria-hidden', 'true'); // pure pointer-event capture surface, never holds content

    // Skip-navigation: invisible link that jumps keyboard focus to main content.
    // Becomes visible on focus (standard accessible pattern).
    this._skipLink = document.createElement('a');
    this._skipLink.href = '#pw-main-content';
    this._skipLink.textContent = 'Skip to main content';
    this._skipLink.style.cssText = [
      'position:absolute','top:-40px','left:0','z-index:10000',
      'padding:8px 16px','background:#0f62fe','color:#fff',
      'font:600 14px IBM Plex Sans,sans-serif','text-decoration:none',
      'border-radius:0 0 4px 0','transition:top .1s',
    ].join(';');
    this._skipLink.addEventListener('focus',  () => { this._skipLink.style.top='0'; });
    this._skipLink.addEventListener('blur',   () => { this._skipLink.style.top='-40px'; });
    vp.appendChild(this._skipLink);
    // overlay mode: re-sync aliases when page scrolls (canvas is fixed, aliases drift)
    if (this.mode === 'overlay') {
      this._boundWindowScroll = () => this._syncScrollOnAliases();
      window.addEventListener('scroll', this._boundWindowScroll, { passive: true });
    }
    this.htmlLayer.id = 'pw-main-content';
    this.htmlLayer.setAttribute('role','main');
    this.htmlLayer.setAttribute('tabindex', '-1'); // skip-link focus target

    // Append in tab-order (nav → content → footer)
    vp.appendChild(this.htmlTop);
    vp.appendChild(this.htmlLayer);
    vp.appendChild(this.htmlBottom);
    vp.appendChild(this.interactLayer);

    this.interactLayer.addEventListener('mousedown', e => { if (e.button === 0) this._onMouseDown(e); });
    this.interactLayer.addEventListener('mousemove',  e => this._onMouseMove(e));
    this.interactLayer.addEventListener('mouseup',    e => this._onMouseUp(e));
    this.interactLayer.addEventListener('mouseleave', () => this._onMouseLeave());
    this.interactLayer.addEventListener('click',      e => this._onClick(e));
    if (this.mode !== 'embedded') {
      // Internal scroll only in isolated/overlay modes
      this.interactLayer.addEventListener('wheel', e => this._onWheel(e), { passive:false });
    }
    // Touch support — maps gestures to existing mouse/scroll handlers
    this.interactLayer.addEventListener('touchstart', e => this._onTouchStart(e), { passive:false });
    this.interactLayer.addEventListener('touchmove',  e => this._onTouchMove(e),  { passive:false });
    this.interactLayer.addEventListener('touchend',   e => this._onTouchEnd(e),   { passive:false });
    // Keyboard scroll: bind so we can remove it in destroy()
    this._boundKeyDown = e => this._onKeyDown(e);
    window.addEventListener('keydown', this._boundKeyDown);
    this._boundCopy = e => this._onCopy(e);
    vp.addEventListener('copy', this._boundCopy);

    // Clear scrollbar drag if mouse is released anywhere (inside OR outside canvas)
    this._boundDocMouseUp = () => {
      this._sbDragging = false;
      if (this._docSbMove) { document.removeEventListener('mousemove', this._docSbMove); this._docSbMove=null; }
    };
    document.addEventListener('mouseup', this._boundDocMouseUp);
  }

  // ── Layout engine ───────────────────────────────────────────────────────────
  _axis(lo, hi, size, doc) {
    const L = lo != null, H = hi != null, S = size != null;
    if (L && H)  return { start:lo,              extent:doc-lo-hi       };
    if (L && S)  return { start:lo,              extent:size            };
    if (H && S)  return { start:doc-hi-size,     extent:size            };
    if (L)       return { start:lo,              extent:S?size:doc-lo   };
    if (H) { const e=S?size:doc; return { start:doc-hi-e, extent:e };   }
    return       { start:0,                      extent:S?size:doc      };
  }

  _autoHeight(node, width) {
    if (!node.content || width <= 0) return 32;
    const s = this._nodeStyle(node, false, false);
    const { fontStr, size, lineH } = this._fontSpec(node, s);
    // Ordered list: derive bullet from listCounterStyle + node.listIndex
    let _effectiveBullet = s.listBullet || '';
    if (!_effectiveBullet && s.listCounterStyle && node.listIndex != null) {
      const idx = node.listIndex;
      switch(s.listCounterStyle) {
        case 'decimal':     _effectiveBullet = idx + '.'; break;
        case 'lower-alpha': _effectiveBullet = String.fromCharCode(96+idx) + '.'; break;
        case 'upper-alpha': _effectiveBullet = String.fromCharCode(64+idx) + '.'; break;
        case 'lower-roman': _effectiveBullet = _toRoman(idx).toLowerCase() + '.'; break;
        case 'upper-roman': _effectiveBullet = _toRoman(idx) + '.'; break;
        default:            _effectiveBullet = s.listCounterStyle.replace('%d', idx);
      }
    }
    const bulletIndent = _effectiveBullet ? (s.listBulletIndent ?? 16) : 0;
    const paddingX = s.paddingX || 0;
    const paddingY = s.paddingY || 0;
    // Match the same width used by _drawTextBlock
    const li = (s.leftIndent || 0) + bulletIndent + paddingX;
    const ri = (s.rightIndent || 0) + paddingX;
    const effectiveW = Math.max(1, width - li - ri);
    let text = applyTx(node.content, s.textTransform);
    if ((s.smartQuotes ?? this._config.smartQuotes) && text) text = applySmartQuotes(text);
    this.ctx.save();
    this.ctx.font = fontStr;
    const cs = s.charSpace ?? this._config.charSpace ?? 0;
    if (cs && 'letterSpacing' in this.ctx) this.ctx.letterSpacing = (cs * size) + 'px';
    const fli = s.firstLineIndent || 0;
    // If listCounterStyle+listIndex set but no listBullet, account for counter width
    let effBulletIndent = bulletIndent;
    if (!s.listBullet && s.listCounterStyle && node.listIndex != null) {
      effBulletIndent = s.listBulletIndent ?? 16;
    }
    let lines = 0;
    let firstLine = true;
    for (const rawLine of text.split('\n')) {
      if (!rawLine) { lines++; firstLine = false; continue; }
      const words = rawLine.split(' ');
      let line = '';
      for (const w of words) {
        const t = line + w + ' ';
        const lineW = firstLine ? (effectiveW - fli) : effectiveW;
        if (this.ctx.measureText(t).width > lineW && line) {
          lines++; line = w+' '; firstLine = false;
        } else line = t;
      }
      lines++;
      firstLine = false;
    }
    if (lines === 0) lines = 1;
    this.ctx.restore();
    // paddingY * 2 adds top + bottom padding to the node height
    return Math.ceil(lines * lineH) + Math.round(size * 0.4) + paddingY * 2;
  }

  _computeGeometry(node, topOverride) {
    // topOffset:'center' can't resolve in Pass 1 — use 0 as placeholder height anchor
    const c = node._rc || node.constraints || {};
    if (topOverride === null && c.topOffset === 'center') topOverride = 0;
    const { start:x, extent:w } = this._axis(c.left, c.right, c.width, this.DOC_W);
    const TEXT_AUTO = new Set(['heading1','heading2','heading3','heading4','heading5','heading6',
                                'subheading','paragraph','label','blockquote','code',
                                'link','badge']); // link/badge must auto-measure or tags pile up
    let h = c.height;
    if (h == null && TEXT_AUTO.has(node.type) && this.ctx && w > 0) h = this._autoHeight(node, w);
    const top = topOverride != null ? topOverride : c.top;
    const { start:y, extent:hh } = this._axis(top, c.bottom, h, this.DOC_H);
    return { x, y, width:Math.max(0,w), height:Math.max(0,hh) };
  }

  _validateLayout(nodeMap) {
    const seen = new Set();
    for (const n of this.nodes) {
      if (seen.has(n.id)) { console.warn('Primework validation: duplicate id "' + n.id + '"'); }
      seen.add(n.id);
      const cc = n.constraints || {};
      if (cc.topAfter    && !nodeMap.has(cc.topAfter))
        console.warn('Primework: "' + n.id + '".topAfter="' + cc.topAfter + '" — no such node.');
      if (cc.bottomAfter && !nodeMap.has(cc.bottomAfter))
        console.warn('Primework: "' + n.id + '".bottomAfter="' + cc.bottomAfter + '" — no such node.');
      if (cc.left != null && cc.right != null && cc.width != null)
        console.warn('Primework: "' + n.id + '" has left+right+width — width is ignored.');
      if (cc.top != null && cc.topAfter != null)
        console.warn('Primework: "' + n.id + '" has top AND topAfter — topAfter takes precedence.');
      if (cc.topOffset === 'center' && !cc.topAfter)
        console.warn('Primework: "' + n.id + '" topOffset:"center" requires topAfter to center within — ignored.');
      const visited = new Set([n.id]);
      let cur = cc.topAfter;
      while (cur) {
        if (visited.has(cur)) { console.warn('Primework: circular topAfter chain at "' + n.id + '".'); break; }
        visited.add(cur);
        cur = nodeMap.get(cur)?.constraints?.topAfter;
      }
      const visitedB = new Set([n.id]);
      let curB = cc.bottomAfter;
      while (curB) {
        if (visitedB.has(curB)) { console.warn('Primework: circular bottomAfter chain at "' + n.id + '".'); break; }
        visitedB.add(curB);
        curB = nodeMap.get(curB)?.constraints?.bottomAfter;
      }
    }
  }

  _relayout() {
    // Phase 0: merge node.responsive(DOC_W) overrides → stored in n._rc for this pass
    // This enables CSS-media-query-like breakpoint layouts without re-adding nodes.
    for (const n of this.nodes) {
      const base = n.constraints || {};
      n._rc = (typeof n.responsive === 'function')
        ? { ...base, ...(n.responsive(this.DOC_W) || {}) }
        : base;
    }
    // Per-relayout style cache — avoids re-resolving 8-layer cascade per node per pass
    this._styleCache = new Map();
    for (const n of this.nodes) n._g = this._computeGeometry(n, null);
    // Build id→node Map once; avoids O(n²) Array.find in the resolution loop
    let nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    // Run layout validation once after addAll/add/remove
    if (this._needsValidation) {
      this._needsValidation = false;
      this._validateLayout(nodeMap);
    }
    let dirty=true, rounds=0;
    while (dirty && rounds++<50) {
      dirty=false;
      for (const n of this.nodes) {
        const c = n._rc || n.constraints || {};
        // topAfterMax: position below the tallest of multiple nodes (for multi-column rows)
        if (Array.isArray(c.topAfterMax)) {
          let maxBot = -Infinity;
          for (const refId of c.topAfterMax) {
            const ref = nodeMap.get(refId);
            if (ref?._g) maxBot = Math.max(maxBot, ref._g.y + ref._g.height);
          }
          if (isFinite(maxBot)) {
            const newY = maxBot + (c.topOffset ?? 0);
            if (Math.abs(newY - n._g.y) > 0.5) { n._g = { ...n._g, y: newY }; dirty = true; }
          }
        }
        if (c.topAfter) {
          const ref = nodeMap.get(c.topAfter);
          if (ref?._g) {
            let newTop;

            if (c.topOffset === 'center') {
              // Automatic vertical centering: place this node's midpoint at the
              // parent rect's midpoint. Parent must have a known height (explicit
              // or already resolved in a previous pass via bottomAfter).
              newTop = ref._g.y + ref._g.height / 2 - n._g.height / 2;
            } else {
              const rawOffset = c.topOffset ?? 0;
              // spaceBeforeRef: topOffset measured to a specific typographic line
              // instead of the em-top. Subtract the gap so the named line aligns.
              const sbRef = this._nodeStyle(n).spaceBeforeRef ?? this._config.spaceReference;
              let adj = 0;
              if (sbRef && sbRef !== 'em' && this.ctx) {
                const s  = this._nodeStyle(n);
                const { size, family } = this._fontSpec(n, s);
                const wt = s.weight || '400';
                const m  = FONT_METRICS._at100(family, wt, this.ctx);
                if      (sbRef === 'cap_height')  adj = (m.emAscent - m.capHeight)  * size;
                else if (sbRef === 'x_height')    adj = (m.emAscent - m.xHeight)    * size;
                else if (sbRef === 'ascender')    adj = (m.emAscent - m.ascender)   * size;
                else if (sbRef === 'baseline')    adj = m.emAscent                   * size;
                else if (sbRef === 'descender')   adj = (m.emAscent + m.emDescent)  * size;
              }
              newTop = ref._g.y + ref._g.height + rawOffset - adj;
            }

            if (Math.round(newTop) !== Math.round(n._g.y)) {
              n._g = this._computeGeometry(n, newTop);
              dirty = true;
            }
          }
        }
        // bottomAfterMax: grow height to contain the tallest of multiple nodes
        if (Array.isArray(c.bottomAfterMax)) {
          let maxBot = -Infinity;
          for (const refId of c.bottomAfterMax) {
            const ref = nodeMap.get(refId);
            if (ref?._g) maxBot = Math.max(maxBot, ref._g.y + ref._g.height);
          }
          if (isFinite(maxBot)) {
            const nb = maxBot + (c.bottomOffset ?? 0);
            const nh = nb - n._g.y;
            if (Math.round(nh) !== Math.round(n._g.height)) { n._g={...n._g,height:Math.max(0,nh)}; dirty=true; }
          }
        }
        if (c.bottomAfter) {
          const ref = nodeMap.get(c.bottomAfter);
          if (ref?._g) {
            const nb = ref._g.y + ref._g.height + (c.bottomOffset??0);
            const nh = nb - n._g.y;
            if (Math.round(nh) !== Math.round(n._g.height)) { n._g={...n._g,height:Math.max(0,nh)}; dirty=true; }
          }
        }
      }
    }
  }

  _onResize() {
    this._dpr = Math.min(window.devicePixelRatio || 1, 2); // update on monitor change
    const { clientWidth:vw, clientHeight:vh } = this.viewport;
    this.DOC_W = vw;
    // embedded: canvas height grows with content (no fixed viewport height)
    // isolated/overlay: canvas height = viewport height
    if (this.mode === 'embedded') {
      this.DOC_H = Math.max(vh, this._contentHeight || vh);
    } else {
      this.DOC_H = vh;
    }
    const cw = vw, ch = this.DOC_H;
    this.canvas.width  = cw*this._dpr; this.canvas.height = ch*this._dpr;
    this.canvas.style.width  = cw+'px'; this.canvas.style.height = ch+'px';
    this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    this._relayout();
    // Compute scrollable extent from content bottom
    this._computeMaxScroll();
    this._render();
    this._repositionAliases();
    this.onChange?.(this.nodes);
  }

  _computeMaxScroll() {
    const bottom = this.nodes.reduce((m,n) => {
      if (n.fixed || !n._g) return m;
      const bot = n._g.y + n._g.height;
      return isFinite(bot) ? Math.max(m, bot) : m;
    }, 0);
    if (this.mode === 'embedded') {
      // In embedded mode, expand canvas to content height — page handles scroll
      this._contentHeight = bottom + 80;
      this._maxScrollY    = 0;   // no internal scroll
      if (this.canvas.height !== this._contentHeight * this._dpr) {
        this.canvas.height = this._contentHeight * this._dpr;
        this.canvas.style.height = this._contentHeight + 'px';
        this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
        this.DOC_H = this._contentHeight;
      }
    } else {
      this._maxScrollY = Math.max(0, bottom - this.DOC_H + 80);
    }
    this.scrollY = Math.min(this.scrollY, this._maxScrollY);
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  add(node) {
    if (!node || typeof node !== 'object') {
      console.warn('Primework: add() requires a node object.');
      return this;
    }
    if (node.id && this.nodes.some(n => n.id === node.id)) {
      console.warn('Primework: duplicate id "' + node.id + '" — ignoring. Use update() to modify.');
      return this;
    }
    const n = { ...node };
    n._g = this._computeGeometry(n, null);
    this.nodes.push(n);
    this._zDirty = true;
    this._needsValidation = true;
    this._relayout(); this._computeMaxScroll();
    this._render(); this._syncAliases();
    this.onChange?.(this.nodes); return this;
  }

  // node() — returns a live Proxy that auto-syncs on any property change.
  // Multiple assignments within one JS tick are batched into a single RAF layout pass.
  // Use for dynamic nodes whose content/style/constraints change at runtime.
  //
  //   const btn = pw.node({ type:'button', content:'Click me', constraints:{...} });
  //   btn.content = 'Clicked!';                       // auto-syncs
  //   btn.style = { background:'#42be65' };           // auto-syncs (merges with existing)
  //   btn.set({ content:'Done', style:{size:16} });   // batch update → one sync
  node(props) {
    if (!props || typeof props !== 'object') props = {};
    this._nodeSeq = (this._nodeSeq || 0) + 1;
    const id = props.id ?? ('_pw' + this._nodeSeq);
    if (this.nodes.some(n => n.id === id)) {
      console.warn('Primework: node() duplicate id "' + id + '" — returning existing node.');
      const existing = this.nodes.find(n => n.id === id);
      return existing;
    }
    const raw = { id, ...props };
    this.add(raw);   // registers in node array

    let rafId = null;
    this._nodeRAFs = this._nodeRAFs || new Map();
    this._nodeRAFs.set(id, () => { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } });
    const self = this;
    const sync = () => {
      rafId = null;
      if (!self.viewport?.isConnected) return;  // guard after destroy()
      const idx = self.nodes.findIndex(n => n.id === id);
      if (idx >= 0) {
        self.nodes[idx] = raw;           // re-reference (Proxy trap already mutated raw)
        self._zDirty = true;
        self._relayout();
        self._computeMaxScroll();
        self._render();
        self._syncAliases();
        self.onChange?.(self.nodes);
      }
    };
    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(sync); };

    const proxy = new Proxy(raw, {
      set(target, key, val) {
        if (key === '__raw' || key === 'set') return true;
        if (key === 'id') {
          console.warn('Primework: cannot change node id via live reference — id is immutable after creation.');
          return true; // silently ignore
        }
        target[key] = val;
        schedule();
        return true;
      }
    });

    // .set(changes) — batch multiple property updates into one sync
    Object.defineProperty(raw, 'set', {
      value(changes) {
        Object.assign(raw, changes);
        schedule();
        return proxy;
      },
      enumerable: false, configurable: false, writable: false,
    });

    return proxy;
  }

  // addAll: batch-add many nodes with a single relayout + render + alias sync.
  // Use instead of repeated add() when loading a full document.
  addAll(nodes) {
    this._needsValidation = true;
    for (const node of nodes) {
      if (node.id && this.nodes.some(n => n.id === node.id)) {
        console.warn('Primework: duplicate id "' + node.id + '" in addAll() — skipped.');
        continue;
      }
      const n = { ...node };
      n._g = this._computeGeometry(n, null);
      this.nodes.push(n);
    }
    this._zDirty = true;
    this._relayout(); this._computeMaxScroll();
    this._render(); this._syncAliases();
    this.onChange?.(this.nodes); return this;
  }

  update(id, changes) {
    const i = this.nodes.findIndex(n => n.id===id);
    if (i < 0) {
      console.warn('Primework: update("' + id + '") — no node with that id.');
      return this;
    }
    Object.assign(this.nodes[i], changes);
    this._zDirty = true;
    this._relayout(); this._computeMaxScroll();
    this._render(); this._syncAliases();
    this.onChange?.(this.nodes); return this;
  }

  remove(id) {
    this._nodeRAFs?.get(id)?.();
    this._nodeRAFs?.delete(id);
    this.nodes = this.nodes.filter(n => n.id!==id);
    this._zDirty = true;
    this._needsValidation = true;
    this._render(); this._syncAliases(); this.onChange?.(this.nodes); return this;
  }

  getModel()   { return this.nodes.map(({_g,...n})=>n); }

  setHtmlMode(on) {
    this.htmlMode = on;
    this._refreshAliases();
  }

  destroy() {
    this.stopAnimating();
    this.unbindScroll();
    if (this._boundKeyDown) window.removeEventListener('keydown', this._boundKeyDown);
    this._nodeRAFs?.forEach(cancel => cancel());
    this._nodeRAFs?.clear();
    this._renderCallbacks.length = 0;
    this._skipLink?.remove();
    if (this._boundWindowScroll) window.removeEventListener('scroll', this._boundWindowScroll);
    if (this._boundCopy) this.viewport.removeEventListener('copy', this._boundCopy);
    if (this._boundDocMouseUp) document.removeEventListener('mouseup', this._boundDocMouseUp);
    this._ro?.disconnect();
    [this.canvas, this.htmlTop, this.htmlLayer, this.htmlBottom, this.interactLayer].forEach(el=>el.remove());
  }

  // ── Hit testing ─────────────────────────────────────────────────────────────
  // Coordinates are always in doc-space (same as layout engine).
  // We add scrollY so a click at viewport-Y maps to the correct doc-Y.
  _coords(e) {
    const r = this.interactLayer.getBoundingClientRect();
    return { x:e.clientX-r.left, y:e.clientY-r.top+this.scrollY };
  }

  _onKeyDown(e) {
    // Ctrl/Cmd+C: copy canvas text selection to clipboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && this._textSel) {
      const r = this._selRange();
      if (r && (r.startNodeId !== r.endNodeId || r.startIdx < r.endIdx)) {
        const text = this._selectedText(r);
        if (text) {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).catch(() => {});
          } else {
            // Fallback for file:// protocol
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } catch(ex){}
            document.body.removeChild(ta);
          }
          e.preventDefault(); return;
        }
      }
    }
    // embedded mode: page handles all scrolling
    if (this.mode === 'embedded') return;
    // Only handle scroll keys when no text input has focus
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    // Also skip if focus is on a button/link alias (Tab navigation handles those)
    if (document.activeElement?.dataset?.canvasId) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') return;
    }
    const pageStep = Math.max(80, this.DOC_H - 80);
    let delta = 0;
    switch (e.key) {
      case 'ArrowDown':  delta = 40;      break;
      case 'ArrowUp':    delta = -40;     break;
      case 'PageDown':   delta = pageStep;  break;
      case 'PageUp':     delta = -pageStep; break;
      case 'Home':       delta = -this.scrollY;                         break;
      case 'End':        delta = this._maxScrollY - this.scrollY;       break;
      default: return;
    }
    e.preventDefault();
    this.scrollY = Math.max(0, Math.min(this._maxScrollY, this.scrollY + delta));
    this._render();
    this._syncScrollOnAliases();
  }

  _onTouchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    this._touchY0 = t.clientY;
    this._touchScrollY0 = this.scrollY;
    if (e.touches.length === 1)
      this._onMouseDown({ button:0, clientX:t.clientX, clientY:t.clientY, preventDefault:()=>{} });
  }
  _onTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    const dy = this._touchY0 - t.clientY;
    this.scrollY = Math.max(0, Math.min(this._maxScrollY, this._touchScrollY0 + dy));
    if (!this._scrollRAF) this._scrollRAF = requestAnimationFrame(() => {
      this._scrollRAF = null; this._render(); this._syncScrollOnAliases();
    });
  }
  _onTouchEnd(e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    this._onMouseUp({ clientX:t.clientX, clientY:t.clientY, button:0 });
  }
  _onWheel(e) {
    e.preventDefault();
    this._sbDragging = false; // wheel always cancels any in-progress scrollbar drag
    const delta = e.deltaMode === 1 ? e.deltaY*20 : e.deltaMode === 2 ? e.deltaY*this.DOC_H : e.deltaY;
    this.scrollY = Math.max(0, Math.min(this._maxScrollY, this.scrollY + delta));
    // RAF-debounce: collapse many wheel events in one frame into one render
    if (!this._scrollRAF) {
      this._scrollRAF = requestAnimationFrame(() => {
        this._scrollRAF = null;
        this._render();
        this._syncScrollOnAliases();
      });
    }
  }

  _syncScrollOnAliases() {
    if (this.mode === 'overlay') {
      // In overlay mode, canvas is position:fixed — alias positions are in
      // document space, so we must offset by window.scrollY to stay aligned.
      const wsy = window.scrollY || 0;
      this.htmlTop.style.transform    = `translateY(-${wsy}px)`;
      this.htmlLayer.style.transform  = `translateY(${-(this.scrollY + wsy)}px)`;
      this.htmlBottom.style.transform = `translateY(-${wsy}px)`;
    } else {
      // isolated/embedded: only scrollable layer translates
      this.htmlLayer.style.transform = `translateY(-${this.scrollY}px)`;
    }
  }

  _hitTest(x, y) {
    // x,y are in doc-space. Fixed nodes live in viewport-space and are always
    // painted in a separate pass on top of scrollable content (see _render) --
    // hit-testing has to mirror that same two-pass priority, or a scrolled
    // section can out-rank a fixed element that's actually on top of it.
    const viewY = y - this.scrollY;
    // Use descending zIndex order — topmost painted node (within its pass) gets the hit
    const ordered = this._byZ ? [...this._byZ].reverse() : [...this.nodes].reverse();
    // Pass 1: fixed nodes -- always visually on top, so always checked first
    for (const n of ordered) {
      if (!n.fixed) continue;
      const g = n._g;
      if (!g || g.width <= 0 || g.height <= 0) continue;
      if (g.x <= x && x <= g.x+g.width && g.y <= viewY && viewY <= g.y+g.height) return n;
    }
    // Pass 2: scrollable nodes
    for (const n of ordered) {
      if (n.fixed) continue;
      const g = n._g;
      if (!g || g.width <= 0 || g.height <= 0) continue;
      if (g.x <= x && x <= g.x+g.width && g.y <= y && y <= g.y+g.height) return n;
    }
    return null;
  }

  // ── Cross-node text selection ───────────────────────────────────────────────
  // A selection's anchor and focus can each live in a DIFFERENT node (e.g.
  // dragging across two adjacently-placed headings that are two separate
  // colored nodes). Document order is taken from this.nodes array order,
  // which always matches real DOM alias order (_syncAliases appends aliases
  // in this.nodes order into htmlTop/htmlLayer/htmlBottom).
  _findAlias(nodeId) {
    return this.htmlTop.querySelector(`[data-canvas-id="${nodeId}"]`)
        || this.htmlLayer.querySelector(`[data-canvas-id="${nodeId}"]`)
        || this.htmlBottom.querySelector(`[data-canvas-id="${nodeId}"]`);
  }

  // Normalizes the current drag's anchor/focus into document-order
  // start/end points, plus the this.nodes array-index span [loI,hiI]
  // between them (inclusive) -- nodes strictly between loI and hiI are
  // fully selected; the two endpoints are partially selected.
  _selRange() {
    const ts = this._textSel;
    if (!ts) return null;
    const ai = this.nodes.findIndex(n => n.id === ts.anchorNodeId);
    const fi = this.nodes.findIndex(n => n.id === ts.focusNodeId);
    if (ai < 0 || fi < 0) return null;
    if (ai < fi || (ai === fi && ts.anchorIdx <= ts.focusIdx)) {
      return { startNodeId:ts.anchorNodeId, startIdx:ts.anchorIdx,
               endNodeId:ts.focusNodeId,     endIdx:ts.focusIdx, loI:ai, hiI:fi };
    }
    return { startNodeId:ts.focusNodeId,  startIdx:ts.focusIdx,
             endNodeId:ts.anchorNodeId,   endIdx:ts.anchorIdx, loI:fi, hiI:ai };
  }

  // Assembles the selected text across every spanned node, in document
  // order, joined with '\n' between nodes (matches how browsers join text
  // copied across separate block-level elements).
  _selectedText(r) {
    if (r.startNodeId === r.endNodeId) {
      const node = this.nodes.find(n => n.id === r.startNodeId);
      if (!node?.content) return '';
      const a = Math.min(r.startIdx, r.endIdx), b = Math.max(r.startIdx, r.endIdx);
      return node.content.slice(a, b);
    }
    const parts = [];
    for (let i = r.loI; i <= r.hiI; i++) {
      const n = this.nodes[i];
      if (!n || !(this._TEXT_TYPES.has(n.type) || n.textSelectable) || !n.content) continue;
      if (n.id === r.startNodeId)      parts.push(n.content.slice(r.startIdx));
      else if (n.id === r.endNodeId)   parts.push(n.content.slice(0, r.endIdx));
      else                              parts.push(n.content);
    }
    return parts.join('\n');
  }

  _onMouseDown(e) {
    // ── Scrollbar drag ──────────────────────────────────────────────────────
    // Works in both design and preview mode. Detects click in the rightmost
    // 14px (scrollbar zone), starts drag from that position.
    if (this._maxScrollY > 0 && this.mode !== 'embedded') {
      const r = this.interactLayer.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      if (cx >= this.DOC_W - 14) {
        const trackH = this.DOC_H;
        const thumbH = Math.max(28, trackH * this.DOC_H / (this.DOC_H + this._maxScrollY));
        const thumbY = (this.scrollY / this._maxScrollY) * (trackH - thumbH);
        // Jump to click position if outside thumb
        if (cy < thumbY || cy > thumbY + thumbH) {
          const ratio = Math.max(0, Math.min(1, cy / trackH));
          this.scrollY = Math.round(ratio * this._maxScrollY);
        }
        this._sbDragging      = true;
        this._sbDragStartY    = cy;
        this._sbDragStartScrollY = this.scrollY;
        this._render(); this._syncScrollOnAliases();
        e.preventDefault?.();
        // Track drag outside canvas via document-level mousemove
        if (!this._docSbMove) {
          const _pw = this;
          this._docSbMove = (ev) => {
            if (!_pw._sbDragging) { document.removeEventListener('mousemove', _pw._docSbMove); _pw._docSbMove=null; return; }
            const _r = _pw.interactLayer.getBoundingClientRect();
            const _cy = ev.clientY - _r.top;
            const _trackH = _pw.DOC_H;
            const _thumbH = Math.max(28, _trackH*_pw.DOC_H/(_pw.DOC_H+_pw._maxScrollY));
            const _travelH = _trackH - _thumbH;
            const _dy = _cy - _pw._sbDragStartY;
            _pw.scrollY = Math.max(0,Math.min(_pw._maxScrollY,Math.round(_pw._sbDragStartScrollY+(_travelH>0?(_dy/_travelH)*_pw._maxScrollY:0))));
            _pw._render(); _pw._syncScrollOnAliases();
          };
          document.addEventListener('mousemove', this._docSbMove);
        }
        return;
      }
    }
    const { x, y } = this._coords(e);
    const node = this._hitTest(x, y);
    if (!node || (!this._TEXT_TYPES.has(node.type) && !node.textSelectable)) return;
    e.preventDefault();
    this.viewport.focus({ preventScroll:true }); // give vp focus so Ctrl+C fires
    const ci = node.textSelectable && !node.content ? 0 : this._pixelToCharIdx(node, x, y);
    this._textSel = { anchorNodeId:node.id, anchorIdx:ci, focusNodeId:node.id, focusIdx:ci, active:true };
    this._render();
  }

  _onMouseMove(e) {
    // ── Scrollbar drag tracking ────────────────────────────────────────────
    if (this._sbDragging) {
      const r = this.interactLayer.getBoundingClientRect();
      const cy = e.clientY - r.top;
      const trackH  = this.DOC_H;
      const thumbH  = Math.max(28, trackH * this.DOC_H / (this.DOC_H + this._maxScrollY));
      const travelH = trackH - thumbH;
      const dy = cy - this._sbDragStartY;
      this.scrollY = Math.max(0, Math.min(this._maxScrollY,
        Math.round(this._sbDragStartScrollY + (travelH > 0 ? (dy / travelH) * this._maxScrollY : 0))));
      this._render(); this._syncScrollOnAliases();
      return;
    }
    const { x, y } = this._coords(e);
    if (this._textSel?.active) {
      const hitNode = this._hitTest(x, y);
      if (hitNode && (this._TEXT_TYPES.has(hitNode.type) || hitNode.textSelectable)) {
        this._textSel.focusNodeId = hitNode.id;
        this._textSel.focusIdx = hitNode.textSelectable && !hitNode.content ? 0 : this._pixelToCharIdx(hitNode, x, y);
      } else {
        // Cursor is over empty space / a non-text node -- keep extending
        // within whichever node currently holds focus (its own geometry
        // naturally clamps the result), rather than freezing outright.
        const curNode = this.nodes.find(n => n.id === this._textSel.focusNodeId);
        if (curNode) this._textSel.focusIdx = this._pixelToCharIdx(curNode, x, y);
      }
      this._render();
      return;
    }
    const node = this._hitTest(x, y);
    const id   = node?.id ?? null;
    if (id !== this.hoveredId) {
      // per-node onHover(false) on the previously hovered node
      const prev = this.hoveredId ? this.nodes.find(n=>n.id===this.hoveredId) : null;
      prev?.onHover?.({ node:prev, hovered:false });
      this.hoveredId = id;
      this._render();
      // per-node onHover(true) on the newly hovered node
      node?.onHover?.({ node, hovered:true });
    }
    // pointer > text > default — buttons/links always pointer regardless of TEXT_TYPES membership
    const isPointer = node && (node.type==='button'||node.type==='link'||node.type==='badge'
                               || node?.cursor==='pointer');
    const isText    = node && !isPointer && (this._TEXT_TYPES.has(node.type) || node.textSelectable);
    this.interactLayer.style.cursor = isPointer ? 'pointer' : isText ? 'text' : 'default';
  }

  _onClick(e) {
    const { x, y } = this._coords(e);
    const node = this._hitTest(x, y);
    // Disabled nodes absorb the click but do nothing
    if (node?.disabled || this._nodeStyle(node || {})?.disabled) return;
    const isTextNode = node && (this._TEXT_TYPES.has(node.type) || node.textSelectable);
    const _r = this._selRange();
    if (_r && (_r.startNodeId !== _r.endNodeId || _r.startIdx !== _r.endIdx)) {
      if (!isTextNode) {
        // Clicking a non-text node: clear selection and fall through to onClick
        this._textSel = null;
        this._render();
      } else {
        return; // clicking another text node while selected: keep selection, block click
      }
    }
    if (node?.type==='link'||node?.type==='button')
      (this.htmlTop.querySelector(`[data-canvas-id="${node.id}"]`) || this.htmlLayer.querySelector(`[data-canvas-id="${node.id}"]`) || this.htmlBottom.querySelector(`[data-canvas-id="${node.id}"]`))?.click();
    if (node?.type === 'button' || node?.type === 'link') {
      this.activeId = node.id;
      clearTimeout(this._activeTimer);
      this._render();
      this._activeTimer = setTimeout(() => { this.activeId = null; this._render(); }, 150);
    }
    node?.onClick?.({ node, x, y, event:e });
  }

  _onMouseUp(e) {
    if (this._sbDragging) { this._sbDragging = false; return; }
    if (!this._textSel?.active) return;
    this._textSel.active = false;
    const r = this._selRange();
    if (r && (r.startNodeId !== r.endNodeId || r.startIdx < r.endIdx)) {
      this._syncBrowserSelection(r.startNodeId, r.startIdx, r.endNodeId, r.endIdx);
    } else {
      this._textSel = null;
      window.getSelection()?.removeAllRanges();
    }
    this._render();
  }

  _onMouseLeave() {
    // Do NOT clear _sbDragging here — document mouseup clears it.
    // This allows drag to continue outside the canvas area.
    if (this._textSel?.active) this._textSel.active=false;
    if (this.hoveredId!==null) { this.hoveredId=null; this._render(); }
  }

  _onCopy(e) {
    if (!this._textSel) return;
    const r = this._selRange();
    if (!r) return;
    const text = this._selectedText(r);
    if (!text) return;
    e.clipboardData.setData('text/plain', text);
    e.preventDefault();
  }

  // ── Canvas text selection ───────────────────────────────────────────────────
  _textMetrics(node, s) {
    const { fontStr, lineH, size } = this._fontSpec(node, s || this._nodeStyle(node));
    return { font:fontStr, lineH, size };
  }

  _wrapToLines(content, maxWidth, noWrap = false) {
    // noWrap: just split on \n (for code blocks where each line is fixed)
    if (noWrap) {
      let pos = 0;
      return content.split('\n').map(text => {
        const entry = { text, start: pos };
        pos += text.length + 1;
        return entry;
      });
    }
    // Split on explicit \n first, then word-wrap each paragraph
    const lines = [];
    for (const para of content.split('\n')) {
      const words = para.split(' ');
      let line = '', lineStart = 0, charPos = 0;
      // charOffset tracks position relative to paragraph start within full content
      const paraOffset = content.indexOf(para);
      for (const word of words) {
        const test = line + word + ' ';
        if (this.ctx.measureText(test).width > maxWidth && line) {
          lines.push({ text: line.trim(), start: paraOffset + lineStart });
          lineStart = charPos; line = word + ' ';
        } else { line = test; }
        charPos += word.length + 1;
      }
      if (line.trim()) lines.push({ text: line.trim(), start: paraOffset + lineStart });
    }
    return lines.length ? lines : [{ text: '', start: 0 }];
  }

  // Shared geometry used by _pixelToCharIdx and _drawTextSelection.
  // Returns the true text-start X, the y origin, maxWidth, and wrapped lines
  // for the node type — buttons are centre-aligned so their origin differs from
  // text-block nodes.  All coordinates are in doc-space.
  _textLayout(node) {
    const s = this._nodeStyle(node);
    const { fontStr, lineH, size } = this._fontSpec(node, s);
    const g    = node._g;
    const type = node.type;
    const text = applyTx(node.content || '', s.textTransform);

    this.ctx.save();
    this.ctx.font = fontStr;

    let originX, originY, maxW;

    if (type === 'button' || type === 'badge') {
      // Centre-aligned: measure full text width for X origin
      const fullW = this.ctx.measureText(text).width;
      originX = g.x + (g.width - fullW) / 2;
      // Cap-height optical centering: cap-to-baseline midpoint at geometric centre.
      // baseline = g.y + h/2 + capAsc/2
      // em-top (textBaseline='top' reference) = baseline - emAscPx
      this.ctx.textBaseline = 'top';
      const emAscPx  = this.ctx.measureText('H').actualBoundingBoxDescent; // em-top → baseline
      this.ctx.textBaseline = 'alphabetic';
      const capAscPx = this.ctx.measureText('H').actualBoundingBoxAscent;  // cap above baseline
      const baseline = g.y + g.height / 2 + capAscPx / 2;
      originY = baseline - emAscPx;  // em-top y for textBaseline='top'
      maxW    = g.width - (s.paddingX || 0) * 2;
    } else if (type === 'link') {
      // Mirrors the render code's hCentered check (case 'link' in _drawNode):
      // a link with verticalAlign:'middle' + explicit width is a box/button-like
      // control and centers its text horizontally instead of left-aligning.
      const hCenteredLink = s.verticalAlign === 'middle' && node.constraints?.width != null;
      if (hCenteredLink) {
        const fullWLink = this.ctx.measureText(text).width;
        originX = g.x + (g.width - fullWLink) / 2;
      } else {
        originX = g.x + (s.paddingX || 0);
      }
      // Same cap-height optical centering as the actual render code (case
      // 'link' in _drawNode), converted to a top-origin Y the same way
      // button/badge do above -- otherwise selection highlights and
      // click-to-character hit-testing land at literal g.y regardless of
      // verticalAlign, out of sync with where the text is actually drawn.
      this.ctx.textBaseline = 'top';
      const emAscPxLink  = this.ctx.measureText('H').actualBoundingBoxDescent;
      this.ctx.textBaseline = 'alphabetic';
      const capAscPxLink = this.ctx.measureText('H').actualBoundingBoxAscent;
      let linkBaseline = g.y + capAscPxLink;
      if (s.verticalAlign === 'middle' && g.height > 0) {
        linkBaseline = g.y + g.height / 2 + capAscPxLink / 2;
      }
      originY = linkBaseline - emAscPxLink;
      maxW    = hCenteredLink ? g.width : g.width - (s.paddingX || 0);
    } else {
      // Text blocks (paragraphs, headings, etc.)
      const li = s.leftIndent  || 0;
      const ri = s.rightIndent || 0;
      originX  = g.x + li + (s.paddingX || 0);
      originY  = g.y + (s.paddingY || 0);
      maxW     = g.width - li - ri - (s.paddingX || 0) * 2;
    }

    // Measure glyph metrics needed for verticalAlign:'middle' shift
    this.ctx.textBaseline = 'top';
    const emAsc   = this.ctx.measureText('H').actualBoundingBoxDescent;   // em-top → baseline
    this.ctx.textBaseline = 'alphabetic';
    const capAsc  = this.ctx.measureText('H').actualBoundingBoxAscent;    // cap above baseline
    const descBel = this.ctx.measureText('pqgjy').actualBoundingBoxDescent; // desc below baseline

    const lines = this._wrapToLines(text, Math.max(1, maxW), !!node.textSelectable);

    // Apply verticalAlign:'middle' shift so selection/pixelToChar align with _drawTextBlock
    if (s.verticalAlign === 'middle' && lines.length > 0 && g.height > 0
        && (type !== 'button') && (type !== 'badge') && (type !== 'link')) {
      const N = lines.length;
      const optCenter = (N - 1) * lineH / 2 + emAsc + (descBel - capAsc) / 2;
      let vShift = Math.round(g.y + g.height / 2 - optCenter - originY);
      if (originY + vShift < g.y) vShift = Math.round(g.y - originY);
      if (vShift > 0) originY += vShift;
    }

    this.ctx.restore();
    return { originX, originY, maxW, lineH, size, fontStr, lines, text };
  }

  _pixelToCharIdx(node, px, py) {
    const { fontStr, originX, originY, lineH, lines } = this._textLayout(node);
    this.ctx.save();
    this.ctx.font = fontStr;
    const li = Math.max(0, Math.min(Math.floor((py - originY) / lineH), lines.length - 1));
    const { text:lt, start } = lines[li];
    const relX = Math.max(0, px - originX);
    let lo=0, hi=lt.length;
    while (lo<hi) {
      const mid=Math.ceil((lo+hi)/2);
      if (this.ctx.measureText(lt.slice(0,mid)).width<=relX) lo=mid; else hi=mid-1;
    }
    this.ctx.restore();
    return start+lo;
  }

  _drawTextSelection(node) {
    const r = this._selRangeCache;
    if (!r) return;
    const ni = this.nodes.indexOf(node);
    if (ni < r.loI || ni > r.hiI) return; // not part of this selection at all
    let selA, selB;
    if (r.startNodeId === r.endNodeId) {
      selA = Math.min(r.startIdx, r.endIdx);
      selB = Math.max(r.startIdx, r.endIdx);
    } else if (node.id === r.startNodeId) {
      selA = r.startIdx; selB = (node.content || '').length;
    } else if (node.id === r.endNodeId) {
      selA = 0; selB = r.endIdx;
    } else {
      // Strictly between the two endpoints in document order: fully selected.
      selA = 0; selB = (node.content || '').length;
    }
    if (selA >= selB) return;

    const { fontStr, originX, originY, lineH, lines } = this._textLayout(node);
    const ctx = this.ctx;
    const g = node._g;
    if (!g) { return; }
    const _hasExpH = node.constraints?.height != null;
    ctx.save();
    if (_hasExpH) {
      ctx.beginPath(); ctx.rect(g.x, g.y, g.width, g.height); ctx.clip();
    }
    ctx.font = fontStr;

    // ── Two-baseline measurement — no fontBoundingBoxAscent needed ─────────────
    //
    // Key insight: H has no descender, so its bounding-box bottom = alphabetic baseline.
    // With textBaseline='top':  em-top is the reference line (y=0).
    //   actualBoundingBoxDescent('H') = distance from em-top DOWN to H's bottom
    //                                 = distance from em-top to alphabetic baseline
    //                                 = em_ascent  ← always available, no fallback needed.
    //
    // With textBaseline='alphabetic': baseline is the reference line (y=0).
    //   actualBoundingBoxAscent('H')     = cap_height above baseline  (positive)
    //   actualBoundingBoxDescent('pqgjy') = descender depth below baseline (positive)
    //
    // Therefore:
    //   capOffset = em_ascent - cap_height   (gap from em-top down to cap-top)
    //   hlH       = cap_height + descender   (cap-top to descender-bottom)
    //   highlightY = lineTop + capOffset
    //
    ctx.textBaseline = 'top';
    const emAsc   = ctx.measureText('H').actualBoundingBoxDescent; // em-top → baseline

    ctx.textBaseline = 'alphabetic';
    const capAsc  = ctx.measureText('H').actualBoundingBoxAscent;      // cap above baseline
    const descBel = ctx.measureText('pqgjy').actualBoundingBoxDescent; // desc below baseline

    const capOffset = emAsc  - capAsc;   // gap: em-top → cap-top   (positive)
    const hlH       = capAsc + descBel;  // height: cap-top → desc-bottom

    const s_sel   = this._nodeStyle(node);
    const selBg   = s_sel.selectionColor      || this._config.selectionColor    || 'rgba(15,98,254,0.3)';
    const selTxt  = s_sel.selectionTextColor  || this._config.selectionTextColor;

    ctx.fillStyle = selBg;

    for (let li = 0; li < lines.length; li++) {
      const { text: lt, start } = lines[li];
      const lineEnd = start + lt.length;
      const oA = Math.max(selA, start) - start;
      const oB = Math.min(selB, lineEnd) - start;
      if (oA < oB) {
        const x1 = originX + ctx.measureText(lt.slice(0, oA)).width;
        const x2 = originX + ctx.measureText(lt.slice(0, oB)).width;
        const lyY = originY + li * lineH + capOffset;
        ctx.fillRect(x1, lyY, x2 - x1, hlH);
        // Optional: draw selected text in a different color
        if (selTxt) {
          ctx.save();
          ctx.fillStyle = selTxt;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(lt.slice(oA, oB), x1, originY + li * lineH + emAsc);
          ctx.restore();
        }
      }
    }
    ctx.restore();
  }

  _syncBrowserSelection(startNodeId, startIdx, endNodeId, endIdx) {
    const startAlias = this._findAlias(startNodeId);
    const endAlias   = this._findAlias(endNodeId);
    if (!startAlias || !endAlias) return;
    const stn = [...startAlias.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
    const etn = [...endAlias.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
    if (!stn || !etn) return;
    try {
      const range=document.createRange();
      range.setStart(stn, Math.min(startIdx,stn.length));
      range.setEnd(etn,   Math.min(endIdx,  etn.length));
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    } catch(_) {}
  }

  // ── Canvas renderer ─────────────────────────────────────────────────────────
  _isColorDark(color) {
    const m = (color || '').match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if (!m) return false;
    return 0.299*parseInt(m[1],16) + 0.587*parseInt(m[2],16) + 0.114*parseInt(m[3],16) < 128;
  }

  _render() {
    const { ctx, DOC_W, DOC_H } = this;
    ctx.clearRect(0,0,DOC_W,DOC_H);
    ctx.fillStyle = this.clearColor ?? '#ffffff'; ctx.fillRect(0,0,DOC_W,DOC_H);
    // Computed once per frame, reused by every _drawTextSelection call below
    // instead of each node re-deriving it independently.
    this._selRangeCache = this._textSel ? this._selRange() : null;

    // Use cached zIndex sort; invalidated by add/update/remove via this._zDirty
    if (this._zDirty || !this._byZ) {
      this._byZ = [...this.nodes].sort((a,b) => ((a.zIndex||0) - (b.zIndex||0)));
      this._zDirty = false;
    }
    const byZ = this._byZ;

    // ── Scrollable nodes ─────────────────────────────────────────────────────
    // embedded: no internal scroll — page scroll positions canvas already
    const scrollOffset = this.mode === 'embedded' ? 0 : this.scrollY;
    const cullTop    = scrollOffset - 128;
    const cullBottom = scrollOffset + this.DOC_H + 128;
    ctx.save();
    ctx.translate(0, -scrollOffset);
    for (const node of byZ) {
      if (node.fixed) continue;
      const g = node._g;
      if (!g) continue;
      // skip if fully above or fully below the culled window
      if (g.y + g.height < cullTop || g.y > cullBottom) continue;
      this._drawNode(node);
    }
    ctx.restore();
    // Reset any transform accumulated by imbalanced render() functions
    // so fixed nodes and scrollbar always draw at correct viewport coordinates
    ctx.setTransform(this._dpr || 1, 0, 0, this._dpr || 1, 0, 0);

    // ── Fixed nodes (viewport-relative, always visible) ─────────────────────
    for (const node of byZ) { if (node.fixed)  this._drawNode(node); }

    // ── Scrollbar pill ───────────────────────────────────────────────────────
    // Scrollbar — try/catch so ctx.roundRect errors never prevent it drawing
    if (this._maxScrollY > 0) {
      try {
        const trackH = DOC_H;
        const thumbH = Math.max(28, trackH * DOC_H / (DOC_H + this._maxScrollY));
        const thumbY = (this.scrollY / this._maxScrollY) * (trackH - thumbH);
        ctx.save();
        ctx.fillStyle = this._isColorDark(this.clearColor || '#ffffff')
          ? 'rgba(255,255,255,0.28)'
          : 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(DOC_W - 6, thumbY + 2, 4, thumbH - 4, 2);
        } else {
          ctx.rect(DOC_W - 6, thumbY + 2, 4, thumbH - 4);
        }
        ctx.fill();
        ctx.restore();
      } catch(e) { /* scrollbar draw — non-fatal */ }
    }
    // Sync portals and native inputs
    for (const cb of this._renderCallbacks) cb();
  }

  _drawNode(node) {
    const { ctx } = this;
    const { id, type, content, _g:g } = node;
    if (!g || g.width <= 0 || g.height <= 0) return; // skip zero-size nodes
    const hov = id===this.hoveredId;
    const previewHover = hov && (type==='button'||type==='link');
    const s = this._nodeStyle(node, previewHover, false);

    ctx.save();

    // ── Opacity ──────────────────────────────────────────────────────────────
    if (s.opacity != null && s.opacity !== 1) ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity));

    // Keyboard focus ring — drawn when this node's alias has DOM focus
    if (id === this.focusedId) {
      ctx.save(); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.strokeRect(g.x - 2, g.y - 2, g.width + 4, g.height + 4);
      ctx.strokeStyle = '#0f62fe'; ctx.lineWidth = 2;
      ctx.strokeRect(g.x - 2, g.y - 2, g.width + 4, g.height + 4);
      ctx.restore();
    }

    // ── Custom render escape hatch ────────────────────────────────────────────
    // node.render = (ctx, geometry, resolvedStyle) => void
    if (typeof node.render === 'function') {
      ctx.save(); // isolate user render state changes
      try {
        node.render(ctx, g, s);
      } catch (err) {
        console.warn('Primework: node.render error on "' + id + '":', err);
      }
      ctx.restore(); // restore even if render threw
      ctx.restore(); // restore outer _drawNode save
      if (this._TEXT_TYPES.has(type) || node.textSelectable) this._drawTextSelection(node);
      return;
    }

    // ── Draw by type ──────────────────────────────────────────────────────────
    switch (type) {

      case 'rect': {
        this._drawSurface(g, s);
        break;
      }

      case 'heading1': case 'heading2': case 'heading3':
      case 'heading4': case 'heading5': case 'heading6':
      case 'subheading': case 'paragraph': case 'label': case 'code': {
        if (s.background) this._drawSurface(g, s);
        this._drawTextBlock(g, s, node, content||'');
        break;
      }

      case 'blockquote': {
        if (s.background) this._drawSurface(g, s);
        if (s.leftIndent > 0) {
          ctx.save(); ctx.globalAlpha = 1;
          ctx.fillStyle = s.borderColor||'#0f62fe';
          ctx.fillRect(g.x, g.y, s.borderWidth||3, g.height);
          ctx.restore();
        }
        this._drawTextBlock(g, s, node, content||'');
        break;
      }

      case 'button': {
        const bs = this._nodeStyle(node, hov, this.activeId===id);
        this._drawSurface(g, bs);
        const { fontStr } = this._fontSpec(node, bs);
        ctx.save();
        ctx.font = fontStr;
        ctx.fillStyle = bs.color || '#fff';
        ctx.textAlign = 'center';
        // Cap-height optical centering: midpoint of cap-to-baseline sits at button centre.
        // baseline = g.y + h/2 + capAsc/2  (alphabetic baseline position)
        ctx.textBaseline = 'alphabetic';
        const capAscBtn = ctx.measureText('H').actualBoundingBoxAscent;
        ctx.fillText(applyTx(content||'', bs.textTransform), g.x+g.width/2, g.y+g.height/2 + capAscBtn/2);
        ctx.restore();
        break;
      }

      case 'link': {
        const ls = this._nodeStyle(node, hov, false);
        if (ls.background || ls.border || (ls.borderWidth && ls.borderColor)) this._drawSurface(g, ls);
        const { fontStr, size } = this._fontSpec(node, ls);
        ctx.save();
        ctx.font = fontStr;
        ctx.fillStyle = ls.color || '#0f62fe';

        // Vertical centering: measure with alphabetic baseline
        // capAsc = cap height above baseline
        ctx.textBaseline = 'alphabetic';
        const capAscLink  = ctx.measureText('H').actualBoundingBoxAscent;
        // Default: baseline just below g.y so cap-top aligns to g.y
        let linkBaselineY = g.y + capAscLink;
        // When verticalAlign:'middle' AND node has explicit height, center optically.
        // Same cap-height-only rule as button/badge -- keeps boxed links (e.g. a
        // ghost-button-style link sitting next to a real button) centered on the
        // identical baseline, not a couple pixels off from accounting for descenders.
        if (ls.verticalAlign === 'middle' && g.height > 0) {
          linkBaselineY = g.y + g.height / 2 + capAscLink / 2;
        }

        const lt = applyTx(content || '', ls.textTransform);

        // A link with verticalAlign:'middle' AND an explicit width is being used
        // as a box/button-like control (not an inline text link) -- center its
        // text horizontally too, matching how button/badge center, instead of
        // always left-aligning at g.x regardless of how much extra box width
        // sits unused to the right.
        const hCentered = ls.verticalAlign === 'middle' && node.constraints?.width != null;
        let textX;
        if (hCentered) {
          ctx.textAlign = 'center';
          textX = g.x + g.width / 2;
        } else {
          ctx.textAlign = 'start';
          textX = g.x + (ls.paddingX || 0);
        }
        ctx.fillText(lt, textX, linkBaselineY);

        if (ls.underline || ls.textDecoration === 'underline') {
          // Underline sits at the baseline
          const ulY = linkBaselineY + (ls.underlineOffset ?? 2);
          const tw  = ctx.measureText(lt).width;
          ctx.strokeStyle = ls.underlineColor || ls.color || '#0f62fe';
          ctx.lineWidth   = ls.underlineWidth || 1;
          if (ls.underlineStyle === 'dashed')      ctx.setLineDash([4, 3]);
          else if (ls.underlineStyle === 'dotted') ctx.setLineDash([1, 2]);
          const ulStartX = hCentered ? textX - Math.min(tw, g.width) / 2 : textX;
          ctx.beginPath();
          ctx.moveTo(ulStartX, ulY);
          ctx.lineTo(ulStartX + Math.min(tw, g.width), ulY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
        break;
      }

      case 'badge': {
        this._drawSurface(g, s);
        const { fontStr } = this._fontSpec(node, s);
        ctx.save();
        ctx.font = fontStr;
        ctx.fillStyle = s.color || '#fff';
        ctx.textAlign = 'center';
        // Same cap-height optical centering as button
        ctx.textBaseline = 'alphabetic';
        const capAscBadge = ctx.measureText('H').actualBoundingBoxAscent;
        ctx.fillText(applyTx(content||'', s.textTransform), g.x+g.width/2, g.y+g.height/2 + capAscBadge/2);
        ctx.restore();
        break;
      }

      case 'image': {
        // If src provided, load and draw the actual image (async, re-renders on load)
        if (node.src && !node._imgErr) {
          // Invalidate cache if src changed
          if (node._img && node._imgSrc !== node.src) { node._img = null; node._imgErr = false; }
          node._imgSrc = node.src;
          if (!node._img) {
            node._img = new Image();
            node._img.onload  = () => this._render();
            node._img.onerror = () => { node._imgErr = true; this._render(); };
            node._img.src = node.src;
          }
          if (node._img.complete && node._img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath(); ctx.rect(g.x, g.y, g.width, g.height); ctx.clip();
            if (s.borderRadius) { ctx.beginPath(); this._rrect(g.x,g.y,g.width,g.height,s.borderRadius); ctx.clip(); }
            ctx.drawImage(node._img, g.x, g.y, g.width, g.height);
            ctx.restore();
            break;
          }
        }
        // Cross-hatch placeholder (shown while loading or when no src)
        ctx.save();
        ctx.fillStyle = '#e8e8e8'; ctx.fillRect(g.x,g.y,g.width,g.height);
        ctx.strokeStyle='#d0d0d0'; ctx.lineWidth=1; ctx.strokeRect(g.x,g.y,g.width,g.height);
        ctx.strokeStyle='#c8c8c8';
        ctx.beginPath(); ctx.moveTo(g.x,g.y); ctx.lineTo(g.x+g.width,g.y+g.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(g.x+g.width,g.y); ctx.lineTo(g.x,g.y+g.height); ctx.stroke();
        ctx.fillStyle='#8d8d8d'; ctx.font='11px IBM Plex Mono,monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(node._imgErr ? 'failed to load' : (node.alt||'image'), g.x+g.width/2, g.y+g.height/2);
        ctx.restore();
        break;
      }

      case 'divider': {
        ctx.save();
        ctx.strokeStyle=s.color||'#e0e0e0'; ctx.lineWidth=s.thickness||1;
        if (s.style==='dashed') ctx.setLineDash([6,4]);
        ctx.beginPath(); ctx.moveTo(g.x,g.y+g.height/2); ctx.lineTo(g.x+g.width,g.y+g.height/2); ctx.stroke();
        ctx.restore();
        break;
      }
    }

    ctx.restore();
    if (this._TEXT_TYPES.has(type)) this._drawTextSelection(node);
  }

  // Draw a background surface — handles solid colours, gradients, shadow, border
  _drawSurface(g, s) {
    const { ctx } = this;
    ctx.save();
    if (s.shadow) {
      ctx.shadowColor   = s.shadowColor   || 'rgba(0,0,0,0.12)';
      ctx.shadowBlur    = s.shadowBlur    || 16;
      ctx.shadowOffsetY = s.shadowOffsetY || 4;
    }
    if (s.background) {
      ctx.fillStyle = parseBackground(s.background, g, ctx); // gradient-aware
      if (s.borderRadius) { this._rrect(g.x,g.y,g.width,g.height,s.borderRadius); ctx.fill(); }
      else ctx.fillRect(g.x,g.y,g.width,g.height);
    }
    ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    if (s.border || (s.borderWidth && s.borderColor)) {
      ctx.strokeStyle = s.border || s.borderColor || '#e0e0e0';
      ctx.lineWidth   = s.borderWidth || 1;
      if (s.borderRadius) ctx.stroke();
      else ctx.strokeRect(g.x,g.y,g.width,g.height);
    }
    ctx.restore();
  }

  // Draw wrapped text — handles all typographic decorations and reference system
  _drawTextBlock(g, s, node, content) {
    const ctx = this.ctx;
    const { fontStr, size, lineH, family } = this._fontSpec(node, s);

    // ── Text pre-processing ──────────────────────────────────────────────────
    let text = applyTx(content, s.textTransform);
    if ((s.smartQuotes ?? this._config.smartQuotes) && text) text = applySmartQuotes(text);

    // ── Layout geometry ──────────────────────────────────────────────────────
    // Ordered list: derive bullet from listCounterStyle + node.listIndex
    let _effectiveBullet = s.listBullet || '';
    if (!_effectiveBullet && s.listCounterStyle && node.listIndex != null) {
      const idx = node.listIndex;
      switch(s.listCounterStyle) {
        case 'decimal':     _effectiveBullet = idx + '.'; break;
        case 'lower-alpha': _effectiveBullet = String.fromCharCode(96+idx) + '.'; break;
        case 'upper-alpha': _effectiveBullet = String.fromCharCode(64+idx) + '.'; break;
        case 'lower-roman': _effectiveBullet = _toRoman(idx).toLowerCase() + '.'; break;
        case 'upper-roman': _effectiveBullet = _toRoman(idx) + '.'; break;
        default:            _effectiveBullet = s.listCounterStyle.replace('%d', idx);
      }
    }
    const bulletIndent = _effectiveBullet ? (s.listBulletIndent ?? 16) : 0;
    const li    = (s.leftIndent  || 0) + bulletIndent + (s.paddingX || 0);
    const ri    = (s.rightIndent || 0) + (s.paddingX || 0);
    const maxW  = Math.max(1, g.width - li - ri);
    const originX = g.x + li;

    // topReference: project default → alignTo per-style override
    const alignTo = s.alignTo || this._topRefToAlignTo(this._config.topReference);
    let py = g.y + (s.paddingY || 0);
    if (alignTo) py += FONT_METRICS.alignOffset(size, family, s.weight || '400', alignTo, ctx);
    py += (s.baselineOffset || 0);

    ctx.save();
    ctx.font = fontStr;

    // ── Letter spacing (charSpace in em) ─────────────────────────────────────
    const cs = s.charSpace ?? this._config.charSpace ?? 0;
    if (cs !== 0 && 'letterSpacing' in ctx) ctx.letterSpacing = (cs * size) + 'px';

    // ── Glyph metrics via direct measurement (same method as _drawTextSelection) ──
    // textBaseline='top': H.actualBoundingBoxDescent = em-top → alphabetic baseline
    // textBaseline='alphabetic': H.actualBoundingBoxAscent = cap height above baseline
    //                            x.actualBoundingBoxAscent = x-height above baseline
    //                            pqgjy.actualBoundingBoxDescent = descender below baseline
    ctx.textBaseline = 'top';
    const emAsc  = ctx.measureText('H').actualBoundingBoxDescent;   // em-top → baseline
    ctx.textBaseline = 'alphabetic';
    const capAsc = ctx.measureText('H').actualBoundingBoxAscent;    // cap above baseline
    const xAsc   = ctx.measureText('x').actualBoundingBoxAscent;    // x above baseline
    const descBel= ctx.measureText('pqgjy').actualBoundingBoxDescent; // desc below baseline

    // ── Optical margin: compute BEFORE _wrapToLines so lines use correct maxW ──
    let omaShift = 0;
    if ((s.opticalMargin ?? this._config.opticalMargin) && text.length > 0) {
      const frac = OPTICAL_HANG[text[0]] || 0;
      if (frac) omaShift = ctx.measureText(text[0]).width * frac;
    }

    // firstLineIndent — declared at function scope so underline/strike loops can use it
    const fli = s.firstLineIndent || 0;

    // ── Compute wrapped lines once (used by decorations too) ──────────────────
    const lines = this._wrapToLines(text, maxW + omaShift); // match actual draw width

    // ── verticalAlign:'middle' — compute and apply shift BEFORE drawing anything ──
    let _vAlignShift = 0;
    if (s.verticalAlign === 'middle' && lines.length > 0 && g.height > 0) {
      const N2 = lines.length;
      const optCenter2 = (N2 - 1) * lineH / 2 + emAsc + (descBel - capAsc) / 2;
      _vAlignShift = Math.round(g.y + g.height / 2 - optCenter2 - py);
      if (py + _vAlignShift < g.y) _vAlignShift = Math.round(g.y - py);
      if (_vAlignShift > 0) py += _vAlignShift;
    }

    // ── Highlight (drawn BEHIND text, uses shifted py) ────────────────────────
    if (s.highlight) {
      const topRef  = s.highlightLevel    || 'cap_height';
      const botRef  = s.highlightBottomRef || 'descender';
      const above   = topRef === 'x_height'  ? xAsc
                    : topRef === 'em'         ? emAsc
                    : topRef === 'baseline'   ? 0
                    : capAsc;  // 'cap_height' default
      const below   = botRef === 'baseline'  ? 0
                    : botRef === 'x_height'  ? -xAsc   // above baseline, so negative offset
                    : descBel; // 'descender' default
      ctx.save();
      // Gradients and shader functions control their own alpha — don't multiply by 0.4.
      // Solid-color highlights get 0.4 default opacity for a watercolor feel.
      const _isGradFn = typeof hc === 'function' || (typeof hc === 'string' && /gradient/.test(hc));
      ctx.globalAlpha = s.highlightOpacity ?? (_isGradFn ? 1.0 : 0.4);
      lines.forEach(({ text: lt }, li_i) => {
        ctx.font = fontStr;
        const tw       = ctx.measureText(lt).width;
        const baseline = py + li_i * lineH + emAsc;
        const hlTop    = baseline - above  - (s.highlightExpandTop    || 0);
        const hlBot    = baseline + below  + (s.highlightExpandBottom || 0);
        const hlH2     = hlBot - hlTop;
        const hc = s.highlightColor || '#ffff00';
        // Function → custom shader receiving (ctx, x, y, w, h, time)
        if (typeof hc === 'function') {
          ctx.fillStyle = hc(ctx, originX, hlTop, tw, hlH2, this.time || 0) || '#ffff00';
        } else if (typeof hc === 'string' && /gradient/.test(hc)) {
          // CSS gradient string → canvas gradient over the highlight rect
          ctx.fillStyle = parseBackground(hc, { x:originX, y:hlTop, width:tw, height:hlH2 }, ctx);
        } else {
          ctx.fillStyle = hc;
        }
        ctx.fillRect(originX, hlTop, tw, hlH2);
      });
      ctx.restore();
      ctx.font = fontStr;
      if (cs !== 0 && 'letterSpacing' in ctx) ctx.letterSpacing = (cs * size) + 'px';
    }

    // ── Rule above ───────────────────────────────────────────────────────────
    if (s.ruleAbove) {
      const ruleY = py + emAsc - capAsc - (s.ruleAboveOffset || 4);
      ctx.save();
      ctx.strokeStyle = s.ruleAboveColor || s.color || '#000000';
      ctx.lineWidth   = s.ruleAboveWidth || 1;
      ctx.beginPath();
      ctx.moveTo(g.x + (s.paddingX||0), ruleY);
      ctx.lineTo(g.x + g.width - (s.paddingX||0), ruleY);
      ctx.stroke();
      ctx.restore();
      ctx.font = fontStr;
    }

    // ── List bullet ──────────────────────────────────────────────────────────
    if (_effectiveBullet) {
      const bSize = s.listBulletSize || size;
      ctx.save();
      ctx.font        = fontStr.replace(/[\d.]+px/, bSize + 'px');
      ctx.fillStyle   = s.listBulletColor || s.color || '#000000';
      ctx.textBaseline= 'top';
      ctx.fillText(_effectiveBullet,
        g.x + (s.leftIndent||0) + (s.paddingX||0) + (s.listBulletOffset||0), py);
      ctx.restore();
      ctx.font = fontStr;
      if (cs !== 0 && 'letterSpacing' in ctx) ctx.letterSpacing = (cs * size) + 'px';
    }

    // ── Draw text ────────────────────────────────────────────────────────────
    ctx.fillStyle    = s.color || '#161616';
    // _vAlignShift already applied to py above (before highlight drawing)

    ctx.textBaseline = 'top';
    if (s.alignment === 'center') {
      ctx.textAlign = 'center';
      this._wrap(text, g.x + g.width / 2, py, maxW, lineH);
    } else if (s.alignment === 'right') {
      ctx.textAlign = 'right';
      this._wrap(text, g.x + g.width - (s.paddingX||0) - (s.rightIndent||0), py, maxW, lineH);
    } else if (s.alignment === 'justify') {
      this._wrapJustified(text, originX - omaShift, py, maxW + omaShift, lineH);
    } else {
      if (fli) {
        // Draw first line with indent, remaining lines at originX
        const ctx2 = ctx;
        ctx2.textBaseline = 'top';
        const words = text.split(' ');
        let line = '', firstDone = false;
        let fy = py;
        for (const w of words) {
          const t = line + w + ' ';
          const indX  = firstDone ? originX - omaShift : originX + fli;
          const indW  = firstDone ? maxW + omaShift    : maxW - fli + omaShift;
          if (ctx2.measureText(t).width > indW && line) {
            ctx2.fillText(line.trimEnd(), indX, fy);
            fy += lineH; line = w + ' '; firstDone = true;
          } else line = t;
        }
        if (line.trim()) ctx2.fillText(line.trimEnd(), firstDone ? originX - omaShift : originX + fli, fy);
      } else {
        this._wrap(text, originX - omaShift, py, maxW + omaShift, lineH);
      }
    }

    // ── Underline ────────────────────────────────────────────────────────────
    const doUnderline = s.underline || s.textDecoration === 'underline';
    if (doUnderline) {
      lines.forEach(({ text: lt }, li_i) => {
        if (!lt) return; // skip empty lines from \n
        ctx.font = fontStr;
        const tw       = ctx.measureText(lt).width;
        const baseline = py + li_i * lineH + emAsc;
        const ulY      = baseline + (s.underlineOffset ?? 2);
        // First line shifted right by firstLineIndent
        const ulX = originX + (li_i === 0 && fli ? fli : 0);
        ctx.save();
        ctx.strokeStyle = s.underlineColor || s.color || '#000000';
        ctx.lineWidth   = s.underlineWidth || 1;
        if (s.underlineStyle === 'dashed')  ctx.setLineDash([4, 3]);
        if (s.underlineStyle === 'dotted')  ctx.setLineDash([1, 2]);
        ctx.beginPath(); ctx.moveTo(ulX, ulY); ctx.lineTo(ulX + tw, ulY);
        ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
      });
    }

    // ── Strikethrough ────────────────────────────────────────────────────────
    const doStrike = s.strikethrough || s.textDecoration === 'line-through';
    if (doStrike) {
      lines.forEach(({ text: lt }, li_i) => {
        if (!lt) return; // skip empty lines from \n
        ctx.font = fontStr;
        const tw       = ctx.measureText(lt).width;
        const baseline = py + li_i * lineH + emAsc;
        const stY      = s.strikethroughOffset != null
          ? baseline - s.strikethroughOffset
          : baseline - xAsc / 2;
        const stX = originX + (li_i === 0 && fli ? fli : 0);
        ctx.save();
        ctx.strokeStyle = s.strikethroughColor || s.color || '#000000';
        ctx.lineWidth   = s.strikethroughWidth || 1;
        ctx.beginPath(); ctx.moveTo(stX, stY); ctx.lineTo(stX + tw, stY);
        ctx.stroke();
        ctx.restore();
      });
    }

    // ── Rule below ───────────────────────────────────────────────────────────
    if (s.ruleBelow && lines.length > 0) {
      const lastBaseline = py + (lines.length - 1) * lineH + emAsc;
      const ruleY = lastBaseline + descBel + (s.ruleBelowOffset || 4);
      ctx.save();
      ctx.strokeStyle = s.ruleBelowColor || s.color || '#000000';
      ctx.lineWidth   = s.ruleBelowWidth || 1;
      ctx.beginPath();
      ctx.moveTo(g.x + (s.paddingX||0), ruleY);
      ctx.lineTo(g.x + g.width - (s.paddingX||0), ruleY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  _wrap(text, x, y, maxW, lineH) {
    const ctx = this.ctx;
    for (const rawLine of text.split('\n')) {
      if (!rawLine) { y += lineH; continue; }
      const words = rawLine.split(' ');
      let line = '';
      for (const w of words) {
        const t = line + w + ' ';
        if (ctx.measureText(t).width > maxW && line) {
          ctx.fillText(line.trimEnd(), x, y); y += lineH; line = w + ' ';
        } else line = t;
      }
      if (line.trim()) { ctx.fillText(line.trimEnd(), x, y); y += lineH; }
    }
  }

  // Justified text: distributes whitespace evenly across all word gaps per line.
  // Last line (and single-word lines) are drawn left-aligned.
  _wrapJustified(text, x, py, maxW, lineH) {
    const ctx  = this.ctx;
    const lines = this._wrapToLines(text, maxW + omaShift); // match actual draw width   // 
-aware
    lines.forEach(({ text: lt }, li) => {
      if (!lt) { py += lineH; return; }             // blank 
 line
      const isLast = li === lines.length - 1;
      if (isLast) { ctx.fillText(lt, x, py); py += lineH; return; }
      const words = lt.split(' ').filter(w => w.length > 0);
      if (words.length <= 1) { ctx.fillText(lt, x, py); py += lineH; return; }
      const totalW = words.reduce((s, w) => s + ctx.measureText(w).width, 0);
      const gap    = (maxW - totalW) / (words.length - 1);
      let wx = x;
      words.forEach((w, wi) => {
        ctx.fillText(w, wx, py);
        if (wi < words.length - 1) wx += ctx.measureText(w).width + gap;
      });
      py += lineH;
    });
  }

  _rrect(x,y,w,h,r) {
    const c=this.ctx, R=Math.min(r,w/2,h/2);
    c.beginPath(); c.moveTo(x+R,y); c.arcTo(x+w,y,x+w,y+h,R);
    c.arcTo(x+w,y+h,x,y+h,R); c.arcTo(x,y+h,x,y,R); c.arcTo(x,y,x+w,y,R); c.closePath();
  }

  // ── HTML alias layer ────────────────────────────────────────────────────────
  _syncAliases() {
    // Batch alias DOM writes into DocumentFragments — one reflow instead of n
    const frag    = document.createDocumentFragment();
    const fragTop = document.createDocumentFragment();
    const fragBot = document.createDocumentFragment();
    for (const node of this.nodes) {
      if (!node.fixed) {
        frag.appendChild(this._makeAlias(node));
      } else if (node.constraints?.bottom != null) {
        // bottom-anchored fixed node (footer) → goes last in tab order
        fragBot.appendChild(this._makeAlias(node));
      } else {
        // top-anchored fixed node (nav) → goes first in tab order
        fragTop.appendChild(this._makeAlias(node));
      }
    }
    this.htmlTop.innerHTML    = '';
    this.htmlLayer.innerHTML  = '';
    this.htmlBottom.innerHTML = '';
    this.htmlTop.appendChild(fragTop);
    this.htmlLayer.appendChild(frag);
    this.htmlBottom.appendChild(fragBot);
    // htmlTop/htmlBottom hold real content only on pages using fixed nodes
    // (a fixed nav, a fixed footer) -- on any page without them they're
    // genuinely empty structural wrappers, which otherwise show up as
    // meaningless "generic" nodes in the accessibility tree. Only hide them
    // when they truly have nothing in them, never unconditionally -- doing
    // so always would wrongly hide real navigation/footer content on pages
    // that do use fixed elements.
    this.htmlTop.setAttribute('aria-hidden', this.htmlTop.children.length === 0 ? 'true' : 'false');
    this.htmlBottom.setAttribute('aria-hidden', this.htmlBottom.children.length === 0 ? 'true' : 'false');
    this._refreshAliases();
  }

  _allAliasEls() {
    return [...this.htmlTop.children, ...this.htmlLayer.children, ...this.htmlBottom.children];
  }

  _makeAlias(node) {
    const { id, type, content, _g:g } = node;
    const s    = this._nodeStyle(node);
    const isInteractive = type === 'button' || type === 'link';
    const isDisabled    = node.disabled || s.disabled || false;
    // node.tag lets a node render its alias as a different element than its
    // type implies -- e.g. a node styled like heading1 for visual purposes
    // only (a showcase sample, a decorative label) can alias to <div>/<p>
    // instead of <h1>, so it doesn't pollute the real document/heading outline.
    const tag  = node.tag || this._TAGS[type] || 'div';
    const el   = document.createElement(tag);

    // ── Dataset ─────────────────────────────────────────────────────────────
    el.dataset.canvasId = id;
    el.dataset.type     = type;

    // ── Content ─────────────────────────────────────────────────────────────
    if (type === 'image') {
      el.setAttribute('alt', node.alt || content || '');
    } else if (type !== 'divider' && type !== 'rect') {
      el.textContent = content || '';
    }

    // ── ARIA attributes ──────────────────────────────────────────────────────
    if (node.ariaSelected != null) el.setAttribute('aria-selected', String(node.ariaSelected));
    if (node.ariaLabel)       el.setAttribute('aria-label',       node.ariaLabel);
    if (node.ariaDescribedBy) el.setAttribute('aria-describedby', node.ariaDescribedBy);
    if (node.ariaExpanded != null) el.setAttribute('aria-expanded', String(node.ariaExpanded));
    if (node.ariaLive) {
      el.setAttribute('aria-live', node.ariaLive);
      el.setAttribute('aria-atomic', node.ariaAtomic ?? 'false');
    }
    // Auto-assign landmark roles to fixed structural nodes
    if (node.fixed && node.constraints?.bottom != null && !node.role)
      el.setAttribute('role', 'contentinfo');  // bottom-fixed = footer
    else if (node.fixed && node.constraints?.top != null && tag === 'section' && !node.role)
      el.setAttribute('role', 'banner');       // top-fixed = header/nav region
    if (node.role && tag !== 'button' && tag !== 'a') el.setAttribute('role', node.role);
    if (isDisabled) {
      el.setAttribute('aria-disabled', 'true');
      el.setAttribute('tabindex', '-1');          // disabled: remove from tab order
    } else if (isInteractive) {
      el.setAttribute('tabindex', '0');
      if (type === 'link') {
        el.setAttribute('href', node.href || '#');
        el.setAttribute('role', 'link');
      }
    }

    // ── Base styles — always transparent, always pointer-events:none except for focus ─
    const isTextSelectable = this._TEXT_TYPES.has(type) || node.textSelectable;
    el.style.cssText = `
      position:absolute;
      left:${g.x}px; top:${g.y}px; width:${g.width}px; height:${g.height}px;
      font-size:${s.size||15}px; font-family:${s.font||'inherit'};
      font-weight:${s.weight||'400'}; ${s.italic?'font-style:italic;':''}
      line-height:${s.lineSpacing||1.5};
      overflow:hidden; white-space:pre-wrap; word-break:break-word;
      padding:0; margin:0; border:none; outline:none;
      text-decoration:none; box-sizing:border-box;
      pointer-events:none;
      ${isTextSelectable
        ? 'user-select:text; -webkit-user-select:text;'
        : 'user-select:none; -webkit-user-select:none;'}
      color:transparent; background:transparent;
    `;

    // Interactive elements: pointer-events:auto so Tab can reach them.
    // They remain visually transparent — canvas renders the visual state.
    // We DON'T set pointer-events:auto here to avoid stealing mouse events
    // from the interact layer. Instead we rely on Tab / keyboard only.
    // Focus is received via the browser's natural tab navigation.
    if (isInteractive && !isDisabled) {
      // Allow the element to be Tab-focused; mouse events still blocked
      el.style.pointerEvents = 'none'; // mouse: canvas owns this
      // But the browser CAN focus a tabindex=0 element even with pointer-events:none
    }

    // ── Focus / blur → update canvas focus ring ──────────────────────────────
    if (isInteractive && !isDisabled) {
      el.addEventListener('focus', () => {
        this.focusedId = id;
        this._render();
        node.onFocus?.({ node });
        // Auto-scroll canvas so focused node is visible
        const g = node._g;
        if (g && !node.fixed) {
          const top = this.scrollY, bot = this.scrollY + this.DOC_H;
          if (g.y < top + 20 || g.y + g.height > bot - 20) {
            this.scrollY = Math.max(0, Math.min(this._maxScrollY,
              g.y + g.height / 2 - this.DOC_H / 2));
            this._render();
            this._syncScrollOnAliases();
          }
        }
      });
      el.addEventListener('blur', () => {
        if (this.focusedId === id) { this.focusedId = null; this._render(); }
        node.onBlur?.({ node });
      });

      // ── Keyboard activation ──────────────────────────────────────────────
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || (e.key === ' ' && type === 'button')) {
          e.preventDefault();
          const g = node._g;
          node?.onClick?.({ node, x: g.x + g.width/2, y: g.y + g.height/2, event:e });
          if (type === 'link' && node.href) window.location.href = node.href;
        }
      });
    }

    return el;
  }

  _repositionAliases() {
    const _rMap = new Map(this.nodes.map(n=>[n.id,n]));
    for (const el of this._allAliasEls()) {
      const node=_rMap.get(el.dataset.canvasId);
      if (!node?._g) continue;
      const { x,y,width,height }=node._g;
      el.style.left=x+'px'; el.style.top=y+'px';
      el.style.width=width+'px'; el.style.height=height+'px';
    }
    this._syncScrollOnAliases();
    this._refreshAliases();
  }

  _refreshAliases() {
    const _nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    for (const el of this._allAliasEls()) {
      const id   = el.dataset.canvasId;
      const node = _nodeMap.get(id);
      const s    = node ? this._nodeStyle(node) : {};
      const isDisabled = node?.disabled || s.disabled || false;

      el.setAttribute('aria-disabled',  isDisabled ? 'true' : 'false');

      // Purely decorative background rects and dividers have no semantic content
      // and their outlines cause spurious L-shaped lines when inspecting aliases
      // (a full-canvas rect shows its bottom+right edges across the whole viewport).
      const isDecorative = node &&
        (node.type === 'rect' || node.type === 'divider') &&
        !node.content && !node.ariaLabel && !node.role && !node.onClick;

      el.style.outline = (this.htmlMode && !isDecorative)
        ? (id === this.focusedId
            ? '2px solid rgba(15,98,254,0.9)'
            : '1px dashed rgba(69,137,255,0.25)')
        : 'none';
    }
  }
}


// =============================================================================
//  pw.portal(nodeId, content) — escape-hatch for real HTML
//  Attaches an HTML element to document.body, positioned and sized to match
//  a canvas node's geometry. Stays synced on scroll and resize.
//  Use for: dropdowns, tooltips, date pickers, native inputs over canvas nodes.
//
//  const p = pw.portal('btn', '<ul class="menu"><li>Option 1</li></ul>');
//  p.show();    // positions to node, appends to body
//  p.hide();    // removes from DOM (keeps reference)
//  p.el         // the HTMLElement
//  p.sync()     // manually re-sync position (called automatically)
// =============================================================================
Primework.prototype.portal = function(nodeId, content) {
  const pw = this;
  let visible = false;

  // Create the portal element
  const el = typeof content === 'string'
    ? (() => { const d = document.createElement('div'); d.innerHTML = content; return d.firstElementChild || d; })()
    : content;

  el.style.position = 'fixed';
  el.style.zIndex   = '9999';
  el.style.pointerEvents = 'auto';

  const sync = () => {
    const node = pw.findNode(nodeId);
    if (!node?._g || !visible) return;
    const vr  = pw.viewport.getBoundingClientRect();
    const g   = node._g;
    const scrollOff = node.fixed ? 0 : pw.scrollY;
    el.style.left   = (vr.left + g.x)               + 'px';
    el.style.top    = (vr.top  + g.y + g.height - scrollOff) + 'px';
    el.style.minWidth = g.width + 'px';
  };

  // Re-sync when Primework renders or resizes
  // Register sync in pw._renderCallbacks (safe for multiple portals)
  const _syncCb = () => { if (visible) sync(); };
  pw._renderCallbacks.push(_syncCb);

  return {
    el,
    show() {
      if (!visible) { document.body.appendChild(el); visible = true; }
      sync();
      return this;
    },
    hide() {
      if (visible && el.parentNode) el.parentNode.removeChild(el);
      visible = false;
      return this;
    },
    toggle() { return visible ? this.hide() : this.show(); },
    sync,
    get visible() { return visible; },
    destroy() {
      this.hide();
      const idx = pw._renderCallbacks.indexOf(_syncCb);
      if (idx >= 0) pw._renderCallbacks.splice(idx, 1);
    }
  };
};

// =============================================================================
//  pw.nativeInput(nodeId, options) — real <input> bridged to a canvas node
//  The canvas node draws the visual shell. A real <input> is overlaid on top
//  for actual text entry (autocomplete, password managers, IME all work).
//
//  const field = pw.nativeInput('search', {
//    type: 'text', placeholder: 'Search...',
//    onChange(val) { resultNode.set({ content: val }); },
//    onEnter(val)  { doSearch(val); }
//  });
//  field.focus();     // focus the native input
//  field.value        // current value
//  field.destroy()    // remove overlay
// =============================================================================
Primework.prototype.nativeInput = function(nodeId, options = {}) {
  const pw = this;
  // Store config on the node so preview modal can recreate the portal
  const _configNode = pw.findNode(nodeId);
  if (_configNode) _configNode._nativeInputConfig = options;
  const { type='text', placeholder='', value='', onChange, onEnter, onBlur, className='' } = options;

  const { options: selectOptions = [] } = options;
  const el_tag = type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input';
  const input = document.createElement(el_tag);
  if (type === 'select') {
    selectOptions.forEach(opt => {
      const o = document.createElement('option');
      o.value = o.textContent = (typeof opt === 'string') ? opt : (opt.value || opt.label || opt);
      input.appendChild(o);
    });
  } else if (el_tag === 'input') {
    input.type = type;
  }
  input.placeholder = placeholder;
  if (value) input.value = value;
  if (className) input.className = className;

  // Style: transparent background/border — canvas draws the visual shell
  const { css: extraCss = {}, paddingLeft } = options;
  input.style.cssText = [
    'position:fixed', 'z-index:9998', 'box-sizing:border-box',
    'background:transparent', 'border:none', 'outline:none',
    'color:inherit', 'font:inherit',
    type === 'textarea' ? 'padding:8px 16px;resize:none' : 'padding:0 16px',
    'caret-color:currentColor'
  ].join(';');
  if (paddingLeft) input.style.paddingLeft = paddingLeft;
  Object.assign(input.style, extraCss);

  const sync = () => {
    const node = pw.findNode(nodeId);
    if (!node?._g) return;
    const s    = pw._nodeStyle(node);
    const vr   = pw.viewport.getBoundingClientRect();
    const g    = node._g;
    const scrollOff = node.fixed ? 0 : pw.scrollY;
    input.style.left    = (vr.left + g.x)          + 'px';
    input.style.top     = (vr.top  + g.y - scrollOff) + 'px';
    input.style.width   = g.width                   + 'px';
    input.style.height  = g.height                  + 'px';
    input.style.fontSize = (s.size || 14)           + 'px';
    input.style.fontFamily = s.font || 'inherit';
    input.style.color   = s.color  || 'inherit';
    input.style.fontWeight = s.weight || '400';
    if (s.background && s.background !== 'transparent') {
      input.style.background = s.background;
    }
    // Re-apply extra css after sync (sync may reset position-related styles)
    if (paddingLeft) input.style.paddingLeft = paddingLeft;
    Object.assign(input.style, extraCss);
  };

  const _onInput   = () => onChange?.(input.value);
  const _onBlur    = () => onBlur?.(input.value);
  const _onKeydown = e => { if (e.key === 'Enter') onEnter?.(input.value); };
  input.addEventListener('input',   _onInput);
  input.addEventListener('blur',    _onBlur);
  input.addEventListener('keydown', _onKeydown);
  // Forward wheel events to canvas so page scrolls even when cursor is over a portal
  input.addEventListener('wheel', function(e) {
    e.preventDefault();
    pw.interactLayer.dispatchEvent(new WheelEvent('wheel', {
      deltaY:e.deltaY, deltaX:e.deltaX, deltaMode:e.deltaMode, bubbles:false, cancelable:true
    }));
  }, { passive:false });
  // Track portal for destroyPortals()
  input._pwNodeId = nodeId;
  pw._portalElements = pw._portalElements || [];
  pw._portalSyncs    = pw._portalSyncs    || [];
  pw._portalElements.push(input);
  pw._portalSyncs.push(sync);

  document.body.appendChild(input);
  sync();

  const _syncCb = () => sync();
  pw._renderCallbacks.push(_syncCb);

  return {
    input,
    get value()  { return input.value; },
    set value(v) { input.value = v; },
    focus()  { input.focus(); return this; },
    blur()   { input.blur();  return this; },
    sync,
    destroy() {
      input.removeEventListener('input',   _onInput);
      input.removeEventListener('blur',    _onBlur);
      input.removeEventListener('keydown', _onKeydown);
      if (input.parentNode) input.parentNode.removeChild(input);
      const idx = pw._renderCallbacks.indexOf(_syncCb);
      if (idx >= 0) pw._renderCallbacks.splice(idx, 1);
    }
  };
};

// =============================================================================
//  pw.bindScroll(scroller) — let an external element drive Primework scroll
//  Use when Primework is 'embedded' inside a page scroller.
//
//  pw.bindScroll(document.getElementById('page'));
//  pw.unbindScroll();
// =============================================================================
Primework.prototype.bindScroll = function(scroller) {
  this._externalScroller = scroller;
  this._boundExternalScroll = () => {
    this.scrollY = scroller.scrollTop;
    this._render();
    this._syncScrollOnAliases();
  };
  scroller.addEventListener('scroll', this._boundExternalScroll, { passive: true });
  return this;
};
Primework.prototype.unbindScroll = function() {
  if (this._externalScroller && this._boundExternalScroll) {
    this._externalScroller.removeEventListener('scroll', this._boundExternalScroll);
    this._externalScroller = null;
    this._boundExternalScroll = null;
  }
  return this;
};

// =============================================================================
//  pw.setZRange(config) — coordinate z-index with surrounding HTML
//  Prevents canvas/alias/interact layers from conflicting with page modals,
//  sticky headers, or other positioned elements.
// =============================================================================
Primework.prototype.destroyPortals = function() {
  // Remove all nativeInput portal elements from DOM and their render callbacks
  (this._portalElements || []).forEach(function(el) {
    try { if (el.parentNode) el.parentNode.removeChild(el); } catch(e){}
  });
  const syncs = new Set(this._portalSyncs || []);
  this._renderCallbacks = (this._renderCallbacks || []).filter(function(cb){ return !syncs.has(cb); });
  this._portalElements = [];
  this._portalSyncs    = [];
};

Primework.prototype.setZRange = function({ below=0, canvas=1, aliases=2, interact=3, portals=9999 } = {}) {
  this.canvas.style.zIndex       = canvas;
  this.htmlTop.style.zIndex      = aliases;
  this.htmlLayer.style.zIndex    = aliases;
  this.htmlBottom.style.zIndex   = aliases;
  this.interactLayer.style.zIndex = interact;
  this._portalZIndex = portals;
  return this;
};

// roundRect prototype polyfill — defined outside the class so it survives
// canvas.width resets which recreate the context object in some browsers.
// Setting canvas.width only clears canvas state; the context object itself
// may be reused, but being on the prototype ensures it's always available.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    const R = Math.min(Math.abs(r || 0), Math.abs(w) / 2, Math.abs(h) / 2);
    if (!R) { this.rect(x, y, w, h); return; }
    this.moveTo(x + R, y);
    this.arcTo(x + w, y,     x + w, y + h, R);
    this.arcTo(x + w, y + h, x,     y + h, R);
    this.arcTo(x,     y + h, x,     y,     R);
    this.arcTo(x,     y,     x + w, y,     R);
    this.closePath();
  };
}

// =============================================================================
//  NODE BUILDER  — chainable, quasi-element API
//  pw.heading1('Hello').left(48).top(80).right(48).color('#fff').add();
//  const btn = pw.button('Click').below('title', 24).left(48).width(160).height(48).live();
//  btn.content = 'Done!';  // auto-syncs via pw.node() live reference
// =============================================================================

class NodeBuilder {
  constructor(pw, type, content) {
    this._pw = pw;
    this._n = { type };
    if (content !== undefined) this._n.content = content;
  }
  // Identity
  id(v)        { this._n.id = v;         return this; }
  named(v)     { this._n.styleName = v;  return this; }
  ctx(v)       { this._n.context = v;    return this; }
  // Layout constraints — each mirrors a constraint property
  left(v)      { return this._c({ left:v }); }
  right(v)     { return this._c({ right:v }); }
  top(v)       { return this._c({ top:v }); }
  bottom(v)    { return this._c({ bottom:v }); }
  width(v)     { return this._c({ width:v }); }
  height(v)    { return this._c({ height:v }); }
  // Stack below another node: .below('nav', 32)
  below(id, gap)    { return this._c({ topAfter:id, topOffset:gap??0 }); }
  // Container grows around child: .wrap('inner', 20)
  wrap(id, gap)     { return this._c({ bottomAfter:id, bottomOffset:gap??0 }); }
  // Center vertically inside topAfter parent
  center()          { return this._c({ topOffset:'center' }); }
  // Raw constraints object (merges)
  at(obj)           { return this._c(obj); }
  // Style properties — any SD._ property accepted
  style(obj)        { this._n.style = { ...this._n.style, ...obj }; return this; }
  color(v)          { return this.style({ color:v }); }
  size(v)           { return this.style({ size:v }); }
  weight(v)         { return this.style({ weight:v }); }
  opacity(v)        { return this.style({ opacity:v }); }
  background(v)     { return this.style({ background:v }); }
  valign(v)         { return this.style({ verticalAlign:v }); }  // 'middle' centers text
  selection(bg, txt) { return this.style({ selectionColor:bg, selectionTextColor:txt||null }); }
  // Fixed / z-index
  fixed(z)          { this._n.fixed = true; if (z != null) this._n.zIndex = z; return this; }
  // Events
  onClick(fn)       { this._n.onClick = fn;  return this; }
  onHover(fn)       { this._n.onHover = fn;  return this; }
  onFocus(fn)       { this._n.onFocus = fn;  return this; }
  // Custom canvas render
  render(fn)        { this._n.render = fn;   return this; }
  // Aria / accessibility
  aria(label)       { this._n.ariaLabel = label; return this; }
  role(v)           { this._n.role = v;       return this; }
  href(v)           { this._n.href = v;       return this; }
  src(v)            { this._n.src  = v;       return this; }  // for image nodes
  // Disabled state
  disabled(v=true)  { this._n.disabled = v;   return this; }
  // Terminals: add to document or return live reference
  add()             { this._pw.add(this._n); return this; }
  live()            { return this._pw.node(this._n); }
  get props()       { return this._n; }
  // Internal constraint merge
  _c(obj) { this._n.constraints = { ...this._n.constraints, ...obj }; return this; }
}

// Attach type shorthand methods to Primework
// pw.heading1(content?, constraints?, style?) → NodeBuilder
{
  const TYPES = ['heading1','heading2','heading3','heading4','heading5','heading6',
                 'subheading','paragraph','label','blockquote','code',
                 'button','link','badge','rect','image','divider'];
  for (const t of TYPES) {
    Primework.prototype[t] = function(content, constraints, style) {
      const b = new NodeBuilder(this, t, content);
      if (constraints) b.at(constraints);
      if (style) b.style(style);
      return b;
    };
  }
}

// pw.css(cssText) — register styles from a simplified CSS string
// Selector mapping: `.ctx type` → `ctx→type`, `type.class` → `type.class`,
//                  `type:state` → `type:state`, `.name` → `name`
// =============================================================================
//  pw.define() — C: reusable style token objects
//  Returns a frozen map of named style objects you can spread onto any node.
//
//  const S = pw.define({
//    body:   { size: 14, color: '#161616',   lineSpacing: 1.65 },
//    caption:{ size: 12, color: '#6f6f6f',    lineSpacing: 1.5  },
//    hero:   { size: 52, color: '#f4f4f4', weight: '300' },
//  });
//  pw.paragraph('Text').style(S.body).below('title', 16).add();
//  pw.heading1('Hello').style(S.hero).left(48).top(80).add();
//
//  Tokens can also be spread with style({...S.body, color:'#fff'}) for overrides.
// =============================================================================
Primework.prototype.define = function(styleMap) {
  const resolved = Object.create(null);
  const resolve = (key, visited = new Set()) => {
    if (resolved[key]) return resolved[key];
    if (visited.has(key)) return { ...styleMap[key] }; // circular guard
    visited.add(key);
    const def = styleMap[key];
    if (!def) return {};
    const { extends: ext, ...rest } = def;
    const base = ext ? resolve(ext, new Set(visited)) : {};
    resolved[key] = Object.freeze({ ...base, ...rest });
    return resolved[key];
  };
  for (const key of Object.keys(styleMap)) resolve(key);
  return Object.freeze(resolved);
};

// =============================================================================
//  pw.section(context, baseConstraints) — D: context group builder
//  All nodes created with the returned builder automatically inherit the
//  given context, so pw.css() context rules apply without repeating .ctx().
//
//  pw.css(`.hero h1 { size:52; weight:300; color:#f4f4f4; }
//          .hero p  { size:16; color:rgba(255,255,255,0.7); }`);
//
//  const hero = pw.section('hero', { left:0, top:48, right:0 });
//  hero.rect().height(600).background('#161616').add();    // context:'hero'
//  hero.heading1('Hello.').left(48).top(120).add();        // picks up hero→heading1
//  hero.paragraph('Body.').below('h1', 24).left(48).add();// picks up hero→paragraph
//
//  Node types are still explicit — the section only injects context.
// =============================================================================
Primework.prototype.section = function(context, baseConstraints) {
  const pw = this;
  // Return a proxy object with the same type shortcuts but context pre-applied
  const section = {};
  const TYPES = ['heading1','heading2','heading3','heading4','heading5','heading6',
                 'subheading','paragraph','label','blockquote','code',
                 'button','link','badge','rect','image','divider'];
  for (const t of TYPES) {
    section[t] = function(content) {
      const b = pw[t](content);
      // Apply base constraints first so user's chain calls (.left(), .below() etc.) override
      if (baseConstraints) b._c({ ...baseConstraints });
      b.ctx(context);
      return b;
    };
  }
  // Batch-add multiple nodes with context pre-applied — single relayout at end
  section.addAll = function(nodeList) {
    return pw.addAll(nodeList.map(node => ({ context, ...node })));
  };
  section.context = context;
  return section;
};

Primework.prototype.css = function(cssText) {
  const rules = {};
  const re = /([^{;]+?)\s*\{([^}]*)\}/g;
  let m;
  // Strip CSS comments before parsing to avoid them being treated as selectors
  cssText = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  while ((m = re.exec(cssText)) !== null) {
    const rawSels = m[1].split(',').map(s => s.trim()).filter(Boolean);
    const body    = m[2];
    for (const rawSel of rawSels) {
    // Map HTML tag names to Primework type names
    const TAG_MAP = {
      h1:'heading1',h2:'heading2',h3:'heading3',h4:'heading4',h5:'heading5',h6:'heading6',
      p:'paragraph',span:'label',a:'link',button:'button',blockquote:'blockquote',
      code:'pre',section:'rect',div:'rect',img:'image',hr:'divider',
    };
    const mapTag = t => TAG_MAP[t] || t;
    // Map CSS-like selector to Primework cascade key
    const sel = rawSel
      .replace(/^\.(\w+)\s+(\w+)\.(\w+)$/, (_, ctx, type, cls) => `${ctx}\u2192${mapTag(type)}.${cls}`)
      .replace(/^\.(\w+)\s+(\w+)$/, (_, ctx, type) => `${ctx}\u2192${mapTag(type)}`)
      .replace(/^(\w+)\.(\w+):(\w+)$/, (_, t, c, s) => `${mapTag(t)}.${c}:${s}`)
      .replace(/^(\w+):(\w+)$/, (_, t, s) => `${mapTag(t)}:${s}`)
      .replace(/^(\w+)\.(\w+)$/, (_, t, cl) => `${mapTag(t)}.${cl}`)
      .replace(/^\.(\w+)$/, '$1')
      .replace(/^(\w+)$/, t => mapTag(t))
      .trim();
    const props = {};
    for (const decl of body.split(';')) {
      const kv = decl.trim().match(/^([\w-]+)\s*:\s*(.+)$/);
      if (!kv) continue;
      const key = kv[1].trim();
      const val = kv[2].trim().replace(/['";]/g, '');
      props[key] = /^-?\d+(\.\d+)?$/.test(val) ? parseFloat(val) : val;
    }
      if (Object.keys(props).length) rules[sel] = props;
    } // end for rawSels
  }
  return this.styles(rules);
};

// pw.startAnimating(fps?) — run a persistent RAF loop for animated renders
// pw.time = elapsed seconds since start (available in node.render(ctx,g,s) closures)
Primework.prototype.scrollTo = function(id, options = {}) {
  const node = this.nodes.find(n => n.id === id);
  if (!node?._g || node.fixed) return this;
  const { align = 'center', offset = 0 } = options;
  let target;
  if      (align === 'top')    target = node._g.y - offset;
  else if (align === 'bottom') target = node._g.y + node._g.height - this.DOC_H + offset;
  else                         target = node._g.y + node._g.height / 2 - this.DOC_H / 2 + offset;
  this.scrollY = Math.max(0, Math.min(this._maxScrollY, target));
  this._render();
  this._syncScrollOnAliases();
  return this;
};

// pw.findNode(id) — find a node by id (returns null if not found)
// pw.snapshot(options) — export canvas as PNG data URL or trigger download
// options: { format:'image/png', quality:0.92, download:false, filename:'primework.png' }
Primework.prototype.snapshot = function(options = {}) {
  const { format='image/png', quality=0.92, download=false, filename='primework.png' } = options;
  try {
    const dataURL = this.canvas.toDataURL(format, quality);
    if (download) {
      const a = document.createElement('a');
      a.href = dataURL; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    return dataURL;
  } catch (e) {
    console.warn('Primework.snapshot(): canvas tainted by cross-origin image —', e.message);
    return null;
  }
};

// pw.toJSON() — serialize the node tree to a plain JSON-safe array.
// Strips internal properties (_g, _img, _imgSrc, _imgErr) and functions
// (render, onClick etc.) — keeps layout/style/content only.
// Use to save and restore document state.
Primework.prototype.toJSON = function() {
  const SKIP = new Set(['_g','_img','_imgSrc','_imgErr','_imgLoaded','set','__raw']);
  return this.nodes.map(node => {
    const out = {};
    for (const [k,v] of Object.entries(node)) {
      if (SKIP.has(k)) continue;
      if (typeof v === 'function') continue;
      out[k] = v;
    }
    return out;
  });
};

// pw.fromJSON(arr) — restore a previously serialized node tree.
// Replaces all current nodes. Call inside document.fonts.ready.
Primework.prototype.fromJSON = function(arr) {
  this.nodes = [];
  this._zDirty = true;
  this._needsValidation = true;
  this._styleCache = null; // clear stale cache
  return this.addAll(arr);
};

Primework.prototype.findNode = function(id) {
  return this.nodes.find(n => n.id === id) ?? null;
};

// pw.queryNodes(fn) — filter nodes by predicate
// e.g. pw.queryNodes(n => n.type === 'button' && !n.disabled)
Primework.prototype.queryNodes = function(fn) {
  return this.nodes.filter(fn);
};

// pw.loadFontMetrics(family, source) -- parse a font file's own OS/2 table
// for real, authored cap-height/x-height/ascender/descender instead of
// estimating them from how the browser rasterizes a reference glyph.
// `source` is a URL string (fetched here) or an ArrayBuffer you already
// have. Requires opentype.js loaded as window.opentype BEFORE calling this.
// Note: opentype.js cannot parse WOFF2 without an external decompressor --
// use a TTF/OTF copy of the font for this call specifically (it can still
// be a completely different, WOFF2, file that you actually render/@font-face
// with; this call is only about reading metrics, not about what gets drawn).
// Silently resolves false if opentype.js isn't present or the font can't be
// parsed -- every heightReference/spaceBeforeRef calculation keeps working
// via the canvas-heuristic fallback either way; this only makes it more
// precise when it succeeds.
Primework.prototype.loadFontMetrics = async function(family, source) {
  if (typeof window === 'undefined' || !window.opentype) {
    console.warn(`Primework.loadFontMetrics('${family}'): opentype.js not found on window -- ` +
                 `load it (e.g. <script src="opentype.min.js">) before calling this. Falling back to the canvas heuristic.`);
    return false;
  }
  try {
    const buf = (source instanceof ArrayBuffer) ? source : await (await fetch(source)).arrayBuffer();
    const ratios = parseFontFileMetrics(buf);
    if (!ratios) return false;
    FONT_FILE_METRICS.set(family, ratios);
    // Clear the whole cache (simple and safe -- this only runs when metrics
    // load, never in a render hot path) so the next render picks up the
    // real numbers, then re-render now in case nodes using this family
    // were already laid out against the canvas-heuristic estimate.
    FONT_METRICS._cache.clear();
    if (this.nodes.length) { this._relayout(); this._computeMaxScroll(); this._render(); this._syncAliases(); }
    return true;
  } catch (e) {
    console.warn(`Primework.loadFontMetrics('${family}'): failed to load/parse —`, e, '— falling back to the canvas heuristic.');
    return false;
  }
};

Primework.prototype.startAnimating = function(fps = 60) {
  if (this._animating) return this;
  this._animating = true;
  this.time = 0;
  const t0 = performance.now();
  const minInterval = 1000 / fps - 1;
  let last = -Infinity;
  const loop = (ts) => {
    if (!this._animating) return;
    this._animRaf = requestAnimationFrame(loop);
    if (ts - last < minInterval) return;
    last = ts;
    this.time = (ts - t0) / 1000;
    this._render();
  };
  this._animRaf = requestAnimationFrame(loop);
  return this;
};
Primework.prototype.stopAnimating = function() {
  this._animating = false;
  cancelAnimationFrame(this._animRaf);
  return this;
};

// Expose globally for classic <script> usage. (Also just works as the implicit
// top-level binding in a non-module script -- this line just makes it robust
// for bundlers/sandboxes that evaluate this file in an isolated scope.)
if (typeof window !== 'undefined') {
  window.Primework = Primework;
  window.PRIMEWORK_VERSION = PRIMEWORK_VERSION;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Primework, PRIMEWORK_VERSION };
}
