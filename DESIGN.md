# Portal Tiago — design system

## Diagnosis

What works: the deep green already reads as wealth, not as a bank. Type is set in Bricolage Grotesque and Public Sans, which have more character than a default UI font. The layout is a single quiet column. Numbers use a dedicated class. Dark mode exists.

What is weak: every surface is the same white card with the same radius, so a Saturday, a milestone and a form feel identical. The active tab is a solid pill, which is loud on a phone and disappears into a horizontal scroll of nine labels. Hierarchy is flat: labels and amounts compete. Progress is a static 8px bar. Feedback is a small black toast. The login screen is the same card as the rest of the app, with no arrival. Emoji carry meaning that the type and color should carry. Category colors (reserve, lance, dreams) are named in CSS but not treated as a system, and they are hard to see as a family.

## Direction

**A private ledger: deep green, warm paper, and the number as the only hero.**

The product is opened once a week, on a phone, by one person. It should feel like opening a vault and seeing that the line moved, not like checking a feed.

### Palette

Deep green `#1F4D3A` stays the brand. It is the button, the active mark, and the ARCA category. Everything around it is warm paper and stone, not cool gray and not mint-washed white. Category colors are a family: reserve (ink blue), lance (bronze), ARCA (the brand green), dreams (dusk plum). Each has a soft background for tracks, alerts and pills. Semantic colors (success, warning, error, info) are separate from categories so a warning never looks like the motorcycle goal.

Light mode is paper. Dark mode is the same ledger with the lights down: near-black green, lifted type, and the same deep-green button so the brand does not turn pastel.

### Typography

Bricolage Grotesque for titles and figures. Public Sans for reading and forms. A short modular scale, from display down to caption. Every real amount uses tabular numerals so columns of reais do not jitter.

### Layout

One column, 760px max, designed at 360px. Space on a 4px scale. The phone gets a bottom bar: five weekly tabs, and Mais for the rest. Wide screens get one quiet top bar with an underline on the active item, not a pill. Cards are raised paper. The highlighted stat is a number with a hairline of brand color, not a filled box.

### Motion

Three durations, all at or under 360ms. Ease-out for entrances, standard ease for state changes. Tap feedback is a 120ms press. A check draws in when a Saturday is marked done and when a milestone is reached. The assistant shows a small pulse while it thinks. Nothing loops except that pulse, and nothing moves when `prefers-reduced-motion` is set. The login splash is the one longer moment (1.6s), once per session, and it is skipped entirely under reduced motion. The form is in the DOM the whole time.

### Why these choices

- Warm paper instead of pure white keeps the screen from feeling like a spreadsheet or a hospital.
- The deep green button never inverts to mint. In the dark theme the button is still the vault.
- A bottom bar matches weekly use: Início, Sábado, Check-in, ARCA and Mercado are the thumb zone. Assistente, Negócios, Futuro and Ajustes are Mais.
- Numbers are larger than labels because the question every Saturday is "did it move?"
- No glass, no purple gradient, no emoji as icons. Marks are drawn.

## Tokens

Non-color tokens live on `:root` and inherit. Color tokens are redefined for light, for dark (`prefers-color-scheme` and `[data-theme="dark"]`), and for a nested `[data-theme]` so the guide can show both.

### Color — neutrals

| Token | Light | Dark | Use |
|---|---|---|---|
| `--neutral-0` | `#F6F4EF` | `#121410` | Page, the paper |
| `--neutral-50` | `#EFECE4` | `#1C211C` | Sunken fills |
| `--neutral-100` | `#E3DFD4` | `#2A3128` | Borders, tracks |
| `--neutral-200` | `#D0CBBE` | `#3A4338` | Stronger borders |
| `--neutral-400` | `#8A8476` | `#9A958A` | Disabled, chart grid |
| `--neutral-600` | `#5C564C` | `#B7B1A4` | Secondary text |
| `--neutral-900` | `#1A1916` | `#F3F1EB` | Primary text |

