---
title: "How to Calculate Rent vs Buy: Formulas and Spreadsheet Layout"
description: "How to calculate rent vs buy step by step: the mortgage formula, future value, net worth comparison and a rent vs buy spreadsheet layout to copy into Excel."
h1: "How to Calculate Rent vs Buy: A Step-by-Step Method With Formulas"
primaryKeyword: "how to calculate rent vs buy"
keywords: ["rent vs buy formula", "rent vs buy spreadsheet", "rent vs buy analysis", "rent vs buy excel", "rent or buy analysis worksheet", "mortgage amortization formula"]
category: "Costs & Math"
publishDate: 2026-11-04
updatedDate: 2026-11-07
tldr: "To calculate rent vs buy, project two net worths over the same horizon. The buyer's is home value minus selling costs minus the loan balance, plus any savings invested. The renter's is the deposit and buying costs invested on day one, plus the monthly difference whenever renting is cheaper. Whichever is larger at your horizon is the better financial choice."
keyTakeaways:
  - "Compare net worth at a horizon, not monthly rent against a mortgage payment."
  - "Four formulas do the work: mortgage payment, loan balance, home value and investment growth."
  - "Give the renter the deposit plus buying costs to invest on day one, then invest whichever side's monthly saving."
  - "A monthly spreadsheet with about 12 columns reproduces what a good calculator does."
faqs:
  - q: "What is the simplest rent vs buy formula?"
    a: "The quickest screen is the 5% rule: multiply the home price by 5% and divide by 12. If you can rent a comparable home for less than that, renting is likely cheaper. It approximates property tax, maintenance and the cost of capital. It is a rule of thumb, so follow it with a full net worth comparison before deciding."
  - q: "How do I calculate the mortgage payment in Excel or Google Sheets?"
    a: "Use =PMT(annual_rate/12, years*12, -loan_amount). For a $336,000 loan at 6.3% over 30 years, =PMT(6.3%/12, 360, -336000) returns about $2,079.75. The remaining balance after k months is =-FV(6.3%/12, k, -2079.75, 336000). Both functions work the same way in Excel, Google Sheets and LibreOffice."
  - q: "Should I use monthly or annual periods in a rent vs buy spreadsheet?"
    a: "Monthly is more accurate because mortgages amortize monthly and investment contributions happen monthly. An annual sheet is fine for a rough answer and is easier to read. If you go annual, compute the mortgage separately on a monthly basis and pull the year-end balance into your annual rows."
  - q: "What return should I use for the renter's investments?"
    a: "Use a realistic long-run, after-tax return for how the renter would actually invest. Diversified equity portfolios are often modelled at 5–7% after tax in developed markets; higher-rate economies like India or Brazil justify higher nominal figures. If the money would sit in a savings account, use the savings rate instead."
  - q: "How do I find the break-even year in my spreadsheet?"
    a: "Add a column that subtracts the renter's net worth from the buyer's at each year end. The first year that value turns positive is the break-even year. If it never turns positive within your horizon, renting is the better financial choice at your assumptions."
relatedTool: "/rent-vs-buy-calculator/"
---

## How do you calculate rent vs buy?

If you want to know how to calculate rent vs buy properly, the method is to **project the net worth you would have at a chosen horizon if you bought, and compare it with the net worth you would have if you rented and invested the money you did not spend on buying**. The buyer's net worth is home value minus selling costs minus the remaining loan, plus any savings they invested. The renter's is their invested deposit, buying costs and monthly savings. The larger number wins.

Comparing a rent cheque with a mortgage payment does not work. The payment mixes interest (a cost) with principal (savings you keep), and it ignores maintenance, taxes, transaction costs and what the deposit could have earned. A proper rent vs buy analysis puts every cash flow on both sides and lets compounding do its work.

## What inputs do you need?

| Input | Example (US defaults) | Notes |
|---|---|---|
| Home price | $420,000 | For a home comparable to the one you would rent |
| Monthly rent | $2,100 | Same size, location and quality |
| Down payment | 20% ($84,000) | |
| Buying costs | 3% ($12,600) | Closing costs, transfer taxes, fees |
| Mortgage rate and term | 6.3%, 30 years | |
| Property tax | 1.1% of value a year | |
| Maintenance | 1% of value a year | |
| Home insurance | 0.55% of value a year | |
| Selling costs | 6% of sale price | Agent, legal, transfer costs |
| Home price growth | 3.5% a year | |
| Rent growth | 3.5% a year | |
| Investment return (after tax) | 7% a year | |
| Renter's insurance | $15 a month | |
| Horizon | 10 years | How long you will stay |

These are the defaults in our [United States calculator](/rent-vs-buy-calculator/united-states/). Swap in your market's figures from the [country hub](/rent-vs-buy-calculator/).

## Step 1: Calculate the mortgage payment

The standard amortization formula for a fixed-rate loan is:

**M = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)**

where P is the loan amount, r is the monthly interest rate (annual rate ÷ 12) and n is the number of monthly payments.

For a $336,000 loan at 6.3% over 30 years: r = 0.00525, n = 360, so **M ≈ $2,079.75 a month**.

In a spreadsheet: `=PMT(6.3%/12, 360, -336000)`.

## Step 2: Track the loan balance

Each month, interest = balance × r, and principal = M − interest. The balance after k months is:

**Bₖ = P × (1 + r)ᵏ − M × ((1 + r)ᵏ − 1) ÷ r**

After 10 years (k = 120), the balance is about **$283,400**. Only about $52,600 of the first 10 years' payments went to principal; about $197,000 was interest.

In a spreadsheet: `=-FV(6.3%/12, 120, -2079.75, 336000)`.

## Step 3: Project the home's value and running costs

