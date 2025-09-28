'use client';

import CountdownTimer from '@/components/CountdownTimer';
import UrgentTaskList from '@/components/UrgentTaskList';

export default function UrgentTasksPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Urgent Tasks</h1>
          <p className="text-gray-600">
            Focus on what matters most. Set a timer and tackle your urgent tasks one by one.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Section */}
          <div className="lg:col-span-1">
            <CountdownTimer />

            {/* Tips section */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Focus Tips</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Start with the most important task</li>
                <li>• Use 20-minute focused sprints</li>
                <li>• Take breaks between sessions</li>
                <li>• Keep tasks small and actionable</li>
                <li>• Drag to reorder by priority</li>
              </ul>
            </div>
          </div>

          {/* Task List Section */}
          <div className="lg:col-span-2">
            <UrgentTaskList />
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.location.href = '/tasks'}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              View All Tasks
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}