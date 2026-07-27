import { useMatch, useMatches, useParams } from 'react-router-dom';
import { getCanonicalAliasRoomId, isRoomAlias } from '../../utils/matrix';
import { useMatrixClient } from '../useMatrixClient';
import { getSpaceLobbyPath, getSpaceSearchPath } from '../../pages/pathUtils';

export const useSelectedSpace = (): string | undefined => {
  const mx = useMatrixClient();

  const { spaceIdOrAlias } = useParams();

  const spaceId =
    spaceIdOrAlias && isRoomAlias(spaceIdOrAlias)
      ? getCanonicalAliasRoomId(mx, spaceIdOrAlias)
      : spaceIdOrAlias;

  return spaceId;
};

/**
 * Selected space read from the deepest route match instead of the enclosing
 * route; `useSelectedSpace` sees no space param when called above the space routes.
 */
export const useRouteSelectedSpace = (): string | undefined => {
  const mx = useMatrixClient();

  const matches = useMatches();
  const spaceIdOrAlias = matches[matches.length - 1]?.params.spaceIdOrAlias;

  return spaceIdOrAlias && isRoomAlias(spaceIdOrAlias)
    ? getCanonicalAliasRoomId(mx, spaceIdOrAlias)
    : spaceIdOrAlias;
};

export const useSpaceLobbySelected = (spaceIdOrAlias: string): boolean => {
  const match = useMatch({
    path: decodeURIComponent(getSpaceLobbyPath(spaceIdOrAlias)),
    caseSensitive: true,
    end: false,
  });

  return !!match;
};

export const useSpaceSearchSelected = (spaceIdOrAlias: string): boolean => {
  const match = useMatch({
    path: decodeURIComponent(getSpaceSearchPath(spaceIdOrAlias)),
    caseSensitive: true,
    end: false,
  });

  return !!match;
};
