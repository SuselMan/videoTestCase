import './player.css';
import { ProgressBar } from './progress-bar.js';
import playIconUrl from '../../assets/play.svg?url';
import pauseIconUrl from '../../assets/pause.svg?url';

const videoPath = 'video';
const threshold = 0.7;

const cls = {
  container: 'player',
  video: 'player__video',
  ui: 'player__ui',
  muteBtn: 'player__mute-btn',
  muteBtnMuted: 'player__mute-btn--muted',
  title: 'player__title',
  error: 'player__error',
  playbackIcon: 'player__playback-icon',
  playbackIconVisible: 'player__playback-icon--visible',
};

export class Player {
  constructor(data = {}, index, soundController) {
    this.index = index;
    this.isPlaying = false;
    this.intersectionObserver = null;
    this.soundController = soundController;
    this.progressBar = null;

    this.containerElm = null;
    this.uiElm = null;
    this.videoElm = null;
    this.muteBtn = null;
    this.playbackIconElm = null;
    this._playbackIconTimer = null;

    this.muteHandler = (e) => this._onMuteChange(e.detail);
    this.muteBtnHandler = this._onMuteBtn.bind(this);
    this.playPauseHandler = this._onPlayPause.bind(this);
    this.videoErrorHandler = this._onVideoError.bind(this);
    this.videoPlayHandler = () => { this.isPlaying = true; };
    this.videoPauseHandler = () => { this.isPlaying = false; };
    this.uiKeydownHandler = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._onPlayPause();
      }
    };

    this.src = `${videoPath}/${data.filename}`;
    this.title = data.title ?? '';

    this._createVideo();
    this._createUi();
  }

  get containerElement() {
    return this.containerElm;
  }

  _createVideo() {
    this.containerElm = document.createElement('div');
    this.containerElm.classList.add(cls.container);

    this.videoElm = document.createElement('video');
    this.videoElm.muted = this.soundController.isMuted;
    this.videoElm.loop = true;
    this.videoElm.playsinline = true;
    this.videoElm.preload = 'metadata';
    this.videoElm.classList.add(cls.video);

    this.containerElm.appendChild(this.videoElm);
  }

  _createUi() {
    this.uiElm = document.createElement('div');
    this.uiElm.classList.add(cls.ui);
    this.uiElm.setAttribute('role', 'button');
    this.uiElm.setAttribute('aria-label', 'Play/Pause');
    this.uiElm.setAttribute('tabindex', '0');

    this.muteBtn = document.createElement('button');
    this.muteBtn.classList.add(cls.muteBtn);
    this.muteBtn.setAttribute('aria-label', 'Toggle mute');
    this.uiElm.appendChild(this.muteBtn);

    if (this.title) {
      const titleElm = document.createElement('p');
      titleElm.classList.add(cls.title);
      titleElm.textContent = this.title;
      this.uiElm.appendChild(titleElm);
    }

    this.playbackIconElm = document.createElement('img');
    this.playbackIconElm.classList.add(cls.playbackIcon);
    this.playbackIconElm.setAttribute('aria-hidden', 'true');
    this.uiElm.appendChild(this.playbackIconElm);

    this.progressBar = new ProgressBar(this.videoElm);
    this.uiElm.appendChild(this.progressBar.element);

    this.containerElm.appendChild(this.uiElm);
  }

  _showPlaybackIcon(isPlaying) {
    clearTimeout(this._playbackIconTimer);
    this.playbackIconElm.src = isPlaying ? playIconUrl : pauseIconUrl;
    this.playbackIconElm.classList.add(cls.playbackIconVisible);
    this._playbackIconTimer = setTimeout(() => {
      this.playbackIconElm.classList.remove(cls.playbackIconVisible);
    }, 600);
  }

  _onPlayPause() {
    if (this.isPlaying) {
      this.stop();
      this._showPlaybackIcon(false);
    } else {
      this.play();
      this._showPlaybackIcon(true);
    }
  }

  _onMuteBtn(e) {
    this.soundController.toggleMute();
    this._onMuteChange(this.soundController.isMuted);
    e.stopPropagation();
  }

  _onMuteChange(isMuted) {
    this.muteBtn.classList.toggle(cls.muteBtnMuted, !isMuted);
    this.videoElm.muted = isMuted;
  }

  _onVideoError() {
    if (this.containerElm.querySelector(`.${cls.error}`)) return;
    this.uiElm.classList.add('hidden');
    const err = document.createElement('p');
    err.classList.add(cls.error);
    err.textContent = 'Failed to load video';
    this.containerElm.appendChild(err);
  }

  _addHandlers() {
    document.addEventListener('muteChanged', this.muteHandler);
    this.muteBtn.addEventListener('click', this.muteBtnHandler);
    this.uiElm.addEventListener('click', this.playPauseHandler);
    this.videoElm.addEventListener('error', this.videoErrorHandler);
    this.videoElm.addEventListener('play', this.videoPlayHandler);
    this.videoElm.addEventListener('pause', this.videoPauseHandler);
    this.uiElm.addEventListener('keydown', this.uiKeydownHandler);
    this.progressBar.addHandlers();
  }

  _removeHandlers() {
    document.removeEventListener('muteChanged', this.muteHandler);
    this.muteBtn.removeEventListener('click', this.muteBtnHandler);
    this.uiElm.removeEventListener('click', this.playPauseHandler);
    this.uiElm.removeEventListener('keydown', this.uiKeydownHandler);
    this.videoElm.removeEventListener('error', this.videoErrorHandler);
    this.videoElm.removeEventListener('play', this.videoPlayHandler);
    this.videoElm.removeEventListener('pause', this.videoPauseHandler);
    this.progressBar.removeHandlers();
  }

  load() {
    if (this.videoElm.getAttribute('src')) return;
    this.uiElm.classList.remove('hidden');
    this.containerElm.querySelector(`.${cls.error}`)?.remove();
    this.videoElm.src = this.src;
    this.videoElm.load();
    this._addHandlers();
    this._onMuteChange(this.soundController.isMuted);
  }

  unload() {
    this.videoElm.src = '';
    this.videoElm.load();
    this.uiElm.classList.add('hidden');
    this._removeHandlers();
  }

  play() {
    this.videoElm.play().catch(() => {});
  }

  stop() {
    this.videoElm.pause();
  }

  observe(callback) {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      if (entries[0].intersectionRatio >= threshold) {
        callback(this.index);
      }
    }, { threshold });
    this.intersectionObserver.observe(this.containerElm);
  }

  unobserve() {
    if (!this.intersectionObserver) return;
    this.intersectionObserver.unobserve(this.containerElm);
    this.intersectionObserver.disconnect();
    this.intersectionObserver = null;
  }
}
