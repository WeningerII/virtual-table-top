import { AIBlackboard, BTNode, BTNodeStatus, NodeMetadata, ParallelPolicy } from '../../types';

export abstract class CompositeNode extends BTNode {
    constructor(protected children: BTNode[], metadata?: NodeMetadata) {
        super(metadata);
    }
}

export class SequenceNode extends CompositeNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        for (const child of this.children) {
            const status = child.tick(board);
            if (status !== BTNodeStatus.SUCCESS) {
                return status;
            }
        }
        return BTNodeStatus.SUCCESS;
    }
}

export class SelectorNode extends CompositeNode {
    protected execute(board: AIBlackboard): BTNodeStatus {
        for (const child of this.children) {
            const status = child.tick(board);
            if (status !== BTNodeStatus.FAILURE) {
                return status;
            }
        }
        return BTNodeStatus.FAILURE;
    }
}

export class ParallelNode extends CompositeNode {
    constructor(children: BTNode[], private policy: ParallelPolicy, metadata?: NodeMetadata) {
        super(children, metadata);
    }

    protected execute(board: AIBlackboard): BTNodeStatus {
        let successCount = 0;
        let failureCount = 0;
        const totalChildren = this.children.length;

        for (const child of this.children) {
            const status = child.tick(board);
            switch (status) {
                case BTNodeStatus.SUCCESS:
                    successCount++;
                    break;
                case BTNodeStatus.FAILURE:
                    failureCount++;
                    break;
                case BTNodeStatus.RUNNING:
                    // If any child is running, the parallel node is still running.
                    return BTNodeStatus.RUNNING;
            }
        }

        if (this.policy === ParallelPolicy.RequireOne) {
            return successCount > 0 ? BTNodeStatus.SUCCESS : BTNodeStatus.FAILURE;
        } else { // RequireAll
            return successCount === totalChildren ? BTNodeStatus.SUCCESS : BTNodeStatus.FAILURE;
        }
    }
}