# Protocol fixtures (bridge contract — SRS §6.3–6.4, §11)

These golden JSON files are the **single shared definition** of the host↔worker
wire format. They are asserted from **both sides**:

- **TypeScript** (`src/python/*.test.ts`): each fixture parses into the
  `protocol.ts` / `component-tree.ts` types, and component-tree fixtures render
  through the `TreeRenderer` without an unknown-type/unknown-op card.
- **Python** (`python/tests/test_protocol_fixtures.py`): `learnsdk._bridge`
  produces the same envelope/tree for the equivalent construction, and parses
  each fixture back.

If the two implementations ever drift, one side's assertion fails.

## Conventions

- Envelope shape is exactly `{ v, id, type, payload, replyTo? }` (§6.3). Fixture
  `id`/`replyTo` use fixed placeholder UUIDs (`00000000-0000-0000-0000-0000000000NN`)
  so files are byte-stable; real runtime ids are random and are normalised away
  before comparison.
- **Handler tokens are deterministic per render**: `_bridge` assigns `h0, h1, …`
  in render (depth-first, document) order. This makes tree fixtures exact. The
  token namespace resets each render (§6.4 rule 2: tokens regenerated each render).
- All values are JSON-safe (§6.1). numpy scalars/arrays are converted via
  `.item()` / `.tolist()` before they reach a fixture.

## Files

`manifest.json` lists every fixture with its `direction` (`h2w` | `w2h` | `tree`)
and a one-line description. Both test suites iterate the manifest so adding a
fixture automatically extends both sides.
