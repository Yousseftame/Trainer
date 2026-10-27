import type { CSSProperties, ReactNode } from "react"

export type LogoLoopImageItem = {
  src: string
  srcSet?: string
  sizes?: string
  alt?: string
  title?: string
  href?: string
  ariaLabel?: string
  hoverColor?: string
}

export type LogoLoopNodeItem = {
  node: ReactNode
  title?: string
  href?: string
  ariaLabel?: string
  hoverColor?: string
}

export type LogoLoopItem = LogoLoopImageItem | LogoLoopNodeItem

export type LogoLoopProps = {
  logos: LogoLoopItem[]
  speed?: number
  direction?: "left" | "right" | "up" | "down"
  width?: number | string
  logoHeight?: number
  gap?: number
  pauseOnHover?: boolean
  hoverSpeed?: number
  fadeOut?: boolean
  fadeOutWidth?: number
  scaleOnHover?: boolean
  layout?: string
  bend?: number
  focus?: number
  magnify?: number
  tiltX?: number
  tiltY?: number
  step?: boolean
  muted?: number
  labels?: string
  draggable?: boolean
  scrollBoost?: number
  /** When false, logos start scrolling immediately with no entrance animation. */
  intro?: boolean
  renderItem?: (item: LogoLoopItem, key: string) => ReactNode
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

export declare const LogoLoop: import("react").MemoExoticComponent<
  (props: LogoLoopProps) => import("react").ReactElement
>

declare const _default: typeof LogoLoop
export default _default
