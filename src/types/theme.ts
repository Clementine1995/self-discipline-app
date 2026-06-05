export type ThemeId =
  | 'fresh-schedule'
  | 'game-achievement'
  | 'dark-discipline'
  | 'schemer-control'
  | 'tsundere-challenge'
  | 'adult-command'
  | 'minimal-data';

export type ThemeDensity = 'calm' | 'playful' | 'strict' | 'intense' | 'minimal';

export type ThemeFeedbackStyle =
  | 'schedule'
  | 'achievement'
  | 'discipline'
  | 'schemer'
  | 'challenge'
  | 'command'
  | 'data';

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  density: ThemeDensity;
  feedbackStyle: ThemeFeedbackStyle;
  accentColor: string;
  secondaryAccentColor: string;
  dangerColor: string;
  successColor: string;
  warningColor: string;
  backgroundColor: string;
  textColor: string;
  surfaceColor: string;
  surfaceMutedColor: string;
  mutedTextColor: string;
  borderColor: string;
  toolbarColor: string;
  tabBarColor: string;
  cardRadius: string;
  shadowColor: string;
};
