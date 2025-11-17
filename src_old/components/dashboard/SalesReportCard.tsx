import { MoreVertical, Lightbulb, Calendar, CreditCard } from 'lucide-react';

interface WeeklyData {
  day: string;
  value: number;
}

interface SalesSummary {
  monthlySales: number;
  weeklySales: number;
  dailySales: number;
}

interface SalesReportCardProps {
  weeklyData: WeeklyData[];
  summary: SalesSummary;
}

export function SalesReportCard({ weeklyData, summary }: SalesReportCardProps) {
  const maxValue = 100;

  return (
    <div className="w-[712px] h-[275px] bg-white rounded-lg shadow-md flex">
      {/* Gráfico */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Sales Report</h3>
          <MoreVertical className="w-[18px] h-[18px] text-gray-500" />
        </div>

        <div className="px-4 pb-4 flex-1 flex">
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
          <div className="flex-1 flex items-end justify-between gap-2">
            {weeklyData.map((item, index) => {
              const barHeightPercent = (item.value / maxValue) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full">
                  <div className="flex-1 flex flex-col justify-end items-center w-full pb-2">
                    {/* Barra verde completa */}
                    <div
                      className="w-3 bg-primary-400 rounded-sm"
                      style={{ height: `${barHeightPercent}%` }}
                    />
                  </div>
                  {/* Etiqueta del día */}
                  <span className="text-[13px] text-gray-500 mt-2">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel de resumen */}
      <div className="w-[200px] m-4 border border-primary-400/10 rounded-lg flex flex-col justify-evenly">
        <div className="px-4 py-2 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary-400/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              ${summary.monthlySales.toFixed(2)}
            </div>
            <div className="text-[13px] text-gray-500">Monthy sales</div>
          </div>
        </div>

        <div className="px-4 py-2 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary-400/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              ${summary.weeklySales.toFixed(2)}
            </div>
            <div className="text-[13px] text-gray-500">Weekly sales</div>
          </div>
        </div>

        <div className="px-4 py-2 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary-400/10 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              ${summary.dailySales.toFixed(1)}
            </div>
            <div className="text-[13px] text-gray-500">Dialy sales</div>
          </div>
        </div>
      </div>
    </div>
  );
}
