import { useCallback, useEffect, useState } from 'react';
import { getPersistedMediaVolume, updatePersistedMediaVolume } from '../../utils/mediaVolume';

export type MediaVolumeData = {
  volume: number;
  mute: boolean;
};

export type MediaVolumeControl = {
  setMute: (mute: boolean) => void;
  setVolume: (volume: number) => void;
};

export const useMediaVolume = (
  getTargetElement: () => HTMLMediaElement | null
): MediaVolumeData & MediaVolumeControl => {
  const [volumeData, setVolumeData] = useState<MediaVolumeData>(getPersistedMediaVolume);

  const setMute = useCallback(
    (mute: boolean) => {
      const targetEl = getTargetElement();
      if (!targetEl) return;
      targetEl.muted = mute;
    },
    [getTargetElement]
  );

  const setVolume = useCallback(
    (volume: number) => {
      const targetEl = getTargetElement();
      if (!targetEl) return;
      targetEl.volume = volume;
    },
    [getTargetElement]
  );

  useEffect(() => {
    const targetEl = getTargetElement();
    const handleChange = () => {
      if (!targetEl) return;
      const next = {
        mute: targetEl.muted,
        volume: Math.max(0, Math.min(targetEl.volume, 1)),
      };
      setVolumeData(next);
      updatePersistedMediaVolume(next);
    };

    if (targetEl) {
      // Apply the persisted volume to a freshly mounted element.
      const persisted = getPersistedMediaVolume();
      targetEl.volume = persisted.volume;
      targetEl.muted = persisted.mute;
      targetEl.addEventListener('volumechange', handleChange);
    }
    return () => {
      targetEl?.removeEventListener('volumechange', handleChange);
    };
  }, [getTargetElement]);

  return {
    ...volumeData,
    setMute,
    setVolume,
  };
};
