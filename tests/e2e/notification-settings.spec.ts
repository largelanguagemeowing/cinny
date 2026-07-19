import { expect, test, type Page } from '@playwright/test';
import { matrixRequest } from './support/matrix';

type PushRule = {
  rule_id: string;
  enabled: boolean;
  actions: unknown[];
};
type PushRulesResponse = {
  global: Record<string, PushRule[] | undefined>;
};

const MESSAGE_ACTIONS_PATH = '/pushrules/global/underride/.m.rule.message/actions';
const INVITE_ENABLED_PATH = '/pushrules/global/override/.m.rule.invite_for_me/enabled';

async function openNotificationSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'User Settings' }).click();
  await page.getByText('Notifications', { exact: true }).click();
  await expect(page.getByText('Desktop Notifications', { exact: true })).toBeVisible();
}

test.describe('Notification settings', () => {
  test('shows only the simplified global options', async ({ page }) => {
    await page.goto('/home/');
    await openNotificationSettings(page);

    await expect(page.getByText('Notification Sound', { exact: true })).toBeVisible();
    await expect(page.getByText('Email Notification', { exact: true })).toBeVisible();
    await expect(page.getByText('Reset Notifications', { exact: true })).toBeVisible();

    await expect(page.getByText('All Messages', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Special Messages', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Keyword Messages', { exact: true })).toHaveCount(0);
  });

  test('reset restores default push rules and removes keyword rules', async ({ page }) => {
    const keyword = `e2e-reset-${Date.now()}`;
    const keywordPath = `/pushrules/global/content/${encodeURIComponent(keyword)}`;

    await page.goto('/home/');
    try {
      await matrixRequest(page, {
        method: 'PUT',
        path: MESSAGE_ACTIONS_PATH,
        body: { actions: [] },
      });
      await matrixRequest(page, {
        method: 'PUT',
        path: INVITE_ENABLED_PATH,
        body: { enabled: false },
      });
      await matrixRequest(page, {
        method: 'PUT',
        path: keywordPath,
        body: { actions: ['notify'], pattern: keyword },
      });

      await openNotificationSettings(page);

      await page.getByRole('button', { name: 'Reset', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Reset Notifications' });
      await expect(dialog.getByText('Restore default message notification rules?')).toBeVisible();
      await dialog.getByRole('button', { name: 'Reset', exact: true }).click();

      await expect(dialog).toHaveCount(0);

      await expect
        .poll(async () => {
          const rules = await matrixRequest<PushRulesResponse>(page, {
            method: 'GET',
            path: '/pushrules/',
          });
          const messageRule = rules?.global.underride?.find(
            (rule) => rule.rule_id === '.m.rule.message'
          );
          const inviteRule = rules?.global.override?.find(
            (rule) => rule.rule_id === '.m.rule.invite_for_me'
          );
          const keywordRule = rules?.global.content?.find((rule) => rule.rule_id === keyword);
          return {
            messageActions: messageRule?.actions,
            inviteEnabled: inviteRule?.enabled,
            keywordExists: Boolean(keywordRule),
          };
        })
        .toEqual({
          messageActions: ['notify'],
          inviteEnabled: true,
          keywordExists: false,
        });
    } finally {
      await matrixRequest(page, {
        method: 'PUT',
        path: MESSAGE_ACTIONS_PATH,
        body: { actions: ['notify'] },
      });
      await matrixRequest(page, {
        method: 'PUT',
        path: INVITE_ENABLED_PATH,
        body: { enabled: true },
      });
      await matrixRequest(page, {
        method: 'DELETE',
        path: keywordPath,
        allowNotFound: true,
      });
    }
  });
});
