import { Player } from './player.js';
import { MockVideosApi } from './mock-videos-api.js';
import { SoundController } from './sound-controller.js';

import preloaderPath from './assets/preloader.svg?url';

export class VideosController {
  constructor() {
    this.api = new MockVideosApi();
    this.scrollContainer = document.querySelector('#scroll-container');
    this.nextCursor = null;
    this.currentVideoIndex = 0;
    this.players = [];
    this.preloader = null;
    this.soundController = new SoundController();
    this.loadVideos().then(() => {
      this.players[0]?.play();
    });
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
    this.preloader?.remove();
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
      data.items.forEach((videoData) => {
        this.addPlayer(videoData);
      });
    } catch (err) {

    }
  }

  videoChanged(newIndex) {
    const oldIndex = this.currentVideoIndex;

    this.prevVideo?.unobserve();
    this.nextVideo?.unobserve();
    this.currentVideo.stop();

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
