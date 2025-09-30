'use client';

import { useState, useEffect } from 'react';
import { UrgentTaskService, UrgentTask } from '@/services/UrgentTaskService';

interface UrgentTaskListProps {
  className?: string;
}

export default function UrgentTaskList({ className = '' }: UrgentTaskListProps) {
  const [tasks, setTasks] = useState<UrgentTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const data = await UrgentTaskService.getUrgentTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching urgent tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const newTask = await UrgentTaskService.createUrgentTask({
        title: newTaskTitle,
        description: newTaskDescription || undefined,
      });
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setNewTaskDescription('');
    } catch (error) {
      console.error('Error creating urgent task:', error);
    }
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      const updatedTask = await UrgentTaskService.updateUrgentTask(taskId, { is_completed: !isCompleted });
      setTasks(tasks.map(task =>
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await UrgentTaskService.deleteUrgentTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();

    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      return;
    }

    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTaskId(null);
      return;
    }

    // Reorder tasks locally
    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);

    // Update order_index for all tasks
    const taskUpdates = newTasks.map((task, index) => ({
      id: task.id,
      order_index: index,
    }));

    setTasks(newTasks);
    setDraggedTaskId(null);

    // Send reorder request to backend
    try {
      await UrgentTaskService.reorderUrgentTasks(taskUpdates);
    } catch (error) {
      console.error('Error reordering tasks:', error);
      // Revert on error
      fetchTasks();
    }
  };

  const completedTasks = tasks.filter(task => task.is_completed);
  const pendingTasks = tasks.filter(task => !task.is_completed);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Urgent Tasks</h2>

      {/* Add new task form */}
      <form onSubmit={handleCreateTask} className="mb-6 space-y-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Quick task title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
          placeholder="Optional description..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <button
          type="submit"
          className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 text-sm font-medium"
        >
          Add Urgent Task
        </button>
      </form>

      {/* Pending tasks */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">To Do ({pendingTasks.length})</h3>
        <div className="space-y-2">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className={`border border-gray-200 rounded-md ${
                draggedTaskId === task.id ? 'opacity-50' : ''
              }`}
            >
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, task.id)}
                className="p-3 cursor-move hover:bg-gray-50"
                onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={(e) => {
                      e.stopPropagation()
                      handleToggleComplete(task.id, task.is_completed)
                    }}
                    className="mt-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm text-gray-900">{task.title}</div>
                      {task.description && (
                        <span className="text-xs text-gray-400">
                          {expandedTaskId === task.id ? '▼' : '▶'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTask(task.id)
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedTaskId === task.id && task.description && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-100 bg-gray-50">
                  <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{task.description}</div>
                  {task.created_at && (
                    <div className="text-xs text-gray-500 mt-2">
                      Created: {new Date(task.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {pendingTasks.length === 0 && (
            <div className="text-gray-500 text-sm italic py-4">
              No urgent tasks. Add one above to get started!
            </div>
          )}
        </div>
      </div>

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Completed ({completedTasks.length})</h3>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="border border-gray-200 rounded-md bg-gray-50"
              >
                <div
                  className="p-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleToggleComplete(task.id, task.is_completed)
                      }}
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm text-gray-500 line-through">{task.title}</div>
                        {task.description && (
                          <span className="text-xs text-gray-400">
                            {expandedTaskId === task.id ? '▼' : '▶'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTask(task.id)
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedTaskId === task.id && task.description && (
                  <div className="px-3 pb-3 pt-0 border-t border-gray-100 bg-gray-100">
                    <div className="text-sm text-gray-600 mt-2 line-through whitespace-pre-wrap">{task.description}</div>
                    {task.completed_at && (
                      <div className="text-xs text-gray-500 mt-2">
                        Completed: {new Date(task.completed_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}