import type { Track } from "@/types/track";

const BASE_URL = "https://saavn.sumit.co";
const DEFAULT_QUERY = "arijit";

type SaavnSongImage = {
  quality?: string;
  link?: string;
  url?: string;
};

type SaavnSongDownloadUrl = {
  quality?: string;
  link?: string;
  url?: string;
};

type SaavnArtist = {
  id?: string;
  name?: string;
};

type SaavnSearchSong = {
  id: string;
  name?: string;
  primaryArtists?: string | SaavnArtist[];
  artists?: {
    primary?: SaavnArtist[];
  };
  album?: {
    name?: string;
    url?: string;
  };
  duration?: string | number;
  image?: SaavnSongImage[];
  downloadUrl?: SaavnSongDownloadUrl[];
  url?: string;
};

type SearchSongsResponse = {
  status?: string;
  data?: {
    results?: SaavnSearchSong[];
    total?: number;
    start?: number;
  };
};

export type SearchSongsResult = {
  tracks: Track[];
  page: number;
  total: number;
  hasMore: boolean;
};

function getPreferredDownloadUrl(downloadUrls: SaavnSongDownloadUrl[]) {
  const mapped = downloadUrls
    .map((item) => ({
      quality: item.quality ?? "unknown",
      url: item.url ?? item.link ?? "",
    }))
    .filter((item) => item.url.length > 0);

  const rank = ["320kbps", "160kbps", "96kbps", "48kbps", "12kbps"];

  for (const quality of rank) {
    const found = mapped.find((item) => item.quality === quality);
    if (found) {
      return { best: found.url, list: mapped };
    }
  }

  return { best: mapped[0]?.url ?? "", list: mapped };
}

function getBestArtwork(images: SaavnSongImage[]) {
  const byQuality = ["500x500", "150x150", "50x50"];

  for (const quality of byQuality) {
    const found = images.find((item) => item.quality === quality);
    const link = found?.url ?? found?.link;
    if (link) {
      return link;
    }
  }

  return images[0]?.url ?? images[0]?.link ?? "https://picsum.photos/500";
}

function getArtistName(song: SaavnSearchSong) {
  if (typeof song.primaryArtists === "string") {
    const trimmed = song.primaryArtists.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  if (Array.isArray(song.primaryArtists)) {
    const names = song.primaryArtists
      .map((artist) => artist.name?.trim() ?? "")
      .filter((name) => name.length > 0);

    if (names.length > 0) {
      return names.join(", ");
    }
  }

  const primaryFromArtists = (song.artists?.primary ?? [])
    .map((artist) => artist.name?.trim() ?? "")
    .filter((name) => name.length > 0);

  if (primaryFromArtists.length > 0) {
    return primaryFromArtists.join(", ");
  }

  return "Unknown Artist";
}

function normalizeSong(song: SaavnSearchSong): Track {
  const durationSeconds = Number(song.duration ?? 0) || 0;
  const downloadInfo = getPreferredDownloadUrl(song.downloadUrl ?? []);

  return {
    id: song.id,
    title: song.name ?? "Unknown Title",
    artist: getArtistName(song),
    album: song.album?.name ?? "Unknown Album",
    artwork: getBestArtwork(song.image ?? []),
    durationMillis: durationSeconds * 1000,
    durationLabel: `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")}`,
    streamUrl: downloadInfo.best,
    sourceUrl: song.url ?? "",
    downloadUrls: downloadInfo.list,
  };
}

export async function searchSongs(params: {
  query: string;
  page: number;
  limit: number;
}): Promise<SearchSongsResult> {
  const query =
    params.query.trim().length > 0 ? params.query.trim() : DEFAULT_QUERY;
  const page = Math.max(1, params.page);
  const limit = Math.max(1, params.limit);

  const url = `${BASE_URL}/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Search API failed with status ${response.status}`);
  }

  const payload = (await response.json()) as SearchSongsResponse;
  const results = payload.data?.results ?? [];
  const tracks = results
    .map(normalizeSong)
    .filter((track) => track.streamUrl.length > 0);
  const total = payload.data?.total ?? 0;
  const hasMore = page * limit < total;

  return {
    tracks,
    page,
    total,
    hasMore,
  };
}
