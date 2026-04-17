import { WindowControls } from './WindowControls';

export const Layout = () => {
  return (
    <>
      <div
        data-tauri-drag-region
        className="flex items-center pointer-events-auto fixed inset-x-0 top-0 z-100 bg-default-50/25 backdrop-blur-lg backdrop-saturate-125"
      >
        <WindowControls />
      </div>
    </>
  );
};
