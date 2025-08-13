import { Chat, Type } from "@google/genai";
import { BattlefieldState, DialogueTurn, MapNpcInstance, Monster, NpcTurnResult, Token, TerrainCell, EncounterStrategy, VTTObject, StaticGameDataCache, TacticalObject, VTTMap } from './types';
import { ai, textModel, GeminiError } from '../geminiService';
import { SpatialGrid } from 'engine/spatialGrid.service';

const buildBattlefieldState = (
    activeToken: Token,
    activeNpcInstance: MapNpcInstance,
    activeMonsterData: Monster,
    allTokens: Token[],
    allNpcInstances: MapNpcInstance[],
    monsterCache: Map<string, Monster>,
    terrain: TerrainCell[][],
    allObjects: VTTObject[],
    staticDataCache: StaticGameDataCache,
    activeMap: VTTMap | null,
    spatialIndex: SpatialGrid | null
): BattlefieldState => {
    const obstacles = allTokens.filter(token => token.id !== activeToken.id && allNpcInstances.find(i => i.instanceId === token.npcInstanceId)?.currentHp > 0).map(token => ({ x: token.x, y: token.y }));

    const getEntityData = (inst: MapNpcInstance) => {
        const token = allTokens.find(t => t.npcInstanceId === inst.instanceId);
        const monster = monsterCache.get(inst.monsterId);
        return {
            id: token?.id || inst.instanceId,
            name: monster?.name || 'Unknown',
            ac: monster?.ac.value || 10,
            hpPercentage: (inst.currentHp / inst.maxHp) * 100,
            position: { x: token?.x || 0, y: token?.y || 0 },
            conditions: (inst.conditions || []).map(e => e.source),
            archetype: monster?.archetype,
            isLeader: inst.isLeader,
            squadId: inst.squadId,
        };
    };
    
    const environmentalObjects: TacticalObject[] = allObjects
        .map(obj => {
            const blueprint = staticDataCache.objectBlueprints.find(bp => bp.id === obj.blueprintId);
            if (!blueprint || !blueprint.interactable) return null;

            const gridX = Math.round(obj.position.x / 50);
            const gridY = Math.round(obj.position.y / 50);

            const tacticalObject: TacticalObject = {
                id: obj.id,
                blueprintId: obj.blueprintId,
                name: blueprint.name,
                position: { x: gridX, y: gridY },
                providesCover: blueprint.tags.includes('cover'),
                isDestructible: (obj.integrity || blueprint.integrity || 0) > 0,
                description: `A ${blueprint.name}. HP: ${obj.integrity}/${blueprint.integrity}. AC: ${blueprint.ac}`
            };

            if (blueprint.flammable !== undefined) {
                tacticalObject.isFlammable = blueprint.flammable;
            }

            if (blueprint.strengthCheckDC !== undefined) {
                tacticalObject.toppleDC = blueprint.strengthCheckDC;
            }

            return tacticalObject;
        })
        .filter((obj): obj is TacticalObject => obj !== null);

    return {
        self: {
            monsterId: activeMonsterData.name,
            instanceId: activeNpcInstance.instanceId,
            instanceName: activeToken.name,
            teamId: activeToken.teamId || '',
            currentHp: activeNpcInstance.currentHp,
            maxHp: activeNpcInstance.maxHp,
            actions: activeMonsterData.actions || [],
            position: { x: activeToken.x, y: activeToken.y },
            speed: activeMonsterData.speed.walk || 30,
            conditions: (activeNpcInstance.conditions || []).map(e => e.source),
            lastAttackerId: activeNpcInstance.lastAttackerId,
            archetype: activeMonsterData.archetype,
            strategy: activeNpcInstance.strategy,
            squadId: activeNpcInstance.squadId,
            squadTargetId: activeNpcInstance.squadTargetId,
            personalityTraits: activeMonsterData.personalityTraits,
            bonds: activeMonsterData.bonds,
            goals: activeMonsterData.goals,
        },
        allies: allNpcInstances
            .filter(inst => inst.teamId === activeNpcInstance.teamId && inst.instanceId !== activeNpcInstance.instanceId && inst.currentHp > 0)
            .map(getEntityData),
        enemies: allNpcInstances
            .filter(inst => inst.teamId !== activeNpcInstance.teamId && inst.currentHp > 0)
            .map(getEntityData),
        terrainGrid: terrain,
        obstacles,
        environmentalObjects,
        activeMap,
        spatialIndex
    };
};

