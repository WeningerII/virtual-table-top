
import { VTTMap, Token, VTTObject, Character, EncounterConcept, Zone, Path, TerrainCell, MapNpcInstance, StaticGameDataCache, Monster } from './types';
const mapDecorator = { decorate: (c: any) => c } as any;

class SpatialGrid {
    private width: number;
    private height: number;
    private cells: Map<string, Set<string>>; // key: "x,y", value: set of token ids
    private tokenPositions: Map<string, { x: number; y: number }>;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.cells = new Map();
        this.tokenPositions = new Map();
    }

    private key(x: number, y: number): string {
        const cx = Math.max(0, Math.min(this.width - 1, Math.floor(x)));
        const cy = Math.max(0, Math.min(this.height - 1, Math.floor(y)));
        return `${cx},${cy}`;
    }

    add(token: any) {
        const pos = { x: token.x, y: token.y };
        this.tokenPositions.set(token.id, pos);
        const k = this.key(pos.x, pos.y);
        if (!this.cells.has(k)) this.cells.set(k, new Set());
        this.cells.get(k)!.add(token.id);
    }

    update(token: any, oldX: number, oldY: number) {
        const oldKey = this.key(oldX, oldY);
        const set = this.cells.get(oldKey);
        if (set) set.delete(token.id);
        this.add(token);
    }

    remove(token: any) {
        const pos = this.tokenPositions.get(token.id);
        if (pos) {
            const k = this.key(pos.x, pos.y);
            const set = this.cells.get(k);
            if (set) set.delete(token.id);
        }
        this.tokenPositions.delete(token.id);
    }
}

const sizeToGridUnits = (size: string): number => {
    switch (size.toLowerCase()) {
        case 'tiny': return 0.5;
        case 'small': return 0.8;
        case 'medium': return 1;
        case 'large': return 2;
        case 'huge': return 3;
        case 'gargantuan': return 4;
        default: return 1;
    }
};

const generateTerrain = (zones: Zone[], paths: Path[] | undefined, width: number, height: number): TerrainCell[][] => {
    const terrain: TerrainCell[][] = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => ({ type: 'grass', elevation: 0 }))
    );

    // A simple point-in-polygon test
    const isInside = (point: {x: number, y: number}, vs: {x: number, y: number}[]) => {
        const x = point.x, y = point.y;
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i].x, yi = vs[i].y;
            const xj = vs[j].x, yj = vs[j].y;
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    // Apply zones first
    zones.forEach(zone => {
        // Find bounding box for efficiency
        const minX = Math.min(...zone.polygon.map(p => p.x));
        const maxX = Math.max(...zone.polygon.map(p => p.x));
        const minY = Math.min(...zone.polygon.map(p => p.y));
        const maxY = Math.max(...zone.polygon.map(p => p.y));

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (isInside({x, y}, zone.polygon)) {
                    if (zone.tags.includes('difficult_terrain')) terrain[y][x].type = 'difficult';
                    else if (zone.tags.includes('water')) terrain[y][x].type = 'water';
                    else if (zone.tags.includes('rocky')) terrain[y][x].type = 'stone';
                    else if (zone.tags.includes('forest')) terrain[y][x].type = 'dirt';
                }
            }
        }
    });
    
    // Apply paths on top
    paths?.forEach(path => {
         // This is a very simplified line-drawing algorithm
        for(let i = 0; i < path.points.length - 1; i++) {
            const p1 = path.points[i];
            const p2 = path.points[i+1];
            const dx = Math.abs(p2.x - p1.x);
            const dy = Math.abs(p2.y - p1.y);
            const sx = (p1.x < p2.x) ? 1 : -1;
            const sy = (p1.y < p2.y) ? 1 : -1;
            let err = dx - dy;
            let x = p1.x;
            let y = p1.y;

            while(true) {
                for (let wy = -path.width; wy <= path.width; wy++) {
                    for (let wx = -path.width; wx <= path.width; wx++) {
                        if (x+wx >= 0 && x+wx < width && y+wy >= 0 && y+wy < height) {
                             if(Math.sqrt(wx*wx + wy*wy) <= path.width) {
                                 terrain[y+wy][x+wx].type = path.type as TerrainCell['type'];
                             }
                        }
                    }
                }

                if ((x === p2.x) && (y === p2.y)) break;
                const e2 = 2*err;
                if (e2 > -dy) { err -= dy; x += sx; }
                if (e2 < dx) { err += dx; y += sy; }
            }
        }
    });


    return terrain;
};

