# Activity plugins

> Generated from registered `ActivityPlugin` definitions. Do not edit the generated facts by hand; update the plugin definition and refresh this file in the same change.

Each `activity.key` selects its matching props schema below. The Studio catalog exposes the same metadata and preview-fixture identifiers without importing an activity component.

## `core-choice` v1.0.0

A misconception-aware choice checkpoint with normalised choice and correctness values.

- Category: `choice`
- Supported goal operators: `activity-complete`, `equals`, `in-range`, `set-equals`, `regex-match`
- Learning use: Use for retrieval where a wrong choice should retain its targeted feedback and hint ladder.
- Persistence: `none` — The activity reports a normalised result at its existing gated Finish/Continue action; SceneRunner owns the durable boundary.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `core-interaction-preview`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "legacyLessonId",
    "screen",
    "index",
    "total"
  ],
  "properties": {
    "legacyLessonId": {
      "type": "string",
      "minLength": 1
    },
    "screen": {
      "type": "object",
      "required": [
        "type"
      ],
      "properties": {
        "type": {
          "const": "tap-choice"
        }
      }
    },
    "index": {
      "type": "integer",
      "minimum": 0
    },
    "total": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Tab to a choice and press Enter or Space; incorrect choices retain feedback and hints.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The original choice screen uses motion-safe feedback only.

## `core-entry` v1.0.0

A numeric or text generation checkpoint with normalised answer and correctness values.

- Category: `entry`
- Supported goal operators: `activity-complete`, `equals`, `in-range`, `set-equals`, `regex-match`
- Learning use: Use when learners should produce a number or text answer, with the existing exact marking and hints.
- Persistence: `none` — The activity reports a normalised result at its existing gated Finish/Continue action; SceneRunner owns the durable boundary.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `core-interaction-preview`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "legacyLessonId",
    "screen",
    "index",
    "total"
  ],
  "properties": {
    "legacyLessonId": {
      "type": "string",
      "minLength": 1
    },
    "screen": {
      "type": "object",
      "required": [
        "type"
      ],
      "properties": {
        "type": {
          "const": "entry"
        }
      }
    },
    "index": {
      "type": "integer",
      "minimum": 0
    },
    "total": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Type an answer and press Enter or activate Check; the original screen retains its validation and hints.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The original entry screen has no timed transition.

## `core-faded-step` v1.0.0

Completes the final blank in a worked example with normalised answer and correctness values.

- Category: `entry`
- Supported goal operators: `activity-complete`, `equals`, `in-range`, `set-equals`, `regex-match`
- Learning use: Use for backward-faded examples where the learner supplies the final step after inspecting worked context.
- Persistence: `none` — The activity reports a normalised result at its existing gated Finish/Continue action; SceneRunner owns the durable boundary.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `core-interaction-preview`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "legacyLessonId",
    "screen",
    "index",
    "total"
  ],
  "properties": {
    "legacyLessonId": {
      "type": "string",
      "minLength": 1
    },
    "screen": {
      "type": "object",
      "required": [
        "type"
      ],
      "properties": {
        "type": {
          "const": "faded-step"
        }
      }
    },
    "index": {
      "type": "integer",
      "minimum": 0
    },
    "total": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Type the final step and press Enter or activate Check; feedback and hints retain their original behaviour.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The original faded-step screen has no timed transition.

## `core-flash-recall` v1.0.0

Requires recall before reveal and a self-grade, with normalised reveal and grade values.

- Category: `recall`
- Supported goal operators: `activity-complete`, `equals`, `in-range`, `set-equals`, `regex-match`
- Learning use: Use for a single retrieval prompt where the learner commits to trying before self-grading.
- Persistence: `none` — The activity reports a normalised result at its existing gated Finish/Continue action; SceneRunner owns the durable boundary.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `core-interaction-preview`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "legacyLessonId",
    "screen",
    "index",
    "total"
  ],
  "properties": {
    "legacyLessonId": {
      "type": "string",
      "minLength": 1
    },
    "screen": {
      "type": "object",
      "required": [
        "type"
      ],
      "properties": {
        "type": {
          "const": "flash-recall"
        }
      }
    },
    "index": {
      "type": "integer",
      "minimum": 0
    },
    "total": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Activate Show me after recalling, then choose a self-grade before Finish.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The original flash-recall screen has no timed transition.

## `core-predict` v1.0.0

Commits a prediction before revealing the mechanism, with a normalised selected-choice outcome.

- Category: `choice`
- Supported goal operators: `activity-complete`, `equals`, `in-range`, `set-equals`, `regex-match`
- Learning use: Use before instruction or an explorable when an explicit prediction makes the later mechanism meaningful.
- Persistence: `none` — The activity reports a normalised result at its existing gated Finish/Continue action; SceneRunner owns the durable boundary.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `core-interaction-preview`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "legacyLessonId",
    "screen",
    "index",
    "total"
  ],
  "properties": {
    "legacyLessonId": {
      "type": "string",
      "minLength": 1
    },
    "screen": {
      "type": "object",
      "required": [
        "type"
      ],
      "properties": {
        "type": {
          "const": "predict"
        }
      }
    },
    "index": {
      "type": "integer",
      "minimum": 0
    },
    "total": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Tab to a prediction option and press Enter or Space to commit.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The original prediction screen has no timed transition.

## `core-reveal-mechanism` v1.0.0

Requires a learner self-explanation before revealing the model explanation and emits the entered text.

- Category: `construction`
- Supported goal operators: `activity-complete`, `equals`, `in-range`, `set-equals`, `regex-match`
- Learning use: Use after a worked mechanism when the learner must explain before seeing the model account.
- Persistence: `none` — The activity reports a normalised result at its existing gated Finish/Continue action; SceneRunner owns the durable boundary.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `core-interaction-preview`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "legacyLessonId",
    "screen",
    "index",
    "total"
  ],
  "properties": {
    "legacyLessonId": {
      "type": "string",
      "minLength": 1
    },
    "screen": {
      "type": "object",
      "required": [
        "type"
      ],
      "properties": {
        "type": {
          "const": "reveal-mechanism"
        }
      }
    },
    "index": {
      "type": "integer",
      "minimum": 0
    },
    "total": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Type an explanation, activate Check my thinking, then Finish after the model explanation appears.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The reveal is immediate and has no timed transition.

## `core-sort-match` v1.0.0

Matches pairs through keyboard-accessible buttons and emits the selected pairs and matched set.

- Category: `construction`
- Supported goal operators: `activity-complete`, `equals`, `in-range`, `set-equals`, `regex-match`
- Learning use: Use for classifying or linking concepts where every pair must be actively matched.
- Persistence: `none` — The activity reports a normalised result at its existing gated Finish/Continue action; SceneRunner owns the durable boundary.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `core-interaction-preview`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "legacyLessonId",
    "screen",
    "index",
    "total"
  ],
  "properties": {
    "legacyLessonId": {
      "type": "string",
      "minLength": 1
    },
    "screen": {
      "type": "object",
      "required": [
        "type"
      ],
      "properties": {
        "type": {
          "const": "sort-match"
        }
      }
    },
    "index": {
      "type": "integer",
      "minimum": 0
    },
    "total": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Choose a left and right button to attempt a pair; no drag-and-drop is required.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: Mismatch shake uses motion-safe CSS and is suppressed by reduced motion.

## `diagnose-repair` v1.0.0

Observe a symptom, commit evidence, diagnose the cause, then choose a causal repair.

- Category: `construction`
- Supported goal operators: `activity-complete`
- Learning use: Use when learners must distinguish evidence-supported causes from plausible but unsupported repairs.
- Persistence: `none` — The template reports a completed repair only; SceneRunner owns checkpoints and durable mission effects.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `signal-repair`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "symptoms",
    "diagnoses",
    "repairs",
    "requiredEvidenceIds"
  ],
  "properties": {
    "symptoms": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "label",
          "diagnosisIds"
        ],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "label": {
            "type": "string",
            "minLength": 1
          },
          "diagnosisIds": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "string",
              "minLength": 1
            },
            "uniqueItems": true
          }
        }
      }
    },
    "diagnoses": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "label",
          "repairIds",
          "evidenceIds"
        ],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "label": {
            "type": "string",
            "minLength": 1
          },
          "repairIds": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "string",
              "minLength": 1
            },
            "uniqueItems": true
          },
          "evidenceIds": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            },
            "uniqueItems": true
          },
          "feedback": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    },
    "repairs": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "label",
          "effect"
        ],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "label": {
            "type": "string",
            "minLength": 1
          },
          "effect": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "operator",
              "path",
              "value"
            ],
            "properties": {
              "operator": {
                "const": "set"
              },
              "path": {
                "type": "string",
                "minLength": 1
              },
              "value": {
                "type": "boolean"
              }
            }
          }
        }
      }
    },
    "requiredEvidenceIds": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "string",
        "minLength": 1
      },
      "uniqueItems": true
    }
  }
}
```

### Accessibility contract

Keyboard: Use Tab to reach labelled symptom, evidence, diagnosis, repair, and submit controls.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The mechanic uses no timed motion.

## `experiment-infer` v1.0.0

Commit a prediction, run controlled conditions, infer a rule from observations, then transfer it.

- Category: `explorable`
- Supported goal operators: `activity-complete`, `equals`, `set-equals`
- Learning use: Use for causal or quantitative relationships where learners must vary a declared input and justify a transferable rule.
- Persistence: `none` — The activity reports an accepted observation-to-transfer result; SceneRunner owns any checkpoint or durable mission state.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `direct-relationship`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "title",
    "predictionPrompt",
    "predictions",
    "trials",
    "requiredTrialIds",
    "inferencePrompt",
    "rules",
    "correctRuleId",
    "transferPrompt",
    "transferOptions",
    "correctTransferId"
  ],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1
    },
    "predictionPrompt": {
      "type": "string",
      "minLength": 1
    },
    "predictions": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "label"
        ],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "label": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    },
    "trials": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "controlLabel",
          "observationLabel"
        ],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "controlLabel": {
            "type": "string",
            "minLength": 1
          },
          "observationLabel": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    },
    "requiredTrialIds": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "string",
        "minLength": 1
      },
      "uniqueItems": true
    },
    "inferencePrompt": {
      "type": "string",
      "minLength": 1
    },
    "rules": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "label"
        ],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "label": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    },
    "correctRuleId": {
      "type": "string",
      "minLength": 1
    },
    "transferPrompt": {
      "type": "string",
      "minLength": 1
    },
    "transferOptions": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "label"
        ],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "label": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    },
    "correctTransferId": {
      "type": "string",
      "minLength": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Use Tab to reach each prediction, condition, rule, and transfer button; activate it with Enter or Space.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: Observations appear as immediate text; there is no timed motion.

## `explore-eigen-playground` v1.0.0

Adjusts covariance and reports its value, eigenvector angle, and eigenvalues.

- Category: `explorable`
- Supported goal operators: `activity-complete`, `equals`, `in-range`
- Learning use: Use when learners should investigate how a covariance term changes a principal direction.
- Persistence: `none` — The matrix configuration is authored data; only the submitted observable crosses the activity boundary.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `covariance-angle`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "a",
    "c",
    "bMin",
    "bMax"
  ],
  "properties": {
    "a": {
      "type": "number",
      "minimum": 0.000001
    },
    "c": {
      "type": "number",
      "minimum": 0.000001
    },
    "bMin": {
      "type": "number"
    },
    "bMax": {
      "type": "number"
    },
    "bInit": {
      "type": "number"
    },
    "showPoints": {
      "type": "boolean"
    },
    "hints": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    }
  }
}
```

