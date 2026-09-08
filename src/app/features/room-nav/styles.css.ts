import { globalStyle, style } from '@vanilla-extract/css';
import { color, config } from 'folds';

export const CategoryButton = style({
  flexGrow: 1,
});

export const DmStatus = style({
  transform: `translateY(calc(-1 * ${config.space.S100}))`,
});
export const CategoryButtonIcon = style({
  opacity: config.opacity.P400,
});

export const CallNavItemMembers = style({
  width: '100%',
  minWidth: 0,
});

export const CallNavItemMemberAvatar = style({
  flexShrink: 0,
  outline: '2px solid transparent',
  outlineOffset: '2px',
});

export const CallNavItemMember = style({
  minWidth: 0,
  width: '100%',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: `${config.space.S100} ${config.space.S200}`,
  textAlign: 'left',
  color: 'inherit',
  font: 'inherit',
  borderRadius: config.radii.R300,
  selectors: {
    '&:hover': {
      backgroundColor: color.Background.ContainerHover,
    },
    '&:focus-visible': {
      outline: `2px solid ${color.Primary.Main}`,
      outlineOffset: '-2px',
    },
    '&[data-speaking=true]': {
      color: color.Background.OnContainer,
    },
  },
});

export const SortableNavItem = style({
  position: 'relative',
  cursor: 'grab',
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

globalStyle(`${CallNavItemMember}[data-speaking=true] ${CallNavItemMemberAvatar}`, {
  outlineColor: color.Success.Main,
});
