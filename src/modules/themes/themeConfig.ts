import type { ThemeConfig } from '@/types/theme';

export const themeConfigs: ThemeConfig[] = [
  {
    id: 'fresh-schedule',
    name: '清爽日程型',
    accentColor: '#0f766e',
    backgroundColor: '#f4f7f4',
    textColor: '#17201d',
    surfaceColor: '#ffffff',
    surfaceMutedColor: '#e8efeb',
    mutedTextColor: '#62706a',
    borderColor: '#d9e3de',
    toolbarColor: 'rgba(244, 247, 244, 0.92)',
    tabBarColor: 'rgba(255, 255, 255, 0.96)',
    cardRadius: '8px',
  },
  {
    id: 'game-achievement',
    name: '游戏成就型',
    accentColor: '#2563eb',
    backgroundColor: '#f3f6ff',
    textColor: '#111827',
    surfaceColor: '#ffffff',
    surfaceMutedColor: '#dbeafe',
    mutedTextColor: '#64748b',
    borderColor: '#c7d2fe',
    toolbarColor: 'rgba(243, 246, 255, 0.94)',
    tabBarColor: 'rgba(255, 255, 255, 0.96)',
    cardRadius: '8px',
  },
  {
    id: 'dark-discipline',
    name: '暗黑纪律型',
    accentColor: '#ef4444',
    backgroundColor: '#101214',
    textColor: '#f5f5f5',
    surfaceColor: '#181b1f',
    surfaceMutedColor: '#2a2f35',
    mutedTextColor: '#a8b0ba',
    borderColor: '#343a42',
    toolbarColor: 'rgba(16, 18, 20, 0.94)',
    tabBarColor: 'rgba(24, 27, 31, 0.96)',
    cardRadius: '8px',
  },
];

export const getThemeConfig = (themeId: string) =>
  themeConfigs.find((theme) => theme.id === themeId) ?? themeConfigs[0];
