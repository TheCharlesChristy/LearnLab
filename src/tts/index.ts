// Public API of the read-aloud subsystem. Not a closed-set member (no
// widget/screen-type/question-type/directive registration) — an
// engine-owned, always-on capability like the celebration layer, working
// identically on legacy Markdown lessons and every screens-format screen
// without any content-authoring changes.

export { ReadAloudControl, type ReadAloudControlProps } from './ReadAloudControl';
export { useReadAloud, type ReadAloudStatus, type UseReadAloudResult } from './useReadAloud';
export { extractSpeakableContent, type SpeakableContent, type SpeakableSegment } from './extract-speakable-text';
export { humanizeLatex } from './humanize-latex';
