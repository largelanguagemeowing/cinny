import React, { ImgHTMLAttributes, useLayoutEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import * as css from './media.css';

type PausableImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  paused?: boolean;
};

/**
 * Like <Image/>, but when `paused` is true the first frame is rendered to a
 * <canvas> overlay so animated GIFs appear static. When `paused` is false (or
 * not set) the element behaves as a normal <img>.
 *
 * The underlying <img> is always mounted (hidden via visibility when paused)
 * so swapping between paused/playing is instant with no reload flicker.
 */
export function PausableImage({ className, alt, paused, onLoad, ...props }: PausableImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    onLoad?.(e);
  };

  useLayoutEffect(() => {
    if (paused && loaded && imgRef.current && canvasRef.current) {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    }
  }, [paused, loaded]);

  return (
    <>
      <img
        className={classNames(css.Image, className)}
        alt={alt}
        {...props}
        ref={imgRef}
        onLoad={handleLoad}
        style={{
          ...props.style,
          visibility: paused && loaded ? 'hidden' : undefined,
        }}
      />
      {paused && loaded && (
        <canvas
          ref={canvasRef}
          className={classNames(css.Image, className)}
          onClick={props.onClick as unknown as React.MouseEventHandler<HTMLCanvasElement>}
          tabIndex={props.tabIndex}
          style={{
            ...props.style,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )}
    </>
  );
}
