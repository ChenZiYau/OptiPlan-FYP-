import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  initials: string;
  quoteColor?: string;
  nameColor?: string;
  roleColor?: string;
}

export function TestimonialCard({ quote, name, role, initials, quoteColor, nameColor, roleColor }: TestimonialCardProps) {
  return (
    <div className="glass-card w-[340px] sm:w-[380px] shrink-0 p-6 flex flex-col">
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-opti-text-primary leading-relaxed flex-1 mb-6 italic text-sm" style={{ color: quoteColor || undefined }}>
        "{quote}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-opti-accent/20 flex items-center justify-center text-opti-accent font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-opti-text-primary text-sm" style={{ color: nameColor || undefined }}>{name}</p>
          <p className="text-xs text-opti-text-secondary" style={{ color: roleColor || undefined }}>{role}</p>
        </div>
      </div>
    </div>
  );
}
