# First Experience Runtime v2 vertical slice: Relay Beacon

- Status: Selected for the first slice, pending implementation
- Candidate: `physics/alevel-physics/electricity-dc`
- Audience: A-level Physics, LearnLab pedagogy Setting B
- References: `docs/EXPERIENCE_RUNTIME_V2_PLAN.md` sections 5, 6, 7, and 13; `docs/EXPERIENCE_RUNTIME_V2_EVALUATION.md`

## Selection rationale

The plan asks for a simulation-rich chapter where the runtime earns its abstractions through a
real story, branch, and delayed review item. Two existing candidates were compared:

| Candidate | Evidence in the repo | V2 fit | Decision |
| --- | --- | --- | --- |
| `maths/alevel-mechanics/kinematics-suvat` | Three lessons, five clear objectives, and a persistent projectile Python simulation with angle, speed, path, and best range | Strong experiment-and-infer mechanic and excellent visual feedback; branching consequences are less natural without adding a separate design problem | Keep as the next mechanics candidate |
| `physics/alevel-physics/electricity-dc` | Three lessons, five objectives, 130 minutes, a persistent potential-divider explorer, and scope for series/parallel, power, EMF, internal resistance, and sensor design | One chapter naturally supports diagnosis, controlled experimentation, and design trade-offs; circuit state can visibly affect a beacon and reconverge after different repair strategies | **Selected** |

The selection is also specification-safe. AQA explicitly includes current, resistance, series and
parallel circuits, conservation of charge/energy, potential dividers, variable resistors,
thermistors/LDRs, and internal resistance in its electricity content. Pearson’s specification
likewise requires charge and energy conservation, series/parallel resistance, potential dividers,
variable resistance, and emf/internal resistance. Pearson also provides a solar-powered DC-circuit
context, which is a useful real-world frame without importing decorative story.

## Throughline and audience calibration

The learner is repairing a remote weather beacon after a storm. Its battery still has charge, but
the beacon is dim and its light sensor reports nonsense. Every scene changes or diagnoses the
beacon's actual circuit state; the setting is deleted if it does not carry a current, pd,
resistance, power, or energy decision.

This is Setting B: a persistent problem frame, concise prose, one full worked example followed by
one faded example, and no named characters or comic detours. Each scene opens with a prediction or
action, provides elaborated feedback, and closes the relevant misconception before the next
choice.

## Learning objectives and prerequisites

The slice retains the module's existing scope rather than inventing a second electricity course.
By the end, a learner should be able to:

1. distinguish current, potential difference, and resistance, and use `V = IR` and `P = VI` with
   correct units;
2. explain series and parallel behaviour using conservation of charge and energy, not the idea
   that current is used up;
3. predict, test, and calculate a potential-divider output when `Vin`, `R1`, or `R2` changes;
4. diagnose the effect of internal resistance and choose a circuit design that meets an output
   target within a power budget.

Prerequisite: the existing module prerequisite `measurements-and-uncertainty`. The slice does not
assume prior completion of another electricity module and does not extend into capacitors,
transient circuits, or electronics beyond the selected module's existing objectives.

## Experience graph brief

The node names below are stable planning identifiers, not the final B1 schema.

| Node | Problem/action | Reusable mechanic | Objective evidence | Persistent state/effect | Branching |
| --- | --- | --- | --- | --- | --- |
| `beacon-brief` | Predict why the beacon dims when a second lamp is connected | Commit/prediction | Distinguishes current, pd, and resistance | `prediction` recorded; unlocks circuit inspection | Wrong prediction receives a diagnostic explanation, not a penalty |
| `fault-isolation` | Inspect a damaged series/parallel layout and identify the failed path | Diagnose-and-repair | Uses conservation and topology to explain current/pd | `faultFound`, `diagnosticConfidence`, `repairAttempts` | Correct diagnosis opens both design routes; an incorrect route shows the symptom and returns to the same diagnosis milestone |
| `divider-lab` | Vary `Vin`, `R1`, and `R2`; commit a predicted `Vout`, then test it | Experiment-and-infer | Derives and applies potential-divider behaviour | `observations[]`, `dividerRuleUnlocked`, `bestCalibration` | Learner can vary the supply first or the resistor ratio first; both reconverge on the inferred rule |
| `beacon-design` | Choose a stable fixed divider or an adaptive LDR-style divider under a power budget | Design-under-constraints | Selects a design and justifies the trade-off | `sensorType`, `powerBudgetRemaining`, `outputTarget` | The fixed and adaptive routes have different consequences and feedback, then reconverge at `designValidated` |
| `terminal-pd` | Explain why the real battery output falls under load and retest the beacon | Faded retry/repair | Uses `epsilon = I(R + r)` and `V = epsilon - Ir` | `internalResistanceExplained`, `beaconRestored` | A missed explanation sends the learner to a fuller worked example; the mastery milestone is shared |
| `relay-review` | Complete a standalone, context-light divider transfer item the next day | Delayed review | Transfers the divider relationship to fresh values | Emits review evidence with content version | No story branch; item must render independently |

