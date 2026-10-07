---
title: AdLume
slug: adlume
period: 2025-03 – 2026-08
status: pre-launch
role: "Co-founder and AI specialist in a three-person founding team; built Lumy, the AI agent for Google Ads accounts"
context: "Commercial: a startup Dawid co-founded"
stack: Python, Django, Celery, PostgreSQL, Redis, LangGraph, Pipedream, Railway, Google Cloud
demo: https://adlume.co
repository: private
summary: Lumy by AdLume is an AI assistant for people running paid ad campaigns. It works as a Slack app and connects to Google Ads or Meta Ads accounts to create campaigns and monitor them continuously. It makes changes on its own, or proposes them in Slack and asks for approval. Lumy managed around 30 Google Ads accounts, and more than 750 people are now on the waitlist.
---

# AdLume

## Period and status

- Dawid worked on AdLume from March 2025 to August 2026, when he left the team. The repository is private, so the commit history cannot be shown.
- Dawid worked on an earlier version of the product. The current version is newer and reuses some of the parts he built.
- The terms and privacy policy took effect on 25 June 2026. They were last updated on 29 September 2026.
- Status: pre-launch. The site says AdLume is "opening its doors soon" and asks visitors to join a waitlist. People on the list get early access and founding-member pricing.
- adlume.co is live. It has a home page, a blog of 47 posts (the latest dated 11 September 2026) and the legal pages.
- No launch date is known. Dawid expects it to launch one day.

## Role and context

- AdLume had three co-founders: a CEO who also led marketing, a CTO, and Dawid.
- Dawid was a co-founder and the AI specialist. He was responsible for building Lumy, the AI agent that works on Google Ads accounts.
- It is a commercial project. The site names a sole trader registered in Poland and doing business as AdLume as the operator and data controller.

## Short summary

Lumy by AdLume connects to a Google Ads or Meta Ads account through the provider's own sign-in, so no password is shared. It checks the campaigns, including on a schedule, without changing anything. It posts proposed fixes in Slack and makes them one at a time, each only after the user approves it. It is for people who run paid ads. Pre-launch, with a waitlist.

## Problem

People who run campaigns on Google Ads or Meta Ads work through a list of fixes in the ad dashboard and make each one by hand. That is how the AdLume site frames the problem.

The terms cover individuals and people acting for a company, agency or client. The blog writes for performance marketers, agencies, and B2B and e-commerce teams. The team first aimed at agencies, then decided that end customers were the better fit.

The sources give no measure of how big the problem is.

## How it works for the user

The steps below describe the current version, as presented on the site and in the legal pages.

1. The user joins the waitlist.
2. They add Lumy to Slack. Lumy works with you there.
3. They connect a Google Ads or Meta Ads account by signing in with the provider and granting permission. No password is shared. A Meta account connects either through a third-party connector, which existing customers use, or directly. The direct connection is still being tested.
4. Lumy checks the campaigns, also on a schedule. Checks only read data.
5. Lumy posts a proposed fix in Slack.
6. The user approves each change separately, and only then does Lumy make it. Agreeing to a general scope does not approve future changes in advance. The privacy policy still mentions turning on certain types of change in permission settings. In the version Dawid worked on, users could indeed turn on whole types of change in advance.
7. On the direct Meta connection, the only change available is pausing or resuming a campaign.
8. Lumy sends a link in Slack to a web panel. Its settings include "Delete everything", which cancels the plan, revokes Google access, deletes the workspace data and removes Lumy from Slack.

Pricing in the terms, for an invited private beta:

- the first eligible ad account gets one free audit;
- after that, $10 buys 7 days, and the full $10 becomes a balance for AI usage, with no markup;
- an optional plan costs $49 a month;
- there is a 30-day money-back guarantee.

## Technical description

Two versions need to be kept apart: the one Dawid built, and the current one described in the privacy policy of 29 September 2026. The current version is newer and reuses some parts of Dawid's.

**The version Dawid built**

- **Backend:** Django with PostgreSQL. Redis and Celery handled background work.
- **AI agent:** Lumy was built on LangGraph, one of the project's key frameworks.
- **Other tools:** the project also used Pipedream.
- **How a request travels:**
  1. A Slack message arrives at the layer that takes in outside traffic.
  2. That layer creates a Celery task.
  3. A worker picks the task off the queue and starts the LangGraph processing.
  4. A first node handles simple checks, such as whether the question is on topic.
  5. If the conditions are met, a "brain" node takes over, with tools and sub-agents at its disposal.
  6. The response is built, and the outbound layer sends it to the right provider, such as Slack. Other providers were supported too.
