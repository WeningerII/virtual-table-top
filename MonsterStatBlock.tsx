import React from 'react';
import { Monster, MonsterAbilityScores, ActionItem, SpecialTrait, LegendaryAction, LairAction } from './types';

interface MonsterStatBlockProps {
    monster: Monster;
    isDmMode?: boolean;
    onSummon?: (monsterId: string) => void;
}

const StatBlockDivider: React.FC = () => <div className="border-t-2 border-[#822000] my-2"></div>;

const AbilityScores: React.FC<{ scores: MonsterAbilityScores }> = ({ scores }) => {
    const getModifier = (score: number) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : mod;
    };
    
    return (
        <div className="grid grid-cols-6 gap-2 text-center text-[#822000]">
            {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map(ability => (
                <div key={ability}>
                    <p className="font-bold">{ability}</p>
                    <p>{scores[ability as keyof MonsterAbilityScores]} ({getModifier(scores[ability as keyof MonsterAbilityScores])})</p>
                </div>
            ))}
        </div>
    );
};

const ActionSection: React.FC<{ title: string, actions?: Array<{ name?: string, description?: string }> }> = ({ title, actions }) => {
    if (!actions || actions.length === 0) return null;
    return (
        <div>
            <h3 className="text-2xl font-bold font-teko tracking-wide text-[#822000] border-b-2 border-[#822000] mb-2">{title}</h3>
            <div className="space-y-2">
                {actions.map(action => (
                    <p key={action.name || action.description?.slice(0, 10)}>
                        {action.name && <strong className="italic">{action.name}.</strong>} {action.description}
                    </p>
                ))}
            </div>
        </div>
    );
};

const MonsterStatBlock: React.FC<MonsterStatBlockProps> = ({ monster, isDmMode = false, onSummon }) => {
    return (
        <div className="bg-[#fdf1dc] text-black rounded-lg shadow-2xl p-6 border-4 border-gray-600">
            <h2 className="text-3xl font-bold font-teko tracking-wider text-[#822000]">{monster.name.toUpperCase()}</h2>
            <p className="italic text-sm">{monster.size} {monster.type}{monster.tags ? ` (${monster.tags.join(', ')})` : ''}, {monster.alignment}</p>
            
            <StatBlockDivider />
            
            <p><strong>Armor Class</strong> {monster.ac.value} {monster.ac.type && `(${monster.ac.type})`}</p>
            <p><strong>Hit Points</strong> {monster.hp.average} ({monster.hp.formula})</p>
            <p><strong>Speed</strong> {Object.entries(monster.speed).map(([type, value]) => `${type} ${value}ft.`).join(', ')}</p>
            
            <StatBlockDivider />
            
            <AbilityScores scores={monster.abilityScores} />
            
            <StatBlockDivider />
            
            {monster.savingThrows && <p><strong>Saving Throws</strong> {monster.savingThrows.map(s => `${s.ability.slice(0,3)} +${s.bonus}`).join(', ')}</p>}
            {monster.skills && <p><strong>Skills</strong> {monster.skills.map(s => `${s.skill.charAt(0).toUpperCase() + s.skill.slice(1)} +${s.bonus}`).join(', ')}</p>}
            {monster.damageVulnerabilities && <p><strong>Damage Vulnerabilities</strong> {monster.damageVulnerabilities.join(', ')}</p>}
            {monster.damageResistances && <p><strong>Damage Resistances</strong> {monster.damageResistances.join(', ')}</p>}
            {monster.damageImmunities && <p><strong>Damage Immunities</strong> {monster.damageImmunities.join(', ')}</p>}
            {monster.conditionImmunities && <p><strong>Condition Immunities</strong> {monster.conditionImmunities.join(', ')}</p>}
            <p><strong>Senses</strong> {Object.entries(monster.senses).map(([sense, value]) => `${sense.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value}ft.`).join(', ')}</p>
            <p><strong>Languages</strong> {monster.languages.length > 0 ? monster.languages.join(', ') : '—'}</p>
            <p><strong>Challenge</strong> {monster.challengeRating} ({monster.xp.toLocaleString()} XP)</p>
            
            <StatBlockDivider />
            
            <ActionSection title="Special Traits" actions={monster.specialTraits} />
            <ActionSection title="Actions" actions={monster.actions} />
            <ActionSection title="Reactions" actions={monster.reactions} />
            <ActionSection title="Legendary Actions" actions={monster.legendaryActions} />
            <ActionSection title="Lair Actions" actions={monster.lairActions} />

            {isDmMode && onSummon && (
                <div className="mt-4 pt-4 border-t-2 border-[#822000]">
                    <button
                        onClick={() => onSummon(monster.id)}
                        className="w-full px-4 py-2 bg-purple-700 text-white rounded-md font-bold hover:bg-purple-600 transition-colors"
                    >
                        Summon to Map
                    </button>
                </div>
            )}
        </div>
    );
};

export default MonsterStatBlock;