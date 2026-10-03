import type { Anmeldungen } from './app';

export type EnrichedAnmeldungen = Anmeldungen & {
  hundName: string;
  kursName: string;
};
