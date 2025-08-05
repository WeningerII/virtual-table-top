
import React from 'react';

const iconStyle: React.CSSProperties = { width: '100%', height: '100%', fill: 'currentColor' };

export const ActionIcon = () => (
    <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M12 2C15.31 2 18 4.69 18 8C18 11.31 15.31 14 12 14C8.69 14 6 11.31 6 8C6 4.69 8.69 2 12 2M12 20C14.21 20 16 18.21 16 16H8C8 18.21 9.79 20 12 20M12 22C9.79 22 8 20.21 8 18V15H16V18C16 20.21 14.21 22 12 22Z" />
    </svg>
);

export const BonusActionIcon = () => (
    <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M13,2.05V8.06C15.39,8.59,17.21,10.82,17.21,13.5C17.21,16.18,15.39,18.41,13,18.94V21.95C16.88,21.41,20,17.8,20,13.5C20,9.2,16.88,5.59,13,5.05M5.21,13.5C5.21,10.82,7.03,8.59,9.42,8.06V2.05C5.54,2.59,2.42,6.2,2.42,10.5C2.42,14.8,5.54,18.41,9.42,18.94V12.94C7.03,12.41,5.21,10.18,5.21,7.5" transform="rotate(45 12 12)" />
    </svg>
);

export const ReactionIcon = () => (
    <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M16.89,15.5L16.18,18.82L13,17.25L9.82,18.82L9.11,15.5L6.5,13.34L9.43,12.55L10.9,9.68L13,11.25L15.1,9.68L16.57,12.55L19.5,13.34L16.89,15.5M20,2H4C2.9,2 2,2.9 2,4V22L6,18H20C21.1,18 22,17.1 22,16V4C22,2.9 21.1,2 20,2Z" />
    </svg>
);

export const MoveIcon = () => (
    <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M13,6V18L15.5,15.5L16.92,16.92L12,21.84L7.08,16.92L8.5,15.5L11,18V6L8.5,8.5L7.08,7.08L12,2.16L16.92,7.08L15.5,8.5L13,6Z" />
    </svg>
);

export const SpellIcon = () => (
    <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M19,17.5V13.5C19,11.5 17.5,10 15.5,10H14.5V8.5C14.5,7.7 15.2,7 16,7H18V5H16C14.1,5 12.5,6.6 12.5,8.5V10H10.5C8.5,10 7,11.5 7,13.5V17.5C7,19.5 8.5,21 10.5,21H15.5C17.5,21 19,19.5 19,17.5M5,3V15H3V3H5M21,3V15H23V3H21Z" />
    </svg>
);

export const InventoryIcon = () => (
    <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M5,8V18H19V8H5M12,11A2,2 0 0,1 14,13A2,2 0 0,1 12,15A2,2 0 0,1 10,13A2,2 0 0,1 12,11M19,4H16L15,2H9L8,4H5A2,2 0 0,0 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4Z" />
    </svg>
);
