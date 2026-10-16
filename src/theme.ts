import { useColorScheme } from 'react-native';

const light = {
  bg: '#EDEFF2', surface: '#FFFFFF', ink: '#151922', muted: '#5D6573', line: '#D6DAE1',
  accent: '#2747B8', onAccent: '#FFFFFF', belt: '#B9302A', good: '#1F7A4D', warn: '#A86A00', chip: '#E3E7EE',
};
const dark: typeof light = {
  bg: '#10131A', surface: '#191E28', ink: '#E8EBF1', muted: '#9AA3B2', line: '#2A3140',
  accent: '#6E8CFF', onAccent: '#0B0E14', belt: '#E0594F', good: '#4CC28A', warn: '#E3A64A', chip: '#232A37',
};

export type Colors = typeof light;
export const useColors = (): Colors => (useColorScheme() === 'dark' ? dark : light);

export const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export { todayIndex } from './domain/schedule';
