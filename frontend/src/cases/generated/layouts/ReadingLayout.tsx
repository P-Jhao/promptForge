import { Outlet } from 'react-router-dom';

export default function ReadingLayout() {
  return (
    <div className='h-screen flex flex-col overflow-hidden'>
      <Outlet />
    </div>
  );
}