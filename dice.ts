// Simple d20 roll
export const rollD20 = (): number => Math.floor(Math.random() * 20) + 1;

interface RollResult {
    rolls: number[];
    modifier: number;
    total: number;
}

// Parses and rolls dice strings like "2d6+3", "1d8", "1d4-1" and handles rerolls
export const rollDice = (diceString: string, reroll?: number[]): RollResult => {
    if (!diceString || typeof diceString !== 'string') {
        return { rolls: [0], modifier: 0, total: 0 };
    }

    const cleanedString = diceString.replace(/\s+/g, '');
    
    let modifier = 0;
    let dicePart = cleanedString;

    const plusMatch = cleanedString.match(/[+]/);
    const minusMatch = cleanedString.match(/[-]/);

    if (plusMatch) {
        const parts = cleanedString.split('+');
        dicePart = parts[0];
        modifier = parseInt(parts[1], 10) || 0;
    } else if (minusMatch) {
        const parts = cleanedString.split('-');
        dicePart = parts[0];
        modifier = -(parseInt(parts[1], 10) || 0);
    }
    
    if (!dicePart.includes('d')) {
        // This is just a flat number, not a dice roll
        const flatDamage = parseInt(dicePart, 10) || 0;
        return { rolls: [flatDamage], modifier: 0, total: flatDamage };
    }


    const [numDiceStr, dieTypeStr] = dicePart.split('d');
    const numDice = parseInt(numDiceStr, 10) || 1;
    const dieType = parseInt(dieTypeStr, 10);
    
    if (isNaN(dieType)) {
       return { rolls: [0], modifier: 0, total: 0 };
    }

    const rolls: number[] = [];
    let total = 0;

    for (let i = 0; i < numDice; i++) {
        let roll = Math.floor(Math.random() * dieType) + 1;
        if (reroll && reroll.includes(roll)) {
            roll = Math.floor(Math.random() * dieType) + 1; // Reroll once
        }
        rolls.push(roll);
        total += roll;
    }

    total += modifier;

    return { rolls, modifier, total };
};

export const rollGold = (goldRollString: string): number => {
    if (!goldRollString) return 0;
    
    const parts = goldRollString.split('*');
    const dicePart = parts[0];
    const multiplier = parts.length > 1 ? parseInt(parts[1], 10) : 1;

    if (isNaN(multiplier)) return 0;

    const rollResult = rollDice(dicePart);
    return rollResult.total * multiplier;
};
