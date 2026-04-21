import { useTray } from '@hooks/useTray';
import { useMount } from 'ahooks';
import { RouterProvider } from 'react-router';

import { router } from './router';
function App() {
  const { createTray } = useTray();
  useMount(async () => {
    createTray();
  });

  return <RouterProvider router={router} />;
}

export default App;
