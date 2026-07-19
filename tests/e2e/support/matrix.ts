import type { Page } from '@playwright/test';

export async function redactEvent(page: Page, roomId: string, eventId: string): Promise<void> {
  await page.evaluate(
    async ({ targetRoomId, targetEventId }) => {
      const homeserver = localStorage.getItem('cinny_hs_base_url');
      const accessToken = localStorage.getItem('cinny_access_token');
      if (!homeserver || !accessToken) throw new Error('Missing authenticated Matrix session');

      const response = await fetch(
        `${homeserver}/_matrix/client/v3/rooms/${encodeURIComponent(
          targetRoomId
        )}/redact/${encodeURIComponent(targetEventId)}/${Date.now()}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        }
      );
      if (!response.ok) throw new Error(`Failed to redact event: ${response.status}`);
    },
    { targetRoomId: roomId, targetEventId: eventId }
  );
}
