import './style.css';

const videoClassName = 'video';
const containerClassName = 'player-container';
const uiClassName = 'player-ui-container';
const progressBarContainerClassName = 'progress-bar-container';
const progressBarClassName = 'progress-bar';
const muteButtonClassName = 'mute-button';
const muteButtonMutedClassName = 'mute-button_muted';

const videoPath = 'video'
const threshold = 0.7;

export class Player {
  constructor(data = {}, index, soundController) {
    this.index = index;
    this.isPlaying = false;
    this.intersectionObserver = null;
    this.soundController = soundController;

    // elements
    this.muteButtonElm = null;
    this.containerElm = null;
    this.uiContainerElm = null;
    this.videoElm = null;
    this.progressBarElm = null;
    this.progressBarContainerElm = null;

    // bind handlers
    this.muteHandler = (e) => this.handleMuteChange(e.detail);
    this.muteButtonHandler = this.handleMuteButton.bind(this);
    this.playPauseHandler = this.handlePlayPause.bind(this);
    this.progressBarClickHandler = this.handleProgressBar.bind(this);
    this.timeUpdateHandler = this.handleTimeUpdate.bind(this);

    this.src = `${videoPath}/${data.filename}`;

    this.createVideo();
    this.createUi();
  }

  get containerElement() {
    return this.containerElm;
  }

  createVideo() {
    this.containerElm = document.createElement('div');
    this.videoElm = document.createElement('video');
    this.containerElm.appendChild(this.videoElm);
    this.videoElm.muted = this.soundController.isMuted;
    this.videoElm.loop = true;
    this.videoElm.playsinline = true;
    this.videoElm.preload = 'metadata';
    this.videoElm.classList.add(videoClassName);
    this.containerElm.classList.add(containerClassName);
  }

  createUi() {
    this.uiContainerElm = document.createElement('div');
    this.containerElm.appendChild(this.uiContainerElm);
    this.uiContainerElm.classList.add(uiClassName);
    const muteButton = document.createElement('button');
    muteButton.classList.add(muteButtonClassName);
    this.uiContainerElm.appendChild(muteButton);
    this.muteButtonElm = muteButton;

    this.progressBarContainerElm = document.createElement('div');
    this.progressBarContainerElm.classList.add(progressBarContainerClassName);
    this.progressBarElm = document.createElement('div');
    this.progressBarElm.classList.add(progressBarClassName);
    this.progressBarContainerElm.appendChild(this.progressBarElm);

    this.uiContainerElm.appendChild(this.progressBarContainerElm);
  }

  handleTimeUpdate() {
    const progress = this.videoElm.currentTime / this.videoElm.duration;
    this.progressBarElm.style.width = `${progress * 100}%`;
  }

  handleProgressBar(e) {
    const ratio = e.offsetX / e.currentTarget.offsetWidth;
    this.videoElm.currentTime = this.videoElm.duration * ratio;
    e.stopPropagation();
  }

  handlePlayPause() {
    if(this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  handleMuteButton(e) {
    this.soundController.toggleMute();
    this.handleMuteChange(this.soundController.isMuted);
    e.stopPropagation();
  }

  handleMuteChange(isMuted) {
    if(isMuted) {
      this.muteButtonElm.classList.remove(muteButtonMutedClassName);
    } else {
      this.muteButtonElm.classList.add(muteButtonMutedClassName);
    }
    this.videoElm.muted = isMuted;
  }

  addHandlers() {
    document.addEventListener('muteChanged', this.muteHandler);
    this.muteButtonElm.addEventListener('click', this.muteButtonHandler);
    this.uiContainerElm.addEventListener('click', this.playPauseHandler);
    this.progressBarContainerElm.addEventListener('click', this.progressBarClickHandler);
    this.videoElm.addEventListener('timeupdate', this.timeUpdateHandler);
  }

  removeHandlers() {
    document.removeEventListener('muteChanged', this.muteHandler);
    this.muteButtonElm.removeEventListener('click', this.muteButtonHandler);
    this.uiContainerElm.removeEventListener('click', this.playPauseHandler);
    this.progressBarContainerElm.removeEventListener('click', this.progressBarClickHandler);
    this.videoElm.removeEventListener('timeupdate', this.timeUpdateHandler);
  }

  load() {
    if(this.videoElm.getAttribute('src')) {
      return;
    }
    this.uiContainerElm.classList.remove('hidden');
    this.videoElm.src = this.src;
    this.videoElm.load();
    this.addHandlers();
    this.handleMuteChange(this.soundController.isMuted);
  }

  unload() {
    this.videoElm.src = '';
    this.videoElm.load();
    this.uiContainerElm.classList.add('hidden');
    this.removeHandlers();
  }

  play() {
    this.videoElm.play().then(() => {
      this.isPlaying = true;
    }).catch(err => {});
  }

  stop() {
    this.videoElm.pause();
    this.isPlaying = false;
  }

  observe(callback) {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if(entry.intersectionRatio >= threshold) {
        callback(this.index);
      }
    }, {
      threshold,
    });
    this.intersectionObserver.observe(this.containerElm);
  }

  unobserve() {
    this.intersectionObserver.unobserve(this.containerElm);
    this.intersectionObserver.disconnect();
    this.intersectionObserver = null;
  }
}
