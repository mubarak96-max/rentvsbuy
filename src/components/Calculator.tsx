import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { MARKETS, getMarket, type Market } from '../data/markets';
import { simulate, breakEvenRent, fivePercentRule, priceToRent, type Inputs } from '../lib/calc';

type Variant = 'standard' | 'shared-ownership';

interface Props {
  market?: string;
  variant?: Variant;
  horizonYears?: number;
  /** Global calculator only: pick the visitor's market from their time zone. */
  autoDetect?: boolean;
}

type Key = keyof Inputs;

interface Field {
  key: Key;
  label: string;
  unit: 'money' | 'pct' | 'years';
  step: number;
  help: string;
  param: string;
}

const FIELD_GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: 'The home & mortgage',
    fields: [
      { key: 'homePrice', label: 'Home price', unit: 'money', step: 1000, help: 'Purchase price of the home you would buy.', param: 'p' },
      { key: 'downPaymentPct', label: 'Down payment / deposit', unit: 'pct', step: 1, help: 'Share of the price paid upfront in cash.', param: 'd' },
      { key: 'mortgageRate', label: 'Mortgage rate', unit: 'pct', step: 0.05, help: 'Annual interest rate on the loan.', param: 'r' },
      { key: 'termYears', label: 'Mortgage term', unit: 'years', step: 1, help: 'Years to repay the loan (amortization).', param: 't' },
    ],
  },
  {
    title: 'Renting',
    fields: [
      { key: 'monthlyRent', label: 'Monthly rent (comparable home)', unit: 'money', step: 50, help: 'Rent for a home similar to the one you would buy.', param: 'rent' },
      { key: 'rentGrowthPct', label: 'Rent growth per year', unit: 'pct', step: 0.1, help: 'Expected annual rent increase. Also used to grow fees.', param: 'rg' },
      { key: 'renterInsuranceMonthly', label: 'Renter costs per month', unit: 'money', step: 5, help: 'Contents insurance, tenant fees, municipality fees.', param: 'ri' },
    ],
  },
  {
    title: 'Owning costs (yearly)',
    fields: [
      { key: 'propertyTaxPct', label: 'Property tax', unit: 'pct', step: 0.05, help: 'Recurring tax paid only by owners, % of home value.', param: 'tax' },
      { key: 'maintenancePct', label: 'Maintenance', unit: 'pct', step: 0.1, help: 'Repairs and upkeep, % of home value. 1% is a common rule.', param: 'mt' },
      { key: 'insurancePct', label: 'Home insurance', unit: 'pct', step: 0.05, help: 'Buildings/home insurance, % of home value.', param: 'ins' },
      { key: 'monthlyHoa', label: 'HOA / service charge (monthly)', unit: 'money', step: 10, help: 'Condo, strata, co-op or service charges.', param: 'hoa' },
    ],
  },
  {
    title: 'Transaction costs',
    fields: [
      { key: 'buyingCostsPct', label: 'Buying costs', unit: 'pct', step: 0.25, help: 'Stamp duty / transfer tax, legal, lender and agent fees.', param: 'bc' },
      { key: 'sellingCostsPct', label: 'Selling costs', unit: 'pct', step: 0.25, help: 'Agent commission and legal fees when you sell.', param: 'sc' },
    ],
  },
  {
    title: 'Growth & returns',
    fields: [
      { key: 'appreciationPct', label: 'Home price growth', unit: 'pct', step: 0.1, help: 'Expected annual home price appreciation.', param: 'hg' },
      { key: 'investReturnPct', label: 'Investment return (after tax)', unit: 'pct', step: 0.1, help: 'What your savings would earn if invested instead.', param: 'ir' },
    ],
  },
];

const SHARED_FIELDS: Field[] = [
  { key: 'sharePct', label: 'Share you buy', unit: 'pct', step: 5, help: 'Shared ownership share (10–75% typical).', param: 'sh' },
  { key: 'sharedRentPct', label: 'Rent on unowned share', unit: 'pct', step: 0.05, help: 'Annual rent as % of the unowned share’s value (often 2.75%).', param: 'srp' },
];

