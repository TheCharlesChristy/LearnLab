// Parses docs/WIDGETS.md into structured per-widget doc data for the
// /widgets gallery page. docs/WIDGETS.md is CI-enforced to have a
// `` ## `<key>` `` heading for every src/widgets/registry.ts entry
// (docs/ARCHITECTURE.md §4), so it's a reliable "read" source — this file
// adds no new hand-maintained widget metadata.
import widgetsMd from '../../docs/WIDGETS.md?raw';

export interface WidgetPropRow {
  name: string;
  type: string;
  required: string;
  default: string;
  description: string;
}

export interface WidgetDoc {
  key: string;
  description: string;
  props: WidgetPropRow[];
  example: string;
}

function parsePropsTable(block: string): WidgetPropRow[] {
  const rows = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'));
  // Row 0 is the header, row 1 is the `| --- | --- |` separator.
  const dataRows = rows.slice(2);
  const props: WidgetPropRow[] = [];
  for (const row of dataRows) {
    const cells = row
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 5) continue;
    const [name, type, required, def, description] = cells;
    if (!name) continue;
    props.push({
      name: name.replace(/`/g, ''),
      type: type ?? '',
      required: required ?? '',
      default: def ?? '',
      description: description ?? '',
    });
  }
  return props;
}

function parseSection(section: string): WidgetDoc | null {
  const headingMatch = section.match(/^## `([^`]+)`/);
  if (!headingMatch) return null;
  const key = headingMatch[1] ?? '';
  const body = section.slice(headingMatch[0].length);

  const descMatch = body.match(/^([\s\S]*?)(?=\n### Props\b)/);
  const description = (descMatch?.[1] ?? body).trim();

  const propsMatch = body.match(/### Props\n\n([\s\S]*?)\n\n###/);
  const props = propsMatch ? parsePropsTable(propsMatch[1] ?? '') : [];

  const exampleMatch = body.match(/### Example\n\n```markdown\n([\s\S]*?)\n```/);
  const example = (exampleMatch?.[1] ?? '').trim();

  return { key, description, props, example };
}

function parseWidgetsDoc(raw: string): Record<string, WidgetDoc> {
  const firstHeadingIndex = raw.search(/\n## `/);
  if (firstHeadingIndex === -1) return {};
  const body = raw.slice(firstHeadingIndex + 1);
  const sections = body.split(/\n(?=## `)/);

  const docs: Record<string, WidgetDoc> = {};
  for (const section of sections) {
    const doc = parseSection(section);
    if (doc) docs[doc.key] = doc;
  }
  return docs;
}

const widgetDocs: Record<string, WidgetDoc> = parseWidgetsDoc(widgetsMd);

export function getWidgetDoc(key: string): WidgetDoc | undefined {
  return widgetDocs[key];
}
