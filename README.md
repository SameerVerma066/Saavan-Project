# Saavan Player

Saavan Player is a React Native music player built with Expo and Expo Router.
It fetches music metadata and streaming URLs from the JioSaavn-compatible API at:

`https://saavn.sumit.co`

The app includes:

- Suggested discovery (random songs + artists)
- Search with pagination
- Artist action sheet (play, queue, playlist-like actions, share)
- Persistent playback queue
- Favorites (liked songs)
- Recently played history
- Mini player + full player screen

## Tech Stack

- Expo SDK 54
- React 19 + React Native 0.81
- TypeScript
- Expo Router (file-based routing)
- Zustand + AsyncStorage persistence
- Expo AV for playback
- Expo Image and Expo Vector Icons

## Project Structure

```text
app/
   (tabs)/
      _layout.tsx        # Bottom tab layout + MiniPlayer mount
      index.tsx          # Home tab route
      favorites.tsx      # Favorites (liked songs)
      explore.tsx        # Playlists tab (placeholder)
      settings.tsx       # Settings tab (placeholder)
   player.tsx           # Full player route

screens/
   home-screen.tsx      # Suggested/Songs/Artists/Albums/Folder top tabs
   player-screen.tsx    # Full player UI

context/
   player-context.tsx   # Playback engine + AV lifecycle + queue transitions

store/
   music-store.ts       # Global app state, queue, likes, suggestions, artists

services/
   saavn-api.ts         # API client + data normalization
```

## Features

### 1. Playback Engine

- Queue-based playback with next/previous
- Shuffle and repeat modes (`off`, `all`, `one`)
- Progress tracking and seeking
- Safe track transition logic to avoid overlapping playback
- Automatic next track behavior when song finishes

Core file: `context/player-context.tsx`

### 2. Song Discovery and Search

- Random suggestions for the Suggested tab
- Random artists on Artists tab
- Search endpoint integration with pagination
- Data normalization for track metadata and stream URLs

Core file: `services/saavn-api.ts`

### 3. State Management

Zustand store handles:

- Queue and current playback index
- Playback state (`isPlaying`, position, duration)
- Search state and pagination
- Suggested content
- Liked songs
- Recently played
- Artists tab data

Persisted to AsyncStorage:

- Queue
- Current index
- Shuffle/repeat settings
- Recently played
- Liked songs

Core file: `store/music-store.ts`

### 4. UI and Navigation

- Bottom tab navigation: Home, Favorites, Playlists, Settings
- Home screen top category tabs with smooth animated indicator
- Artist action bottom sheet style modal
- Mini player fixed above tab bar
- Safe-area aware layouts across tabs

## API Notes

Current API base:

`https://saavn.sumit.co`

Used endpoints:

- `GET /api/search/songs?query=&page=&limit=`
- `GET /api/search/artists?query=&page=&limit=`

The app normalizes:

- Track title, artist, album, artwork
- Best available download/stream URL
- Duration labels and milliseconds

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Android Studio emulator or physical device (or iOS simulator on macOS)

### Install

```bash
npm install
```

### Run

```bash
npm run start
```

Useful variants:

```bash
npm run android
npm run ios
npm run web
```

## Available Scripts

- `npm run start` - Start Expo dev server
- `npm run android` - Start and open Android target
- `npm run ios` - Start and open iOS target
- `npm run web` - Start web build target
- `npm run lint` - Run Expo/ESLint checks
- `npm run reset-project` - Reset scaffold helper script

## Configuration

Key config lives in:

- `app.json` (name, icon, splash, scheme, platform config)
- `tsconfig.json`
- `eslint.config.js`

Notable app config:

- `scheme`: `saavanplayer`
- Android edge-to-edge enabled
- Typed routes enabled via Expo Router experiments

## Known Limitations

- Playlists and Settings tabs are currently placeholders.
- Artist song loading is query-based and depends on API matching quality.
- Streaming reliability depends on the external API response quality.

## Roadmap Ideas

- Real custom playlists (CRUD)
- Download/offline caching
- Better queue editor screen integration
- Lyrics and richer track metadata
- Background controls and notification actions

## Troubleshooting

### App opens but songs do not play

- Verify network access to `https://saavn.sumit.co`
- Check if fetched tracks include valid `streamUrl`

### Empty suggestions/artists

- API may return sparse data for a given random query
- Retry by switching tabs or searching manually

### Metro / Expo issues

Try:

```bash
npx expo start -c
```

## License

This project is currently unlicensed for distribution. Add a LICENSE file if you plan to publish it.
