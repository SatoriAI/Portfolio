---
title: OpenGrant
slug: opengrant
period: 2025-02 – ongoing (Grant-Smith: 2026-07 – ongoing)
status: live (open-grant.com: live; Grant-Smith: pre-launch)
role: CTO of OpenGrant; solo on Grant-Smith: backend, frontend, AI pipelines, CI, documentation
context: commercial
stack: Python, Django, Celery, PostgreSQL, pgvector, Redis, React, Vue.js, TypeScript, Vite, Tailwind CSS, Google Gemini, LangGraph, LangChain, Google Cloud, Docker, Caddy, Vercel
demo: https://www.open-grant.com
repository: private
summary: OpenGrant helps US research and development companies find federal grants and prepare funding applications. Based on the documents provided, the platform matches a grant to the company. Once the client accepts the proposal, an AI agent writes the application, which is then delivered to the client. The platform has already prepared more than 100 grant applications, processing billions of tokens.
---

# OpenGrant

## Period and status

OpenGrant has three parts:

- **The open-grant.com site.** Live and hosted on Vercel. It offers to find R&D grants and have the OpenGrant team prepare the proposal.
- **Grant Flow.** The older operations app. First commit 1 February 2025; the source code and GitLab CI/CD followed on 17 February 2025, and the latest commit is from 5 August 2026. It still runs in production and does its job, but its UI and UX are poor, which is why a new solution with a proper frontend framework is being built.
- **Grant-Smith.** A rewrite of Grant Flow. First commit 8 July 2026, last commit 30 September 2026, 291 commits on main. The README calls it a Phase 0 rewrite in active development. It is not deployed: there is no staging or production environment.

The rewrite plan is dated 2 June 2026. It replaces the old app piece by piece: Grant Flow stays live until each part has a successor. Grant-Smith is to be deployed as soon as possible, probably around November 2026.

## Role and context

- **OpenGrant is Dawid's own company.** The site's privacy policy names the operator as OpenGrant Inc. Dawid's role there: CTO.
- **Grant-Smith is one person's work.** At least 287 of its 291 commits are Dawid's. The rest are Dependabot dependency bumps and a few commits under another account.
- **What Dawid owned in Grant-Smith:** the backend (Django, DRF), the frontend (React, TypeScript), the AI pipelines, the CI gate and the documentation. He wrote the code with an AI coding assistant and co-wrote the roadmap.
- **The earlier parts** (Grant Flow, the marketing site, a service called Observo) have no git history. Dawid built them on his own; their code was hosted privately.
- **Who the console is for.** Internal operators and trusted members of customer companies. Signup is by invitation only.
- **The open-grant.com site** presents a commercial service run by "the OpenGrant team".

## Short summary

OpenGrant helps US research companies find federal R&D grants and prepare their applications. The public site recommends best-fit programmes from a short project description, with maximum funding for each, and says so when nothing fits. Grant-Smith, an internal console still in development, builds the application from sourced facts and flags every number without a source.

## Problem

**Companies looking for funding.** Research teams and small businesses first have to find grants they qualify for, then write the proposals. The site says 11 federal agencies allocate over $4 billion a year to small-business R&D, and that eligibility depends on the technical field and the agency's mission. That is a market figure, not a product result.

**People preparing applications.** Writing the prose is roughly 20% of the work. The rest is:

- working out what is actually being applied for;
- reconciling source material that contradicts itself;
- establishing which facts are true and where each came from;
- proving the application complies.

The earlier tool was built almost entirely around the 20%. It went straight from "a company" to "a draft answer". It had no step to define the project, nothing for attachments, deadlines or budgets, and no idea of a finished, assembled package.

Grant-Smith exists to prevent one outcome: an application that is beautifully written and confidently wrong. A case from testing: asked what an announcement requires, the AI marked a component as required when the announcement forbids it, and left the prohibition only in a notes field.

## How it works for the user

**The open-grant.com site (public)**

1. The visitor lands on the home page and clicks "Start Eligibility Check".
2. They paste a short project summary, or enter their website and have the summary filled in.
3. They can answer a few context questions. The site notes these do not narrow the results.
4. They get a list of best-fit programmes with maximum funding and categories, and can download the summary as a PDF.
5. If nothing fits, the site says so. They can edit the summary or view low-confidence matches anyway.
6. Next, they can book an expert review through Calendly, or leave an email to receive free one-page outlines for each grant within 2–3 business days.
7. The site also has grant listings, an SBIR explainer, the technology areas covered, an FAQ and a privacy policy.

**The Grant-Smith console (not deployed)**