const ALL_FIELDS = [...FIELD_GROUPS.flatMap((g) => g.fields), ...SHARED_FIELDS];

function fromMarket(m: Market, years: number, variant: Variant): Inputs {
  return {
    homePrice: m.homePrice, monthlyRent: m.monthlyRent, mortgageRate: m.mortgageRate, termYears: m.termYears,
    downPaymentPct: m.downPaymentPct,
    propertyTaxPct: m.propertyTaxPct, buyingCostsPct: m.buyingCostsPct, sellingCostsPct: m.sellingCostsPct,
    maintenancePct: m.maintenancePct, insurancePct: m.insurancePct, monthlyHoa: variant === 'shared-ownership' ? Math.max(m.monthlyHoa, 150) : m.monthlyHoa,
    appreciationPct: m.appreciationPct, rentGrowthPct: m.rentGrowthPct, investReturnPct: m.investReturnPct,
    renterInsuranceMonthly: m.renterInsuranceMonthly, years,
    sharePct: variant === 'shared-ownership' ? 40 : 100, sharedRentPct: 2.75,
  };
}

function useFormatter(m: Market) {
  return useMemo(() => {
    const money = new Intl.NumberFormat(m.locale, { style: 'currency', currency: m.currency, maximumFractionDigits: 0 });
    const compact = new Intl.NumberFormat(m.locale, { style: 'currency', currency: m.currency, notation: 'compact', maximumFractionDigits: 1 });
    return { money: (v: number) => money.format(Math.round(v)), compact: (v: number) => compact.format(v) };
  }, [m.locale, m.currency]);
}

const REGIONS = ['Americas', 'Europe', 'Middle East & Africa', 'Asia-Pacific'] as const;

const TZ_MARKET: Record<string, string> = {
  'Asia/Dubai': 'uae', 'Asia/Muscat': 'uae', 'Asia/Riyadh': 'saudi-arabia', 'Asia/Kolkata': 'india', 'Asia/Calcutta': 'india',
  'Asia/Singapore': 'singapore', 'Asia/Hong_Kong': 'hong-kong', 'Asia/Tokyo': 'japan', 'Europe/London': 'uk', 'Europe/Dublin': 'ireland',
  'Europe/Berlin': 'germany', 'Europe/Paris': 'france', 'Europe/Madrid': 'spain', 'Europe/Amsterdam': 'netherlands', 'Europe/Zurich': 'switzerland',
  'Europe/Rome': 'italy', 'Europe/Lisbon': 'portugal', 'Europe/Stockholm': 'sweden', 'Africa/Johannesburg': 'south-africa',
  'America/Mexico_City': 'mexico', 'America/Sao_Paulo': 'brazil', 'Pacific/Auckland': 'new-zealand', 'America/New_York': 'us', 'America/Toronto': 'canada',
  'America/Vancouver': 'canada', 'America/Edmonton': 'canada', 'America/Winnipeg': 'canada', 'America/Halifax': 'canada',
};

function guessMarket(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TZ_MARKET[tz]) return TZ_MARKET[tz];
    if (tz.startsWith('Australia/')) return 'australia';
    if (tz.startsWith('America/')) return 'us';
  } catch { /* ignore */ }
  return null;
}

