import { style, styleVariants } from '@vanilla-extract/css';
import { color, config, DefaultReset, toRem } from 'folds';

export const Editor = style([
  DefaultReset,
  {
    backgroundColor: color.SurfaceVariant.Container,
    color: color.SurfaceVariant.OnContainer,
    boxShadow: `inset 0 0 0 ${config.borderWidth.B300} ${color.SurfaceVariant.ContainerLine}`,
    borderRadius: config.radii.R400,
    overflow: 'hidden',
  },
]);

export const EditorOptions = style([
  DefaultReset,
  {
    padding: config.space.S200,
  },
]);

export const EditorTextareaScroll = style({});

export const EditorTextarea = style([
  DefaultReset,
  {
    flexGrow: 1,
    height: '100%',
    padding: `${toRem(13)} ${toRem(1)}`,
    selectors: {
      [`${EditorTextareaScroll}:first-child &`]: {
        paddingLeft: toRem(13),
      },
      [`${EditorTextareaScroll}:last-child &`]: {
        paddingRight: toRem(13),
      },
      '&:focus': {
        outline: 'none',
      },
    },
  },
]);

export const EditorPlaceholderContainer = style([
  DefaultReset,
  {
    opacity: config.opacity.Placeholder,
    pointerEvents: 'none',
    userSelect: 'none',
  },
]);

export const EditorPlaceholderTextVisual = style([
  DefaultReset,
  {
    display: 'block',
    paddingTop: toRem(13),
    paddingLeft: toRem(1),
  },
]);

export const EditorToolbarBase = style({
  padding: `0 ${config.borderWidth.B300}`,
});

export const EditorToolbar = style({
  padding: config.space.S100,
});

export const MarkdownBtnBox = style({
  paddingRight: config.space.S100,
});

export const MdSyntax = style({
  opacity: config.opacity.P300,
});
export const MdBold = style({
  fontWeight: config.fontWeight.W700,
});
export const MdItalic = style({
  fontStyle: 'italic',
});
export const MdUnderline = style({
  textDecoration: 'underline',
});
export const MdStrikeThrough = style({
  textDecoration: 'line-through',
});
export const MdCode = style({
  fontFamily: 'monospace',
  backgroundColor: color.SurfaceVariant.ContainerActive,
  borderRadius: config.radii.R300,
});
export const MdSpoiler = style({
  backgroundColor: color.SurfaceVariant.ContainerActive,
  borderRadius: config.radii.R300,
});
export const MdLink = style({
  color: color.Primary.Main,
});

export const MdLineHeading = styleVariants({
  1: { fontSize: toRem(24), lineHeight: 1.3, fontWeight: config.fontWeight.W700 },
  2: { fontSize: toRem(20), lineHeight: 1.3, fontWeight: config.fontWeight.W700 },
  3: { fontSize: toRem(16), lineHeight: 1.3, fontWeight: config.fontWeight.W700 },
});
export const MdLineQuote = style({
  paddingLeft: config.space.S200,
  borderLeft: `${config.borderWidth.B700} solid ${color.SurfaceVariant.ContainerLine}`,
});
export const MdLineSubtext = style({
  fontSize: toRem(12),
  opacity: config.opacity.P500,
});
export const MdLineCode = style({
  fontFamily: 'monospace',
  backgroundColor: color.SurfaceVariant.ContainerActive,
  padding: `0 ${config.space.S200}`,
});