1. The operator signs in from an invitation. The main sections are Dashboard, Customers, Projects and Grants. Settings has "AI" and "House standards" tabs and a text-size option.
2. The operator keeps customer companies and a shared grant catalogue, and can import grants from CSV.
3. A project is one company going after one grant. It has five stages, and each shows whose turn it is: the system's or the operator's.
   1. **What this application requires** (system). The system reads the announcement and lists what the application must contain, what is forbidden, and where the real rule sits in another document. Where its readings disagree, a person decides.
   2. **What you are claiming** (operator). The operator approves the problem, the aims and the limits on what may be claimed. Nothing further is written until this is approved.
   3. **The evidence, and the facts read out of it** (operator). The operator uploads documents. The system proposes facts one at a time and never records one itself. The operator accepts or discards each.
   4. **The answers** (system). The system drafts an answer to each grant question from the recorded facts and cites them.
   5. **What stands between this and submission** (operator). The system checks the package and lists what it cannot verify. The operator fixes each item or waives it with a reason, and every waiver carries their name.
4. Two decisions always stay with a person: approving the project definition, with the client's actual reply attached as evidence, and waiving a finding at the final check.

## Technical description

**Grant-Smith** is a modular monolith in a single repository. The backend is split into domain apps:

- `customers`: companies, projects, evidence (notes and files), grant-to-customer matching;
- `grants`: the catalogue, announcement ingestion, a separate vector table;
- `claims`: the truth layer: claims, intake, demand, identity;
- `assembly`: deterministic checks and the final gate;
- `generation`: the generation pipeline, built on LangGraph;
- `review`: ingesting reviewer edits, with no model calls;
- `platform`: auth, invitations, worker primitives.

All API code lives in one app, and vendor SDKs are wrapped in a separate module.

**Access.** Server-side sessions and invite-only signup. An invitation either creates a company (the tenant) or joins an existing one. Every view scopes data to the tenant. Operators see all tenants.

**How a request travels.**

1. The React app calls `/api/v1/` through a typed client generated from the OpenAPI schema.
2. Nothing slow runs inside an HTTP request. The API stores a job row and returns 202.
3. A worker claims the row with `SELECT … FOR UPDATE SKIP LOCKED`, runs the job and writes the result.
4. The browser polls for status. The status in the database is the only source of truth.
5. There are four workers, one per queue: generation, document intake, announcement ingestion and assembly.

**Key mechanisms.**

- **Reading the announcement:** three independent model passes look for requirements, prohibitions and references to other documents. A deterministic comparison flags conflicts for a person.
- **Facts from documents:** every quote must be a verbatim excerpt of its source, or the candidate is dropped.
- **Verification:** thirteen deterministic checks.
- **Grant matching:** the company's capability profile, a hard filter, vector recall in pgvector, then a model judging a bounded set of candidates. The result is saved in one atomic write.
- **Generation:** answer mode checks itself with a model. Document mode writes references such as `{{fact:47}}` instead of numbers. The value is filled in at render time; an unresolved reference shows as `[GAP: …]` and the final gate refuses it. The order is: a guard against overwriting a newer human edit, a draft, a deterministic check, at most two refinements.

**Stack, and why each part is there.**

- Python 3.13, Django 5, DRF, drf-spectacular: the API and its OpenAPI schema.
- PostgreSQL 17 with pgvector: data, and vector recall for matching.
- Google Gemini (`gemini-2.5-pro` for generation, `gemini-2.5-flash` for judging and extraction, `gemini-embedding-001` for embeddings). Every call goes through one module that handles timeouts, checks the response shape and logs one line.
- LangGraph with a Postgres checkpointer: the generation pipeline only.
- pypdf, python-docx, WeasyPrint, crawl4ai: reading documents, rendering output, scraping websites.
- React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query: a separate frontend app, chosen because HTMX in the old version limited the interface. The generated OpenAPI client keeps frontend and backend in step at build time.
- Files: local disk in development, Google Cloud Storage with signed URLs as the target.

**Grant Flow** (the older version): Django 5.1, PostgreSQL, Celery, Redis, Daphne, Gemini, Google Cloud Storage and a server-rendered interface. **The marketing site** is served by Vercel. It is built from the `grant-land` folder, a Vue 3 app: GitLab CI deploys its master branch to Vercel production. The Observo service is the site's backend for website prefill and programme matching.

## Engineering decisions

