import { Layout } from '@components/Layout';
import { createBrowserRouter } from 'react-router';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
  },
]);
