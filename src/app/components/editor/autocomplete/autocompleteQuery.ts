import { BaseRange, Editor } from 'slate';

export enum AutocompletePrefix {
  RoomMention = '#',
  UserMention = '@',
  Emoticon = ':',
  Command = '/',
}
export const AUTOCOMPLETE_PREFIXES: readonly AutocompletePrefix[] = [
  AutocompletePrefix.RoomMention,
  AutocompletePrefix.UserMention,
  AutocompletePrefix.Emoticon,
  AutocompletePrefix.Command,
];

export type AutocompleteQuery<TPrefix extends string> = {
  range: BaseRange;
  prefix: TPrefix;
  text: string;
};

export const getAutocompletePrefix = <TPrefix extends string>(
  editor: Editor,
  queryRange: BaseRange,
  validPrefixes: readonly TPrefix[]
): TPrefix | undefined => {
  const world = Editor.string(editor, queryRange);
  return validPrefixes.find((p) => world.startsWith(p));
};

export const getAutocompleteQueryText = (
  editor: Editor,
  queryRange: BaseRange,
  prefix: string
): string => Editor.string(editor, queryRange).slice(prefix.length);

export const getAutocompleteQuery = <TPrefix extends string>(
  editor: Editor,
  queryRange: BaseRange,
  validPrefixes: readonly TPrefix[]
): AutocompleteQuery<TPrefix> | undefined => {
  const prefix = getAutocompletePrefix(editor, queryRange, validPrefixes);
  if (!prefix) return undefined;
  const text = getAutocompleteQueryText(editor, queryRange, prefix);
  // Emoji autocomplete waits for two characters after the ':' prefix,
  // so ':d' shows nothing and ':di' opens the emoji menu.
  if (prefix === (AutocompletePrefix.Emoticon as string) && text.length < 2) {
    return undefined;
  }
  return {
    range: queryRange,
    prefix,
    text,
  };
};
