import { globalStyle, style } from '@vanilla-extract/css';
import { toRem } from 'folds';

export const SearchForm = style({
  width: toRem(200),
});

export const Profile = style({
  minWidth: 0,
  maxWidth: toRem(240),
});

export const ProfileText = style({
  minWidth: 0,
  flexGrow: 1,
});

globalStyle(`${SearchForm} input`, {
  flexGrow: 1,
  flexBasis: 0,
  minWidth: 0,
});
