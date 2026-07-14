// Build-time semantic validation for Experience Runtime v2 (B2 / #37).
// JSON Schema owns shape; this module owns relationships that span a pack and
// its graph files. It deliberately has no runtime/progress dependencies.

import fs from 'node:fs';
import path from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

function readJson(file, reporter) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    reporter.atFile(file, `invalid JSON: ${error.message}`);
    return undefined;
  }
}

function findFiles(dir, name) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findFiles(file, name));
    else if (entry.isFile() && entry.name === name) found.push(file);
  }
  return found.sort((a, b) => a.localeCompare(b));
}

function makeValidators(repoRoot) {
  const schema = (name) =>
    JSON.parse(fs.readFileSync(path.join(repoRoot, 'schemas', name), 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true, discriminator: true });
  addFormats(ajv);
  return {
    pack: ajv.compile(schema('course-pack.schema.json')),
    graph: ajv.compile(schema('experience-graph.schema.json')),
    index: ajv.compile(schema('experience-index.schema.json')),
    search: ajv.compile(schema('experience-search-index.schema.json')),
    reviewCatalogue: ajv.compile(schema('review-catalogue.schema.json')),
    capabilities: readJson(path.join(repoRoot, 'schemas', 'experience-capabilities.json'), {
      atFile(file, message) {
        throw new Error(`${file}: ${message}`);
      },
    }),
  };
}

function pointer(report, file, value, message) {
  report.atPointer(file, value, message);
}

function duplicateIds(items, field, file, base, reporter) {
  const seen = new Set();
  items.forEach((item, i) => {
    if (seen.has(item[field]))
      pointer(reporter, file, `${base}/${i}/${field}`, `duplicate ${field} "${item[field]}"`);
    seen.add(item[field]);
  });
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value);
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
}

/** Does an installed stable version satisfy a minimum capability requirement? */
function satisfiesVersion(available, required) {
  const a = parseVersion(available);
  const r = parseVersion(required);
  if (!a || !r || a.major !== r.major || a.prerelease || r.prerelease)
    return available === required;
  return a.minor > r.minor || (a.minor === r.minor && a.patch >= r.patch);
}

function pathType(declarations, statePath) {
  return declarations.find((declaration) => declaration.path === statePath)?.type;
}

function valueMatches(value, type) {
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'number') return typeof value === 'number';
  if (type === 'string') return typeof value === 'string';
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function checkStatePath(file, value, declarations, pointerValue, reporter, use) {
  const type = pathType(declarations, value);
  if (!type)
    pointer(reporter, file, pointerValue, `${use} references undeclared state path "${value}"`);
  return type;
}

function checkGoal(goal, file, base, declarations, reporter) {
  if (goal.operator === 'activity-complete') return;
  const type = checkStatePath(
    file,
    goal.path,
    declarations,
    `${base}/path`,
    reporter,
    `goal "${goal.operator}"`,
  );
  if (!type) return;
  if (goal.operator === 'equals' && !valueMatches(goal.value, type)) {
    pointer(reporter, file, `${base}/value`, `goal value must match ${type} state "${goal.path}"`);
  }
  if (goal.operator === 'in-range' && type !== 'number') {
    pointer(reporter, file, `${base}/path`, 'in-range goals require a number state path');
  }
  if (goal.operator === 'set-equals' && type !== 'string-set') {
    pointer(reporter, file, `${base}/path`, 'set-equals goals require a string-set state path');
  }
  if (goal.operator === 'regex-match' && type !== 'string') {
    pointer(reporter, file, `${base}/path`, 'regex-match goals require a string state path');
  }
}

