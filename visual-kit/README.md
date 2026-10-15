# Dawid Hanrahan Visual Identity Kit

Version 5.2 · Binary Axis mark · 15 October 2026

This kit defines the visual direction for Dawid Hanrahan's personal portfolio. It is intended for designers and developers building portfolio pages, presentations, social assets, and supporting materials.

The identity is called **Soft Precision**: precise, approachable, and contemporary, with a visual language connecting software engineering, AI, mathematics, research, and teaching.

## Quick start

- Open `mini-brand-sheet.html` for the complete local preview.
- Share `mini-brand-sheet.png` when a single review image is sufficient.
- Use the SVG files in `logo/` and `symbol/` as the master artwork.
- Use `brand-tokens.css` or `palette.json` when implementing the palette.
- White logo and symbol files have transparent backgrounds and should be previewed on a dark surface.

## Package structure

```text
logo/                   Full logo in SVG and PNG
symbol/                 Standalone Binary Axis symbol in SVG and PNG
favicon/                Browser, touch, and application icons
motifs/                 Geometric rhythm and colour-field artwork
fonts/                  Manrope, IBM Plex Mono, and their licences
brand-tokens.css        Ready-to-use CSS colour and type tokens
palette.json            Machine-readable colour palette
mini-brand-sheet.html   Local reference sheet
mini-brand-sheet.svg    Scalable reference sheet
mini-brand-sheet.png    Shareable reference sheet
```

## Brand idea

The primary audience is potential clients, employers, and collaborators; students are a secondary audience. Projects and software or AI engineering expertise should lead. Research and teaching should remain easy to find without competing with the main portfolio narrative.

The line is **“Mathematician by training. Engineer by trade.”** — in Polish, **„Matematyk z wykształcenia. Inżynier z zawodu.”** Two clauses, no connective, no hedge. It earns the mathematical second layer of the mark instead of asserting it, and it is the only sentence that has to survive being read alone. Lead with it.

It replaces the earlier suggestion, “I build useful software by combining engineering with research curiosity.” *Useful* is a hedge, and a positioning line that hedges inside its first five words is not a position.

The heat kernel is the one piece of decoration that is also a true statement (the doctoral work is on its sharp estimates): the menu bar, the closing sections and the home page's projects all sit on the same kernel, so the projects are played with on the thing the research is about.

The **Binary Axis** mark reduces the initials to `0 · 1 → dh`: the bowl of the `d` recalls zero, the shared vertical acts as one, and a single curve completes the `h`. The initials should remain the immediate reading; the mathematical idea is the second layer.

## Voice

The mark and the palette are maybe a third of a personal brand. The rest is how the person writes, and this one has a settled character worth protecting.

- **Short declaratives.** Let a full stop do the work a comma would blur. Two clauses beat one sentence with a connective.
- **Evidence instead of adjectives.** Name the company, the number, the field: Nokia, Xperi, CloudFerro; two published papers; harmonic analysis. One named fact outranks any quantity of "extensive experience".
- **First person, plain.** "I'm drawn to problems where the maths and the infrastructure both have to be right." Not *passionate about*, not *leveraging*, not *cutting-edge*.
- **Understatement.** The work is strong enough that overselling it reads as doubt. Say what was built and what it did, and let the reader be the one who is impressed.
- **A technical claim arrives with its proof or it is not made.** This is the writing form of the rule that decorative geometry must not be presented as data.

Projects are written problem → role → solution → verified result, in that order. The verified result is the part most portfolios leave out, and the part that earns the other three.

Avoid superlatives, *innovative*, *passionate*, *world-class*, exclamation marks, and any sentence that hedges before its sixth word.

## Logo and symbol

