import { GameCommand, CommandResult, ValidationResult, CommandContext } from './types';
import { SimulationState, DeclareAttackEvent, GameEvent, DealDamageEvent, Monster, Character } from './types';
import { rollD20 } from '../../utils/dice';
import { selectCalculatedActiveCharacterSheet } from './state/selectors';
import { toCharacterState } from '../../state/characterUtils';
import { selectCharacter } from '..';

export class AttackCommand implements GameCommand {
    constructor(private event: DeclareAttackEvent) {}

    canExecute(state: SimulationState, context: CommandContext): ValidationResult {
        const attackerToken = state.activeMap?.tokens.find(t => t.id === this.event.sourceId);
        const targetToken = state.activeMap?.tokens.find(t => t.id === this.event.targetId);

        if (!attackerToken || !targetToken) {
            return { valid: false, reason: 'Attacker or target not found on map.' };
        }

        // Add more validation logic here (e.g., range checks, visibility)
        return { valid: true };
    }

    execute(state: SimulationState, context: CommandContext): CommandResult {
        const validation = this.canExecute(state, context);
        if (!validation.valid) {
            return { success: false, newState: state, events: [], visualEffects: [], audioEvents: [], errors: [{ type: 'validation', message: validation.reason }] };
        }
        
        const { staticData } = context;
        const newEvents: GameEvent[] = [];
        
        const attackerToken = state.activeMap!.tokens.find(t => t.id === this.event.sourceId)!;
        const targetToken = state.activeMap!.tokens.find(t => t.id === this.event.targetId)!;

        let targetAC = 10;
        let targetName = targetToken.name;
        
        if (targetToken.characterId) {
             // This is a simplification. A real implementation would need to access the full character sheet.
             // For now, we'll assume a default AC for players for simulation purposes.
             targetAC = 15;
        } else if (targetToken.npcInstanceId) {
            const npc = state.mapNpcInstances.find(i => i.instanceId === targetToken.npcInstanceId);
            const monsterData = staticData.allMonsters.find(m => m.id === npc?.monsterId);
            if(monsterData) targetAC = monsterData.ac.value;
        }

        const attackRoll = rollD20();
        const isCrit = attackRoll === 20;
        const isCritFail = attackRoll === 1;
        const attackTotal = attackRoll + (this.event.action.attackBonus || 0);
        const hit = isCrit || (!isCritFail && attackTotal >= targetAC);

        const logMessage = `${attackerToken.name} attacks ${targetName} with ${this.event.action.name}... and ${hit ? `HITS (Total: ${attackTotal})` : `MISSES (Total: ${attackTotal})`}!`;
        newEvents.push({ type: 'LOG_EVENT', sourceId: this.event.sourceId, message: logMessage } as GameEvent);

        if (hit) {
            const damageEvent: DealDamageEvent = {
                type: 'DEAL_DAMAGE',
                sourceId: this.event.sourceId,
                targetId: this.event.targetId,
                damageParts: this.event.action.damageParts || [],
                isCrit: isCrit,
            };
            newEvents.push(damageEvent);
        }

        return {
            success: true,
            newState: state, // This command doesn't change state directly
            events: newEvents,
            visualEffects: [],
            audioEvents: [],
            errors: []
        };
    }
}