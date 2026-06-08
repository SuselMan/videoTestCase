export class SoundController {
  constructor() {
    this.isMuted = true;
  }

  toggleMute() {
    this.isMuted  = !this.isMuted
    document.dispatchEvent(new CustomEvent('muteChanged', { detail: this.isMuted }));
  }
}
