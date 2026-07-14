/**
 * The v2 rollout boundary is deliberately independent of the graph/runtime work.
 * See docs/EXPERIENCE_RUNTIME_V2_ROLLOUT.md and SRS section 14.
 */

export const V2_FORMAT_VERSION = 1;
export const V2_FALLBACK = 'v1' as const;

export const V2_SUPPORTED_CAPABILITIES = Object.freeze({
  'experience-graph': '0.1.0',
  'activity-plugin': '0.1.0',
  'typed-effects': '0.1.0',
});

export type V2CapabilityKey = keyof typeof V2_SUPPORTED_CAPABILITIES;

export interface V2RolloutConfig {
  enabled: boolean;
  formatVersion: number;
  supportedCapabilities: Readonly<Record<string, string>>;
}

export type V2NegotiationReason =
  | 'enabled'
  | 'disabled'
  | 'malformed-pack'
  | 'unsupported-format'
  | 'unsupported-capability'
  | 'unsupported-capability-version';

export interface V2NegotiationDecision {
  useV2: boolean;
  fallback: typeof V2_FALLBACK;
  reason: V2NegotiationReason;
  message: string;
  capability?: string;
  requiredVersion?: string;
  availableVersion?: string;
}

export function parseV2FeatureFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return value.trim().toLowerCase() === 'true' || value.trim() === '1';
}

export function createV2RolloutConfig(flagValue: unknown = import.meta.env.VITE_EXPERIENCE_RUNTIME_V2): V2RolloutConfig {
  return {
    enabled: parseV2FeatureFlag(flagValue),
    formatVersion: V2_FORMAT_VERSION,
    supportedCapabilities: V2_SUPPORTED_CAPABILITIES,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseVersion(version: string): [number, number, number] | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(version.trim());
  if (!match) return undefined;
  return [Number(match[1] ?? NaN), Number(match[2] ?? NaN), Number(match[3] ?? NaN)];
}

function versionSatisfies(available: string, required: string): boolean {
  const actual = parseVersion(available);
  const minimum = parseVersion(required);
  if (!actual || !minimum) return false;
  if (actual[0] !== minimum[0]) return actual[0] > minimum[0];
  if (actual[1] !== minimum[1]) return actual[1] > minimum[1];
  if (actual[2] !== minimum[2]) return actual[2] > minimum[2];
  return true;
}

function decision(
  reason: V2NegotiationReason,
  message: string,
  extra: Pick<V2NegotiationDecision, 'capability' | 'requiredVersion' | 'availableVersion'> = {},
): V2NegotiationDecision {
  return { useV2: reason === 'enabled', fallback: V2_FALLBACK, reason, message, ...extra };
}

/** Negotiate an unknown pack value without trusting it before schema validation. */
export function negotiateV2Pack(pack: unknown, config: V2RolloutConfig): V2NegotiationDecision {
  if (!config.enabled) {
    return decision('disabled', 'Experience Runtime v2 is disabled; continue with v1.');
  }

  if (!isRecord(pack) || !Number.isInteger(pack.formatVersion) || !isRecord(pack.capabilities)) {
    return decision('malformed-pack', 'The v2 pack must declare an integer formatVersion and capabilities map.');
  }

  if (pack.formatVersion !== config.formatVersion) {
    return decision(
      'unsupported-format',
      `This v2 pack uses format ${String(pack.formatVersion)}; supported format is ${config.formatVersion}.`,
    );
  }

  for (const [capability, required] of Object.entries(pack.capabilities)) {
    if (typeof required !== 'string' || !parseVersion(required)) {
      return decision(
        'malformed-pack',
        `Capability ${capability} must declare a semantic minimum version.`,
        { capability, requiredVersion: typeof required === 'string' ? required : undefined },
      );
    }
    const available = config.supportedCapabilities[capability];
    if (!available) {
      return decision(
        'unsupported-capability',
        `The v2 runtime does not provide capability ${capability}.`,
        { capability, requiredVersion: required },
      );
    }
    if (!versionSatisfies(available, required)) {
      return decision(
        'unsupported-capability-version',
        `Capability ${capability} requires ${required}; available version is ${available}.`,
        { capability, requiredVersion: required, availableVersion: available },
      );
    }
  }

  return decision('enabled', 'The v2 pack is supported by the enabled runtime.');
}

/** Only the explicit disabled-flag path may automatically select a v1 route. */
export function selectV2Route(
  negotiation: V2NegotiationDecision,
  v1Route: string,
  v2Route: string,
): string | null {
  if (negotiation.useV2) return v2Route;
  if (negotiation.reason === 'disabled') return v1Route;
  return null;
}
