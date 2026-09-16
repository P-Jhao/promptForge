import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import MainLayout from './layouts/MainLayout';

import TaskBoard from './pages/TaskBoard';
import TaskForm from './pages/TaskForm';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path='/' element={<TaskBoard />} />
          <Route path='/tasks' element={<TaskBoard />} />
          <Route path='/tasks/new' element={<TaskForm />} />
          <Route path='/tasks/:id' element={<TaskForm />} />
        </Route>
        <Route
          path='*'
          element={
            <div className='min-h-screen flex items-center justify-center bg-gray-50 p-6'>
              <div className='text-center space-y-4'>
                <h1 className='text-2xl font-semibold text-gray-900'>页面不存在</h1>
                <p className='text-sm text-gray-500'>你访问的页面不存在或已被移除</p>
                <a
                  href='#/'
                  className='inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500'
                >
                  返回首页
                </a>
              </div>
            </div>
          }
        />
      </Routes>
      <Toaster position='top-center' richColors />
    </HashRouter>
  );
}
