# The Turing test and real-world AI

We now have two useful lenses for looking at any AI system: is it narrow or (aspirationally) general, and is it rule-based or learning-based? This final lesson adds one more classic idea — a proposed *test* for "intelligent" behaviour — and then applies everything to systems you use every day.

## The imitation game

In 1950, the mathematician Alan Turing published a paper called *Computing Machinery and Intelligence*, in which he side-stepped the philosophically thorny question "can machines think?" in favour of something you could actually run as an experiment. He described what he called the **imitation game**, now known as the **Turing test**: a human judge holds a text conversation with two hidden participants, one human and one machine, without being told which is which. If the judge cannot reliably tell the machine from the human, the machine is said to have passed.

The appeal of the test is that it is **behavioural** — it never asks what is happening "inside" the machine, only whether its outward conversational behaviour is indistinguishable from a person's. That made it a practical, testable stand-in for a question ("does it really think?") that has no agreed practical test at all.

## Limitations of the Turing test

The Turing test is a useful historical milestone, but it is a genuinely **imperfect** measure of intelligence, for a few connected reasons:

- **It only tests convincing imitation of conversation, not understanding.** A system could pass by being very good at producing plausible-sounding text while having no grasp of what that text means, and it could fail for reasons that have nothing to do with intelligence (e.g. it types too perfectly to seem human).
- **It rewards deception as much as reasoning.** In 1966, Joseph Weizenbaum built **ELIZA**, a simple rule-based chatbot that used nothing but pattern matching (spotting keywords and reflecting the user's sentences back as questions, in the style of a therapist) — no learning, no world knowledge, no real reasoning. Some users nonetheless became convinced ELIZA understood them, a phenomenon now called the **ELIZA effect**. This is a sharp warning: even a purely rule-based, narrow program with no understanding at all can seem intelligent to a human judge under the right conditions.
- **Modern systems have somewhat overtaken it.** Today's large language models can often sustain convincing open-ended conversation, which is one reason researchers now mostly rely on narrower, task-specific benchmarks (translation accuracy, reasoning puzzles, coding tests) rather than the Turing test to compare how capable different AI systems are — a theme this course returns to in *Modern AI: Transformers and LLMs*.

:::callout{kind="warning"}
Passing the Turing test shows a system can *imitate* human conversational behaviour convincingly. It does not show the system understands, reasons, or is conscious — those remain separate (and much harder) questions. Treat the Turing test as a historically important thought experiment, not a certificate of genuine intelligence.
:::

## Real-world AI examples, classified by paradigm

- **Recommendation systems** (e.g. suggesting videos, songs, or products). **Learning-based.** These are trained on huge logs of what users watched, listened to, or bought, learning statistical patterns of taste; nobody hand-writes rules like "if user liked film A, recommend film B."
- **Voice assistants** (e.g. asking a phone to set a timer or answer a question). **Mostly hybrid.** The speech-to-text and language-understanding components are learning-based, trained on vast audio and text corpora — but the final action for a recognised command (like "set a 10-minute timer") is often still dispatched by comparatively simple rule-based logic that matches an intent to a fixed action.
- **Image recognition** (e.g. a photo app automatically tagging faces or objects). **Learning-based.** These systems are trained on large sets of labelled images and learn to recognise patterns no human explicitly wrote down as rules.
- **Game-playing programs.** This category splits cleanly along our historical arc: classic programs such as **Deep Blue** were **rule-based/symbolic** — search through move sequences guided by a hand-crafted evaluation function. Modern programs such as **AlphaGo** and **AlphaZero** are **learning-based** — their evaluation of a position and choice of move are learned from millions of games of self-play, with no hand-written chess or Go knowledge beyond the rules of the game itself.

:::reveal{title="Worked example: classifying a new system"}
**System:** a customer-service chatbot that only ever replies from a fixed script: it scans the customer's message for keywords ("refund", "delivery", "cancel") and returns one of a small set of pre-written responses matched to whichever keyword it found. If no keyword matches, it replies "Please contact a human agent."

**(a) Narrow or general?** Narrow — it does one job (routing a small set of anticipated customer queries) and nothing else.

**(b) Rule-based or learning-based?** Rule-based. A human programmer wrote the keyword list and the fixed responses in advance; the bot never adjusts its behaviour based on data, and it cannot handle a phrasing that doesn't contain one of its keywords.

**(c) Would it likely pass an informal Turing test?** Probably not for long. Because its replies are drawn from a small fixed set triggered by exact keywords, a judge who asks a follow-up question, uses unexpected phrasing, or asks something with no matching keyword would quickly expose it — much like ELIZA, it could seem convincing for a line or two but would not sustain an open-ended conversation the way a learning-based, broadly-trained language model might.
:::

## Reviewing the module's key terms

You have now met the core vocabulary for talking precisely about AI systems: what counts as AI, narrow vs general, rule-based vs learning-based, and the Turing test with its limitations. Use the flashcards below to check you can recall and explain each term in your own words before moving on.

::widget{type="flashcards" src="cards/key-terms.json"}

This module has been about *concepts*, deliberately with very little mathematics — that starts in earnest with the next modules in this course, where you'll meet the search algorithms, logical reasoning, and statistical machine-learning techniques that put the ideas from this module into practice. When you're ready, take the end-of-module assessment to check your understanding.
