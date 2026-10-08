# Dawid Hanrahan Visual Identity Kit

Version 5.1 · Binary Axis mark · 24 September 2026

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

| Token | Value | Primary use |
| --- | --- | --- |
| `background` | `#F8F9FC` | Main page background |
| `surface` | `#FFFFFF` | Cards, menus, and fields |
| `ink` | `#17233D` | Headings, body text, and primary actions |
| `text-secondary` | `#566078` | Supporting copy and metadata |
| `lavender` | `#E8E1FA` | Visualisation and feature-section backgrounds |
| `blush` | `#F6E2EB` | Secondary accent and illustration |
| `iris` | `#65509A` | Links, focus, and active states |
| `border` | `#E0E3EB` | Decorative dividers and card outlines |
| `control-border` | `#848A9A` | Form and secondary-control boundaries |
| `primary-hover` | `#293A5C` | Primary-action hover state |

As a general composition guide, use approximately 75% light neutrals, 20% pastels, and 5% navy or strong accents. Use white on navy or iris and navy on pastel surfaces. Pastels are backgrounds, not colours for small text. A pale border must never be the only indication that a control is interactive.

`control-border` is the one value here chosen against a measurement rather than by eye. A control boundary must reach 3:1 against the surface behind it (WCAG 1.4.11), and most controls sit on `background`, not on `surface`. `#848A9A` reaches 3.28:1 on `background` and 3.45:1 on `surface`. Do not lighten it. `border` is decorative only — at 1.28:1 on white it carries no information, which is exactly why a control may never rely on it alone.

## Typography

- **Manrope** is the primary typeface for headings, body copy, and interface text. Use 400 for body copy, 500 for navigation, 600 for headings, and 700 sparingly.
- **IBM Plex Mono** is reserved for technologies, dates, short labels, and code-like details. Use weights 400–500.
- Fallback stacks: `system-ui, sans-serif` and `ui-monospace, monospace`.
- Keep body copy to approximately 55–70 characters per line.
- Tracking: −0.035em on hero and section headings, −0.02em on card headings, 0 on body copy, and +0.1em on mono labels set in capitals.

Suggested responsive scale, desktop → mobile: hero 64/70 → 36/41 px (a masthead hero that shares the first screen with content, as on the home page, 48/52 → 36/41 px), section heading 40/48 → 28/34 px, card heading 24/31 → 22/29 px, body 18/29 → 16/26 px, and metadata 13/20 px.

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
- Keyboard focus uses a visible 2 px iris outline with a 3 px offset.
- Radius scale: 2 px for motif modules, 12 px for buttons and controls, 20 px for cards and panels. There is no fourth value.
- Project cards use a white surface, a 20 px radius, and a subtle outline. Motion or elevation should imply interactivity only when the whole card is actionable.
- Form errors must be described in words; colour cannot be the only signal.

## Elevation

Shadows are cast in `ink` at low alpha, never in neutral black. A grey shadow over this palette reads as dirt rather than depth.

| Token | Value | Use |
| --- | --- | --- |
| `lift` | `0 8px 24px -12px ink / 0.25` | An actionable card, on hover |
| `float` | `0 12px 32px -12px ink / 0.5` | A control that floats over the page, such as the chat launcher |
| `press` | `inset 0 1px 3px 0 ink / 0.14` | A control held in a pressed or chosen state, such as the selected project in a list or a check while its request is out; it keeps its `control-border` edge |

Name the card elevation `lift`, not `card`. In a Tailwind theme a shadow key that collides with a colour key is read as a shadow-*colour* utility, which silently renders the lift in white on a near-white page.

