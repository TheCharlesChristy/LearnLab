import { describe, expect, it } from 'vitest';

import {
  createV2RolloutConfig,
  negotiateV2Pack,
  parseV2FeatureFlag,
  selectV2Route,
} from './rollout';

const enabled = createV2RolloutConfig(true);

describe('v2 rollout boundary', () => {
  it('keeps the flag disabled unless explicitly enabled', () => {
    expect(parseV2FeatureFlag(undefined)).toBe(false);
    expect(parseV2FeatureFlag('false')).toBe(false);
    expect(parseV2FeatureFlag('TRUE')).toBe(true);
    expect(parseV2FeatureFlag('1')).toBe(true);
    expect(parseV2FeatureFlag('yes')).toBe(false);
    expect(createV2RolloutConfig().enabled).toBe(false);
  });

  it('accepts a supported pack and selects its v2 route', () => {
    const result = negotiateV2Pack(
      {
        formatVersion: 1,
        capabilities: {
          'experience-graph': '0.1.0',
          'activity-plugin': '0.1.0',
        },
      },
      enabled,
    );

    expect(result).toMatchObject({ useV2: true, reason: 'enabled', fallback: 'v1' });
    expect(selectV2Route(result, '/module/legacy', '/experience/relay-beacon')).toBe(
      '/experience/relay-beacon',
    );
  });

  it('uses the v1 route when the flag is disabled', () => {
    const result = negotiateV2Pack(
      { formatVersion: 1, capabilities: { 'experience-graph': '0.1.0' } },
      createV2RolloutConfig(false),
    );

    expect(result).toMatchObject({ useV2: false, reason: 'disabled', fallback: 'v1' });
    expect(selectV2Route(result, '/module/legacy', '/experience/relay-beacon')).toBe('/module/legacy');
  });

  it.each([
    ['malformed pack', { formatVersion: 1 }, 'malformed-pack'],
    ['unsupported format', { formatVersion: 2, capabilities: {} }, 'unsupported-format'],
    ['unknown capability', { formatVersion: 1, capabilities: { 'future-plugin': '0.1.0' } }, 'unsupported-capability'],
    ['newer capability', { formatVersion: 1, capabilities: { 'experience-graph': '9.0.0' } }, 'unsupported-capability-version'],
  ])('fails closed for %s', (_label, pack, reason) => {
    const result = negotiateV2Pack(pack, enabled);
    expect(result).toMatchObject({ useV2: false, reason, fallback: 'v1' });
    expect(selectV2Route(result, '/module/legacy', '/experience/relay-beacon')).toBeNull();
  });
});