The branch is meaningful because it changes the world meter and the next test: the fixed design
preserves a stable output, while the adaptive design trades output stability for sensor response.
The branches reconverge only after the learner has shown the same mastery milestone: calculate,
test, and explain the chosen divider under its constraint.

## Misconception map

These are targets for branch feedback and prediction hooks, not arbitrary distractors:

- **Current is used up** as it passes through a series component. The correction is charge
  conservation: the same current flows through a single series path.
- **A battery supplies a fixed current** independent of the circuit. The correction is that the
  current depends on the whole circuit and its resistance.
- **Voltage flows** or is the same thing as current. The correction is potential difference as
  energy transferred per unit charge.
- **Series means components simply touch; parallel means components look side-by-side.** The
  correction is node/topology reasoning: parallel components share two nodes and therefore pd;
  series components share the same path and current.
- **The divider output is always half the supply.** The correction is the resistor ratio
  `Vout = Vin R2 / (R1 + R2)`.
- **The battery's emf is always the terminal pd.** The correction is the internal drop `Ir` under
  load.

The circuits study used here reports that learners often treat the battery as a constant current
source and assign current properties to voltage or resistance. The slice therefore uses
prediction, observation, and explanation together rather than relying on formula recall alone.

## Independently verified examples and goal tolerances

All values below were re-derived before inclusion. The final activity implementation must repeat
the same checks and must test that its goal windows are reachable by keyboard as well as pointer.

### Divider calibration

Given `Vin = 12 V`, `R1 = 8 kOhm`, and `R2 = 4 kOhm`:

```text
Rtotal = 8 + 4 = 12 kOhm
I = 12 V / 12 kOhm = 1.00 mA
Vout = 12 V * 4 / (8 + 4) = 4.00 V
```

Launch goal: `Vout` in `[3.9, 4.1] V`, with current shown in mA and the ratio explanation
required. The window is deliberately wider than the planned 0.5 kOhm slider step.

### Series/parallel diagnosis

For a 12 V supply with a 6 Ohm and 3 Ohm branch in parallel:

```text
1/Rtotal = 1/6 + 1/3 = 1/2, so Rtotal = 2 Ohm
Itotal = 12 / 2 = 6 A
I(6 Ohm) = 12 / 6 = 2 A
I(3 Ohm) = 12 / 3 = 4 A
```

The branch values provide a direct conservation check: `6 A = 2 A + 4 A`, while each branch
has the same 12 V pd.

### Internal resistance retest

For `epsilon = 12 V`, external `R = 5 Ohm`, and internal `r = 1 Ohm`:

```text
I = epsilon / (R + r) = 12 / 6 = 2 A
terminal pd = epsilon - Ir = 12 - (2)(1) = 10 V
```

The retest must distinguish emf from terminal pd and must not accept the no-internal-resistance
answer of 12 V as correct.

### Delayed review item

Standalone item: “A 9 V supply feeds `R1 = 6 kOhm` and `R2 = 3 kOhm` in series. What is the pd
across `R2`?” Answer: `3 V`, because `9 * 3 / (6 + 3) = 3`. A learner must supply the ratio,
not recognise the beacon story.

## Accessibility, assets, and narrative deletion

- Every circuit state has a text equivalent: component values, current, pd, resistance, target,
  and branch consequence appear in a labelled table or live region.
- All sliders and choices are keyboard-operable with visible focus; circuit topology is never
  communicated by colour alone.
- Canvas/diagram output has a concise accessible summary and an equivalent numeric route.
- State changes and feedback use polite announcements; reduced motion disables animated current
  flow and uses static state changes.
- The slice uses the existing potential-divider Python item as a reference fixture while the v2
  activity contract is built. No remote assets, hosted images, or runtime-generated story text are
  required.
- Deletion test: remove the storm/beacon sentence from any node. If the circuit decision,
  feedback, or state transition is unchanged, remove that sentence from the final content.

## Delayed-review and playtest plan

The review item above is delivered without the beacon context at 24 hours, 7 days, and 21 days.
The immediate lesson score, delayed retrieval, transfer, hint use, and voluntary next-review
choice use the A2 protocol. The slice cannot ship on completion rate alone.

## Research sources

- [AQA A-level Physics: Mechanics and materials](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/mechanics-and-materials)
- [AQA A-level Physics: Electricity](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/electricity)
- [Pearson Edexcel A-level Physics specification](https://qualifications.pearson.com/content/dam/pdf/A%20Level/Physics/2015/Specification%20and%20sample%20assessments/pearsonedexcel-alevel-physics-spec.pdf), especially the “Technology in Space” context and electricity requirements
- [Engelhardt and Beichner, Students' Understanding of Direct Current Resistive Electrical Circuits](https://arxiv.org/abs/physics/0304040)
- [Physical Review Physics Education Research: Student conceptual resources for understanding electric circuits](https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.20.020128)
- [ERIC record for simulation-supported projectile-motion misconception research](https://eric.ed.gov/?id=EJ1380369), retained as evidence for the mechanics comparison rather than copied into the selected slice
