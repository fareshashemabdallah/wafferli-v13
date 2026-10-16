# Dabberna source-first buying: trustworthy market prices in Jordan

**Engineering status (16 October 2026):** real retailer *discovery* is integrated and immediately usable via external, source-filtered product searches. A secure adapter for a licensed JSON price feed is in source. **No live product-price feed is connected and the app does not display market-price claims in its public pilot.** Do not portray retailer-search links as prices extracted, ranked, scraped or verified by Dabberna.

## User outcome

A parent types "baby shampoo 500ml" only. Dabberna opens current, source-filtered product listings from Jordan's known public storefronts: Cozmo, HyperMax, Leaders Center and SmartBuy. Individual pages must show the actual model, package quantity, JOD price, delivery and stock; the parent checks these on the seller's own site. Manual comparison is a secondary fallback, not the beginning of buying.

Current store discovery domains were checked in publicly accessible retailer pages. The links are Google search queries restricted by `site:<domain>`, rather than deep search endpoints whose existence we have not independently established. Google may omit, reorder or age listings. These are not promises of comparable complete-market coverage, quality or availability. External sites receive search terms on an explicit click; never append children's information, budget, location or household records.

## Future in-app prices

The tested client adapter `app/src/lib/marketPriceFeed.ts` is **off unless an operator configures** public build variable `VITE_MARKET_PRICE_FEED_URL` to an authorized HTTPS, CORS-compatible GET endpoint. This is the interface contract; it is not evidence the endpoint exists.

Request: `GET <endpoint>?q=<product-only-name>&market=JO`, with `credentials: omit`. Avoid appending family/child profiles, savings, balances, or identifiers. Avoid third-party cookies/trackers.

Example response from a future, contractually authorized provider, not sample market facts:

```json
{
  "offers": [
    {
      "id": "provider-item-id",
      "title": "Exact brand, model and size",
      "store": "Participating retailer",
      "priceJod": 10.50,
      "deliveryJod": null,
      "url": "https://cozmo.jo/example-product",
      "sourceCheckedAt": "2026-10-16T09:00:00Z",
      "availability": "unknown"
    }
  ]
}
```

**Treat the above response as a SCHEMA EXAMPLE only, not an actual merchant offer or endorsement.** Consumer price listings must have merchant permission or a licensed data source, a stable SKU/EAN/barcode, normalized unit size and variants, explicit VAT/delivery fees, and retailer-specific geographic availability. The adapter currently rejects stale records older than seven days, URLs outside the known retailer domains, invalid numbers, duplicates, sold-out offers and price fields with more than two decimals. This is source-data validation, **not** independent truth verification. Future backend must enforce a matching product specification and marketplace coverage; do not calculate a "market average" from unmatched variations or claim "you saved X" against an unobserved reference price.

## Release gates
- Negotiate authorized feed or merchant APIs; verify access permissions, expected latency, stock/expiry behavior, pricing updates and reliable API response/provenance.
- Implement server-side provider credentials, caching and monitoring; never ship keys in GitHub Pages or Vite environment. Independent backend testing and CORS.
- For every offer, visibly show store, current price, JOD unit/pack quantity, last-checked timestamp, possible extra delivery, current link and source confidence.
- Only compare **matching sizes/SKUs**, exclude unavailable/stale products, allow parent to choose a delivery locality explicitly and compare full landed cost.
- Flag insufficient market coverage and uncertainty prominently; do not claim cheapest in Jordan unless contractually comprehensive and verified.
- Do not custody merchant or user money. Checkout must be merchant/provider-hosted with independently verified commission and refund processes.
- Usability gate: parents can enter one item, find a credible current seller, understand source freshness and act without retyping private family information.

## Rationale

The customer promise is **"find actual seller options and help me choose the best fit,"** not "type two prices and see which is smaller." The latter remains available behind the source-first journey while real offer integration is being negotiated.
