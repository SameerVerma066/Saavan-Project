export type DownloadVariant = {
  quality: string;
  url: string;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  durationMillis: number;
  durationLabel: string;
  streamUrl: string;
  sourceUrl: string;
  downloadUrls: DownloadVariant[];
};
