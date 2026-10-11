import React, { useState } from 'react';
import { Box, Button, Spinner, Text, toRem } from 'folds';
import { Attachment, AttachmentBox } from '../attachment';
import { Image } from '../../media/Image';
import { fitWithin } from '../../../utils/common';
import * as css from './style.css';

export type DirectGifContentProps = {
  url: string;
  autoLoad?: boolean;
};

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

function DirectGifPreview({ url, autoLoad }: DirectGifContentProps) {
  const [status, setStatus] = useState<LoadStatus>(autoLoad ? 'loading' : 'idle');
  const [dimensions, setDimensions] = useState<[number, number]>([400, 300]);
  const [width, height] = dimensions;

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setDimensions(fitWithin(naturalWidth, naturalHeight, 400, 350));
    }
    setStatus('loaded');
  };

  return (
    <Attachment style={{ width: toRem(width) }}>
      <AttachmentBox style={{ width: toRem(width), height: toRem(height) }}>
        <Box className={css.RelativeBase}>
          {(status === 'loading' || status === 'loaded') && (
            <Box className={css.AbsoluteContainer}>
              {/* Direct image loading supports bridge redirects without CORS */}
              <Image
                src={url}
                alt="GIF preview"
                onLoad={handleLoad}
                onError={() => setStatus('error')}
              />
            </Box>
          )}
          {status === 'loading' && (
            <Box className={css.AbsoluteContainer} alignItems="Center" justifyContent="Center">
              <Spinner variant="Secondary" aria-label="Loading GIF" />
            </Box>
          )}
          {(status === 'idle' || status === 'error') && (
            <Box
              className={css.AbsoluteContainer}
              direction="Column"
              gap="200"
              alignItems="Center"
              justifyContent="Center"
            >
              {status === 'error' && <Text size="T300">Failed to load GIF!</Text>}
              <Button
                variant={status === 'error' ? 'Critical' : 'Secondary'}
                fill="Solid"
                radii="300"
                size="300"
                onClick={() => setStatus('loading')}
              >
                <Text size="B300">{status === 'error' ? 'Retry' : 'Load GIF'}</Text>
              </Button>
            </Box>
          )}
        </Box>
      </AttachmentBox>
    </Attachment>
  );
}

export function DirectGifContent({ url, autoLoad = true }: DirectGifContentProps) {
  return <DirectGifPreview key={`${url}:${autoLoad}`} url={url} autoLoad={autoLoad} />;
}