Home value after t years: **Vₜ = V₀ × (1 + g)ᵗ**. At 3.5% growth, $420,000 becomes about **$592,450** after 10 years.

For a monthly sheet, convert annual growth to a monthly rate with `=(1+3.5%)^(1/12)-1` rather than dividing by 12, so the compounding matches.

Property tax, maintenance and insurance are percentages of the current value, so they rise as the home appreciates. In year 1 they total about $11,000; by year 10 about $15,500 a year.

## Step 4: Give the renter the same starting cash

This is the step most homemade spreadsheets miss. On day one, the buyer spends the deposit plus buying costs, $96,600. The renter keeps that money and **invests it at the after-tax return**.

Then, every month:

- Buyer's outflow = mortgage payment + property tax + maintenance + insurance + any HOA or service charge.
- Renter's outflow = rent + renter's insurance.
- **Whoever spends less invests the difference.**

In year 1 the buyer spends about $3,007 a month and the renter about $2,115, so the renter invests roughly $890 a month on top of the initial $96,600. Later, as rent rises, the gap narrows; if owning becomes cheaper, the buyer starts investing instead. This keeps both households on identical budgets, which is what makes the comparison fair.

Future value of a lump sum: **FV = PV × (1 + i)ⁿ**. For monthly contributions, grow the portfolio each month: `previous balance × (1 + monthly return) + contribution`.

## Step 5: Compare net worth at each year end

- **Buyer net worth = Vₜ × (1 − selling costs %) − Bₜ + buyer's portfolio**
- **Renter net worth = renter's portfolio**

With the US defaults:

| Year | Home value | Loan balance | Buyer net worth | Renter net worth | Difference (buy − rent) |
|---|---|---|---|---|---|
| 1 | $434,700 | $332,100 | $76,500 | $114,600 | −$38,100 |
| 5 | $498,800 | $313,800 | $155,100 | $194,400 | −$39,300 |
| 10 | $592,450 | $283,400 | $273,500 | $314,900 | −$41,400 |

At these assumptions renting and investing finishes about $41,400 ahead after 10 years. The answer is sensitive: at a 5% investment return, buying edges ahead by about $4,600 instead. See how rates alone shift it in [how interest rates affect rent vs buy](/blog/how-interest-rates-affect-rent-vs-buy/).

## Step 6: Find the break-even year and break-even rent

- **Break-even year:** the first year-end where buyer net worth ≥ renter net worth. With the US defaults it does not arrive within 10 years.
- **Break-even rent:** the starting monthly rent at which the two net worths are equal at your horizon. Use Goal Seek (Excel: Data › What-If Analysis › Goal Seek) to set the year-10 difference cell to zero by changing the rent cell. For the US defaults, it is about **$2,310 a month**. If you can rent a comparable home for less than that, renting wins.

Our [break-even point guide](/blog/rent-vs-buy-break-even-point/) explains why the break-even year moves so much with horizon and transaction costs.

## Rent vs buy spreadsheet layout you can copy

Put your inputs in a block at the top (cells B2:B15) and name them, then build one row per month:

| Col | Header | Formula idea (row for month m) |
|---|---|---|
| A | Month | 1, 2, 3 … |
| B | Home value | previous × (1 + monthly growth) |
| C | Interest | previous balance × rate/12 |
| D | Principal | payment − interest |
| E | Loan balance | previous balance − principal |
| F | Owner running costs | home value × (tax% + maint% + ins%) ÷ 12 + HOA |
| G | Owner outflow | payment + F |
| H | Rent | starting rent × (1 + rent growth)^(INT((m−1)/12)) |
| I | Renter outflow | H + renter's insurance |
| J | Renter portfolio | previous × (1 + monthly return) + MAX(G − I, 0) |
| K | Buyer portfolio | previous × (1 + monthly return) + MAX(I − G, 0) |
| L | Buyer net worth | B × (1 − selling%) − E + K |
| M | Renter net worth | J |
| N | Difference | L − M |

Set row 0 with the starting values: home value = price, balance = loan amount, renter portfolio = deposit + buying costs, buyer portfolio = 0. Then fill down for 120 or 360 rows. Filter for every 12th row to get the annual summary.

This mirrors the month-by-month method described on our [methodology page](/methodology/). It treats rent as rising once a year, which matches how most leases work.

### Adapting the sheet to other markets

The same layout works anywhere; only the inputs change. For Dubai, add the annual service charge to column F as a fixed monthly amount that grows with rent, and include the tenant's 5% housing fee in the renter's outflow. For the UK, leave council tax out because both sides pay it, and set buying costs to Stamp Duty plus legal fees. For Germany, buying costs of around 10% belong in the day-one cash the renter invests, which is why break-even comes late there. For shared ownership, add a column for rent on the unowned share and apply the mortgage only to the share you buy.

## Common mistakes in a rent or buy analysis worksheet

1. **Leaving out opportunity cost.** Without the renter's invested deposit, buying almost always looks better.
2. **Forgetting selling costs.** Agent and legal fees of 2–7% come straight off the buyer's equity.
3. **Treating the whole mortgage payment as a cost.** Principal is savings; it shows up in the lower loan balance.
4. **Comparing different homes.** The rent must be for a home like the one you would buy.
5. **Using a single "average" year.** Costs change as values and rents grow; model them over time.
6. **Ignoring local costs.** Transfer taxes range from about 1% in Ireland to around 10–11% in Germany and Spain.

## The faster way

A spreadsheet is worth building once so you understand the mechanics. For everyday use, our [rent vs buy calculator](/rent-vs-buy-calculator/) runs the same simulation for markets worldwide, finds the break-even year and break-even rent automatically, and lets you share the scenario by link. This is general information, not financial advice.
