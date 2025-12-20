export interface CityOption {
  value: string;
  label: string;
}

export const LIBYAN_CITIES: CityOption[] = [
  { value: 'tripoli', label: 'Tripoli' },
  { value: 'benghazi', label: 'Benghazi' },
  { value: 'misrata', label: 'Misrata' },
  { value: 'zawiya', label: 'Zawiya' },
  { value: 'zliten', label: 'Zliten' },
  { value: 'al bayda', label: 'Al Bayda' },
  { value: 'ajdabiya', label: 'Ajdabiya' },
  { value: 'tobruk', label: 'Tobruk' },
  { value: 'sabha', label: 'Sabha' },
  { value: 'sirte', label: 'Sirte' },
  { value: 'al khums', label: 'Al Khums' },
  { value: 'derna', label: 'Derna' },
  { value: 'gharyan', label: 'Gharyan' },
  { value: 'sabratha', label: 'Sabratha' },
  { value: 'tarhuna', label: 'Tarhuna' },
  { value: 'bani walid', label: 'Bani Walid' },
  { value: 'al marj', label: 'Al Marj' },
  { value: 'sorman', label: 'Sorman' },
  { value: 'zuwara', label: 'Zuwara' },
  { value: 'yefren', label: 'Yefren' },
  { value: 'nalut', label: 'Nalut' },
  { value: 'ghat', label: 'Ghat' },
  { value: 'murzuq', label: 'Murzuq' },
  { value: 'ubari', label: 'Ubari' },
  { value: 'jalu', label: 'Jalu' },
  { value: 'brega', label: 'Brega' },
  { value: 'ras lanuf', label: 'Ras Lanuf' },
  { value: 'hun', label: 'Hun' },
  { value: 'waddan', label: 'Waddan' },
  { value: 'ghadames', label: 'Ghadames' },
  { value: 'kufra', label: 'Kufra' },
  { value: 'janzour', label: 'Janzour' },
];

export function getAvailableCities(excludeCities: string[]): CityOption[] {
  const excludeSet = new Set(excludeCities.map(c => c.toLowerCase()));
  return LIBYAN_CITIES.filter(city => !excludeSet.has(city.value.toLowerCase()));
}
