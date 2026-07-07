import { style } from '@vanilla-extract/css';
import { config, toRem } from 'folds';

export const RoomSearchDrawer = style({
  width: toRem(266),
});

export const RoomSearchDrawerHeader = style({
  flexShrink: 0,
  padding: `${config.space.S200} ${config.space.S300}`,
  borderBottomWidth: config.borderWidth.B300,
});

export const RoomSearchContentBase = style({
  position: 'relative',
  overflow: 'hidden',
});

export const ResultItemBase = style({
  padding: `0 ${config.space.S200}`,
});
