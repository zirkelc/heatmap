/**
 * Demo data for screenshots and manual tests. Not used in normal builds.
 * A weekend city trip to Paris, one series for each day. The walks follow real streets,
 * with a small random spread. The stops make the hot spots, and the parts of the city
 * that the trip does not touch stay empty.
 *
 * The map colors are relative to the densest area of about 2 km. So only the Eiffel Tower
 * has a very large stop and shows red. The other stops are smaller and show orange or
 * yellow, and the walks stay strong enough to show green.
 */
import { locations, series } from '../db/schema';
import type { DB } from '../db/types';

type Waypoint = readonly [latitude: number, longitude: number];

const PLACES = {
  // Arrival: Gare du Nord to the hotel in the Marais
  gareDuNord: [48.8809, 2.3553],
  gareDeLEst: [48.8768, 2.3592],
  canalRecollets: [48.8727, 2.3627],
  republique: [48.8675, 2.3637],
  rueDeBretagne: [48.8631, 2.3622],
  hotel: [48.8597, 2.3641],
  rueDesRosiers: [48.8572, 2.3592],
  // Islands, Latin Quarter and Saint-Germain
  placeDesVosges: [48.8556, 2.3655],
  saintPaul: [48.8551, 2.3608],
  pontMarie: [48.8535, 2.3575],
  ileSaintLouis: [48.8517, 2.3563],
  pontSaintLouis: [48.8527, 2.3527],
  notreDame: [48.853, 2.3497],
  petitPont: [48.8523, 2.3468],
  saintMichel: [48.8534, 2.3441],
  odeon: [48.8521, 2.3387],
  saintGermain: [48.8539, 2.3336],
  rueDuBac: [48.8566, 2.3264],
  orsay: [48.86, 2.3266],
  pontDesArts: [48.8583, 2.3375],
  // Louvre to the Eiffel Tower
  louvre: [48.8611, 2.3358],
  rivoliChatelet: [48.8589, 2.3472],
  hotelDeVille: [48.8566, 2.3522],
  tuileries: [48.8635, 2.3275],
  concorde: [48.8656, 2.3212],
  rondPoint: [48.8691, 2.3098],
  georgeV: [48.8721, 2.3006],
  arcDeTriomphe: [48.8738, 2.295],
  kleber: [48.8676, 2.2922],
  trocadero: [48.8625, 2.2875],
  pontDIena: [48.8601, 2.2925],
  eiffelTower: [48.8584, 2.2945],
  champDeMars: [48.8556, 2.2986],
  ecoleMilitaire: [48.8512, 2.3051],
  // Marais to the Opera and Montmartre
  artsEtMetiers: [48.8656, 2.3561],
  reaumurSebastopol: [48.8663, 2.3522],
  bourse: [48.8687, 2.3412],
  opera: [48.872, 2.3316],
  trinite: [48.8763, 2.3326],
  saintGeorges: [48.8785, 2.3375],
  pigalle: [48.8822, 2.3376],
  abbesses: [48.8845, 2.3384],
  rueLepic: [48.8866, 2.3349],
  moulinDeLaGalette: [48.8874, 2.3366],
  placeDuTertre: [48.8865, 2.3408],
  sacreCoeur: [48.8867, 2.3431],
  squareLouiseMichel: [48.8846, 2.3434],
  anvers: [48.8829, 2.3441],
} satisfies Record<string, Waypoint>;

interface DemoWalk {
  route: Array<Waypoint>;
  /**
   * Places where the walk stays a while, which makes a hot spot. `spread` is the radius in
   * meters, for example the size of a museum or a square.
   */
  stops?: Array<{ at: Waypoint; points: number; spread?: number }>;
  repeat?: number;
}

interface DemoSeries {
  name: string;
  date: string;
  walks: Array<DemoWalk>;
}

const CITY = 'Paris';
const COUNTRY = 'France';

