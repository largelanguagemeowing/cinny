import { globalStyle, style } from '@vanilla-extract/css';
import { toRem } from 'folds';

export const SearchForm = style({
  width: toRem(200),
});

globalStyle(`${SearchForm} input`, {
  flexGrow: 1,
  flexBasis: 0,
  minWidth: 0,
});
