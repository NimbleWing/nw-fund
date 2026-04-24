import { Layout } from '@components/Layout';
import { createBrowserRouter } from 'react-router';

import { Preference } from '@/features/Preference';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
  },
  {
    path: '/preference',
    Component: Preference,
  },
]);
