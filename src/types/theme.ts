export type ThemeId = 'fresh-schedule' | 'game-achievement' | 'dark-discipline';

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  accentColor: string;
  backgroundColor: string;
  cardRadius: string;
};
