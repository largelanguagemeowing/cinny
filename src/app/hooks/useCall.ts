import { Room } from 'matrix-js-sdk';
import { RoomEvent } from 'matrix-js-sdk';
import {
  MatrixRTCSession,
  MatrixRTCSessionEvent,
  MatrixRTCSessionEventHandlerMap,
} from 'matrix-js-sdk/lib/matrixrtc/MatrixRTCSession';
import { CallMembership } from 'matrix-js-sdk/lib/matrixrtc/CallMembership';
import { useEffect, useState } from 'react';
import { MatrixRTCSessionManagerEvents } from 'matrix-js-sdk/lib/matrixrtc/MatrixRTCSessionManager';
import { useMatrixClient } from './useMatrixClient';
import { getSpaceChildren } from '../utils/room';
import { StateEvent } from '../../types/matrix/room';

export const useCallSession = (room: Room): MatrixRTCSession => {
  const mx = useMatrixClient();

  const [session, setSession] = useState(mx.matrixRTC.getRoomSession(room));

  useEffect(() => {
    const start = (roomId: string) => {
      if (roomId !== room.roomId) return;
      setSession(mx.matrixRTC.getRoomSession(room));
    };
    const end = (roomId: string) => {
      if (roomId !== room.roomId) return;
      setSession(mx.matrixRTC.getRoomSession(room));
    };
    mx.matrixRTC.on(MatrixRTCSessionManagerEvents.SessionStarted, start);
    mx.matrixRTC.on(MatrixRTCSessionManagerEvents.SessionEnded, end);
    return () => {
      mx.matrixRTC.off(MatrixRTCSessionManagerEvents.SessionStarted, start);
      mx.matrixRTC.off(MatrixRTCSessionManagerEvents.SessionEnded, end);
    };
  }, [mx, room]);

  return session;
};

export const useCallMembersChange = (
  session: MatrixRTCSession,
  callback: (members: CallMembership[]) => void
): void => {
  useEffect(() => {
    const handleMembershipsChange: MatrixRTCSessionEventHandlerMap[MatrixRTCSessionEvent.MembershipsChanged] =
      (oldestMembership, newMemberships) => {
        callback(newMemberships);
      };

    session.on(MatrixRTCSessionEvent.MembershipsChanged, handleMembershipsChange);
    return () => {
      session.removeListener(MatrixRTCSessionEvent.MembershipsChanged, handleMembershipsChange);
    };
  }, [session, callback]);
};

export const useCallMembers = (session: MatrixRTCSession): CallMembership[] => {
  const [memberships, setMemberships] = useState<CallMembership[]>(session.memberships);

  useCallMembersChange(session, setMemberships);

  return memberships;
};

export const useSpaceHasCall = (space: Room): boolean => {
  const mx = useMatrixClient();
  const [hasCall, setHasCall] = useState(false);

  useEffect(() => {
    const childRoomIds = getSpaceChildren(space);

    const check = () => {
      const found = childRoomIds.some((roomId) => {
        const room = mx.getRoom(roomId);
        if (!room) return false;
        // Check MatrixRTC session memberships first
        try {
          if (mx.matrixRTC.getRoomSession(room).memberships.length > 0) return true;
        } catch {
          // ignore
        }
        // Fallback: directly check room state events for call memberships
        const callMemberEvents = room.currentState.getStateEvents(
          StateEvent.GroupCallMemberPrefix
        );
        return callMemberEvents.length > 0;
      });
      setHasCall(found);
    };

    mx.matrixRTC.on(MatrixRTCSessionManagerEvents.SessionStarted, check);
    mx.matrixRTC.on(MatrixRTCSessionManagerEvents.SessionEnded, check);

    // Also listen for room state events to catch call member changes
    // that the RTC session manager might miss on initial sync
    const onRoomState = (event: any) => {
      if (event.getType() === StateEvent.GroupCallMemberPrefix) {
        check();
      }
    };
    mx.on(RoomEvent.State, onRoomState);

    check();

    // Re-check after a short delay to catch state that arrives after mount
    const timer = setTimeout(check, 5000);

    return () => {
      mx.matrixRTC.off(MatrixRTCSessionManagerEvents.SessionStarted, check);
      mx.matrixRTC.off(MatrixRTCSessionManagerEvents.SessionEnded, check);
      mx.off(RoomEvent.State, onRoomState);
      clearTimeout(timer);
    };
  }, [mx, space]);

  return hasCall;
};
