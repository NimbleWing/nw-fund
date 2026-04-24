import type { FC, ReactNode } from 'react';

interface ProListItemProps {
  title?: ReactNode;
  description?: ReactNode;
  avatar?: ReactNode;
  children?: ReactNode;
  classNames?: {
    base?: string;
    title?: string;
    description?: string;
    avatar?: string;
    actions?: string;
  };
  showDivider?: boolean;
}

const ProListItem: FC<ProListItemProps> = (props) => {
  const { title, description, avatar, children, classNames, showDivider = true } = props;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        showDivider ? 'border-b border-default-200' : ''
      } ${classNames?.base || ''}`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {avatar && <div className={classNames?.avatar}>{avatar}</div>}

        <div className="flex-1 min-w-0">
          {title && (
            <p className={`font-medium text-default-900 truncate ${classNames?.title || ''}`}>
              {title}
            </p>
          )}

          {description && (
            <p className={`text-xs text-zinc-500 ${classNames?.description || ''}`}>
              {description}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className={`flex items-center ${classNames?.actions || ''}`}>{children}</div>
      )}
    </div>
  );
};

export default ProListItem;
