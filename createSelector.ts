// A lightweight, reselect-inspired memoization utility.

type AnyFunction = (...args: any[]) => any;
type Selector<S, R, P = any> = (state: S, props?: P) => R;
type EqualityFn = (a: any, b: any) => boolean;

const defaultEqualityCheck: EqualityFn = (a, b) => a === b;

function areArgumentsShallowlyEqual(equalityCheck: EqualityFn, lastArgs: any[] | null, nextArgs: any[]): boolean {
    if (lastArgs === null || lastArgs.length !== nextArgs.length) {
        return false;
    }
    for (let i = 0; i < lastArgs.length; i++) {
        if (!equalityCheck(lastArgs[i], nextArgs[i])) {
            return false;
        }
    }
    return true;
}

export function createSelector<S, P, T extends Selector<S, any, P>[], R>(
    selectors: [...T],
    combiner: (...args: { [K in keyof T]: T[K] extends Selector<S, infer U, P> ? U : never }) => R,
    options?: { memoizeOptions?: { equalityCheck?: EqualityFn } }
): Selector<S, R, P> {
    let lastArgs: any[] | null = null;
    let lastResult: R | null = null;
    const equalityCheck = options?.memoizeOptions?.equalityCheck || defaultEqualityCheck;

    return (state: S, props?: P): R => {
        const newArgs = selectors.map(selector => selector(state, props));
        
        if (lastArgs && areArgumentsShallowlyEqual(equalityCheck, lastArgs, newArgs)) {
            return lastResult!;
        }

        lastArgs = newArgs;
        // @ts-ignore
        lastResult = combiner(...newArgs);
        return lastResult;
    };
}