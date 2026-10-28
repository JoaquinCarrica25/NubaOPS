// ============================================================
// Nuba Ops — datos base (apartamentos, checklist, catálogos)
// ============================================================

export const APARTAMENTOS = [
  { id: "almaden", nombre: "Almadén", legacy: "ALMADEN", capacidad: 2 },
  { id: "carretas", nombre: "Carretas", legacy: "CARRETAS", capacidad: 2 },
  { id: "cava-alta", nombre: "Cava Alta", legacy: "CAVA ALTA", capacidad: 2 },
  { id: "concepcion", nombre: "Concepción", legacy: "CONCEPCIÓN", capacidad: 2 },
  { id: "costanilla", nombre: "Costanilla", legacy: "COSTANILLA", capacidad: 2 },
  { id: "fomento", nombre: "Fomento", legacy: "FOMENTO", capacidad: 2 },
  { id: "imperial", nombre: "Imperial", legacy: "IMPERIAL", capacidad: 2 },
  { id: "mayor", nombre: "Mayor", legacy: "MAYOR", capacidad: 2 },
  { id: "montera", nombre: "Montera", legacy: "MONTERA", capacidad: 2 },
  { id: "moratin", nombre: "Moratín", legacy: "MORATIN", capacidad: 2 },
  { id: "moreria", nombre: "Morería", legacy: "MORERIA", capacidad: 2 },
  { id: "moreno-nieto", nombre: "Moreno Nieto", legacy: "MORENO NIETO", capacidad: 2 },
  { id: "navas", nombre: "Navas", legacy: "NAVAS", capacidad: 2 },
  { id: "san-bartolome", nombre: "San Bartolomé", legacy: "SAN BARTOLOME", capacidad: 2 },
  { id: "san-miguel", nombre: "San Miguel", legacy: "SAN MIGUEL", capacidad: 2 },
  { id: "tetuan", nombre: "Tetuán", legacy: "TETUAN", capacidad: 2 },
  { id: "torrecilla", nombre: "Torrecilla", legacy: "TORRECILLA", capacidad: 2 },
  { id: "virgen-paloma", nombre: "Virgen de la Paloma", legacy: "VIRGEN DE LA PALOMA", capacidad: 2 },
  { id: "valencia", nombre: "Valencia", legacy: "VALENCIA", capacidad: 2 },
  { id: "olivar", nombre: "Olivar", legacy: "OLIVAR", capacidad: 2 },
  { id: "infante", nombre: "Infante", legacy: "INFANTE", capacidad: 2 },
  { id: "zurbano", nombre: "Zurbano", legacy: "ZURBANO", capacidad: 4 },
  { id: "robledo", nombre: "Robledo", legacy: "ROBLEDO", capacidad: 6 },
  { id: "mostenses", nombre: "Mostenses", legacy: "MOSTENSES", capacidad: 2 },
  { id: "antonio-lopes", nombre: "Antonio Lopes", legacy: "ANTONIO LOPES", capacidad: 2 },
];

export const GRUPOS = [
  { key: "acceso", label: "Accesos" },
  { key: "tecnologia", label: "Tecnología y mandos" },
  { key: "clima", label: "Climatización" },
  { key: "cocina", label: "Cocina" },
  { key: "menaje", label: "Menaje" },
  { key: "bano", label: "Baño" },
  { key: "exterior", label: "Exterior" },
  { key: "lavanderia", label: "Limpieza y lavandería" },
];

export const FRECUENCIAS = ["Semanalmente", "Quincenalmente", "Mensualmente"];

export const RESPONSABLES = ["Joaquín", "Vanessa", "Nanda", "Oscar", "Piney"];

export const URGENCIAS = [
  { value: "alta", label: "Alta", chip: "bg-bad-soft text-bad", bar: "bg-bad", dot: "bg-bad" },
  { value: "media", label: "Media", chip: "bg-warn-soft text-warn", bar: "bg-warn", dot: "bg-warn" },
  { value: "baja", label: "Baja", chip: "bg-ok-soft text-ok", bar: "bg-ok", dot: "bg-ok" },
];

