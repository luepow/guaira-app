import { MoreVertical } from 'lucide-react';

interface WeeklyData {
  day: string;
  value: number;
}

interface WeeklyStatisticsCardProps {
  title: string;
  data: WeeklyData[];
  width?: number;
}

export function WeeklyStatisticsCard({
  title,
  data,
  width = 340,
}: WeeklyStatisticsCardProps) {
  const maxValue = 100;

  return (
    <div
      className="bg-white rounded-lg shadow-md"
      style={{ width: `${width}px`, height: '275px' }}
    >
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <MoreVertical className="w-[18px] h-[18px] text-gray-500" />
      </div>

      <div className="px-4 pb-4 h-[219px] flex">
        {/* Eje Y */}
        <div className="flex flex-col justify-between items-start text-[13px] text-gray-500 mr-3">
          <span>100</span>
          <span>80</span>
          <span>60</span>
          <span>40</span>
          <span>20</span>
          <span>0</span>
        </div>

        {/* Barras */}
        <div className="flex-1 flex items-end justify-between gap-1">
          {data.map((item, index) => {
            const barHeightPercent = (item.value / maxValue) * 100;
            const filledHeight = Math.max(barHeightPercent, 0);

            return (
              <div key={index} className="flex-1 flex flex-col items-center h-full">
                <div className="flex-1 flex flex-col justify-end items-center w-full pb-2">
                  {/* Barra verde llena */}
                  <div
                    className="w-2 bg-primary-400 rounded-sm mb-2"
                    style={{ height: `${filledHeight}%` }}
                  />
                  {/* Barra verde claro vacía */}
                  <div className="w-2 h-[60px] bg-primary-400/10 rounded-sm" />
                </div>
                {/* Etiqueta del día */}
                <span className="text-[13px] text-gray-500 mt-2">{item.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
