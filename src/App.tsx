import { useBoolean, useMount } from 'ahooks';
import { RouterProvider } from 'react-router';

import { router } from './router';
import { useBaseStore } from './stores';

function App() {
  const [ready, { setTrue }] = useBoolean();

  useMount(async () => {
    await useBaseStore.getState().init();
    setTrue();
  });
  return ready && <RouterProvider router={router} />;
}

export default App;
