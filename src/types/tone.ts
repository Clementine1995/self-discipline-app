export type ToneId = 'gentle' | 'coach' | 'rational' | 'meme';

export type TonePromptKind = 'reward' | 'punishment' | 'recovery' | 'review' | 'plan';

export type ToneIntensity = 'low' | 'medium' | 'high';

export type ToneCategory = 'supportive' | 'pressure' | 'data' | 'playful';

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
