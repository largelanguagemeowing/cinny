import { style } from '@vanilla-extract/css';
import { toRem, color, config, DefaultReset, FocusOutline } from 'folds';

/**
 * Layout
 */

export const Base = style({
  maxWidth: toRem(498),
  width: `calc(100vw - 2 * ${config.space.S400})`,
  height: toRem(440),
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  border: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
  borderRadius: config.radii.R400,
  boxShadow: config.shadow.E200,
  overflow: 'hidden',
});

export const Header = style({
  padding: config.space.S300,
  paddingBottom: 0,
});

/**
 * Sidebar
 */

export const Sidebar = style({
  width: toRem(54),
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  position: 'relative',
});

export const SidebarContent = style({
  padding: `${config.space.S200} 0`,
});

export const SidebarStack = style({
  width: '100%',
  backgroundColor: color.Surface.Container,
});

export const SidebarDivider = style({
  width: toRem(18),
});

export const SidebarBtnImg = style({
  width: toRem(24),
  height: toRem(24),
  objectFit: 'contain',
});

/**
 * Preview
 */

export const Preview = style({
  padding: config.space.S200,
  margin: config.space.S300,
  marginTop: 0,
  minHeight: toRem(40),

  borderRadius: config.radii.R400,
  backgroundColor: color.SurfaceVariant.Container,
  color: color.SurfaceVariant.OnContainer,
});

export const PreviewEmoji = style([
  DefaultReset,
  {
    width: toRem(32),
    height: toRem(32),
    fontSize: toRem(32),
    lineHeight: toRem(32),
  },
]);
export const PreviewImg = style([
  DefaultReset,
  {
    width: toRem(32),
    height: toRem(32),
    objectFit: 'contain',
  },
]);

/**
 * Group
 */

export const EmojiGroup = style({
  position: 'relative',
  padding: `${config.space.S300} 0`,
});

export const EmojiGroupLabel = style({
  position: 'sticky',
  top: config.space.S200,
  zIndex: 1,

  margin: 'auto',
  padding: `${config.space.S100} ${config.space.S200}`,
  borderRadius: config.radii.Pill,
  backgroundColor: color.SurfaceVariant.Container,
  color: color.SurfaceVariant.OnContainer,
});

export const EmojiGroupContent = style([
  DefaultReset,
  {
    padding: `0 ${config.space.S200}`,
  },
]);

/**
 * Item
 */

export const EmojiItem = style([
  DefaultReset,
  FocusOutline,
  {
    width: toRem(48),
    height: toRem(48),
    fontSize: toRem(32),
    lineHeight: toRem(32),
    borderRadius: config.radii.R400,
    cursor: 'pointer',

    ':hover': {
      backgroundColor: color.Surface.ContainerHover,
    },
  },
]);

export const StickerItem = style([
  EmojiItem,
  {
    width: toRem(112),
    height: toRem(112),
  },
]);

export const CustomEmojiImg = style([
  DefaultReset,
  {
    width: toRem(32),
    height: toRem(32),
    objectFit: 'contain',
  },
]);

export const StickerImg = style([
  DefaultReset,
  {
    width: toRem(96),
    height: toRem(96),
    objectFit: 'contain',
  },
]);

/**
 * GIF Picker
 */

export const GifPicker = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  // Allow the picker to shrink below its content so the inner scroll area can
  // scroll instead of overflowing the fixed-height board.
  minHeight: 0,
});

export const GifSearch = style({
  padding: `0 ${config.space.S300} ${config.space.S100}`,
});

export const GifScrollWrap = style({
  minHeight: 0,
});

// Masonry-style grid using CSS columns. Two columns with 12px gaps match
// Discord's GIF picker layout within the 498px picker width.
export const GifGrid = style({
  columnCount: 2,
  columnGap: config.space.S300,
  padding: `0 ${config.space.S300} ${config.space.S100}`,
  width: '100%',
});

export const GifTile = style([
  DefaultReset,
  FocusOutline,
  {
    // Avoid a tile being split across columns.
    breakInside: 'avoid',
    display: 'block',
    width: '100%',
    marginBottom: config.space.S100,
    padding: 0,
    border: 'none',
    background: 'transparent',
    borderRadius: config.radii.R300,
    overflow: 'hidden',
    cursor: 'pointer',

    ':hover': {
      backgroundColor: color.Surface.ContainerHover,
    },
  },
]);

export const GifTileImg = style([
  DefaultReset,
  {
    display: 'block',
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
  },
]);

export const GifStatus = style({
  padding: `${config.space.S500} ${config.space.S400}`,
});
