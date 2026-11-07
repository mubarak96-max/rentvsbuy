import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent } from 'react';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, zoomTransform, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import 'd3-transition';
import { interpolateLab, piecewise } from 'd3-interpolate';
import WORLD_JSON from '../data/world-map.json';
import { MARKETS, type Market } from '../data/markets';
import { simulate, breakEvenRent, priceToRent } from '../lib/calc';
import { guessMarket } from '../lib/guess-market';
import '../styles/atlas.css';

/* ------------------------------------------------------------------ data */

interface WorldCountry { id: string; name: string; d: string; b: [number, number, number, number]; c: [number, number] }
const WORLD = WORLD_JSON as unknown as { width: number; height: number; outline: string; grid: string; countries: WorldCountry[]; points: Record<string, [number, number]> };
const MW = WORLD.width;
const MH = WORLD.height;

/** ISO 3166-1 numeric → market id. Markets too small for 1:110m (Singapore, Hong Kong) and cities are pins. */
const ISO: Record<string, string> = {
  '840': 'us', '826': 'uk', '124': 'canada', '036': 'australia', '784': 'uae', '356': 'india', '276': 'germany', '554': 'new-zealand',
  '372': 'ireland', '250': 'france', '724': 'spain', '528': 'netherlands', '756': 'switzerland', '392': 'japan', '710': 'south-africa',
  '682': 'saudi-arabia', '380': 'italy', '620': 'portugal', '752': 'sweden', '484': 'mexico', '076': 'brazil',
};
const PINS = ['new-york', 'toronto', 'london', 'sydney', 'singapore', 'hong-kong'];
const GUIDE: Record<string, string> = {
  us: 'united-states', uk: 'united-kingdom', canada: 'canada', australia: 'australia', uae: 'uae', india: 'india', singapore: 'singapore',
  germany: 'germany', 'new-zealand': 'new-zealand', ireland: 'ireland', france: 'france', spain: 'spain',
};
const REGIONS = ['Americas', 'Europe', 'Middle East & Africa', 'Asia-Pacific'] as const;
const MAX_Y = 30;

interface Model {
  m: Market;
  /** Owner minus renter net worth by year (0…30), local currency. */
  gap: number[];
  breakEven: number | null;
  ptr: number;
}

const MODELS: Model[] = MARKETS.map((m) => {
  const sim = simulate({ ...m, years: MAX_Y, sharePct: 100, sharedRentPct: 2.75 }, MAX_Y);
  return { m, gap: sim.rows.map((r) => r.ownerNetWorth - r.renterNetWorth), breakEven: sim.breakEvenYear, ptr: priceToRent(m) };
});
const MODEL: Record<string, Model> = Object.fromEntries(MODELS.map((x) => [x.m.id, x]));
const COUNTRY_BY_MARKET: Record<string, WorldCountry> = Object.fromEntries(
  WORLD.countries.filter((c) => ISO[c.id]).map((c) => [ISO[c.id], c]),
);

/** Bounding box of a market in map units (pins get a small box around the point). */
function marketBox(id: string): [number, number, number, number] {
  const p = WORLD.points[id];
  if (p) return [p[0] - 6, p[1] - 4, p[0] + 6, p[1] + 4];
  return COUNTRY_BY_MARKET[id]?.b ?? [0, 0, MW, MH];
}
function anchor(id: string): [number, number] {
  return WORLD.points[id] ?? COUNTRY_BY_MARKET[id]?.c ?? [MW / 2, MH / 2];
}
const REGION_BOX = Object.fromEntries(
  REGIONS.map((r) => {
    const boxes = MARKETS.filter((m) => m.region === r).map((m) => marketBox(m.id));
    return [r, [Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])), Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))]];
  }),
) as Record<(typeof REGIONS)[number], [number, number, number, number]>;

/* ---------------------------------------------------------------- metrics */

