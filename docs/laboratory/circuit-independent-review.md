# Independent bounded model review, 27 September 2026

Reviewer: separate agent `/root/circuit_model_review`, not the model author.
Scope: `src/v2/circuit-model.ts` and its tests, before a rendered activity.

The reviewer reported all seven initial tests passed and found two issues:

1. A zero source voltage with two series breaks still leaves the middle island
   floating. Without initial-charge assumptions, each open-switch drop can be
   indeterminate. The model incorrectly forced zero; now both return null.
2. Sparse programmatic arrays skipped validation through Array.map. The boundary
   now uses Array.from and rejects the missing element. JSON null was already rejected.

The author agreed, made both corrections, and added regression coverage. Eight
model tests and TypeScript passed afterwards. No UI or learning claim follows.

Separately implemented node/edge graph comparison: deterministic seed 93027,
500 bounded trees of depth at most 3, groups of 2–3 children, resistors 1–20 ohms,
random switch states and source 1–24 V. Reviewer reports 333 supported circuits
agreed with closed-switch union plus Gaussian nodal analysis within 1e-8 for known
resistor and open-switch voltages. Floating readings agreed with null. Currents
agreed with V/R and summed resistor power equalled source power. 107 shorted
configurations were unsupported and 60 resistor-free trees rejected.

The generated solver script itself was not delivered by the reviewer; these are
attributed reviewer results, not a committed reproducible random-test suite.
The reviewer's final report says no additional concrete defects were found.

Independent hand derivation: 18 V across 6 ohms + (12 || 4) ohms gives total
9 ohms, 2 A, drops 12/6 V, and powers 24 + 3 + 9 = 36 W. Opening the 12 ohm
branch leaves the 6 ohm load plus the intact parallel load; open-switch drop
is the branch voltage, dead resistor drop is zero. These supplement author checks.

This is independent model evidence only. Agent review is not human enjoyment,
retention, transfer, rendered accessibility or production reliability evidence.

## Runtime and persistence follow-up

The same separate reviewer inspected the first registered runtime, pack boundary,
replay, acquisition and local speech path. Seven concrete findings were corrected:
prototype-key scene/label handling, rollback imports erasing prior exposure, bounded
log restart exhaustion, overlapping time credits, stale stable-URL cache updates,
concurrent import/action writes, and speech fallback to a remote voice. Regressions
cover null-prototype scene memory, own-property label checks, exposure union, bounded
fresh archival, elapsed-time limits, hash-qualified version downloads and local voices.

The reviewer reran five requested files: 41 tests passed. Independent reproductions
found constructor-like IDs safe, invalid inherited labels rejected, rollback transfer
evidence non-independent, overlapping credits rejected and a fresh archive carrying
prior exposure. Source inspection confirmed atomic archive/replacement, import busy
locking, old-version cache descriptors and local voice selection. Acquisition and
speech tests use mocks; browser locking/archive and voice availability were source
review, not independently observed physical-device behaviour.

Author production playthroughs additionally exposed final-bundle checksum drift,
a first timer tick exceeding elapsed run time, and a duplicated Help focus effect
outside its component. These are author findings. Hashes now use final emitted disk
bytes, timer credits clamp to the run's start/last credit, and Help focus is scoped
inside the episode workspace. Browser evidence is retained separately.
