import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Plus, CheckSquare } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '任务看板', end: true },
  { to: '/tasks/new', icon: Plus, label: '新建任务', end: false }
];

export default function MainLayout() {
  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <header className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='flex items-center justify-between px-6 py-3'>
          <Link to='/' className='flex items-center gap-2'>
            <CheckSquare className='h-6 w-6 text-blue-600' />
            <span className='text-lg font-bold text-gray-900'>任务管理系统</span>
          </Link>
          <Link to='/tasks/new' className='flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700'>
            <Plus className='h-4 w-4' />
            新建任务
          </Link>
        </div>
      </header>
      <div className='flex-1 flex'>
        <aside className='hidden md:flex md:flex-col w-56 shrink-0 bg-white border-r border-gray-200'>
          <nav className='flex-1 p-4 space-y-1'>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ' +
                    (isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                  }
                >
                  <Icon className='h-4 w-4' />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <main className='flex-1 min-w-0 overflow-auto'>
          <Outlet />
        </main>
      </div>
      <footer className='bg-white border-t border-gray-200 py-4'>
        <div className='px-6 text-center text-sm text-gray-500'>
          © 2024 任务管理系统. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
