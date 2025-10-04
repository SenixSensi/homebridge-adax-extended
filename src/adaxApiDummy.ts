// src/adaxApiDummy.ts
export class AdaxApiDummy {
  async getRoomsWithEnergy() {
    // Standard dummy-rum
    const defaultRooms = [
      { id: 1, name: 'Stue', temperature: 2150, targetTemperature: 2200, energyUsage: 500 },
      { id: 2, name: 'Soveværelse', temperature: 1900, targetTemperature: 2000, energyUsage: 250 },
    ];

    // Hent config globalt (sat i platform.ts)
    const platformConfig = (global as any).ADAX_CONFIG || {};
    const customNames = platformConfig.roomNames || {};

    // Overskriv navne hvis defineret i config
    const rooms = defaultRooms.map(room => ({
      ...room,
      name: customNames[room.id] || room.name,
    }));

    return { rooms };
  }

  async getRoomEnergyLog(roomId: number) {
    return [
      { timestamp: Date.now() - 3600 * 1000, energy: 100 },
      { timestamp: Date.now(), energy: 150 },
    ];
  }

  async setRoomTemperature(roomId: number, temperature: number) {
    console.log(`[Dummy] Sat temperatur i rum ${roomId} til ${temperature / 100}°C`);
  }
}
