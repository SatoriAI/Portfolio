# Project documents

One Markdown file per project per language: `<slug>.pl.md` and `<slug>.en.md`
(for example `slip.pl.md`, `slip.en.md`). The short summary is what the home
page shows; the whole document is what Vex answers from.

Write only what is true and can be checked. Where a fact is not known yet,
leave `[DO UZUPEŁNIENIA]` (PL) or `[TO FILL IN]` (EN) rather than guessing.

## Header

Every file opens with these fields between `---` lines. They are read
directly by the site and by Vex, so they stay out of the prose.

```markdown
---
title: Slip
slug: slip
period: 2026-07 – ongoing # started – launched/ended, or "ongoing"
status: live # live | pre-launch | archived
role: [DO UZUPEŁNIENIA] # e.g. solo: design, backend, frontend, deployment
context: [DO UZUPEŁNIENIA] # personal | commercial | for a client
stack: Python, Django, PostgreSQL, React, TypeScript, OpenAI, Railway
demo: https://slip.today
repository: private # a URL, or "private"
summary: … # home page text: PL 350–368, EN 362–380 characters (7 lines)
---
```

## Sections

In this order, each as a `##` heading. A section with nothing true to say yet
keeps its heading and says so in one line.

1. **Title** — the `#` heading, the project's name.
2. **Period and status** — when it started, when it launched, whether it is
   live, pre-launch or archived.
3. **Role and context** — solo or team, what Dawid owned, and whether it is
   personal, commercial or for a client.
4. **Short summary** — the same text as `summary` in the header: what it is,
   for whom, and what it does for the user. Length, including spaces:
   350–368 characters in Polish and 362–380 in English. English needs more
   characters than Polish to fill the same lines. The measure is 7 lines in
   the 429px column beside the project's screenshot, at 16px Inter: the 7th
   line at least half full and no 8th line. The bands are a guide; the page
   decides, since long words wrap early. Check each summary on the home page
   at 1440px, so the columns line up.
5. **Problem** — what was wrong or missing, and for whom, before this existed.
6. **How it works for the user** — the experience step by step, from the
   user's side, without implementation terms.
7. **Technical description** — the architecture: components, data, how a
   request travels, the stack and why each part is there.
8. **Engineering decisions** — what was chosen, what was rejected, and why:
   specific decisions with their trade-offs, not general good practice.
9. **Running it in production** — hosting, deployment, monitoring, costs,
   incidents, and what operating it taught.
10. **Results** — anything checkable: users, volumes, uptime, outcomes. If
    there is nothing measurable yet, say so.
11. **Limitations and what's next** — the honest gaps, and what would be done
    differently or next.
