import { TrackType } from "./track-type.enum";

export interface MediaTrack {
  type: TrackType;
  label: string;
  uploadKey: string;
}