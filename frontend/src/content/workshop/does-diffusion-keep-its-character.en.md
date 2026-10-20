---
title: Does diffusion keep its character?
date: 2026-10-20
format: proof
summary: On stability, discretisation and the next step from a mathematical construction to a testable algorithm.
related: /research
tags: Mathematics, Science, AI
figure: averages
---

What also fascinates me about Tony Stark is something the films show little of: the reasoning that comes before an experiment. Before the next test, you have to decide which relationships matter, which simplifications you can make and where the model might fail.

In mathematics this stage can take up a whole paper.

So it is with the second paper in our series on searching for intelligence in heat. In the [previous piece](/workshop/intelligence-from-heat) I described how diffusion and the multiplication of functions can be built into a construction that approximates the solutions of an equation of physics. Now we ask how its result changes when we change the rule of diffusion, or move from continuous space to a grid.

This is still theoretical research. Its aim is to establish the conditions and limits that will later let us design a computational experiment sensibly.

## Where did the first story end?

In the previous piece I described an idea based on two operations.

The first is diffusion: spreading information through space, much as heat spreads. The second is pointwise multiplication of functions, which lets us combine different pieces of information about the problem.

We showed that suitable compositions of these operations can approximate the solution operator of Darcy’s equation. Among other things, the equation describes flow through a medium of varying permeability. We supply a description of the material and of the sources, and look for the pressure distribution that follows from them.

An interesting mechanism appeared when we compared two orders: multiplying before diffusion and multiplying after it. The difference between the results lets us recover information about how the spatial changes of the two functions interact.

The first paper gave a mathematical construction and an estimate of its error. The parameters came from the proof, not from training on data.

One question remained, though: how strongly does the whole construction depend on the operator it is built on?

## The same formula, a different diffusion

Behind diffusion stands an operator called the generator. It sets the rule by which information spreads.

In the new paper we keep the parameters of the construction, including the diffusion times, the coefficients and the number of iterations. We change the generator and compare the results of the two maps defined in this way.

We consider two cases.

In the first, both operators act on the same space. Their rules of diffusion are close in a precisely defined sense. This can correspond to a change of geometry or of weights.

In the second, we compare continuous space with a regular grid. We assign to each function its averages over the cells, and replace the continuous operator with its discrete counterpart, which links neighbouring nodes.

Intuitively, both questions sound alike: does a small change in the description give a small change in the result?

The analysis shows, however, that they need different arguments.

## Stability has its own requirements

On the same space we measure the size of the perturbation by comparing the energy (Dirichlet) forms of the two operators. They describe the cost of a function’s spatial changes.

For a single diffusion layer we obtain a stability estimate that is uniform in time. This means that passing to a very short time does not make that estimate itself any worse.

The difficulty arises with the operations that combine diffusion and multiplication. In our construction we subtract certain results and then divide the difference by a small time. Estimating each term separately can lose the relationship that keeps the whole expression under control.

So it has to be analysed as a whole.

Under suitable assumptions we show that stability extends to these operations too, and to the full construction approximating the Darcy solution operator. The dependence of the resulting estimate on the required accuracy grows only logarithmically.

This is a result about how sensitive the mathematical map is to a perturbation of the generator. It does not yet settle how the computation behaves in finite precision.

## What does moving to a grid change?

A grid introduces a limitation that no amount of skill in the proof can remove: it does not distinguish all the changes present in a continuous function.

Imagine a wave that makes more than half an oscillation between neighbouring nodes. On the grid, some of these oscillations may vanish, and others may look like slower changes. This is related to aliasing.

On top of that, the discrete operator acts on oscillations close to the limit of resolution differently from the continuous one.

![A wave with five oscillations on a periodic interval and its averages over the cells of a grid; below, how strongly the discrete operator acts on each oscillation compared with the continuous one; a slider changes the grid spacing h](/figure/aliasing "A wave with five oscillations on a periodic interval and its averages over cells of width h. As the cells approach the scale of the oscillations, the averages weaken, then line up into a slower wave. At h = 1/5 each cell holds one whole oscillation and every average is zero. Lower plot: the grid feels fast oscillations more weakly; at the limit of resolution the discrete operator acts on them with about 41% of the continuous operator’s strength. The values are exact, not simulated.")

