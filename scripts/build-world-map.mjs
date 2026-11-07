// Pre-projects the Natural Earth 1:110m world into SVG path strings so the browser
// never needs d3-geo or topojson. Run: node scripts/build-world-map.mjs
// Output: src/data/world-map.json (committed).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'));
const W = 1000;
const H = 500;

const all = feature(topo, topo.objects.countries).features.filter((f) => f.id !== '010' && f.properties.name !== 'Antarctica');
const projection = geoEqualEarth().fitExtent([[8, 8], [W - 8, H - 8]], { type: 'FeatureCollection', features: all });

// Round coordinates to 1 decimal place: ~0.04° at this scale, invisible even at 12× zoom.
const round = (s) => s.replace(/-?\d+\.\d+/g, (n) => (Math.round(Number(n) * 10) / 10).toString());
const path = geoPath(projection);

// Bounds of the largest polygon, so zoom-to targets the mainland (France, not French Guiana; the US, not Alaska).
const mainland = (f) => {
  if (f.geometry.type !== 'MultiPolygon') return f;
  const polys = f.geometry.coordinates.map((c) => ({ type: 'Polygon', coordinates: c }));
  return polys.reduce((a, b) => (path.area(b) > path.area(a) ? b : a));
};

const countries = all.map((f, i) => {
  const main = mainland(f);
  const [[x0, y0], [x1, y1]] = path.bounds(main);
  const [cx, cy] = path.centroid(main);
  return {
    id: f.id == null ? `x${i}` : String(f.id),
    name: f.properties.name,
    d: round(path(f)),
    b: [x0, y0, x1, y1].map((v) => Math.round(v * 10) / 10),
    c: [Math.round(cx * 10) / 10, Math.round(cy * 10) / 10],
  };
});

// Points for cities and for markets too small to draw at 1:110m.
const POINTS = {
  'new-york': [-74.006, 40.7128],
  london: [-0.1276, 51.5072],
  toronto: [-79.3832, 43.6532],
  sydney: [151.2093, -33.8688],
  singapore: [103.8198, 1.3521],
  'hong-kong': [114.1694, 22.3193],
};
const points = Object.fromEntries(Object.entries(POINTS).map(([k, ll]) => [k, projection(ll).map((v) => Math.round(v * 10) / 10)]));

const graticule = [];
for (let lon = -180; lon <= 180; lon += 30) graticule.push({ type: 'LineString', coordinates: Array.from({ length: 37 }, (_, i) => [lon, -90 + i * 5]) });
for (let lat = -60; lat <= 60; lat += 30) graticule.push({ type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat]) });
const outline = round(path({ type: 'Sphere' }));
const grid = round(path({ type: 'MultiLineString', coordinates: graticule.map((g) => g.coordinates) }));

const out = { width: W, height: H, outline, grid, countries, points };
writeFileSync(new URL('../src/data/world-map.json', import.meta.url), JSON.stringify(out));
console.log(`Wrote ${countries.length} countries, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
