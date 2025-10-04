import type { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import type { ADAXHomebridgePlatform } from './platform';

export class ADAXPlatformAccessory {
  private service: Service;

  constructor(
    private readonly platform: ADAXHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly roomId: number,
  ) {
    // Grundlæggende accessory info
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'ADAX')
      .setCharacteristic(this.platform.Characteristic.Model, 'WiFi Heater Dummy')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.roomId.toString());

    // Tilføj Thermostat-service
    this.service =
      this.accessory.getService(this.platform.Service.Thermostat) ||
      this.accessory.addService(this.platform.Service.Thermostat);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    // Celsius, varmetilstand og standarder
    this.service.setCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits, 0); // Celsius
    this.service.setCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, 0);
    this.service.setCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, 1);

    // Tillad temperaturer mellem 5 °C og 30 °C
    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .setProps({
        minValue: 5,
        maxValue: 30,
        minStep: 0.5,
      })
      .onSet(this.handleTargetTemperatureSet.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onSet(this.handleTargetStateSet.bind(this));

    // Initial opdatering
    this.updateValues();
  }

  // Når brugeren ændrer temperatur i HomeKit
  async handleTargetTemperatureSet(value: CharacteristicValue) {
    const temperature = value as number;
    this.platform.log.info(`[ADAX] Sat temperatur i rum ${this.roomId} til ${temperature}°C`);

    try {
      await this.platform['apiClient'].setRoomTemperature(this.roomId, temperature * 100);
    } catch (err) {
      this.platform.log.warn(`[ADAX] Kunne ikke opdatere temperatur i rum ${this.roomId}: ${err}`);
    }
  }

  // Når brugeren ændrer mellem “varme / slukket”
  async handleTargetStateSet(value: CharacteristicValue) {
    const state = value as number;
    this.platform.log.info(`[ADAX] Sat rum ${this.roomId} til tilstand: ${state === 1 ? 'Varme' : 'Slukket'}`);
  }

  // Henter aktuelle temperaturer og opdaterer HomeKit
  async updateValues() {
    try {
      const data = await this.platform.pollRooms();
      const room = data.rooms.find((r: any) => r.id === this.roomId);
      if (!room) {
        return;
      }

      const currentTemp = room.temperature / 100;
      const targetTemp = room.targetTemperature / 100;

      this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, currentTemp);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetTemperature, targetTemp);

      // Bestem om varmen er aktiv
      const heatingState = targetTemp > currentTemp ? 1 : 0; // 1=Heat, 0=Off
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, heatingState);
    } catch (err) {
      this.platform.log.error(`[ADAX] Fejl under opdatering af rum ${this.roomId}: ${err}`);
    }
  }
}
