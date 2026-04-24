import type { FC, ReactNode } from 'react';

export interface ProListProps {
  header?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  classNames?: {
    base?: string;
    content?: string;
  };
  className?: string;
}

export const ProList: FC<ProListProps> = (props) => {
  const { header, children, footer, classNames, className } = props;

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      {header && (
        <div data-tauri-drag-region className="pl-4 font-bold text-default-900">
          <span>{header}</span>
        </div>
      )}

      <div
        className={`bg-default-50 border border-default-200 rounded-lg overflow-hidden ${
          classNames?.content || ''
        }`}
      >
        {children}
      </div>

      {footer}
    </div>
  );
};
