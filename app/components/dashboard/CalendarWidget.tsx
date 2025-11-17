import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarWidgetProps {
  selectedDays?: number[];
}

export function CalendarWidget({ selectedDays = [6, 14] }: CalendarWidgetProps) {
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Días de abril 2021 (comenzando en jueves)
  const weeks = [
    [29, 30, 31, 1, 2, 3, 4],
    [5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25],
    [26, 27, 28, 29, 30, 1, 2],
  ];

  const isSelected = (day: number) => selectedDays.includes(day);
  const isOutOfRange = (day: number, weekIndex: number) => {
    return (day > 25 && weekIndex === 0) || (day <= 2 && weekIndex === 4);
  };

  return (
    <div className="w-[364px] h-[275px] bg-white rounded-lg shadow-md">
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Calendar</h3>
        <div className="flex items-center gap-4">
          <button className="p-0">
            <ChevronLeft className="w-6 h-6 text-gray-500" />
          </button>
          <span className="text-base font-medium text-gray-500">April 2021</span>
          <button className="p-0">
            <ChevronRight className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="px-7">
        {/* Días de la semana */}
        <div className="flex justify-between mb-4">
          {weekdays.map((day) => (
            <div key={day} className="w-8 text-center text-[13px] font-semibold text-gray-900">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="flex flex-col gap-4">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex justify-between">
              {week.map((day, dayIndex) => {
                const selected = isSelected(day);
                const outOfRange = isOutOfRange(day, weekIndex);

                return (
                  <div
                    key={dayIndex}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium ${
                      selected
                        ? 'bg-primary-400 text-white font-semibold'
                        : outOfRange
                        ? 'text-primary-400/10'
                        : 'text-gray-900'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
