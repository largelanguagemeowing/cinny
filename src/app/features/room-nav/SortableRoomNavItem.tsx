import React, { useEffect, useRef, useState } from 'react';
import { Room } from 'matrix-js-sdk';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { RoomNavItem } from './RoomNavItem';
import { SortableNavItem } from './styles.css';
import { RoomNotificationMode } from '../../hooks/useRoomsNotificationPreferences';

type SortableRoomNavItemProps = {
  room: Room;
  selected: boolean;
  linkPath: string;
  notificationMode?: RoomNotificationMode;
  showAvatar?: boolean;
  direct?: boolean;
  parentId: string;
  onReorder: (parentId: string, fromRoomId: string, toRoomId: string) => void;
};

type DragPayload = { roomId: string; parentId: string };

export function SortableRoomNavItem({
  room,
  selected,
  linkPath,
  notificationMode,
  showAvatar,
  direct,
  parentId,
  onReorder,
}: SortableRoomNavItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const payload: DragPayload = { roomId: room.roomId, parentId };

    return combine(
      draggable({
        element: el,
        getInitialData: () => payload,
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false),
      }),
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) =>
          (source.data as DragPayload).parentId === parentId &&
          (source.data as DragPayload).roomId !== room.roomId,
        getData: () => payload,
        onDragEnter: () => setDropTarget(true),
        onDragLeave: () => setDropTarget(false),
        onDrop: ({ source }) => {
          setDropTarget(false);
          const sourcePayload = source.data as DragPayload;
          if (sourcePayload.parentId === parentId && sourcePayload.roomId !== room.roomId) {
            onReorder(parentId, sourcePayload.roomId, room.roomId);
          }
        },
      }),
      autoScrollForElements({ element: el })
    );
  }, [room.roomId, parentId, onReorder]);

  return (
    <div
      ref={ref}
      className={SortableNavItem}
      data-dragging={dragging}
      data-drop-target={dropTarget ? 'before' : undefined}
      onDragStart={(e) => e.preventDefault()}
    >
      <RoomNavItem
        room={room}
        selected={selected}
        showAvatar={showAvatar}
        direct={direct}
        linkPath={linkPath}
        notificationMode={notificationMode}
      />
    </div>
  );
}
