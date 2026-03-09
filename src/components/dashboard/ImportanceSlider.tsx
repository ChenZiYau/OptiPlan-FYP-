import * as Slider from '@radix-ui/react-slider';
import type { Importance } from '@/types/dashboard';

const levels: { value: Importance; label: string; color: string; bg: string }[] = [
  { value: 1, label: 'Low', color: '#22c55e', bg: 'bg-green-500' },
  { value: 2, label: 'Medium', color: '#f59e0b', bg: 'bg-amber-500' },
  { value: 3, label: 'High', color: '#ef4444', bg: 'bg-red-500' },
];

interface ImportanceSliderProps {
  value: Importance;
  onChange: (v: Importance) => void;
}

export function ImportanceSlider({ value, onChange }: ImportanceSliderProps) {
  const current = levels[value - 1];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">Importance</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${current.color}20`, color: current.color }}
        >
          {current.label}
        </span>
      </div>

      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        min={1}
        max={3}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v as Importance)}
      >
        <Slider.Track className="relative h-1.5 grow rounded-full bg-white/10">
          <Slider.Range
            className="absolute h-full rounded-full transition-colors duration-200"
            style={{ backgroundColor: current.color }}
          />
        </Slider.Track>
        <Slider.Thumb
          className="block w-5 h-5 rounded-full border-2 border-white/20 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors duration-200 cursor-grab active:cursor-grabbing"
          style={{ backgroundColor: current.color }}
          aria-label="Importance level"
        />
      </Slider.Root>

      <div className="flex justify-between">
        {levels.map((l) => (
          <span key={l.value} className="text-[10px] text-gray-600">{l.label}</span>
        ))}
      </div>
    </div>
  );
}
