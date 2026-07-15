import { Box, Button, config, Icon, Icons, Text } from 'folds';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHero, UserHeroName } from './UserHero';
import { getMxIdServer, mxcUrlToHttp } from '../../utils/matrix';
import { getMemberAvatarMxc, getMemberDisplayName } from '../../utils/room';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { usePowerLevels } from '../../hooks/usePowerLevels';
import { useRoom } from '../../hooks/useRoom';
import { useUserPresence } from '../../hooks/useUserPresence';
import { IgnoredUserAlert, MutualRoomsChip, OptionsChip, ServerChip, ShareChip } from './UserChips';
import { useCloseUserRoomProfile } from '../../state/hooks/userRoomProfile';
import { PowerChip } from './PowerChip';
import { UserInviteAlert, UserBanAlert, UserModeration, UserKickAlert } from './UserModeration';
import { useIgnoredUsers } from '../../hooks/useIgnoredUsers';
import { useMembership } from '../../hooks/useMembership';
import { Membership } from '../../../types/matrix/room';
import { useRoomCreators } from '../../hooks/useRoomCreators';
import { useRoomPermissions } from '../../hooks/useRoomPermissions';
import { useMemberPowerCompare } from '../../hooks/useMemberPowerCompare';
import { CreatorChip } from './CreatorChip';
import { getDirectCreatePath, withSearchParam } from '../../pages/pathUtils';
import { DirectCreateSearchParams } from '../../pages/paths';
import { useUserRichPresence } from '../../hooks/useUserRichPresence';
import { UserRichPresence } from './UserRichPresence';
import { useUserProfile } from '../../hooks/useUserProfile';
import {
  getProfileBanner,
  getProfileBiography,
  getProfileConnections,
  getProfilePronouns,
} from '../../../types/matrix/profile';

type UserRoomProfileProps = {
  userId: string;
};
export function UserRoomProfile({ userId }: UserRoomProfileProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const navigate = useNavigate();
  const closeUserRoomProfile = useCloseUserRoomProfile();
  const ignoredUsers = useIgnoredUsers();
  const ignored = ignoredUsers.includes(userId);

  const room = useRoom();
  const powerLevels = usePowerLevels(room);
  const creators = useRoomCreators(room);

  const permissions = useRoomPermissions(creators, powerLevels);
  const { hasMorePower } = useMemberPowerCompare(creators, powerLevels);

  const myUserId = mx.getSafeUserId();
  const creator = creators.has(userId);

  const canKickUser = permissions.action('kick', myUserId) && hasMorePower(myUserId, userId);
  const canBanUser = permissions.action('ban', myUserId) && hasMorePower(myUserId, userId);
  const canUnban = permissions.action('ban', myUserId);
  const canInvite = permissions.action('invite', myUserId);

  const member = room.getMember(userId);
  const membership = useMembership(room, userId);

  const server = getMxIdServer(userId);
  const displayName = getMemberDisplayName(room, userId);
  const avatarMxc = getMemberAvatarMxc(room, userId);
  const avatarUrl = (avatarMxc && mxcUrlToHttp(mx, avatarMxc, useAuthentication)) ?? undefined;

  const presence = useUserPresence(userId);
  const richPresence = useUserRichPresence(userId);
  const profile = useUserProfile(userId);
  const pronouns = getProfilePronouns(profile.extended)
    .map((pronoun) => pronoun.summary)
    .join(', ');
  const bannerMxc = getProfileBanner(profile.extended);
  const biography = getProfileBiography(profile.extended);
  const connections = getProfileConnections(profile.extended);
  const bannerUrl = bannerMxc
    ? mxcUrlToHttp(mx, bannerMxc, useAuthentication) ?? undefined
    : undefined;

  const handleMessage = () => {
    closeUserRoomProfile();
    const directSearchParam: DirectCreateSearchParams = {
      userId,
    };
    navigate(withSearchParam(getDirectCreatePath(), directSearchParam));
  };

  return (
    <Box direction="Column">
      <UserHero
        userId={userId}
        avatarUrl={avatarUrl}
        bannerUrl={bannerUrl}
        presence={presence && presence.lastActiveTs !== 0 ? presence : undefined}
      />
      <Box direction="Column" gap="500" style={{ padding: config.space.S400 }}>
        <Box direction="Column" gap="400">
          <Box gap="400" alignItems="Start">
            <UserHeroName displayName={displayName} userId={userId} pronouns={pronouns} />
            {userId !== myUserId && (
              <Box shrink="No">
                <Button
                  size="300"
                  variant="Primary"
                  fill="Solid"
                  radii="300"
                  before={<Icon size="50" src={Icons.Message} filled />}
                  onClick={handleMessage}
                >
                  <Text size="B300">Message</Text>
                </Button>
              </Box>
            )}
          </Box>
          <Box alignItems="Center" gap="200" wrap="Wrap">
            {server && <ServerChip server={server} />}
            <ShareChip userId={userId} />
            {creator ? <CreatorChip /> : <PowerChip userId={userId} />}
            {userId !== myUserId && <MutualRoomsChip userId={userId} />}
            {userId !== myUserId && <OptionsChip userId={userId} />}
          </Box>
        </Box>
        {biography && (
          <Text style={{ whiteSpace: 'pre-wrap' }} priority="300">
            {biography}
          </Text>
        )}
        {connections.length > 0 && (
          <Box as="ul" direction="Column" gap="100" style={{ margin: 0, padding: 0 }}>
            {connections.map((connection) => (
              <Box as="li" key={`${connection.description}:${connection.uri}`} direction="Column">
                <Text size="L400">{connection.description}</Text>
                <Text
                  as="a"
                  href={connection.uri}
                  target={connection.uri.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer noopener"
                  size="T200"
                  priority="300"
                  truncate
                  title={connection.uri}
                >
                  {connection.uri}
                </Text>
              </Box>
            ))}
          </Box>
        )}
        {richPresence && <UserRichPresence presence={richPresence} />}
        {ignored && <IgnoredUserAlert />}
        {member && membership === Membership.Ban && (
          <UserBanAlert
            userId={userId}
            reason={member.events.member?.getContent().reason}
            canUnban={canUnban}
            bannedBy={member.events.member?.getSender()}
            ts={member.events.member?.getTs()}
          />
        )}
        {member &&
          membership === Membership.Leave &&
          member.events.member &&
          member.events.member.getSender() !== userId && (
            <UserKickAlert
              reason={member.events.member?.getContent().reason}
              kickedBy={member.events.member?.getSender()}
              ts={member.events.member?.getTs()}
            />
          )}
        {member && membership === Membership.Invite && (
          <UserInviteAlert
            userId={userId}
            reason={member.events.member?.getContent().reason}
            canKick={canKickUser}
            invitedBy={member.events.member?.getSender()}
            ts={member.events.member?.getTs()}
          />
        )}
        <UserModeration
          userId={userId}
          canInvite={canInvite && membership === Membership.Leave}
          canKick={canKickUser && membership === Membership.Join}
          canBan={canBanUser && membership !== Membership.Ban}
        />
      </Box>
    </Box>
  );
}
