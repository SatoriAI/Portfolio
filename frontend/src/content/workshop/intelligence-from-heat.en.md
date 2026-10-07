---
title: Can intelligence be built from heat?
date: 2026-10-03
format: proof
summary: From heat kernels to the mathematical foundations of models that solve the equations of physics.
related: /research
tags: Mathematics, Science, AI
figure: heat
---

What fascinates me most about Tony Stark is the moment an idea starts to work. First there is a question, then a model, the calculations, a prototype. In the end something that existed only in the imagination a moment earlier becomes a device.

As a mathematician, researcher and engineer, I like to look for such moments in science too. Especially where classical mathematics meets modern technology.

Lately that place turned out to be the heat equation.

It is hard to think of a more familiar process: a hot object cools down, the temperature evens out, a local difference gradually affects its surroundings. But behind this simple picture is a tool for describing how information flows through space.

Our question was: **can diffusion and a few simple operations be built into a model that reproduces the solutions of a more complex physical equation?**

## Heat as a way of passing on information

Imagine a metal plate heated at a single point. After a moment the heat reaches the neighbouring places. Then it spreads further, and the initial temperature distribution becomes smoother and smoother.

The heat kernel describes how heating one place at the start affects the temperature at another place after a given time. Knowing it, we can work out how the whole temperature distribution evolves.

We can also look at this process more broadly. Instead of temperature, take any function: a signal, a measured field or information written on a surface. Diffusion will spread it according to the geometry of the space.

A short diffusion time captures the local neighbourhood. A longer one connects information from more distant regions. Time becomes a dial that sets the scale at which we look at the data.

That is an interesting starting point for designing models. Diffusion-based operations already appear in learning on surfaces, for example in the [DiffusionNet](https://arxiv.org/abs/2012.00888) architecture.

What interested me, though, was a more basic question: what can such a set of operations represent, and how exactly can that be justified?

## From a single answer to the whole rule

In a physical simulation we often know the properties of the material, the sources acting in the system and the equation that links them. We look for the answer: a distribution of temperature, pressure or displacement.

When we change the material or the forcing, we need a new solution.

I would like a tool that reproduces the whole relationship between the description of a problem and its solution. Mathematically, such a relationship is an operator: it takes functions and returns a function.

This is the direction in which the theory of neural operators is developing. Their task is to learn mappings between spaces of functions, in particular the relationships that come from the equations of physics. It is the perspective set out in the work of [Kovachki and co-authors](https://www.jmlr.org/papers/v24/21-1524.html).

In our work we focused on the mathematical capabilities of a specific set of building blocks. We gave the construction diffusion with respect to one fixed reference operator, pointwise multiplication of functions, and simple combinations of these operations.

We determined the parameters by mathematical analysis. At this stage we did not train anything.

## The problem: the material is not the same everywhere

Our point of reference was Darcy’s equation:

$$−\text{div}(a∇u) = f.$$

Although the notation may look technical, its meaning is approachable. The function $a$ describes a local property of the material, for example permeability. The function $f$ gives the sources and sinks. The unknown $u$ can be read as pressure.

The difficulty comes from the material behaving differently in different places. One part lets fluid through easily, another resists it more. The solution has to account for this whole distribution.

Our diffusion, meanwhile, uses a fixed reference operator. On its own it does not adapt to each new map of the material.

We need a mechanism that combines information about the material with information about the current approximation of the solution. In the equation this shows up as the interaction of their spatial changes — the dot product of the gradients.

How can that effect be reproduced if the construction has no operation for computing a gradient?

## The most interesting moment: compare two orders

Let $P_t$ denote diffusion for time $t$. Take two functions, $b$ and $u$, and run two experiments.

First multiply the functions, then diffuse the result. Then reverse the order: spread each function separately, and only then multiply them.

In general the results will differ.

Hidden in that difference is information about how the changes of the two functions interact. For sufficiently regular functions and a small time, we get:

$$\frac{P_t(bu) − (P_t b)(P_t u)}{2t} → ∇b · ∇u.$$

This is the central intuition of our project: **by comparing multiplication before and after diffusion, we can recover information about gradients.**

The underlying identity has classical roots. Our task was to use this mechanism quantitatively in an operator construction and to estimate the error that a finite diffusion time introduces.

What I like most about the idea is its economy. Together, two available operations reveal information that neither of them provides directly on its own.

It is the mathematical equivalent of the moment in Stark’s workshop when it turns out that familiar components can be put together in an entirely new way.

## What did we achieve?

In our result we show that a finite number of diffusion operations, combined with pointwise multiplication, is enough to approximate the solution operator of Darcy’s equation for a defined class of problems.

We work on a torus. The easiest way to picture it is as a space with periodic edges: leave through one side and you come back through the opposite one. This lets us concentrate on the main mechanism without the extra difficulties of boundary conditions.

We also assume that the material coefficient stays positive, has fixed bounds and satisfies a precise regularity condition stated in a weighted norm of its Fourier coefficients.

Within this framework we can tune the construction to any required accuracy. The control covers the whole admissible class of coefficients and forcings. We measure the error in the energy norm, which is tied to the gradient of the solution, so we check its spatial changes as well.

The construction builds on the classical method of iteratively improving an approximation. Its core is the analysis of a single step: how to carry it out through diffusion and multiplication, and how to control the errors that arise. We carry out the proof at the level of functions and operators, without first truncating the problem to a finite set of modes.

## The proof meets the computer

A theorem about what can be represented is only part of the story. As an engineer, I also want to know what happens during the computation.

In the experiments we describe, the construction reached the target accuracy at moderate requirements. At more demanding settings, however, it showed sensitivity to the errors of computer arithmetic.

The reason is visible in our key formula. For a very small diffusion time we subtract two almost identical values and then divide the difference by a small number. A computer stores numbers with finite precision, so some of the information we need can vanish in the subtraction.

On top of that comes the cost of resolution. A short description of the construction may need a very detailed representation of the functions to actually reach the guaranteed accuracy.

That is an important lesson from this research: the number of parameters that describe a model and the cost of running it answer two different questions. Our result gives a mathematical guarantee of representation. Practical speed, stability and the possibility of effective training need further work.

## Why I want to go further

What draws me most is the prospect of carrying this mechanism over to more complex geometries. Diffusion is natural on curved surfaces and in broader mathematical structures too. It might let us build models that use the geometry of the problem directly.

In our materials we have a candidate argument for such an extension, but it needs further verification. I treat it as an open line of research.

The next questions are just as concrete: how can the loss of precision be limited? How should diffusion times be chosen for computation? Can the mechanism be used in a trained model while keeping useful guarantees?

It is exactly this passage — from intuition, through proof, to working technology — that fascinates me most.

Tony Stark’s workshop is still a long way off. But the idea that the ordinary spreading of heat might help build models that understand the structure of the equations of physics definitely deserves a place on my blackboard.