### Color — brand and surfaces

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | `#1F4D3A` | `#B7D9C4` | Active text, links, ARCA stroke |
| `--brand-strong` | `#1F4D3A` | `#1F4D3A` | The button. Always the deep green |
| `--brand-soft` | `#E4EFE8` | `#1A2C23` | Pills, soft brand fills |
| `--on-brand` | `#F4F1EA` | `#142018` | Text on a category chip |
| `--surface` | `#F6F4EF` | `#121410` | Base |
| `--surface-raised` | `#FFFCF7` | `#1C211C` | Cards, inputs |
| `--surface-sunken` | `#EFECE4` | `#10130F` | Empty states, tracks |
| `--text` | `#1A1916` | `#F3F1EB` | Primary |
| `--text-muted` | `#5C564C` | `#B7B1A4` | Secondary. Both pass WCAG AA on their surface |
| `--border` | `#E3DFD4` | `#2A3128` | Hairlines |

### Color — semantic

| Token | Light | Dark | Soft (light / dark) |
|---|---|---|---|
| `--success` | `#1F4D3A` | `#B7D9C4` | `--success-soft` `#E4EFE8` / `#1A2C23` |
| `--warning` | `#6B4710` | `#E2C07A` | `--warning-soft` `#F8F1E4` / `#2C2416` |
| `--error` | `#8C2F2A` | `#F0B2AC` | `--error-soft` `#F8E8E6` / `#2C1816` |
| `--info` | `#2A4E6B` | `#A9C6DE` | `--info-soft` `#E6EEF4` / `#1A242E` |

### Color — categories

| Token | Light | Dark | Soft (light / dark) | Means |
|---|---|---|---|---|
| `--reserve` | `#2A4E6B` | `#A9C6DE` | `#E6EEF4` / `#1A242E` | Reserva |
| `--lance` | `#8A5A12` | `#E2C07A` | `#F8F1E4` / `#2C2416` | Lance |
| `--arca` | `#1F4D3A` | `#B7D9C4` | `#E4EFE8` / `#1A2C23` | ARCA |
| `--dream` | `#5C4D68` | `#D4C2DE` | `#F0EAF3` / `#261E2C` | Apartamento, carro |

### Aliases the portal markup already uses

Do not remove these. Charts and inline styles depend on them.

| Alias | Points at |
|---|---|
| `--paper` | `--surface` |
| `--card` | `--surface-raised` |
| `--ink` | `--text` |
| `--muted` | `--text-muted` |
| `--line` | `--border` |
| `--green` | `--brand` |
| `--mint` | `--brand-soft` |
| `--amber` | `--lance` |
| `--amber-bg` | `--lance-soft` |
| `--red` | `--error` |
| `--blue` | `--reserve` |
| `--plum` | `--dream` |

### Typography

| Token | Size | Line | Weight | Use |
|---|---|---|---|---|
| `--text-display` | `2.25rem` | 1.1 | 700 | Splash word, rare |
| `--text-h1` | `1.75rem` | 1.15 | 700 | Screen title |
| `--text-h2` | `1.125rem` | 1.3 | 650 | Section |
| `--text-h3` | `1rem` | 1.35 | 650 | Week title, card title |
| `--text-body` | `1rem` | 1.5 | 400 | Reading |
| `--text-small` | `0.875rem` | 1.45 | 400 | Notes, table |
| `--text-caption` | `0.75rem` | 1.35 | 500 | Labels, nav |
| `--font-display` | Bricolage Grotesque | | | Titles and figures |
| `--font-body` | Public Sans | | | Everything else |
| `--tracking-tight` | `-0.02em` | | | Titles |

`.num`, amounts in stats, list values and table figures set `font-variant-numeric: tabular-nums`.

### Space, radius, elevation