- **Hosting:** production on Railway, staging on a virtual machine on Google Cloud.

**The current version (privacy policy of 29 September 2026)**

- **Backend, database, logs, transactional email and model inference:** AWS.
- **AI analysis:** Anthropic models through Amazon Bedrock in the EU.
- **Interface:** Slack, for conversation, approvals and notifications.
- **Ad-platform connections:** Google Ads directly, through the provider's OAuth and API. Meta Ads through Windsor.ai, which connects the account, retrieves the data and applies approved changes. A direct Meta connection is in testing.
- **Website, delivery, DNS and security:** Cloudflare.
- **Other providers:** Stripe (payments), MailerLite (email marketing), GA4, PostHog and Meta Pixel (analytics).
- **Data handled:**
  - from ad accounts: campaign names, settings, structure and status, budgets, bids, audiences, keywords, impressions, clicks, spend, conversions and revenue;
  - from Slack: workspace, channel and chat identifiers, plus messages, commands, approvals, files and interaction history.
- **What goes to the model:** prompts, business context, account data and user instructions. The policy says the product does not intentionally send raw credentials, OAuth tokens, API keys or card numbers.
- **Access tokens:** Meta and Google tokens are stored in an access-controlled AWS database, encrypted with AWS Key Management Service.

How checks are scheduled, the data model, and how proposals are stored and audited are not published.

## Engineering decisions

There are no decision records, so no rejected alternatives can be cited. The decisions below are described in the current version's privacy policy. The decisions to require approval for every change, to work only in Slack, and to use Bedrock and Windsor.ai were made without Dawid. The reasoning behind them and the options rejected are not published.

- **A human approves every change.** Each change to a connected account needs its own approval, routine changes included. In Dawid's version, whole types of change could be turned on in advance.
- **Slack instead of a separate dashboard.** The product currently works only in Slack. Dawid's version could also reply through other providers.
- **OAuth instead of passwords.** AdLume does not ask for a Google password. Access is granted and revoked in the provider's own system.
- **AI inference in the EU.** Anthropic models through Amazon Bedrock.
- **Meta through Windsor.ai, Google directly.**
- **No secrets in logs.** The policy commits to not logging raw credentials, OAuth tokens or API keys.

## Running it in production

- **Hosting, Dawid's version:** production on Railway, staging on a virtual machine on Google Cloud.
- **Hosting, current version:** per the privacy policy, the backend, database, logs, email and inference run on AWS, and the website on Cloudflare.
- **Backups (current version):** database data can be restored from backups for 35 days.
- **Application logs (current version):** kept for at most 30 days.
- **Security, as stated in the policy:** encrypted production traffic, access controls on production systems, tokens encrypted with AWS KMS.
- **Users:** the product is not publicly open yet. While Dawid was on the team, Lumy handled around 30 accounts.
- **CI and tests (Dawid's version):** a standard CI/CD pipeline, an evaluation pipeline for Lumy's decision-making and standard end-to-end tests.
- **Deployment (Dawid's version):** automatic. Railway deployed production on its own; staging on the virtual machine was deployed by a script Dawid wrote.
- **Costs (Dawid's version):** around $30 a month for production, plus a few dollars for staging.
- **Incidents:** none while Dawid was on the team.

## Results

- While Dawid was on the team, Lumy handled around 30 accounts. This is his estimate.
- The home page says more than 750 people have joined the waitlist.
- Active users, ad spend managed, number of changes made and uptime are not published.

## Limitations and what's next

- It is not publicly available yet. There is a waitlist, and launch is "soon", with no date set.
- It supports only Google Ads and Meta Ads, and only through Slack. Other channels and integrations "may be added later".
- The direct Meta connection is in testing and can only pause or resume a campaign.
- Revoking access in Google or Meta settings does not delete data AdLume already holds. Deleted data can be restored from backups for 35 days.
- If deletion stops partway, it is finished by hand.
- Dawid does not currently know what AdLume's plans are.
- What Dawid would do differently: design Lumy's architecture another way, with some must-have checks hard-coded instead of left to the model.