### Accessibility contract

Keyboard: Focus the covariance slider, use arrow keys to adjust it, then record the observation.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The explorable has no timed animation; its value updates immediately.

## `explore-function-grapher` v1.0.0

Moves a tangent point and reports its observable x-coordinate and gradient.

- Category: `explorable`
- Supported goal operators: `activity-complete`, `equals`, `in-range`
- Learning use: Use after a prediction when learners must test a graph property at a chosen tangent point.
- Persistence: `none` — The graph configuration is authored data; only the submitted observable crosses the activity boundary.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `quadratic-tangent`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "expr",
    "xmin",
    "xmax"
  ],
  "properties": {
    "expr": {
      "type": "string",
      "minLength": 1
    },
    "xmin": {
      "type": "number"
    },
    "xmax": {
      "type": "number"
    },
    "ymin": {
      "type": "number"
    },
    "ymax": {
      "type": "number"
    },
    "grid": {
      "type": "boolean"
    },
    "hints": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    }
  }
}
```

### Accessibility contract

Keyboard: Focus the tangent slider, use arrow keys to move it, then record the observation.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The explorable has no timed animation; its value updates immediately.

## `explore-signal-scope` v1.0.0

Adjusts a signal frequency and reports the live frequency and spectral peak.

- Category: `explorable`
- Supported goal operators: `activity-complete`, `equals`, `in-range`
- Learning use: Use to make learners test a frequency prediction against a waveform and spectrum.
- Persistence: `none` — The signal configuration is authored data; only the submitted observable crosses the activity boundary.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `sine-spectrum`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "expr",
    "sampleRate",
    "duration",
    "freqMin",
    "freqMax"
  ],
  "properties": {
    "expr": {
      "type": "string",
      "minLength": 1
    },
    "sampleRate": {
      "type": "number",
      "minimum": 1
    },
    "duration": {
      "type": "number",
      "minimum": 0.001
    },
    "noiseAmount": {
      "type": "number",
      "minimum": 0
    },
    "freqMin": {
      "type": "number"
    },
    "freqMax": {
      "type": "number"
    },
    "freqInit": {
      "type": "number"
    },
    "showSpectrum": {
      "type": "boolean"
    },
    "hints": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    }
  }
}
```

