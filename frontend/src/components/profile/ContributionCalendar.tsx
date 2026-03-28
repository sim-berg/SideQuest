import { useEffect, useState } from 'react';
import { fetchActivity, type ActivityData } from '../../services/user.service';

export function ContributionCalendar() {
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [totalQuests, setTotalQuests] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivity()
      .then((data) => {
        const map: Record<string, number> = {};
        let total = 0;
        data.forEach(({ date, count }) => {
          map[date] = count;
          total += count;
        });
        setActivity(map);
        setTotalQuests(total);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Generate 365 days array (52 weeks × 7 days)
  const today = new Date();
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
  const days: Array<{ date: string; dayOfWeek: number; month: string }> = [];

  for (let i = 0; i < 365; i++) {
    const date = new Date(oneYearAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = (date.getDay() + 6) % 7; // Monday = 0
    const month = date.toLocaleDateString('de-DE', { month: 'short' });
    days.push({ date: dateStr, dayOfWeek, month });
  }

  // Group by weeks
  const weeks: Array<Array<{ date: string; dayOfWeek: number; month: string }>> =
    [];
  for (let i = 0; i < 365; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Get color class based on count
  const getColorClass = (count: number): string => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700';
    if (count === 1) return 'bg-indigo-200 dark:bg-indigo-800 hover:bg-indigo-300 dark:hover:bg-indigo-700';
    if (count === 2) return 'bg-indigo-400 dark:bg-indigo-600 hover:bg-indigo-500 dark:hover:bg-indigo-500';
    return 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400';
  };

  if (isLoading) {
    return (
      <div className="w-full rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded dark:bg-gray-800" />
          <div className="h-24 w-full bg-gray-200 rounded dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {totalQuests} Quests in den letzten 12 Monaten
        </p>
      </div>

      {/* Scrollable container */}
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {/* Month label on first row */}
              {weekIndex === 0 || week[0].month !== weeks[weekIndex - 1][0].month ? (
                <div className="h-6 flex items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {week[0].month}
                  </span>
                </div>
              ) : (
                <div className="h-6" />
              )}

              {/* Day cells */}
              {week.map((day, dayIndex) => {
                const count = activity[day.date] || 0;
                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${count} quest${count !== 1 ? 's' : ''}`}
                    className={`w-3 h-3 rounded-sm cursor-pointer transition-colors ${getColorClass(
                      count,
                    )}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
