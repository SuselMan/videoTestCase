import './style.css';

const videoClassName = 'video';
const containerClassName = 'player-container';
const videoPath = 'video'
const uiClassName = 'player-ui-container';
const threshold = 0.7;

export class Player {
  constructor(data = {}, index, isMuted = true, toggleMute = () => {}) {
    this.index = index;
    this.isPlaying = false;
    this.containerElm = null;
    this.videoElm = null;
    this.observer = null;
    this.muteButton = null;
    this.uiContainer = null;
    this.progressBar = null;
    this.progressBarContainer = null;
    this.toggleMute = toggleMute;
    this.createVideo(isMuted);
    this.createUi();
  }

  createVideo(isMuted = true) {
    this.containerElm = document.createElement('div');
    this.videoElm = document.createElement('video');
    this.containerElm.appendChild(this.videoElm);
    this.videoElm.muted = isMuted;
    this.videoElm.loop = true;
    this.videoElm.playsinline = true;
    this.videoElm.preload = 'metadata';
    this.videoElm.classList.add(videoClassName);
    this.containerElm.classList.add(containerClassName);
    this.src = '';
  }

  createUi() {
    this.uiContainer = document.createElement('div');
    this.containerElm.appendChild(this.uiContainer);
    this.uiContainer.classList.add(uiClassName);
    const muteButton = document.createElement('button');
    muteButton.classList.add('mute-button');
    this.uiContainer.appendChild(muteButton);
    this.muteButton = muteButton;

    this.muteButton.addEventListener('click', (e) => {
      this.toggleMute();
      e.stopPropagation();
    });

    this.uiContainer.addEventListener('click', () => {
      if(this.isPlaying) {
        this.stop();
      } else {
        this.play();
      }
    })

    document.addEventListener('mutechange', (e) => {
      if(e.detail) {
        this.muteButton.classList.remove('mute-button_muted');
      } else {
        this.muteButton.classList.add('mute-button_muted');
      }
      this.videoElm.muted = e.detail;
    });

    this.progressBarContainer = document.createElement('div');
    this.progressBarContainer.classList.add('progress-bar-container');
    this.progressBar = document.createElement('div');
    this.progressBar.classList.add('progress-bar');
    this.progressBarContainer.appendChild(this.progressBar);

    this.progressBarContainer.addEventListener('click', (e) => {
      const ratio = e.offsetX / e.currentTarget.offsetWidth;
      this.videoElm.currentTime = this.videoElm.duration * ratio;
      e.stopPropagation();
    });


    this.videoElm.addEventListener('timeupdate', () => {
      const progress = this.videoElm.currentTime / this.videoElm.duration;
      this.progressBar.style.width = `${progress * 100}%`;
    });

    this.uiContainer.appendChild(this.progressBarContainer);
  }

  get containerElement() {
    return this.containerElm;
  }

  load() {
    if(this.videoElm.getAttribute('src')) {
      return;
    }
    this.uiContainer.classList.remove('hidden');
    this.videoElm.src = this.src;
    this.videoElm.load();
  }

  unload() {
    this.videoElm.src = '';
    this.videoElm.load();
    this.uiContainer.classList.add('hidden');
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
    this.observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if(entry.intersectionRatio >= threshold) {
        callback(this.index);
      }
    }, {
      threshold,
    });
    this.observer.observe(this.containerElmElement);
  }

  unobserve() {
    this.observer.unobserve(this.containerElmElement);
    this.observer.disconnect();
    this.observer = null;
  }
}