function checkCondition(condition, file, base, declarations, skills, reporter) {
  switch (condition.operator) {
    case 'state-equals': {
      const type = checkStatePath(
        file,
        condition.path,
        declarations,
        `${base}/path`,
        reporter,
        'condition',
      );
      if (type && !valueMatches(condition.value, type))
        pointer(
          reporter,
          file,
          `${base}/value`,
          `condition value must match ${type} state "${condition.path}"`,
        );
      break;
    }
    case 'state-in': {
      const type = checkStatePath(
        file,
        condition.path,
        declarations,
        `${base}/path`,
        reporter,
        'condition',
      );
      // `state-in` tests a scalar against a scalar state, but against the
      // members of a string-set state (rather than an array value).
      const matches =
        type === 'string-set'
          ? condition.values.every((value) => typeof value === 'string')
          : condition.values.every((value) => valueMatches(value, type));
      if (type && !matches)
        pointer(
          reporter,
          file,
          `${base}/values`,
          `condition values must match ${type} state "${condition.path}"`,
        );
      break;
    }
    case 'mastery-band':
      if (!skills.has(condition.skillId))
        pointer(
          reporter,
          file,
          `${base}/skillId`,
          `mastery condition references unknown skill "${condition.skillId}"`,
        );
      break;
    case 'all':
    case 'any':
      condition.conditions.forEach((child, i) =>
        checkCondition(child, file, `${base}/conditions/${i}`, declarations, skills, reporter),
      );
      break;
    case 'not':
      checkCondition(
        condition.condition,
        file,
        `${base}/condition`,
        declarations,
        skills,
        reporter,
      );
      break;
    // outcome-equals is intentionally not a state declaration: C1 supplies
    // the activity-output contract which can validate its path.
    default:
      break;
  }
}

function checkEffects(effects, file, base, declarations, skills, reporter) {
  effects.forEach((effect, i) => {
    const at = `${base}/${i}`;
    if (effect.operator === 'emit-evidence' && !skills.has(effect.skillId)) {
      pointer(
        reporter,
        file,
        `${at}/skillId`,
        `evidence references unknown skill "${effect.skillId}"`,
      );
    }
    if (!['set', 'increment', 'append'].includes(effect.operator)) return;
    const type = checkStatePath(
      file,
      effect.path,
      declarations,
      `${at}/path`,
      reporter,
      `effect "${effect.operator}"`,
    );
    if (!type) return;
    if (effect.operator === 'set' && !valueMatches(effect.value, type)) {
      pointer(reporter, file, `${at}/value`, `set value must match ${type} state "${effect.path}"`);
    }
    if (effect.operator === 'increment' && type !== 'number')
      pointer(reporter, file, `${at}/path`, 'increment effects require a number state path');
    if (effect.operator === 'append' && type !== 'string-set')
      pointer(reporter, file, `${at}/path`, 'append effects require a string-set state path');
  });
}

function checkActivity(
  activity,
  file,
  base,
  requiredCapabilities,
  installedCapabilities,
  reporter,
) {
  const declared = requiredCapabilities.get(activity.key);
  if (!declared) {
    pointer(
      reporter,
      file,
      `${base}/key`,
      `activity capability "${activity.key}" is not declared by this course pack`,
    );
    return;
  }
  if (!satisfiesVersion(declared, activity.version)) {
    pointer(
      reporter,
      file,
      `${base}/version`,
      `activity requires ${activity.key}@${activity.version}, but the pack only declares ${declared}`,
    );
  }
  const installed = installedCapabilities[activity.key];
  if (!installed || !satisfiesVersion(installed, activity.version)) {
    pointer(
      reporter,
      file,
      `${base}/version`,
      `unavailable capability ${activity.key}@${activity.version}`,
    );
  }
}

function checkPackCapabilities(pack, file, installedCapabilities, reporter) {
  duplicateIds(pack.engineCapabilities, 'key', file, '/engineCapabilities', reporter);
  pack.engineCapabilities.forEach((capability, i) => {
    const installed = installedCapabilities[capability.key];
    if (!installed || !satisfiesVersion(installed, capability.version)) {
      pointer(
        reporter,
        file,
        `/engineCapabilities/${i}/version`,
        `unavailable capability ${capability.key}@${capability.version}`,
      );
    }
  });
}

/**
 * Prerequisites are authored as a DAG. JSON Schema can validate each local
 * id, but only this pack-level pass can reject a cycle. Traverse lexical skill
 * ids so a malformed pack reports the same closing edge on every build.
 */
