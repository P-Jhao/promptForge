import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTask, useTasks } from '../hooks/useTask';
import TaskFormBody, { type TaskFormValues } from '../components/TaskFormBody';

export default function TaskForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id !== undefined && id !== 'new';
  const { data: task, loading } = useTask(isEdit ? id : '');
  const { createTask, updateTask } = useTasks();
  const [values, setValues] = useState<TaskFormValues>({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && task) {
      setValues({
        title: task.title ?? '',
        description: task.description ?? '',
        assignee: task.assignee ?? '',
        dueDate: task.dueDate ?? '',
        priority: task.priority ?? 'medium',
        status: task.status ?? 'todo'
      });
    }
  }, [isEdit, task]);

  const handleChange = (field: keyof TaskFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value } as TaskFormValues));
  };

  const handleSubmit = async () => {
    if (!(values.title ?? '').trim()) {
      setErrors({ title: '标题不能为空' });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateTask(id, values);
      } else {
        await createTask(values);
      }
      navigate('/tasks');
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && loading) {
    return <div className='p-8 text-center text-gray-500'>加载中...</div>;
  }

  return (
    <div className='max-w-3xl mx-auto p-6 space-y-6'>
      <div className='flex items-center gap-4'>
        <Link to='/tasks' className='p-2 hover:bg-gray-100 rounded-lg'>
          <ArrowLeft className='h-5 w-5 text-gray-600' />
        </Link>
        <h1 className='text-2xl font-bold text-gray-900'>{isEdit ? '编辑任务' : '新建任务'}</h1>
      </div>
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
        <TaskFormBody
          values={values}
          errors={errors}
          submitting={submitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/tasks')}
        />
      </div>
    </div>
  );
}
