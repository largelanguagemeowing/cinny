import { useEffect, useState } from 'react';
import { ClientEvent } from 'matrix-js-sdk';
import {
  getProfileRichPresence,
  MSC4320_RPC,
  M_RPC,
  RichPresence,
} from '../../types/matrix/richPresence';
import { useMatrixClient } from './useMatrixClient';

const hasRichPresenceField = (profile: Record<string, unknown>): boolean =>
  Object.prototype.hasOwnProperty.call(profile, MSC4320_RPC) ||
  Object.prototype.hasOwnProperty.call(profile, M_RPC);

export const useUserRichPresence = (userId: string): RichPresence | undefined => {
  const mx = useMatrixClient();
  const [richPresence, setRichPresence] = useState<RichPresence>();

  useEffect(() => {
    let active = true;
    let updateVersion = 0;

    setRichPresence(undefined);

    if (!userId)
      return () => {
        active = false;
      };

    const handleProfileUpdate = (
      updatedUserId: string,
      profile: Record<string, unknown> | null
    ) => {
      if (updatedUserId !== userId) return;

      updateVersion += 1;
      if (profile === null) {
        setRichPresence(undefined);
      } else if (hasRichPresenceField(profile)) {
        setRichPresence(getProfileRichPresence(profile));
      }
    };

    mx.on(ClientEvent.UserProfileUpdate, handleProfileUpdate);

    const loadProfile = async () => {
      const loadVersion = updateVersion;
      try {
        const profile = await mx.getExtendedProfile(userId);
        if (active && loadVersion === updateVersion) {
          setRichPresence(getProfileRichPresence(profile));
        }
      } catch {
        if (active && loadVersion === updateVersion) {
          setRichPresence(undefined);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
      mx.removeListener(ClientEvent.UserProfileUpdate, handleProfileUpdate);
    };
  }, [mx, userId]);

  return richPresence;
};
