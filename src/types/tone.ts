export type ToneId = 'gentle' | 'coach' | 'rational';

export type ToneProfile = {
  id: ToneId;
  name: string;
  description: string;
};
