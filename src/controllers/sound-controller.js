export class SoundController {
  constructor() {
    this.isMuted = true;
    this.toggleMute = this._toggleMute.bind(this);
  }

  _toggleMute() {
    this.isMuted  = !this.isMuted
    document.dispatchEvent(new CustomEvent('muteChanged', { detail: this.isMuted }));
  }
}
