import { Currency } from './types';

export const EXCHANGE_RATES = {
    pp: 1000,
    gp: 100,
    ep: 50,
    sp: 10,
    cp: 1,
};

export const currencyToCopper = (currency: Partial<Currency>): number => {
    let total = 0;
    if (currency.pp) total += currency.pp * EXCHANGE_RATES.pp;
    if (currency.gp) total += currency.gp * EXCHANGE_RATES.gp;
    if (currency.ep) total += currency.ep * EXCHANGE_RATES.ep;
    if (currency.sp) total += currency.sp * EXCHANGE_RATES.sp;
    if (currency.cp) total += currency.cp * EXCHANGE_RATES.cp;
    return total;
};

export const copperToCurrency = (totalCopper: number): Currency => {
    let remaining = Math.round(totalCopper);

    const pp = Math.floor(remaining / EXCHANGE_RATES.pp);
    remaining %= EXCHANGE_RATES.pp;

    const gp = Math.floor(remaining / EXCHANGE_RATES.gp);
    remaining %= EXCHANGE_RATES.gp;

    const ep = Math.floor(remaining / EXCHANGE_RATES.ep);
    remaining %= EXCHANGE_RATES.ep;

    const sp = Math.floor(remaining / EXCHANGE_RATES.sp);
    remaining %= EXCHANGE_RATES.sp;
    
    const cp = remaining;

    return { pp, gp, ep, sp, cp };
};
