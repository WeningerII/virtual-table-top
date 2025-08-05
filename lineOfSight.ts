
import { TerrainCell } from '../../../types';

/**
 * Checks for line of sight between two points on a grid using Bresenham's line algorithm.
 * @param start - The starting point {x, y}.
 * @param end - The ending point {x, y}.
 * @param grid - The 2D array representing the terrain.
 * @param obstacles - An array of coordinates for blocking creatures/objects.
 * @returns True if there is a clear line of sight, false otherwise.
 */
export const hasLineOfSight = (
    start: { x: number, y: number },
    end: { x: number, y: number },
    grid: TerrainCell[][],
    obstacles: { x: number, y: number }[]
): boolean => {
    const obstacleSet = new Set(obstacles.map(o => `${o.x},${o.y}`));

    let x0 = Math.floor(start.x);
    let y0 = Math.floor(start.y);
    const x1 = Math.floor(end.x);
    const y1 = Math.floor(end.y);

    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    while (true) {
        // Check the current cell, but ignore the start and end points themselves.
        if (!(x0 === start.x && y0 === start.y) && !(x0 === x1 && y0 === y1)) {
            if (
                grid[y0]?.[x0]?.type === 'wall' ||
                obstacleSet.has(`${x0},${y0}`)
            ) {
                return false; // Blocked
            }
        }

        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x0 += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y0 += sy;
        }
    }

    return true; // No obstructions found
};
