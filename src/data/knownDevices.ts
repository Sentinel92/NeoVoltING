/**
 * Chilean Household & Commercial Appliance Power Database (Watts)
 */

export interface KnownDeviceItem {
  name: string;
  watts: number;
  cat: 'Entretenimiento' | 'Computación' | 'Línea Blanca' | 'Cocina' | 'Climatización' | 'Agua Caliente' | 'Electromovilidad' | 'Otros';
  typicalCircuit: 'alumbrado' | 'enchufes' | 'fuerza_dedicada';
}

export const KNOWN_DEVICES: KnownDeviceItem[] = [
  { name: 'Smart TV 55"', watts: 120, cat: 'Entretenimiento', typicalCircuit: 'enchufes' },
  { name: 'Smart TV 75" 4K', watts: 220, cat: 'Entretenimiento', typicalCircuit: 'enchufes' },
  { name: 'Notebook / Laptop', watts: 85, cat: 'Computación', typicalCircuit: 'enchufes' },
  { name: 'PC Gaming / Escritorio', watts: 550, cat: 'Computación', typicalCircuit: 'enchufes' },
  { name: 'Consola Videojuegos (PS5 / Xbox Series)', watts: 210, cat: 'Entretenimiento', typicalCircuit: 'enchufes' },
  { name: 'Cargador Smartphone / Tablet', watts: 25, cat: 'Computación', typicalCircuit: 'enchufes' },
  { name: 'Equipo de Música / Soundbar', watts: 100, cat: 'Entretenimiento', typicalCircuit: 'enchufes' },
  { name: 'Refrigerador No-Frost A+', watts: 250, cat: 'Línea Blanca', typicalCircuit: 'enchufes' },
  { name: 'Freezer Horizontal', watts: 300, cat: 'Línea Blanca', typicalCircuit: 'enchufes' },
  { name: 'Microondas 20L-25L', watts: 1200, cat: 'Cocina', typicalCircuit: 'enchufes' },
  { name: 'Hervidor Eléctrico 1.7L', watts: 1800, cat: 'Cocina', typicalCircuit: 'enchufes' },
  { name: 'Tostadora de Pan', watts: 850, cat: 'Cocina', typicalCircuit: 'enchufes' },
  { name: 'Cafetera Expreso', watts: 1300, cat: 'Cocina', typicalCircuit: 'enchufes' },
  { name: 'Freidora de Aire (Air Fryer)', watts: 1500, cat: 'Cocina', typicalCircuit: 'enchufes' },
  { name: 'Lavadora / Secadora 10kg', watts: 2200, cat: 'Línea Blanca', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Secadora de Ropa Eléctrica 8kg', watts: 2500, cat: 'Línea Blanca', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Lavavajillas 12 Cubiertos', watts: 1800, cat: 'Cocina', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Aire Acondicionado Split 9000 BTU', watts: 900, cat: 'Climatización', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Aire Acondicionado Split 12000 BTU', watts: 1250, cat: 'Climatización', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Aire Acondicionado Split 18000 BTU', watts: 1800, cat: 'Climatización', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Aire Acondicionado Split 24000 BTU', watts: 2400, cat: 'Climatización', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Termo Eléctrico Agua Caliente 80L', watts: 1500, cat: 'Agua Caliente', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Termo Eléctrico Agua Caliente 120L', watts: 2000, cat: 'Agua Caliente', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Encimera Vitrocerámica 4 Platos', watts: 6500, cat: 'Cocina', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Encimera Inducción 4 Platos', watts: 7200, cat: 'Cocina', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Horno Eléctrico Empotrado', watts: 2800, cat: 'Cocina', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Cargador Auto Eléctrico Wallbox 7.4kW', watts: 7400, cat: 'Electromovilidad', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Bomba Piscina 1 HP', watts: 750, cat: 'Otros', typicalCircuit: 'fuerza_dedicada' },
  { name: 'Estufa Eléctrica Oleoeléctrica', watts: 1500, cat: 'Climatización', typicalCircuit: 'enchufes' },
  { name: 'Aspiradora 1800W', watts: 1800, cat: 'Otros', typicalCircuit: 'enchufes' },
  { name: 'Plancha a Vapor', watts: 2000, cat: 'Otros', typicalCircuit: 'enchufes' },
  { name: 'Secador de Pelo', watts: 1600, cat: 'Otros', typicalCircuit: 'enchufes' }
];

export function searchKnownDevices(query: string): KnownDeviceItem[] {
  if (!query || query.trim() === '') return KNOWN_DEVICES;
  const q = query.toLowerCase().trim();
  return KNOWN_DEVICES.filter((d) => d.name.toLowerCase().includes(q) || d.cat.toLowerCase().includes(q));
}
