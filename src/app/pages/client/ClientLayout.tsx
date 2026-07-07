import React, { ReactNode } from 'react';
import { Box } from 'folds';
import { TopBar } from './TopBar';

type ClientLayoutProps = {
  nav: ReactNode;
  children: ReactNode;
};
export function ClientLayout({ nav, children }: ClientLayoutProps) {
  return (
    <Box grow="Yes">
      <Box shrink="No">{nav}</Box>
      <Box grow="Yes" direction="Column">
        <TopBar />
        {children}
      </Box>
    </Box>
  );
}
