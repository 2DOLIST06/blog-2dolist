import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeInternalLinking, extractLinksFromHtml, normalizeInternalUrl } from '../lib/admin/linking-analysis.ts';

test('extrait les href réels, les ancres et les images liées', () => {
  assert.deepEqual(extractLinksFromHtml('<a href="/a">  Premier <b>lien</b> </a><a href="/b"><img alt="Visuel"></a>'), [
    { anchor: 'Premier lien', href: '/a' },
    { anchor: '[Image : Visuel]', href: '/b' }
  ]);
});

test('normalise les variantes internes sans modifier le href extrait', () => {
  assert.equal(normalizeInternalUrl('/articles/test/?utm_source=x#titre'), 'https://blog.2dolist.fr/articles/test');
  assert.equal(normalizeInternalUrl('http://blog.2dolist.fr/articles/test/'), 'https://blog.2dolist.fr/articles/test');
  assert.equal(normalizeInternalUrl('https://www.2dolist.fr/activites/test/?x=1'), 'https://2dolist.fr/activites/test');
  assert.equal(normalizeInternalUrl('https://example.com/test'), undefined);
  assert.equal(normalizeInternalUrl('#titre'), undefined);
  assert.equal(normalizeInternalUrl('mailto:test@example.com'), undefined);
  assert.equal(normalizeInternalUrl('tel:+331234'), undefined);
});

test('calcule entrants, sortants, occurrences et ancres distinctes', () => {
  const [target, source] = analyzeInternalLinking([
    { id: 'target', type: 'post', title: 'Cible', url: '/articles/cible', locale: 'fr' },
    { id: 'source', type: 'post', title: 'Source', url: '/articles/source', locale: 'fr', html: [
      '<a href="/articles/cible">Ancre A</a>',
      '<a href="https://blog.2dolist.fr/articles/cible/">Ancre A</a>',
      '<a href="/articles/cible#detail">Ancre B</a>',
      '<a href="https://www.2dolist.fr/activite">Commercial</a>',
      '<a href="https://example.com">Externe</a>'
    ].join('') }
  ]);
  assert.equal(target.incomingCount, 3);
  assert.equal(target.incoming.length, 2);
  assert.deepEqual(target.incoming.map((item) => [item.anchor, item.occurrences]), [['Ancre A', 2], ['Ancre B', 1]]);
  assert.equal(source.outgoingCount, 4);
  assert.equal(source.outgoing.length, 3);
  assert.equal(source.outgoing[0].href, '/articles/cible');
});

test('gère un contenu sans lien', () => {
  const [page] = analyzeInternalLinking([{ id: 'empty', type: 'post', title: 'Vide', url: '/articles/vide', html: '<p>Texte</p>', locale: 'fr' }]);
  assert.equal(page.incomingCount, 0);
  assert.equal(page.outgoingCount, 0);
});
