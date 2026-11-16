# Portfolio — Olivier B. Janssen

A personal portfolio site that covers technology, gaming, film & television, and entrepreneurship.
It is plain HTML, CSS, and JavaScript, with no build step and no dependencies.

## Run it

```bash
npm run dev
```

Then open http://localhost:5173. To use a different port: `PORT=8080 npm run dev`.
Node 18 or newer is required. Any static server also works, e.g. `python3 -m http.server`.

## Deploy to GitHub Pages

The repo includes `.github/workflows/deploy.yml`. Every push to `main` runs
`npm run build`, which copies the public files into `_site/` and fails if any
local image, stylesheet or script link is broken. The workflow then publishes
`_site/` to GitHub Pages. All asset paths are relative, so the site works at
`https://<user>.github.io/<repo>/` and on a custom domain without changes.

To check a build locally the way Pages will serve it:

```bash
npm run build
BASE=/my-repo PORT=5174 node server.mjs _site
```

Then open http://localhost:5174/my-repo/.

## Structure

```
index.html            All content and copy (semantic HTML, works without JS)
css/styles.css        Page styles on top of the kit (palette tokens are in index.html)
js/main.js            Motion toggle, nav, image loading states, scroll scenes, embers
assets/images/        Your photos go here — see assets/images/README.md
assets/favicon.svg
server.mjs            Zero-dependency local preview server
scripts/build.mjs     Builds _site/ for GitHub Pages and checks every local link
.github/workflows/    GitHub Actions workflow that deploys to Pages
```

## Design system

The page is built on the tasteskill kit, copied unchanged into `assets/`
(`system.css`, `system.js`, `motion/`, `layout/`, `ui/`, `moments/`). Don't edit
those files; page-specific styles live in `css/styles.css` and `js/main.js`.
Palette tokens (Onyx #01010D, Electric Indigo #6331FB, Tropical Mint #88F9C0)
sit in the `:root` block in `index.html`.

## Filling in placeholders

Every placeholder is rendered in gold monospace with a dashed border, so it's easy to spot.
To find them all in the source:

```bash
grep -n "data-placeholder\|PLACEHOLDER" index.html
```

| Placeholder | Location |
|---|---|
| School & year | Case study intro |
| Methodology details, Findings, Outcomes | Case study steps 02–04 |
| Link to the full case study | "Full case study" button (`href="#"`) |
| killedbydiscord.com description | Selected work |
| Game jam name / years / scope *(optional)* | Selected work |
| Chubby Pixel highlight *(optional)* | Selected work |
| Discord recommendation excerpt *(optional, with permission)* | Selected work |
| Role notes for *Obsession* and *House of the Dragon* *(optional)* | Film & TV |
| Share image | `<head>`, commented out |
| Portrait photo | `assets/images/portrait.jpg` (the other five photos are in place) |

Delete any optional placeholder block you don't need.

## Motion & accessibility

- Motion follows the visitor's **reduced-motion** setting, and there's also a **Motion on/off**
  toggle in the header that's remembered per browser. With motion off (or without JS), every scene
  shows as a complete static layout.
- Scroll scenes (the *Obsession* reveal and the travel sequence) are driven by scroll position,
  not autoplay, so visitors control the pace. Nothing flashes.
- Skip link, visible focus rings, keyboard-operable mobile menu (Escape closes it), and the
  current section is marked in the nav.
- The travel tagline is real text and is read once by screen readers. The big kinetic city
  words are decorative and hidden from assistive tech.

## Rights notes

The *House of the Dragon* section uses an original ember-and-scale treatment. It uses no show
logos, footage, characters, or dialogue. The travel sequence is a silent, original "beat-cut"
animation with no music. Only add stills and photos you have permission to publish.
