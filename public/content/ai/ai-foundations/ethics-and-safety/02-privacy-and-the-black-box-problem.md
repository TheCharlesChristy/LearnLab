# Privacy and the black-box problem

Two more ethical problems arise once a model is trained and deployed: it might leak information about the data it was trained on, and even when it doesn't, it might not be able to tell anyone — including its own developers — *why* it made a particular decision. Both problems get sharper as models get larger and more capable, which is exactly the direction *Modern AI: Transformers and LLMs* describes.

## Privacy: what a model remembers

Large models, especially the transformer-based language models from the previous module, are trained on enormous amounts of text and other data, much of which contains personal information swept up incidentally — names, addresses, medical details, private conversations posted publicly and then scraped. Two distinct privacy risks follow:

- **Memorisation and leakage.** A large enough model can memorise rare or unusual sequences from its training data almost verbatim. If a person's name happened to appear next to their phone number or address in the training text often enough (or distinctively enough), a carefully worded prompt can sometimes cause the model to reproduce that exact private information to someone who was never supposed to see it.
- **Inference.** Even without memorising anything verbatim, a model can *infer* sensitive attributes that were never explicitly stated. A model trained to predict all sorts of things from behavioural data (purchase history, writing style, browsing patterns) can end up inferring health conditions, sexual orientation, or political views that a person never disclosed — simply because those attributes correlate with patterns the model has learned.

:::callout{kind="key"}
Privacy risk in AI is not only about data being *stolen* in the traditional sense — a model trained lawfully on data people agreed to share can still leak or infer information in ways none of those people anticipated or consented to.
:::

:::reveal{title="Worked example: an unintended leak"}
Imagine a customer-support chatbot fine-tuned on a company's own historical support tickets, which include full email threads. One rare customer's ticket contained an unusual combination of a full name, a home address, and an account number, repeated verbatim across several back-and-forth replies. Months later, a completely unrelated user asks the deployed chatbot an open-ended question that happens to nudge it into the same region of "conversation space" the model learned from that ticket. Because that specific sequence of text was distinctive and repeated often in training, the model reproduces fragments of it — leaking a real customer's address to a stranger. No one queried a database; the private data was leaked purely because the model had memorised it as a pattern in its weights. This is why organisations increasingly test large models for **memorisation of sensitive strings** before deployment, not just for accuracy.
:::

## The black-box problem

Separately from privacy, many of the most capable models — especially deep neural networks, built from the layers of perceptron-like units introduced in *Neural Networks I* and trained by the gradient-based methods in *Neural Networks II* — are **black boxes**. A trained network might have millions of weights, each contributing a small, uninterpretable amount to the final output. The network can be extremely accurate and still be unable to give a human-readable reason for any single decision, because there simply isn't a step in its computation that corresponds to "because of reason X" the way a simple rule (`if income > threshold then approve`) does.

**Explainability** is the general problem of getting a useful, human-understandable account of *why* a model produced a particular output — either by building models that are inherently more interpretable, or by using separate techniques to approximate an explanation for an opaque model after the fact (for example, highlighting which input features most changed the output). Both approaches are active areas of research; neither fully solves the underlying tension between a model's raw predictive power and how easy it is to explain.

## Why this matters for high-stakes decisions

Explainability is not a nice-to-have when a model's output only recommends a song or a film — a wrong guess costs almost nothing. It becomes critical when a model's output is used to make **high-stakes decisions about people**:

- **Medical diagnosis.** A neural network that flags a scan as likely cancerous with 95% accuracy is genuinely useful — but if it cannot indicate *which part of the image* or *which features* drove that judgement, a doctor cannot verify the reasoning, cross-check it against other evidence, or explain it to the patient. An opaque "trust the model" is a poor substitute for clinical judgement that can be scrutinised.
- **Loan and credit decisions.** If a model rejects someone's loan application, that person has a legitimate interest in knowing why: was it their credit history, their income, something else? Without an explanation, an unfairly rejected applicant has no way to identify an error (or a bias, as in the previous lesson) and no way to contest the decision.

:::callout{kind="warning"}
"The model said so" is not an explanation. When a black-box model drives a decision that materially affects someone's health, finances, or liberty, the *inability to explain that decision* is itself an ethical problem — independent of whether the decision happened to be correct.
:::

Privacy and explainability are two sides of the same coin: both are about whether the people affected by a model can trust and scrutinise what it does with information about them. The next lesson turns to what happens when AI capabilities are deliberately pointed at causing harm, and to the harder question of who is responsible when things go wrong.
