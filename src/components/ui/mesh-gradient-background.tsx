import { MeshGradient } from "@paper-design/shaders-react"

export function MeshGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <MeshGradient
        className="w-full h-full"
        colors={["#0a0014", "#1a0a2e", "#2d1b4e", "#130826"]}
        speed={0.4}
        distortion={0.3}
        swirl={0.2}
      />
      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(7, 4, 10, 0.4)' }}
      />
    </div>
  )
}
