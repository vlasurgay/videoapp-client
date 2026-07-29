import { MediaTrack } from "./media-track.model";

export interface VideoDetails {
  publicId: string;
  title: string;
  description: string;
  masterPlaylistKey: string;
  mediaTracks: MediaTrack[];
}