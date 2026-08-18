import {
  buildFilter,
  buildText,
  decodeVector,
  encodeVector,
  objectIdFromPointId,
  pointId,
} from './vector.helpers.js';

describe('point ids', () => {
  // If this mapping is not bijective the orphan sweep deletes live quests,
  // which is exactly the failure that stays invisible until the index is empty.
  it('round-trips a Mongo ObjectId through the Qdrant UUID form', () => {
    const ids = [
      '6a833d436cd406efbf4f3b6b',
      '000000000000000000000000',
      'ffffffffffffffffffffffff',
    ];
    for (const id of ids) {
      expect(objectIdFromPointId(pointId(id))).toBe(id);
    }
  });

  it('produces a valid UUID shape', () => {
    expect(pointId('6a833d436cd406efbf4f3b6b')).toBe(
      '6a833d43-6cd4-06ef-bf4f-3b6b00000000',
    );
    expect(pointId('6a833d436cd406efbf4f3b6b')).toMatch(
      /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/,
    );
  });

  it('is stable — the same quest always maps to the same point', () => {
    expect(pointId('6a833d436cd406efbf4f3b6b')).toBe(
      pointId('6a833d436cd406efbf4f3b6b'),
    );
  });
});

describe('vector codec', () => {
  it('survives a base64 round-trip at float32 precision', () => {
    const vector = Array.from({ length: 1024 }, (_, i) => Math.sin(i) * 0.031);
    const decoded = decodeVector(encodeVector(vector));

    expect(decoded).toHaveLength(1024);
    decoded.forEach((v, i) => expect(v).toBeCloseTo(vector[i], 6));
  });

  it('encodes 4 bytes per dimension', () => {
    const encoded = encodeVector(Array.from({ length: 1024 }, () => 0.5));
    expect(Buffer.from(encoded, 'base64').byteLength).toBe(1024 * 4);
  });

  it('handles negative values and zeros', () => {
    const vector = [-1, 0, 1, -0.0001, 0.9999];
    decodeVector(encodeVector(vector)).forEach((v, i) =>
      expect(v).toBeCloseTo(vector[i], 6),
    );
  });
});

describe('buildText', () => {
  it('embeds title, description and address — but not the category', () => {
    const text = buildText({
      title: 'Kiez-Putztag',
      description: 'Müll sammeln im Park',
      address: 'Volkspark Friedrichshain',
    });
    expect(text).toBe(
      'Kiez-Putztag\nMüll sammeln im Park\nVolkspark Friedrichshain',
    );
    expect(text).not.toContain('Kategorie');
  });

  it('skips a missing address instead of leaving a blank line', () => {
    expect(buildText({ title: 'A', description: 'B' })).toBe('A\nB');
  });
});

describe('buildFilter', () => {
  const clauses = (opts: Parameters<typeof buildFilter>[0]) =>
    (buildFilter(opts)?.must ?? []) as Record<string, any>[];

  it('hides completed and side quests by default', () => {
    const must = clauses({});
    expect(must).toContainEqual({
      key: 'completed',
      match: { value: false },
    });
    expect(must).toContainEqual({
      key: 'isSideQuest',
      match: { value: false },
    });
  });

  it('lets both be opted back in', () => {
    const must = clauses({ includeCompleted: true, includeSideQuests: true });
    expect(must.some((c) => c.key === 'completed')).toBe(false);
    expect(must.some((c) => c.key === 'isSideQuest')).toBe(false);
  });

  it('converts the radius from kilometers to meters', () => {
    const geo = clauses({ lat: 52.52, lng: 13.405, radius: 2.5 }).find(
      (c) => c.key === 'location',
    );
    expect(geo?.geo_radius).toEqual({
      center: { lat: 52.52, lon: 13.405 },
      radius: 2500,
    });
  });

  it('ignores a radius without coordinates', () => {
    expect(clauses({ radius: 5 }).some((c) => c.key === 'location')).toBe(
      false,
    );
  });

  it('always excludes expired quests, keeping the never-expiring ones', () => {
    const should = clauses({}).find((c) => c.should)?.should as {
      key: string;
      match?: { value: number };
      range?: { gte: number };
    }[];
    expect(should).toContainEqual({ key: 'expiresAt', match: { value: 0 } });
    expect(should[1].range?.gte).toBeGreaterThan(1_700_000_000);
  });

  it('passes categories through as an any-match', () => {
    expect(clauses({ categories: ['sport', 'social'] })).toContainEqual({
      key: 'category',
      match: { any: ['sport', 'social'] },
    });
  });
});
