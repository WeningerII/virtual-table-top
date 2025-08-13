
import { TerrainCell } from './types';

interface Node {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic cost to end
    f: number; // g + h
    parent: Node | null;
}

const getHeuristic = (a: {x: number, y: number}, b: {x: number, y: number}): number => {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

export const findPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    grid: TerrainCell[][],
    obstacles: { x: number; y: number }[]
): { x: number; y: number }[] | null => {
    const width = grid[0].length;
    const height = grid.length;

    const openList: Node[] = [];
    const closedList: boolean[][] = Array(height).fill(0).map(() => Array(width).fill(false));
    const obstacleSet = new Set(obstacles.map(o => `${o.x},${o.y}`));
    
    const startNode: Node = { x: startX, y: startY, g: 0, h: getHeuristic({ x: startX, y: startY }, { x: endX, y: endY }), f: 0, parent: null };
    startNode.f = startNode.h;
    openList.push(startNode);

    while (openList.length > 0) {
        // Find the node with the lowest f score
        let lowestIndex = 0;
        for (let i = 1; i < openList.length; i++) {
            if (openList[i].f < openList[lowestIndex].f) {
                lowestIndex = i;
            }
        }
        const currentNode = openList[lowestIndex];

        // End case -- result has been found, return the traced path
        if (currentNode.x === endX && currentNode.y === endY) {
            const path: { x: number; y: number }[] = [];
            let curr: Node | null = currentNode;
            while (curr) {
                path.push({ x: curr.x, y: curr.y });
                curr = curr.parent;
            }
            return path.reverse();
        }

        // Normal case -- move currentNode from open to closed, process each of its neighbors
        openList.splice(lowestIndex, 1);
        closedList[currentNode.y][currentNode.x] = true;

        const neighbors: { x: number, y: number }[] = [];
        const { x, y } = currentNode;

        // Check cardinal directions
        if (x - 1 >= 0) neighbors.push({ x: x - 1, y: y });
        if (x + 1 < width) neighbors.push({ x: x + 1, y: y });
        if (y - 1 >= 0) neighbors.push({ x: x, y: y - 1 });
        if (y + 1 < height) neighbors.push({ x: x, y: y + 1 });

        for (const neighborPos of neighbors) {
            if (neighborPos.y < 0 || neighborPos.y >= height || neighborPos.x < 0 || neighborPos.x >= width) continue;
            
            const terrain = grid[neighborPos.y][neighborPos.x];
            if (terrain.type === 'wall' || closedList[neighborPos.y][neighborPos.x] || obstacleSet.has(`${neighborPos.x},${neighborPos.y}`)) {
                continue;
            }
            
            let moveCost = 1;
            if (terrain.type === 'difficult' || terrain.type === 'water') {
                moveCost = 2;
            }

            const gScore = currentNode.g + moveCost;
            
            const existingNeighbor = openList.find(n => n.x === neighborPos.x && n.y === neighborPos.y);

            if (!existingNeighbor) {
                const hScore = getHeuristic(neighborPos, { x: endX, y: endY });
                const neighborNode: Node = { ...neighborPos, g: gScore, h: hScore, f: gScore + hScore, parent: currentNode };
                openList.push(neighborNode);
            } else if (gScore < existingNeighbor.g) {
                existingNeighbor.g = gScore;
                existingNeighbor.f = gScore + existingNeighbor.h;
                existingNeighbor.parent = currentNode;
            }
        }
    }

    // No path found
    return null;
};
