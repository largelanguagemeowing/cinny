import { useMatches, useParams } from 'react-router-dom';
import { getCanonicalAliasRoomId, isRoomAlias } from '../../utils/matrix';
import { useMatrixClient } from '../useMatrixClient';

export const useSelectedRoom = (): string | undefined => {
  const mx = useMatrixClient();

  const { roomIdOrAlias } = useParams();
  const roomId =
    roomIdOrAlias && isRoomAlias(roomIdOrAlias)
      ? getCanonicalAliasRoomId(mx, roomIdOrAlias)
      : roomIdOrAlias;

  return roomId;
};

/**
 * Selected room read from the deepest route match instead of the enclosing
 * route; `useSelectedRoom` sees no room param when called above the room routes.
 */
export const useRouteSelectedRoom = (): string | undefined => {
  const mx = useMatrixClient();

  const matches = useMatches();
  const roomIdOrAlias = matches[matches.length - 1]?.params.roomIdOrAlias;

  return roomIdOrAlias && isRoomAlias(roomIdOrAlias)
    ? getCanonicalAliasRoomId(mx, roomIdOrAlias)
    : roomIdOrAlias;
};