| Token | Value |
|---|---|
| `--space-1` … `--space-12` | 4, 8, 12, 16, 20, 24, 32, 40, 48 |
| `--radius-s` | 8px |
| `--radius-m` | 12px |
| `--radius-l` | 18px |
| `--radius-pill` | 999px |
| `--shadow-1` | `0 1px 1px rgba(26,25,22,.05)` |
| `--shadow-2` | `0 8px 24px rgba(26,25,22,.06)` |
| `--shadow-3` | `0 20px 48px rgba(26,25,22,.10)` |
| `--z-nav` | 20 |
| `--z-sheet` | 25 |
| `--z-toast` | 30 |
| `--z-splash` | 40 |
| `--nav-h` | 64px |

Dark shadows use black at a slightly higher alpha so a raised card still separates from `#121410`.

### Motion

| Token | Value |
|---|---|
| `--dur-fast` | 120ms |
| `--dur-med` | 220ms |
| `--dur-slow` | 360ms |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` |
| `--ease` | `cubic-bezier(.4,0,.2,1)` |

`prefers-reduced-motion: reduce` collapses every animation and transition to a single frame.

## Components

- **Nav.** Sticky top bar from 721px. Fixed bottom bar below that: Início, Sábado, Check-in, ARCA, Mercado, and Mais. Mais is a checkbox, not a tab, so it does not write `S.tab`. Choosing an item re-renders the bar and closes Mais. Active item: brand color and a 2px mark. Targets are at least 44px.
- **Stat and card.** Label in caption, figure in display type. `.stat.hl` is a brand hairline, not a filled well.
- **Bar.** 6px, category color, width transitions in `--dur-med`.
- **Buttons.** `.main` is always `#1F4D3A` with cream type. `.ghost` is a hairline. `.mini` is at least 44px. Hover only on devices that hover. Press scales to 0.98 in 120ms. Disabled is 45% opacity. `[aria-busy="true"]` shows a spinner.
- **Inputs.** 44px, raised surface, brand focus ring.
- **Segmented control, pills, alerts, tables, toast, milestones, AI card.** Same tokens. The toast sits above the bottom bar. A done Saturday shows a drawn check. A reached milestone pops once per paint (the app re-renders by replacing HTML, so the pop is tied to paint, not to a stored flag). The AI card pulses while `aiBusy` is set.
- **Empty.** `.empty` is one quiet sentence on sunken paper. Used when there is no check-in, no business movement, or no market position yet.

## Login and icons

The splash draws a T (two strokes) and then the word Portal, 1.6s, once per session (`sessionStorage` key `portal-splash`). Reduced motion never mounts the splash class. The password field can be shown or hidden. A wrong password shakes the error once. Submit sets `aria-busy` until the browser navigates.

PWA icons `public/icon-192.png` and `public/icon-512.png` are the same monogram: deep green rounded square, cream T. Manifest background is the paper color `#F6F4EF`.

## How to maintain the system

1. New color means a new token in both themes, with AA contrast checked on the surface it sits on. Do not paste a hex into a component.
2. Keep the aliases (`--green`, `--amber`, `--blue`, `--plum`, `--paper`, `--card`, `--ink`, `--muted`, `--line`, `--red`, `--mint`). `portal.js` charts and inline styles use them.
3. Do not change finance logic, `data-*` attributes, or the ids listed in the product rules. Visual work stays in markup classes and `portal.css`.
4. One column. If a screen needs a new block, use `.stat`, `.card`, `.field`, `.actions`. Do not invent a second card style.
5. Amounts get `.num`. Labels get `.sub`, `.note`, or a caption. The figure is always louder than its label.
6. Motion uses the duration tokens and stays under 360ms. Anything that loops is a status, not a decoration, and it stops under reduced motion.
7. Write new screen copy in Brazilian Portuguese, short enough to read with a thumb.
8. Check a change at 360px and at a wide window, in light and in dark, before calling it done. The living guide is `/design`.