### Accessibility contract

Keyboard: Focus the frequency slider, use arrow keys to adjust it, then record the observation.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The explorable has no timed animation; its value updates immediately.

## `python-item` v1.0.0

Runs one same-origin Python item in the isolated worker and emits only its progress summary.

- Category: `construction`
- Supported goal operators: `activity-complete`, `equals`, `in-range`
- Learning use: Use when an item needs the Python SDK or a simulation, with the authored item retaining its own interaction and feedback.
- Persistence: `resume-supported` — The worker serialises JSON state through the existing PERSIST protocol; the v2 caller supplies savedState on resume and remains the only durable-state writer.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `worker-progress-contract`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "itemId",
    "sourceUrl"
  ],
  "properties": {
    "itemId": {
      "type": "string",
      "minLength": 1
    },
    "sourceUrl": {
      "type": "string",
      "minLength": 1
    },
    "params": {
      "type": "object"
    },
    "height": {
      "type": "number",
      "minimum": 1
    },
    "seed": {
      "type": "integer",
      "minimum": 0
    },
    "savedState": {
      "type": "object"
    },
    "title": {
      "type": "string",
      "minLength": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Use the Python item’s native keyboard controls. Progress feedback is announced after the item reports a result.

Focus starts at `activity-root` and after outcome is `feedback`. Reduced motion: The worker item owns its motion behaviour; no adapter animation is added.

## `seeded-choice` v1.0.0

A deterministic single-choice interaction with a normalised selected-answer outcome.

- Category: `choice`
- Supported goal operators: `activity-complete`, `equals`
- Learning use: Use for retrieval or prediction commitments where selecting one diagnosis is meaningful.
- Persistence: `none` — Selection is local UI state only; a failed attempt is reset by the SceneRunner.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `basic-correct-choice`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "prompt",
    "options",
    "correctId"
  ],
  "properties": {
    "prompt": {
      "type": "string",
      "minLength": 1
    },
    "options": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "label"
        ],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "label": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    },
    "correctId": {
      "type": "string",
      "minLength": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Tab to a radio option, use arrow keys to choose, then Tab to Submit answer.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: This activity has no motion or timed transition.

## `v1-screen` v1.0.0

Runs one validated v1 screen inside the v2 outcome boundary.

- Category: `construction`
- Supported goal operators: `activity-complete`
- Learning use: Compatibility-only; emitted by adaptScreenSequence and never authored in a course pack.
- Persistence: `none` — SceneRunner persists the v2 checkpoint after the original v1 screen reports completion.
- Lazy chunk budget: 150 KB gzip
- Studio preview fixtures: `adapter-contract`

### Props schema

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [
    "legacyLessonId",
    "screen",
    "index",
    "total"
  ],
  "properties": {
    "legacyLessonId": {
      "type": "string",
      "minLength": 1
    },
    "screen": {
      "type": "object"
    },
    "index": {
      "type": "integer",
      "minimum": 0
    },
    "total": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

### Accessibility contract

Keyboard: Use the original screen controls; its registered screen runner owns keyboard behaviour.

Focus starts at `first-control` and after outcome is `feedback`. Reduced motion: The original screen runner supplies its reduced-motion behaviour.