export const urgencia = (v) => URGENCIAS.find((u) => u.value === v) || URGENCIAS[1];

const BASE = [
  [1, "Llaves", "2 llaves + 2 tarjetas", "acceso"],
  [2, "App Yacan Smart", "Tiene suficiente batería", "acceso"],
  [3, "WIFI / Router", "Conectarse a la red y comprobar que funciona", "tecnologia"],
  [4, "Mando de TV", "Comprobar que enciende y funciona", "tecnologia"],
  [5, "Mando de AA", "Comprobar que enciende y funciona", "tecnologia"],
  [6, "Secador de pelo", "Comprobar que enciende y funciona", "tecnologia"],
  [7, "Aire acondicionado", "Comprobar que enfría o calienta según la estación. Probarlo y apagarlo al salir.", "clima"],
  [8, "Plancha", "Comprobar que se enciende y que no tiene manchas de quemaduras", "menaje"],
  [9, "Placa de inducción", "Comprobar que enciende y que no está bloqueada", "cocina"],
  [10, "Hervidor", "Comprobar que funciona y que queda vacío", "cocina"],
  [11, "Tostadora", "Que no haya migas y que encienda sin saltar el diferencial", "cocina"],
  [12, "Aspiradora", "Aspira correctamente", "lavanderia"],
  [13, "Horno", "Comprobar que enciende y que no tiene restos de comida", "cocina"],
  [14, "Microondas", "Comprobar que funciona y que no tiene restos de comida", "cocina"],
  [15, "Balcón", "Sin restos de cigarrillos", "exterior"],
  [16, "Terraza", "Sin restos de cigarrillos", "exterior"],
  [17, "Iluminación", "Encienden todas las luces de techo y las lámparas de mesa", "tecnologia"],
  [18, "Cafetera Nespresso", "Funciona y sin restos de cápsulas", "cocina"],
  [19, "Estores", "Funcionan correctamente", "tecnologia"],
  [20, "Lavadora", "Tirador en buen estado, puerta y goma secas y limpias", "lavanderia"],
  [21, "Lavavajillas", "Vacío y abierto", "cocina"],
  [22, "Tazas", "Mínimo 6 comensales", "menaje"],
  [23, "Vasos", "Mínimo 6", "menaje"],
  [24, "Copas de vino", "Mínimo 6", "menaje"],
  [25, "Cubertería", "Mínimo 6 comensales", "menaje"],
  [26, "Vajilla", "Mínimo 6 comensales", "menaje"],
  [27, "Campana extractora", "Comprobar que funciona", "cocina"],
  [28, "Ollas", "En buen estado", "menaje"],
  [29, "Sartenes", "En buen estado", "menaje"],
  [30, "Dosificadores baño y ducha", "Rellenar por encima de la mitad", "bano"],
  [31, "Desagües de lavabo y ducha", "Hacer correr el agua", "bano"],
];

const ROBLEDO = [
  [32, "Barbacoa · restos de comida", "Sin restos de comida", "exterior"],
  [33, "Barbacoa · gas", "Comprobar que tiene gas", "exterior"],
  [34, "Sombrillas", "Comprobar que se abren", "exterior"],
  [35, "Hamacas", "Que no estén rotas ni manchadas", "exterior"],
];

export const ITEMS = [...BASE, ...ROBLEDO].map(([id, nombre, observacion, grupo]) => ({
  id,
  nombre,
  observacion,
  grupo,
}));

export const itemsDe = (apartamentoId) =>
  apartamentoId === "robledo" ? ITEMS : ITEMS.filter((i) => i.id <= 31);

export const apartamentoPorId = (id) => APARTAMENTOS.find((a) => a.id === id) || null;

export const apartamentoPorLegacy = (nombre) =>
  APARTAMENTOS.find(
    (a) => a.legacy.toLowerCase() === String(nombre || "").trim().toLowerCase()
  ) || null;
