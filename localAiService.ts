import { AIBlackboard, BTNode, BTNodeStatus, NodeMetadata, ParallelPolicy, AiArchetype, BehaviorTreeNodeDefinition, NodeTypeName, BattlefieldState, AiTurnIntent } from './types';
import { SequenceNode, SelectorNode, ParallelNode } from './behaviorTree';
import * as Nodes from './nodes';
import { findPath } from '../pathfinding';
import { dataService } from 'services./data.service';

// Type-safe node registry as per spec
const nodeRegistry = {
    Sequence: SequenceNode,
    Selector: SelectorNode,
    Parallel: ParallelNode,
    FindVisibleEnemiesNode: Nodes.FindVisibleEnemiesNode,
    HasVisibleEnemiesNode: Nodes.HasVisibleEnemiesNode,
    FindClosestEnemyNode: Nodes.FindClosestEnemyNode,
    MoveToTargetNode: Nodes.MoveToTargetNode,
    AttackTargetNode: Nodes.AttackTargetNode,
    IsEnemyInMeleeNode: Nodes.IsEnemyInMeleeNode,
    MoveAwayFromTargetNode: Nodes.MoveAwayFromTargetNode,
    FindBestTargetNode: Nodes.FindBestTargetNode,
    PrioritizeLastAttackerNode: Nodes.PrioritizeLastAttackerNode,
    AssignSquadTargetNode: Nodes.AssignSquadTargetNode,
    HasSquadTargetNode: Nodes.HasSquadTargetNode,
    SetTargetToSquadTargetNode: Nodes.SetTargetToSquadTargetNode,
    IsHealthLowNode: Nodes.IsHealthLowNode,
    FleeNode: Nodes.FleeNode,
    FindCoverNode: Nodes.FindCoverNode,
    UseMostDamagingAbilityNode: Nodes.UseMostDamagingAbilityNode,
    UseBestAreaOfEffectNode: Nodes.UseBestAreaOfEffectNode,
    FindMostWoundedEnemyNode: Nodes.FindMostWoundedEnemyNode,
} as const;

type CompositeNodeTypeName = 'Sequence' | 'Selector' | 'Parallel';

class BehaviorTreeFactory {
    public static createNode(definition: BehaviorTreeNodeDefinition): BTNode {
        const { type, args = [], children = [], metadata } = definition;

        if (type === 'Sequence' || type === 'Selector' || type === 'Parallel') {
            const childNodes = children.map(childDef => this.createNode(childDef));
            switch (type) {
                case 'Sequence': return new SequenceNode(childNodes, metadata);
                case 'Selector': return new SelectorNode(childNodes, metadata);
                case 'Parallel': return new ParallelNode(childNodes, (args[0] as ParallelPolicy) || ParallelPolicy.RequireAll, metadata);
            }
        }
        
        const NodeConstructor = nodeRegistry[type as Exclude<NodeTypeName, CompositeNodeTypeName>];
        if (!NodeConstructor) {
            throw new Error(`Unregistered node type: ${type}`);
        }
        
        // @ts-ignore - We trust the archetype JSON to provide correct args for the constructor
        return new NodeConstructor(...args, metadata);
    }
}


export const getLocalAiTurn = async (
    battlefieldState: BattlefieldState,
): Promise<AiTurnIntent | null> => {
    if (!battlefieldState.self.archetype) return null;

    const archetypeData = await dataService.getAiArchetypeById(battlefieldState.self.archetype);
    if (!archetypeData) {
        console.warn(`Could not find archetype data for: ${battlefieldState.self.archetype}`);
        return null;
    }

    const behaviorTree = BehaviorTreeFactory.createNode(archetypeData.root);
    if (!behaviorTree) {
         console.warn(`Could not build behavior tree for: ${battlefieldState.self.archetype}`);
        return null;
    }

    const blackboard: AIBlackboard = {
        battlefieldState,
        pathfinder: (startX, startY, endX, endY, grid, obstacles) => findPath(startX, startY, endX, endY, grid, obstacles),
        result: {
            actionId: null,
            targetId: null,
            destination: null,
            squadTargetId: null,
            rationale: `Following local AI archetype: ${battlefieldState.self.archetype}`,
            dialogue: ""
        }
    };

    const status = behaviorTree.tick(blackboard);

    if(status === BTNodeStatus.FAILURE) {
        blackboard.result.rationale = `Could not find a valid action sequence in the '${battlefieldState.self.archetype}' behavior tree.`;
        blackboard.result.dialogue = `${battlefieldState.self.instanceName} hesitates, unsure of its next move.`;
        
        if (blackboard.result.destination && !blackboard.result.actionId) {
             return blackboard.result;
        }
        return null;
    }

    return blackboard.result;
};