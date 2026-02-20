'use client';

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: LucideIcon;
  label: string;
  color: string;
  action: () => void;
}

interface QuickActionsGridProps {
  title?: string;
  actions: QuickAction[];
}

export function QuickActionsGrid({ title = 'Menu Cepat', actions }: QuickActionsGridProps) {
  return (
    <div>
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={cn('p-3 rounded-xl text-white', action.color)}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
