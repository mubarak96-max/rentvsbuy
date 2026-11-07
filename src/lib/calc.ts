// Rent vs buy engine: month-by-month simulation with opportunity cost.
// Pure functions so it can run on the server (SSR) and in the browser.

export interface Inputs {
  homePrice: number;
  monthlyRent: number;
  mortgageRate: number;
  termYears: number;
  downPaymentPct: number;
  propertyTaxPct: number;
  buyingCostsPct: number;
  sellingCostsPct: number;
  maintenancePct: number;
  insurancePct: number;
  monthlyHoa: number;
  appreciationPct: number;
  rentGrowthPct: number;
  investReturnPct: number;
  renterInsuranceMonthly: number;
  years: number;
  /** Shared ownership: % of the home bought (10–100). 100 = normal purchase. */
  sharePct: number;
  /** Shared ownership: annual rent on the unowned share as % of its value. */
  sharedRentPct: number;
}

export interface YearRow {
  year: number;
  homeValue: number;
  loanBalance: number;
  ownerEquity: number; // after selling costs
  ownerPortfolio: number;
  ownerNetWorth: number;
  renterNetWorth: number;
  ownerCostYear: number;
  renterCostYear: number;
  annualRent: number;
}

export interface Result {
  monthlyPayment: number;
  loanAmount: number;
  downPayment: number;
  buyingCosts: number;
  upfrontCash: number;
  firstMonthOwnerCost: number;
  firstMonthRenterCost: number;
  rows: YearRow[]; // index 0 = year 0 (day one), up to max simulated year
  horizon: YearRow;
  advantage: number; // ownerNW - renterNW at horizon (+ = buying wins)
  breakEvenYear: number | null; // first year buying wins (within 30y)
  breakdown: {
    interest: number;
    principal: number;
    propertyTax: number;
    maintenance: number;
    insurance: number;
    hoa: number;
    sharedRent: number;
    buyingCosts: number;
    sellingCosts: number;
    rentPaid: number;
    renterExtras: number;
  };
}

const MAX_YEARS = 30;

