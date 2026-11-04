/**
 * Demo data for screenshots and manual tests. Not used in normal builds.
 * The walks follow real places in Berlin, with a small random spread.
 */
import { locations, series } from '../db/schema';
import type { DB } from '../db/types';

type Waypoint = readonly [latitude: number, longitude: number];

const PLACES = {
  brandenburgGate: [52.51627, 13.3777],
  friedrichstrasse: [52.5172, 13.3888],
  bebelplatz: [52.5168, 13.3937],
  lustgarten: [52.519, 13.3995],
  hackescherMarkt: [52.5226, 13.4023],
  alexanderplatz: [52.5219, 13.4132],
  siegessaeule: [52.5145, 13.3501],
  neuerSee: [52.5105, 13.344],
  tiergartenSouth: [52.512, 13.36],
  potsdamerPlatz: [52.5096, 13.3759],
  checkpointCharlie: [52.5075, 13.3904],
  moritzplatz: [52.5034, 13.4108],
  kottbusserTor: [52.4993, 13.4181],
  goerlitzerPark: [52.4965, 13.437],
  oberbaumbruecke: [52.5017, 13.4457],
  eastSideGallery: [52.505, 13.4397],
  ostbahnhof: [52.5103, 13.4348],
  rosaLuxemburgPlatz: [52.5271, 13.4104],
  senefelderplatz: [52.5321, 13.4128],
  kollwitzplatz: [52.5363, 13.4174],
  kulturbrauerei: [52.5392, 13.4129],
  eberswalderStrasse: [52.5413, 13.412],
  mauerpark: [52.5435, 13.4026],
} satisfies Record<string, Waypoint>;

interface DemoWalk {
  route: Array<Waypoint>;
  /** Places where the walk stays a while, which makes a hot spot */
  stops?: Array<{ at: Waypoint; points: number }>;
  repeat?: number;
}

interface DemoSeries {
  name: string;
  date: string;
  walks: Array<DemoWalk>;
}

const DEMO_SERIES: Array<DemoSeries> = [
  {
    name: 'Daily Commute',
    date: '2026-09-28T07:45:00.000Z',
    walks: [
      {
        route: [PLACES.kollwitzplatz, PLACES.senefelderplatz, PLACES.rosaLuxemburgPlatz, PLACES.hackescherMarkt],
        stops: [{ at: PLACES.hackescherMarkt, points: 12 }],
        repeat: 10,
      },
    ],
  },
  {
    name: 'Berlin Mitte - Oct 3, 2026',
    date: '2026-10-03T09:30:00.000Z',
    walks: [
      {
        route: [
          PLACES.brandenburgGate,
          PLACES.friedrichstrasse,
          PLACES.bebelplatz,
          PLACES.lustgarten,
          PLACES.hackescherMarkt,
          PLACES.alexanderplatz,
        ],
        stops: [
          { at: PLACES.lustgarten, points: 25 },
          { at: PLACES.brandenburgGate, points: 15 },
        ],
      },
    ],
  },
  {
    name: 'Tiergarten Runs',
    date: '2026-10-10T06:30:00.000Z',
    walks: [
      {
        route: [
          PLACES.brandenburgGate,
          PLACES.siegessaeule,
          PLACES.neuerSee,
          PLACES.tiergartenSouth,
          PLACES.potsdamerPlatz,
          PLACES.brandenburgGate,
        ],
        repeat: 4,
      },
    ],
  },
  {
    name: 'Kreuzberg - Oct 18, 2026',
    date: '2026-10-18T12:00:00.000Z',
    walks: [
      {
        route: [
          PLACES.checkpointCharlie,
          PLACES.moritzplatz,
          PLACES.kottbusserTor,
          PLACES.goerlitzerPark,
          PLACES.oberbaumbruecke,
          PLACES.eastSideGallery,
          PLACES.ostbahnhof,
        ],
        stops: [
          { at: PLACES.goerlitzerPark, points: 30 },
          { at: PLACES.kottbusserTor, points: 10 },
        ],
      },
    ],
  },
  {
    name: 'Prenzlauer Berg - Oct 25, 2026',
    date: '2026-10-25T10:15:00.000Z',
    walks: [
      {
        route: [
          PLACES.alexanderplatz,
          PLACES.rosaLuxemburgPlatz,
          PLACES.kollwitzplatz,
          PLACES.kulturbrauerei,
          PLACES.eberswalderStrasse,
          PLACES.mauerpark,
        ],
        stops: [
          { at: PLACES.mauerpark, points: 35 },
          { at: PLACES.kollwitzplatz, points: 20 },
        ],
      },
    ],
  },
];

/** Distance between two route points, in meters */
const STEP_METERS = 25;
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

function jitter(point: Waypoint, random: () => number): Waypoint {
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((point[0] * Math.PI) / 180);
  const dLat = ((random() - 0.5) * 2 * SPREAD_METERS) / METERS_PER_DEGREE_LAT;
  const dLng = ((random() - 0.5) * 2 * SPREAD_METERS) / metersPerDegreeLng;
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
      points.push(jitter(stop.at, random));
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
          city: 'Berlin',
          country: 'Germany',
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
