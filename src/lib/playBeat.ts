import { getPlayableUrlForBeat } from "@/lib/audio";
import type { BeatData } from "@/data/beats";

type PlayableBeat = Pick<BeatData, "id" | "title" | "previewUrl" | "audioUrl" | "coverImage">;

export async function startBeatPlayback(
  beat: PlayableBeat,
  playTrack: (track: {
    id?: string;
    title?: string;
    audioUrl: string;
    coverImage?: string;
  }) => void
) {
  const url = await getPlayableUrlForBeat({
    id: beat.id,
    title: beat.title,
    previewUrl: beat.previewUrl,
    audioUrl: beat.audioUrl,
  });
  playTrack({
    id: beat.id,
    title: beat.title,
    audioUrl: url,
    coverImage: beat.coverImage,
  });
}
