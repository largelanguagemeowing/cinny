import React, { FormEventHandler, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Chip,
  Header,
  Icon,
  IconButton,
  Icons,
  Input,
  Text,
  Tooltip,
  TooltipProvider,
  config,
  toRem,
} from 'folds';
import { useAtom, useAtomValue } from 'jotai';
import { allInvitesAtom } from '../../state/room-list/inviteList';
import {
  getInboxInvitesPath,
  getInboxNotificationsPath,
  getInboxPath,
  joinPathComponent,
} from '../pathUtils';
import { useInboxSelected } from '../../hooks/router/useInbox';
import { UnreadBadge } from '../../components/unread-badge';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';
import { useNavToActivePathAtom } from '../../state/hooks/navToActivePath';
import { ContainerColor } from '../../styles/ContainerColor.css';
import { roomSearchTermAtom, roomSearchDrawerActiveAtom } from '../../state/roomSearch';
import * as css from './TopBar.css';

function InboxButton() {
  const screenSize = useScreenSizeContext();
  const navigate = useNavigate();
  const navToActivePath = useAtomValue(useNavToActivePathAtom());
  const inboxSelected = useInboxSelected();
  const allInvites = useAtomValue(allInvitesAtom);
  const inviteCount = allInvites.length;

  const handleInboxClick = () => {
    if (screenSize === ScreenSize.Mobile) {
      navigate(getInboxPath());
      return;
    }
    const activePath = navToActivePath.get('inbox');
    if (activePath) {
      navigate(joinPathComponent(activePath));
      return;
    }

    const path = inviteCount > 0 ? getInboxInvitesPath() : getInboxNotificationsPath();
    navigate(path);
  };

  return (
    <Box shrink="No" style={{ position: 'relative' }}>
      <TooltipProvider
        position="Bottom"
        offset={4}
        tooltip={
          <Tooltip>
            <Text size="H5">Inbox</Text>
          </Tooltip>
        }
      >
        {(triggerRef) => (
          <IconButton
            ref={triggerRef}
            variant="Background"
            fill="None"
            size="300"
            onClick={handleInboxClick}
            aria-pressed={inboxSelected}
          >
            <Icon size="200" src={Icons.Inbox} filled={inboxSelected} />
          </IconButton>
        )}
      </TooltipProvider>
      {inviteCount > 0 && (
        <Box
          shrink="No"
          alignItems="Center"
          justifyContent="Center"
          style={{
            position: 'absolute',
            top: toRem(2),
            right: toRem(2),
            pointerEvents: 'none',
            lineHeight: 0,
            minWidth: toRem(16),
          }}
        >
          <UnreadBadge highlight count={inviteCount} />
        </Box>
      )}
    </Box>
  );
}

function RoomSearchBar() {
  const [searchTerm, setSearchTerm] = useAtom(roomSearchTermAtom);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    const form = evt.target as HTMLFormElement & { searchInput: HTMLInputElement };
    const term = form.searchInput.value.trim();
    if (term) setSearchTerm(term);
  };

  const handleClear = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
      searchInputRef.current.focus();
    }
    setSearchTerm(undefined);
  };

  return (
    <Box
      as="form"
      className={css.SearchForm}
      onSubmit={handleSubmit}
      grow="Yes"
      alignItems="Center"
      gap="200"
    >
      <Input
        ref={searchInputRef}
        name="searchInput"
        style={{ paddingRight: config.space.S200 }}
        placeholder="Search messages"
        variant="Surface"
        size="300"
        radii="400"
        autoComplete="off"
        before={<Icon size="50" src={Icons.Search} />}
        after={
          searchTerm ? (
            <Chip
              variant="Surface"
              size="400"
              radii="Pill"
              outlined
              aria-pressed
              type="button"
              onClick={handleClear}
              after={<Icon size="50" src={Icons.Cross} />}
            >
              <Text size="B300">Clear</Text>
            </Chip>
          ) : null
        }
      />
    </Box>
  );
}

export function TopBar() {
  const drawerActive = useAtomValue(roomSearchDrawerActiveAtom);

  return (
    <Header
      variant="Background"
      size="400"
      className={ContainerColor({ variant: 'Background' })}
      style={{
        borderBottomWidth: config.borderWidth.B300,
        padding: `0 ${config.space.S200}`,
      }}
    >
      <Box alignItems="Center" justifyContent="End" grow="Yes" gap="200">
        {drawerActive && <RoomSearchBar />}
        <InboxButton />
      </Box>
    </Header>
  );
}
