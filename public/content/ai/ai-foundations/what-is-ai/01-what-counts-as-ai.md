# What counts as AI? Narrow vs general intelligence

**Artificial intelligence (AI)** is the field of building computational systems that perform tasks which, if a person did them, we would say required intelligence: recognising a face, understanding a sentence, planning a route, diagnosing an illness, or deciding on a good move in a game. The definition is deliberately about *what a system does*, not about what it "is made of" — a program running on ordinary silicon counts as AI the moment its behaviour looks intelligent, with no requirement that it think, feel, or understand anything the way a person does.

The term itself dates to the summer of 1956, when John McCarthy and colleagues organised a workshop at Dartmouth College proposing to study "every aspect of learning… that can in principle be so precisely described that a machine can be made to simulate it." That workshop is usually credited with coining "artificial intelligence" as a name for the field, even though people had been building rule-following machines and thinking about mechanical reasoning for decades before.

:::callout{kind="tip"}
Notice the phrase "tasks that would require human intelligence **if a human did them**." This is a moving target: once a task is reliably automated, people often stop calling it AI. Postal code readers, chess engines, and route-finding apps all began as celebrated AI research and are now considered "just software" — this is sometimes called the *AI effect*.
:::

## Narrow (weak) AI

Almost every AI system in existence today is **narrow AI** (also called **weak AI**): it is built and trained to do one specific job, and it has no ability to do anything else. A spam filter cannot play chess. A chess engine cannot recognise a face. A voice assistant that books your calendar cannot diagnose a medical scan. Each is highly capable — sometimes superhuman — within its own narrow lane, and helpless outside it.

Narrow AI is not a lesser, "not really AI" category — it is simply what AI *is*, in practice, everywhere it is deployed: search engines, spam filters, recommendation systems, voice assistants, image recognisers, medical-imaging tools, and game-playing programs are all narrow AI.

## General (strong) AI

**General AI** (also called **strong AI** or **artificial general intelligence, AGI**) is the aspirational idea of a system with flexible, human-like intelligence that can learn or perform *any* intellectual task a person can, transferring what it knows from one domain to a completely different one, the way a person who learns to drive a car can also learn to ride a bike using much of the same general reasoning and coordination.

No such system exists today. General AI remains a long-term research goal (and a rich source of philosophical debate and science-fiction imagery) rather than a working technology — a distinction worth keeping firmly in mind whenever a headline describes a narrow system in general-sounding language.

:::callout{kind="key"}
**Narrow AI** does one job well and cannot generalise beyond it — this is all of today's deployed AI. **General AI** would match human flexibility across arbitrary tasks — this remains hypothetical. When in doubt about a real system, assume narrow.
:::

:::reveal{title="Worked example: classifying four systems as narrow or general"}
For each system below, decide whether it is narrow AI, and briefly say why.

1. **An email spam filter.** Narrow. It does exactly one job — deciding spam vs. not‑spam — and has no capacity to do anything else, however well it does that one job.
2. **A self-driving car's pedestrian-detection module.** Narrow. Detecting pedestrians in camera footage is a single, well-defined perception task; the module cannot, say, hold a conversation or plan a holiday, even though "driving" sounds broad in everyday speech. (The car as a whole is a bundle of many narrow AI modules working together — perception, planning, control — not one general intelligence.)
3. **IBM's Deep Blue**, the 1997 program that beat world chess champion Garry Kasparov. Narrow. Deep Blue was extraordinarily capable at chess and at literally nothing else — it could not even play a simpler game like noughts and crosses without being reprogrammed.
4. **A hypothetical household robot that could learn to cook, do the accounts, hold a conversation, and pick up any new household skill as competently as a human housemate.** This describes general AI — flexible, transferable competence across essentially unrelated tasks. No such robot exists; this is the aspirational case, useful precisely as a contrast with 1–3.
:::

Every other lesson in this course — search, reasoning, learning from data, regression, classification, neural networks, and modern language models — is about narrow AI: powerful, useful, and worth understanding on its own terms, without needing science-fiction general intelligence to be "real" AI. Next, we look at two very different ways of *building* a narrow AI system: writing its rules by hand, or having it learn its own rules from data.