function checkSkillPrerequisiteCycles(pack, file, reporter) {
  const firstIndexById = new Map();
  pack.skills.forEach((skill, index) => {
    if (!firstIndexById.has(skill.id)) firstIndexById.set(skill.id, index);
  });
  const state = new Map();
  const stack = [];
  const reportedCycles = new Set();

  const visit = (skillId) => {
    const current = state.get(skillId);
    if (current === 'visited') return;
    if (current === 'visiting') return;
    state.set(skillId, 'visiting');
    stack.push(skillId);
    const skillIndex = firstIndexById.get(skillId);
    const skill = pack.skills[skillIndex];
    skill.prerequisiteIds.forEach((prerequisiteId, prerequisiteIndex) => {
      // Unknown/self prerequisites receive their own precise diagnostics above;
      // they cannot usefully participate in a well-defined cycle.
      if (!firstIndexById.has(prerequisiteId) || prerequisiteId === skillId) return;
      if (state.get(prerequisiteId) === 'visiting') {
        const start = stack.indexOf(prerequisiteId);
        const cycle = [...stack.slice(start), prerequisiteId];
        const key = [...cycle.slice(0, -1)].sort((a, b) => a.localeCompare(b)).join('\u0000');
        if (!reportedCycles.has(key)) {
          reportedCycles.add(key);
          pointer(
            reporter,
            file,
            `/skills/${skillIndex}/prerequisiteIds/${prerequisiteIndex}`,
            `cyclic skill prerequisites: ${cycle.join(' -> ')}`,
          );
        }
        return;
      }
      visit(prerequisiteId);
    });
    stack.pop();
    state.set(skillId, 'visited');
  };

  [...firstIndexById.keys()].sort((a, b) => a.localeCompare(b)).forEach(visit);
}

function checkPackSemantics(pack, file, reporter, installedCapabilities) {
  duplicateIds(pack.state.declarations, 'path', file, '/state/declarations', reporter);
  duplicateIds(pack.skills, 'id', file, '/skills', reporter);
  duplicateIds(pack.experiences, 'id', file, '/experiences', reporter);
  duplicateIds(pack.experiences, 'file', file, '/experiences', reporter);
  duplicateIds(pack.campaigns, 'id', file, '/campaigns', reporter);
  duplicateIds(pack.assets, 'id', file, '/assets', reporter);
  duplicateIds(pack.assets, 'path', file, '/assets', reporter);
  duplicateIds(pack.reviewItems, 'id', file, '/reviewItems', reporter);
  checkPackCapabilities(pack, file, installedCapabilities, reporter);

  const skills = new Set(pack.skills.map((skill) => skill.id));
  pack.skills.forEach((skill, i) =>
    skill.prerequisiteIds.forEach((id, j) => {
      if (!skills.has(id))
        pointer(
          reporter,
          file,
          `/skills/${i}/prerequisiteIds/${j}`,
          `unknown prerequisite skill "${id}"`,
        );
      if (id === skill.id)
        pointer(
          reporter,
          file,
          `/skills/${i}/prerequisiteIds/${j}`,
          'a skill cannot be its own prerequisite',
        );
    }),
  );
  checkSkillPrerequisiteCycles(pack, file, reporter);
  const experienceIds = new Set(pack.experiences.map((experience) => experience.id));
  const campaignIds = new Set(pack.campaigns.map((campaign) => campaign.id));
  pack.campaigns.forEach((campaign, i) => {
    if (!campaign.experienceIds.includes(campaign.entryExperienceId))
      pointer(
        reporter,
        file,
        `/campaigns/${i}/entryExperienceId`,
        'campaign entryExperienceId must be one of its experienceIds',
      );
    campaign.experienceIds.forEach((id, j) => {
      if (!experienceIds.has(id))
        pointer(reporter, file, `/campaigns/${i}/experienceIds/${j}`, `unknown experience "${id}"`);
    });
    campaign.recommendedNextCampaignIds?.forEach((id, j) => {
      if (!campaignIds.has(id))
        pointer(
          reporter,
          file,
          `/campaigns/${i}/recommendedNextCampaignIds/${j}`,
          `unknown recommended campaign "${id}"`,
        );
    });
  });
  pack.state.declarations.forEach((declaration, i) => {
    const at = `/state/declarations/${i}`;
    if (declaration.type === 'number') {
      if (
        declaration.minimum !== undefined &&
        declaration.maximum !== undefined &&
        declaration.minimum > declaration.maximum
      )
        pointer(reporter, file, `${at}/minimum`, 'minimum must not exceed maximum');
      if (declaration.minimum !== undefined && declaration.default < declaration.minimum)
        pointer(reporter, file, `${at}/default`, 'default is below minimum');
      if (declaration.maximum !== undefined && declaration.default > declaration.maximum)
        pointer(reporter, file, `${at}/default`, 'default is above maximum');
    }
    if (
      declaration.type === 'string' &&
      declaration.enum &&
      !declaration.enum.includes(declaration.default)
    )
      pointer(reporter, file, `${at}/default`, 'default must be one of enum values');
  });
  const requirements = new Map(
    pack.engineCapabilities.map((capability) => [capability.key, capability.version]),
  );
  pack.reviewItems.forEach((item, i) => {
    item.skillIds.forEach((id, j) => {
      if (!skills.has(id))
        pointer(
          reporter,
          file,
          `/reviewItems/${i}/skillIds/${j}`,
          `review item references unknown skill "${id}"`,
        );
    });
    checkActivity(
      item.activity,
      file,
      `/reviewItems/${i}/activity`,
      requirements,
      installedCapabilities,
      reporter,
    );
    checkGoal(item.goal, file, `/reviewItems/${i}/goal`, pack.state.declarations, reporter);
  });
  return { skills, experienceIds, requirements };
}