export default function Calculator({ market = 'us', variant = 'standard', horizonYears = 10, autoDetect = false }: Props) {
  const [marketId, setMarketId] = useState(market);
  const m = getMarket(marketId);
  const [inputs, setInputs] = useState<Inputs>(() => fromMarket(getMarket(market), horizonYears, variant));
  const [copied, setCopied] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const fmt = useFormatter(m);
  const isShared = variant === 'shared-ownership';

  // Restore state from URL (shareable links), or guess the visitor's market on the global calculator
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (![...q.keys()].length) {
      if (!autoDetect) return;
      const guess = guessMarket();
      if (guess && guess !== marketId) changeMarket(guess);
      return;
    }
    const mid = q.get('m');
    const base = mid ? fromMarket(getMarket(mid), horizonYears, variant) : inputs;
    const next: Inputs = { ...base };
    for (const f of ALL_FIELDS) {
      const v = q.get(f.param);
      if (v !== null && v !== '' && !Number.isNaN(Number(v))) (next[f.key] as number) = Number(v);
    }
    const y = q.get('y');
    if (y && !Number.isNaN(Number(y))) next.years = Number(y);
    if (mid) setMarketId(getMarket(mid).id);
    setInputs(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = useMemo(() => simulate(inputs), [inputs]);
  const beRent = useMemo(() => breakEvenRent(inputs), [inputs]);
  const rule = useMemo(() => fivePercentRule(inputs), [inputs]);
  const ptr = priceToRent(inputs);

  const set = (key: Key, value: number) => setInputs((prev) => ({ ...prev, [key]: value }));

  const changeMarket = (id: string) => {
    setMarketId(id);
    setInputs(fromMarket(getMarket(id), inputs.years, variant));
  };

  const shareUrl = () => {
    const q = new URLSearchParams();
    q.set('m', marketId);
    q.set('y', String(inputs.years));
    for (const f of ALL_FIELDS) q.set(f.param, String(inputs[f.key]));
    const url = `${window.location.origin}${window.location.pathname}?${q.toString()}`;
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    window.history.replaceState(null, '', url);
  };

  const buyWins = result.advantage >= 0;
  const h = inputs.years;
  const rows = result.rows.slice(0, h + 1);

  return (
    <div className="calc" data-variant={variant}>
      <div className="calc-top">
        <label className="calc-market">
          <span>Market</span>
          <select value={marketId} onChange={(e) => changeMarket(e.target.value)} aria-label="Choose a housing market">
            {REGIONS.map((region) => (
              <optgroup key={region} label={region}>
                {MARKETS.filter((x) => x.region === region).map((x) => (
                  <option key={x.id} value={x.id}>{x.flag} {x.name} ({x.currency})</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="calc-horizon">
          <span>How long will you stay? <strong>{h} {h === 1 ? 'year' : 'years'}</strong></span>
          <input type="range" min={1} max={30} step={1} value={h} style={{ '--pct': `${((h - 1) / 29) * 100}%` } as CSSProperties} onChange={(e) => set('years', Number(e.target.value))} aria-label="Years you plan to stay" />
        </label>
      </div>

      <div className="calc-grid">
        <form className="calc-inputs" onSubmit={(e) => e.preventDefault()} aria-label="Calculator inputs">
          {isShared && (
            <fieldset>
              <legend>Shared ownership</legend>
              {SHARED_FIELDS.map((f) => <NumberField key={f.key} f={f} value={inputs[f.key]} onChange={set} currency={m.currency} />)}
            </fieldset>
          )}
          {FIELD_GROUPS.map((g) => (
            <fieldset key={g.title}>
              <legend>{g.title}</legend>
              {g.fields.map((f) => <NumberField key={f.key} f={f} value={inputs[f.key]} onChange={set} currency={m.currency} />)}
            </fieldset>
          ))}
          <p className="calc-note"><strong>{m.flag} {m.name} defaults:</strong> {m.notes}</p>
          <button type="button" className="btn-ghost" onClick={() => changeMarket(marketId)}>Reset to {m.name} defaults</button>
        </form>

        <section className="calc-results" aria-live="polite" aria-label="Results">
          <div className={`verdict ${buyWins ? 'buy' : 'rent'}`}>
            <p className="verdict-label">After {h} {h === 1 ? 'year' : 'years'}</p>
            <p className="verdict-main">
              {buyWins ? (isShared ? 'Shared ownership' : 'Buying') : 'Renting'} comes out ahead by <strong>{fmt.money(Math.abs(result.advantage))}</strong>
            </p>
            <p className="verdict-sub">
              {result.breakEvenYear
                ? <>Buying overtakes renting in <strong>year {result.breakEvenYear}</strong>.</>
                : <>Buying does not overtake renting within 30 years on these assumptions.</>}
            </p>
          </div>

          <div className="stats">
            <Stat label="Break-even rent" value={beRent > 0 ? `${fmt.money(beRent)}/mo` : 'Buying always wins'} hint={`If a comparable home rents for less than this, renting wins over ${h} years.`} />
            <Stat label={isShared ? 'Mortgage on your share' : 'Mortgage payment'} value={`${fmt.money(result.monthlyPayment)}/mo`} hint={`Loan of ${fmt.money(result.loanAmount)} over ${inputs.termYears} years at ${inputs.mortgageRate}%.`} />
            <Stat label="Owning cost, month one" value={`${fmt.money(result.firstMonthOwnerCost)}/mo`} hint={`vs ${fmt.money(result.firstMonthRenterCost)}/mo to rent (incl. renter costs).`} />
            <Stat label="Cash needed to buy" value={fmt.money(result.upfrontCash)} hint={`${fmt.money(result.downPayment)} deposit + ${fmt.money(result.buyingCosts)} buying costs.`} />
            <Stat label="5% rule check" value={`${fmt.money(rule.classic)}/mo`} hint={`Your personalised rule: ${rule.personalPct.toFixed(1)}% → ${fmt.money(rule.personal)}/mo. Rent below this favours renting.`} />
            <Stat label="Price-to-rent ratio" value={ptr.toFixed(1)} hint={`Gross rental yield ${(100 / ptr).toFixed(2)}%. Above ~20 usually leans rent.`} />
          </div>

          <Chart rows={rows} fmt={fmt.compact} breakEven={result.breakEvenYear && result.breakEvenYear <= h ? result.breakEvenYear : null} />

          <div className="networth">
            <div><span className="dot buy" />Net worth if you buy: <strong>{fmt.money(result.horizon.ownerNetWorth)}</strong>
              <small>Home equity after selling costs {fmt.money(result.horizon.ownerEquity)}{result.horizon.ownerPortfolio > 1 ? ` + investments ${fmt.money(result.horizon.ownerPortfolio)}` : ''}</small></div>
            <div><span className="dot rent" />Net worth if you rent: <strong>{fmt.money(result.horizon.renterNetWorth)}</strong>
              <small>Deposit, buying costs and monthly savings invested at {inputs.investReturnPct}%</small></div>
          </div>

          <details className="breakdown">
            <summary>Where the money goes over {h} years</summary>
            <table>
              <tbody>
                <tr><th scope="row">Mortgage interest</th><td>{fmt.money(result.breakdown.interest)}</td></tr>
                <tr><th scope="row">Principal repaid (becomes equity)</th><td>{fmt.money(result.breakdown.principal)}</td></tr>
                <tr><th scope="row">Property tax</th><td>{fmt.money(result.breakdown.propertyTax)}</td></tr>
                <tr><th scope="row">Maintenance</th><td>{fmt.money(result.breakdown.maintenance)}</td></tr>
                <tr><th scope="row">Insurance</th><td>{fmt.money(result.breakdown.insurance)}</td></tr>
                {result.breakdown.hoa > 0 && <tr><th scope="row">HOA / service charges</th><td>{fmt.money(result.breakdown.hoa)}</td></tr>}
                {result.breakdown.sharedRent > 0 && <tr><th scope="row">Rent on unowned share</th><td>{fmt.money(result.breakdown.sharedRent)}</td></tr>}
                <tr><th scope="row">Buying costs</th><td>{fmt.money(result.breakdown.buyingCosts)}</td></tr>
                <tr><th scope="row">Selling costs (at year {h})</th><td>{fmt.money(result.breakdown.sellingCosts)}</td></tr>
                <tr className="sep"><th scope="row">Rent paid if renting</th><td>{fmt.money(result.breakdown.rentPaid)}</td></tr>
                <tr><th scope="row">Renter extras</th><td>{fmt.money(result.breakdown.renterExtras)}</td></tr>
              </tbody>
            </table>
          </details>

          <details className="breakdown" open={showTable} onToggle={(e) => setShowTable((e.target as HTMLDetailsElement).open)}>
            <summary>Year-by-year table</summary>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Year</th><th>Home value</th><th>Loan left</th><th>Buy: net worth</th><th>Rent: net worth</th><th>Annual rent</th></tr></thead>
                <tbody>
                  {rows.slice(1).map((r) => (
                    <tr key={r.year} className={r.ownerNetWorth >= r.renterNetWorth ? 'row-buy' : 'row-rent'}>
                      <td>{r.year}</td><td>{fmt.money(r.homeValue)}</td><td>{fmt.money(r.loanBalance)}</td>
                      <td>{fmt.money(r.ownerNetWorth)}</td><td>{fmt.money(r.renterNetWorth)}</td><td>{fmt.money(r.annualRent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <div className="calc-actions">
            <button type="button" className="btn" onClick={shareUrl}>{copied ? 'Link copied ✓' : 'Copy shareable link'}</button>
            <a className="btn-ghost" href="/methodology/">How we calculate</a>
          </div>
        </section>
      </div>
    </div>
  );
}

function NumberField({ f, value, onChange, currency }: { f: Field; value: number; onChange: (k: Key, v: number) => void; currency: string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => { if (Number(text) !== value) setText(String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const id = `f-${f.key}`;
  const suffix = f.unit === 'pct' ? '%' : f.unit === 'years' ? 'yrs' : currency;
  return (
    <div className="field">
      <label htmlFor={id}>{f.label}</label>
      <div className="input-wrap">
        <input
          id={id}
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.\-]/g, '');
            setText(raw);
            const n = Number(raw);
            if (raw !== '' && !Number.isNaN(n)) onChange(f.key, n);
          }}
          onBlur={() => setText(String(value))}
          aria-describedby={`${id}-h`}
        />
        <span className="suffix">{suffix}</span>
      </div>
      <small id={`${id}-h`}>{f.help}</small>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-hint">{hint}</p>
    </div>
  );
}

function Chart({ rows, fmt, breakEven }: { rows: { year: number; ownerNetWorth: number; renterNetWorth: number }[]; fmt: (v: number) => string; breakEven: number | null }) {
  const W = 640, H = 260, P = { l: 84, r: 16, t: 16, b: 32 };
  const vals = rows.flatMap((r) => [r.ownerNetWorth, r.renterNetWorth]);
  const min = Math.min(0, ...vals);
  const max = Math.max(...vals, 1);
  const maxYear = Math.max(rows[rows.length - 1].year, 1);
  const x = (y: number) => P.l + (y / maxYear) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - min) / (max - min || 1)) * (H - P.t - P.b);
  const path = (k: 'ownerNetWorth' | 'renterNetWorth') => rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.year).toFixed(1)},${y(r[k]).toFixed(1)}`).join(' ');
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const yearStep = maxYear <= 10 ? 1 : maxYear <= 20 ? 2 : 5;
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Net worth over time: buying versus renting">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" className="axis">{fmt(t)}</text>
          </g>
        ))}
        {rows.filter((r) => r.year % yearStep === 0).map((r) => (
          <text key={r.year} x={x(r.year)} y={H - 10} textAnchor="middle" className="axis">{r.year}</text>
        ))}
        <path d={path('renterNetWorth')} className="line rent" />
        <path d={path('ownerNetWorth')} className="line buy" />
        {breakEven !== null && rows[breakEven] && (
          <g>
            <line x1={x(breakEven)} x2={x(breakEven)} y1={P.t} y2={H - P.b} className="be-line" />
            <circle cx={x(breakEven)} cy={y(rows[breakEven].ownerNetWorth)} r={5} className="be-dot" />
          </g>
        )}
      </svg>
      <figcaption><span className="dot buy" />Buy <span className="dot rent" />Rent &nbsp;·&nbsp; Net worth by year{breakEven ? ` · break-even in year ${breakEven}` : ''}</figcaption>
    </figure>
  );
}
