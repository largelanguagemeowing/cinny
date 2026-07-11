import { style } from '@vanilla-extract/css';
import { color, config } from 'folds';

export const CategoryButton = style({
  flexGrow: 1,
});
export const CategoryButtonIcon = style({
  opacity: config.opacity.P400,
});

export const SortableNavItem = style({
  position: 'relative',
  selectors: {
    '&[data-dragging=true]': {
      opacity: config.opacity.P500,
    },
    '&[data-drop-target=before]::before': {
      content: '',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
      borderTop: `${config.borderWidth.B300} solid ${color.Success.Main}`,
    },
  },
});

export const NavItemDragHandle = style({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '20px',
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'grab',
  opacity: 0,
  transition: `opacity ${config.transition}`,
  selectors: {
    [`${SortableNavItem}:hover &`]: {
      opacity: config.opacity.P400,
    },
    '&:active': {
      cursor: 'ns-resize',
    },
  },
});
