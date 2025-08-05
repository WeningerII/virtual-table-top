// services/soundManager.ts

class SoundManager {
    private ambientAudio: HTMLAudioElement;
    private soundCache: Map<string, string> = new Map();

    constructor() {
        this.ambientAudio = new Audio();
        this.ambientAudio.loop = true;
        this.ambientAudio.volume = 0.3; // Lower volume for ambient tracks

        // Use Data URIs for short sound effects to prevent loading errors from missing files.
        this.soundCache.set('ui-click', 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAC/gQ==');
        this.soundCache.set('modal-open', 'data:audio/wav;base64,UklGRkgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YcQAAAAAAP9/AIA/f4CBgIeAiYCGgH2AfYB9gH2AgICAgIGAfYB9gH2AfYB9gICAgICB/38AgP9/AICAgP9/f3+AfYB9gH2AgYCBgH2AfYB9gH2AfYCBgIGAgf9/AIA=');
        this.soundCache.set('modal-close', 'data:audio/wav;base64,UklGRkgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YcQAAAAAAP9/AIA/f4CBgIeAiYCGgH2AfYB9gH2AgICAgIGAfYB9gH2AfYB9gICAgICB/38AgP9/AICAgP9/f3+AfYB9gH2AgYCBgH2AfYB9gH2AfYCBgIGAgf9/AIA=');
        this.soundCache.set('sword-hit', 'data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVgAAAD8/v/8/v/7/v/6/v/5/v/4/v/3/v/2/v/1/v/0/v/z/v/x/v/w/v/v/v/u/v/t/v/s/v/r/v/q/v/p/v/o/v/n/v/m/v/l/v/k/v/j/v/i/v/h/v/g/v/f/v/e/v/d/v/c/v/b/v/a/v/');
        this.soundCache.set('arrow-whoosh', 'data:audio/wav;base64,UklGRkgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YcQAAAAAAP9/AIA/f4CBgIeAiYCGgH2AfYB9gH2AgICAgIGAfYB9gH2AfYB9gICAgICB/38AgP9/AICAgP9/f3+AfYB9gH2AgYCBgH2AfYB9gH2AfYCBgIGAgf9/AIA=');
        this.soundCache.set('cast-spell', 'data:audio/wav;base64,UklGRoAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWAAAADAgP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4D/gP+A/4IA');
        this.soundCache.set('fireball-explode', 'data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVgAAAD8/v/8/v/7/v/6/v/5/v/4/v/3/v/2/v/1/v/0/v/z/v/x/v/w/v/v/v/u/v/t/v/s/v/r/v/q/v/p/v/o/v/n/v/m/v/l/v/k/v/j/v/i/v/h/v/g/v/f/v/e/v/d/v/c/v/b/v/a/v/');

        // Ambient tracks are long, keep them as files.
        this.soundCache.set('forest-ambient', '/sounds/ambient_forest.mp3');
        this.soundCache.set('cave-ambient', '/sounds/ambient_cave.mp3');
    }

    public playSound(soundId: string, channel: 'ui' | 'sfx' = 'ui') {
        const soundSrc = this.soundCache.get(soundId);
        if (!soundSrc) {
            console.warn(`Sound not found: ${soundId}`);
            return;
        }

        // Create a new Audio object for each short sound to allow for overlaps
        // and prevent interruptions.
        const audio = new Audio(soundSrc);
        audio.volume = channel === 'ui' ? 0.5 : 0.8;
        audio.play().catch(e => {
            // Silently fail if there's an issue, as it's non-critical.
            // console.error(`Error playing ${channel} sound: ${e.message}`);
        });
    }
    
    public playAmbient(theme: string) {
        const themeId = `${theme.toLowerCase()}-ambient`;
        const soundSrc = this.soundCache.get(themeId);
        
        if (soundSrc) {
            const currentSrc = this.ambientAudio.src;
            const newSrcUrl = new URL(soundSrc, window.location.origin).href;

            if (currentSrc === newSrcUrl && !this.ambientAudio.paused) {
                return; // Already playing
            }
            
            this.ambientAudio.src = soundSrc;
            const playPromise = this.ambientAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Autoplay was prevented. This is a common browser policy.
                    // We can ignore this error as ambient sound is non-critical.
                    console.warn("Ambient audio failed to play automatically:", error);
                });
            }
        } else {
            this.stopAmbient();
        }
    }

    public stopAmbient() {
        if (!this.ambientAudio.paused) {
            this.ambientAudio.pause();
        }
        this.ambientAudio.currentTime = 0;
        this.ambientAudio.src = '';
    }
}

export const soundManager = new SoundManager();
