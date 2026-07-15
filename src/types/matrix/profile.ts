import { RICH_PRESENCE_PROFILE_FIELDS } from './richPresence';

export const MSC4247_PRONOUNS = 'io.fsky.nyx.pronouns';
export const M_PRONOUNS = 'm.pronouns';
export const MSC4427_BANNER = 'chat.commet.profile_banner';
export const M_BANNER_URL = 'm.banner_url';
export const MSC4440_BIOGRAPHY = 'gay.fomx.biography';
export const M_BIOGRAPHY = 'm.biography';
export const MSC4462_CONNECTIONS = 'fyi.cisnt.connections';
export const M_CONNECTIONS = 'm.connections';

export const USER_PROFILE_FIELDS = [
  ...RICH_PRESENCE_PROFILE_FIELDS,
  MSC4247_PRONOUNS,
  M_PRONOUNS,
  MSC4427_BANNER,
  M_BANNER_URL,
  MSC4440_BIOGRAPHY,
  M_BIOGRAPHY,
  MSC4462_CONNECTIONS,
  M_CONNECTIONS,
];

export type ProfilePronoun = {
  summary: string;
  language: string;
  grammaticalGender?: string;
};

export type ProfileConnection = {
  description: string;
  uri: string;
};

const parsePronoun = (value: unknown): ProfilePronoun | undefined => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const content = value as Record<string, unknown>;
  if (typeof content.summary !== 'string' || typeof content.language !== 'string') return undefined;
  return {
    summary: content.summary,
    language: content.language,
    grammaticalGender:
      typeof content.grammatical_gender === 'string' ? content.grammatical_gender : undefined,
  };
};

export const getProfilePronouns = (profile: Record<string, unknown>): ProfilePronoun[] => {
  const value = profile[MSC4247_PRONOUNS] ?? profile[M_PRONOUNS];
  return Array.isArray(value)
    ? value.map(parsePronoun).filter((pronoun): pronoun is ProfilePronoun => !!pronoun)
    : [];
};

export const getProfileBanner = (profile: Record<string, unknown>): string | undefined => {
  const value = profile[MSC4427_BANNER] ?? profile[M_BANNER_URL];
  return typeof value === 'string' && value.startsWith('mxc://') ? value : undefined;
};

export const getProfileBiography = (profile: Record<string, unknown>): string | undefined => {
  const value = profile[MSC4440_BIOGRAPHY] ?? profile[M_BIOGRAPHY];
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const text = (value as Record<string, unknown>)['m.text'];
  if (!Array.isArray(text)) return undefined;
  const representation = text.find((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return false;
    const content = item as Record<string, unknown>;
    return typeof content.body === 'string' && content.mimetype !== 'text/html';
  }) as Record<string, unknown> | undefined;
  return representation ? String(representation.body) : undefined;
};

const isAllowedConnectionUri = (value: string): boolean => {
  try {
    return ['http:', 'https:', 'mailto:', 'matrix:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export const getProfileConnections = (profile: Record<string, unknown>): ProfileConnection[] => {
  const value = profile[MSC4462_CONNECTIONS] ?? profile[M_CONNECTIONS];
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).flatMap((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return [];
    const content = item as Record<string, unknown>;
    if (
      typeof content.description !== 'string' ||
      content.description.length > 200 ||
      typeof content.uri !== 'string' ||
      !isAllowedConnectionUri(content.uri)
    ) {
      return [];
    }
    return [{ description: content.description, uri: content.uri }];
  });
};
