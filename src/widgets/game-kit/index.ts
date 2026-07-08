// Game-widget kit — shared building blocks for game-style native widgets.
// See docs/ARCHITECTURE.md "Building a new game widget" for the pattern this
// supports: GameShell for chrome, ../../lib/seeded-random for deterministic
// shuffling, LessonContext.getItemState/setItemState for any persisted state
// (Flashcards' D-012 precedent), and LessonContext.notifyEngagement on
// completion. Not itself a registered widget — see ../matching-pairs for the
// first consumer.

export { GameShell, type GameShellProps } from './GameShell';
export { hashStringFnv1a, mulberry32, shuffle } from '../../lib/seeded-random';