export function simulate(i: Inputs, simYears = Math.max(MAX_YEARS, i.years)): Result {
  const share = Math.min(Math.max(i.sharePct, 1), 100) / 100;
  const ownedValue = i.homePrice * share;
  const downPayment = ownedValue * (i.downPaymentPct / 100);
  const loanAmount = Math.max(ownedValue - downPayment, 0);
  const r = i.mortgageRate / 100 / 12;
  const n = Math.max(Math.round(i.termYears * 12), 1);
  const monthlyPayment = loanAmount === 0 ? 0 : r === 0 ? loanAmount / n : (loanAmount * r) / (1 - Math.pow(1 + r, -n));
  const buyingCosts = ownedValue * (i.buyingCostsPct / 100);
  const upfrontCash = downPayment + buyingCosts;

  const gHome = Math.pow(1 + i.appreciationPct / 100, 1 / 12) - 1;
  const gInv = Math.pow(1 + i.investReturnPct / 100, 1 / 12) - 1;
  const rentGrowth = 1 + i.rentGrowthPct / 100;

  let value = i.homePrice;
  let balance = loanAmount;
  let rent = i.monthlyRent;
  let hoa = i.monthlyHoa;
  let renterExtra = i.renterInsuranceMonthly;
  let sharedRent = share < 1 ? (i.homePrice * (1 - share) * (i.sharedRentPct / 100)) / 12 : 0;
  let ownerPortfolio = 0;
  let renterPortfolio = upfrontCash;

  const b = { interest: 0, principal: 0, propertyTax: 0, maintenance: 0, insurance: 0, hoa: 0, sharedRent: 0, buyingCosts, sellingCosts: 0, rentPaid: 0, renterExtras: 0 };
  const totals: typeof b[] = [];

  const rows: YearRow[] = [];
  const equityAt = (v: number, bal: number) => v * share * (1 - i.sellingCostsPct / 100) - bal;
  rows.push({
    year: 0, homeValue: value, loanBalance: balance, ownerEquity: equityAt(value, balance), ownerPortfolio: 0,
    ownerNetWorth: equityAt(value, balance), renterNetWorth: renterPortfolio, ownerCostYear: 0, renterCostYear: 0, annualRent: rent * 12,
  });

  let firstMonthOwnerCost = 0;
  let firstMonthRenterCost = 0;
  let ownerYear = 0;
  let renterYear = 0;

  for (let m = 1; m <= simYears * 12; m++) {
    let payment = 0;
    if (balance > 0.005) {
      const interest = balance * r;
      const principal = Math.min(monthlyPayment - interest, balance);
      payment = interest + principal;
      balance -= principal;
      b.interest += interest;
      b.principal += principal;
    }
    const tax = (value * i.propertyTaxPct) / 100 / 12;
    const maint = (value * i.maintenancePct) / 100 / 12;
    const ins = (value * i.insurancePct) / 100 / 12;
    b.propertyTax += tax; b.maintenance += maint; b.insurance += ins; b.hoa += hoa; b.sharedRent += sharedRent;
    b.rentPaid += rent; b.renterExtras += renterExtra;

    const ownerOut = payment + tax + maint + ins + hoa + sharedRent;
    const renterOut = rent + renterExtra;
    if (m === 1) { firstMonthOwnerCost = ownerOut; firstMonthRenterCost = renterOut; }
    ownerYear += ownerOut; renterYear += renterOut;

    ownerPortfolio *= 1 + gInv;
    renterPortfolio *= 1 + gInv;
    const diff = ownerOut - renterOut;
    if (diff > 0) renterPortfolio += diff; else ownerPortfolio += -diff;

    value *= 1 + gHome;

    if (m % 12 === 0) {
      const year = m / 12;
      const equity = equityAt(value, balance);
      rows.push({
        year, homeValue: value, loanBalance: Math.max(balance, 0), ownerEquity: equity, ownerPortfolio,
        ownerNetWorth: equity + ownerPortfolio, renterNetWorth: renterPortfolio, ownerCostYear: ownerYear, renterCostYear: renterYear, annualRent: rent * 12,
      });
      totals.push({ ...b, sellingCosts: value * share * (i.sellingCostsPct / 100) });
      ownerYear = 0; renterYear = 0;
      rent *= rentGrowth; hoa *= rentGrowth; renterExtra *= rentGrowth; sharedRent *= rentGrowth;
    }
  }

  const h = Math.min(Math.max(Math.round(i.years), 1), simYears);
  const horizon = rows[h];
  let breakEvenYear: number | null = null;
  for (let y = 1; y < rows.length; y++) {
    if (rows[y].ownerNetWorth >= rows[y].renterNetWorth) { breakEvenYear = y; break; }
  }
  return {
    monthlyPayment, loanAmount, downPayment, buyingCosts, upfrontCash, firstMonthOwnerCost, firstMonthRenterCost,
    rows, horizon, advantage: horizon.ownerNetWorth - horizon.renterNetWorth, breakEvenYear, breakdown: totals[h - 1],
  };
}

/** Monthly rent (today) at which renting and buying finish level at the horizon. */
export function breakEvenRent(i: Inputs): number {
  const years = Math.min(Math.max(Math.round(i.years), 1), MAX_YEARS);
  const adv = (rent: number) => {
    const res = simulate({ ...i, monthlyRent: rent }, years);
    return res.horizon.ownerNetWorth - res.horizon.renterNetWorth;
  };
  let lo = 0;
  let hi = Math.max(i.homePrice / 12, i.monthlyRent * 4, 1);
  if (adv(lo) > 0) return 0; // buying wins even with free rent
  if (adv(hi) < 0) return hi; // unrealistic: renting always wins
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (adv(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Ben Felix 5% rule and a personalised version using the user's own assumptions. */
export function fivePercentRule(i: Inputs) {
  const classic = (i.homePrice * 0.05) / 12;
  const equity = i.downPaymentPct / 100;
  const costOfCapital = Math.max(
    equity * (i.investReturnPct - i.appreciationPct) + (1 - equity) * (i.mortgageRate - i.appreciationPct),
    0,
  );
  const personalPct = i.propertyTaxPct + i.maintenancePct + i.insurancePct + costOfCapital + ((i.monthlyHoa * 12) / i.homePrice) * 100;
  return { classic, personalPct, personal: (i.homePrice * personalPct) / 100 / 12 };
}

export function priceToRent(i: Pick<Inputs, 'homePrice' | 'monthlyRent'>) {
  return i.homePrice / Math.max(i.monthlyRent * 12, 1);
}
