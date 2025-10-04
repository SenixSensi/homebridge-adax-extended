interface DummyRoom {
  id: number;
  name: string;
  temperature: number;
  targetTemperature: number;
  energyUsage: number;
}

interface DummyRoomsResponse {
  rooms: DummyRoom[];
}

interface DummyEnergyLog {
  timestamp: number;
  energy: number;
}

export class AdaxApiDummy {
  async getRoomsWithEnergy(): Promise<DummyRoomsResponse> {
    const defaultRooms: DummyRoom[] = [
      { id: 1, name: 'Stue', temperature: 2150, targetTemperature: 2200, energyUsage: 500 },
      { id: 2, name: 'Soveværelse', temperature: 1900, targetTemperature: 2000, energyUsage: 250 },
    ];

    const platformConfig = (globalThis as { ADAX_CONFIG?: { roomNames?: Record<number, string> } }).ADAX_CONFIG || {};
    const customNames = platformConfig.roomNames || {};

    const rooms: DummyRoom[] = defaultRooms.map(room => ({
      ...room,
      name: customNames[room.id] || room.name,
    }));

    return { rooms };
  }

  async getRoomEnergyLog(_roomId: number): Promise<DummyEnergyLog[]> {
    return [
      { timestamp: Date.now() - 3600 * 1000, energy: 100 },
      { timestamp: Date.now(), energy: 150 },
    ];
  }

  async setRoomTemperature(roomId: number, temperature: number): Promise<void> {
    console.log(`[Dummy] Sat temperatur i rum ${roomId} til ${temperature / 100}°C`);
  }
}
