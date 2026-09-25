import { useEffect, useState } from 'react';
import { MatrixEvent, Poll, PollEvent, Relations, RelationsEvent, Room } from 'matrix-js-sdk';

export type PollState = {
  poll?: Poll;
  responses: MatrixEvent[];
  loading: boolean;
  ended: boolean;
};

/**
 * Tracks the SDK's Poll model for a poll start event. The SDK builds these
 * from synced/paginated events into `room.polls`; this hook picks it up (or
 * asks the room to build one) and follows its responses and end event.
 */
export const usePoll = (room: Room, mEvent: MatrixEvent): PollState => {
  const eventId = mEvent.getId();
  const sent = !mEvent.isSending() && !mEvent.status;
  const [poll, setPoll] = useState<Poll | undefined>(() =>
    eventId ? room.polls.get(eventId) : undefined
  );
  const [responses, setResponses] = useState<MatrixEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!eventId || !sent) return undefined;
    const existing = room.polls.get(eventId);
    if (existing) {
      setPoll(existing);
      return undefined;
    }
    const handleNew = (newPoll: Poll) => {
      if (newPoll.pollId === eventId) setPoll(newPoll);
    };
    room.on(PollEvent.New, handleNew);
    room.processPollEvents([mEvent]);
    return () => {
      room.off(PollEvent.New, handleNew);
    };
  }, [room, mEvent, eventId, sent]);

  useEffect(() => {
    if (!poll) return undefined;
    let relations: Relations | undefined;
    let disposed = false;

    // The SDK already drops responses sent after a valid m.poll.end.
    const syncEnd = () => setEnded(poll.isEnded);
    const syncResponses = () => {
      if (relations) setResponses([...relations.getRelations()]);
      setLoading(poll.isFetchingResponses);
    };
    const handleResponses = (rel: Relations) => {
      if (relations !== rel) {
        relations?.off(RelationsEvent.Redaction, syncResponses);
        relations?.off(RelationsEvent.Remove, syncResponses);
        relations = rel;
        rel.on(RelationsEvent.Redaction, syncResponses);
        rel.on(RelationsEvent.Remove, syncResponses);
      }
      syncResponses();
      syncEnd();
    };

    poll.on(PollEvent.Responses, handleResponses);
    poll.on(PollEvent.End, syncEnd);
    syncEnd();
    poll.getResponses().then((rel) => {
      if (!disposed && rel) handleResponses(rel);
    });

    return () => {
      disposed = true;
      poll.off(PollEvent.Responses, handleResponses);
      poll.off(PollEvent.End, syncEnd);
      relations?.off(RelationsEvent.Redaction, syncResponses);
      relations?.off(RelationsEvent.Remove, syncResponses);
    };
  }, [poll]);

  return { poll, responses, loading: !poll || loading, ended };
};
