# Circuits activity model contract

Status: implemented in `src/v2/circuit-model.ts` and registered as the `circuit`
0.1.1 laboratory activity. Six rendered episodes use its real controls and
readings behind the laboratory preview flag. See [activity contracts](ACTIVITIES.md).

This extends the same series/parallel reduction used by the legacy `circuit-sim`
with ideal switches and explicit open/unsupported outcomes. It is intentionally
bounded rather than presented as an unrestricted electronics simulator.

## Configuration and controls

One ideal DC supply from 0 to 24 V, ideal wires/switches, ohmic loads from 1 to 10,000
ohms, and recursive series/parallel trees. Groups have 1 to 8 children, the tree
at most 64 elements and depth 8. At least one resistor is required. All leaf IDs
are unique lowercase kebab-case. Unknown fields/types, wrong value types, non-finite
numbers and out-of-bounds configurations are rejected at the content/import boundary.

`setCircuitElement` is an immutable typed operation changing a named resistor's
resistance or a named switch's state. It rejects unknown IDs, type mismatches and
values outside the model. The activity layer's optional source settings also pass
through the bounded configuration parser. Observation windows are positive authored
durations from a finite list (at most 3,600 s), not simulated transients. Content
cannot supply JavaScript or arbitrary predicates.

## Semantics

Series resistance is the sum; parallel resistance is the reciprocal conductance sum.
A closed switch has zero resistance; an open switch interrupts a path. An intact
parallel branch still works when another is opened. Current is charge flow rate;
components transfer energy, not consume charge. Source current is determined by the
whole circuit at the specified voltage, not a constant battery current.
For a steady observation interval, passing charge is `I × t` and transferred
energy is `P × t`; the activity shows these in C and J without changing the
static circuit model.

A solved result contains source current, equivalent resistance, power and per-element
current/potential-difference/power in A, ohms, V and W. An open circuit's equivalent
resistance is deliberately represented as null; current and source power are zero.
Do not format that null as zero resistance. Multiple series breaks can leave individual
open-switch potential differences indeterminate: null. Label them as indeterminate,
not as zero V. Floating absolute node potential is not an output of this model.

Ideal short circuits and zero-resistance parallel paths return an explicit unsupported
result. Even where a unique current could be computed with an upstream resistor,
these topologies are deliberately outside the launch model; no plausible-looking
answer is fabricated. This conservative boundary can be extended with separate tests.

No capacitors, AC, transient timing, semiconductor behavior, thermal variation,
internal source resistance, geometry-dependent resistivity or arbitrary junction
graphs are simulated. Resistor power can stand in for an ideal heater/load indicator;
it must not be labelled realistic LED/bulb brightness without a validated device model.

## Verification

The authored tests use separately calculated numeric examples, conservation checks,
open/floating cases, wrong imports and bounded controls. That is author verification,
not an independent reviewer. An independent agent reviewed the model and compared 333 supported generated trees
against a separate nodal graph calculation (500 generated inputs: 107 unsupported
shorts and 60 resistor-free inputs). Known readings agreed within 1e-8 and power
was conserved. The review found two issues: zero supply did not justify definite
voltage across multiple breaks, and sparse programmatic arrays bypassed validation.
Both are corrected with regression coverage. The retained report distinguishes this
model review from rendered interaction or human learning evidence.

Example: 4 ohms in series with (6 ohms parallel 3 ohms) has 6 ohms total. At 12 V,
the source supplies 2 A; the 4 ohm load drops 8 V. The branches see 4 V and carry
2/3 A and 4/3 A. Their currents sum to 2 A and all load powers sum to 24 W.

The shared pack validator checks reachable goals against an authored solution
witness and finite allowed controls. Production-browser verification is recorded
separately; pure-model tests do not certify interaction quality or human learning.
