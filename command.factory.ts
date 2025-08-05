import { GameEvent, SimulationState, StaticGameDataCache, DeclareAttackEvent, DealDamageEvent } from '../../types';
import { GameCommand } from './types';
import { AttackCommand } from './attack.command';
import { DealDamageCommand } from './dealDamage.command';

export class CommandFactory {
    createCommandsFromEvent(
        event: GameEvent,
        state: SimulationState,
        staticData: StaticGameDataCache
    ): GameCommand[] {
        switch (event.type) {
            case 'DECLARE_ATTACK':
                return [new AttackCommand(event as DeclareAttackEvent)];
            case 'DEAL_DAMAGE':
                 return [new DealDamageCommand(event as DealDamageEvent)];
            // Add other event-to-command mappings here
            default:
                // console.warn(`No command mapping for event type: ${event.type}`);
                return [];
        }
    }
}