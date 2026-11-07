// Illustrative default assumptions per market (late 2026).
// These are starting points for the calculator, not quotes. Every value is editable by the user.
// Percentages are annual unless stated otherwise.

export interface Market {
  id: string;
  name: string;
  kind: 'country' | 'city';
  region: 'Americas' | 'Europe' | 'Middle East & Africa' | 'Asia-Pacific';
  flag: string;
  currency: string;
  locale: string;
  homePrice: number;
  monthlyRent: number;
  mortgageRate: number; // % per year
  termYears: number;
  downPaymentPct: number; // % of price
  propertyTaxPct: number; // % of home value per year (recurring property/land/council-style taxes paid only by owners)
  buyingCostsPct: number; // % of price: transfer/stamp duty, legal, valuation, lender & agent fees paid by buyer
  sellingCostsPct: number; // % of sale price: agent commission, legal, transfer costs paid by seller
  maintenancePct: number; // % of home value per year (repairs, upkeep, sinking/service funds)
  insurancePct: number; // % of home value per year (building/home insurance)
  monthlyHoa: number; // strata / condo / service charge per month (owner only)
  appreciationPct: number; // expected home price growth per year
  rentGrowthPct: number; // expected rent growth per year
  investReturnPct: number; // expected after-tax return on invested savings per year
  renterInsuranceMonthly: number;
  notes: string; // market-specific caveats shown under the calculator
}

