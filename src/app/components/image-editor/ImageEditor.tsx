import React, { useId, useState } from 'react';
import classNames from 'classnames';
import { Box, Chip, Header, Icon, IconButton, Icons, Text, as } from 'folds';
import * as css from './ImageEditor.css';

export type ImageEditorProps = {
  name: string;
  url: string;
  requestClose: () => void;
  aspectRatio?: number;
  outputWidth?: number;
  onApply?: (file: File) => void;
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to crop image'))),
      type
    );
  });

export const ImageEditor = as<'div', ImageEditorProps>(
  (
    { className, name, url, requestClose, aspectRatio = 1, outputWidth = 1024, onApply, ...props },
    ref
  ) => {
    const [zoom, setZoom] = useState(1);
    const [positionX, setPositionX] = useState(50);
    const [positionY, setPositionY] = useState(50);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState<string>();
    const zoomId = useId();
    const positionXId = useId();
    const positionYId = useId();

    const handleApply = async () => {
      if (!onApply || applying) return;
      setApplying(true);
      setError(undefined);
      try {
        const image = await loadImage(url);
        const sourceRatio = image.naturalWidth / image.naturalHeight;
        let cropWidth =
          sourceRatio > aspectRatio ? image.naturalHeight * aspectRatio : image.naturalWidth;
        let cropHeight =
          sourceRatio > aspectRatio ? image.naturalHeight : image.naturalWidth / aspectRatio;
        cropWidth /= zoom;
        cropHeight /= zoom;

        const sourceX = ((image.naturalWidth - cropWidth) * positionX) / 100;
        const sourceY = ((image.naturalHeight - cropHeight) * positionY) / 100;
        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = Math.round(outputWidth / aspectRatio);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is unavailable');
        context.drawImage(
          image,
          sourceX,
          sourceY,
          cropWidth,
          cropHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );
        const type = 'image/jpeg';
        const blob = await canvasToBlob(canvas, type);
        onApply(new File([blob], `${name.replace(/\.[^.]+$/, '')}.jpg`, { type }));
      } catch {
        setError('Could not crop this image. Try another image.');
      } finally {
        setApplying(false);
      }
    };

    return (
      <Box
        className={classNames(css.ImageEditor, className)}
        direction="Column"
        {...props}
        ref={ref}
      >
        <Header className={css.ImageEditorHeader} size="400">
          <Box grow="Yes" alignItems="Center" gap="200">
            <IconButton size="300" radii="300" onClick={requestClose}>
              <Icon size="50" src={Icons.ArrowLeft} />
            </IconButton>
            <Text size="T300" truncate>
              Image Editor
            </Text>
          </Box>
          <Box shrink="No" alignItems="Center" gap="200">
            <Chip
              variant="Primary"
              radii="300"
              onClick={handleApply}
              disabled={!onApply || applying}
              aria-disabled={!onApply || applying}
            >
              <Text size="B300">{applying ? 'Cropping...' : 'Apply'}</Text>
            </Chip>
          </Box>
        </Header>
        <Box
          grow="Yes"
          className={css.ImageEditorContent}
          justifyContent="Center"
          alignItems="Center"
        >
          <Box direction="Column" gap="300" alignItems="Center" className={css.CropEditor}>
            <div className={css.CropFrame} style={{ aspectRatio }}>
              <img
                className={css.Image}
                src={url}
                alt={name}
                style={{
                  objectPosition: `${positionX}% ${positionY}%`,
                  transform: `scale(${zoom})`,
                  transformOrigin: `${positionX}% ${positionY}%`,
                }}
              />
            </div>
            <Box direction="Column" gap="200" className={css.Controls}>
              <label htmlFor={zoomId}>
                <Text size="T200">Zoom</Text>
                <input
                  id={zoomId}
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.currentTarget.value))}
                />
              </label>
              <Box gap="300">
                <label htmlFor={positionXId}>
                  <Text size="T200">Horizontal position</Text>
                  <input
                    id={positionXId}
                    type="range"
                    min={0}
                    max={100}
                    value={positionX}
                    onChange={(event) => setPositionX(Number(event.currentTarget.value))}
                  />
                </label>
                <label htmlFor={positionYId}>
                  <Text size="T200">Vertical position</Text>
                  <input
                    id={positionYId}
                    type="range"
                    min={0}
                    max={100}
                    value={positionY}
                    onChange={(event) => setPositionY(Number(event.currentTarget.value))}
                  />
                </label>
              </Box>
              {error && (
                <Text role="alert" size="T200">
                  {error}
                </Text>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
);
