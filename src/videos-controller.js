import { Player } from './player.js';
import { MockVideosApi } from './mock-videos-api.js';
import preloaderPath from './assets/preloader.svg?url';

export class VideosController {
  constructor() {
    // TODO: preloader;
    this.api = new MockVideosApi();
    this.scrollContainer = document.querySelector('#scroll-container');
    this.nextCursor = null;
    this.currentVideoIndex = 0;
    this.players = [];
    this.preloader = null;
    this.isMuted = true;
    this.loadVideos().then(() => {
      this.players[0]?.play();
    });
  }

  toggleMuted() {
    this.isMuted = !this.isMuted;
    document.dispatchEvent(new CustomEvent('mutechange', { detail: this.isMuted }));
  }

  addPreloader() {
    const preloaderContainer = document.createElement('div');
    preloaderContainer.classList.add('preloader');
    const img = document.createElement('img');
    img.width = 50;
    img.height = 50;
    img.src = preloaderPath;
    preloaderContainer.appendChild(img);
    this.scrollContainer.appendChild(preloaderContainer);
    this.preloader = preloaderContainer;
  }

  removePreloader() {
    if(this.preloader) {
      this.preloader.parentNode.removeChild(this.preloader);
    }
  }

  async loadVideos() {
    this.addPreloader();
    try {
      const data = await this.api.getVideos();
      this.nextCursor = data.nextCursor;
      this.removePreloader();
      data.items.forEach((video, index) => {
        const player = new Player(video, this.players.length, this.isMuted, this.toggleMuted.bind(this));
        this.players.push(player);
        this.scrollContainer.appendChild(player.containerElement);
        if( index === 1 ) {
          player.observe((data) => this.videoChanged(data));
          player.load();
        }
        if(index === 0) {
          player.load();
        }
      });
    } catch (err) {

    }
  }

  async loadNext() {
    if(!this.nextCursor) return;
    this.addPreloader();
    try {
      const data = await this.api.getVideos({ cursor: this.nextCursor });
      this.removePreloader();
      this.nextCursor = data.nextCursor;
      data.items.forEach((video) => {
        const player = new Player(video, this.players.length, this.isMuted, this.toggleMuted.bind(this));
        this.players.push(player);
        this.scrollContainer.appendChild(player.containerElement);
      });
    } catch (err) {

    }
  }

  videoChanged(newIndex) {
    this.prevVideo?.unobserve();
    this.nextVideo?.unobserve();
    this.currentVideo.stop();

    const oldIndex = this.currentVideoIndex;

    if(newIndex > oldIndex) {
      this.prevVideo?.unload();
    }
    if(newIndex < oldIndex) {
      this.nextVideo?.unload();
    }


    this.currentVideoIndex = newIndex;
    this.currentVideo.play();

    this.prevVideo?.load();
    this.nextVideo?.load();

    this.prevVideo?.observe((data) => this.videoChanged(data));
    this.nextVideo?.observe((data) => this.videoChanged(data));

    if(this.currentVideoIndex >= this.players.length - 3 && this.nextCursor) {
      this.loadNext().then();
    }
  }

  get currentVideo() {
    return this.players[this.currentVideoIndex];
  }

  get prevVideo() {
    if(this.currentVideoIndex > 0) {
      return this.players[this.currentVideoIndex - 1];
    }
    return null;
  }

  get nextVideo() {
    if(this.currentVideoIndex < this.players.length - 1) {
      return  this.players[this.currentVideoIndex + 1];
    }
    return null;
  }
}
