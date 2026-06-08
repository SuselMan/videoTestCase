# Short Video Feed

Test case UI for short video feed.

## How to start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## Solution description

- **`Player`** — manages a single video: DOM, playback, resource loading/unloading.
- **`ProgressBar`** — progress bar, seek
- **`VideosController`** — controlls the feed: fetches videos from the API, switches players, handles infinite scroll.
- **`SoundController`** — global mute state, syncs all players via `CustomEvent`.
- **`MockVideosApi`** — simulates a paginated API with cursor-based navigation.

### Resource management

At most three videos are loaded at a time: current, previous, and next. When the user switches videos, the far player is unloaded (`src = ''` + `video.load()`), freeing memory and network resources.

### Video change detection

`IntersectionObserver` with a 0.7 threshold watches the neighboring players. Once one of them enters the viewport, the switch happens: the old video stops and the new one starts playing.


### Error handling
Added api and video error handling examples (commented in in src/api/mock-videos-api.js), just uncomment if needed
