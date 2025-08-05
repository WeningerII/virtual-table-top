import React from 'react';
import {
    ArtificerIcon,
    BarbarianIcon,
    BardIcon,
    ClericIcon,
    DruidIcon,
    FighterIcon,
    MonkIcon,
    PaladinIcon,
    RangerIcon,
    RogueIcon,
    SorcererIcon,
    WarlockIcon,
    WizardIcon,
} from './ClassIcons';

interface ClassIconFactoryProps {
    iconId: string;
}

const iconMap: { [key: string]: React.FC } = {
    ArtificerIcon,
    BarbarianIcon,
    BardIcon,
    ClericIcon,
    DruidIcon,
    FighterIcon,
    MonkIcon,
    PaladinIcon,
    RangerIcon,
    RogueIcon,
    SorcererIcon,
    WarlockIcon,
    WizardIcon,
};

const ClassIconFactory: React.FC<ClassIconFactoryProps> = ({ iconId }) => {
    const IconComponent = iconMap[iconId];
    return IconComponent ? <IconComponent /> : null;
};

export default ClassIconFactory;
