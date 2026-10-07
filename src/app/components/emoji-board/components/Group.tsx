import { as, Box, Icon, IconSrc, Icons, Text } from 'folds';
import React, { ReactNode } from 'react';
import classNames from 'classnames';
import * as css from './styles.css';

export const getDOMGroupId = (id: string): string => `EmojiBoardGroup-${id}`;

export const EmojiGroup = as<
  'div',
  {
    id: string;
    label: string;
    icon?: IconSrc;
    collapsed?: boolean;
    onToggleCollapsed?: (id: string) => void;
    children: ReactNode;
  }
>(({ className, id, label, icon, collapsed, onToggleCollapsed, children, ...props }, ref) => (
  <Box
    id={getDOMGroupId(id)}
    data-group-id={id}
    className={classNames(css.EmojiGroup, className)}
    direction="Column"
    gap="200"
    {...props}
    ref={ref}
  >
    <Text
      id={`EmojiGroup-${id}-label`}
      as="button"
      type="button"
      aria-expanded={!collapsed}
      aria-controls={`EmojiGroup-${id}-content`}
      className={css.EmojiGroupLabel}
      size="O400"
      onClick={() => onToggleCollapsed?.(id)}
    >
      {icon && <Icon size="100" src={icon} />}
      <span>{label}</span>
      <Icon size="100" src={collapsed ? Icons.ChevronRight : Icons.ChevronBottom} />
    </Text>
    {!collapsed && (
      <div
        id={`EmojiGroup-${id}-content`}
        aria-labelledby={`EmojiGroup-${id}-label`}
        className={css.EmojiGroupContent}
      >
        <Box wrap="Wrap" justifyContent="Center">
          {children}
        </Box>
      </div>
    )}
  </Box>
));
