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
import { AdaxApiDummy } from './adaxApiDummy';

export class ADAXHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly accessories: PlatformAccessory[] = [];

  private apiClient: AdaxApi | AdaxApiDummy;
  private cache: any = null;
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
      this.log.info('🔧 Dummy mode aktiv: bruger automatisk credentials "dummy" / "dummy"');
    } else {
      this.config.clientId = this.config.clientId || '';
      this.config.secret = this.config.secret || '';
    }

    (global as any).ADAX_CONFIG = this.config;

    if (this.config.dummyMode) {
      this.apiClient = new AdaxApiDummy();
      this.log.warn('⚙️ ADAX plugin is running in DUMMY MODE – no real heaters will be contacted.');
    } else {
      this.apiClient = new AdaxApi(this.config.clientId, this.config.secret);
      this.log.info('🌐 ADAX plugin is running in LIVE mode – connecting to Adax Cloud API.');
    }

    this.api.on('didFinishLaunching', async () => {
      this.log.info('✅ ADAX plugin finished launching');
      await this.discoverDevices();
    });
  }

  async pollRooms(): Promise<any> {
    const now = Date.now();
    const pollInterval = (this.config.maxPollInterval || 60) * 1000;

    if (!this.cache || now - this.lastUpdate > pollInterval) {
      try {
        this.cache = await this.apiClient.getRoomsWithEnergy();
        this.lastUpdate = now;
      } catch (err) {
        this.log.error('❌ Failed to poll rooms:', err);
      }
    }
    return this.cache;
  }

  async discoverDevices(): Promise<void> {
    const data = await this.pollRooms();
    if (!data?.rooms) {
      this.log.warn('⚠️ No rooms discovered (dummy or API returned nothing).');
      return;
    }

    for (const room of data.rooms) {
      const uuid = this.api.hap.uuid.generate(room.id.toString());
      let accessory = this.accessories.find(a => a.UUID === uuid);

      if (!accessory) {
        accessory = new this.api.platformAccessory(room.name || `Room ${room.id}`, uuid);
        new ADAXPlatformAccessory(this, accessory, room.id);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.log.info(`➕ Added new room: ${room.name || room.id}`);
      } else {
        this.log.debug(`♻️ Room already exists: ${room.name || room.id}`);
      }
    }
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.push(accessory);
  }
}