const generate = async (battlefield: BattlefieldState): Promise<NpcTurnResult | null> => {
    if (!process.env.API_KEY) return null;
    try {
        const terrainViewRadius = 7;
        const { x: selfX, y: selfY } = battlefield.self.position;
        const fullTerrain = battlefield.terrainGrid as TerrainCell[][];
        const stringTerrainGrid: string[][] = [];
        for (let dy = -terrainViewRadius; dy <= terrainViewRadius; dy++) {
            const row: string[] = [];
            for (let dx = -terrainViewRadius; dx <= terrainViewRadius; dx++) {
                const gridY = selfY + dy;
                const gridX = selfX + dx;
                if (gridY >= 0 && gridY < fullTerrain.length && gridX >= 0 && gridX < fullTerrain[0].length) {
                    const cell = fullTerrain[gridY][gridX];
                    switch (cell.type) { case 'wall': row.push('W'); break; case 'water': row.push('~'); break; case 'difficult': row.push('D'); break; default: row.push('_'); }
                } else { row.push('W'); }
            }
            stringTerrainGrid.push(row);
        }
        stringTerrainGrid[terrainViewRadius][terrainViewRadius] = 'Y';
        [...battlefield.allies, ...battlefield.enemies].forEach(token => {
            const dx = token.position.x - selfX;
            const dy = token.position.y - selfY;
            if (Math.abs(dx) <= terrainViewRadius && Math.abs(dy) <= terrainViewRadius) {
                stringTerrainGrid[terrainViewRadius + dy][terrainViewRadius + dx] = 'O';
            }
        });
        
        const identityContext = (battlefield.self.personalityTraits || battlefield.self.goals || battlefield.self.bonds) ? `
**Your Identity & Persona:**
- Personality Traits: ${JSON.stringify(battlefield.self.personalityTraits || [])}
- Goals in this Fight: ${JSON.stringify(battlefield.self.goals || [])}
- Bonds (things you protect): ${JSON.stringify(battlefield.self.bonds || [])}
` : '';

        const terrainLegend = `\n- Terrain Legend:\n- "_": Standard ground\n- "D": Difficult terrain\n- "~": Water\n- "W": Impassable Wall\n- "O": Obstacle (another creature)\n- "Y": Your position\n`;
        const prompt = `You are a D&D AI combining tactical intelligence with in-character roleplaying.

${identityContext}
**Battlefield State:**
- Your Name & Type: ${battlefield.self.instanceName} (${battlefield.self.monsterId})
- Your HP: ${battlefield.self.currentHp}/${battlefield.self.maxHp}
- Your Position: { "x": ${battlefield.self.position.x}, "y": ${battlefield.self.position.y} } ('Y' in the grid)
- Your Speed: ${battlefield.self.speed} feet
- Your Available Actions:
${JSON.stringify(battlefield.self.actions, null, 2)}
- Allies Nearby: ${JSON.stringify(battlefield.allies)}
- Enemies Nearby: ${JSON.stringify(battlefield.enemies)}
- Interactable Environmental Objects: ${JSON.stringify(battlefield.environmentalObjects)}
- Local Terrain Grid (You are 'Y' at the center):\n${stringTerrainGrid.map(row => row.join(' ')).join('\n')}
${terrainLegend}

**Core Tactical Directives:**
1.  **Consider Your Identity:** Your personality and goals are paramount. Filter ALL tactical decisions through this lens. An 'arrogant' creature might make a suboptimal but proud move. A creature with a 'goal' to capture someone will prioritize that over killing.
2.  **Assess Threats:** Identify the most dangerous enemies. Prioritize targets that are low on health, have debilitating conditions, or pose the greatest threat (like healers or spellcasters).
3.  **Exploit the Environment:** The battlefield is a weapon. Your 'rationale' MUST mention environmental considerations.
    *   **Cover:** If you are a ranged attacker or vulnerable, use objects that provide cover.
    *   **Hazards:** If enemies are near hazardous objects (like an 'Explosive Barrel'), consider attacking the object instead of the enemy for area damage.
    *   **Manipulation:** If you have high Strength, consider toppling objects ('toppleDC') to block paths or crush enemies.
4.  **Use Abilities Effectively:** Don't just use your basic attack. Prioritize your most powerful and unique abilities (\`usage\`, \`areaOfEffect\`, \`savingThrow\`) when the situation is right.
5.  **Position for Advantage:** Move to a position that maximizes your strengths. Flank enemies if possible. Stay out of melee range if you are a ranged attacker.

**Your Task:**
Analyze the situation according to your directives, prioritizing your Identity. Your 'rationale' MUST explain your thinking, especially how your identity and the environment influenced your choice. Provide your complete turn decision as a single, valid JSON object matching the schema.
For attacks on creatures, simulate all necessary dice rolls. For attacks on objects, omit dice roll simulation.
`;
        const response = await ai.models.generateContent({ model: textModel, contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { rationale: { type: Type.STRING }, dialogue: { type: Type.STRING }, destination: { type: Type.OBJECT, properties: { x: { type: Type.INTEGER }, y: { type: Type.INTEGER } } }, actionId: { type: Type.STRING }, targetId: { type: Type.STRING }, attackRoll: { type: Type.INTEGER }, attackTotal: { type: Type.INTEGER }, hit: { type: Type.BOOLEAN }, damageRoll: { type: Type.STRING }, damageTotal: { type: Type.INTEGER }, narrative: { type: Type.STRING } }, required: ["rationale", "dialogue", "destination", "actionId", "attackRoll", "attackTotal", "hit", "damageRoll", "damageTotal", "narrative"] } } });
        return JSON.parse(response.text.trim()) as NpcTurnResult;
    } catch (error) {
        throw new GeminiError("Error deciding NPC action", error);
    }
};

