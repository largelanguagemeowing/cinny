import {
  AngleLinkRule,
  BoldRule,
  CodeRule,
  EscapeRule,
  ItalicRule1,
  ItalicRule2,
  LinkRule,
  SpoilerRule,
  StrikeRule,
  UnderlineRule,
} from './rules';
import {
  InlineMDRange,
  findInlineRule,
  runInlineRule,
  runInlineRules,
  tokenizeInline,
} from './runner';
import { InlineMDParser } from './type';

const LeveledRules = [
  BoldRule,
  ItalicRule1,
  UnderlineRule,
  ItalicRule2,
  StrikeRule,
  SpoilerRule,
  LinkRule,
  AngleLinkRule,
  EscapeRule,
];

/**
 * Parses inline markdown text into HTML using defined rules.
 *
 * @param text - The markdown text to be parsed.
 * @returns The parsed HTML or the original text if no markdown was found.
 */
export const parseInlineMD: InlineMDParser = (text) => {
  if (text === '') return text;
  let result: string | undefined;
  if (!result) result = runInlineRule(text, CodeRule, parseInlineMD);

  if (!result) result = runInlineRules(text, LeveledRules, parseInlineMD);

  return result ?? text;
};

/**
 * Finds formatted and syntax ranges of inline markdown in plain text.
 * Mirrors the rule order of `parseInlineMD`.
 *
 * @param text - The raw (unsanitized) markdown text.
 * @param offset - The offset added to every range.
 * @returns The ranges found in the text.
 */
export const tokenizeInlineMD = (text: string, offset = 0): InlineMDRange[] =>
  tokenizeInline(
    text,
    (t) => {
      const codeMatch = CodeRule.match(t);
      if (codeMatch) return [CodeRule, codeMatch];
      return findInlineRule(t, LeveledRules);
    },
    offset
  );

export type { InlineMDRange };