- The primary logo combines the Binary Axis symbol with the two-line Dawid Hanrahan wordmark.
- Use navy as the default, white on sufficiently dark backgrounds, black for strict monochrome applications, and iris for selected accent applications.
- Keep the mark single-colour. Do not recolour individual strokes, alter its proportions, change stroke weight, rotate it, or add effects.
- Maintain clear space of at least 20% of the symbol height on every side.
- The standalone masters in `symbol/` are drawn on a 104 × 104 canvas: the smallest square that centres the 77 × 67.5 artwork and still meets that clear-space minimum on every side. Drop the file into a square container — an avatar, an app tile, a social profile — and the spacing is already correct. Do not crop the canvas back to the artwork.
- The icons in `favicon/` are a different case. There the mark sits on its own navy tile, centred, with 10% side padding. A tile edge is not layout clear space, so the 20% rule does not apply inside it.
- Minimum recommended width: 180 px for the full logo and 32 px for the standalone symbol.
- Favicons at 16–32 px use the supplied micro version with a heavier stroke. Do not generate them by simply shrinking the standard symbol.

## Colour palette

| Token | Light | Dark | Primary use |
| --- | --- | --- | --- |
| `background` | `#F8F9FC` | `#0E1424` | Main page background |
| `surface` | `#FFFFFF` | `#161F33` | Cards, menus, and fields |
| `ink` | `#17233D` | `#E6E9F2` | Headings, body text, and primary actions |
| `text-secondary` | `#566078` | `#9EA6BC` | Supporting copy and metadata |
| `lavender` | `#E8E1FA` | `#322A5A` | Visualisation and feature-section backgrounds |
| `blush` | `#F6E2EB` | `#42293E` | Secondary accent and illustration |
| `iris` | `#65509A` | `#B2A3E8` | Links, focus, and active states |
| `border` | `#E0E3EB` | `#262F45` | Decorative dividers and card outlines |
| `control-border` | `#848A9A` | `#6C7591` | Form and secondary-control boundaries |
| `primary-hover` | `#293A5C` | `#C4CADB` | Primary-action hover state |
| `shadow` | `#17233D` | `#03060E` | The colour every shadow is cast in (see Elevation) |

As a general composition guide, use approximately 75% light neutrals, 20% pastels, and 5% navy or strong accents. Use white on navy or iris and navy on pastel surfaces. Pastels are backgrounds, not colours for small text. A pale border must never be the only indication that a control is interactive.

`control-border` is the one value here chosen against a measurement rather than by eye. A control boundary must reach 3:1 against the surface behind it (WCAG 1.4.11), and most controls sit on `background`, not on `surface`. `#848A9A` reaches 3.28:1 on `background` and 3.45:1 on `surface`. Do not lighten it. `border` is decorative only — at 1.28:1 on white it carries no information, which is exactly why a control may never rely on it alone.

The dark column is described under Dark theme.

## Dark theme

The dark theme is called **Night Ink**. It is built from the same ink. In light, navy is the text and cloud is the page. In dark they swap, the pastels become deep tints of the same hues, and iris lightens until it reads as a link again. Token names and roles do not change, so an interface switches theme by switching values and nothing else.

