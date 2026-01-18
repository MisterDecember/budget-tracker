// ============================================
// PIXELVAULT - Retro Audio Module
// ============================================

const Audio = {
    enabled: true,
    volume: 0.3,
    audioContext: null,

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    },

    // Generate oscillator-based sound effects
    playTone(frequency, duration, type = 'square', volume = this.volume) {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    },

    // Click sound - short blip
    click() {
        this.playTone(800, 0.05, 'square', 0.2);
    },

    // Success sound - ascending tones
    success() {
        this.playTone(523, 0.1, 'square');
        setTimeout(() => this.playTone(659, 0.1, 'square'), 100);
        setTimeout(() => this.playTone(784, 0.15, 'square'), 200);
    },

    // Error sound - descending buzz
    error() {
        this.playTone(200, 0.1, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(150, 0.15, 'sawtooth', 0.3), 100);
    },

    // Coin sound - classic collect
    coin() {
        this.playTone(988, 0.05, 'square');
        setTimeout(() => this.playTone(1319, 0.15, 'square'), 50);
    },

    // Navigation sound
    navigate() {
        this.playTone(440, 0.03, 'square', 0.15);
    },

    // Modal open
    modalOpen() {
        this.playTone(523, 0.05, 'triangle');
        setTimeout(() => this.playTone(659, 0.08, 'triangle'), 50);
    },

    // Modal close
    modalClose() {
        this.playTone(659, 0.05, 'triangle');
        setTimeout(() => this.playTone(523, 0.08, 'triangle'), 50);
    },

    // Save/confirm sound
    save() {
        this.playTone(440, 0.08, 'square');
        setTimeout(() => this.playTone(554, 0.08, 'square'), 80);
        setTimeout(() => this.playTone(659, 0.12, 'square'), 160);
    },

    // Delete sound
    delete() {
        this.playTone(330, 0.1, 'sawtooth', 0.25);
        setTimeout(() => this.playTone(262, 0.15, 'sawtooth', 0.25), 100);
    },

    // Level up / milestone sound
    levelUp() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.12, 'square'), i * 100);
        });
    },

    // Warning sound
    warning() {
        this.playTone(440, 0.1, 'triangle', 0.25);
        setTimeout(() => this.playTone(440, 0.1, 'triangle', 0.25), 200);
    },

    // Typing sound (for input fields)
    type() {
        this.playTone(600 + Math.random() * 200, 0.02, 'square', 0.1);
    },

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) this.click();
        return this.enabled;
    },

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
};

// Initialize audio on first user interaction
document.addEventListener('click', function initAudio() {
    Audio.init();
    document.removeEventListener('click', initAudio);
}, { once: true });

window.Audio = Audio;