const DEMO_SERIES: Array<DemoSeries> = [
  {
    name: 'Paris - Oct 22, 2026',
    date: '2026-10-22T16:30:00.000Z',
    walks: [
      {
        route: [
          PLACES.gareDuNord,
          PLACES.gareDeLEst,
          PLACES.canalRecollets,
          PLACES.republique,
          PLACES.rueDeBretagne,
          PLACES.hotel,
        ],
      },
      {
        route: [PLACES.hotel, PLACES.rueDesRosiers, PLACES.hotel],
        stops: [{ at: PLACES.rueDesRosiers, points: 80, spread: 20 }],
      },
    ],
  },
  {
    name: 'Paris - Oct 23, 2026',
    date: '2026-10-23T08:30:00.000Z',
    walks: [
      {
        route: [
          PLACES.hotel,
          PLACES.placeDesVosges,
          PLACES.saintPaul,
          PLACES.pontMarie,
          PLACES.ileSaintLouis,
          PLACES.pontSaintLouis,
          PLACES.notreDame,
          PLACES.petitPont,
          PLACES.saintMichel,
          PLACES.odeon,
          PLACES.saintGermain,
          PLACES.rueDuBac,
          PLACES.orsay,
          PLACES.pontDesArts,
        ],
        stops: [
          { at: PLACES.notreDame, points: 180, spread: 20 },
          { at: PLACES.saintGermain, points: 50, spread: 15 },
          { at: PLACES.orsay, points: 100, spread: 20 },
          { at: PLACES.placeDesVosges, points: 50, spread: 20 },
        ],
      },
    ],
  },
  {
    name: 'Paris - Oct 24, 2026',
    date: '2026-10-24T08:00:00.000Z',
    walks: [
      {
        route: [
          PLACES.hotel,
          PLACES.saintPaul,
          PLACES.hotelDeVille,
          PLACES.rivoliChatelet,
          PLACES.louvre,
          PLACES.tuileries,
          PLACES.concorde,
          PLACES.rondPoint,
          PLACES.georgeV,
          PLACES.arcDeTriomphe,
          PLACES.kleber,
          PLACES.trocadero,
          PLACES.pontDIena,
          PLACES.eiffelTower,
          PLACES.champDeMars,
          PLACES.ecoleMilitaire,
        ],
        stops: [
          { at: PLACES.louvre, points: 220, spread: 20 },
          { at: PLACES.arcDeTriomphe, points: 40, spread: 15 },
          { at: PLACES.eiffelTower, points: 700, spread: 20 },
        ],
      },
    ],
  },
  {
    name: 'Paris - Oct 25, 2026',
    date: '2026-10-25T09:00:00.000Z',
    walks: [
      {
        route: [
          PLACES.hotel,
          PLACES.rueDeBretagne,
          PLACES.artsEtMetiers,
          PLACES.reaumurSebastopol,
          PLACES.bourse,
          PLACES.opera,
          PLACES.trinite,
          PLACES.saintGeorges,
          PLACES.pigalle,
          PLACES.abbesses,
          PLACES.rueLepic,
          PLACES.moulinDeLaGalette,
          PLACES.placeDuTertre,
          PLACES.sacreCoeur,
          PLACES.squareLouiseMichel,
          PLACES.anvers,
        ],
        stops: [
          { at: PLACES.abbesses, points: 40, spread: 15 },
          { at: PLACES.placeDuTertre, points: 60, spread: 15 },
          { at: PLACES.sacreCoeur, points: 120, spread: 20 },
        ],
      },
    ],
  },
];

/** Distance between two route points, in meters */
const STEP_METERS = 15;
const METERS_PER_DEGREE_LAT = 111_320;
const SPREAD_METERS = 6;
const SECONDS_PER_POINT = 20;

/**
 * Small deterministic random number generator, so that each seed gives the same picture.
 */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

function jitter(point: Waypoint, random: () => number, spread = SPREAD_METERS): Waypoint {
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((point[0] * Math.PI) / 180);
  const dLat = ((random() - 0.5) * 2 * spread) / METERS_PER_DEGREE_LAT;
  const dLng = ((random() - 0.5) * 2 * spread) / metersPerDegreeLng;
  return [point[0] + dLat, point[1] + dLng];
}

/**
 * Points along a route, one about every STEP_METERS, plus the points of the stops.
 */
export function walkPoints(walk: DemoWalk, random: () => number): Array<Waypoint> {
  const points: Array<Waypoint> = [];

  for (let i = 0; i < walk.route.length - 1; i++) {
    const [fromLat, fromLng] = walk.route[i];
    const [toLat, toLng] = walk.route[i + 1];
    const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((fromLat * Math.PI) / 180);
    const distance = Math.hypot(
      (toLat - fromLat) * METERS_PER_DEGREE_LAT,
      (toLng - fromLng) * metersPerDegreeLng
    );
    const steps = Math.max(1, Math.round(distance / STEP_METERS));
    for (let step = 0; step < steps; step++) {
      const t = step / steps;
      points.push(jitter([fromLat + (toLat - fromLat) * t, fromLng + (toLng - fromLng) * t], random));
    }
  }
  points.push(jitter(walk.route[walk.route.length - 1], random));

  for (const stop of walk.stops ?? []) {
    for (let i = 0; i < stop.points; i++) {
      points.push(jitter(stop.at, random, stop.spread));
    }
  }

  return points;
}

/**
 * Fill an empty database with the demo series. Does nothing if any series exists.
 * Returns the number of created series.
 */
export function seedDemoData(db: DB): number {
  if (db.select({ seriesId: series.seriesId }).from(series).limit(1).get()) {
    return 0;
  }

  const random = createRandom(42);

  db.transaction((tx) => {
    for (const demo of DEMO_SERIES) {
      const points = demo.walks.flatMap((walk) =>
        Array.from({ length: walk.repeat ?? 1 }, () => walkPoints(walk, random)).flat()
      );
      const start = new Date(demo.date).getTime();
      const end = new Date(start + points.length * SECONDS_PER_POINT * 1_000).toISOString();

      const created = tx
        .insert(series)
        .values({
          name: demo.name,
          city: CITY,
          country: COUNTRY,
          createdAt: demo.date,
          updatedAt: end,
          isActive: false,
          pointCount: points.length,
        })
        .returning({ seriesId: series.seriesId })
        .get();

      tx.insert(locations)
        .values(
          points.map(([latitude, longitude], i) => ({
            seriesId: created.seriesId,
            latitude,
            longitude,
            accuracy: 10,
            timestamp: new Date(start + i * SECONDS_PER_POINT * 1_000).toISOString(),
            weight: 1,
          }))
        )
        .run();
    }
  });

  return DEMO_SERIES.length;
}
