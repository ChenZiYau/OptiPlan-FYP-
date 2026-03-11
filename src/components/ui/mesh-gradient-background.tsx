import { MeshGradient } from "@paper-design/shaders-react"
import type { ColorMode } from '@/contexts/SettingsContext';

const COLOR_MAP: Record<ColorMode, [string, string, string, string]> = {
  dark: ["#0a0014", "#1a0a2e", "#2d1b4e", "#130826"],
  light: ["#f0e8ff", "#e8d5f5", "#dbc4f0", "#eee0ff"],
  grey: ["#2a2040", "#3a2a50", "#4d3b6e", "#332846"],
};

const OVERLAY_MAP: Record<ColorMode, string> = {
  dark: 'rgba(7, 4, 10, 0.4)',
  light: 'rgba(248, 249, 250, 0.6)',
  grey: 'rgba(45, 45, 58, 0.4)',
};

interface MeshGradientBackgroundProps {
  colorMode?: ColorMode;
}

export function MeshGradientBackground({ colorMode = 'dark' }: MeshGradientBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none mesh-bg-wrapper" style={{ zIndex: 0 }}>
      <MeshGradient
        className="w-full h-full"
        colors={COLOR_MAP[colorMode]}
        speed={0.4}
        distortion={0.3}
        swirl={0.2}
      />
      {/* Overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{ background: OVERLAY_MAP[colorMode] }}
      />
    </div>
  )
}
