import React from 'react';
import classNames from 'classnames';
import { Text, as } from 'folds';
import * as css from './UrlPreview.css';

export const UrlPreview = as<'article', { thumbnail?: boolean }>(
  ({ className, thumbnail, ...props }, ref) => (
    <article
      className={classNames(css.UrlPreview, thumbnail && css.UrlPreviewWithThumbnail, className)}
      {...props}
      ref={ref}
    />
  )
);

export const UrlPreviewContent = as<'div'>(({ className, ...props }, ref) => (
  <div className={classNames(css.UrlPreviewContent, className)} {...props} ref={ref} />
));

export const UrlPreviewProvider = as<'span'>(({ className, ...props }, ref) => (
  <Text
    as="span"
    size="T200"
    className={classNames(css.UrlPreviewProvider, className)}
    {...props}
    ref={ref}
  />
));

export const UrlPreviewAuthor = as<'span'>(({ className, ...props }, ref) => (
  <Text
    as="span"
    size="T300"
    className={classNames(css.UrlPreviewAuthor, className)}
    {...props}
    ref={ref}
  />
));

export const UrlPreviewTitle = as<'a'>(({ className, ...props }, ref) => (
  <Text
    as="a"
    size="T400"
    className={classNames(css.UrlPreviewTitle, className)}
    {...props}
    ref={ref}
  />
));

export const UrlPreviewDescription = as<'span'>(({ className, ...props }, ref) => (
  <Text
    as="span"
    size="T300"
    className={classNames(css.UrlPreviewDescription, className)}
    {...props}
    ref={ref}
  />
));

export const UrlPreviewThumbnail = as<'img'>(({ className, alt, ...props }, ref) => (
  <img className={classNames(css.UrlPreviewThumbnail, className)} alt={alt} {...props} ref={ref} />
));

export const UrlPreviewImg = as<'img'>(({ className, alt, ...props }, ref) => (
  <img className={classNames(css.UrlPreviewImg, className)} alt={alt} {...props} ref={ref} />
));
