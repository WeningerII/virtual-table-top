import { describe, it, expect, vi } from 'vitest';
import { EventProcessor } from '../event.processor';
import { CommandFactory } from '../commands/command.factory';
import { SimulationState, StaticGameDataCache, DeclareAttackEvent, GameEvent, Token, MapNpcInstance } from './types';

// Mock utilities
vi.mock('../../utils/dice', () => ({
  rollD20: () => 15, // Always roll 15 for predictable attack outcomes
  rollDice: (dice: string) => {
      const parts = dice.match(/(\d+)d(\d+)/);
      if (parts) return { total: parseInt(parts[1], 10) * 1 }; // Always roll 1 on damage dice
      return { total: 0 };
  }
}));

const mockStaticData: StaticGameDataCache = {
    allMonsters: [
        { id: 'goblin', name: 'Goblin', ac: { value: 15 }, hp: { average: 7, formula: '2d6' } }
    ]
} as any;

describe('EventProcessor Integration Test', () => {
    it('should process an attack event into damage and state change', () => {
        const attackerToken: Token = { id: 'player-token', name: 'Player', x: 0, y: 0, size: 1, color: 'blue', teamId: 'players', characterId: 'player-char' };
        const targetToken: Token = { id: 'goblin-token-1', name: 'Goblin', x: 1, y: 0, size: 1, color: 'red', teamId: 'enemies', npcInstanceId: 'goblin-instance-1' };
        
        const initialNpcState: MapNpcInstance = { instanceId: 'goblin-instance-1', monsterId: 'goblin', currentHp: 7, maxHp: 7 };

        const initialState: SimulationState = {
            activeMap: {
                tokens: [attackerToken, targetToken],
            } as any,
            mapNpcInstances: [initialNpcState],
        } as any;

        const attackEvent: DeclareAttackEvent = {
            type: 'DECLARE_ATTACK',
            sourceId: 'player-token',
            targetId: 'goblin-token-1',
            action: { name: 'Shortsword', attackBonus: 5, damageParts: [{ dice: '1d6', bonus: 3, type: 'piercing' }] },
        };

        const commandFactory = new CommandFactory();
        const processor = new EventProcessor(commandFactory, mockStaticData);

        const result = processor.processEvents([attackEvent], initialState);

        // 1. Check the final state
        const finalNpc = result.finalState.mapNpcInstances.find(npc => npc.instanceId === 'goblin-instance-1');
        expect(finalNpc).toBeDefined();
        // Damage = 1 (from mocked rollDice) + 3 (bonus) = 4. HP = 7 - 4 = 3.
        expect(finalNpc?.currentHp).toBe(3);

        // 2. Check the generated events
        const generatedEvents = result.allEvents;
        expect(generatedEvents.some(e => e.type === 'DEAL_DAMAGE')).toBe(true);
        expect(generatedEvents.some(e => e.type === 'LOG_EVENT' && (e as any).message.includes('HITS'))).toBe(true);
    });
});
