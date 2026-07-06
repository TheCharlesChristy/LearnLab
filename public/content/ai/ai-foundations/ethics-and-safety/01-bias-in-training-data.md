# Bias in training data

Every model you have met in this course — a regression line, a classifier, a perceptron — learns its behaviour entirely from a **training set** of labelled examples (see *Machine Learning Concepts, Data and Evaluation*). This is the source of AI's greatest strength and its most persistent ethical problem: a model has no notion of fairness, only a notion of "what pattern best fits the data I was shown." If that data reflects an existing social bias, the model will learn that bias as if it were simply the correct answer — and, because the model applies it mechanically and at scale, it can **reproduce and even amplify** the bias rather than merely repeat it.

## Where the bias comes from

Bias does not require anyone to write biased rules on purpose. It creeps in through the data pipeline in a few well-documented ways:

- **Historical bias.** The labels themselves record past human decisions that were already unfair (e.g. who was hired, who was approved for a loan), so "correct" in the training data means "consistent with the old, unfair pattern."
- **Sampling bias.** The training set over-represents some groups and under-represents others, so the model sees far more examples of what "success" looks like for the majority group.
- **Proxy features.** A feature that seems neutral (postcode, school attended, which optional activities someone listed) can correlate strongly with a protected characteristic, letting the model reconstruct and use that characteristic indirectly even if it was never given directly.

:::callout{kind="key"}
A model trained on biased data does not just **repeat** the bias — because it distils the training set into a single, confidently applied rule, it can **amplify** small historical disparities into a much sharper cutoff than any individual human decision-maker used.
:::

## Worked example: a hiring-screening model

Suppose a company builds a model to shortlist job applicants automatically, trained on ten years of past hiring records. Almost all of the people who were hired and rated "successful" in that period happened to come from one demographic group — not because people from other groups were less capable, but because of who applied, who was noticed, and who past (human) hiring managers favoured. The model is never told anyone's demographic group directly; it is simply asked to learn "what makes a successful hire" from the historical labels.

Because the training data disproportionately shows successful hires from one group, the model learns to associate features that are common in that group's applications (certain schools, certain gaps in employment history, certain phrasing on a CV) with a higher predicted chance of success. When it screens new applicants, it systematically scores equally-qualified candidates from under-represented groups lower — not because they are less qualified, but because their applications look less like the (unrepresentative) training examples of "success."

:::reveal{title="Deeper dive: why 'ignore the demographic' isn't enough"}
A natural fix is to simply remove any demographic field from the training data. In practice this rarely solves the problem, because other features act as **proxies**: postcode can proxy for ethnicity or class, choice of degree or university can proxy for gender or socioeconomic background, and even the phrasing of a CV can correlate with a candidate's background. A model can reconstruct a removed characteristic from these correlated features and discriminate on it just as effectively — sometimes more effectively, since the proxy is now hidden and harder to audit. Removing a sensitive field is a starting point, not a guarantee of fairness; genuinely reducing bias usually requires auditing model outputs *across groups* on held-out data (an evaluation-time check, not just a training-time one).
:::

## Seeing bias amplification directly

The interactive example below hand-writes a very simple "rule" (a single threshold on one score) to make the amplification mechanism visible — a real model would learn something more complex, but the underlying failure mode is identical. Ten historical hiring records are used to learn a threshold; that threshold is then applied to a brand-new pool of ten applicants who are, by construction, **equally qualified** and split evenly between the two groups. Run it and see what happens to each group's approval rate.

::widget{type="code-runner" language="python" rows=16 starter="historical_hires = [\n    (9, 7, 'A', 1), (8, 6, 'A', 1), (9, 8, 'A', 1), (7, 6, 'A', 1),\n    (8, 7, 'A', 1), (9, 5, 'A', 1), (8, 8, 'A', 1), (7, 7, 'A', 1),\n    (4, 8, 'B', 0), (3, 9, 'B', 0),\n]\n# Each row is (prestige_score, true_ability, group, was_hired).\n# Group B's true_ability (8, 9) is HIGHER than several hired Group A\n# applicants (5, 6) -- but Group B was rejected historically, because past\n# hiring only ever drew from a narrow set of prestige institutions that\n# Group A had far better historical access to.\n\nhired_scores = [row[0] for row in historical_hires if row[3] == 1]\nthreshold = min(hired_scores)\nprint(f'Rule learned from history: approve if prestige_score >= {threshold}')\nprint()\n\nnew_applicants = [\n    (8, 'A'), (9, 'A'), (7, 'A'), (8, 'A'), (9, 'A'),\n    (4, 'B'), (5, 'B'), (6, 'B'), (4, 'B'), (3, 'B'),\n]\n# A brand-new pool: 5 applicants per group, equally split and -- by\n# construction -- equally talented. Only the historically-biased\n# prestige_score still differs systematically by group.\n\ndef approve(score):\n    return score >= threshold\n\nfor group in ('A', 'B'):\n    pool = [a for a in new_applicants if a[1] == group]\n    approved = [a for a in pool if approve(a[0])]\n    rate = 100 * len(approved) / len(pool)\n    print(f'Group {group}: {len(approved)}/{len(pool)} approved ({rate:.0f}%)')"}

Notice that the two groups in `new_applicants` are exactly the same size and, in the story, equally talented — yet the single learned threshold produces wildly different approval rates. Nothing in the code mentions fairness or discrimination; the outcome falls straight out of a threshold fitted to unrepresentative historical labels.

:::callout{kind="warning"}
Try changing a couple of the `historical_hires` scores so that Group B's hired examples include lower prestige scores too, and re-run. A more representative training set moves the learned threshold and narrows the gap — bias in, bias out.
:::

Bias in training data is the clearest ethical failure mode in this course precisely because it follows directly from ideas you already know: a model is only as fair as the distribution of examples it is shown, and the same evaluation habits from *Machine Learning Concepts, Data and Evaluation* — checking performance on held-out data, checking it **per subgroup**, not just in aggregate — are the front line of defence.
