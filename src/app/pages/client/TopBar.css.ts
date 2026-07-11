import { globalStyle, style } from '@vanilla-extract/css';

export const SearchForm = style({});

globalStyle(`${SearchForm} input`, {
  flexGrow: 1,
  flexBasis: 0,
  minWidth: 0,
});
