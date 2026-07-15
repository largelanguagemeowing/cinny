import { globalStyle, style } from '@vanilla-extract/css';
import { DefaultReset, color, config, toRem } from 'folds';

export const ImageEditor = style([
  DefaultReset,
  {
    height: '100%',
  },
]);

export const ImageEditorHeader = style([
  DefaultReset,
  {
    paddingLeft: config.space.S200,
    paddingRight: config.space.S200,
    borderBottomWidth: config.borderWidth.B300,
    flexShrink: 0,
    gap: config.space.S200,
  },
]);

export const ImageEditorContent = style([
  DefaultReset,
  {
    backgroundColor: color.Background.Container,
    color: color.Background.OnContainer,
    overflow: 'hidden',
  },
]);

export const Image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const CropEditor = style({
  width: '100%',
  padding: config.space.S400,
});

export const CropFrame = style({
  width: '100%',
  maxWidth: toRem(720),
  overflow: 'hidden',
  borderRadius: config.radii.R300,
  outline: `${config.borderWidth.B300} solid ${color.Background.ContainerLine}`,
});

export const Controls = style({
  width: '100%',
  maxWidth: toRem(720),
});

globalStyle(`${Controls} input`, {
  width: '100%',
});

globalStyle(`${Controls} label`, {
  flex: 1,
});
