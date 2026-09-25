import React, { MouseEventHandler, ReactNode } from 'react';
import { Text, color } from 'folds';
import { MatrixEvent, Room } from 'matrix-js-sdk';
import { useRoomEvent } from '../../hooks/useRoomEvent';
import { usePoll } from '../../hooks/usePoll';
import { PollData, parsePollStart, tallyPoll } from '../../utils/poll';

type PollEndSummaryProps = {
  room: Room;
  startEvent: MatrixEvent;
  poll: PollData;
  endEvent: MatrixEvent;
  senderName: string;
  onViewPoll?: MouseEventHandler;
  children: (content: ReactNode) => ReactNode;
};

function PollEndSummary({
  room,
  startEvent,
  poll,
  endEvent,
  senderName,
  onViewPoll,
  children,
}: PollEndSummaryProps) {
  const { poll: pollModel, responses, loading } = usePoll(room, startEvent);

  // Only the first valid end event counts; later duplicates are hidden.
  if (pollModel?.endEventId && pollModel.endEventId !== endEvent.getId()) return null;

  const tally = tallyPoll(poll, responses, poll.expiresAt);
  const top = Math.max(0, ...tally.counts.values());
  const winners = top > 0 ? poll.answers.filter((a) => tally.counts.get(a.id) === top) : [];
  const percent = tally.voterCount > 0 ? Math.round((top / tally.voterCount) * 100) : 0;

  let result: ReactNode;
  if (loading) result = null;
  else if (winners.length === 0) result = ' No votes were cast.';
  else if (winners.length === 1) {
    result = (
      <>
        {' Winner: '}
        <b>{winners[0].text}</b>
        {` (${percent}%)`}
      </>
    );
  } else {
    result = (
      <>
        {' Tie: '}
        <b>{winners.map((w) => w.text).join(', ')}</b>
        {` (${percent}% each)`}
      </>
    );
  }

  const isCreator = endEvent.getSender() === startEvent.getSender();

  return (
    <>
      {children(
        <Text size="T300" priority="300">
          {isCreator ? (
            <>
              <b>{senderName}</b>
              {"'s poll "}
            </>
          ) : (
            'The poll '
          )}
          <b>{poll.question}</b>
          {' has ended.'}
          {result}
          {!isCreator && (
            <>
              {' Ended by '}
              <b>{senderName}</b>.
            </>
          )}
          {onViewPoll && startEvent.getId() && (
            <>
              {' '}
              <Text
                as="button"
                size="T300"
                data-event-id={startEvent.getId()}
                onClick={onViewPoll}
                style={{ color: color.Primary.Main, cursor: 'pointer' }}
              >
                <b>View Poll</b>
              </Text>
            </>
          )}
        </Text>
      )}
    </>
  );
}

type PollEndProps = {
  room: Room;
  mEvent: MatrixEvent;
  senderName: string;
  onViewPoll?: MouseEventHandler;
  children: (content: ReactNode) => ReactNode;
};

/**
 * Timeline line for an m.poll.end event. Renders nothing for ends that are
 * invalid per MSC3381 (sender is neither the poll creator nor able to redact
 * it) or that duplicate an earlier end.
 */
export function PollEnd({ room, mEvent, senderName, onViewPoll, children }: PollEndProps) {
  const startId = mEvent.getRelation()?.event_id ?? '';
  const startEvent = useRoomEvent(room, startId);
  const poll = startEvent ? parsePollStart(startEvent.getContent()) : undefined;
  const sender = mEvent.getSender();

  if (startEvent === undefined) return null;
  if (!startEvent || !poll || !sender) return null;
  if (
    sender !== startEvent.getSender() &&
    !room.currentState.maySendRedactionForEvent(startEvent, sender)
  ) {
    return null;
  }

  return (
    <PollEndSummary
      room={room}
      startEvent={startEvent}
      poll={poll}
      endEvent={mEvent}
      senderName={senderName}
      onViewPoll={onViewPoll}
    >
      {children}
    </PollEndSummary>
  );
}
