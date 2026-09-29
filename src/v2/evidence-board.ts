export interface EvidenceBoardActivity {
  type: 'evidence-board';
  question: string;
  sources: {
    id: string;
    title: string;
    origin: string;
    date: string;
    order: number;
    kind: 'firsthand' | 'contemporary-report' | 'later-survey' | 'modern-synthesis';
    account: string;
    limit: string;
    referenceId: string;
    placeId?: string;
  }[];
  places?: { id: string; label: string; x: number; y: number }[];
  rubric: string[];
}

export function validateEvidenceBoard(activity: EvidenceBoardActivity, at: string, references: string[]) {
  const unique = (items: string[], label: string) => {
    if (new Set(items).size !== items.length) throw new Error(`${at}: duplicate ${label}`);
  };
  unique(activity.sources.map((source) => source.id), 'source');
  unique((activity.places ?? []).map((place) => place.id), 'place');
  if (activity.sources.length < 2 || activity.sources.length > 8)
    throw new Error(`${at}: evidence board needs 2–8 sources`);
  if (activity.rubric.length < 2 || activity.rubric.length > 5)
    throw new Error(`${at}: evidence board needs 2–5 review prompts`);
  for (const source of activity.sources) {
    if (!references.includes(source.referenceId))
      throw new Error(`${at}: unknown reference ${source.referenceId}`);
    if (source.placeId && !activity.places?.some((place) => place.id === source.placeId))
      throw new Error(`${at}: unknown place ${source.placeId}`);
    if (!Number.isSafeInteger(source.order) || source.order < 0 || source.order > 10000)
      throw new Error(`${at}: invalid source order`);
  }
  for (const place of activity.places ?? [])
    if (![place.x, place.y].every((v) => Number.isFinite(v) && v >= 0 && v <= 100))
      throw new Error(`${at}: map coordinates must be percentages`);
}
