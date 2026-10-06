---
title: Paints, brushes and Mark II
date: 2026-10-06
format: production
summary: Why searching Slip for “farby” (paints) came back empty, and how we went from 49% to 84% of hits with six false alarms.
tags: AI, Engineering
related: /#projects
figure: search
stamp: Trial
---

What I like most in the Tony Stark stories are the workshop scenes. An idea, a prototype, a test. And suddenly a crash into the ceiling. Then a fix and another test. That is engineering without the retouching.

Our story started more modestly: with a phone and a question about paints.

## Farba is not farby

In Slip you can search your receipts with an ordinary sentence. I typed “Farby za ok. 100 zł” (“paints for about 100 zł”) and got an empty result. Yet the database held a receipt on which the till had printed, in black and white: FARBY.

The cause was simple. The model reduced the product name to its base form: “farba”, the singular. The search engine looked for that fragment literally, with no regard for inflection. And the string “farba” does not occur in the word “FARBY”.

The till prints the product name. The model tidies up the language. The search engine compares letters. Each does its own job, and the user gets an empty screen.

## First approach: trimming the endings

The first idea was simplified stemming: shortening words so that different forms share a common fragment. For a word of at least five letters, the search also tried the variant without its last letter. “Farb” found FARBY, and “kurtk” found KURTKI (jackets).

It worked, but each review of the changes turned up new problems. “Kurtka zimowa” (winter jacket) did not find KURTKA ZIMOWE. After the next fix, “sok z” (juice with…) lost its “z” and caught every juice, and “cola 20” lost its number. Every patch needed another one.

I have saved the best example for last: the English “paint”, trimmed to “pain”, found PAIN AU CHOCOLAT.

You ask for paint, you get a croissant.

I closed pull request #144 without merging it. I decided to try a different approach: let the model supply the right word forms, and let the search match them literally.

## Second approach: let the model speak the till’s language

We asked the model to give both the singular and the plural: “farba”, “farby”. For a product with an adjective, it was also to add the noun on its own. So “opony zimowe” (winter tyres) should also produce “opona” and “opony”.

We raised the limit on generated terms from six to ten, so that a question about several products leaves room for their variants.

The first version passed three of five cases. The model still sometimes reduced the plural to the singular. One sentence in the instructions helped: “both forms, never just one”.

Then it turned out that “opony zimowe” came back only as the whole phrase. We added a rule for adjectives.

The final version passed all eleven cases that check it generates the forms we need. The old prompt, run on an earlier set of five cases, passed none. These are results from different sets, so I do not treat them as a direct comparison.

We ran five further cases only after the tuning was finished, with no more changes to the prompt. It was an extra check that the fix also works beyond the examples we refined it on.

## Medicine in the milk

The singular brought a new problem: short words.

“Lek” (medicine) found MLEKO (milk), and “but” (shoe) found BUTELKĘ (bottle). We asked the model to leave out short terms, but in five of 71 cases it ignored that instruction.

A request in a prompt is not yet a guarantee.

So we moved the rule into code: a term of up to three letters must match a whole word on the receipt. That way “lek” is no longer a fragment of “mleko”.

That decision has a cost. “TV” will no longer find TV55UQ7500, because the matching we use treats letters and digits as one word. In that case the full name helps: “telewizor”.

## A duel of numbers

We compared four variants on twelve questions, running each three times against the real model.

One full run covered 36 expected hits, so three repetitions gave 108 chances to find the right line. We also added ten decoy lines, among them MLEKO, PAIN AU CHOCOLAT and POTATO CHIPS.

We prepared the data to look like till printouts. It did not come from real receipts.

| Approach                                      |    Hits (of 108) | False hits |
| --------------------------------------------- | ---------------: | ---------: |
| Old prompt, literal matching                  |     53/108 (49%) |         13 |
| Trimming the endings (#144)                   |     81/108 (75%) |         19 |
| **New prompt and the short-word rule (#145)** | **91/108 (84%)** |      **6** |
| Both approaches together                      |     94/108 (87%) |         12 |

Combining both approaches found three more hits, but doubled the false results compared with #145. In this test I chose the variant with fewer mistakes.

This compares whole solutions. The #145 result includes both the new prompt and the short-word rule in code. I do not credit the whole improvement to the model alone.

## Break it to believe it

This is my favourite part of the work.

We deliberately switched off or broke each mechanism under test and made sure a specific test then failed. That way we knew the test could detect the missing fix.

A green result is nice. A test that turns red exactly when it should convinces me even more.

Finally we went back to the question where it all began. “Farby za ok. 100 zł” produced the variants “farba”, “farby”, “paint”, “paints”, and the receipt with the PAINTS came out right at the top.

The full evaluation covers 71 cases, each run three times, and costs a few cents. A small price for checking that the next version really improves the results.

## Mark III

One problem remains: tills that print without Polish characters, such as ZAROWKA, KRZESLO, PEDZLE. Every approach we compared struggled with them.

The candidate for the next step is the `unaccent` extension in PostgreSQL. First we need to check that it is available in our environment on Railway, then measure whether it helps and what mistakes it might introduce.

From this story I take a simple rule: the model can propose word forms, the code should enforce the rules, and the tests have to check both.

Stark had a workshop, a suit and JARVIS. We started with a receipt for paints. The pattern of the work stays much the same: build, check, fix. And keep the results, so the next version is better.
