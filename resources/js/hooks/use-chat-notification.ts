import { useCallback, useEffect, useRef } from 'react';

const SOUND_URL = '/resources/bell.mp3';

/**
 * Plays the chat notification sound from `public/resources/bell.mp3`.
 *
 * Browsers block autoplay until the user has interacted with the page once,
 * so the very first `play()` call after navigation may no-op. Once any user
 * gesture has happened (a click on the chat button, scrolling, etc.) the
 * subsequent calls will succeed.
 */
export function useChatNotification() {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(SOUND_URL);
        audio.preload = 'auto';
        audioRef.current = audio;
        return () => {
            audio.pause();
            audio.src = '';
            audioRef.current = null;
        };
    }, []);

    const play = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        // Reset to the start so a fast succession of notifications all sound.
        audio.currentTime = 0;
        const promise = audio.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(() => {
                // Autoplay rejected — silent fail until the user interacts.
            });
        }
    }, []);

    return play;
}