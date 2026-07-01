# SCCC — SoCal Cane Corso

Cinematic, animated multi-page brand site. Dark editorial aesthetic (black · smoke · gold) with a WebGL hero, inertia scrolling, and scroll-driven motion.

## Pages
- `index.html` — Home
- `shop.html` — Drop 001 collection (all 6 products, real links)
- `product/<slug>.html` — Product detail pages, generated per product from `data/products.json`
- `about.html` — The Bloodline (brand story)
- `lookbook.html` — Editorial gallery
- `contact.html` — Contact / newsletter / order-reservation form

## Content is data-driven — edit these, then rebuild
- `data/products.json` — every product: name, price, copy, sizes, images. One file, six pages.
- `data/site.json` — nav links, footer links, per-page SEO title/description/OG image, `base_url`, Formspree ID.
- `src/content/*.html` — unique body content for the non-product pages.
- `src/templates/*.html` — page shell and product-page template.

## Build
```
python3 build.py
```
Regenerates `index.html`, `shop.html`, `lookbook.html`, `about.html`, `contact.html`,
`product/*.html`, `sitemap.xml`, and `robots.txt` from the data + templates above.
Run it locally after any content change, then commit the generated output.

**This is not a runtime build step.** Vercel still just serves static files —
nothing executes server-side. `build.py` is a local authoring tool, not a
deploy dependency.

## Before going live — required
- [ ] Set your real Formspree form ID in `data/site.json` (`formspree_id`) — currently a placeholder, so the contact/reserve form will fail until replaced.
- [ ] Set the real deployed domain in `data/site.json` (`base_url`) — used for canonical URLs, OG image URLs, and `sitemap.xml`. Currently a placeholder.
- [ ] Swap `favicon.svg` / `assets/favicon-*.png` for the real brand mark — currently an abstract gold-ring placeholder, not a logo.

## Nice to have
- Social previews currently reuse `hero.jpg`/`story.jpg` for OG images (working, but not cropped to the 1200×630 ratio platforms expect). A purpose-cropped image per page would look sharper in link previews.

## Structure
- `css/site.css` — full design system
- `js/site.js` — animation engine, nav, page transitions, PDP size selection, form submission
- `assets/` — imagery (JPG + WebP, with `-480/-800/-1300` responsive width variants for product photos)

## Reserve flow (interim checkout)
There's no payment processor wired up. "Reserve this piece" on a product page
links to the contact form with product + size pre-filled; submissions go to
Formspree for manual follow-up. When ready for real self-serve checkout,
Snipcart or the Shopify Buy Button both integrate into static HTML like this
with no backend code.

## Motion stack (loaded via CDN)
GSAP + ScrollTrigger, Lenis (smooth scroll), Three.js (WebGL hero shader).
All motion respects `prefers-reduced-motion` and degrades without JS.

## Deploy (Vercel)
1. Import the `xenvectors/SCCC` repo at vercel.com/new (Framework preset: **Other**).
2. No build step at deploy time — static files, as before.
3. `vercel.json` enables clean URLs (`/shop`, `/product/guardian-hoodie`, …) and long-term asset caching.
