// Local authoring contracts. These are author inputs, never learner-executable code.
export const id = { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', maxLength: 64 };
const text = { type: 'string', minLength: 1, maxLength: 16000 };
const texts = { type: 'array', items: text, maxItems: 100 };
const object = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  additionalProperties: false,
  properties,
  required,
});
export const briefSchema = object(
  {
    schemaVersion: { const: 1 },
    title: text,
    subject: object({ id, title: text }),
    audience: text,
    level: text,
    outcomes: { ...texts, minItems: 1 },
    prerequisites: texts,
    scope: text,
    excluded: texts,
    curriculum: text,
    sources: texts,
    playConcept: text,
    decisions: texts,
    assumptions: texts,
    openQuestions: texts,
    delegated: {
      type: 'array',
      items: {
        enum: [
          'subject',
          'audience',
          'level',
          'outcomes',
          'prerequisites',
          'scope',
          'curriculum',
          'playConcept',
          'sources',
        ],
      },
      uniqueItems: true,
    },
  },
  ['schemaVersion'],
);
export const planSchema = object({
  schemaVersion: { const: 1 },
  courseId: id,
  episodes: {
    type: 'array',
    minItems: 1,
    maxItems: 100,
    items: object({
      id,
      title: text,
      estimatedMinutes: { type: 'integer', minimum: 1, maximum: 240 },
      outcomes: { ...texts, minItems: 1 },
      activity: text,
      assessment: text,
      prerequisites: { type: 'array', items: id, uniqueItems: true },
      optionalExperiments: texts,
      recovery: text,
    }),
  },
  traceability: {
    type: 'array',
    minItems: 1,
    items: object({
      outcome: text,
      episodes: { type: 'array', minItems: 1, items: id, uniqueItems: true },
      independentEvidence: text,
      transfer: text,
      criterion: text,
    }),
  },
  researchDecisions: {
    type: 'array',
    minItems: 1,
    items: object({
      decision: text,
      source: text,
      access: {
        enum: [
          'full-text',
          'abstract-only',
          'inaccessible',
          'design-hypothesis',
          'standard',
          'primary-source',
        ],
      },
      strength: text,
      limitations: text,
      validation: text,
    }),
  },
});

// Questions reflect unresolved *fields*. The agent handles subject-specific reasoning;
// this CLI does not pretend to infer a complete curriculum from free text.
export function questionsFor(brief, request) {
  const context = `${brief.title ?? request.slice(0, 100)} (${brief.subject?.title ?? 'the requested subject'})`;
  const questions = {
    title: `What should the course be called?`,
    subject: `Which subject identity and display name describe ${context}? A new subject is allowed.`,
    audience: `Who is ${context} for, and what can they already do?`,
    level: `What depth should ${context} reach? Use a descriptive level, including postgraduate or doctoral if appropriate.`,
    outcomes: `What should learners independently explain, predict, or do after ${context}?`,
    prerequisites: `Which knowledge does ${context} assume, and what bridging help is needed? An empty list is valid.`,
    scope: `What bounded material belongs in ${context}, and what is outside it?`,
    curriculum: `Does ${context} need a particular curriculum or professional standard? Use "none" if not.`,
    sources: `Which supplied or authoritative sources must inform ${context}? An empty list means the author must research them.`,
    playConcept: `What investigation or meaningful action could make ${context} worth returning to?`,
  };
  return Object.entries(questions)
    .filter(([field]) => brief[field] === undefined)
    .map(([field, question]) => ({
      field,
      question,
      delegated: brief.delegated?.includes(field) ?? false,
    }));
}

export function planningErrors(brief, plan) {
  const errors = [];
  const ids = plan.episodes.map((e) => e.id);
  if (new Set(ids).size !== ids.length) errors.push('episodes: duplicate id');
  for (const episode of plan.episodes) {
    for (const prereq of episode.prerequisites) {
      if (!ids.includes(prereq)) errors.push(`${episode.id}: missing prerequisite ${prereq}`);
      if (prereq === episode.id) errors.push(`${episode.id}: self prerequisite`);
    }
    for (const outcome of episode.outcomes) {
      if (!brief.outcomes.includes(outcome))
        errors.push(`${episode.id}: unknown outcome ${outcome}`);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const visit = (key) => {
    if (visiting.has(key)) {
      errors.push(`prerequisites: cycle at ${key}`);
      return;
    }
    if (visited.has(key)) return;
    visiting.add(key);
    for (const dep of plan.episodes.find((e) => e.id === key)?.prerequisites ?? []) visit(dep);
    visiting.delete(key);
    visited.add(key);
  };
  ids.forEach(visit);
  const traced = new Set();
  for (const row of plan.traceability) {
    if (!brief.outcomes.includes(row.outcome))
      errors.push(`traceability: unknown outcome ${row.outcome}`);
    if (traced.has(row.outcome)) errors.push(`traceability: duplicate outcome ${row.outcome}`);
    traced.add(row.outcome);
    for (const key of row.episodes) {
      if (!ids.includes(key)) errors.push(`traceability: missing episode ${key}`);
      else if (!plan.episodes.find((e) => e.id === key).outcomes.includes(row.outcome))
        errors.push(`traceability: ${key} does not teach ${row.outcome}`);
    }
  }
  for (const outcome of brief.outcomes) {
    if (!traced.has(outcome)) errors.push(`traceability: uncovered outcome ${outcome}`);
    if (!plan.episodes.some((e) => e.outcomes.includes(outcome)))
      errors.push(`episodes: untaught outcome ${outcome}`);
  }
  return errors;
}
