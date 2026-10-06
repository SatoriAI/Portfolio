---
title: When a network finds the clock
date: 2026-10-01
format: figure
summary: Grokking, symmetries and the search for rules hidden inside a model.
related: /research
figure: grokking
tags: AI, Science
---

If I had JARVIS, it would soon stop being enough that it gives the right answers. I would want to look under the hood. To find out how it reaches a result, what it has memorised, and whether it can apply a rule it has learned to a new situation.

As a mathematician and an engineer, I have the same curiosity about neural networks. The result on the screen is the start of the conversation. The most interesting question is: what happened inside?

In our project we study the moment when a small transformer, trained on a simple arithmetic task, starts answering correctly on examples outside its training set as well. We look for traces of the mathematical structure that emerges along the way.

The first clue leads to a clock.

## Nothing for a long time, then suddenly it works

Imagine a model that handles the examples used in training perfectly. We show it new cases and its accuracy drops sharply.

We keep training. For a long time the results on new data stay poor. Then, finally, there is a clear improvement, even though the model mastered the training set long before.

This delayed generalisation is called **grokking**. The phenomenon was described by [Power and co-authors](https://arxiv.org/abs/2201.02177), who studied small algorithmic tasks.

It is easy to say that the network has finally “understood”. It is a vivid metaphor, but a researcher needs something more concrete. I want to know what changes in the model's computations accompany the improvement, and whether they can be measured.

That is why, besides the answers, we analyse the activations: the internal values produced while the model processes the data.

## Arithmetic that wraps around

Our task is addition modulo 113.

The model receives two numbers from 0 to 112. It has to add them and return the remainder of the sum divided by 113. For example:

$$110 + 7 ≡ 4 \text{ (mod 113)}.$$

It works like a clock. On an ordinary clock face, after twelve we come back to one. Here there are 113 positions, numbered 0 to 112, and after the last one we come back to zero.

The task is small, but it has a rich structure. Adding one always moves the result on by one position. Adding three moves it by three. Moving by two and then by three is the same as moving by five.

Mathematicians describe this structure as a cyclic group.

The model can fit itself to the particular examples, or it can use the regularities shared by the whole task. What interests us is whether a trace of those regularities appears inside it.

## How numbers turn into rotations

Each position on the clock can be described by an angle. Each number is then assigned a point on a circle, written down using sine and cosine.

Addition becomes rotation.

This is the perspective of Fourier analysis, which describes cyclic signals as waves of different frequencies. We can picture several clocks: one makes a full turn as we pass through all the numbers, another turns several times in the same span.

The link between grokking and computations like these already has a solid precedent. [Nanda and co-authors](https://arxiv.org/abs/2301.05217) reverse-engineered the algorithm learned by the transformers they studied doing modular addition. It used Fourier structure and trigonometric identities.

Our question concerns the geometry of the activations: can we detect operations in them that behave like cyclic shifts? Do those operations compose according to the rule of addition? And do the later layers pass this structure on?

## Looking for the rule of composition

Imagine we have found a transformation of the internal activations that corresponds to adding two to the result. We have also found one that corresponds to adding three.

Now we apply them one after the other. Do we get an effect similar to the single transformation that corresponds to adding five?

That is the heart of our test.

If this agreement holds for all shifts, and holds exactly, we speak of a representation of the group. Operations on numbers then have their counterpart in operations on vectors.

In the network we look for an approximate version. We fit linear transformations of the activations, and then check how they behave on held-out test data.

Two separate questions matter here. First: do the transformations predict the activations for shifted results well? Second: do the transformations themselves satisfy the law of composition as matrices?

A good answer to the first question does not guarantee a good answer to the second.

## I don't want to find a clock just because I drew one

It is easy to fall into a trap when studying structures like these. If we go looking for sine and cosine from the start, we can choose our analysis so that we see exactly sine and cosine.

That is why our main analysis rests on coordinates derived from the activations themselves. We use PCA, a method that finds the directions in which the data varies most. Only in that space do we check whether the cyclic shifts can be recovered.

Separately, we analyse coordinates fitted to the Fourier structure. They give cleaner results, but we treat them as additional evidence, because building them already uses what we know about the expected pattern.

For me this is an important principle: a measuring instrument should let the hypothesis lose.

## What do our experiments show?

In the training runs we have collected, we study a two-layer transformer, a single modulo-113 task and three different random initialisations.

Delayed generalisation occurred in all three runs. Final accuracy on both the training and the test sets was 100%.

The chart shows the gap between mastering the training examples and generalising. The model reaches full accuracy early on the data it learns from. On held-out examples the improvement comes later, even though training continues on the same set.

![Training and test accuracy over three runs, steps 0–6000](/figure/grokking "Accuracy during training on addition modulo 113. The purple lines show test-set results for the three runs, and the grey line shows training accuracy. Measurements were taken every 1,000 steps; the lines join consecutive measurements.")

The chart shows the model's behaviour changing. Analysing the activations lets us ask what accompanies that change.

In the early stages of training, the fitted transformations reproduce the cyclic structure poorly. Around the transition to good generalisation, their behaviour becomes clearly more orderly.

We see the strongest signal in the transformer's second block. Its activations let us predict the effect of shifts, and composing those operations often works well on held-out data.

The strict comparison of the matrices, however, is less clear-cut. The results depend on the training run, where we measure and the dimension of the chosen space. So our current conclusion is: **grokking is accompanied by the emergence of activations that support cyclic dynamics**. The full law of a group representation remains to be tested further.

Interestingly, the last saved state of the model does not always show this structure most cleanly. Sometimes it is clearer close to the transition to generalisation itself. The end of training does not tell the whole story.

## Does the next layer keep the same rule?

Finding structure in one place is only half the work. We also want to know whether the model passes it on.

We compare two paths. In the first, we shift the representation and then move on to the next layer. In the second, we move on first and then apply the corresponding shift in the new space.

If the results are close, both stages follow a consistent rule.

In our measurements, the step from the second block to the final representation keeps this agreement much better than the step from the first block to the second.

This supports a working picture in which the second block organises the cyclic structure and the final stage preserves it. The measurement, however, relies on a fitted linear approximation of the relationship between the representations. It does not describe the layer's full non-linear behaviour exactly.

## Where does mathematics help?

In our notes we show why agreement of shifts between layers should lead to the Fourier components being preserved.

For exact representations of a cyclic group, the error of such a transport can be bounded by the mean error of agreement with the shifts. The intuition is simple: if a map between spaces respects the rotations, it must also respect the structure those rotations determine.

That gives a concrete prediction to test.

There remains, however, the bridge between the theorem and the network. Our fitted operations are approximate, and our measurements concern particular data. We have to account for those errors and run a direct test of the predicted transport.

## What would I like to check next?

The most important question concerns cause. Does the model use the structure we found to compute its answers, or are we only observing a pattern that accompanies a successful solution?

We will need controlled interventions on the activations, comparisons with suitably chosen perturbations, and experiments with other moduli and initialisations. Three runs of a single task are the start of the story.

For now we have a promising observation: better generalisation is accompanied by the emergence of cyclic dynamics, especially clear in the model's later block.

This is exactly the kind of research that fascinates me most. It brings together experiment, geometry and algebra to look inside a working machine.

If I had JARVIS, I would want it to show me this stage too: not just the finished answer, but the traces of the rule it came from. In our small transformer, one of those traces may be a clock.
