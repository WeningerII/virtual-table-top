import { Monster, MonsterType, Spell, Item, EquipmentPack, DndClass, Species, Background, Feat, ArtificerInfusion, FightingStyle, Maneuver, Invocation, Metamagic, CompanionBlueprint, EffectInstance, ActionCategory, Tool, StaticGameDataCache, Rune, ObjectBlueprint, AiArchetypeIndexEntry, AiArchetype } from '../types';

export interface MonsterIndexEntry {
    id: string;
    name: string;
    type: MonsterType;
    challengeRating: string;
    sourceFile: string;
    iconId?: string;
}

export interface SpellIndexEntry {
    id: string;
    name: string;
    level: number;
    school: string;
    classIds: string[];
}

export interface ItemIndexEntry {
    id: string;
    name: string;
    tags: string[];
    costInCopper: number;
    sourceFile: string;
}

export interface ClassIndexEntry {
    id: string;
    name: string;
    source: string;
    iconId: string;
}

export interface SpeciesIndexEntry {
    id: string;
    name: string;
    group: string;
    source: string;
    iconUrl: string;
}

export interface BackgroundIndexEntry {
    id: string;
    name: string;
    source: string;
}

export interface FeatIndexEntry {
    id: string;
    name: string;
    source: string;
}

class DataService {
    private cache = new Map<string, any>();