function textForPresentation(presentation) {
  return [
    presentation.title,
    presentation.speaker,
    presentation.body,
    presentation.alt,
    presentation.caption,
  ]
    .filter(Boolean)
    .join('\n');
}

function checkGraph(graph, graphFile, pack, packFile, facts, reporter, installedCapabilities) {
  if (graph.packId !== pack.id)
    pointer(
      reporter,
      graphFile,
      '/packId',
      `graph packId "${graph.packId}" does not match pack id "${pack.id}" (${reporter.rel(packFile)})`,
    );
  if (graph.stateVersion !== pack.state.version)
    pointer(
      reporter,
      graphFile,
      '/stateVersion',
      `graph stateVersion "${graph.stateVersion}" does not match pack state version "${pack.state.version}"`,
    );
  duplicateIds(graph.nodes, 'id', graphFile, '/nodes', reporter);
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  if (!nodes.has(graph.entryNodeId))
    pointer(
      reporter,
      graphFile,
      '/entryNodeId',
      `entry node "${graph.entryNodeId}" does not exist`,
    );
  const assetIds = new Set(pack.assets.map((asset) => asset.id));
  const reviewIds = new Set(pack.reviewItems.map((item) => item.id));
  const outgoing = new Map(graph.nodes.map((node) => [node.id, []]));
  graph.nodes.forEach((node, i) => {
    const at = `/nodes/${i}`;
    if (node.presentation.assetId && !assetIds.has(node.presentation.assetId))
      pointer(
        reporter,
        graphFile,
        `${at}/presentation/assetId`,
        `unknown asset "${node.presentation.assetId}"`,
      );
    checkEffects(
      node.effects ?? [],
      graphFile,
      `${at}/effects`,
      pack.state.declarations,
      facts.skills,
      reporter,
    );
    if (node.kind === 'ending') {
      if (
        node.termination.nextExperienceId &&
        !facts.experienceIds.has(node.termination.nextExperienceId)
      )
        pointer(
          reporter,
          graphFile,
          `${at}/termination/nextExperienceId`,
          `unknown next experience "${node.termination.nextExperienceId}"`,
        );
      return;
    }
    checkActivity(
      node.activity,
      graphFile,
      `${at}/activity`,
      facts.requirements,
      installedCapabilities,
      reporter,
    );
    checkGoal(node.goal, graphFile, `${at}/goal`, pack.state.declarations, reporter);
    if (node.review && !reviewIds.has(node.review.itemId))
      pointer(
        reporter,
        graphFile,
        `${at}/review/itemId`,
        `unknown review item "${node.review.itemId}"`,
      );
    const transitions = [
      ...node.transitions.branches.map((branch, branchIndex) => ({
        to: branch.to,
        pointer: `${at}/transitions/branches/${branchIndex}/to`,
      })),
      { to: node.transitions.fallback.to, pointer: `${at}/transitions/fallback/to` },
    ];
    node.transitions.branches.forEach((branch, branchIndex) =>
      checkCondition(
        branch.when,
        graphFile,
        `${at}/transitions/branches/${branchIndex}/when`,
        pack.state.declarations,
        facts.skills,
        reporter,
      ),
    );
    for (const transition of transitions) {
      if (!nodes.has(transition.to))
        pointer(
          reporter,
          graphFile,
          transition.pointer,
          `destination node "${transition.to}" does not exist`,
        );
      else outgoing.get(node.id).push(transition.to);
    }
  });
  const reached = new Set();
  const visit = (id) => {
    if (reached.has(id)) return;
    reached.add(id);
    (outgoing.get(id) ?? []).forEach(visit);
  };
  if (nodes.has(graph.entryNodeId)) visit(graph.entryNodeId);
  graph.nodes.forEach((node, i) => {
    if (!reached.has(node.id))
      pointer(
        reporter,
        graphFile,
        `/nodes/${i}/id`,
        `unreachable node "${node.id}" from entryNodeId "${graph.entryNodeId}"`,
      );
  });
  const reverse = new Map(graph.nodes.map((node) => [node.id, []]));
  outgoing.forEach((destinations, source) =>
    destinations.forEach((destination) => reverse.get(destination)?.push(source)),
  );
  const terminating = new Set();
  const reverseVisit = (id) => {
    if (terminating.has(id)) return;
    terminating.add(id);
    (reverse.get(id) ?? []).forEach(reverseVisit);
  };
  graph.nodes.filter((node) => node.kind === 'ending').forEach((node) => reverseVisit(node.id));
  graph.nodes.forEach((node, i) => {
    if (reached.has(node.id) && node.kind === 'scene' && !terminating.has(node.id)) {
      pointer(
        reporter,
        graphFile,
        `/nodes/${i}/transitions`,
        `node "${node.id}" cannot reach an ending (mandatory non-terminating cycle)`,
      );
    }
  });
}

