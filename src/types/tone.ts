export type ToneId =
  | 'gentle'
  | 'warm-companion'
  | 'coach'
  | 'strict-coach'
  | 'rational'
  | 'minimal-analyst'
  | 'meme'
  | 'tsundere'
  | 'schemer'
  | 'adult-command';

export type TonePromptKind = 'reward' | 'punishment' | 'recovery' | 'review' | 'plan';

export type ToneIntensity = 'low' | 'medium' | 'high';

export type ToneCategory = 'supportive' | 'pressure' | 'data' | 'playful' | 'teasing' | 'command';

export type ToneProfile = {
  id: ToneId;
  name: string;
  description: string;
  category: ToneCategory;
  intensity: ToneIntensity;
  supportsMemeExtension: boolean;
  sample: {
    reward: string;
    punishment: string;
  };
};

export type ToneMemePackId = 'safe-lite';

export type ToneMemePackSafetyLevel = 'safe' | 'edgy' | 'restricted';

export type ToneMemePack = {
  id: ToneMemePackId;
  name: string;
  description: string;
  enabledByDefault: boolean;
  safetyLevel: ToneMemePackSafetyLevel;
  scenePrefixes: Partial<Record<TonePromptKind, string[]>>;
};
