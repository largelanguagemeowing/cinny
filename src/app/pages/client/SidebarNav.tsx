import React, { useRef } from 'react';
import { Scroll } from 'folds';

import {
  Sidebar,
  SidebarContent,
  SidebarStackSeparator,
  SidebarStack,
} from '../../components/sidebar';
import { HomeTab, DirectTab, SpaceTabs, ExploreTab, SettingsTab, UnverifiedTab } from './sidebar';
import { CreateTab } from './sidebar/CreateTab';

export function SidebarNav() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Sidebar>
      <SidebarContent
        scrollable={
          <Scroll ref={scrollRef} variant="Background" size="0">
            <SidebarStack>
              <HomeTab />
            </SidebarStack>
            <DirectTab />
            <SpaceTabs scrollRef={scrollRef} />
            <SidebarStackSeparator />
            <SidebarStack>
              <ExploreTab />
              <CreateTab />
            </SidebarStack>
            <SidebarStackSeparator />
            <SidebarStack>
              <UnverifiedTab />
              <SettingsTab />
            </SidebarStack>
          </Scroll>
        }
      />
    </Sidebar>
  );
}