function sortedCopy(value) {
  return [...value].sort((a, b) => a.id.localeCompare(b.id));
}

function buildIndexes(packs) {
  const indexPacks = [];
  const searchEntries = [];
  const reviewItems = [];
  for (const { pack, graphs } of [...packs].sort((a, b) => a.pack.id.localeCompare(b.pack.id))) {
    indexPacks.push({
      id: pack.id,
      title: pack.title,
      description: pack.description,
      audience: pack.audience,
      taxonomy: pack.taxonomy,
      estimatedMinutes: pack.estimatedMinutes,
      campaigns: sortedCopy(pack.campaigns).map(
        ({
          id,
          title,
          description,
          entryExperienceId,
          experienceIds,
          recommendedNextCampaignIds,
        }) => ({
          id,
          title,
          ...(description ? { description } : {}),
          entryExperienceId,
          experienceIds: [...experienceIds].sort(),
          ...(recommendedNextCampaignIds
            ? { recommendedNextCampaignIds: [...recommendedNextCampaignIds].sort() }
            : {}),
        }),
      ),
      experiences: sortedCopy(pack.experiences).map(({ id, title, estimatedMinutes }) => ({
        id,
        title,
        estimatedMinutes,
      })),
    });
    const add = (entry) => searchEntries.push(entry);
    add({
      kind: 'pack',
      packId: pack.id,
      id: pack.id,
      title: pack.title,
      text: [
        pack.description,
        pack.audience.summary,
        ...(pack.audience.prerequisites ?? []),
        ...pack.taxonomy.subjects,
        ...pack.taxonomy.tags,
      ].join('\n'),
    });
    pack.campaigns.forEach((campaign) =>
      add({
        kind: 'campaign',
        packId: pack.id,
        id: campaign.id,
        title: campaign.title,
        text: campaign.description ?? '',
      }),
    );
    pack.reviewItems.forEach((item) => {
      reviewItems.push({ ownerId: `v2:${pack.id}`, contentVersion: pack.version, ...item });
      // Search only learner-visible setup/prompt. Feedback and solutions must
      // never appear in a result excerpt before the learner attempts the item.
      add({
        kind: 'review',
        packId: pack.id,
        id: item.id,
        title: item.title,
        text: [item.standaloneContext, item.prompt].join('\n'),
      });
    });
    graphs.forEach((graph) =>
      graph.nodes.forEach((node) => {
        // Presentation is authored learner-visible text. Do not index feedback,
        // hidden branches, answers, or hints: search must not leak a solution.
        add({
          kind: node.kind,
          packId: pack.id,
          experienceId: graph.id,
          id: node.id,
          title: node.presentation.title ?? graph.id,
          text: textForPresentation(node.presentation),
        });
      }),
    );
  }
  searchEntries.sort((a, b) =>
    [a.packId, a.experienceId ?? '', a.kind, a.id]
      .join('\u0000')
      .localeCompare([b.packId, b.experienceId ?? '', b.kind, b.id].join('\u0000')),
  );
  reviewItems.sort((a, b) =>
    `${a.ownerId}\u0000${a.id}`.localeCompare(`${b.ownerId}\u0000${b.id}`),
  );
  return {
    index: { schemaVersion: 1, packs: indexPacks },
    search: { schemaVersion: 1, entries: searchEntries },
    reviews: { schemaVersion: 1, items: reviewItems },
  };
}