type MetricKey = 'verdict' | 'breakeven' | 'ptr' | 'rate';
interface Metric {
  key: MetricKey;
  label: string;
  short: string;
  caption: (h: number) => string;
  ticks: [string, string, string]; // rent end, middle, buy end
  /** −1 (strongly favours renting) … +1 (strongly favours buying) */
  score: (x: Model, h: number) => number;
  value: (x: Model, h: number) => string;
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const gapPct = (x: Model, h: number) => x.gap[h] / x.m.homePrice;
const signedPct = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(0)}%`;

const METRICS: Metric[] = [
  {
    key: 'verdict', label: 'Verdict', short: 'Verdict',
    caption: (h) => `Wealth gap after ${h} ${h === 1 ? 'year' : 'years'}, as % of home price`,
    ticks: ['−25%', 'Even', '+25%'],
    score: (x, h) => clamp(gapPct(x, h) / 0.25, -1, 1),
    value: (x, h) => `${x.gap[h] >= 0 ? 'Buy' : 'Rent'} wins · ${signedPct(gapPct(x, h))} of price`,
  },
  {
    key: 'breakeven', label: 'Break-even year', short: 'Break-even',
    caption: () => 'Years until buying overtakes renting',
    ticks: ['30+ yrs', '8 yrs', '2 yrs'],
    score: (x) => (x.breakEven === null ? -1 : clamp(1 - (2 * (Math.log(Math.max(x.breakEven, 1)) - Math.log(2))) / (Math.log(30) - Math.log(2)), -1, 1)),
    value: (x) => (x.breakEven === null ? 'Never within 30 years' : `Buying pays off in year ${x.breakEven}`),
  },
  {
    key: 'ptr', label: 'Price-to-rent', short: 'P/R ratio',
    caption: () => 'Home price ÷ one year of rent',
    ticks: ['25+', '17.5', '10'],
    score: (x) => clamp((17.5 - x.ptr) / 7.5, -1, 1),
    value: (x) => `Price-to-rent ${x.ptr.toFixed(1)} · yield ${(100 / x.ptr).toFixed(1)}%`,
  },
  {
    key: 'rate', label: 'Mortgage rate', short: 'Rates',
    caption: () => 'Typical mortgage rate today',
    ticks: ['11%', '6%', '1%'],
    score: (x) => clamp((6 - x.m.mortgageRate) / 5, -1, 1),
    value: (x) => `Mortgage rate ${x.m.mortgageRate}% · ${x.m.termYears}-yr term`,
  },
];
const METRIC: Record<MetricKey, Metric> = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<MetricKey, Metric>;

const BUY = '#0a58cc';
const RENT = '#bf5320';
// Hand-tuned ramps (perceptually even, no lavender/mud mid-tones).
const buyI = piecewise(interpolateLab, ['#e8eef6', '#a9cbf5', '#4c92ec', '#1a6ee0', BUY]);
const rentI = piecewise(interpolateLab, ['#f4ebe5', '#f6c3a3', '#ea8b55', '#d4692f', RENT]);
/** Diverging scale. Starts at 22% tint so a near-tie still reads as "has data". */
const colorFor = (t: number) => (t >= 0 ? buyI(0.22 + 0.78 * Math.pow(t, 0.8)) : rentI(0.22 + 0.78 * Math.pow(-t, 0.8)));
const LEGEND_STOPS = Array.from({ length: 11 }, (_, i) => colorFor(-1 + i / 5));

/* ------------------------------------------------------------- formatting */

const fmtCache = new Map<string, { money: Intl.NumberFormat; compact: Intl.NumberFormat }>();
function fmt(m: Market) {
  let f = fmtCache.get(m.id);
  if (!f) {
    f = {
      money: new Intl.NumberFormat(m.locale, { style: 'currency', currency: m.currency, maximumFractionDigits: 0 }),
      compact: new Intl.NumberFormat(m.locale, { style: 'currency', currency: m.currency, notation: 'compact', maximumFractionDigits: 1 }),
    };
    fmtCache.set(m.id, f);
  }
  return f;
}
const money = (m: Market, v: number) => fmt(m).money.format(Math.round(v));
const compactSigned = (m: Market, v: number) => `${v >= 0 ? '+' : '−'}${fmt(m).compact.format(Math.abs(v))}`;
const calcHref = (id: string, h: number) => `/?m=${encodeURIComponent(id)}&y=${h}#calculator`;

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------- country layer */

interface LayerProps { fills: Record<string, string> }
/** Memoised so hovering / tooltips never re-render 176 paths. */
const CountryLayer = memo(function CountryLayer({ fills }: LayerProps) {
  return (
    <g className="atlas-countries">
      {WORLD.countries.map((c) => {
        const mid = ISO[c.id];
        if (!mid) return <path key={c.id} d={c.d} className="atlas-land" data-name={c.name} />;
        const mk = MODEL[mid].m;
        return (
          <path
            key={c.id}
            d={c.d}
            className="atlas-land atlas-market"
            style={{ fill: fills[mid] }}
            data-id={mid}
            tabIndex={0}
            role="button"
            aria-label={`${mk.name}: show rent vs buy details`}
          />
        );
      })}
    </g>
  );
});

/* -------------------------------------------------------------- sparkline */

