import { MatchResult, replaceMatch } from '../internal';
import { InlineMDMark, InlineMDParser, InlineMDRule } from './type';

/**
 * Finds the rule that matches earliest in the text.
 * When several rules match at the same index, the first one in `rules` wins.
 *
 * @param text - The text to match against.
 * @param rules - The markdown rules to try.
 * @returns The winning rule with its match or `undefined` if no rule matches.
 */
export const findInlineRule = (
  text: string,
  rules: InlineMDRule[]
): [InlineMDRule, MatchResult] | undefined => {
  let targetRule: InlineMDRule | undefined;
  let targetResult: MatchResult | undefined;

  rules.forEach((rule) => {
    const currentResult = rule.match(text);
    if (currentResult && typeof currentResult.index === 'number') {
      if (
        !targetResult ||
        (typeof targetResult?.index === 'number' && currentResult.index < targetResult.index)
      ) {
        targetResult = currentResult;
        targetRule = rule;
      }
    }
  });

  if (targetRule && targetResult) return [targetRule, targetResult];
  return undefined;
};

/**
 * Runs a single markdown rule on the provided text.
 *
 * @param text - The text to parse.
 * @param rule - The markdown rule to run.
 * @param parse - A function that run the parser on remaining parts.
 * @returns The text with the markdown rule applied or `undefined` if no match is found.
 */
export const runInlineRule = (
  text: string,
  rule: InlineMDRule,
  parse: InlineMDParser
): string | undefined => {
  const matchResult = rule.match(text);
  if (matchResult) {
    const content = rule.html(parse, matchResult);
    return replaceMatch(text, matchResult, content, (txt) => [parse(txt)]).join('');
  }
  return undefined;
};

/**
 * Runs multiple rules at the same time to better handle nested rules.
 * Rules will be run in the order they appear.
 *
 * @param text - The text to parse.
 * @param rules - The markdown rules to run.
 * @param parse - A function that run the parser on remaining parts.
 * @returns The text with the markdown rules applied or `undefined` if no match is found.
 */
export const runInlineRules = (
  text: string,
  rules: InlineMDRule[],
  parse: InlineMDParser
): string | undefined => {
  const found = findInlineRule(text, rules);
  if (!found) return undefined;

  const [targetRule, targetResult] = found;
  const content = targetRule.html(parse, targetResult);
  return replaceMatch(text, targetResult, content, (txt) => [parse(txt)]).join('');
};

/**
 * A formatted or syntax range inside a text, relative to the start of the text.
 */
export type InlineMDRange = {
  mark: InlineMDMark | 'syntax';
  start: number;
  end: number;
};

/**
 * Type for a function that finds the rule to apply to the text.
 */
export type InlineRuleFinder = (text: string) => [InlineMDRule, MatchResult] | undefined;

/**
 * Tokenizes text into markdown ranges using the same rule order as the HTML parser.
 *
 * @param text - The text to tokenize.
 * @param find - A function that picks the rule to apply to the text.
 * @param offset - The offset added to every range.
 * @returns The formatted and syntax ranges.
 */
export const tokenizeInline = (
  text: string,
  find: InlineRuleFinder,
  offset = 0
): InlineMDRange[] => {
  if (text === '') return [];
  const found = find(text);
  if (!found) return [];

  const [rule, match] = found;
  const { token } = rule;
  const index = match.index ?? 0;
  const end = index + match[0].length;
  const open = typeof token.open === 'number' ? token.open : token.open(match);
  const close = typeof token.close === 'number' ? token.close : token.close(match);

  const ranges: InlineMDRange[] = [
    ...tokenizeInline(text.slice(0, index), find, offset),
    { mark: token.mark, start: offset + index, end: offset + end },
  ];
  if (open > 0) ranges.push({ mark: 'syntax', start: offset + index, end: offset + index + open });
  if (close > 0) ranges.push({ mark: 'syntax', start: offset + end - close, end: offset + end });
  if (!token.raw) {
    ranges.push(
      ...tokenizeInline(text.slice(index + open, end - close), find, offset + index + open)
    );
  }
  ranges.push(...tokenizeInline(text.slice(end), find, offset + end));

  return ranges;
};
