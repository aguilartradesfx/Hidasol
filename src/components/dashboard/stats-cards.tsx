import { DashboardStats } from '@/types/order';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Nueva',
      value: stats.nueva.count,
      change: stats.nueva.change,
      bgColor: 'bg-[#60A5FA]/15',
      badgeBg: 'bg-[#60A5FA]',
      badgeText: 'text-[#1E3A8A]',
      borderColor: 'border-[#60A5FA]/20',
      delay: '0ms'
    },
    {
      label: 'En proceso',
      value: stats.enProceso.count,
      change: stats.enProceso.change,
      bgColor: 'bg-[#F97316]/10',
      badgeBg: 'bg-[#F97316]',
      badgeText: 'text-white',
      borderColor: 'border-[#F97316]/20',
      delay: '50ms'
    },
    {
      label: 'Terminado',
      value: stats.terminado.count,
      change: stats.terminado.change,
      bgColor: 'bg-[#34D399]/10',
      badgeBg: 'bg-[#34D399]',
      badgeText: 'text-[#065F46]',
      borderColor: 'border-[#34D399]/20',
      delay: '100ms'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bgColor} rounded-[12px] p-6 border ${card.borderColor} transition-smooth hover:scale-[1.02] animate-in fade-in slide-in-from-left backdrop-blur-sm`}
          style={{ animationDelay: card.delay, animationDuration: '400ms' }}
        >
          <div className="space-y-3">
            <div className={`inline-flex items-center justify-center px-4 py-2 rounded-[5px] ${card.badgeBg} ${card.badgeText} font-semibold text-sm`}>
              {card.label}
            </div>
            
            <div className="flex items-end justify-between">
              <span className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground">
                {card.value}
              </span>
              
              <div className={`flex items-center gap-1 text-sm font-medium ${
                card.change >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'
              }`}>
                {card.change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(card.change).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
