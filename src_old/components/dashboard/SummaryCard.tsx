import { MoreVertical } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<LucideProps>;
  progressText: string;
  progressValue: number;
  isPrimary?: boolean;
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  progressText,
  progressValue,
  isPrimary = false,
}: SummaryCardProps) {
  const bgColor = isPrimary ? 'bg-primary-400' : 'bg-white';
  const textColor = isPrimary ? 'text-white' : 'text-gray-900';
  const subtitleColor = isPrimary ? 'text-white/90' : 'text-gray-500';
  const iconBgColor = isPrimary ? 'bg-white/20' : 'bg-primary-400/10';
  const iconColor = isPrimary ? 'text-white' : 'text-primary-400';
  const progressBgColor = isPrimary ? 'bg-white/20' : 'bg-primary-400/10';
  const progressBarColor = isPrimary ? 'bg-white' : 'bg-primary-400';

  return (
    <div
      className={`w-[232px] h-[154px] rounded-lg p-4 flex flex-col ${bgColor} ${
        isPrimary ? 'shadow-lg shadow-primary-400/30' : 'shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-auto">
        <div className={`w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <MoreVertical className={`w-[18px] h-[18px] ${subtitleColor}`} />
      </div>

      <div className="mb-auto">
        <div className={`text-xl font-bold ${textColor} leading-none mb-2`}>{value}</div>
        <div className={`text-base font-medium ${subtitleColor}`}>{title}</div>
      </div>

      <div className="mt-auto">
        <div className={`w-full h-2 ${progressBgColor} rounded-full overflow-hidden mb-2`}>
          <div
            className={`h-full ${progressBarColor} rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(progressValue * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-[13px] ${subtitleColor}`}>{progressText}</span>
          <span className={`text-[13px] font-semibold ${subtitleColor}`}>
            {Math.round(progressValue * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
