#!/usr/bin/env python3
"""
SCCC static site builder.

Reads /data/*.json and /src/* templates, writes finished static HTML to the
repo root and /product/. No framework, no npm, no server-side runtime needed
at deploy time -- Vercel (or any static host) just serves the output files
exactly as before.

Usage:
    python3 build.py

Edit these to change site content, then re-run and commit the output:
    data/products.json   -> product catalog (name, price, copy, sizes...)
    data/site.json        -> nav links, footer links, per-page SEO meta, Formspree ID
    src/content/*.html    -> unique body content per page
    src/templates/*.html  -> page shells / product template
"""
import json
import os
import re
from pathlib import Path
from datetime import date

ROOT_DIR = Path(__file__).parent
DATA = ROOT_DIR / "data"
SRC = ROOT_DIR / "src"

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

products_data = json.loads((DATA / "products.json").read_text())
site = json.loads((DATA / "site.json").read_text())
PRODUCTS = products_data["products"]
PRODUCTS_BY_SLUG = {p["slug"]: p for p in PRODUCTS}
YEAR = date.today().year

SHELL_TPL = (SRC / "templates" / "shell.html").read_text()
PRODUCT_TPL = (SRC / "templates" / "product.html").read_text()


# ---------- image dimension lookup (single source of truth = the actual file) ----------
def image_size(rel_path):
    if not HAS_PIL:
        return (1300, 907)
    p = ROOT_DIR / rel_path
    try:
        with Image.open(p) as im:
            return im.size
    except (FileNotFoundError, OSError):
        return (1300, 1625)


# ---------- shared markup builders ----------
def nav_html(active_href, root):
    links = []
    for l in site["nav_links"]:
        current = ' aria-current="page"' if l["href"] == active_href else ""
        links.append(f'<a href="{root}{l["href"]}"{current}>{l["label"]}</a>')
    return f'''<header class="nav">
  <div class="wrap nav__in">
    <a class="nav__brand" href="{root}index.html" aria-label="SCCC — home"><img src="{root}assets/brand/wordmark-a-gold.png" alt="SCCC"></a>
    <nav class="nav__links" aria-label="Primary">
      {''.join(links)}
    </nav>
    <div class="nav__right">
      <a class="nav__bag" href="{root}contact.html">Reserve</a>
      <button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>'''


def menu_html(active_href, root):
    links = []
    for l in site["nav_links"]:
        current = ' aria-current="page"' if l["href"] == active_href else ""
        links.append(f'<a href="{root}{l["href"]}"{current}>{l["label"]}</a>')
    return f'''<nav class="menu" id="mobile-menu" aria-label="Mobile" aria-hidden="true">
  <img class="menu__mark" src="{root}assets/brand/mark-glyph-gold.png" alt="">
  {''.join(links)}
  <div class="menu__meta"><span>SoCal, CA</span><span>Drop 001</span></div>
</nav>'''


def footer_html(root, with_cta=False):
    cta = ""
    if with_cta:
        cta = f'''<div class="foot__cta">
      <h2 class="h1 reveal-line"><span>Join the Bloodline</span></h2>
      <p class="lead reveal" style="margin:0 auto 28px;text-align:center">Early access to drops. 10% off your first order.</p>
      <a class="btn btn--solid" data-magnetic href="{root}contact.html"><span>Sign up</span></a>
    </div>'''
    cols = []
    for col in site["footer_cols"]:
        link_html = "".join(f'<a href="{root}{l["href"]}">{l["label"]}</a>' for l in col["links"])
        cols.append(f'<div class="foot__col"><h4>{col["title"]}</h4>{link_html}</div>')
    return f'''<footer class="foot">
  <div class="wrap">
    {cta}
    <div class="foot__grid">
      <div class="foot__brand"><div class="nav__brand"><img src="{root}assets/brand/wordmark-a-gold.png" alt="SCCC"></div><p>Built on Instinct. Defined by Discipline. Loyal for Life.</p></div>
      <div class="foot__cols">
        {''.join(cols)}
      </div>
    </div>
    <div class="foot__bottom"><span class="tricolor"><span></span><span></span><span></span></span><span>&copy; {YEAR} {site['brand_name']} &mdash; Est. MMXX</span><span>Built on Instinct. Loyal for Life.</span></div>
  </div>
</footer>'''


def scripts_html(root, include_three=False, include_world=False):
    three = f'<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>\n' if include_three else ""
    world = f'<script src="{root}js/world.js"></script>\n' if include_world else ""
    return f'''<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
{three}<script src="{root}js/site.js"></script>
{world}'''


def preload_html(root, image_rel):
    if not image_rel:
        return ""
    return f'<link rel="preload" as="image" href="{root}{image_rel}" fetchpriority="high" />'


