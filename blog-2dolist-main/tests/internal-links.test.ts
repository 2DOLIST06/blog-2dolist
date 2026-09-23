import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyHref, groupLinkOccurrences, normalizeAnchor } from '../lib/admin/internal-links.ts';

test('normalise uniquement les espaces et conserve la casse et les accents', () => {
  assert.equal(normalizeAnchor('  Saut\n  Éclair  '), 'Saut Éclair');
});

test('regroupe strictement ancre normalisée et href brut nettoyé', () => {
  const groups = groupLinkOccurrences([
    { anchor: 'saut   en parachute', href: '/articles/foo', kind: 'internal', documentIndex: 0 },
    { anchor: 'saut en parachute', href: ' /articles/foo ', kind: 'internal', documentIndex: 1 },
    { anchor: 'Parachutisme', href: '/articles/foo', kind: 'internal', documentIndex: 2 },
    { anchor: 'saut en parachute', href: '/articles/foo/', kind: 'internal', documentIndex: 3 }
  ]);
  assert.equal(groups.length, 3);
  assert.deepEqual(groups[0].occurrenceIndexes, [0, 1]);
});

test('classe les formes de liens sans résoudre leur URL', () => {
  assert.equal(classifyHref('/articles/foo'), 'internal');
  assert.equal(classifyHref('https://example.com'), 'external');
  assert.equal(classifyHref('https://blog.2dolist.fr/articles/foo'), 'internal');
  assert.equal(classifyHref('https://www.2dolist.fr/activite/foo'), 'internal');
  assert.equal(classifyHref('#section'), 'fragment');
  assert.equal(classifyHref('mailto:test@example.com'), 'mailto');
  assert.equal(classifyHref('tel:+331234'), 'tel');
});