- **The reader's system decides first.** A first visit follows `prefers-color-scheme` and keeps following it while the page is open. A choice of Light or Dark is remembered; choosing System again forgets it. The page never paints in the wrong theme first: the theme is set before the first paint.
- **The control** offers System, Light and Dark, as Lucide's `monitor`, `sun` and `moon`. Where the links have the menu bar (from 1280 px) it is one 40 px button beside EN/PL, the language control's size and edge, showing the chosen icon, System included, and a 12 px chevron (drawn at a 2.5 stroke to keep the set's weight) that says it opens a menu and turns while it is open, since at rest the button would otherwise pass for a segment of the language control, which switches at once; it opens a menu under an Appearance label with the three as a radio group, the chosen one checked in iris. Three segments there would take the room between the logo and the links, which in Polish would shrink to about 20 px. In the menu sheet, where there is room, the three are a segmented control under an Appearance group label, full width, each word under its icon, the pressed segment the chosen state. Either way the reader can see whether the page is following the machine, and System's name says what the machine is set to now ("System, now dark"), never the theme on screen.
- **The switch is the reader's heat source.** The new theme spreads out from the pressed segment as a circle, 400 ms on the brand ease, played once. Under `prefers-reduced-motion` it changes at once.
- **Contrast is measured, not inherited.** On `background`: `ink` 15.1:1, `text-secondary` 7.6:1, `iris` 8.1:1, `control-border` 4.0:1 (3.6:1 on `surface`). `text-secondary` sits higher than its light counterpart because 13 px mono metadata loses more on dark than on light. `border` stays decorative at about 1.4:1.
- **Pastels keep their job.** `lavender` and `blush` are hover and feature fills as well as illustration, so a dark tint has to show against what it sits on: about 1.27:1 on `surface`, as light lavender is on white. Darker, a hover disappears. Text on them keeps 10:1 (`ink`) and 5.3:1 (`text-secondary`).
- **Depth comes from the surface, not the shadow.** `surface` is one step lighter than `background`, and shadows are cast in `shadow`, which is near-black in dark at twice the light alpha, never past 0.6: a `float` at 1.0 is a solid slab, not a shadow.
- **Scrims dim.** The page behind a sheet or dialog is covered in `shadow` at the elevation alphas (0.4 for a sheet or dialog, 0.15 for a timeline card), never in the text colour, which in dark would lighten the page instead of dimming it.
- **The mark goes white**, as the logo rules already allow on dark backgrounds. The favicon keeps its navy tile in both themes.
- **Real captures are never dimmed or inverted.** A light screenshot in a dark frame is a window onto someone else's product.
- **Paper stays paper.** The teaching quotes' sticky notes are objects in the scene, not interface: they keep a slightly dimmed yellow and their text stays light-theme navy.
- **Brand marks keep their colour unless it disappears.** A technology mark that falls under 3:1 on `surface` (black or near-black marks) is drawn in `currentColor` instead, like the practices without a brand.
- **The heat field glows rather than stains.** Its illustration tints become `#4A3D7A` (lavender) and `#5E3550` (blush) mixed over the dark `background`, and the menu bar's peak still has to keep every link at 4.5:1.

## Typography

- **Manrope** is the primary typeface for headings, body copy, and interface text. Use 400 for body copy, 500 for navigation, 600 for headings, and 700 sparingly.
- **IBM Plex Mono** is reserved for technologies, dates, short labels, and code-like details. Use weights 400–500; `fonts/` carries both cuts, Regular and Medium, so neither is synthesised.
- Fallback stacks: `system-ui, sans-serif` and `ui-monospace, monospace`.
- Keep body copy to approximately 55–70 characters per line.
- Tracking: −0.035em on hero and section headings, −0.02em on card headings, 0 on body copy, and +0.1em on mono labels set in capitals.
- A label that names a group inside a section (a skill group, what students noticed, the note for the curious under a figure) is one style everywhere: IBM Plex Mono at metadata size, in capitals, +0.1em, weight 500, in `text-secondary`. A stage heading inside a section (a step of the research story) is set the same but in ink, because it heads the content under it rather than naming a group. Section eyebrows and illustration legends keep their iris; measurement legends are ink at 400.

Suggested responsive scale, desktop → mobile: hero 64/70 → 36/41 px (a masthead hero that shares the first screen with content, as on the home page, 48/52 → 36/41 px), section heading 40/48 → 28/34 px, card heading 24/31 → 22/29 px, body 18/29 → 16/26 px, and metadata 13/20 px.

Workshop articles are set on a reading scale of their own, larger than the body copy elsewhere, because they are read end to end in one narrow column: body 20/32 → 18/29 px and section headings 22 → 20 px.

## Layout and interface

- Maximum content width: 1160 px.
- Side margins: 48 px on large screens and 24 px on phones.
- Grid: 12 columns on desktop and 4 columns on mobile.
- Column gutter: 24 px, fixed. At the 1064 px inner width it is the only gutter for which a nested n-column block lands on the same axes as n equal spans, so every section shares one set of interior axes. Changing it means rewriting every section.
- Breakpoints: 640, 768 and 1024 px. The grid moves from 4 columns to 12 at 768 px.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, and 96 px.
- Section spacing: 80–96 px on desktop and 48–64 px on mobile.
- Avoid rigid full-screen sections. Let content determine height and keep the beginning of the project work visible or clearly suggested above the fold.
- Primary buttons use navy, white text, a 12 px radius, and a minimum height of 44 px. Text links use iris and remain underlined in running text.
- Keyboard focus uses a visible 2 px iris outline with a 3 px offset. Text fields show focus as a 2 px iris edge on the field itself, in place of the offset outline; the caret already marks them.
- Radius scale: 2 px for motif modules, 12 px for buttons and controls, 20 px for cards and panels. There is no fourth value.
- Project cards use a white surface, a 20 px radius, and a subtle outline. Motion or elevation should imply interactivity only when the whole card is actionable.
- A project marked as a phone app (`mobile` in the admin) keeps the same browser frame as every project, so every panel has one footprint: its window is the lavender field, the phone standing in it (a white body with the subtle outline and the card radius, no shadow, round its real capture at phone size in a 12 px screen), cut off at the window's foot like a product shot.
- Every project's panel is as tall as the longest one (switching never moves the page) and fills it: side by side, the frame grows to the panel's foot and its window shows more of the page, cropped at the sides; stacked, the story takes the rest, the Vex prompt at its foot. No project leaves a gap under it.
- Form errors must be described in words; colour cannot be the only signal.
- A figure the reader operates (the project field, the degree road, the career timeline, the skills) carries one hint, the same everywhere: one short line between the section heading and the figure, in IBM Plex Mono at metadata size in `muted-foreground`, the figure's full width, and worded "Wybierz …, by …" / "Choose … to …", a verb that holds for a mouse, a finger and a keyboard. No glyph and no motion of its own: the figure shows the rest with its hover and focus. While the reader's choice is open it fades out (200 ms) and keeps its line; where something is always open (the project field) it fades after the reader's first choice and stays away, on every return to the page, until the site is loaded again.

## Elevation

Shadows are cast in `shadow` at low alpha, never in neutral black. A grey shadow over this palette reads as dirt rather than depth. In light `shadow` is `ink`; in dark it is `#03060E`, because a shadow cast in the dark theme's light ink would glow. The alphas below are the light theme's; dark uses twice each, capped at 0.6.

| Token | Value | Use |
| --- | --- | --- |
| `lift` | `0 8px 24px -12px ink / 0.25` | An actionable card, on hover |
| `float` | `0 12px 32px -12px ink / 0.5` | A control that floats over the page, such as the chat launcher |
| `press` | `inset 0 1px 3px 0 ink / 0.14` | A control held in a pressed or chosen state, such as the selected project in a list or a check while its request is out; it keeps its `control-border` edge |

Name the card elevation `lift`, not `card`. In a Tailwind theme a shadow key that collides with a colour key is read as a shadow-*colour* utility, which silently renders the lift in white on a near-white page.

Menus, dialogs, popovers and toasts keep the conventional four-step ramp, re-tinted to `shadow` so borrowed components do not import a foreign grey: `sm` `0 1px 2px 0 / 0.06`, `md` `0 4px 6px -1px / 0.10`, `lg` `0 10px 15px -3px / 0.12`, `xl` `0 20px 25px -5px / 0.14`.

Elevation still signals interactivity. A card that is not actionable gets none of these, and neither does a static panel.

## Icons

- Use one outline set drawn on a 24 px grid with a 2 px stroke and round caps and joins. Lucide is the reference set and the one the interface uses.
- A 2 px stroke on a 24 px grid is 8.3% of the box; the mark's is 8.5%. That near-match is the reason icons sit beside the symbol without arguing with it. A set with square caps, a hairline stroke, or filled glyphs will fight the identity.
- Sizes: 16 px inline with text and in dense controls, 20 px in standalone buttons, 24 px for section and feature icons.
- Icons inherit `currentColor` and are never recoloured independently of the label they sit with.
- One exception, chosen by the owner: a technology's own mark (from Simple Icons) is drawn filled and in its brand colour wherever it names that technology — the build line on the home page and the skills on the Experience page. Practices with no brand (CI/CD, cloud, system engineering) keep the outline icon and follow their label.
- An icon never carries meaning on its own. Pair it with a label, or give it an accessible name.

## Visual motifs

The primary motif uses squares, short parallel lines, and points arranged on a regular grid. A single filled module or change of shape breaks the rhythm. Use a 24 px base module, 8–12 px spacing, 1 px lines, and 2–3 px corner radii. Decorative geometry must not be presented as data.

The supporting diffusion motif uses two asymmetric lavender and blush colour fields fading towards a light centre. It may use the illustration-only tones `#C6B4E7` and `#EDC2D7`; these are not interface tokens. Keep text on a calm, light area or a separate solid surface.

As a guide, geometric motifs should account for roughly two thirds of decorative applications and diffusion fields for one third. Use one clear motif per section and keep both subordinate to the content.

Use real interface captures for applications, clear architecture diagrams for backend work, and labelled charts or diagrams for research. Accuracy, labels, units, and legibility take precedence over decoration.

## Motion

- Section entrance: opacity 0 → 1 and translateY 8 px → 0 over 400 ms using `cubic-bezier(.22,1,.36,1)`.
- Card sequences: 50–70 ms stagger, no more than three items, played once.
- Button and hover feedback: 160–200 ms.
- Do not use autoplay loops, scroll hijacking, or parallax. The two named exceptions are on the home page: the project stack and the contact graph's waving edges (below).
- Demonstration run: a figure with a control may show what the control does by running it once, the first time the figure is mostly in view. It runs for at most 3 s (plus up to 1 s easing back), ends on the figure's clearest state, stops the moment the reader touches the control, never repeats on its own, and does not run under `prefers-reduced-motion`.
- Deliberate exceptions to the numbers above. Each plays once or follows the reader's own scroll or press, and none loops except the two named loops on Home, which have no pause control by the owner's choice (a known WCAG 2.2.2 gap); none runs under `prefers-reduced-motion`:
  - Experience: the company circles enter from the nearer side of the screen on arrival (900 ms, 90 ms apart), then follow the scroll into the sidebar beside the skills, and back; there, choosing a company or a skill rings the matching circles in lavender and greys the rest over 200 ms, and a flying circle takes that look on or off with the scroll, never on the timeline.
  - Education: the degrees are stops on a road across the column, each stop's drawing drawing itself once as it scrolls into view; under the pointer or keyboard focus a stop's name turns iris and its disc lifts as the Experience circles do; choosing a stop rings it at once in the lavender ring (150 ms) and winds the road up (1.25 s, settling on the kit's ease): it is reeled in from its far end onto a lavender coil round the first stop, the other stops riding the thread in with the chosen one on top, and the coil travels up to the top of the section and unrolls into a row across the column's whole width (three small discs at 1/6, 1/2 and 5/6 on a dotted line), while the degree's name and card rise in under it (8 px, from about 0.7 s); chosen from high up the page, the page scrolls smoothly as the card starts to rise, if the card would otherwise end below the screen, only as far as it takes to show its end and never past the section's heading (at once under reduced motion); the hint over the road fades out while a degree is open, as every hint does (see Layout and interface); in the row, another disc takes the ring (150 ms) and its card fades and rises in (280 ms); Escape, or a click anywhere in the section but on the card or another disc (the chosen disc, the row's line, the heading or empty space), plays the winding backwards (just over 1 s), the card fading at once (150 ms) as the page closes up under it, first bringing the row back into view if the reader has scrolled down the card (not smoothly under reduced motion), and either way can be turned round half-way; below md the stops are a list that simply crosses over into the row and back (280 ms), with no coil; a link to a degree opens the row at once, without the winding; under reduced motion the road and the row swap with a 150 ms fade and nothing travels; the teaching notes are stuck up as they scroll into view, and back.
  - Workshop: on the index, pointing at or focusing a piece lights the one mark in its exhibit that carries its result (the chosen bar, the limit of the identity, the edges of the delay band), 200 ms, and takes it away again.
  - Research: the grokking chart draws its new-examples lines when the reader checks a guess (2.8 s); the publications are filed onto the stack once (each sheet falls 40 px over 460 ms, 160 ms apart, then the stamp is pressed down).
  - Every page: the menu bar is a heat field that spreads from both ends once when a page opens (2.4 s) and then rests; a mouse over it adds heat where it passes: each source is sized by the bar's height (born at 0.4 of it, spreading to about 1.5 heights over 3.8 s), the bar's top and bottom edges are insulated, and the peak (0.3) keeps every link at 4.5:1.
  - Home: the projects are pucks on a heat field, the menu bar's kernel given room, with no box, border or colour of its own: it is the section's white until the reader warms it, all its heat is lavender (a mouse's at a peak of 0.55, nearly twice the menu bar's 0.3, since no text sits on it), and that warmth fades into the section over 48 px at the sides and 40 px top and bottom (24 and 32 px on a phone): the first time the field is well in view one pulse spreads from its centre (2.4 s) and the pucks glide out from it to stable homes, one after another (each 700 ms, easing out, passing over one another rather than colliding), and settle with a soft squash; after that nothing moves on its own, and the reader is the only heat: a mouse over the field leaves kernels that spread and fade (born 44 px wide, 1.6 s), the pucks lean a few pixels toward the warmth and spring back, a click on the empty field sends a pulse that nudges the pucks near it, a puck can be dragged, kept inside the field, shoving the others out of its way (pushes, not bounces; a puck shoved 0.75 of its size from home gives way and lets it pass over, so a drag never plows a row; every puck's spring home is critically damped, so it slides back without a wobble), and where it is let go it stays, taking the home nearest it while the others move one home along to make room, each gliding straight there (0.3–0.6 s by distance, easing out, no bounce) (for that visit; every reader first sees the admin's order), and choosing one gives it an iris rim inside the lavender ring and a warm flood from it (300 ms); the field runs only while it is on screen and something is still warm or moving, and under reduced motion, or on a phone with more than eight projects, it is a still grid on a still field; the chosen project's panel, browser frame and description side by side, enters with the 8 px rise; a live check sends a strike of lightning along the frame's address bar from the address to its end (360 ms, uncovered left to right, iris over a blush echo), holding there for as long as the request is out, once for every project the first time the section is in view and then whenever the reader presses the bar; when the answer arrives the strike fades (200 ms) and the time lands at the bar's end beside a bolt; the pucks carry no times; under the section's lead one sentence says how many sites are being checked and then how many answered and in how long on average, and its bolt flashes once in blush when the last answer arrives (260 ms); when its answer arrives the open frame's screenshot is revealed from the top down, as a page loads (480 ms); the project's stack is shown one technology at a time, each held 1.6 s and then replaced through an electric jolt (the text jitters and splits into iris and blush, the bolt flickers, 260 ms), round the whole stack and again, crackling between jolts (the name shivers 1 px and the bolt dips, 120 ms, at an irregular 0.5–0.9 s): the site's one loop, allowed only because it runs for the open project alone, while it is on screen and the page is visible, stops while the pointer rests anywhere on its row or keyboard focus is on its controls (where a click on the name, or on the next control beside it, steps to the next technology with the same jolt, and after such a step it stays put for 5 s once the pointer leaves, or after a tap, so what was stepped to can be read), and is replaced by the whole stack as one still line under reduced motion; the newest piece from the workshop types its title out once, letter by letter (40 ms a letter, 1.2 s at most), the first time it is well in view, behind an iris cursor that goes when it is done, its full title laid out from the start so nothing moves; the contact graph's hub fades and grows in (400 ms) the first time it is in view; below xl each edge then draws out from it in turn (700 ms, 180 ms apart) and its node fades and rises 8 px in as the edge lands, once; from xl up the graph runs on the page's circuit: each time the current closes the circuit at the hub the edges draw out (700 ms, 180 ms apart) and each node fades and rises 8 px in as its edge lands (500 ms); as soon as the reader scrolls back up from the foot of the page the circuit opens and the graph switches off, the reverse and quicker: the nodes fade and sink 8 px, the last first (200 ms, 60 ms apart), then the edges draw back into the hub, the last first (400 ms, 60 ms apart); keyboard focus on a node shows the graph at once, without the stagger, and brightens the hub's ring; pointing at or focusing a node lights its edge in iris and sends one short iris spark along it from the hub to the node (560 ms, linear, as current runs); while it is shown, the graph's edges wave gently, each bending at most 7 px at its middle on its own period (3.6, 4.3 and 5 s), and each edge carries its own current: a spark, iris over a blush echo, runs out along it at an irregular 0.7–1.3 s (560 ms) while the edge shivers by up to 3 px (300 ms): the site's second loop, allowed because it runs only while the graph is on screen and the page is visible, and stays still under reduced motion; each link to a sibling page plays that page's signature in miniature on hover or focus (500 ms); from 1280 px up, one wire runs down the left margin from the theorem past each section's number into the contact graph's hub, and current (iris over a blush echo) fills it with the reader's own scroll, easing after the reading line (80 ms) and opening still where the reader is, while, as it moves, the lit wire charges like a battery (bands of white light in a blush glow run down it into the tip, always faster than the current, inside an iris aura that breathes over 1.4 s; no filters or masks) and fades 0.5 s after the reader stops, a number's dot lighting as it passes and the hub's ring brightening when the page is read to the end: scroll-linked, never moving on its own, drawn lit and still under reduced motion.
- With `prefers-reduced-motion`, remove movement and animated scrolling while keeping all content visible. The same applies when JavaScript is unavailable.

## Recommended portfolio structure

1. Hero: what Dawid does and a direct route to projects or contact.
2. Selected projects: 3–4 real projects, ordered by importance and explained as problem → role → solution → verified result.
3. Scope of work: backend, user-facing software, and AI engineering.
4. Research: doctoral work on heat kernels; quantum algorithms and LLM research remain interests until specific work is supplied.
5. Student resources: courses, materials, and organisational information.
6. About and contact: a concise profile, selected links, and a simple contact path.

## Changes in 5.1

Nothing about the mark, the typography, the spacing scale, the layout grid, the motifs or the motion spec changed in this revision. Implementations tokenised against version 5 need no retokenising beyond one colour.

- `control-border` moved from `#8B91A0` to `#848A9A`. The old value measured 2.997:1 against `background`, which misses the 3:1 that WCAG 1.4.11 requires of a control boundary; it passed only on `surface`. The new value clears both.
- The `symbol/` masters moved from a 100 × 100 canvas to 104 × 104. The artwork itself is untouched — same path data, same stroke, same proportions — but it had been sitting 2.25 units left and 2.5 units above centre, with only 9.25 units of clear space on the left against the 13.5 the kit requires. Anything that cropped the file to a square or a circle cropped it off-centre.
- The mark inside `favicon/favicon.svg` was centred in its tile; it had been 8 units from the left edge and 12 from the right.
- The actionable-card elevation is named `lift`. Under its previous name it collided with the `card` colour token, so it had been rendering as a white shadow on a near-white page and the hover lift the kit asks for never appeared.
- The kit has a voice section, which it had never had. For a personal brand that was the largest gap in it: the mark and the palette are a third of the identity and the writing is the rest.
- The positioning line is now the one the site already leads with, “Mathematician by training. Engineer by trade.”, in place of the hedged suggestion carried since version 1.
- Elevation, an icon specification, the radius scale, the column gutter, the breakpoints and the heading tracking values are now written down. All six were already decided in the implementation and simply undocumented, so these entries record existing practice rather than changing it.


## Changes in 5.2

- A dark theme, Night Ink: a dark value for every palette token, the theme control and its behaviour, and the rules for marks, captures, paper and the heat field (see Dark theme). `palette.json` gains a `dark` object, and `brand-tokens.css` a `[data-theme="dark"]` block.
- Elevation: shadows are cast in a new `shadow` token instead of `ink`, so the dark theme can cast them in near-black.
- `mini-brand-sheet` still shows the light palette only.
- Motion: from xl up the contact graph runs on the page's circuit, shown while it is closed and switched off while it is open (see Motion, Home).
- Typography: the group label inside a section, and the stage heading set like it in ink, are written down (see Typography); the site had three versions of the label.
- Fonts: IBM Plex Mono Medium joins the Regular, as WOFF2 with the Regular's character set, so the 500 the labels use is the real cut.

## Scope and limitations

This kit defines an art direction and implementation baseline, not a finished website. The reference sheet contains representative samples rather than fictional projects or results. Final project names, evidence, contact details, and site languages still need real content.

Semantic success or error colours are not defined in this version. They should be added when the actual interface and form requirements are known.

## Fonts and licences

The bundled Manrope and IBM Plex Mono files may be redistributed under the licence texts included in `fonts/`. Keep those licence files with the font files when sharing the complete kit.