Menus, dialogs, popovers and toasts keep the conventional four-step ramp, re-tinted to ink so borrowed components do not import a foreign grey: `sm` `0 1px 2px 0 / 0.06`, `md` `0 4px 6px -1px / 0.10`, `lg` `0 10px 15px -3px / 0.12`, `xl` `0 20px 25px -5px / 0.14`.

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
  - Experience: the company circles enter from the nearer side of the screen on arrival (900 ms, 90 ms apart), then follow the scroll into the sidebar beside the skills, and back; choosing a company circle swells its iris halo three times (500 ms each) and then rests.
  - Education: the degrees' road arrives once, the first time it is well in view: the chosen degree's card rises in first (400 ms, from 200 ms), and beside it the road is uncovered from the bachelor's stop down to the doctorate's at a walking pace (linear, 450 ms a stop), each stop's drawing drawing itself and its name rising 8 px in as the road reaches it; below lg, choosing a stop scrolls it back to the top (not smoothly under reduced motion); a degree the reader chooses after that brings its card in with the section entrance; heat spreads over a degree's drawn shape once it is drawn, and again wherever the reader presses it; the teaching notes are stuck up as they scroll into view, and back.
  - Workshop: on the index, pointing at or focusing a piece lights the one mark in its exhibit that carries its result (the chosen bar, the limit of the identity, the edges of the delay band), 200 ms, and takes it away again.
  - Research: the grokking chart draws its new-examples lines when the reader checks a guess (2.8 s); the publications are filed onto the stack once (each sheet falls 40 px over 460 ms, 160 ms apart, then the stamp is pressed down).
  - Every page: the menu bar is a heat field that spreads from both ends once when a page opens (2.4 s) and then rests; a mouse over it adds heat where it passes: each source is sized by the bar's height (born at 0.4 of it, spreading to about 1.5 heights over 3.8 s), the bar's top and bottom edges are insulated, and the peak (0.3) keeps every link at 4.5:1.
  - Home: the pressed well slides along the strip of project tabs to the chosen one (300 ms) and its panel, browser frame and description side by side, enters with the 8 px rise; a live check sends a strike of lightning along the frame's address bar from the address to its end (360 ms, uncovered left to right, iris over a blush echo), holding there for as long as the request is out, once for every project the first time the section is in view and then whenever the reader presses the bar; when the answer arrives the strike fades (200 ms) and the time lands at the bar's end beside a bolt; the project tabs carry no times, so none changes width; under the section's lead one sentence says how many sites are being checked and then how many answered and in how long on average, and its bolt flashes once in blush when the last answer arrives (260 ms); when its answer arrives the open frame's screenshot is revealed from the top down, as a page loads (480 ms); the project's stack is shown one technology at a time, each held 1.6 s and then replaced through an electric jolt (the text jitters and splits into iris and blush, the bolt flickers, 260 ms), round the whole stack and again, crackling between jolts (the name shivers 1 px and the bolt dips, 120 ms, at an irregular 0.5–0.9 s): the site's one loop, allowed only because it runs for the open project alone, while it is on screen and the page is visible, stops while the pointer rests on it (where a click, or the next control beside it, steps to the next technology with the same jolt), and is replaced by the whole stack as one still line under reduced motion; the newest piece from the workshop types its title out once, letter by letter (40 ms a letter, 1.2 s at most), the first time it is well in view, behind an iris cursor that goes when it is done, its full title laid out from the start so nothing moves; the contact graph's hub fades and grows in (400 ms) the first time it is in view; below xl each edge then draws out from it in turn (700 ms, 180 ms apart) and its node fades and rises 8 px in as the edge lands, once; from xl up the graph runs on the page's circuit: each time the current closes the circuit at the hub the edges draw out (700 ms, 180 ms apart) and each node fades and rises 8 px in as its edge lands (500 ms); as soon as the reader scrolls back up from the foot of the page the circuit opens and the graph switches off, the reverse and quicker: the nodes fade and sink 8 px, the last first (200 ms, 60 ms apart), then the edges draw back into the hub, the last first (400 ms, 60 ms apart); keyboard focus on a node shows the graph at once, without the stagger, and brightens the hub's ring; pointing at or focusing a node lights its edge in iris and sends one short iris spark along it from the hub to the node (560 ms, linear, as current runs); while it is shown, the graph's edges wave gently, each bending at most 7 px at its middle on its own period (3.6, 4.3 and 5 s), and each edge carries its own current: a spark, iris over a blush echo, runs out along it at an irregular 0.7–1.3 s (560 ms) while the edge shivers by up to 3 px (300 ms): the site's second loop, allowed because it runs only while the graph is on screen and the page is visible, and stays still under reduced motion; each link to a sibling page plays that page's signature in miniature on hover or focus (500 ms); from 1280 px up, one wire runs down the left margin from the theorem past each section's number into the contact graph's hub, and current (iris over a blush echo) fills it with the reader's own scroll, easing after the reading line (80 ms) and opening still where the reader is, while, as it moves, the lit wire charges like a battery (bands of white light in a blush glow run down it into the tip, always faster than the current, inside an iris aura that breathes over 1.4 s; no filters or masks) and fades 0.5 s after the reader stops, a number's dot lighting as it passes and the hub's ring brightening when the page is read to the end: scroll-linked, never moving on its own, drawn lit and still under reduced motion.
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


## Changes since 5.1

- Motion: from xl up the contact graph runs on the page's circuit, shown while it is closed and switched off while it is open (see Motion, Home).

## Scope and limitations

This kit defines an art direction and implementation baseline, not a finished website. The reference sheet contains representative samples rather than fictional projects or results. Final project names, evidence, contact details, and site languages still need real content.

Dark mode and semantic success or error colours are not defined in this version. They should be added when the actual interface and form requirements are known.

## Fonts and licences

The bundled Manrope and IBM Plex Mono files may be redistributed under the licence texts included in `fonts/`. Keep those licence files with the font files when sharing the complete kit.
