import { useEffect } from 'react';
import { isKeyHotkey } from 'is-hotkey';

type UseAutocompleteEnterOptions = {
  /**
   * Whether there is at least one suggestion that can be accepted.
   * When false, Enter is left untouched so the editor keeps its default
   * behaviour (e.g. sending the message).
   */
  hasItems: boolean;
  /** Called to accept the first suggestion. */
  accept: () => void;
};

/**
 * Accepts the autocomplete suggestion when plain Enter is pressed while the
 * editor is focused, mirroring what Tab already does.
 *
 * The listener is attached to `window` in the capture phase so it runs before
 * the editor's own keydown handler (which would otherwise send the message on
 * Enter). Enter is only intercepted when:
 *  - there is a suggestion to accept (`hasItems`),
 *  - the editor itself is focused (a focused menu item relies on its native
 *    click handling instead),
 *  - the user is not composing text with an IME.
 *
 * Modified Enter (e.g. `shift+enter`, `mod+enter`) is never intercepted, so the
 * existing newline / send shortcuts keep working.
 */
export function useAutocompleteEnter({ hasItems, accept }: UseAutocompleteEnterOptions) {
  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (!hasItems) return;
      if (evt.defaultPrevented) return;
      // Only plain Enter; modifiers (shift, mod, ...) are left to the editor.
      if (!isKeyHotkey('enter', evt)) return;
      // Don't interfere with IME composition (Enter confirms the composition).
      if (evt.isComposing || evt.keyCode === 229) return;
      // Only act when the editor is focused. When a menu item is focused,
      // Enter already triggers it through the native button click handling.
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !active.isContentEditable) return;
      // Prevent the editor from sending the message and Slate from inserting a
      // newline, and stop the event from reaching the editor's keydown handler.
      evt.preventDefault();
      evt.stopPropagation();
      accept();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [hasItems, accept]);
}
