import type { VideoProviderId } from "@/types/content"

export type VideoPlaybackSession = {
  provider: VideoProviderId
  assetId: string
  /** Short-lived playback URL or embed token from the streaming provider */
  playbackUrl: string
  expiresAt: string
}

/**
 * Abstraction over video delivery. Implementation swaps later without
 * touching feature UI — Firebase Storage is intentionally not the default CDN.
 */
export interface VideoProvider {
  readonly id: VideoProviderId
  getPlaybackSession(assetId: string): Promise<VideoPlaybackSession>
}

export class StubVideoProvider implements VideoProvider {
  readonly id = "stub" as const

  async getPlaybackSession(assetId: string): Promise<VideoPlaybackSession> {
    return {
      provider: this.id,
      assetId,
      playbackUrl: "",
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    }
  }
}

let provider: VideoProvider = new StubVideoProvider()

export function getVideoProvider(): VideoProvider {
  return provider
}

export function setVideoProvider(next: VideoProvider): void {
  provider = next
}