export const generateNpcTurn = {
    buildBattlefieldState,
    generate
};

export const startConversation = async (playerName: string, npcName: string, npcDescription: string, environmentDescription: string, memory?: string[]): Promise<{ chat: Chat; initialResponse: string } | null> => {
    if (!process.env.API_KEY) return null;
    try {
        const memoryContext = memory && memory.length > 0 ? `\nYou remember the following past interactions:\n- ${memory.join('\n- ')}\nUse these memories to inform your responses.` : '';
        const systemInstruction = `You are an NPC in a fantasy tabletop game. Your name is ${npcName}. Your description: "${npcDescription}". You are currently in: "${environmentDescription}". The player character's name is ${playerName}.${memoryContext} Keep your responses concise, in-character, and engaging. Limit responses to 1-3 sentences.`;
        const chat = ai.chats.create({
            model: textModel,
            config: { systemInstruction },
        });
        const response = await chat.sendMessage({ message: "Hello there." });
        return { chat, initialResponse: response.text };
    } catch (error) {
        throw new GeminiError("Error starting conversation", error);
    }
};

export const continueConversation = async (chat: Chat, message: string): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    try {
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        throw new GeminiError("Error continuing conversation", error);
    }
};

export const summarizeConversation = async (history: DialogueTurn[]): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    try {
        const conversationText = history.map(turn => `${turn.speaker}: ${turn.text}`).join('\n');
        const prompt = `Summarize the key takeaways and emotional shift of this conversation into a one-sentence memory for the NPC. \n\n${conversationText}`;
        const response = await ai.models.generateContent({ model: textModel, contents: prompt });
        return response.text.trim();
    } catch (error) {
        throw new GeminiError("Error summarizing conversation", error);
    }
};