import { Layout } from '@components/Layout';
import { createBrowserRouter } from 'react-router';

import { FundQuery } from '@/features/FundQuery';
import { Preference } from '@/features/Preference';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [{ index: true, element: <FundQuery /> }],
  },
  {
    path: '/preference',
    Component: Preference,
  },
]);
