import { GameCommand, CommandResult, ValidationResult, CommandContext } from './types';
import { SimulationState, DealDamageEvent, GameEvent, MapNpcInstance, Character } from './types';
import { DamageCalculator } from '../rules/damage.calculator';
import { produce } from 'immer';

export class DealDamageCommand implements GameCommand {
    constructor(private event: DealDamageEvent) {}

    canExecute(state: SimulationState, context: CommandContext): ValidationResult {
        const targetToken = state.activeMap?.tokens.find(t => t.id === this.event.targetId);
        if (!targetToken) {
            return { valid: false, reason: 'Target token not found.' };
        }
        if (targetToken.npcInstanceId) {
            const targetNpc = state.mapNpcInstances.find(i => i.instanceId === targetToken.npcInstanceId);
            if (!targetNpc) {
                 return { valid: false, reason: 'Target NPC instance not found.' };
            }
            if (targetNpc.currentHp <= 0) {
                return { valid: false, reason: 'Target is already at 0 HP.' };
            }
        }
        // In a full implementation, we would check for player HP here as well.
        return { valid: true };
    }

    execute(state: SimulationState, context: CommandContext): CommandResult {
        const validation = this.canExecute(state, context);
        if (!validation.valid) {
            return { success: false, newState: state, events: [], visualEffects: [], audioEvents: [], errors: [{ type: 'validation', message: validation.reason }] };
        }

        const targetToken = state.activeMap!.tokens.find(t => t.id === this.event.targetId)!;
        const isPlayerTarget = !!targetToken.characterId;

        const targetNpc = state.mapNpcInstances.find(i => i.instanceId === targetToken.npcInstanceId);
        const targetMonsterData = context.staticData.allMonsters.find(m => m.id === targetNpc?.monsterId);

        // For now, we only fully support damage to NPCs as player state is managed in Redux slices
        if (isPlayerTarget) {
            // In a full implementation, this would dispatch an event to a player-specific reducer/system
            return { success: true, newState: state, events: [], visualEffects: [], audioEvents: [], errors: [] };
        }

        if (!targetNpc || !targetMonsterData) {
            return { success: false, newState: state, events: [], visualEffects: [], audioEvents: [], errors: [{ type: 'execution', message: 'Target NPC or Monster data not found.' }] };
        }

        const damageCalculator = new DamageCalculator(context.staticData);
        const damageResult = damageCalculator.calculateDamage(
            this.event.damageParts,
            this.event.isCrit,
            targetMonsterData
        );

        const newEvents: GameEvent[] = [];
        const newState = produce(state, draft => {
            const npc = draft.mapNpcInstances.find(i => i.instanceId === targetToken.npcInstanceId)!;
            const originalHp = npc.currentHp;
            npc.currentHp = Math.max(0, npc.currentHp - damageResult.finalDamage);
            npc.lastAttackerId = this.event.sourceId;

            draft.lastDamageInfo = {
                targetId: this.event.targetId,
                amount: damageResult.finalDamage,
                damageType: damageResult.primaryType,
                isCrit: this.event.isCrit,
            };

            const logMessage = `${targetToken.name} takes ${damageResult.finalDamage} ${damageResult.primaryType} damage.`;
            newEvents.push({ type: 'LOG_EVENT', sourceId: 'adjudicator', message: logMessage } as GameEvent);
            
            if (npc.currentHp <= 0 && originalHp > 0) {
                 const deathMessage = `${targetToken.name} has been defeated!`;
                 newEvents.push({ type: 'LOG_EVENT', sourceId: 'adjudicator', message: deathMessage } as GameEvent);
            }
        });
        
        return {
            success: true,
            newState,
            events: newEvents,
            visualEffects: [],
            audioEvents: [],
            errors: []
        };
    }
}