import type {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { ADAXPlatformAccessory } from './platformAccessory';
import { AdaxApi } from './adaxApi';
import type { AdaxContentResponse } from './adaxApi';
import { AdaxApiDummy } from './adaxApiDummy';

export class ADAXHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly accessories: PlatformAccessory[] = [];
  private apiClient: AdaxApi | AdaxApiDummy;
  private cache: AdaxContentResponse | null = null;
  private lastUpdate = 0;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    if (this.config.dummyMode) {
      this.config.clientId = 'dummy';
      this.config.secret = 'dummy';
      this.log.info('Dummy mode active: using credentials "dummy" / "dummy"');
    } else {
      this.config.clientId = this.config.clientId || '';
      this.config.secret = this.config.secret || '';
    }

    (globalThis as { ADAX_CONFIG?: PlatformConfig }).ADAX_CONFIG = this.config;

    if (this.config.dummyMode) {
      this.apiClient = new AdaxApiDummy();
      this.log.warn('ADAX plugin running in DUMMY MODE – no real heaters will be contacted.');
    } else {
      this.apiClient = new AdaxApi(this.config.clientId, this.config.secret);
      this.log.info('ADAX plugin running in LIVE mode – connecting to Adax Cloud API.');
    }

    this.api.on('didFinishLaunching', async () => {
      this.log.info('ADAX plugin finished launching');
      await this.discoverDevices();
    });
  }

  async pollRooms(): Promise<AdaxContentResponse | null> {
    const now = Date.now();
    const pollInterval = (this.config.maxPollInterval || 60) * 1000;

    if (!this.cache || now - this.lastUpdate > pollInterval) {
      try {
        this.cache = await this.apiClient.getRoomsWithEnergy();
        this.lastUpdate = now;
      } catch (error) {
        this.log.error('Failed to poll rooms:', error);
      }
    }

    return this.cache;
  }

  async discoverDevices(): Promise<void> {
    const data = await this.pollRooms();

    if (!data || !data.rooms) {
      this.log.warn('No rooms discovered (dummy or API returned nothing).');
      return;
    }

    const discoveredRoomIds = data.rooms.map(r => r.id.toString());

    // Add or update accessories
    for (const room of data.rooms) {
      const uuid = this.api.hap.uuid.generate(room.id.toString());
      let accessory = this.accessories.find(a => a.UUID === uuid);

      if (!accessory) {
        accessory = new this.api.platformAccessory(room.name || `Room ${room.id}`, uuid);
        accessory.context.roomId = room.id;
        new ADAXPlatformAccessory(this, accessory, room.id);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.log.info(`Added new room: ${room.name || room.id}`);
      } else {
        this.log.debug(`Room already exists: ${room.name || room.id}`);
      }
    }

    // Remove old accessories that are not in current data
    const accessoriesToRemove = this.accessories.filter(
      acc => !discoveredRoomIds.includes(acc.context.roomId?.toString()),
    );

    for (const acc of accessoriesToRemove) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [acc]);
      this.log.info(`Removed outdated accessory: ${acc.displayName}`);
    }
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.push(accessory);
  }

  public get client(): AdaxApi | AdaxApiDummy {
    return this.apiClient;
  }
}