export const MARKETS: Market[] = [
  {
    id: 'us', name: 'United States', kind: 'country', region: 'Americas', flag: '🇺🇸', currency: 'USD', locale: 'en-US',
    homePrice: 420000, monthlyRent: 2100, mortgageRate: 6.3, termYears: 30, downPaymentPct: 20,
    propertyTaxPct: 1.1, buyingCostsPct: 3, sellingCostsPct: 6, maintenancePct: 1, insurancePct: 0.55, monthlyHoa: 0,
    appreciationPct: 3.5, rentGrowthPct: 3.5, investReturnPct: 7, renterInsuranceMonthly: 15,
    notes: 'Property tax varies from roughly 0.3% (Hawaii) to over 2% (New Jersey, Illinois). Mortgage interest is only deductible if you itemize. PMI typically applies below 20% down.',
  },
  {
    id: 'uk', name: 'United Kingdom', kind: 'country', region: 'Europe', flag: '🇬🇧', currency: 'GBP', locale: 'en-GB',
    homePrice: 290000, monthlyRent: 1350, mortgageRate: 4.3, termYears: 25, downPaymentPct: 10,
    propertyTaxPct: 0, buyingCostsPct: 2.5, sellingCostsPct: 2, maintenancePct: 1, insurancePct: 0.15, monthlyHoa: 0,
    appreciationPct: 3, rentGrowthPct: 4, investReturnPct: 6, renterInsuranceMonthly: 10,
    notes: 'Council tax is paid by both renters and owners, so it is excluded. Buying costs include Stamp Duty Land Tax (first-time buyer relief applies up to £300,000 in England) plus legal and survey fees. Leaseholds may add ground rent and service charges.',
  },
  {
    id: 'canada', name: 'Canada', kind: 'country', region: 'Americas', flag: '🇨🇦', currency: 'CAD', locale: 'en-CA',
    homePrice: 700000, monthlyRent: 2300, mortgageRate: 4.4, termYears: 25, downPaymentPct: 20,
    propertyTaxPct: 0.8, buyingCostsPct: 2.5, sellingCostsPct: 5, maintenancePct: 1, insurancePct: 0.2, monthlyHoa: 0,
    appreciationPct: 3, rentGrowthPct: 3.5, investReturnPct: 6.5, renterInsuranceMonthly: 25,
    notes: 'Canadian mortgages renew every 1–5 years, so your rate will change over a 25-year amortization. Below 20% down you pay CMHC insurance. Land transfer tax varies by province (Toronto charges both provincial and municipal LTT).',
  },
  {
    id: 'australia', name: 'Australia', kind: 'country', region: 'Asia-Pacific', flag: '🇦🇺', currency: 'AUD', locale: 'en-AU',
    homePrice: 900000, monthlyRent: 2800, mortgageRate: 5.6, termYears: 30, downPaymentPct: 20,
    propertyTaxPct: 0.3, buyingCostsPct: 4.5, sellingCostsPct: 2.5, maintenancePct: 1, insurancePct: 0.2, monthlyHoa: 0,
    appreciationPct: 5, rentGrowthPct: 4, investReturnPct: 7, renterInsuranceMonthly: 15,
    notes: 'Rents are quoted weekly in Australia (A$650/week ≈ A$2,800/month). Stamp duty varies by state, with first-home-buyer concessions. Below 20% deposit, lenders mortgage insurance (LMI) usually applies.',
  },
  {
    id: 'uae', name: 'UAE (Dubai)', kind: 'country', region: 'Middle East & Africa', flag: '🇦🇪', currency: 'AED', locale: 'en-AE',
    homePrice: 1800000, monthlyRent: 10000, mortgageRate: 4.5, termYears: 25, downPaymentPct: 20,
    propertyTaxPct: 0, buyingCostsPct: 7, sellingCostsPct: 2, maintenancePct: 0.7, insurancePct: 0.05, monthlyHoa: 1500,
    appreciationPct: 4, rentGrowthPct: 5, investReturnPct: 6, renterInsuranceMonthly: 540,
    notes: 'Buying costs include the 4% Dubai Land Department fee, ~2% agent commission and mortgage registration. Owners pay annual service charges (set here as a monthly amount). Renters pay a 5% municipality housing fee on annual rent, included as renter costs. Rents are usually paid in 1–4 cheques per year.',
  },
  {
    id: 'india', name: 'India', kind: 'country', region: 'Asia-Pacific', flag: '🇮🇳', currency: 'INR', locale: 'en-IN',
    homePrice: 8000000, monthlyRent: 30000, mortgageRate: 8.5, termYears: 20, downPaymentPct: 20,
    propertyTaxPct: 0.1, buyingCostsPct: 7, sellingCostsPct: 1, maintenancePct: 0.5, insurancePct: 0.05, monthlyHoa: 3000,
    appreciationPct: 6, rentGrowthPct: 6, investReturnPct: 10, renterInsuranceMonthly: 0,
    notes: 'Metro gross rental yields are often around 3–4.5%, which tends to favour renting and investing. Stamp duty and registration together usually run 6–8% depending on the state. Home loan interest and principal can qualify for tax deductions under the old tax regime.',
  },
  {
    id: 'singapore', name: 'Singapore', kind: 'country', region: 'Asia-Pacific', flag: '🇸🇬', currency: 'SGD', locale: 'en-SG',
    homePrice: 1500000, monthlyRent: 4500, mortgageRate: 2.8, termYears: 30, downPaymentPct: 25,
    propertyTaxPct: 0.4, buyingCostsPct: 3.5, sellingCostsPct: 2, maintenancePct: 0.5, insurancePct: 0.02, monthlyHoa: 350,
    appreciationPct: 3, rentGrowthPct: 2.5, investReturnPct: 6, renterInsuranceMonthly: 0,
    notes: 'Defaults reflect a private condominium for a Singapore citizen buying a first home. Buyer’s Stamp Duty is progressive; Additional Buyer’s Stamp Duty applies to second homes, PRs and foreigners. HDB flats have very different economics.',
  },
  {
    id: 'germany', name: 'Germany', kind: 'country', region: 'Europe', flag: '🇩🇪', currency: 'EUR', locale: 'de-DE',
    homePrice: 450000, monthlyRent: 1500, mortgageRate: 3.6, termYears: 30, downPaymentPct: 20,
    propertyTaxPct: 0.2, buyingCostsPct: 10, sellingCostsPct: 3, maintenancePct: 1, insurancePct: 0.1, monthlyHoa: 0,
    appreciationPct: 2, rentGrowthPct: 3, investReturnPct: 6, renterInsuranceMonthly: 10,
    notes: 'Kaufnebenkosten (real estate transfer tax of 3.5–6.5% by state, notary and land registry ~2%, and broker fees) commonly total 9–12%. German loans usually fix the rate for 10–15 years, then refinance.',
  },
  {
    id: 'new-zealand', name: 'New Zealand', kind: 'country', region: 'Asia-Pacific', flag: '🇳🇿', currency: 'NZD', locale: 'en-NZ',
    homePrice: 800000, monthlyRent: 2690, mortgageRate: 5, termYears: 30, downPaymentPct: 20,
    propertyTaxPct: 0.35, buyingCostsPct: 1, sellingCostsPct: 3, maintenancePct: 1, insurancePct: 0.35, monthlyHoa: 0,
    appreciationPct: 3.5, rentGrowthPct: 3, investReturnPct: 6.5, renterInsuranceMonthly: 20,
    notes: 'New Zealand has no stamp duty, so buying costs are mainly legal fees and inspections. Council rates and home insurance are relatively high. Rents are quoted weekly (NZ$620/week ≈ NZ$2,690/month).',
  },
  {
    id: 'ireland', name: 'Ireland', kind: 'country', region: 'Europe', flag: '🇮🇪', currency: 'EUR', locale: 'en-IE',
    homePrice: 380000, monthlyRent: 1900, mortgageRate: 3.8, termYears: 30, downPaymentPct: 10,
    propertyTaxPct: 0.1, buyingCostsPct: 2.5, sellingCostsPct: 2, maintenancePct: 1, insurancePct: 0.1, monthlyHoa: 0,
    appreciationPct: 5, rentGrowthPct: 4, investReturnPct: 6, renterInsuranceMonthly: 10,
    notes: 'Stamp duty is 1% on residential property up to €1 million. Central Bank rules generally cap first-time buyers at 90% loan-to-value and 4× income. Help to Buy can contribute to deposits on new builds.',
  },
  {
    id: 'france', name: 'France', kind: 'country', region: 'Europe', flag: '🇫🇷', currency: 'EUR', locale: 'fr-FR',
    homePrice: 330000, monthlyRent: 1200, mortgageRate: 3.2, termYears: 25, downPaymentPct: 10,
    propertyTaxPct: 0.8, buyingCostsPct: 8, sellingCostsPct: 5, maintenancePct: 1, insurancePct: 0.1, monthlyHoa: 0,
    appreciationPct: 2, rentGrowthPct: 2.5, investReturnPct: 6, renterInsuranceMonthly: 15,
    notes: 'Frais de notaire on existing homes are typically 7–8% (2–3% on new builds). Taxe foncière is paid by owners. Lenders follow the HCSF 35% debt-to-income guideline. Loans are usually fixed for the full term.',
  },
  {
    id: 'spain', name: 'Spain', kind: 'country', region: 'Europe', flag: '🇪🇸', currency: 'EUR', locale: 'es-ES',
    homePrice: 280000, monthlyRent: 1200, mortgageRate: 2.9, termYears: 30, downPaymentPct: 20,
    propertyTaxPct: 0.5, buyingCostsPct: 11, sellingCostsPct: 4, maintenancePct: 1, insurancePct: 0.1, monthlyHoa: 80,
    appreciationPct: 4, rentGrowthPct: 5, investReturnPct: 6, renterInsuranceMonthly: 10,
    notes: 'Resale purchases pay ITP transfer tax (roughly 6–10% by region) plus notary, registry and gestoría fees; new builds pay 10% VAT plus stamp duty. Owners pay IBI and community fees. Sellers may owe plusvalía municipal.',
  },
  {
    id: 'netherlands', name: 'Netherlands', kind: 'country', region: 'Europe', flag: '🇳🇱', currency: 'EUR', locale: 'nl-NL',
    homePrice: 470000, monthlyRent: 1700, mortgageRate: 3.8, termYears: 30, downPaymentPct: 10,
    propertyTaxPct: 0.1, buyingCostsPct: 3.5, sellingCostsPct: 1.5, maintenancePct: 1, insurancePct: 0.1, monthlyHoa: 0,
    appreciationPct: 4, rentGrowthPct: 4, investReturnPct: 6, renterInsuranceMonthly: 10,
    notes: 'First-time buyers under 35 can be exempt from the 2% transfer tax below a price cap. Mortgage interest is tax-deductible for annuity mortgages, which this calculator does not model.',
  },
  {
    id: 'switzerland', name: 'Switzerland', kind: 'country', region: 'Europe', flag: '🇨🇭', currency: 'CHF', locale: 'de-CH',
    homePrice: 1200000, monthlyRent: 2500, mortgageRate: 1.6, termYears: 30, downPaymentPct: 20,
    propertyTaxPct: 0.3, buyingCostsPct: 3, sellingCostsPct: 3, maintenancePct: 1, insurancePct: 0.1, monthlyHoa: 0,
    appreciationPct: 2.5, rentGrowthPct: 1.5, investReturnPct: 5, renterInsuranceMonthly: 15,
    notes: 'Swiss rules require at least 20% equity (max 10% from pension funds) and stress-test affordability at a notional ~5% rate. Imputed rental value taxation is being phased out following the 2025 referendum.',
  },
  {
    id: 'japan', name: 'Japan', kind: 'country', region: 'Asia-Pacific', flag: '🇯🇵', currency: 'JPY', locale: 'ja-JP',
    homePrice: 55000000, monthlyRent: 220000, mortgageRate: 1.1, termYears: 35, downPaymentPct: 10,
    propertyTaxPct: 0.5, buyingCostsPct: 7, sellingCostsPct: 4, maintenancePct: 0.6, insurancePct: 0.05, monthlyHoa: 30000,
    appreciationPct: 1, rentGrowthPct: 1, investReturnPct: 5, renterInsuranceMonthly: 1500,
    notes: 'Defaults reflect a resale condo in greater Tokyo. Buildings depreciate in Japan, so land drives value. Renters often pay key money and renewal fees every two years, which you can add to renter costs.',
  },
  {
    id: 'hong-kong', name: 'Hong Kong', kind: 'country', region: 'Asia-Pacific', flag: '🇭🇰', currency: 'HKD', locale: 'en-HK',
    homePrice: 8000000, monthlyRent: 20000, mortgageRate: 3.5, termYears: 30, downPaymentPct: 30,
    propertyTaxPct: 0.3, buyingCostsPct: 5, sellingCostsPct: 1, maintenancePct: 0.3, insurancePct: 0.02, monthlyHoa: 2000,
    appreciationPct: 1, rentGrowthPct: 2, investReturnPct: 6, renterInsuranceMonthly: 0,
    notes: 'Rates and government rent are charged on rateable value. Ad valorem stamp duty applies on purchase. Mortgages are usually HIBOR- or prime-linked, so payments float with interest rates.',
  },
  {
    id: 'south-africa', name: 'South Africa', kind: 'country', region: 'Middle East & Africa', flag: '🇿🇦', currency: 'ZAR', locale: 'en-ZA',
    homePrice: 1800000, monthlyRent: 12000, mortgageRate: 10.5, termYears: 20, downPaymentPct: 10,
    propertyTaxPct: 0.8, buyingCostsPct: 5, sellingCostsPct: 6, maintenancePct: 1, insurancePct: 0.3, monthlyHoa: 0,
    appreciationPct: 4.5, rentGrowthPct: 5, investReturnPct: 10, renterInsuranceMonthly: 0,
    notes: 'Bond rates follow prime. Transfer duty is progressive with an exemption threshold; bond registration and conveyancing fees add to buying costs. Estate agent commission is commonly 5–7.5% plus VAT.',
  },
  {
    id: 'saudi-arabia', name: 'Saudi Arabia', kind: 'country', region: 'Middle East & Africa', flag: '🇸🇦', currency: 'SAR', locale: 'en-SA',
    homePrice: 1000000, monthlyRent: 4000, mortgageRate: 5.5, termYears: 25, downPaymentPct: 10,
    propertyTaxPct: 0, buyingCostsPct: 7.5, sellingCostsPct: 0.5, maintenancePct: 1, insurancePct: 0.05, monthlyHoa: 0,
    appreciationPct: 4, rentGrowthPct: 3, investReturnPct: 6, renterInsuranceMonthly: 0,
    notes: 'Purchases carry the 5% Real Estate Transaction Tax plus brokerage (up to 2.5%). Citizens may qualify for Sakani support. Riyadh introduced a multi-year residential rent freeze in 2025.',
  },
  {
    id: 'italy', name: 'Italy', kind: 'country', region: 'Europe', flag: '🇮🇹', currency: 'EUR', locale: 'it-IT',
    homePrice: 230000, monthlyRent: 850, mortgageRate: 3.3, termYears: 25, downPaymentPct: 20,
    propertyTaxPct: 0, buyingCostsPct: 5, sellingCostsPct: 3, maintenancePct: 1, insurancePct: 0.1, monthlyHoa: 80,
    appreciationPct: 1.5, rentGrowthPct: 3, investReturnPct: 5.5, renterInsuranceMonthly: 0,
    notes: 'A primary residence (prima casa) is exempt from IMU and enjoys a reduced 2% registration tax on resale purchases. Agency fees of 2–4% are often charged to both buyer and seller.',
  },
  {
    id: 'portugal', name: 'Portugal', kind: 'country', region: 'Europe', flag: '🇵🇹', currency: 'EUR', locale: 'pt-PT',
    homePrice: 300000, monthlyRent: 1300, mortgageRate: 3.2, termYears: 30, downPaymentPct: 10,
    propertyTaxPct: 0.35, buyingCostsPct: 7, sellingCostsPct: 5, maintenancePct: 1, insurancePct: 0.1, monthlyHoa: 50,
    appreciationPct: 5, rentGrowthPct: 5, investReturnPct: 6, renterInsuranceMonthly: 0,
    notes: 'Buyers pay IMT (progressive transfer tax, with exemptions for young first-time buyers) plus 0.8% stamp duty. IMI annual property tax is 0.3–0.45% of tax value.',
  },
  {
    id: 'sweden', name: 'Sweden', kind: 'country', region: 'Europe', flag: '🇸🇪', currency: 'SEK', locale: 'sv-SE',
    homePrice: 3500000, monthlyRent: 11000, mortgageRate: 3, termYears: 30, downPaymentPct: 15,
    propertyTaxPct: 0.25, buyingCostsPct: 2, sellingCostsPct: 3, maintenancePct: 1, insurancePct: 0.1, monthlyHoa: 0,
    appreciationPct: 3, rentGrowthPct: 2.5, investReturnPct: 6, renterInsuranceMonthly: 150,
    notes: 'Sweden requires at least 10–15% down and mandatory amortization. Cooperative apartments (bostadsrätt) carry a monthly fee instead of property tax. First-hand rental contracts are scarce in Stockholm.',
  },
  {
    id: 'mexico', name: 'Mexico', kind: 'country', region: 'Americas', flag: '🇲🇽', currency: 'MXN', locale: 'es-MX',
    homePrice: 3000000, monthlyRent: 15000, mortgageRate: 10.5, termYears: 20, downPaymentPct: 20,
    propertyTaxPct: 0.1, buyingCostsPct: 6, sellingCostsPct: 4, maintenancePct: 1, insurancePct: 0.2, monthlyHoa: 1000,
    appreciationPct: 7, rentGrowthPct: 5, investReturnPct: 9, renterInsuranceMonthly: 0,
    notes: 'Closing costs include ISAI transfer tax, notary fees and appraisal. Predial property tax is low. Many buyers use Infonavit or Fovissste credit, which has different terms from bank mortgages.',
  },
  {
    id: 'brazil', name: 'Brazil', kind: 'country', region: 'Americas', flag: '🇧🇷', currency: 'BRL', locale: 'pt-BR',
    homePrice: 600000, monthlyRent: 2800, mortgageRate: 12, termYears: 30, downPaymentPct: 20,
    propertyTaxPct: 0.6, buyingCostsPct: 4, sellingCostsPct: 6, maintenancePct: 1, insurancePct: 0.1, monthlyHoa: 600,
    appreciationPct: 6, rentGrowthPct: 6, investReturnPct: 11, renterInsuranceMonthly: 0,
    notes: 'With the Selic rate in double digits, fixed-income returns are high, which raises the opportunity cost of a down payment. ITBI transfer tax is ~2–3% plus registry fees. Condo fees (condomínio) are common.',
  },
  {
    id: 'new-york', name: 'New York City', kind: 'city', region: 'Americas', flag: '🇺🇸', currency: 'USD', locale: 'en-US',
    homePrice: 850000, monthlyRent: 4200, mortgageRate: 6.3, termYears: 30, downPaymentPct: 20,
    propertyTaxPct: 0.9, buyingCostsPct: 4, sellingCostsPct: 7, maintenancePct: 0.5, insurancePct: 0.2, monthlyHoa: 1200,
    appreciationPct: 3, rentGrowthPct: 4, investReturnPct: 7, renterInsuranceMonthly: 20,
    notes: 'Co-op maintenance or condo common charges are entered as monthly fees. NYC buyers may pay the mansion tax above $1M and mortgage recording tax; sellers pay NYC and NYS transfer taxes.',
  },
  {
    id: 'london', name: 'London', kind: 'city', region: 'Europe', flag: '🇬🇧', currency: 'GBP', locale: 'en-GB',
    homePrice: 550000, monthlyRent: 2300, mortgageRate: 4.3, termYears: 30, downPaymentPct: 10,
    propertyTaxPct: 0, buyingCostsPct: 4, sellingCostsPct: 2, maintenancePct: 0.8, insurancePct: 0.1, monthlyHoa: 150,
    appreciationPct: 2.5, rentGrowthPct: 4, investReturnPct: 6, renterInsuranceMonthly: 10,
    notes: 'London gross rental yields are often under 5%, and many flats are leasehold with service charges. Stamp Duty above the first-time buyer threshold adds materially to buying costs.',
  },
  {
    id: 'toronto', name: 'Toronto', kind: 'city', region: 'Americas', flag: '🇨🇦', currency: 'CAD', locale: 'en-CA',
    homePrice: 1050000, monthlyRent: 2700, mortgageRate: 4.4, termYears: 25, downPaymentPct: 20,
    propertyTaxPct: 0.7, buyingCostsPct: 4, sellingCostsPct: 5, maintenancePct: 1, insurancePct: 0.15, monthlyHoa: 0,
    appreciationPct: 2.5, rentGrowthPct: 3, investReturnPct: 6.5, renterInsuranceMonthly: 25,
    notes: 'Toronto buyers pay both Ontario and municipal land transfer tax (with first-time-buyer rebates). Condo fees are significant for apartments; set them in monthly fees.',
  },
  {
    id: 'sydney', name: 'Sydney', kind: 'city', region: 'Asia-Pacific', flag: '🇦🇺', currency: 'AUD', locale: 'en-AU',
    homePrice: 1450000, monthlyRent: 3460, mortgageRate: 5.6, termYears: 30, downPaymentPct: 20,
    propertyTaxPct: 0.2, buyingCostsPct: 5, sellingCostsPct: 2.2, maintenancePct: 0.8, insurancePct: 0.15, monthlyHoa: 0,
    appreciationPct: 5, rentGrowthPct: 4, investReturnPct: 7, renterInsuranceMonthly: 15,
    notes: 'NSW transfer duty on a A$1.45M home is substantial; first home buyers get concessions below set thresholds. Rents are quoted weekly (A$800/week ≈ A$3,460/month).',
  },
];

export const MARKET_BY_ID: Record<string, Market> = Object.fromEntries(MARKETS.map((m) => [m.id, m]));

export const getMarket = (id: string): Market => MARKET_BY_ID[id] ?? MARKET_BY_ID['us'];
