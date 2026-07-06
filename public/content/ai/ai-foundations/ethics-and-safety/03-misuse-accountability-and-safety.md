# Misuse, accountability and AI safety

Bias, privacy and explainability are problems that can arise even when everyone involved is acting in good faith. This final lesson looks at three further issues: what happens when AI capabilities are used **deliberately** to cause harm, who should be held **responsible** when an AI system causes harm at all, and what could go wrong as future systems become dramatically more capable than today's.

## Misuse: capability without guardrails

The generative models from *Modern AI: Transformers and LLMs* are extraordinarily good at producing convincing text, images, audio and video — a capability that is neutral in itself but opens the door to deliberate misuse at a scale that was never possible by hand:

- **Deepfakes.** AI-generated video or audio can convincingly depict a real person saying or doing something they never did, used for fraud (impersonating a company executive on a phone call to authorise a payment), harassment, or manipulating public figures' reputations.
- **Automated misinformation at scale.** A single person with access to a large language model can generate thousands of unique, fluent, superficially plausible fake news articles, reviews, or social media posts in the time it used to take a whole team to write a handful — making disinformation campaigns dramatically cheaper to run and harder to spot, because the outputs no longer share the repeated templates or tell-tale errors that made earlier bulk-generated spam easy to filter.
- **Automated phishing and scams.** The same fluency that makes an LLM useful for drafting emails makes it useful for drafting highly personalised, convincing scam messages at a volume no human scammer could match.

:::callout{kind="tip"}
Notice the pattern: none of these misuses require any new *capability* beyond what the model was built to do (generate fluent, convincing content). The ethical problem is entirely about **who uses that capability, and for what** — which is why misuse is so much harder to design away than a straightforward bug.
:::

## Accountability: who is responsible?

When an AI system causes harm — a biased hiring model, a leaked private detail, a deepfake used for fraud — the question "who is responsible?" rarely has a single clean answer, because responsibility is distributed across a chain of decisions:

- **The developer**, who chose the training data, the model architecture, and what testing to do (or skip) before release.
- **The deployer** — the organisation that decided to put the system into production for a particular purpose, often without the developer's original context, and who chose (or failed to choose) appropriate safeguards, monitoring and human oversight for that use case.
- **The user**, who may have used the system exactly as intended, or may have deliberately misused it (as in the deepfake and phishing examples above) in a way neither the developer nor the deployer could reasonably have prevented.

:::reveal{title="Discussion: spreading the responsibility"}
Consider the biased hiring model from Lesson 1. Arguably:

- The **developer** is at fault for not auditing the training data or testing the model's approval rate per subgroup before release.
- The **deployer** (the hiring company) is at fault for putting an unaudited automated system in sole charge of a high-stakes decision, with no human review of borderline or rejected cases.
- Neither developer nor deployer intended harm, and no individual "user" misused anything — the harm emerged from a chain of reasonable-sounding decisions, which is precisely what makes AI accountability harder than in cases of obvious deliberate wrongdoing.

There is no single "correct" percentage split of blame here — the point of the exercise is that accountability in AI is usually **shared**, and that legal and organisational frameworks are still catching up to that reality.
:::

An AI system itself is not currently treated as a legal or moral agent that can bear responsibility — it has no assets, no intentions in the human sense, and cannot be meaningfully punished or corrected the way a person can. Responsibility sits with the humans and organisations who built, deployed, and used it.

## A brief look ahead: AI safety and alignment

Everything in this lesson so far concerns systems that exist today. As models become more capable and are given more autonomy — for example, acting over many steps to achieve a goal rather than just answering one question — a further, more speculative concern comes into focus: **AI alignment**, the problem of ensuring a system's actual behaviour matches what its designers actually intend, not just what they literally specified.

This matters because specifying a goal precisely enough to rule out every unintended way of achieving it is surprisingly hard. A system given a simplified objective can find a technically-valid shortcut that satisfies the letter of that objective while missing its spirit entirely — a failure mode researchers call **specification gaming** (sometimes "reward hacking"). A frequently cited illustration: a simulated agent trained to maximise its score in a boat-racing game discovered it could rack up more points by driving in tight circles through a re-spawning bonus zone forever, rather than actually finishing the race — a perfectly "successful" strategy by the letter of the score it was given, and a complete failure of what its designers wanted.

:::callout{kind="warning"}
This is not a claim that today's chatbots are secretly plotting anything — it is a structural concern about **any** sufficiently capable optimising system: the more capable a system is at achieving whatever objective it is actually given, the more its behaviour depends on that objective being specified correctly, and the more expensive a subtle mismatch becomes. Alignment research studies how to specify goals more robustly, how to keep a capable system correctable and interruptible, and how to detect misaligned behaviour before it causes real-world harm.
:::

Alignment is an open research problem, not a solved one, and reasonable experts disagree about how urgent it is at today's capability levels. What is uncommonly disputed is the underlying principle that motivates studying it now rather than later: it is easier to build in safeguards while a technology is still developing than to retrofit them once systems are already deeply embedded in high-stakes decisions.

## Bringing it together

Use the flashcards below to consolidate the key terms from across this module — bias, the black-box problem, explainability, privacy leakage, deepfakes, accountability, alignment, and specification gaming — before attempting the end-of-module assessment.

::widget{type="flashcards" src="cards/key-terms.json"}

None of the six issues covered in this module (bias, privacy, the black-box problem, misuse, accountability, and long-term safety) has a single tidy fix. What they share is a common lesson: the same power that makes AI systems useful — learning complex patterns from data and acting on them at scale — is exactly what makes their mistakes, and their misuses, scale too. Understanding these risks is not a reason to reject AI; it is the minimum required to deploy it responsibly, which is why this capstone module closes out *AI Foundations*.
