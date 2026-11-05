import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/AppLayout'
import { RequireAuth } from '@/app/RequireAuth'
import { paths } from '@/app/routes'
import { LoginPage } from '@/pages/LoginPage'
import { ObjectsPage } from '@/pages/ObjectsPage'
import { ObjectPage } from '@/pages/ObjectPage'
import { TaskPage } from '@/pages/TaskPage'
import { MyTasksPage } from '@/pages/MyTasksPage'
import { HomeRedirect } from '@/app/HomeRedirect'

export const router = createBrowserRouter([
  { path: paths.login, element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: paths.objects, element: <ObjectsPage /> },
          { path: '/objects/:objectId', element: <ObjectPage /> },
          { path: '/tasks/:taskId', element: <TaskPage /> },
          {
            element: <RequireAuth allow={['executor']} />,
            children: [{ path: paths.myTasks, element: <MyTasksPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
