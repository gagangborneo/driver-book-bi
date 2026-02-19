'use client';

interface WelcomeBannerProps {
  name: string;
  subtitle: string;
  stats: Array<{
    value: number;
    label: string;
    color?: string;
  }>;
}

export function WelcomeBanner({ name, subtitle, stats }: WelcomeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
      <h2 className="text-xl font-semibold">{name}</h2>
      <p className="text-slate-300 text-sm mt-1">{subtitle}</p>
      
      <div className="grid grid-cols-3 gap-4 mt-6">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className={`text-2xl font-bold ${stat.color || 'text-white'}`}>{stat.value}</p>
            <p className="text-xs text-slate-300">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
