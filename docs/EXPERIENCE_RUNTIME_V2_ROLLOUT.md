# Experience Runtime v2 rollout, capability negotiation, and rollback

- Status: Contract implemented; v2 routes remain disabled until the graph/runtime issues land
- References: `docs/ADR-001-experience-runtime-v2.md`, `SRS-LearnLab.md` section 14,
  `docs/EXPERIENCE_RUNTIME_V2_PLAN.md` sections 4, 7, 12, and 13

## Default boundary

The build-time flag `VITE_EXPERIENCE_RUNTIME_V2` controls the v2 opt-in. It is false unless the
literal value `true` or `1` is supplied. The current production build therefore keeps v1 as the
only learner route. The flag is read by `src/v2/rollout.ts`; it does not add a route or fetch a
pack by itself.

```text
VITE_EXPERIENCE_RUNTIME_V2=false   -> v1 routes/content remain active
VITE_EXPERIENCE_RUNTIME_V2=true    -> negotiation may select a supported v2 pack
```

An enabled flag is not sufficient on its own. A pack must also declare an integer format version
and a map of required capability keys to semantic minimum versions. The negotiation function
fails closed for malformed packs, unknown capabilities, unsupported versions, and unsupported
format versions.

## Negotiation decision table

| Condition | Decision | Learner-facing behaviour |
| --- | --- | --- |
| Flag disabled | `useV2: false`, reason `disabled` | Use the v1 route/content |
| Flag enabled and requirements supported | `useV2: true` | Mount the v2 route after the B1/C1 runtime exists |
| Pack malformed | `useV2: false`, reason `malformed-pack` | Bounded error; do not reinterpret as v1 |
| Format version unsupported | `useV2: false`, reason `unsupported-format` | Bounded error with supported version information |
| Capability key unknown | `useV2: false`, reason `unsupported-capability` | Bounded error naming the missing capability |
| Capability version too new | `useV2: false`, reason `unsupported-capability-version` | Bounded error naming required and available versions |

Only an explicit feature disable has an automatic v1 fallback. An unsupported pack is not silently
run through v1 because that could reinterpret state or content. A future adapter may provide a
safe v1 route, but it must be declared and tested rather than inferred.

## State and downgrade policy

Every v2 saved run must include:

- pack id and pack version;
- experience id and experience version;
- state-schema version;
- current node/checkpoint;
- event-log version and materialised-state version.

Disabling the flag stops new v2 entry but does not delete or rewrite saved v2 data. A user may
export the original data, resume it after the flag is restored, or use a specifically tested
adapter. A reader encountering a newer state version must preserve the original bytes and show an
actionable error; it must never coerce unknown fields into a v1 progress record. Any migration or
v1 downgrade must be a named, pure, tested function with a version-to-version test fixture.

## Rollout stages and health signals

1. **Contract-only:** flag off; unit tests and production-build fallback test run on every change.
2. **Schema/runtime alpha:** flag available only in local development and seeded fixtures; unknown
   capability and malformed-pack paths are required tests.
3. **Maintainer preview:** flag enabled in a local production build; explicit playtest export,
   accessibility, offline, resume, and CSP checks are required.
4. **Vertical-slice preview:** the selected Relay Beacon slice is enabled for labelled playtests;
   A2 delayed-learning and voluntary-continuation metrics are collected locally.
5. **Default decision:** v2 remains opt-in until the A2 ship/revise criteria, M3 gates, and the
   rollback test all pass. A positive completion rate alone cannot advance the stage.

Owner-visible health signals are local build/test outputs and explicit playtest exports only:

- capability negotiation counts by reason in the exported diagnostic ledger;
- fallback/error counts by pack and version;
- resume and duplicate-reward test outcomes;
- CSP/offline/storage/accessibility gate results;
- A2 first-action, delayed retrieval, transfer, and voluntary-return results.

No signal is sent to a server, and no learner identity is required.

## Test coverage

- `src/v2/rollout.test.ts` covers flag parsing, supported negotiation, malformed/unknown/newer
  capability failure, and the v1 fallback selector.
- `e2e/v2-rollout.spec.ts` runs against the production preview with the default flag off and proves
  that the v1 catalogue still renders and an unknown v2 path is bounded by the v1 not-found route.
- The B1/B3 runtime issues must extend the production suite with a real supported pack, a disabled
  flag, an unsupported capability, a saved-state downgrade, and a resume-after-rollback fixture.
