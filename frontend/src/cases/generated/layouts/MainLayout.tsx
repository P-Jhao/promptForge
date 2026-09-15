import { Outlet, Link } from 'react-router-dom';
import { Book, Search, Plus, Home } from 'lucide-react';

export default function MainLayout() {
  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <header className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4'>
          <Link to='/' className='flex min-w-0 items-center gap-2'>
            <Book className='h-6 w-6 text-blue-600' />
            <span className='truncate whitespace-nowrap text-sm font-bold text-gray-900 sm:text-xl'>小说阅读管理器</span>
          </Link>
          <nav className='flex shrink-0 items-center gap-3 sm:gap-6'>
            <Link to='/' className='text-gray-600 hover:text-gray-900 flex items-center gap-1'>
              <Home className='h-4 w-4' />
              首页
            </Link>
            <Link to='/novels' className='text-gray-600 hover:text-gray-900 flex items-center gap-1'>
              <Book className='h-4 w-4' />
              书架
            </Link>
          </nav>
          <div className='flex shrink-0 items-center gap-2 sm:gap-4'>
            <div className='relative hidden sm:block'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input type='text' placeholder='搜索小说...' className='pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' />
            </div>
            <Link to='/novels/new' className='flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
              <Plus className='h-4 w-4' />
              添加
            </Link>
          </div>
        </div>
      </header>
      <main className='flex-1'>
        <Outlet />
      </main>
      <footer className='bg-white border-t border-gray-200 py-6'>
        <div className='max-w-6xl mx-auto px-6 text-center text-sm text-gray-500'>
          © 2024 小说阅读管理器. All rights reserved.
        </div>
      </footer>
    </div>
  );
}