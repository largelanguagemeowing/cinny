import {
  IEventWithRoomId,
  IResultContext,
  ISearchRequestBody,
  ISearchResponse,
  ISearchResult,
  SearchOrderBy,
} from 'matrix-js-sdk';
import { useCallback } from 'react';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { ServerSoftware, useServerSoftware } from '../../hooks/useServerSoftware';

export type ResultItem = {
  rank: number;
  event: IEventWithRoomId;
  context: IResultContext;
};

export type ResultGroup = {
  /**
   * Stable, unique key. Results stay in server order, so the same room can appear
   * in several groups when rooms interleave; roomId alone is not a usable key.
   */
  key: string;
  roomId: string;
  items: ResultItem[];
};

export type SearchResult = {
  nextToken?: string;
  /** total matches known to the server, not the amount loaded so far */
  count?: number;
  highlights: string[];
  groups: ResultGroup[];
};

const groupSearchResult = (results: ISearchResult[]): ResultGroup[] => {
  const groups: ResultGroup[] = [];

  results.forEach((item) => {
    const roomId = item.result.room_id;
    const resultItem: ResultItem = {
      rank: item.rank,
      event: item.result,
      context: item.context,
    };

    const lastAddedGroup: ResultGroup | undefined = groups[groups.length - 1];
    if (lastAddedGroup && roomId === lastAddedGroup.roomId) {
      lastAddedGroup.items.push(resultItem);
      return;
    }
    groups.push({
      key: `${roomId}/${item.result.event_id}`,
      roomId,
      items: [resultItem],
    });
  });

  return groups;
};

const parseSearchResult = (result: ISearchResponse): SearchResult => {
  const roomEvents = result.search_categories.room_events;

  const searchResult: SearchResult = {
    nextToken: roomEvents?.next_batch,
    count: roomEvents?.count,
    highlights: roomEvents?.highlights ?? [],
    groups: groupSearchResult(roomEvents?.results ?? []),
  };

  return searchResult;
};

/**
 * Whether the server truncates relevance-ordered search.
 *
 * The spec permits paginating `order_by: rank` -- it defines `next_batch` with no
 * dependency on ordering -- but Synapse never emits one for it and caps the query
 * at 500 rows. Treat any other implementation as capable until it proves otherwise.
 */
export const useRankOrderTruncated = (): boolean =>
  useServerSoftware().software === ServerSoftware.Synapse;

export type MessageSearchParams = {
  term?: string;
  order?: string;
  rooms?: string[];
  senders?: string[];
};
export const useMessageSearch = (params: MessageSearchParams) => {
  const mx = useMatrixClient();
  const { term, order, rooms, senders } = params;

  const searchMessages = useCallback(
    async (nextBatch?: string, abortSignal?: AbortSignal): Promise<SearchResult> => {
      if (!term)
        return {
          highlights: [],
          groups: [],
        };
      const limit = 20;

      const requestBody: ISearchRequestBody = {
        search_categories: {
          room_events: {
            event_context: {
              before_limit: 1,
              after_limit: 1,
              include_profile: true,
            },
            filter: {
              limit,
              rooms,
              senders,
            },
            include_state: false,
            order_by: order as SearchOrderBy.Recent,
            search_term: term,
          },
        },
      };

      const r = await mx.search(
        {
          body: requestBody,
          next_batch: nextBatch === '' ? undefined : nextBatch,
        },
        abortSignal
      );
      return parseSearchResult(r);
    },
    [mx, term, order, rooms, senders]
  );

  return searchMessages;
};
