import type { Page } from '@playwright/test';

type MatrixRequestOptions = {
  method: 'GET' | 'PUT' | 'POST' | 'DELETE';
  path: string;
  body?: unknown;
  allowNotFound?: boolean;
};

export async function matrixRequest<T = unknown>(
  page: Page,
  options: MatrixRequestOptions
): Promise<T | undefined> {
  const result = await page.evaluate(
    async ({ method, path, body, allowNotFound }) => {
      const homeserver = localStorage.getItem('cinny_hs_base_url');
      const accessToken = localStorage.getItem('cinny_access_token');
      if (!homeserver || !accessToken) throw new Error('Missing authenticated Matrix session');

      const response = await fetch(`${homeserver}/_matrix/client/v3${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (allowNotFound && response.status === 404) return undefined;
      if (!response.ok) {
        throw new Error(`Matrix request failed: ${method} ${path} (${response.status})`);
      }
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        return response.json();
      }
      return undefined;
    },
    { ...options }
  );
  return result as T | undefined;
}

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
