import { useRef, useEffect } from 'react';

/**
 * A custom hook that returns the previous value of a variable.
 * This is useful for comparing props or state between renders.
 * @param value The value to track.
 * @returns The value from the previous render.
 */
export const usePrevious = <T>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);

    useEffect(() => {
        ref.current = value;
    });

    return ref.current;
};
