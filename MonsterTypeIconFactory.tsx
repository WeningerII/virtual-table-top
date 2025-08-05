
import React from 'react';
import {
    AberrationIcon,
    BeastIcon,
    CelestialIcon,
    ConstructIcon,
    DragonIcon,
    ElementalIcon,
    FeyIcon,
    FiendIcon,
    GiantIcon,
    HumanoidIcon,
    MonstrosityIcon,
    OozeIcon,
    PlantIcon,
    UndeadIcon
} from './MonsterTypeIcons';

interface MonsterTypeIconFactoryProps {
    iconId: string;
}

const iconMap: { [key: string]: React.FC } = {
    AberrationIcon,
    BeastIcon,
    CelestialIcon,
    ConstructIcon,
    DragonIcon,
    ElementalIcon,
    FeyIcon,
    FiendIcon,
    GiantIcon,
    HumanoidIcon,
    MonstrosityIcon,
    OozeIcon,
    PlantIcon,
    UndeadIcon,
};

const MonsterTypeIconFactory: React.FC<MonsterTypeIconFactoryProps> = ({ iconId }) => {
    const IconComponent = iconMap[iconId];
    return IconComponent ? <IconComponent /> : null;
};

export default MonsterTypeIconFactory;