/** Validate all public/content/v2/**\/course-pack.json files and return stable indexes. */
export function validateExperienceV2(root, repoRoot, reporter) {
  const validators = makeValidators(repoRoot);
  const packs = [];
  for (const packFile of findFiles(path.join(root, 'v2'), 'course-pack.json')) {
    const pack = readJson(packFile, reporter);
    if (!pack) continue;
    if (!validators.pack(pack)) {
      reporter.schemaErrors(packFile, validators.pack.errors);
      continue;
    }
    const facts = checkPackSemantics(pack, packFile, reporter, validators.capabilities);
    const graphs = [];
    const packDir = path.dirname(packFile);
    pack.experiences.forEach((experience, i) => {
      const graphFile = path.resolve(packDir, experience.file);
      if (!graphFile.startsWith(`${packDir}${path.sep}`) || !fs.existsSync(graphFile)) {
        pointer(
          reporter,
          packFile,
          `/experiences/${i}/file`,
          `experience file "${experience.file}" does not exist in the pack`,
        );
        return;
      }
      const graph = readJson(graphFile, reporter);
      if (!graph) return;
      if (!validators.graph(graph)) {
        reporter.schemaErrors(graphFile, validators.graph.errors);
        return;
      }
      if (graph.id !== experience.id)
        pointer(
          reporter,
          graphFile,
          '/id',
          `graph id "${graph.id}" does not match declared experience id "${experience.id}"`,
        );
      checkGraph(graph, graphFile, pack, packFile, facts, reporter, validators.capabilities);
      graphs.push(graph);
    });
    pack.assets.forEach((asset, i) => {
      const assetFile = path.resolve(packDir, asset.path);
      if (!assetFile.startsWith(`${packDir}${path.sep}`) || !fs.existsSync(assetFile))
        pointer(
          reporter,
          packFile,
          `/assets/${i}/path`,
          `asset "${asset.path}" does not exist in the pack`,
        );
    });
    packs.push({ pack, graphs });
  }
  const result = buildIndexes(packs);
  if (!validators.index(result.index))
    reporter.schemaErrors(path.join(root, 'experience-index.json'), validators.index.errors);
  if (!validators.search(result.search))
    reporter.schemaErrors(
      path.join(root, 'experience-search-index.json'),
      validators.search.errors,
    );
  if (!validators.reviewCatalogue(result.reviews))
    reporter.schemaErrors(
      path.join(root, 'review-catalogue.json'),
      validators.reviewCatalogue.errors,
    );
  return result;
}

export function emitExperienceIndexes(root, indexes) {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(
    path.join(root, 'experience-index.json'),
    `${JSON.stringify(indexes.index, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(root, 'experience-search-index.json'),
    `${JSON.stringify(indexes.search)}\n`,
  );
  fs.writeFileSync(
    path.join(root, 'review-catalogue.json'),
    `${JSON.stringify(indexes.reviews)}\n`,
  );
}
