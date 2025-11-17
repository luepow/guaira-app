import {
  DollarSign,
  User,
  ShoppingBag,
  LayoutDashboard,
  CheckSquare,
  CreditCard,
  Search,
  Bell,
  Plus,
  Leaf,
  Smartphone,
  Watch,
  Shirt,
  Smile,
  Users,
} from 'lucide-react';
import { SummaryCard } from '../../components/dashboard/SummaryCard';
import { WeeklyStatisticsCard } from '../../components/dashboard/WeeklyStatisticsCard';
import { CalendarWidget } from '../../components/dashboard/CalendarWidget';
import { SalesReportCard } from '../../components/dashboard/SalesReportCard';

export default function Dashboard() {
  // Datos de ejemplo
  const weeklyStats = [
    { day: 'Mon', value: 42 },
    { day: 'Tue', value: 65 },
    { day: 'Wed', value: 27 },
    { day: 'Thu', value: 89 },
    { day: 'Fri', value: 67 },
    { day: 'Sat', value: 13 },
    { day: 'Sun', value: 64 },
  ];

  const salesData = [
    { day: 'Mon', value: 60 },
    { day: 'Tue', value: 80 },
    { day: 'Wed', value: 55 },
    { day: 'Thu', value: 97 },
    { day: 'Fri', value: 85 },
    { day: 'Sat', value: 45 },
    { day: 'Sun', value: 82 },
  ];

  const salesSummary = {
    monthlySales: 4987.07,
    weeklySales: 720.04,
    dailySales: 104.3,
  };

  const categories = [
    { name: 'Gadget', items: 3600, percentage: 25, icon: Smartphone },
    { name: 'Electronic', items: 2380, percentage: 25, icon: Watch },
    { name: 'Fashion', items: 2380, percentage: 25, icon: Shirt },
    { name: 'Cosmetics', items: 2250, percentage: 25, icon: Smile },
    { name: 'Others', items: 2478, percentage: 25, icon: Users },
  ];

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar izquierdo */}
      <div className="w-[72px] bg-white flex flex-col items-center py-6 border-r">
        <div className="w-10 h-10 bg-primary-400 rounded-lg flex items-center justify-center mb-[69px]">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-[50px]">
          <div className="w-[34px] h-[34px] bg-primary-400/10 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-primary-400" />
          </div>
          <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center opacity-50">
            <ShoppingBag className="w-6 h-6 text-gray-500" />
          </div>
          <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center opacity-50">
            <CheckSquare className="w-6 h-6 text-gray-500" />
          </div>
          <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center opacity-50">
            <CreditCard className="w-6 h-6 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Barra superior */}
        <div className="h-[91px] bg-white px-4 flex items-center border-b">
          <div className="flex items-baseline">
            <span className="text-[34px] font-bold text-primary-400">Guair</span>
            <span className="text-[34px] font-semibold text-gray-900">board</span>
          </div>
          <div className="ml-[84px] w-[206px] h-9 px-2 border border-primary-400/10 rounded-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-500" />
            <span className="text-[13px] text-gray-500">Search</span>
          </div>
          <div className="ml-auto">
            <Bell className="w-6 h-6 text-gray-500" />
          </div>
        </div>

        {/* Área de contenido con scroll */}
        <div className="flex-1 bg-primary-400/5 overflow-auto">
          <div className="p-4 space-y-2">
            {/* Título y botón Add */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Summary Data</h1>
              <button className="px-4 py-2 border border-primary-400 text-primary-400 rounded-lg flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Tarjetas de resumen */}
            <div className="flex gap-2">
              <SummaryCard
                title="Income Monthly"
                value="$120"
                icon={DollarSign}
                progressText="$120 / $250"
                progressValue={0.4}
                isPrimary
              />
              <SummaryCard
                title="User Active"
                value="420"
                icon={User}
                progressText="$120 / $250"
                progressValue={0.4}
              />
              <SummaryCard
                title="Order Process"
                value="72"
                icon={ShoppingBag}
                progressText="$120 / $250"
                progressValue={0.4}
              />
            </div>

            {/* Weekly Statistics y Calendar */}
            <div className="flex gap-2">
              <WeeklyStatisticsCard title="Weekly Statistics" data={weeklyStats} />
              <CalendarWidget />
            </div>

            {/* Sales Report */}
            <SalesReportCard weeklyData={salesData} summary={salesSummary} />
          </div>
        </div>
      </div>

      {/* Panel lateral derecho */}
      <div className="w-[209px] bg-white flex flex-col border-l">
        <div className="p-4">
          {/* Usuario */}
          <div className="flex items-center gap-2 mb-11">
            <div className="w-10 h-10 bg-primary-300 rounded-full" />
            <span className="text-base font-semibold text-gray-900">Usuario</span>
            <svg className="w-6 h-6 text-gray-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Estadística de productos */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-[136px] h-[136px] relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="68"
                  cy="68"
                  r="62"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-primary-400/10"
                />
                <circle
                  cx="68"
                  cy="68"
                  r="62"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 62 * 0.75} ${2 * Math.PI * 62}`}
                  className="text-primary-400"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold text-gray-900">1.500+</span>
                <span className="text-[13px] text-gray-500">Products</span>
              </div>
            </div>
          </div>

          {/* Categorías */}
          <h3 className="text-base font-semibold text-gray-900 mb-6">Product Categories</h3>
          <div className="space-y-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-400/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                    <div className="text-[13px] text-gray-500">{category.items} items</div>
                  </div>
                  <div className="text-sm font-bold text-primary-400">{category.percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
