// Remark plugin that lifts remark-directive nodes into hast-visible elements
// react-markdown can map via its `components` option (SRS §4.5, FR-CONT-004).
//
// The four recognised forms (closed set — anything else is an error card,
// never silently vanished content):
//   ::widget{type="key" ...props}   -> <widget-directive attrs="{json}">
//   ::py{src params height}         -> <py-directive attrs="{json}">
//   :::callout{kind="..."} ... :::  -> <callout-directive kind="...">
//   :::reveal{title="..."} ... :::  -> <reveal-directive title="...">
// Everything else                   -> <directive-error name reason form>
//
// Containers may nest markdown/maths/leaf directives; containers inside
// containers are forbidden by the validator (§4.7) — the renderer maps them
// to an error card rather than crashing.

import type { Parent, Root } from 'mdast';
import type { Directives } from 'mdast-util-directive';
// Pull in the `mdast` Data augmentation that declares hName/hProperties.
import type {} from 'mdast-util-to-hast';

const DIRECTIVE_TYPES = new Set(['containerDirective', 'leafDirective', 'textDirective']);

/** The four §4.5 directive names and their required forms. */
const EXPECTED_FORM: Record<string, Directives['type']> = {
  widget: 'leafDirective',
  py: 'leafDirective',
  callout: 'containerDirective',
  reveal: 'containerDirective',
};

export type DirectiveErrorReason = 'unknown' | 'form' | 'nested';

function isDirective(node: unknown): node is Directives {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    DIRECTIVE_TYPES.has((node as { type: string }).type)
  );
}

function isParent(node: unknown): node is Parent {
  return (
    typeof node === 'object' &&
    node !== null &&
    'children' in node &&
    Array.isArray((node as { children: unknown }).children)
  );
}

function setElement(node: Directives, hName: string, hProperties: Record<string, string>): void {
  node.data = { ...node.data, hName, hProperties };
}

function toError(node: Directives, reason: DirectiveErrorReason): void {
  setElement(node, 'directive-error', {
    name: node.name,
    reason,
    form: node.type,
  });
  // Validation rejects these; the renderer shows the card and drops the body.
  node.children = [];
}

function attrsJson(node: Directives): string {
  return JSON.stringify(node.attributes ?? {});
}

/** Lift one directive node. Returns true when its children should still be walked. */
function lift(node: Directives, insideContainer: boolean): boolean {
  if (node.type === 'containerDirective' && insideContainer) {
    toError(node, 'nested');
    return false;
  }

  const expected = EXPECTED_FORM[node.name];
  if (expected === undefined) {
    toError(node, 'unknown');
    return false;
  }
  if (node.type !== expected) {
    toError(node, 'form');
    return false;
  }

  switch (node.name) {
    case 'widget':
      setElement(node, 'widget-directive', { attrs: attrsJson(node) });
      node.children = []; // leaf: any [label] content is not part of the contract
      return false;
    case 'py':
      setElement(node, 'py-directive', { attrs: attrsJson(node) });
      node.children = [];
      return false;
    case 'callout':
      setElement(node, 'callout-directive', { kind: node.attributes?.kind ?? '' });
      return true;
    case 'reveal':
      setElement(node, 'reveal-directive', { title: node.attributes?.title ?? '' });
      return true;
    default:
      return false;
  }
}

function walk(parent: Parent, insideContainer: boolean): void {
  for (const child of parent.children) {
    if (isDirective(child)) {
      const descend = lift(child, insideContainer);
      if (descend && isParent(child)) {
        walk(child, insideContainer || child.type === 'containerDirective');
      }
    } else if (isParent(child)) {
      walk(child, insideContainer);
    }
  }
}

export function remarkLiftDirectives() {
  return (tree: Root): void => {
    walk(tree, false);
  };
}
