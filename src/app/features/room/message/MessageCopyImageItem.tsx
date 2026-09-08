import React, { useState } from 'react';
import { Icon, Icons, MenuItem, Text } from 'folds';
import { copyImage } from '../../../utils/copyImage';
import * as css from './styles.css';

export function MessageCopyImageItem({ src, onClose }: { src: string; onClose: () => void }) {
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState(false);

  const handleCopy = async () => {
    setCopying(true);
    setError(false);
    try {
      await copyImage(src);
      onClose();
    } catch {
      setError(true);
    } finally {
      setCopying(false);
    }
  };

  return (
    <>
      <MenuItem
        size="300"
        after={<Icon size="100" src={Icons.Photo} />}
        radii="300"
        disabled={copying}
        onClick={handleCopy}
      >
        <Text className={css.MessageMenuItemText} as="span" size="T300" truncate>
          {copying ? 'Copying image…' : 'Copy image'}
        </Text>
      </MenuItem>
      {error && (
        <Text size="T200" role="alert">
          Could not copy image. Check clipboard permissions and try again.
        </Text>
      )}
    </>
  );
}
