declare module "@/components/GlassSurface" {
  import type { FC, ReactNode, CSSProperties } from "react"

  export interface GlassSurfaceProps {
    children?: ReactNode
    width?: number | string
    height?: number | string
    borderRadius?: number
    borderWidth?: number
    brightness?: number
    opacity?: number
    blur?: number
    displace?: number
    backgroundOpacity?: number
    saturation?: number
    distortionScale?: number
    redOffset?: number
    greenOffset?: number
    blueOffset?: number
    xChannel?: "R" | "G" | "B" | "A"
    yChannel?: "R" | "G" | "B" | "A"
    mixBlendMode?: string
    refraction?: boolean
    renderer?: "auto" | "webgl" | "svg"
    backdrop?: unknown
    shape?: string
    className?: string
    style?: CSSProperties
  }

  const GlassSurface: FC<GlassSurfaceProps>
  export default GlassSurface
}

