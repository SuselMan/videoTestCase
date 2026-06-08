import { Player } from '../components/player/player.js';
import { MockVideosApi } from '../api/mock-videos-api.js';
import { SoundController } from '../sound-controller.js';
import preloaderPath from '../assets/preloader.svg?url';

export class VideosController {
  constructor() {
    this.api = new MockVideosApi();
    this.scrollContainer = document.querySelector('#scroll-container');
    this.nextCursor = null;
    this.currentVideoIndex = 0;
    this.players = [];
    this.preloader = null;
    this.isLoadingNext = false;
    this.soundController = new SoundController();
    this.keydownHandler = this._onKeydown.bind(this);
    document.addEventListener('keydown', this.keydownHandler);
    this.loadVideos().then(() => {
      this.players[0]?.play();
    });
  }

  addPreloader() {
    const container = document.createElement('div');
    container.classList.add('preloader');
    const img = document.createElement('img');
    img.classList.add('preloader__img');
    img.src = preloaderPath;
    container.appendChild(img);
    this.scrollContainer.appendChild(container);
    this.preloader = container;
  }

  removePreloader() {
    this.preloader?.remove();
    this.preloader = null;
  }

  addPlayer(videoData) {
    const player = new Player(videoData, this.players.length, this.soundController);
    this.players.push(player);
    this.scrollContainer.appendChild(player.containerElement);
    return player;
  }

  async loadVideos() {
    this.addPreloader();
    try {
      const data = await this.api.getVideos();
      this.nextCursor = data.nextCursor;
      this.removePreloader();
      data.items.forEach((video, index) => {
        const player = this.addPlayer(video);
        if (index === 0) player.load();
        if (index === 1) {
          player.load();
          player.observe((idx) => this.videoChanged(idx));
        }
      });
    } catch {
      this.removePreloader();
      this._showFeedError();
    }
  }

  async loadNext() {
    if (!this.nextCursor || this.isLoadingNext) return;
    this.isLoadingNext = true;
    this.addPreloader();
    try {
      const data = await this.api.getVideos({ cursor: this.nextCursor });
      this.removePreloader();
      this.nextCursor = data.nextCursor;
      data.items.forEach((videoData) => this.addPlayer(videoData));
    } catch {
      this.removePreloader();
    } finally {
      this.isLoadingNext = false;
    }
  }

  videoChanged(newIndex) {
    const oldIndex = this.currentVideoIndex;
    const prev = this.prevVideo;
    const next = this.nextVideo;
    const current = this.currentVideo;

    prev?.unobserve();
    next?.unobserve();
    current.stop();

    if (newIndex > oldIndex) prev?.unload();
    if (newIndex < oldIndex) next?.unload();

    this.currentVideoIndex = newIndex;
    this.currentVideo.play();

    this.prevVideo?.load();
    this.nextVideo?.load();
    this.prevVideo?.observe((idx) => this.videoChanged(idx));
    this.nextVideo?.observe((idx) => this.videoChanged(idx));

    if (this.currentVideoIndex >= this.players.length - 3 && this.nextCursor) {
      this.loadNext();
    }
  }

  _onKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.nextVideo?.containerElement.scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.prevVideo?.containerElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  _showFeedError() {
    const msg = document.createElement('p');
    msg.classList.add('feed-error');
    msg.textContent = 'Failed to load videos. Please try again later.';
    this.scrollContainer.appendChild(msg);
  }

  get currentVideo() {
    return this.players[this.currentVideoIndex];
  }

  get prevVideo() {
    return this.currentVideoIndex > 0 ? this.players[this.currentVideoIndex - 1] : null;
  }

  get nextVideo() {
    return this.currentVideoIndex < this.players.length - 1 ? this.players[this.currentVideoIndex + 1] : null;
  }
}
