import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../hooks/useTask';
import TaskFilterSearch from '../components/TaskFilterSearch';
import TaskList from '../components/TaskList';
import TaskListEmpty from '../components/TaskListEmpty';
import CreateTaskNav from '../components/CreateTaskNav';

export default function TaskBoard() {
  const {
    data: tasks,
    loading,
    error,
    searchTerm,
    statusFilter,
    priorityFilter,
    clearSearch,
    setStatusFilter,
    setPriorityFilter
  } = useTasks();
  const navigate = useNavigate();
  const list = tasks ?? [];
  const hasFilter = Boolean((searchTerm ?? '').trim() || statusFilter || priorityFilter);

  const handleCreateTask = () => {
    navigate('/tasks/new');
  };

  const handleClearFilters = () => {
    clearSearch();
    setStatusFilter(null);
    setPriorityFilter(null);
  };

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      <CreateTaskNav />
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>任务看板</h1>
          <p className='text-sm text-gray-500 mt-1'>共 {list.length} 个任务</p>
        </div>
      </div>
      <TaskFilterSearch />
      {loading ? (
        <div className='p-8 text-center text-gray-500'>加载中...</div>
      ) : error ? (
        <div className='text-red-500 text-center py-8'>加载失败：{error}</div>
      ) : list.length === 0 ? (
        <TaskListEmpty
          variant={hasFilter ? 'no-results' : 'no-data'}
          onCreateTask={handleCreateTask}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <TaskList />
      )}
    </div>
  );
}