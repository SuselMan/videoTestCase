const cls = {
  container: 'progress-bar',
  fill: 'progress-bar__fill',
};

export class ProgressBar {
  constructor(video) {
    this.video = video;
    this.isDragging = false;

    this.containerElm = null;
    this.fillElm = null;

    this.timeUpdateHandler = this._onTimeUpdate.bind(this);
    this.pointerDownHandler = this._onPointerDown.bind(this);
    this.pointerMoveHandler = this._onPointerMove.bind(this);
    this.pointerUpHandler = this._onPointerUp.bind(this);

    this._create();
  }

  get element() {
    return this.containerElm;
  }

  _create() {
    this.containerElm = document.createElement('div');
    this.containerElm.classList.add(cls.container);
    this.fillElm = document.createElement('div');
    this.fillElm.classList.add(cls.fill);
    this.containerElm.appendChild(this.fillElm);
  }

  _seek(e) {
    const rect = this.containerElm.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    this.video.currentTime = this.video.duration * ratio;
    this._setFill(ratio);
  }

  _setFill(ratio) {
    this.fillElm.style.width = `${ratio * 100}%`;
  }

  _onTimeUpdate() {
    if (this.isDragging) return;
    this._setFill(this.video.currentTime / this.video.duration);
  }

  _onPointerDown(e) {
    e.stopPropagation();
    this.isDragging = true;
    this.containerElm.setPointerCapture(e.pointerId);
    this._seek(e);
  }

  _onPointerMove(e) {
    if (!this.isDragging) return;
    this._seek(e);
  }

  _onPointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this._seek(e);
  }

  addHandlers() {
    this.video.addEventListener('timeupdate', this.timeUpdateHandler);
    this.containerElm.addEventListener('pointerdown', this.pointerDownHandler);
    this.containerElm.addEventListener('pointermove', this.pointerMoveHandler);
    this.containerElm.addEventListener('pointerup', this.pointerUpHandler);
  }

  removeHandlers() {
    this.video.removeEventListener('timeupdate', this.timeUpdateHandler);
    this.containerElm.removeEventListener('pointerdown', this.pointerDownHandler);
    this.containerElm.removeEventListener('pointermove', this.pointerMoveHandler);
    this.containerElm.removeEventListener('pointerup', this.pointerUpHandler);
  }
}
