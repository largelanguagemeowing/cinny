import { keyframes, style } from '@vanilla-extract/css';
import { color, config, toRem } from 'folds';

const SpeakerPulse = keyframes({
  '0%, 100%': {
    boxShadow: `0 0 0 0 transparent`,
  },
  '50%': {
    boxShadow: `0 0 6px 1px ${color.Success.Main}`,
  },
});

export const LiveSpeakerIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: color.Success.Main,
  borderRadius: '50%',
  animation: `${SpeakerPulse} 2s ease-in-out infinite`,
});

export const LiveTimer = style({
  color: color.Success.Main,
  fontVariantNumeric: 'tabular-nums',
});

export const CallStatus = style([
  {
    padding: `${toRem(6)} ${config.space.S200}`,
    borderTop: `${config.borderWidth.B300} solid ${color.Background.ContainerLine}`,
  },
]);

export const ControlDivider = style({
  height: toRem(16),
});

export const SpeakerAvatarOutline = style({
  boxShadow: `0 0 0 ${config.borderWidth.B600} ${color.Success.Main}`,
});