That is why it is not enough to show that the two operators are close for every fixed, sufficiently regular function. We want to control the error for the whole admissible class of inputs. Such a class may contain functions with ever finer detail.

It is precisely these that reveal the limits of any possible estimate.

## One derivative makes a difference

Let $h$ denote the distance between the nodes of the grid.

An error of order $h$ halves in the estimate when that distance is halved. An error of order $h^2$ falls fourfold.

In the paper we show how this rate depends on the regularity of the input to the first layer of the construction.

If we assume only that the input is in $L^2$, that is, that the square of the function is integrable, we obtain a first-order estimate in the discrete energy norm. For a certain range of parameters we also give examples that attain this order, already in one dimension.

If the input has one weak derivative in $L^2$, we obtain second order. This is a condition that controls spatial changes, and it is much weaker than demanding perfect smoothness.

Between these cases there is an intermediate scale. For regularity described by a parameter $s$, from zero to one, we obtain the rate:

$$h^{1+s}.$$

This result concerns the layer that approximates the inverse of the operator. It explains how the regularity of the data limits the accuracy with which that layer carries over to the grid.

## Where do the later layers get their regularity?

For the whole construction we still need to analyse the subsequent layers, in which we multiply functions.

Here an important property of the scheme comes in: part of the regularity we need follows from the way it is built.

The operation approximating the inverse of the operator smooths the data. We then prove that the states arising during the iteration keep control of two derivatives, in the sense of a suitable Sobolev norm. The estimate does not get worse as the number of iterations grows.

This property lets us apply stronger estimates to the product layers.

Instead of assuming arbitrarily high smoothness of all the intermediate functions, we derive the regularity we need from the construction itself. It is one of the pieces that link the analysis of individual operations to the theorem about their composition.

## Why does multiplication need a proof of its own?

When we pass to cell averages, even multiplication stops behaving in exactly the same way.

The average of a product generally differs from the product of the averages.

Take two sets of values: $1, 3$ and $3, 1$. Each averages $2$, so the product of the averages is $4$. The products of the corresponding values, meanwhile, are $3, 3$, and their average is $3$.

![The values of b, 1 and 3, and of u, 3 and 1, on the two halves of a cell, with their products and averages; a slider changes u](/figure/covariance "The average of the product minus the product of the averages is exactly the covariance: the average of the product of the deviations of b and u from their averages. When u rises where b falls, the difference is negative; when they rise together, positive; when u is constant, it vanishes.")

The difference describes information about the joint changes of the two functions, lost in the averaging.

In the paper we write this error exactly in terms of a covariance. We then combine its estimate with the analysis of the diffusion operators.

Controlling this interaction is an essential part of the new paper. Carrying over the results for the linear layers alone would not be enough to justify the behaviour of the whole scheme.

## What does the main theorem say?

For a fixed accuracy $ε$ of the construction, a suitably regular material coefficient and an input with one derivative, we prove second-order convergence of the grid realisation to the continuous one.

We measure the error in a discrete energy norm, which takes the spatial changes of the result into account.

The main estimate contains the factor:

$$\frac{h^2}{ε}.$$

There is also an explicit condition tying the size of the grid to the scales of the construction. So we cannot raise the required accuracy on its own while leaving the grid as coarse as we like.

Here we compare two realisations of the same mathematical construction. The first paper controlled its distance from the solution operator of the equation. The second controls the additional difference that comes from discretisation.

These are two separate components of the analysis, both needed to assess the algorithm later.

## What brings us closer to the experiment?

On this basis we do not yet know whether the construction will be fast, numerically stable and competitive with classical methods. Theoretical stability under a change of operator is no substitute for an analysis of rounding errors.

The discrete results also concern a specific regular periodic grid and an operator linking nearest neighbours. More general geometries and the practical choice of parameters need further research.

What we do have are better-defined questions for future tests. We know what role the regularity of the input plays, why the product layers need separate control, and how to separate the error of the construction from the error of its discrete realisation.

For me, that is exactly where the value of this stage lies. Before we start measuring computation times and looking at plots, we establish what we should expect, and under what conditions those expectations have a mathematical justification.

There is still some way to go to a testable algorithm. This paper helps to map it more precisely.
