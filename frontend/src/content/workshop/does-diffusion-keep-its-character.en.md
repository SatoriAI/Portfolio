---
title: One wave against a theorem
date: 2026-10-20
format: proof
summary: How a single wave at the limit of the grid's resolution refuted our theorem, and what was left after the repair.
related: /research
tags: Mathematics, Science, AI
figure: bandedge
---

In Tony Stark's workshop, the tests that teach the most are the ones that end against a wall. In mathematics that test is a counterexample. This one hit a theorem that, on 14 October, we took to be the main result of the second paper on models built from diffusion.

## What we claimed

In the [previous note](/workshop/intelligence-from-heat) I described a construction that assembles an approximate solution of Darcy's equation from diffusion and the multiplication of functions. It is built in layers: the first layer solves the equation for a homogeneous material, and the later ones correct the result by whatever the real material differs from it.

The second paper asks what happens to this construction when it is moved from continuous space to a grid with spacing $h$. Functions are replaced by their averages over cells. The operator in the equation, which measures how sharply a function bends, is replaced by its counterpart on the grid, which compares the values in neighbouring cells. The parameters stay as they were.

Our working notes held a theorem about this, in any dimension: for every input in $L^2$, that is, with no assumption of smoothness at all, the result on the grid differs from the continuous result, averaged over the same cells, by a quantity of order $h^2$. That is second-order convergence: twice as fine a grid, a quarter of the error. The promise was a strong one, because it covered ragged data too, a noisy measurement, say, or a source with sharp edges.

We measured the error in the energy norm. It counts not only how far the result is off, but also how far its slope is off.

Before any manuscript was written, the full set of theorems went to a language model for review. It had taken no part in building the proofs and was told to treat every statement as unverified.

The verdict: the tools of the proof are sound, the main theorem is false.

## A single wave

The counterexample takes a few lines and one dimension: an interval of length one with periodic ends, divided into $n$ cells of width $h = 1/n$.

Take a homogeneous material. The corrections then have nothing to correct, and all that is left of the construction is its first layer. Solving the equation means inverting the operator, so this layer is its approximate inverse. Feed it a single wave just below the limit of resolution: it has $n/2 − 1$ oscillations, one fewer than the grid can hold.

The grid does two things to such a wave.

First it averages it. Each cell holds almost half an oscillation, so the average falls short of the crest. Right at the limit of resolution, $2/π$ of the wave's height is left, about 64%.

![A wave with five oscillations on a periodic interval divided into ten cells, and its averages over the cells](/figure/wave "A wave with five oscillations on ten cells, exactly at the limit of resolution. The thick segments are the cell averages, the dashed line is the wave as the grid sees it: 64% of the height is left. The counterexample takes a wave with one oscillation fewer, so that the grid does not confuse it with its mirror image; on a fine grid that one oscillation makes no difference.")

Then it acts on it with the grid's operator. On a single wave each of the two operators does something simple: it multiplies the wave by a number, the larger the shorter the wave. On long waves the two numbers are almost equal. The shorter the wave, the further the grid's operator falls behind, and at the limit of resolution it gives only $4/π^2$ of what the continuous one gives, about 41%.

![How strongly the grid's operator acts on a wave, as a share of the continuous operator, against the number of oscillations; the curve ends at 41%](/figure/symbol "The share of the continuous operator's action that the grid's operator gives on shorter and shorter waves, here on a grid of ten cells. On every grid the curve ends at 41%; that is where the counterexample sits.")

The whole calculation is made of these two numbers. The continuous operator multiplies our wave by $π^2/h^2$ and the grid's by $4/h^2$. The inverses multiply by the inverses of these numbers, so they differ by $(1/4 − 1/π^2) h^2$, about $0.149 h^2$. That is second order, as the theorem said.

But the energy norm counts the slope as well, and this wave changes almost as fast as the grid allows. On the grid the slope is measured by the square root of $4/h^2$, that is $2/h$, and the difference has to be multiplied by that. The averaging leaves $2/π$ of the wave. Together

$$\frac{4}{π}(\frac{1}{4} − \frac{1}{π^2}) h,$$

that is, about $0.189 h$. That is first order: twice as fine a grid, only half the error. And this for an input of norm one, inside the range of parameters where the theorem was supposed to hold.

## Compute it to believe it

We did not take this on trust. We reproduced the calculation independently, then computed the same quantity with the parameters taken from the first paper at accuracy $ε = 0.01$. The inverting layer is then a sum of 94 diffusions with different times, the shortest of order $10^{−13}$.

| Grid cells, n | Error divided by h |
| ------------: | -----------------: |
|            64 |             0.1870 |
|           128 |             0.1882 |
|           256 |             0.1888 |
|           512 |             0.1890 |
|          1024 |             0.1892 |
|          2048 |             0.1892 |

Had the theorem been true, the numbers in the right-hand column would halve with every row. They stay where they are, or more exactly they approach 0.1893 from below, because our wave lies one oscillation under the limit and that one oscillation matters less and less.

This is not a simulation with measurement error. For a single wave everything comes down to a sum of 94 terms, which is computed directly.

## Where the proof let the wave through

In two places.

The first is a parameter. Diffusion over a time $t$ smooths everything finer than the square root of $t$. We assumed that the shortest time in the inverting layer is longer than $h^2$, that is, that each of its diffusions would damp waves near the limit of resolution. The value came from our own summary of the first paper, not from its text. In the text that time is of order $10^{−13}$, six orders of magnitude below $h^2$ on the finest grid in the table. Nothing damps those waves.

The second is a correct argument used one step too early. Everything the construction produces along the way is smooth, because the first layer smooths the data, so there are no fine oscillations there. That is true of everything that happens after the first layer. The first layer itself, however, receives the raw input.

The rest came through the review intact, including the product layers, which needed a proof of their own because the average of a product is not the product of the averages. The error sat at the input alone.

## What was left after the repair

The repair is one assumption: the input cannot be arbitrarily ragged. Its derivative has to lie in $L^2$ as well (one weak derivative). The energy norm costs a factor of $1/h$, this derivative pays for it, and second order returns. In between lies a whole scale. If the smoothness of the input is measured by a number $s$ from zero (raw data) to one (one derivative), the error falls like

$$h^{1+s}.$$

The counterexample was not thrown away. It is in the paper as a theorem: for raw data no order better than the first can be proved, and one dimension is enough to see it. The proof gives a more cautious constant, $0.08$ instead of $0.189$, because it has to hold on every admissible grid, not only on very fine ones.

A second round of review found one more hole, in the repair itself. The theorem is meant to hold in every dimension, and our summation over the waves the grid confuses with one another diverged from dimension four upwards. This time it was enough to fix the proof; the statement held.

The false theorem lived for one day, in the working notes; it never reached a manuscript. What the paper says today is described under [Research](/research).

## What I take from this

"For every input" are the most expensive words in a theorem. Convergence on smooth data does not test them; only the worst wave the grid can hold does.

The parameters of an earlier paper are read from its text, even when you wrote it yourself.

A reviewer who did not build the proof has one advantage: it does not know which steps "certainly work". Its counterexample was small enough to check by hand, and only then did we withdraw the theorem.

For Stark, a test that ends against a wall is a result too. Our wall now stands in the paper as a theorem about what a grid cannot deliver for raw data.