export const generateMapFromConcept = (concept: any, characters: any[] = [], staticDataCache?: any): { map: VTTMap, npcInstances: MapNpcInstance[] } => {
    const decoratedConcept = mapDecorator.decorate(concept);
    const mapWidth = 30, mapHeight = 30, cellSize = 50;
    
    const terrain = generateTerrain(decoratedConcept.zones, decoratedConcept.paths, mapWidth, mapHeight);
    
    // Player tokens
    const playerTokens: Token[] = characters.map((char, index) => {
        const { x, y, width, height } = decoratedConcept.playerStartZone;
        const tokenX = x + Math.floor(Math.random() * width);
        const tokenY = y + Math.floor(Math.random() * height);
        return {
            id: `token-${(char as any).id || crypto.randomUUID()}`, characterId: (char as any).id, name: (char as any).name || 'Player',
            x: tokenX, y: tokenY, size: 1,
            color: '#2dd4bf',
            imageUrl: (char as any).characterPortraitUrl, teamId: 'players',
        } as any
    });

    const npcInstances: MapNpcInstance[] = [] as any;
    const monsterTokens: Token[] = decoratedConcept.monsters
    .filter((monsterInstance: any) => monsterInstance.position)
    .map((monsterInstance: any) => {
        const monsterData = (staticDataCache as any).allMonsters?.find((m: any) => m.id === monsterInstance.monsterId);
        if (!monsterData) return null;

        const instanceId = crypto.randomUUID();
        npcInstances.push({
            instanceId, monsterId: monsterData.id, maxHp: (monsterData as any).hp?.average || 10,
            currentHp: (monsterData as any).hp?.average || 10, teamId: `team-${monsterData.id}`, conditions: [],
        } as any);
        return {
            id: `token-${instanceId}`, npcInstanceId: instanceId,
            name: monsterInstance.name || monsterData.name,
            x: Math.max(0, Math.min(mapWidth - 1, monsterInstance.position.x)),
            y: Math.max(0, Math.min(mapHeight - 1, monsterInstance.position.y)),
            size: sizeToGridUnits((monsterData as any).size || 'medium'),
            color: '#a83232',
            imageUrl: `https://picsum.photos/seed/${monsterData.id}/64/64`,
            teamId: `team-${monsterData.id}`,
        } as any;
    }).filter(Boolean) as any;

    const mapObjects: VTTObject[] = decoratedConcept.mapObjects
    .filter((obj: any) => obj.position)
    .map((obj: any) => {
        const scale = 50 * obj.scaleModifier;
        const terrainCell = terrain[obj.position.y]?.[obj.position.x] || { elevation: 0 };
        const baseHeight = (terrainCell as any).elevation || 0;

        return {
            id: crypto.randomUUID(),
            blueprintId: obj.blueprintId,
            position: { x: obj.position.x * cellSize, y: obj.position.y * cellSize, z: baseHeight },
            rotation: { x: 0, y: obj.rotationY, z: 0 },
            scale: { x: scale, y: scale, z: scale },
            color: '#808080',
        } as any;
    });

    const map: VTTMap = {
        id: `generated-${crypto.randomUUID()}`,
        name: decoratedConcept.theme,
        grid: { width: mapWidth, height: mapHeight, cellSize },
        terrain,
        features: decoratedConcept.zones,
        objects: mapObjects,
        tokens: [...playerTokens, ...monsterTokens],
        initiativeOrder: [],
        activeInitiativeIndex: null,
    } as any;

    return { map, npcInstances };
};


export const createDefaultMap = (characters: Character[]): VTTMap => {
  const tokens: Token[] = characters.map((char, index) => ({
    id: `token-${(char as any).id || crypto.randomUUID()}`,
    characterId: (char as any).id,
    name: (char as any).name || 'Player',
    x: 5 + (index * 2),
    y: 25,
    size: 1,
    color: '#2dd4bf',
    imageUrl: (char as any).characterPortraitUrl,
    teamId: 'players',
  } as any));

  const width = 30;
  const height = 30;

  return {
    id: `map-${crypto.randomUUID()}`,
    name: 'New Session Map',
    grid: {
        width,
        height,
        cellSize: 50,
    },
    terrain: Array(height).fill(0).map(() => Array(width).fill({ type: 'grass', elevation: 0 })),
    features: [],
    objects: [],
    tokens: tokens as any,
    initiativeOrder: [],
    activeInitiativeIndex: null,
  } as any;
};

export const buildSpatialIndex = (map: VTTMap | null): SpatialGrid | null => {
    if (!map) return null;
    const grid = new SpatialGrid(map.grid.width, map.grid.height);
    (map.tokens as any).forEach((token: any) => grid.add(token));
    return grid;
};

export { SpatialGrid };
