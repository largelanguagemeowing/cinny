import { createVar, style } from '@vanilla-extract/css';
import { DefaultReset, FocusOutline, color, config, toRem } from 'folds';

export const PollCard = style([
  DefaultReset,
  {
    maxWidth: toRem(560),
    padding: config.space.S400,
    marginTop: config.space.S100,
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S300,
    backgroundColor: color.SurfaceVariant.Container,
    border: `${config.borderWidth.B300} solid ${color.SurfaceVariant.ContainerLine}`,
    borderRadius: config.radii.R400,
    color: color.SurfaceVariant.OnContainer,
  },
]);

const OptionContainer = createVar();
const OptionContainerHover = createVar();
const OptionLine = createVar();
const OptionFill = createVar();

export const PollOptionFill = createVar();

export const PollOption = style([
  DefaultReset,
  FocusOutline,
  {
    vars: {
      [OptionContainer]: color.Surface.Container,
      [OptionContainerHover]: color.Surface.ContainerHover,
      [OptionLine]: 'transparent',
      [OptionFill]: color.Surface.ContainerActive,
      [PollOptionFill]: '0%',
    },
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    minHeight: toRem(52),
    padding: `${config.space.S300} ${config.space.S400}`,
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S300,
    textAlign: 'left',
    color: color.Surface.OnContainer,
    backgroundColor: OptionContainer,
    border: `${config.borderWidth.B300} solid ${OptionLine}`,
    borderRadius: config.radii.R400,

    // Result bar, sized by the answer's share of the vote.
    '::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      width: PollOptionFill,
      backgroundColor: OptionFill,
      transition: 'width 300ms ease',
      pointerEvents: 'none',
    },

    selectors: {
      'button&': {
        cursor: 'pointer',
      },
      'button&:hover, button&:focus-visible': {
        backgroundColor: OptionContainerHover,
      },
      '&[aria-checked=true], &[data-voted=true]': {
        vars: {
          [OptionContainer]: color.Primary.Container,
          [OptionContainerHover]: color.Primary.ContainerHover,
          [OptionLine]: color.Primary.Main,
          [OptionFill]: color.Primary.ContainerActive,
        },
        color: color.Primary.OnContainer,
      },
      '&:disabled': {
        cursor: 'default',
      },
    },
  },
]);

export const PollOptionContent = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: config.space.S300,
  width: '100%',
  minWidth: 0,
});

export const PollOptionText = style({
  flexGrow: 1,
  minWidth: 0,
  overflowWrap: 'anywhere',
});

export const PollIndicator = style([
  DefaultReset,
  {
    flexShrink: 0,
    width: toRem(22),
    height: toRem(22),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `${toRem(2)} solid ${color.Surface.OnContainer}`,
    borderRadius: '50%',
    opacity: 0.8,
    selectors: {
      '&[data-multiple=true]': {
        borderRadius: config.radii.R300,
      },
      '&[data-checked=true]': {
        opacity: 1,
        borderColor: color.Primary.Main,
        backgroundColor: color.Primary.Main,
        color: color.Primary.OnMain,
      },
    },
  },
]);
