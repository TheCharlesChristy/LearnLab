// Full lesson Markdown renderer — SRS §4.5 / FR-CONT-004.
// CommonMark + GFM + KaTeX maths + frontmatter (ignored) + the four
// directives (::widget, ::py, :::callout, :::reveal). Raw HTML is skipped
// (FR-CONT-005); unknown widgets and directives render visible error cards
// (FR-CONT-006) — content never silently vanishes.

import { useMemo } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkDirective from 'remark-directive';
import type { PluggableList } from 'unified';

import { BASE_COMPONENTS, BASE_REMARK_PLUGINS, REHYPE_PLUGINS } from './core';
import {
  CalloutDirective,
  DirectiveErrorNode,
  PyDirective,
  RevealDirective,
  WidgetDirective,
  type PyItemRenderer,
} from './directives';
import { remarkLiftDirectives } from './remark-lift-directives';

const REMARK_PLUGINS: PluggableList = [
  ...BASE_REMARK_PLUGINS,
  remarkDirective,
  remarkLiftDirectives,
];

export interface MarkdownLessonProps {
  markdown: string;
  /**
   * Mounts ::py items once the Python runtime (P1) is wired up. When absent,
   * a neutral placeholder card with reserved height renders instead.
   */
  pyItemRenderer?: PyItemRenderer;
}

export function MarkdownLesson({ markdown, pyItemRenderer }: MarkdownLessonProps) {
  const components = useMemo(() => {
    const directiveComponents: Record<string, unknown> = {
      'widget-directive': WidgetDirective,
      'py-directive': (props: { attrs?: string }) => (
        <PyDirective attrs={props.attrs} pyItemRenderer={pyItemRenderer} />
      ),
      'callout-directive': CalloutDirective,
      'reveal-directive': RevealDirective,
      'directive-error': DirectiveErrorNode,
    };
    // Custom element names are not part of react-markdown's Components key
    // set, hence the cast; the custom components own their prop contracts.
    return { ...BASE_COMPONENTS, ...directiveComponents } as Components;
  }, [pyItemRenderer]);

  return (
    <Markdown
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS}
      skipHtml
      components={components}
    >
      {markdown}
    </Markdown>
  );
}