- **A modular monolith, not microservices.** The problem was coupling in the code, not distribution. Splitting would have spread duplication across network boundaries and turned one transaction into distributed ones, at an operating cost one developer cannot carry. The plan replaced an earlier microservices proposal.
- **A gradual migration, not a big-bang rewrite.** The old app stays live until its parts have successors.
- **Sessions, not JWT.** Sessions are server-side and revocable. Refresh-token rotation was judged premature.
- **The database as the job queue, no Celery.** The old app used Celery and Redis, and the plan proposed keeping them. Grant-Smith uses `SKIP LOCKED` instead, and each worker is a short command. Celery was dropped because the jobs are meant to run as Kubernetes Jobs.
- **Each job runs at most once, with no automatic retry.** Every queue does paid model work with side effects. A retry costs money and can duplicate writes. A failed job records its error and category, and a person re-queues it. The final status is written conditionally, so a job marked as stalled cannot later turn into a success. A heartbeat was rejected: the slowest step, one generation call, has no point at which to send one.
- **Demand scoring only reorders the queue.** The first version filtered. On a live run it took operator decisions from 410 to 0 and hid 100% of the answer-key facts, so it was removed. The rule: a machine may change the order of what a person looks at, but may not take anything away from them.
- **What the system deliberately does not do.** It does not score operators' diligence. There is no bulk accept, because that would be exactly the rubber-stamping the instrumentation is meant to detect. Tests pin some of these refusals.
- **A strict verbatim-quote check.** A wildcard for the U+FFFD replacement character was built, measured and removed. It recovered no figures, because models rebuild the missing character rather than copy it. Values containing U+FFFD are refused; one run had 63 of them.
- **One shared Gemini client.** On a cold start, 7 of 8 threads failed with "client has been closed". The garbage collector was cleaning up an unreferenced client, and `lru_cache` built several clients under concurrent calls. The client is now a module global built under a lock, pinned by a test.
- **Queries moved out of a loop.** A contradiction check ran 1,601 queries in 4.9 s for 400 claims. It now runs 3 queries regardless of size and takes 0.71 s.
- **Capped lists report their true size.** A response carries the list, a count computed in the database and a truncation flag. The matches response was 452 KB and polled every 2 s. While a job runs, it is now 368 bytes.
- **A blocked delete returns 409, not 500**, with a message the operator can act on.
- **The text-chunk limit is enforced and reported.** A 297 KB file with no blank lines became one 296,628-character chunk and was silently skipped. The limit now holds, and every hard split is counted.
- **LangGraph for generation only.** A deliberate exception to the no-framework rule. The other AI tasks follow one plain module pattern.
- **Production hardening behind one setting.** By default, `SECURE_HTTPS` is on whenever debug mode is off.

## Running it in production

**Grant-Smith** is not deployed. Files are meant to go to Google Cloud Storage. Deployment: as soon as possible, probably around November 2026. Host: Google Kubernetes Engine. Its code lives in a single private repository.

- **CI:** GitHub Actions runs a gate (static checks, frontend, tests against Postgres with pgvector, a schema-drift check) and a second workflow with the pre-commit hooks. Both call the same Makefile targets as the local pre-push hook. CI has no Gemini key, so a branch from a fork cannot spend money.
- **A known trap:** matching is slow, about 25 judge calls and about 4 minutes. The stall limit and any server timeout must stay above that.

**Grant Flow** (as of the plan date): the database on Cloud SQL; the app, Celery and Redis on one Google Compute Engine VM via docker-compose; TLS through Caddy; logs in GCP. The plan calls that VM a single point of failure with no autoscaling. Dollar costs were not tracked, and there was no telemetry for error rates or model-call latency and cost. Grant Flow still runs in production and does its job.

**The open-grant.com site** runs on Vercel and uses Google Analytics.

**Costs:** roughly $100 a month. **Monitoring:** Better Stack.

## Results

- **Applications:** probably around 100 applications have been submitted through OpenGrant. Whether any has won is not yet known, as many are still being evaluated.
- **The open-grant.com site:** the sources give no figures for users, assessments, conversions or uptime.
- **Grant-Smith:** not deployed, so no users or production figures.
- **Internal validation:**
  - On 6 August 2026 the three announcement-reading passes ran on a public NIH announcement (PA-27-100). The prohibitions pass found 68 exclusions, including the one that had cost an earlier, hand-built application two documents. The test is recorded as a pass.
  - The same test showed the cross-reference pass returning 136 results, too many to act on.
  - At one point the backend had 354 passing tests and the frontend 44.
- **Grant catalogue:** the earlier tool held around 1,800 opportunities from public sources. The site uses them.

## Limitations and what's next

**Limitations**

- Grant-Smith has no staging or production environment.
- A failed job waits for a person to read the error and start it again.
- Facts worded differently can be missed. Matching them is about 85% reliable at best, so the system must never claim completeness. Two conflicting accuracy figures for one model were stored side by side without a warning. A contradiction inside a single document never reaches the operator.
- The cross-reference pass returns too many results and needs tightening.
- What makes a proposal win is still unknown. The roadmap says only a live build will answer it.

**What's next**

- **Phase P10, "autonomy on the rails":** the system proposes and the operator accepts. Every document in the package is drafted in dependency order and checked against the others. How often operators accept proposals is measured. The first step, turning client documents into proposed facts, is built.
- **A first real application** with a real deadline, not a demo. It has not happened yet: Grant-Smith has not run on a real application so far.
- **Approved designs, not yet built:** `docs/ai-pipeline-hub.md` (the AI pipeline hub) and `docs/grant-extraction-pipeline.md`. The `SKIP LOCKED` worker queue, also described in the first of them, is already in the code.

**Deliberately out of scope:** making the client a user of the system, blocking instead of flagging, automatic approvals or waivers, and a model deciding eligibility or novelty.
