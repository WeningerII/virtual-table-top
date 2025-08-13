
import type { Token } from './types';

export class SpatialGrid {
    private grid: Map<string, Token[]>;
    private cellSize: number;
    private width: number;
    private height: number;

    constructor(mapWidth: number, mapHeight: number, cellSize: number = 5) {
        this.width = mapWidth;
        this.height = mapHeight;
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    private getKey(x: number, y: number): string {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        return `${gridX},${gridY}`;
    }

    public add(token: Token): void {
        const key = this.getKey(token.x, token.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key)!.push(token);
    }

    public remove(token: Token): boolean {
        const key = this.getKey(token.x, token.y);
        const cell = this.grid.get(key);
        if (cell) {
            const index = cell.findIndex(t => t.id === token.id);
            if (index > -1) {
                cell.splice(index, 1);
                if (cell.length === 0) {
                    this.grid.delete(key);
                }
                return true;
            }
        }
        return false;
    }

    public update(token: Token, oldX: number, oldY: number): void {
        const oldKey = this.getKey(oldX, oldY);
        const newKey = this.getKey(token.x, token.y);

        if (oldKey !== newKey) {
            this.remove({ ...token, x: oldX, y: oldY });
            this.add(token);
        }
    }

    public queryRadius(center: { x: number; y: number }, radius: number): Token[] {
        const results: Token[] = [];
        const checkedTokens = new Set<string>();

        const minGridX = Math.floor((center.x - radius) / this.cellSize);
        const maxGridX = Math.floor((center.x + radius) / this.cellSize);
        const minGridY = Math.floor((center.y - radius) / this.cellSize);
        const maxGridY = Math.floor((center.y + radius) / this.cellSize);

        for (let gx = minGridX; gx <= maxGridX; gx++) {
            for (let gy = minGridY; gy <= maxGridY; gy++) {
                const key = `${gx},${gy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const token of cell) {
                        if (!checkedTokens.has(token.id)) {
                             const dx = center.x - token.x;
                             const dy = center.y - token.y;
                             const distanceSquared = dx * dx + dy * dy;
                             if (distanceSquared <= radius * radius) {
                                results.push(token);
                                checkedTokens.add(token.id);
                             }
                        }
                    }
                }
            }
        }
        return results;
    }

    public clear(): void {
        this.grid.clear();
    }
}
