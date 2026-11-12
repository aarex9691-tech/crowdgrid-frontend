# CrowdGrid style lock

The agreed look for every page. Change it only on purpose; new screens reuse these values.
Source of truth in code: `src/index.css` (tokens, controls) and `src/styles/theme.css` (shared pieces, motion).

## Direction

One platform for pilgrimages, public events and corporate gatherings, so nothing may read as
belonging to one of them. The palette is the tricolour plus chakra blue: white pages, navy ink,
saffron for actions, green for "valid", blue for structure. The single bold element is documentary
photography with real depth. Everything around it stays quiet.

- No gradient text. No all-caps labels. No arrows appended to links.
- Copy is short and says what the thing does. Sentence case everywhere.
- Each kind of gathering keeps one colour everywhere: saffron pilgrimage, blue public, green corporate.
- Red is for SOS and errors only.

## Colour contract (WCAG contrast against the surface named)

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `ink` | `#111C3A` | text | 16.8 on white |
| `ink-soft` | `#454F69` | secondary text | 8.2 on white |
| `ink-faint` | `#667089` | hints, placeholders | 4.9 on white |
| `paper` / body | `#FFFFFF` | page | |
| `mist` | `#F4F6FB` | quiet surface | |
| `line` | `#DDE2EC` | hairlines (decorative) | |
| `edge` | `#7F89A2` | input borders | at least 3:1 on white |
| `terracotta` | `#B4530F` | primary action, links | white text 5.0 |
| `marigold` | `#E36F1E` | bright saffron: marks only | never small text on white |
| `blue` | `#1F3F8F` | secondary action, selected state | white text 9.7 |
| `navy` | `#0F1A3C` | footer, hero title cards, bands | white text 17 |
| `tulsi` | `#0D6331` | valid, available | white text 7.4 |
| `leaf` | `#138A43` | bright green: marks only | |
| `kumkum` | `#C8102E` | SOS, errors | |
| `saffron-light` | `#FFD9B8` | saffron text on navy | at least 12 on navy |
| `blue-mist` | `#D5DEED` | secondary text on navy | at least 12 on navy |

Text-safe pairs: ink, ink-soft, ink-faint on white and mist; white on terracotta, blue, navy, tulsi;
saffron-light and blue-mist on navy. On saffron wash use `marigold-deep` (`#8A3F0B`), not terracotta.
Not text-safe: marigold or leaf on white; anything at reduced opacity on terracotta.

## Type

- Display: Rozha One (page titles, big section titles, large figures). One weight.
- Text: Plus Jakarta Sans. Mukta is bundled as the fallback and covers Devanagari.
- Body 17px / 1.55. Lines stay under about 75 characters.
- Labels are sentence case, semibold.

## Shape and depth

- Corners follow hierarchy: controls 12px, cards 16px, photos 24px, chips fully round.
- Cards are flat with a 1px line. One shadow (`--shadow-pop`) for things that float: dialogs and alerts.
- Lists use ruled rows, not a grid of boxes.

## Shared pieces

- `PageHero`: full-width photo with the title on a navy card. `kind` picks the photo and the card's edge colour;
  `kind="all"` shows the three gatherings side by side for neutral pages.
- `AuthShell`: form on the left, the three gatherings on the right (wide screens).
- `PageTitle` inside `cg-pagehead`: role dot, title, one line. Used on every dashboard.
- `cg-stat`: label above a figure, coloured left edge when the figure has a meaning (green good, red alert).
- `cg-ticket`: passes, with a stub in the kind's colour. Spent passes turn grey.
- `cg-progress`: numbered steps for a real sequence (checkout).
- `Notice`: coloured rule and icon, dark text.

## Photography and 3D

- Four photos in `public/media/`, three with depth maps. Slots are set in `src/data/landingMedia.js`.
- `DepthImage` shifts near objects more than far ones under the mouse (WebGL). It is off on touch devices,
  under reduced motion, with Save-Data and without WebGL; the plain photo always shows first.
- Text never sits directly on a photo. It sits on a solid navy card.

## Motion

One orchestrated moment per page: the home hero arriving, or a page photo settling (1.1s, once).
Everything else answers an action: press feedback, dialogs, alerts, menu, scan verdict, booking tick.
Transform and opacity only. Curves: `--ease-out`, `--ease-drawer`.
Charts, live counters, tabs and lists do not animate. Reduced motion removes movement and keeps short fades.

## Checks before shipping UI

- Contrast: every text pair at 4.5:1 or better.
- Controls at least 44px tall on phones.
- No sideways scroll at 390px.
- `npm run lint` and `npm run build` pass.
