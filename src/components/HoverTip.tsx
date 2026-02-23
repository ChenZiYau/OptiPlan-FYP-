import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function HoverTip({
  children,
  label,
  side = 'bottom',
}: {
  children: React.ReactNode;
  label: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        className="bg-[#1a1735] text-gray-200 border border-white/10 text-xs px-2.5 py-1.5 rounded-lg"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
