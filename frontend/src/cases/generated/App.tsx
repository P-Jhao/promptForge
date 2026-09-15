import { HashRouter, Routes, Route } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import ReadingLayout from './layouts/ReadingLayout';

import LibraryDashboard from './pages/LibraryDashboard';
import NovelList from './pages/NovelList';
import NovelDetail from './pages/NovelDetail';
import NovelForm from './pages/NovelForm';
import NoteForm from './pages/NoteForm';
import ReadingWorkspace from './pages/ReadingWorkspace';

import './styles.css';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path='/' element={<LibraryDashboard />} />
          <Route path='/novels' element={<NovelList />} />
          <Route path='/novels/new' element={<NovelForm />} />
          <Route path='/novels/:id' element={<NovelDetail />} />
          <Route path='/novels/:id/notes/new' element={<NoteForm />} />
        </Route>
        <Route element={<ReadingLayout />}>
          <Route path='/reading/:id' element={<ReadingWorkspace />} />
        </Route>
        <Route
          path='*'
          element={
            <div className='min-h-screen flex items-center justify-center bg-gray-50 p-6'>
              <div className='text-center space-y-4'>
                <h1 className='text-2xl font-semibold text-gray-900'>页面不存在</h1>
                <p className='text-sm text-gray-500'>你访问的页面不存在或已被移除</p>
                <a href='#/' className='inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500'>
                  返回首页
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </HashRouter>
  );
}
