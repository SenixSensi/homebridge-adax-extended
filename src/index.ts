import type { API } from 'homebridge';
import { PLATFORM_NAME } from './settings';
import { ADAXHomebridgePlatform } from './platform';

// Registrer Homebridge platformen
export = (api: API): void => {
  if (!api) {
    throw new Error('Homebridge API could not be initialized.');
  }
  api.registerPlatform(PLATFORM_NAME, ADAXHomebridgePlatform);
};
