import React from 'react';
import { Home } from '../home/Home';

/**
 * Direct Messages is merged into the Home view. Both `/home` and `/direct`
 * routes render the same combined channel list (orphan rooms + direct
 * messages), so navigating between an orphan room and a DM is seamless and the
 * sidebar's single Home slot stays selected.
 */
export function Direct() {
  return <Home />;
}
