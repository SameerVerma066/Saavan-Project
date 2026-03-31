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

type SaavnSearchArtist = {
  id?: string;
  name?: string;
  image?: SaavnSongImage[];
  url?: string;
};

type SearchArtistsResponse = {
  status?: string;
  data?: {
    results?: SaavnSearchArtist[];
    total?: number;
    start?: number;
  };
};

export type Artist = {
  id: string;
  name: string;
  image: string;
  url: string;
};

export type SearchArtistsResult = {
  artists: Artist[];
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

function getArtistName(song: SaavnSearchSong): string {
  try {
    // Try primaryArtists as string first
    if (typeof song.primaryArtists === "string") {
      const trimmed = song.primaryArtists.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    // Try primaryArtists as array
    if (Array.isArray(song.primaryArtists)) {
      const names = song.primaryArtists
        .map((artist) => {
          if (!artist) return "";
          const name = typeof artist === "string" ? artist : artist.name;
          return name?.trim() ?? "";
        })
        .filter((name) => name.length > 0);

      if (names.length > 0) {
        return names.join(", ");
      }
    }

    // Try artists.primary array
    const primaryFromArtists = (song.artists?.primary ?? [])
      .map((artist) => artist?.name?.trim() ?? "")
      .filter((name) => name.length > 0);

    if (primaryFromArtists.length > 0) {
      return primaryFromArtists.join(", ");
    }
  } catch (error) {
    // Silently handle any parsing errors
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

// Get random songs from popular queries
export async function getRandomSongs(limit: number = 6): Promise<Track[]> {
  const queries = [
    "trending",
    "top songs",
    "popular",
    "bollywood",
    "arijit singh",
    "indie",
  ];
  const randomQuery = queries[Math.floor(Math.random() * queries.length)];

  try {
    const result = await searchSongs({
      query: randomQuery,
      page: 1,
      limit: Math.max(6, limit),
    });

    // Shuffle and return limited results
    const shuffled = [...result.tracks].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  } catch (error) {
    console.error("Failed to get random songs:", error);
    return [];
  }
}

// Get random artists from popular queries
export async function getRandomArtists(limit: number = 3): Promise<Track[]> {
  const artistQueries = [
    "arijit singh",
    "taylor swift",
    "ed sheeran",
    "the weeknd",
    "ariana grande",
    "bad bunny",
  ];
  const randomQuery =
    artistQueries[Math.floor(Math.random() * artistQueries.length)];

  try {
    const result = await searchSongs({
      query: randomQuery,
      page: 1,
      limit: Math.max(3, limit),
    });

    // Return unique artists based on artist name
    const uniqueArtists: Record<string, Track> = {};
    for (const track of result.tracks) {
      if (!uniqueArtists[track.artist]) {
        uniqueArtists[track.artist] = track;
      }
    }

    const artists = Object.values(uniqueArtists);
    return artists.slice(0, limit);
  } catch (error) {
    console.error("Failed to get random artists:", error);
    return [];
  }
}

// Search artists from the API
export async function searchArtists(params: {
  query: string;
  page: number;
  limit: number;
}): Promise<SearchArtistsResult> {
  const query =
    params.query.trim().length > 0 ? params.query.trim() : "popular";
  const page = Math.max(1, params.page);
  const limit = Math.max(1, params.limit);

  const url = `${BASE_URL}/api/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Search Artists API failed with status ${response.status}`);
    }

    const payload = (await response.json()) as SearchArtistsResponse;
    const results = payload.data?.results ?? [];
    
    const artists = results
      .map((artist) => ({
        id: artist.id ?? "",
        name: artist.name ?? "Unknown Artist",
        image: artist.image?.[0]?.url ?? artist.image?.[0]?.link ?? "https://picsum.photos/500",
        url: artist.url ?? "",
      }))
      .filter((artist) => artist.id.length > 0);

    const total = payload.data?.total ?? 0;
    const hasMore = page * limit < total;

    return {
      artists,
      page,
      total,
      hasMore,
    };
  } catch (error) {
    console.error("Failed to search artists:", error);
    return {
      artists: [],
      page,
      total: 0,
      hasMore: false,
    };
  }
}

// Get random artists from API
export async function getRandomArtistsFromAPI(limit: number = 6): Promise<Artist[]> {
  const artistQueries = [
    "arijit singh",
    "taylor swift",
    "ed sheeran",
    "the weeknd",
    "ariana grande",
    "bad bunny",
    "travis scott",
    "billie eilish",
    "Drake",
  ];
  const randomQuery =
    artistQueries[Math.floor(Math.random() * artistQueries.length)];

  try {
    const result = await searchArtists({
      query: randomQuery,
      page: 1,
      limit: Math.max(6, limit),
    });

    // Shuffle and return limited results
    const shuffled = [...result.artists].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  } catch (error) {
    console.error("Failed to get random artists from API:", error);
    return [];
  }
}