def render_shell(page_key, content_html, root="", include_three=False,
                  preload_image=None, jsonld="", with_footer_cta=False, active_href=None, include_world=False):
    meta = site["pages"][page_key]
    canonical_abs = site["base_url"].rstrip("/") + meta["canonical"]
    og_image_abs = site["base_url"].rstrip("/") + "/" + meta["og_image"]
    active = active_href if active_href else f"{page_key}.html"
    html = SHELL_TPL
    html = html.replace("{{TITLE}}", meta["title"])
    html = html.replace("{{DESCRIPTION}}", meta["description"])
    html = html.replace("{{CANONICAL}}", canonical_abs)
    html = html.replace("{{OG_IMAGE_ABS}}", og_image_abs)
    html = html.replace("{{ROOT}}", root)
    html = html.replace("{{PRELOAD}}", preload_html(root, preload_image))
    html = html.replace("{{JSONLD}}", jsonld)
    html = html.replace("{{NAV}}", nav_html(active, root))
    html = html.replace("{{MENU}}", menu_html(active, root))
    html = html.replace("{{CONTENT}}", content_html)
    html = html.replace("{{FOOTER}}", footer_html(root, with_cta=with_footer_cta))
    html = html.replace("{{SCRIPTS}}", scripts_html(root, include_three=include_three, include_world=include_world))
    return html


# ---------- product cards (used on home + shop grids) ----------
CARD_SIZES = "(min-width:1000px) 33vw, (min-width:720px) 50vw, 100vw"
CARD_WIDTHS = [480, 800, 1300]


def card_html(p, root, show_meta=False):
    if p.get("photography_pending"):
        tag = '<span class="card__tag" style="color:var(--muted);border-color:var(--line)">Coming Soon</span>'
    elif p["is_new"]:
        tag = '<span class="card__tag">New</span>'
    else:
        tag = ""
    meta = f'<p class="card__meta">{p["short_desc"]}</p>' if show_meta else ""
    w, h = image_size(f"assets/{p['image']}.jpg")
    base = f"{root}assets/{p['image']}"
    webp_srcset = ", ".join(f"{base}-{cw}.webp {cw}w" for cw in CARD_WIDTHS)
    jpg_srcset = ", ".join(f"{base}-{cw}.jpg {cw}w" for cw in CARD_WIDTHS)
    return (f'<a class="card reveal" href="{root}product/{p["slug"]}.html">'
            f'<div class="card__media">{tag}<picture>'
            f'<source type="image/webp" srcset="{webp_srcset}" sizes="{CARD_SIZES}">'
            f'<img src="{base}-800.jpg" srcset="{jpg_srcset}" sizes="{CARD_SIZES}" '
            f'alt="{p["name"]}" loading="lazy" decoding="async" width="{w}" height="{h}">'
            f'</picture><span class="card__cta">View product</span></div>'
            f'<div class="card__row"><span class="card__name">{p["name"]}</span><span class="card__price">${p["price"]}</span></div>{meta}</a>')


def product_grid(slugs, root, show_meta=False):
    return "\n".join(card_html(PRODUCTS_BY_SLUG[s], root, show_meta) for s in slugs)


# ---------- JSON-LD ----------
def product_jsonld(p):
    canonical = site["base_url"].rstrip("/") + f"/product/{p['slug']}"
    image_abs = site["base_url"].rstrip("/") + f"/assets/{p['image']}.jpg"
    data = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": p["name"],
        "image": [image_abs],
        "description": p["desc"],
        "sku": p["slug"],
        "brand": {"@type": "Brand", "name": site["brand_name"]},
        "offers": {
            "@type": "Offer",
            "url": canonical,
            "priceCurrency": "USD",
            "price": p["price"],
            "availability": "https://schema.org/InStock"
        }
    }
    return f'<script type="application/ld+json">{json.dumps(data)}</script>'


def org_jsonld():
    data = {
        "@context": "https://schema.org/",
        "@type": "ClothingStore",
        "name": f"{site['brand_name']} — {site['brand_full']}",
        "url": site["base_url"],
        "description": site["tagline"]
    }
    return f'<script type="application/ld+json">{json.dumps(data)}</script>'


# ---------- sizes markup ----------
def sizes_html(product):
    out = []
    for s in product["sizes"]:
        sel = " sel" if s == product["default_size"] else ""
        out.append(f'<span class="size{sel}">{s}</span>')
    return "".join(out)


