import { Player } from '../components/player/player.js';
import { MockVideosApi } from '../api/mock-videos-api.js';
import { SoundController } from './sound-controller.js';
import preloaderPath from '../assets/preloader.svg?url';
import arrowUpUrl from '../assets/arrow_up.svg?url';
import arrowDownUrl from '../assets/arrow_down.svg?url';

const cls = {
  preloader: 'preloader',
  preloaderImg: 'preloader__img',
  feedError: 'feed-error',
  feedNav: 'feed-nav',
  navBtn: 'feed-nav__btn',
  navBtnHidden: 'feed-nav__btn--hidden',
};

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
    this.navUpBtn = null;
    this.navDownBtn = null;
    this._createNavButtons();
    this.keydownHandler = this._onKeydown.bind(this);
    this.visibilityHandler = this._onVisibilityChange.bind(this);
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.loadVideos().then(() => {
      this.players[0]?.play();
      this._updateNavButtons();
    });
  }

  addPreloader() {
    const container = document.createElement('div');
    container.classList.add(cls.preloader);
    const img = document.createElement('img');
    img.classList.add(cls.preloaderImg);
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
      this._showFeedError();
    } finally {
      this.isLoadingNext = false;
    }
  }

  _createNavButtons() {
    const nav = document.createElement('nav');
    nav.classList.add(cls.feedNav);

    this.navUpBtn = document.createElement('button');
    this.navUpBtn.classList.add(cls.navBtn);
    this.navUpBtn.setAttribute('aria-label', 'Previous video');
    const upImg = document.createElement('img');
    upImg.src = arrowUpUrl;
    upImg.setAttribute('aria-hidden', 'true');
    this.navUpBtn.appendChild(upImg);
    this.navUpBtn.addEventListener('click', () => {
      this.prevVideo?.containerElement.scrollIntoView({ behavior: 'smooth' });
    });

    this.navDownBtn = document.createElement('button');
    this.navDownBtn.classList.add(cls.navBtn);
    this.navDownBtn.setAttribute('aria-label', 'Next video');
    const downImg = document.createElement('img');
    downImg.src = arrowDownUrl;
    downImg.setAttribute('aria-hidden', 'true');
    this.navDownBtn.appendChild(downImg);
    this.navDownBtn.addEventListener('click', () => {
      this.nextVideo?.containerElement.scrollIntoView({ behavior: 'smooth' });
    });

    nav.appendChild(this.navUpBtn);
    nav.appendChild(this.navDownBtn);
    document.querySelector('#app').appendChild(nav);
  }

  _updateNavButtons() {
    this.navUpBtn.classList.toggle(cls.navBtnHidden, !this.prevVideo);
    this.navDownBtn.classList.toggle(cls.navBtnHidden, !this.nextVideo);
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

    this._updateNavButtons();

    if (this.currentVideoIndex >= this.players.length - 3 && this.nextCursor) {
      this.loadNext();
    }
  }

  _onVisibilityChange() {
    if (document.hidden) {
      this._wasPlayingBeforeHide = this.currentVideo?.isPlaying ?? false;
      this.currentVideo?.stop();
    } else if (this._wasPlayingBeforeHide) {
      this.currentVideo?.play();
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
    msg.classList.add(cls.feedError);
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
