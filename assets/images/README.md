# Images

Drop files here using **exactly** these names. Each one replaces its labeled
placeholder automatically. No HTML edits are needed unless you change a name or format.

| File | Where it appears | Suggested size |
|---|---|---|
| `portrait.jpg` | Hero | 1200 × 1500 (4:5) |
| `obsession-still.jpg` | *Obsession* scroll reveal | 1920 × 1080 (16:9) |
| `hotd-approved.jpg` | *House of the Dragon* panel | 1600 × 1000 (16:10) |
| `travel-los-angeles.jpg` | Travel sequence | 1600 × 2000 or larger, subject centred |
| `travel-new-york.jpg` | Travel sequence | same |
| `travel-las-vegas.jpg` | Travel sequence | same |
| `og-image.jpg` *(optional)* | Link previews (uncomment the tag in `index.html`) | 1200 × 630 |

**Only use images you own or have written permission to publish.** For the two
productions, that means stills or behind-the-scenes photos the production has
approved for personal use. No screenshots, posters, logos, or footage.

## Optimising

Aim for **under ~300 KB per image**. Export as JPG at quality 75–82 (or WebP and
update the `src` in `index.html`). Any of these work:

- https://squoosh.app (in the browser, no install)
- `npx @squoosh/cli --mozjpeg '{quality:78}' --resize '{width:1600}' *.jpg`
- macOS Preview → Export → JPEG, quality slider around 75%

Travel photos are shown full-screen and also cropped into vertical thirds in the
finale, so keep the subject near the centre of each frame.