    private async _fetchAndCache<T>(key: string, path: string): Promise<T> {
        if (this.cache.has(key)) {
            return this.cache.get(key) as T;
        }
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            this.cache.set(key, data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch ${key} from ${path}:`, error);
            throw error;
        }
    }
    
    async fetchAllStaticData(): Promise<StaticGameDataCache> {
        const [
            allFeats, allFightingStyles, allManeuvers, allInvocations, allMetamagic, allInfusions,
            allCompanions, allConditions, allTools, allRunes, allSpells, equipmentPacks,
            allClasses, allSpecies, allBackgrounds, allItems, allMonsters,
            multiclassingData, spellcastingTables, objectBlueprints, terrainTypes, allAiArchetypes,
            actionsAndConditions
        ] = await Promise.all([
            this.getAllFeats(), this.getAllFightingStyles(), this.getAllManeuvers(),
            this.getAllInvocations(), this.getAllMetamagic(), this.getAllInfusions(),
            this.getAllCompanions(), this.getAllConditions(), this.getAllTools(), this.getAllRunes(),
            this.getAllSpells(), this.getEquipmentPacks(),
            this.getAllClasses(), this.getAllSpecies(), this.getAllBackgrounds(), this.getAllItems(), this.getAllMonsters(),
            this.getMulticlassingData(), this.getMulticlassSpellcastingTable(),
            this.getObjectBlueprints(), this.getTerrainTypes(), this.getAllAiArchetypes(),
            this.getActionsAndConditions()
        ]);

        return {
            allFeats, allFightingStyles, allManeuvers, allInvocations, allMetamagic, allInfusions,
            allCompanions, allConditions, allTools, allRunes, allSpells, equipmentPacks,
            allClasses, allSpecies, allBackgrounds, allItems, allMonsters,
            multiclassingData, spellcastingTables, objectBlueprints, terrainTypes, allAiArchetypes,
            actionsAndConditions
        };
    }


    // Index fetching methods
    getMonsterIndex = () => this._fetchAndCache<MonsterIndexEntry[]>('monsterIndex', '/data/monsters/index.json');
    getSpellIndex = () => this._fetchAndCache<SpellIndexEntry[]>('spellIndex', '/data/spells/index.json');
    getItemIndex = () => this._fetchAndCache<ItemIndexEntry[]>('itemIndex', '/data/items/index.json');
    getClassIndex = () => this._fetchAndCache<ClassIndexEntry[]>('classIndex', '/data/classes/index.json');
    getSpeciesIndex = () => this._fetchAndCache<SpeciesIndexEntry[]>('speciesIndex', '/data/species/index.json');
    getBackgroundIndex = () => this._fetchAndCache<BackgroundIndexEntry[]>('backgroundIndex', '/data/backgrounds/index.json');
    getFeatIndex = () => this._fetchAndCache<FeatIndexEntry[]>('featIndex', '/data/feats/index.json');
    getObjectBlueprints = () => this._fetchAndCache<ObjectBlueprint[]>('objectBlueprints', '/data/assets/objects.json');
    getTerrainTypes = () => this._fetchAndCache<string[]>('terrainTypes', '/data/assets/terrain.json');
    getAiArchetypeIndex = () => this._fetchAndCache<AiArchetypeIndexEntry[]>('aiArchetypeIndex', '/data/ai/archetypes/index.json');
    getAiArchetypeById = (id: string) => this._fetchAndCache<AiArchetype>(`aiArchetype-${id}`, `/data/ai/archetypes/${id}.json`);

    // "Get All" methods for pre-caching
    getAllSpells = async (): Promise<Spell[]> => {
        if (this.cache.has('allSpells')) return this.cache.get('allSpells');
        const spellFiles = ['cantrips.json', 'level1.json', 'level2.json', 'level3.json', 'level4.json', 'level5.json', 'level6.json', 'level7.json', 'level8.json', 'level9.json'];
        const allSpellArrays = await Promise.all(spellFiles.map(file => this._fetchAndCache<Spell[]>(`spells-${file}`, `/data/spells/${file}`)));
        const allSpells = allSpellArrays.flat();
        this.cache.set('allSpells', allSpells);
        return allSpells;
    };
    getAllItems = () => this._fetchAndCache<ItemIndexEntry[]>('itemIndex', '/data/items/index.json').then(index => this.getItemsFromIndex(index));
    getAllFeats = () => this._fetchAndCache<FeatIndexEntry[]>('featIndex', '/data/feats/index.json').then(index => this.getFeatsFromIndex(index));
    getAllFightingStyles = () => this._fetchAndCache<FightingStyle[]>('allFightingStyles', '/data/fighting-styles.json');
    getAllManeuvers = () => this._fetchAndCache<Maneuver[]>('allManeuvers', '/data/maneuvers.json');
    getAllInvocations = () => this._fetchAndCache<Invocation[]>('allInvocations', '/data/invocations.json');
    getAllMetamagic = () => this._fetchAndCache<Metamagic[]>('allMetamagic', '/data/metamagic.json');
    getAllInfusions = () => this._fetchAndCache<ArtificerInfusion[]>('allInfusions', '/data/infusions.json');
    getAllTools = () => this._fetchAndCache<Tool[]>('allTools', '/data/tools.json');
    getAllCompanions = () => this._fetchAndCache<{ [key: string]: CompanionBlueprint }>('allCompanions', '/data/companions.json');
    getAllConditions = () => this._fetchAndCache<Omit<EffectInstance, 'id'>[]>('allConditions', '/data/conditions.json');
    getAllRunes = () => this._fetchAndCache<Rune[]>('allRunes', '/data/runes.json');
    getAllClasses = async (): Promise<DndClass[]> => {
        if (this.cache.has('allClasses')) return this.cache.get('allClasses');
        const index = await this.getClassIndex();
        const classes = await this.getClassesFromIndex(index);
        this.cache.set('allClasses', classes);
        return classes;
    }
    getAllSpecies = async (): Promise<Species[]> => {
        if (this.cache.has('allSpecies')) return this.cache.get('allSpecies');
        const index = await this.getSpeciesIndex();
        const species = await this.getSpeciesFromIndex(index);
        this.cache.set('allSpecies', species);
        return species;
    }
    getAllBackgrounds = async (): Promise<Background[]> => {
        if (this.cache.has('allBackgrounds')) return this.cache.get('allBackgrounds');
        const index = await this.getBackgroundIndex();
        const backgrounds = await this.getBackgroundsFromIndex(index);
        this.cache.set('allBackgrounds', backgrounds);
        return backgrounds;
    }
    getAllMonsters = async (): Promise<Monster[]> => {
        if (this.cache.has('allMonsters')) return this.cache.get('allMonsters');
        const index = await this.getMonsterIndex();
        const monsters = await this.getMonstersFromIndex(index);
        this.cache.set('allMonsters', monsters);
        return monsters;
    }
    getAllAiArchetypes = async (): Promise<AiArchetype[]> => {
        if (this.cache.has('allAiArchetypes')) return this.cache.get('allAiArchetypes');
        const index = await this.getAiArchetypeIndex();
        const archetypes = await Promise.all(index.map(entry => this.getAiArchetypeById(entry.id)));
        const filtered = archetypes.filter((a): a is AiArchetype => a !== null);
        this.cache.set('allAiArchetypes', filtered);
        return filtered;
    }

    // "Get By ID" methods (utilize cache)
    async getMonsterById(id: string): Promise<Monster | null> {
        if (this.cache.has(`monster-${id}`)) return this.cache.get(`monster-${id}`);
        const index = await this.getMonsterIndex();
        const monsterEntry = index.find(m => m.id === id);
        if (!monsterEntry) return null;
        const path = `/data/monsters/${monsterEntry.sourceFile}`;
        const monsterList = await this._fetchAndCache<Monster[]>(monsterEntry.sourceFile, path);
        const monster = monsterList.find(m => m.id === id);
        if (monster) this.cache.set(`monster-${id}`, monster);
        return monster || null;
    }
    
    getEquipmentPacks = () => this._fetchAndCache<EquipmentPack[]>('packs', '/data/items/packs.json');
    getClassById = (id: string) => this._fetchAndCache<DndClass>(`class-${id}`, `/data/classes/${id}.json`);
    getSpeciesById = (id: string) => this._fetchAndCache<Species>(`species-${id}`, `/data/species/${id}.json`);
    getBackgroundById = (id: string) => this._fetchAndCache<Background>(`background-${id}`, `/data/backgrounds/${id}.json`);
    getFeatById = (id: string) => this._fetchAndCache<Feat>(`feat-${id}`, `/data/feats/${id}.json`);
    
    async getItemById(id: string): Promise<Item | null> {
        if (this.cache.has(`item-${id}`)) return this.cache.get(`item-${id}`);
        const index = await this.getItemIndex();
        const entry = index.find(item => item.id === id);
        if (!entry) return null;
        const fileData = await this._fetchAndCache<Item[]>(entry.sourceFile, `/data/items/${entry.sourceFile}`);
        const item = fileData.find(i => i.id === id);
        if (item) this.cache.set(`item-${id}`, item);
        return item || null;
    }

    async getItemsByIds(ids: string[]): Promise<Item[]> {
        const items = await Promise.all(ids.map(id => this.getItemById(id)));
        return items.filter((item): item is Item => item !== null);
    }

    private async getItemsFromIndex(index: ItemIndexEntry[]): Promise<Item[]> {
        const fileNames = [...new Set(index.map(i => i.sourceFile))];
        const allItemArrays = await Promise.all(fileNames.map(file => this._fetchAndCache<Item[]>(file, `/data/items/${file}`)));
        return allItemArrays.flat();
    }
    
    private async getFeatsFromIndex(index: FeatIndexEntry[]): Promise<Feat[]> {
        const feats = await Promise.all(index.map(entry => this.getFeatById(entry.id)));
        return feats.filter((f): f is Feat => f !== null);
    }

    private async getClassesFromIndex(index: ClassIndexEntry[]): Promise<DndClass[]> {
        const classPromises = index.map(async (entry) => {
            const classData = await this.getClassById(entry.id);
            if (classData) {
                // The returned object is assignable to DndClass, but casting helps TypeScript's inference.
                return { ...classData, iconId: entry.iconId } as DndClass;
            }
            return null;
        });
        const classes = await Promise.all(classPromises);
        return classes.filter((c): c is DndClass => c !== null);
    }

    private async getSpeciesFromIndex(index: SpeciesIndexEntry[]): Promise<Species[]> {
        const speciesList = await Promise.all(index.map(entry => this.getSpeciesById(entry.id)));
        return speciesList.filter((s): s is Species => s !== null);
    }

    private async getBackgroundsFromIndex(index: BackgroundIndexEntry[]): Promise<Background[]> {
        const backgrounds = await Promise.all(index.map(entry => this.getBackgroundById(entry.id)));
        return backgrounds.filter((b): b is Background => b !== null);
    }
    
    private async getMonstersFromIndex(index: MonsterIndexEntry[]): Promise<Monster[]> {
        const fileNames = [...new Set(index.map(i => i.sourceFile))];
        const allMonsterArrays = await Promise.all(fileNames.map(file => this._fetchAndCache<Monster[]>(file, `/data/monsters/${file}`)));
        return allMonsterArrays.flat();
    }
    
    getMulticlassingData = () => this._fetchAndCache<any>('multiclassingData', '/data/multiclassing.json');
    getMulticlassSpellcastingTable = () => this._fetchAndCache<any>('spellcastingTables', '/data/spellcasting-tables.json');
    getActionsAndConditions = () => this._fetchAndCache<any>('actions-and-conditions', '/data/actions-and-conditions.json');
}

export const dataService = new DataService();
