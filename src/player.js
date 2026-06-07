import './style.css';

const videoClassName = 'video';
const containerClassName = 'player-container';
const videoPath = 'video'
const uiClassName = 'player-ui-container';

export class Player {
  constructor(data = {}, index, isMuted = true, toggleMute = () => {}) {
    this.index = index;
    this.isPlaying = false;
    // { id: '1', filename: '2466797579047759691.MP4', title: 'Video 1', description: 'Test video description 1' }
    this.container = document.createElement('div');
    this.video = document.createElement('video');
    this.container.appendChild(this.video);
    this.video.muted = isMuted;
    this.video.loop = true;
    this.video.playsinline = true;
    this.video.preload = 'metadata';
    this.video.classList.add(videoClassName);
    this.container.classList.add(containerClassName);
    this.src = `${videoPath}/${data.filename}`;
    this.observer = null;
    this.muteButton = null;
    this.uiContainer = null;
    this.progressBar = null;
    this.progressBarContainer = null;
    this.toggleMute = toggleMute;
    this.createUi();
  }

  createUi() {
    this.uiContainer = document.createElement('div');
    this.container.appendChild(this.uiContainer);
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
      console.log(e);
      if(e.detail) {
        this.muteButton.classList.remove('mute-button_muted');
      } else {
        this.muteButton.classList.add('mute-button_muted');
      }
      this.video.muted = e.detail;
    });

    this.progressBarContainer = document.createElement('div');
    this.progressBarContainer.classList.add('progress-bar-container');
    this.progressBar = document.createElement('div');
    this.progressBar.classList.add('progress-bar');
    this.progressBarContainer.appendChild(this.progressBar);

    this.progressBarContainer.addEventListener('click', (e) => {
      const ratio = e.offsetX / e.target.offsetWidth;
      this.video.currentTime = this.video.duration * ratio;
      e.stopPropagation();
    });


    this.video.addEventListener('timeupdate', () => {
      const progress = this.video.currentTime / this.video.duration;
      this.progressBar.style.width = `${progress * 100}%`;
    });

    this.uiContainer.appendChild(this.progressBarContainer);
  }

  get containerElement() {
    return this.container;
  }

  load() {
    if(this.video.src) {
      return;
    }
    this.video.src = this.src;
    this.video.load();
  }

  unload() {
    this.video.src = '';
    this.video.load();
  }

  play() {
    this.video.play().then(() => {
      this.isPlaying = true;
    }).catch(err => {});
  }

  stop() {
    this.video.pause();
    this.isPlaying = false;
  }

  observe(callback) {
    this.observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      // TODO: 0.7 to contst?
      if(entry.intersectionRatio >= 0.7) {
        console.log(this.index, entry);
        callback(this.index);
      }
    }, {
      threshold: 0.7,
    });
    this.observer.observe(this.containerElement);
  }

  unobserve() {
    this.observer.unobserve(this.containerElement);
    this.observer.disconnect();
    this.observer = null;
  }
}
