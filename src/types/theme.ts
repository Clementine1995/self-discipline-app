export type ThemeId = 'fresh-schedule' | 'game-achievement' | 'dark-discipline';

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  surfaceColor: string;
  surfaceMutedColor: string;
  mutedTextColor: string;
  borderColor: string;
  toolbarColor: string;
  tabBarColor: string;
  cardRadius: string;
};