function GapChart({ x, h }: { x: Model; h: number }) {
  const W = 300, H = 84, P = 6;
  const max = Math.max(...x.gap.map(Math.abs), 1);
  const sx = (i: number) => P + (i / MAX_Y) * (W - 2 * P);
  const sy = (v: number) => H / 2 - (v / max) * (H / 2 - P);
  const line = x.gap.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join('');
  const area = `${line}L${sx(MAX_Y)},${H / 2}L${sx(0)},${H / 2}Z`;
  const id = `gap-${x.m.id}`;
  const v = x.gap[h];
  return (
    <figure className="atlas-chart">
      <figcaption>
        <span>Buying minus renting, net worth</span>
        <span className="atlas-chart-key"><i className="k-buy" />Buy ahead <i className="k-rent" />Rent ahead</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Net worth gap over 30 years. At year ${h}, ${v >= 0 ? 'buying' : 'renting'} is ahead by ${compactSigned(x.m, Math.abs(v)).slice(1)}.`}>
        <defs>
          <clipPath id={`${id}-up`}><rect x="0" y="0" width={W} height={H / 2} /></clipPath>
          <clipPath id={`${id}-dn`}><rect x="0" y={H / 2} width={W} height={H / 2} /></clipPath>
        </defs>
        <path d={area} fill={BUY} opacity="0.16" clipPath={`url(#${id}-up)`} />
        <path d={area} fill={RENT} opacity="0.18" clipPath={`url(#${id}-dn)`} />
        <line x1={P} x2={W - P} y1={H / 2} y2={H / 2} stroke="currentColor" strokeOpacity="0.25" strokeDasharray="3 3" />
        <path d={line} fill="none" stroke={BUY} strokeWidth="2" clipPath={`url(#${id}-up)`} />
        <path d={line} fill="none" stroke={RENT} strokeWidth="2" clipPath={`url(#${id}-dn)`} />
        <line x1={sx(h)} x2={sx(h)} y1={P - 2} y2={H - P + 2} stroke="currentColor" strokeOpacity="0.45" />
        <circle cx={sx(h)} cy={sy(v)} r="4.5" fill={v >= 0 ? BUY : RENT} stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="atlas-chart-axis"><span>Today</span><span>Year {h}</span><span>30 yrs</span></div>
    </figure>
  );
}

/* ------------------------------------------------------------------ main */

export default function WorldMap() {
  const [metric, setMetric] = useState<MetricKey>('verdict');
  const [h, setH] = useState(10);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [size, setSize] = useState({ w: MW, h: MH });
  const [hint, setHint] = useState<string | null>(null);
  const [guess, setGuess] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeOpt, setActiveOpt] = useState(0);
  const [zoomEdge, setZoomEdge] = useState<'min' | 'max' | null>('min');

  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomGRef = useRef<SVGGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const engagedRef = useRef(false);
  const hintTimer = useRef<number>(0);
  const initialised = useRef(false);

  const M = METRIC[metric];
  const fills = useMemo(() => Object.fromEntries(MODELS.map((x) => [x.m.id, colorFor(M.score(x, h))])), [M, h]);

  /* ---- layout: 1 viewBox unit = 1 CSS px, world fitted ("contain") inside */
  const fit = useMemo(() => {
    const s = Math.min(size.w / MW, size.h / MH);
    return { s, ox: (size.w - MW * s) / 2, oy: (size.h - MH * s) / 2 };
  }, [size]);
  const fitRef = useRef(fit);
  fitRef.current = fit;

  const toScreen = useCallback((b: [number, number, number, number]) => {
    const { s, ox, oy } = fitRef.current;
    return [b[0] * s + ox, b[1] * s + oy, b[2] * s + ox, b[3] * s + oy] as const;
  }, []);

  const applyTransform = useCallback((t: ZoomTransform) => {
    const g = zoomGRef.current;
    const svg = svgRef.current;
    if (!g || !svg) return;
    g.setAttribute('transform', t.toString());
    svg.style.setProperty('--inv', String(1 / (t.k * fitRef.current.s)));
    // City pin labels only once zoomed well in, so they don't collide with country labels.
    svg.dataset.near = t.k >= 6 ? 'true' : 'false';
    // A country label shows only when the country is wide enough on screen to hold it.
    const scale = t.k * fitRef.current.s;
    svg.querySelectorAll<SVGTextElement>('.atlas-label').forEach((el) => {
      const show = Number(el.dataset.w) * scale >= Number(el.dataset.len) * 6.6 + 10;
      if (el.dataset.show !== String(show)) el.dataset.show = String(show);
    });
  }, []);

  const flash = useCallback((msg: string) => {
    setHint(msg);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 1500);
  }, []);

  /* ---- zoom behaviour */
  useEffect(() => {
    const svgEl = svgRef.current!;
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 14])
      .clickDistance(5)
      .filter((ev: Event) => {
        if (ev.type === 'wheel') {
          const w = ev as WheelEvent;
          if (w.ctrlKey || w.metaKey || engagedRef.current) return true;
          flash(`Hold ${isMac ? '⌘' : 'Ctrl'} and scroll to zoom, or click the map first`);
          return false;
        }
        if (ev.type.startsWith('touch')) {
          // Whole world showing: one finger scrolls the page, pinch zooms.
          // Zoomed in: one finger pans the map, like any phone map app.
          const t = ev as TouchEvent;
          return t.touches.length >= 2 || zoomTransform(svgEl).k > 1.01;
        }
        return !(ev as MouseEvent).button;
      })
      .on('zoom', (ev) => {
        applyTransform(ev.transform);
        const zoomed = ev.transform.k > 1.01;
        svgEl.style.touchAction = zoomed ? 'none' : 'pan-y';
        const edge = !zoomed ? 'min' : ev.transform.k >= 13.9 ? 'max' : null;
        setZoomEdge((e) => (e === edge ? e : edge));
      });
    const sel = select(svgEl);
    sel.call(z);
    svgEl.style.touchAction = 'pan-y';
    // At world view, a sideways swipe means "I want to move the map": tell them how.
    let start: [number, number] | null = null;
    let hinted = false;
    const onTouchStart = (e: TouchEvent) => { start = e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null; hinted = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!start || hinted || e.touches.length !== 1 || zoomTransform(svgEl).k > 1.01) return;
      const dx = Math.abs(e.touches[0].clientX - start[0]);
      const dy = Math.abs(e.touches[0].clientY - start[1]);
      if (dx > 30 && dx > dy * 1.5) { hinted = true; flash('Pinch or tap + to zoom in, then drag'); }
    };
    svgEl.addEventListener('touchstart', onTouchStart, { passive: true });
    svgEl.addEventListener('touchmove', onTouchMove, { passive: true });
    zoomRef.current = z;
    return () => {
      sel.on('.zoom', null);
      svgEl.removeEventListener('touchstart', onTouchStart);
      svgEl.removeEventListener('touchmove', onTouchMove);
    };
  }, [applyTransform, flash]);

  /* ---- measure the map box */
  useEffect(() => {
    const el = boxRef.current!;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize((s) => (Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1 ? s : { w: Math.round(width), h: Math.round(height) }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Home view is the whole world: every market, Alaska to New Zealand, stays visible.
  const homeTransform = useCallback(() => zoomIdentity, []);

  /* ---- keep zoom constraints in sync with the box size */
  useEffect(() => {
    const z = zoomRef.current;
    const svgEl = svgRef.current;
    if (!z || !svgEl) return;
    const { s, ox, oy } = fit;
    // Pan limits = the map's own edges. The world can never be dragged off-screen: once zoomed in,
    // panning stops at the map edge; where the map is smaller than the frame, d3 keeps it centred.
    z.extent([[0, 0], [size.w, size.h]]).translateExtent([[ox, oy], [ox + MW * s, oy + MH * s]]);
    const sel = select(svgEl);
    if (!initialised.current && size.w !== MW) {
      initialised.current = true;
      sel.call(z.transform, homeTransform());
    } else {
      // Re-clamp the current view to the new limits (translateBy runs d3's constrain).
      z.translateBy(sel, 0, 0);
    }
  }, [fit, size, homeTransform, applyTransform]);

  const animate = useCallback((t: ZoomTransform, ms = 850) => {
    const z = zoomRef.current;
    const svgEl = svgRef.current;
    if (!z || !svgEl) return;
    const sel = select(svgEl);
    // Programmatic zooms (select a country, region buttons) obey the same pan limits as dragging.
    const vb = svgEl.viewBox.baseVal;
    const safe = z.constrain()(t, [[0, 0], [vb.width, vb.height]], z.translateExtent());
    if (prefersReducedMotion()) sel.call(z.transform, safe);
    else sel.transition().duration(ms).call(z.transform, safe);
  }, []);

  const zoomToBox = useCallback((b: [number, number, number, number], maxK = 6, fill = 0.7) => {
    const [x0, y0, x1, y1] = toScreen(b);
    const k = clamp(fill / Math.max((x1 - x0) / size.w, (y1 - y0) / size.h), 1, maxK);
    animate(zoomIdentity.translate(size.w / 2, size.h / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2));
  }, [animate, size, toScreen]);

  const zoomBy = (f: number) => {
    const z = zoomRef.current;
    if (!z || !svgRef.current) return;
    const sel = select(svgRef.current);
    if (prefersReducedMotion()) z.scaleBy(sel, f); else z.scaleBy(sel.transition().duration(300), f);
  };
  const resetView = () => { setSelected(null); animate(homeTransform()); };

  const choose = useCallback((id: string, zoom = true) => {
    setSelected(id);
    if (zoom) zoomToBox(marketBox(id), WORLD.points[id] ? 4.5 : 5, WORLD.points[id] ? 0.06 : 0.62);
  }, [zoomToBox]);

  /* ---- deep link (?m=uk) and visitor's market */
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get('m');
    if (m && MODEL[m]) window.setTimeout(() => choose(m), 60);
    const g = guessMarket();
    if (g && MODEL[g]) setGuess(g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- pointer + keyboard on the map */
  const marketFromEvent = (e: { target: EventTarget | null }) => (e.target as Element | null)?.closest?.('[data-id]')?.getAttribute('data-id') ?? null;
  // Tooltip: measured and clamped so it always stays fully inside the map frame.
  const lastPointer = useRef<[number, number] | null>(null);
  const placeTip = useCallback(() => {
    const tip = tipRef.current;
    const box = boxRef.current;
    const pt = lastPointer.current;
    if (!tip || !box || !pt || tip.hidden) return;
    const r = box.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const x = pt[0] - r.left;
    const y = pt[1] - r.top;
    const gap = 14;
    let left = x + gap + tw > r.width - 8 ? x - gap - tw : x + gap;
    let top = y - gap - th < 8 ? y + gap + 4 : y - gap - th;
    left = clamp(left, 8, Math.max(8, r.width - tw - 8));
    top = clamp(top, 8, Math.max(8, r.height - th - 8));
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }, []);
  // Re-place after the tooltip's content (and so its size) changes.
  useLayoutEffect(() => { placeTip(); }, [hovered, h, metric, placeTip]);
  // Tooltips are for mouse/trackpad only. On touch screens a tap selects and the panel shows details.
  const canHover = useRef(false);
  useEffect(() => { canHover.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches; }, []);
  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== 'mouse' || !canHover.current) { if (hovered) setHovered(null); return; }
    const id = marketFromEvent(e);
    const name = !id ? (e.target as Element).getAttribute?.('data-name') : null;
    const key = id ?? (name ? `~${name}` : null);
    lastPointer.current = [e.clientX, e.clientY];
    if (key !== hovered) setHovered(key);
    if (key) placeTip();
  };
  const onMapClick = (e: RMouseEvent<SVGSVGElement>) => {
    engagedRef.current = true;
    const id = marketFromEvent(e);
    if (id) choose(id);
    if (!canHover.current) setHovered(null);
  };
  const onMapKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const z = zoomRef.current;
    const sel = svgRef.current && select(svgRef.current);
    if (!z || !sel) return;
    const id = marketFromEvent(e);
    const step = 60;
    const k = zoomTransform(svgRef.current!).k;
    switch (e.key) {
      case 'Enter': case ' ': if (id) { e.preventDefault(); choose(id); } break;
      case 'ArrowLeft': e.preventDefault(); z.translateBy(sel, step / k, 0); break;
      case 'ArrowRight': e.preventDefault(); z.translateBy(sel, -step / k, 0); break;
      case 'ArrowUp': e.preventDefault(); z.translateBy(sel, 0, step / k); break;
      case 'ArrowDown': e.preventDefault(); z.translateBy(sel, 0, -step / k); break;
      case '+': case '=': e.preventDefault(); zoomBy(1.5); break;
      case '-': case '_': e.preventDefault(); zoomBy(1 / 1.5); break;
      case 'Escape': setSelected(null); break;
    }
  };

  /* ---- search */
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = MARKETS.filter((m) => !q || m.name.toLowerCase().includes(q) || m.id.includes(q) || m.currency.toLowerCase() === q);
    return list.slice(0, 8);
  }, [query]);
  const pickOption = (id: string) => { choose(id); setQuery(''); setSearchOpen(false); (document.activeElement as HTMLElement | null)?.blur(); };
  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchOpen(true); setActiveOpt((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveOpt((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const o = options[activeOpt] ?? options[0]; if (o) pickOption(o.id); }
    else if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); }
  };

  /* ---- CTA: drive the calculator on this page if there is one */
  const goCalculate = (e: RMouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById('calculator');
    if (!target || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('rvb:market', { detail: { id, years: h } }));
    window.history.replaceState(null, '', `${window.location.pathname}?m=${encodeURIComponent(id)}&y=${h}#calculator`);
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  /* ---- derived */
  const ranked = useMemo(() => [...MODELS].sort((a, b) => gapPct(b, h) - gapPct(a, h)), [h]);
  const buyCount = ranked.filter((x) => x.gap[h] >= 0).length;
  const sel = selected ? MODEL[selected] : null;
  const selBeRent = useMemo(() => (sel ? breakEvenRent({ ...sel.m, years: h, sharePct: 100, sharedRentPct: 2.75 }) : 0), [sel, h]);
  const hov = hovered && !hovered.startsWith('~') ? MODEL[hovered] : null;
  const hovName = hovered?.startsWith('~') ? hovered.slice(1) : null;
  const outlineIds = [hovered && !hovered.startsWith('~') ? hovered : null, selected].filter((v, i, a): v is string => !!v && a.indexOf(v) === i);

  return (
    <div className="atlas">
      <div className="atlas-stage">
      <div className="atlas-canvas" ref={boxRef} onPointerLeave={() => { engagedRef.current = false; setHovered(null); }}>
        <svg
          ref={svgRef}
          className="atlas-svg"
          viewBox={`0 0 ${size.w} ${size.h}`}
          role="group"
          aria-label="Interactive world map of rent vs buy verdicts. Use Tab to move between markets, Enter to open one, arrow keys to pan and plus or minus to zoom."
          onPointerMove={onPointerMove}
          onClick={onMapClick}
          onKeyDown={onMapKey}
          data-near="false"
        >
          <g ref={zoomGRef}>
            <g transform={`translate(${fit.ox},${fit.oy}) scale(${fit.s})`}>
              <path d={WORLD.outline} className="atlas-sphere" />
              <path d={WORLD.grid} className="atlas-grid" />
              <CountryLayer fills={fills} />
              <g className="atlas-outlines" aria-hidden="true">
                {outlineIds.map((id) => COUNTRY_BY_MARKET[id] && (
                  <path key={id} d={COUNTRY_BY_MARKET[id].d} className={id === selected ? 'is-selected' : 'is-hover'} />
                ))}
              </g>
              <g className="atlas-labels" aria-hidden="true">
                {Object.entries(COUNTRY_BY_MARKET).map(([id, c]) => (
                  <g key={id} transform={`translate(${c.c[0]},${c.c[1]})`}><text className="atlas-label" data-w={c.b[2] - c.b[0]} data-len={MODEL[id].m.name.replace(' (Dubai)', '').length} data-show="false">{MODEL[id].m.name.replace(' (Dubai)', '')}</text></g>
                ))}
              </g>
              <g className="atlas-pins">
                {PINS.map((id) => {
                  const p = WORLD.points[id];
                  const x = MODEL[id];
                  return (
                    <g key={id} transform={`translate(${p[0]},${p[1]})`}>
                      <g className={`atlas-pin${selected === id ? ' is-selected' : ''}${hovered === id ? ' is-hover' : ''}`} data-id={id} tabIndex={0} role="button" aria-label={`${x.m.name}: show rent vs buy details`}>
                        {selected === id && <circle r="15" className="atlas-pin-pulse" />}
                        <circle r="11" className="atlas-pin-hit" />
                        <circle r="6.5" style={{ fill: fills[id] }} className="atlas-pin-dot" />
                        <text x="10" y="4" className="atlas-pin-label">{x.m.name.replace(' City', '')}</text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </g>
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="atlas-zoom" role="group" aria-label="Map zoom">
          <button type="button" onClick={() => zoomBy(1.6)} disabled={zoomEdge === 'max'} aria-label="Zoom in"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>
          <button type="button" onClick={() => zoomBy(1 / 1.6)} disabled={zoomEdge === 'min'} aria-label="Zoom out"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>
          <button type="button" onClick={resetView} aria-label="Reset map view"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 10h13M10 3.5c-2.4 2.6-2.4 10.4 0 13M10 3.5c2.4 2.6 2.4 10.4 0 13" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg></button>
        </div>

        {/* Tooltip */}
        <div className="atlas-tip" ref={tipRef} hidden={!hovered} aria-hidden="true">
          {hov && (
            <>
              <div className="atlas-tip-head"><span className="flag">{hov.m.flag}</span><strong>{hov.m.name}</strong></div>
              <div className={`atlas-tip-verdict ${hov.gap[h] >= 0 ? 'buy' : 'rent'}`}>
                {hov.gap[h] >= 0 ? 'Buying' : 'Renting'} wins by {compactSigned(hov.m, Math.abs(hov.gap[h])).slice(1)} <span>after {h} yrs</span>
              </div>
              {metric !== 'verdict' && <div className="atlas-tip-row">{M.value(hov, h)}</div>}
              <div className="atlas-tip-row muted">Click for details</div>
            </>
          )}
          {hovName && (
            <>
              <div className="atlas-tip-head"><strong>{hovName}</strong></div>
              <div className="atlas-tip-row muted">No preset yet. Use the calculator with your local numbers.</div>
            </>
          )}
        </div>

        <div className={`atlas-hint${hint ? ' is-on' : ''}`} role="status" aria-live="polite">{hint}</div>

        {sel && (
          <button type="button" className="atlas-chip" onClick={() => panelRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })}>
            <span className="flag" aria-hidden="true">{sel.m.flag}</span>
            <strong>{sel.m.name}</strong>
            <span className={`atlas-tag ${sel.gap[h] >= 0 ? 'buy' : 'rent'}`}>{sel.gap[h] >= 0 ? 'Buy' : 'Rent'}</span>
            <span className="atlas-chip-go">Details ↓</span>
          </button>
        )}
      </div>
        {/* Top bar: search + metric */}
        <div className="atlas-top">
          <div className="atlas-search">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M13 13l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            <input
              type="search"
              placeholder="Find a country or city"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); setActiveOpt(0); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onKeyDown={onSearchKey}
              role="combobox"
              aria-expanded={searchOpen}
              aria-controls="atlas-options"
              aria-autocomplete="list"
              aria-activedescendant={searchOpen && options[activeOpt] ? `atlas-opt-${options[activeOpt].id}` : undefined}
              aria-label="Find a market on the map"
            />
            {searchOpen && (
              <ul className="atlas-options" id="atlas-options" role="listbox">
                {options.length === 0 && <li className="atlas-opt-empty">No markets match “{query}”</li>}
                {options.map((m, i) => {
                  const x = MODEL[m.id];
                  return (
                    <li
                      key={m.id}
                      id={`atlas-opt-${m.id}`}
                      role="option"
                      aria-selected={i === activeOpt}
                      className={i === activeOpt ? 'is-active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); pickOption(m.id); }}
                      onMouseEnter={() => setActiveOpt(i)}
                    >
                      <span className="flag" aria-hidden="true">{m.flag}</span>
                      <span className="atlas-opt-name">{m.name}</span>
                      <span className={`atlas-tag ${x.gap[h] >= 0 ? 'buy' : 'rent'}`}>{x.gap[h] >= 0 ? 'Buy' : 'Rent'}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="atlas-seg" role="radiogroup" aria-label="Colour the map by">
            {METRICS.map((mt) => (
              <button key={mt.key} type="button" role="radio" aria-checked={metric === mt.key} className={metric === mt.key ? 'is-on' : ''} onClick={() => setMetric(mt.key)}>
                <span className="lg">{mt.label}</span><span className="sm">{mt.short}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom bar: legend + horizon */}
        <div className="atlas-bottom">
          <div className="atlas-legend">
            <div className="atlas-legend-cap">{M.caption(h)}</div>
            <div className="atlas-legend-bar" style={{ background: `linear-gradient(90deg, ${LEGEND_STOPS.join(',')})` }} aria-hidden="true" />
            <div className="atlas-legend-ticks"><span className="rent">{M.ticks[0]}<em> · favours renting</em></span><span>{M.ticks[1]}</span><span className="buy"><em>favours buying · </em>{M.ticks[2]}</span></div>
          </div>
          <label className="atlas-horizon">
            <span className="atlas-horizon-top"><span>If you stay</span><strong>{h} {h === 1 ? 'year' : 'years'}</strong></span>
            <input type="range" min={1} max={30} step={1} value={h} onChange={(e) => setH(Number(e.target.value))} style={{ ['--pct' as string]: `${((h - 1) / 29) * 100}%` }} aria-valuetext={`${h} years`} />
          </label>
        </div>

      </div>

      {/* Side panel */}
      <aside className="atlas-panel" ref={panelRef} aria-live="polite">
        {sel ? (
          <div className="atlas-detail" key={sel.m.id}>
            <button type="button" className="atlas-back" onClick={resetView}>
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              All markets
            </button>
            <div className="atlas-detail-head">
              <span className="atlas-flag flag" aria-hidden="true">{sel.m.flag}</span>
              <div>
                <h2>{sel.m.name}</h2>
                <p>{sel.m.kind === 'city' ? 'City' : 'Country'} · {sel.m.region} · {sel.m.currency}</p>
              </div>
            </div>

            <div className={`atlas-verdict ${sel.gap[h] >= 0 ? 'buy' : 'rent'}`}>
              <span className="atlas-verdict-label">After {h} {h === 1 ? 'year' : 'years'}</span>
              <span className="atlas-verdict-main">{sel.gap[h] >= 0 ? 'Buying' : 'Renting'} wins</span>
              <span className="atlas-verdict-sub">by <strong>{compactSigned(sel.m, Math.abs(sel.gap[h])).slice(1)}</strong> · {Math.abs(gapPct(sel, h) * 100).toFixed(0)}% of the home price</span>
            </div>

            <GapChart x={sel} h={h} />

            <dl className="atlas-stats">
              <div><dt>Typical home</dt><dd>{money(sel.m, sel.m.homePrice)}</dd></div>
              <div><dt>Typical rent</dt><dd>{money(sel.m, sel.m.monthlyRent)}<small>/mo</small></dd></div>
              <div><dt>Break-even rent</dt><dd>{money(sel.m, selBeRent)}<small>/mo</small></dd></div>
              <div><dt>Break-even year</dt><dd>{sel.breakEven ? `Year ${sel.breakEven}` : '30+ yrs'}</dd></div>
              <div><dt>Price-to-rent</dt><dd>{sel.ptr.toFixed(1)}</dd></div>
              <div><dt>Mortgage rate</dt><dd>{sel.m.mortgageRate}%</dd></div>
            </dl>

            <p className="atlas-fine">Modelled on typical local defaults (late 2026), not your situation. Change any input in the calculator.</p>
            <div className="atlas-actions">
              <a className="atlas-cta" href={calcHref(sel.m.id, h)} onClick={(e) => goCalculate(e, sel.m.id)}>
                Calculate for {sel.m.name.replace(' (Dubai)', '')}
                <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              {GUIDE[sel.m.id] && <a className="atlas-cta-2" href={`/rent-vs-buy-calculator/${GUIDE[sel.m.id]}/`}>Read the {sel.m.name} rent vs buy guide →</a>}
            </div>
          </div>
        ) : (
          <div className="atlas-overview">
            <p className="atlas-eyebrow">Rent vs buy atlas · {MARKETS.length} markets</p>
            <p className="atlas-big">Buying wins in <strong>{buyCount}</strong> of {MARKETS.length} markets</p>
            <p className="atlas-big-sub">if you stay {h} {h === 1 ? 'year' : 'years'}. Drag the slider to see how the map flips.</p>

            {guess && (
              <button type="button" className="atlas-you" onClick={() => choose(guess)}>
                <span className="flag" aria-hidden="true">{MODEL[guess].m.flag}</span>
                <span>Your market: <strong>{MODEL[guess].m.name}</strong></span>
                <span className={`atlas-tag ${MODEL[guess].gap[h] >= 0 ? 'buy' : 'rent'}`}>{MODEL[guess].gap[h] >= 0 ? 'Buy' : 'Rent'}</span>
              </button>
            )}

            <div className="atlas-regions" role="group" aria-label="Zoom to a region">
              {REGIONS.map((r) => (
                <button key={r} type="button" onClick={() => zoomToBox(REGION_BOX[r], 4, 0.85)}>{r}</button>
              ))}
            </div>

            <RankList title="Strongest case to buy" items={ranked.slice(0, 3)} h={h} onPick={choose} />
            <RankList title="Strongest case to rent" items={ranked.slice(-3).reverse()} h={h} onPick={choose} />

            <div className="atlas-actions">
              <a className="atlas-cta" href="/#calculator">
                Open the full calculator
                <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function RankList({ title, items, h, onPick }: { title: string; items: Model[]; h: number; onPick: (id: string) => void }) {
  return (
    <div className="atlas-rank">
      <h3>{title}</h3>
      <ol>
        {items.map((x) => {
          const p = gapPct(x, h);
          return (
            <li key={x.m.id}>
              <button type="button" onClick={() => onPick(x.m.id)}>
                <span className="flag" aria-hidden="true">{x.m.flag}</span>
                <span className="atlas-rank-name">{x.m.name}</span>
                <span className="atlas-rank-bar" aria-hidden="true"><i style={{ width: `${Math.min(Math.abs(p) / 0.4, 1) * 100}%`, background: p >= 0 ? BUY : RENT }} /></span>
                <span className={`atlas-rank-val ${p >= 0 ? 'buy' : 'rent'}`}>{signedPct(p)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
