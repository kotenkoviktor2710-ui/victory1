declare module 'lottie-web' {
  export interface AnimationItem {
    destroy(): void
    play(): void
    pause(): void
    stop(): void
    addEventListener(
      name: 'complete' | 'loopComplete' | 'enterFrame' | 'segmentStart' | 'destroy',
      callback: () => void,
    ): void
    removeEventListener(
      name: 'complete' | 'loopComplete' | 'enterFrame' | 'segmentStart' | 'destroy',
      callback: () => void,
    ): void
  }

  export interface AnimationConfig {
    container: Element
    renderer: 'svg' | 'canvas' | 'html'
    loop?: boolean
    autoplay?: boolean
    path?: string
    animationData?: unknown
    rendererSettings?: {
      preserveAspectRatio?: string
    }
  }

  const lottie: {
    loadAnimation(config: AnimationConfig): AnimationItem
  }

  export default lottie
}
