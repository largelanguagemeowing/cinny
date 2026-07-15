import { RICH_PRESENCE_PROFILE_FIELDS } from './richPresence';

export const MSC4247_PRONOUNS = 'io.fsky.nyx.pronouns';
export const M_PRONOUNS = 'm.pronouns';
export const MSC4427_BANNER = 'chat.commet.profile_banner';
export const M_BANNER_URL = 'm.banner_url';

export const USER_PROFILE_FIELDS = [
  ...RICH_PRESENCE_PROFILE_FIELDS,
  MSC4247_PRONOUNS,
  M_PRONOUNS,
  MSC4427_BANNER,
  M_BANNER_URL,
];

export type ProfilePronoun = {
  summary: string;
  language: string;
  grammaticalGender?: string;
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