# ---------- build pages ----------
def build_static_pages():
    plans = [
        ("index", "index.html", dict(include_three=True, include_world=True, with_footer_cta=True, jsonld=org_jsonld())),
        ("shop", "shop.html", dict()),
        ("lookbook", "lookbook.html", dict()),
        ("about", "about.html", dict(preload_image="assets/story.jpg", include_three=True)),
        ("contact", "contact.html", dict()),
    ]
    for page_key, content_file, opts in plans:
        content = (SRC / "content" / content_file).read_text()
        if "{{PRODUCT_GRID_HOME}}" in content:
            content = content.replace("{{PRODUCT_GRID_HOME}}", product_grid(products_data["featured_home"], "", show_meta=False))
        if "{{PRODUCT_GRID_APPAREL}}" in content:
            apparel_slugs = [p["slug"] for p in PRODUCTS if p["category"] in ("apparel", "headwear")]
            content = content.replace("{{PRODUCT_GRID_APPAREL}}", product_grid(apparel_slugs, "", show_meta=True))
        if "{{PRODUCT_GRID_DOGGEAR}}" in content:
            doggear_slugs = [p["slug"] for p in PRODUCTS if p["category"] == "dog-gear"]
            content = content.replace("{{PRODUCT_GRID_DOGGEAR}}", product_grid(doggear_slugs, "", show_meta=True))
        if content_file == "contact.html":
            action = f"https://formspree.io/f/{site['formspree_id']}"
            content = content.replace("{{FORMSPREE_ACTION}}", action)
        html = render_shell(page_key, content, root="", **opts)
        (ROOT_DIR / content_file).write_text(html)
        print(f"  wrote {content_file}")


def build_product_pages():
    (ROOT_DIR / "product").mkdir(exist_ok=True)
    slugs = [p["slug"] for p in PRODUCTS]
    for i, p in enumerate(PRODUCTS):
        others = [slugs[(i + 1) % len(slugs)], slugs[(i + 2) % len(slugs)], slugs[(i + 3) % len(slugs)]]
        w, h = image_size(f"assets/{p['image']}.jpg")
        body = PRODUCT_TPL
        body = body.replace("{{ROOT}}", "../")
        body = body.replace("{{NAME}}", p["name"])
        body = body.replace("{{PRICE}}", str(p["price"]))
        body = body.replace("{{DESC}}", p["desc"])
        body = body.replace("{{DETAILS}}", p["details"])
        body = body.replace("{{CARE}}", p["care"])
        body = body.replace("{{SHIPPING}}", products_data["shipping_returns"])
        body = body.replace("{{SIZES_HTML}}", sizes_html(p))
        body = body.replace("{{IMAGE}}", p["image"])
        body = body.replace("{{IMG_HEIGHT}}", str(h))
        body = body.replace("{{SLUG}}", p["slug"])
        body = body.replace("{{CROSS_SELL_GRID}}", product_grid(others, "../", show_meta=False))
        if p.get("photography_pending"):
            body = body.replace(
                f'<a class="btn btn--solid" data-magnetic data-reserve href="../contact.html?product={p["slug"]}"><span>Reserve this piece — ${p["price"]}</span></a>',
                f'<a class="btn btn--solid" data-magnetic href="../contact.html?product={p["slug"]}&notify=1"><span>Notify me when available</span></a>'
            )
            body = body.replace(
                '<picture><source srcset="../assets/story.webp" type="image/webp"><img src="../assets/story.jpg" alt="SCCC campaign editorial" loading="lazy" width="1800" height="1200"></picture>',
                ''
            )

        page_key_meta = {
            "title": f"{p['name']} — SCCC",
            "description": f"{p['name']} — {p['short_desc']}. SCCC Drop 001.",
            "canonical": f"/product/{p['slug']}",
            "og_image": f"assets/{p['image']}.jpg",
        }
        site["pages"][f"_product_{p['slug']}"] = page_key_meta
        html = render_shell(f"_product_{p['slug']}", body, root="../",
                             jsonld=product_jsonld(p), active_href="shop.html")
        (ROOT_DIR / "product" / f"{p['slug']}.html").write_text(html)
        print(f"  wrote product/{p['slug']}.html")


def build_robots_sitemap():
    base = site["base_url"].rstrip("/")
    urls = ["/", "/shop", "/lookbook", "/about", "/contact"] + [f"/product/{p['slug']}" for p in PRODUCTS]
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sitemap.append(f"  <url><loc>{base}{u}</loc></url>")
    sitemap.append("</urlset>")
    (ROOT_DIR / "sitemap.xml").write_text("\n".join(sitemap) + "\n")
    (ROOT_DIR / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base}/sitemap.xml\n")
    print("  wrote sitemap.xml, robots.txt")


if __name__ == "__main__":
    print("Building SCCC site...")
    build_static_pages()
    build_product_pages()
    build_robots_sitemap()
    print("Done.")
