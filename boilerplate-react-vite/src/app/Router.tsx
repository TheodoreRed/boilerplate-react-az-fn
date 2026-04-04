import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import NotFoundPage from '@/features/not-found/pages/NotFoundPage'
import MainLayout from '@/components/layouts/MainLayout/MainLayout'

const HomePage = lazy(() => import('@/features/home/pages/HomePage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path='/' element={<HomePage />} />
            <Route path='/settings' element={<SettingsPage />} />
            <Route path='*' element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRouter
