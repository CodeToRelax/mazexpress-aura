/**
 * Libya cities allowed as origin/destination for domestic shipments.
 * Lowercase strings — backend stores them as-is.
 * Duplicates (musrata/misrata, derna/darnah, al khums/khoms, bayda/al bayda) are
 * intentional in v1 per PRD §1.
 */
import type { DomesticCity } from '@/types/domestic';

export const DOMESTIC_CITIES: DomesticCity[] = [
  'benghazi',
  'tripoli',
  'musrata',
  'al bayda',
  'zawiya',
  'gharyan',
  'tobruk',
  'ajdabiya',
  'zliten',
  'derna',
  'sirte',
  'sabha',
  'khoms',
  'bani walid',
  'sabratha',
  'zuwara',
  'kufra',
  'al marj',
  'tarhuna',
  'ubari',
  'gadames',
  'ghat',
  'nalut',
  'jalu',
  'brega',
  'misrata',
  'al khums',
  'darnah',
  'yafran',
  'shahat',
  'bayda',
  'marsa brega',
];

/** Title-case a city slug ('al bayda' → 'Al Bayda'). */
export function titleCaseCity(city?: string | null): string {
  if (!city) return '';
  return city
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface DomesticCityOption {
  value: DomesticCity;
  label: string;
}

export const DOMESTIC_CITY_OPTIONS: DomesticCityOption[] = DOMESTIC_CITIES.map((c) => ({
  value: c,
  label: titleCaseCity(c),
}));