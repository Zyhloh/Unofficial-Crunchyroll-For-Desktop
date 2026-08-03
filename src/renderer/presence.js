const SEPARATOR = ' • ';
const MAX_TIMESTAMP = 2147483647000;

export const PAGE_SCRAPE_JS = `(function () {
  function metaContent(key) {
    var el = document.querySelector('meta[property="' + key + '"], meta[name="' + key + '"]');
    return el && el.content ? el.content.trim() : null;
  }

  function structuredData() {
    var nodes = [];
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      try {
        var parsed = JSON.parse(scripts[i].textContent);
        nodes = nodes.concat(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (err) {}
    }
    return nodes;
  }

  function byType(nodes, type) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] && nodes[i]['@type'] === type) return nodes[i];
    }
    return null;
  }

  function deepestBreadcrumb(nodes) {
    var best = null;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node || node['@type'] !== 'BreadcrumbList') continue;
      var items = node.itemListElement;
      if (!items || !items.length) continue;
      if (!best || items.length > best.length) best = items;
    }
    return best;
  }

  function textOf(selector) {
    var el = document.querySelector(selector);
    return el && el.textContent ? el.textContent.trim() : null;
  }

  function clean(value) {
    if (!value) return null;
    var out = String(value)
      .replace(/^\\s*watch\\s+/i, '')
      .replace(/\\s*[-|]\\s*(watch on\\s*)?crunchyroll\\s*$/i, '')
      .trim();
    return out || null;
  }

  function stripEpisodePrefix(value) {
    if (!value) return null;
    var out = String(value)
      .replace(/^\\s*(season\\s*\\d+|s\\d+)\\s*\\|\\s*/i, '')
      .replace(/^\\s*E\\d+\\s*-\\s*/i, '')
      .trim();
    return out || null;
  }

  function videoState() {
    var v = document.querySelector('video');
    if (!v) return null;
    var duration = isFinite(v.duration) && v.duration > 0 ? v.duration : null;
    return {
      position: isFinite(v.currentTime) && v.currentTime > 0 ? v.currentTime : 0,
      duration: duration,
      paused: !!v.paused
    };
  }

  var path = location.pathname.toLowerCase();
  var nodes = structuredData();

  if (path.indexOf('/watch/') !== -1) {
    var episode = byType(nodes, 'TVEpisode');
    var videoObject = byType(nodes, 'VideoObject');

    var series = episode && episode.partOfSeries ? episode.partOfSeries.name : null;
    if (!series) {
      var crumbs = deepestBreadcrumb(nodes);
      if (crumbs && crumbs.length > 2) {
        var last = crumbs[crumbs.length - 1];
        series = last && last.name ? last.name : null;
      }
    }
    if (!series) series = clean(textOf('h4[class*="text--"]'));

    var title = videoObject ? videoObject.name : null;
    if (!title && episode) title = stripEpisodePrefix(episode.name);
    if (!title) title = stripEpisodePrefix(metaContent('og:title'));
    if (!title) title = stripEpisodePrefix(clean(textOf('h1.title') || textOf('h1') || document.title));

    return JSON.stringify({
      kind: 'watch',
      series: series || null,
      title: title || null,
      season: episode && episode.partOfSeason ? episode.partOfSeason.seasonNumber : null,
      episode: episode ? episode.episodeNumber : null,
      video: videoState()
    });
  }

  if (path.indexOf('/series/') !== -1) {
    var show = byType(nodes, 'TVSeries');
    var name = clean(show && show.name) ||
      clean(metaContent('og:title')) ||
      clean(textOf('h1')) ||
      clean(document.title);
    return JSON.stringify({ kind: 'series', series: name });
  }

  return JSON.stringify({ kind: null });
})()`;

export function contextFromUrl(url) {
  let path;
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    return { activity: { details: 'Using Crunchyroll', state: 'Watching anime' }, track: null };
  }

  if (path.includes('/watch/')) {
    return { activity: { details: 'Watching something...', state: 'Loading...' }, track: 'watch' };
  }
  if (path.includes('/series/')) {
    return { activity: { details: 'Browsing a series', state: 'Deciding what to watch...' }, track: 'series' };
  }

  const activity =
    (path.includes('/watchlist') && { details: 'Checking their watchlist', state: 'So much to watch, so little time' }) ||
    (path.includes('/discover') && { details: 'Finding something new', state: 'Exploring new anime' }) ||
    (path.includes('/simulcasts') && { details: 'Checking simulcasts', state: 'Keeping up with the latest drops' }) ||
    (path.includes('/history') && { details: 'Looking at watch history', state: 'What did I watch again?' }) ||
    (path.includes('/account') && { details: 'Managing their account', state: 'Settings and stuff' }) ||
    (path.includes('/search') && { details: 'Searching for anime', state: 'Looking for something specific' }) ||
    ((path === '/' || path === '') && { details: 'Browsing Crunchyroll', state: 'On the home page' }) ||
    { details: 'Browsing Crunchyroll', state: 'Exploring anime' };

  return { activity, track: null };
}

function episodeLabel(season, episode) {
  const hasSeason = Number.isFinite(season) && season > 0;
  const hasEpisode = Number.isFinite(episode) && episode > 0;

  if (hasSeason && hasEpisode) return `S${season}E${episode}`;
  if (hasEpisode) return `Episode ${episode}`;
  return null;
}

export function activityFromPage(data) {
  if (!data || !data.kind) return null;

  if (data.kind === 'series') {
    if (!data.series) return null;
    return { details: `Browsing ${data.series}`, state: 'Deciding what to watch...' };
  }

  if (!data.series && !data.title) return null;

  const label = episodeLabel(data.season, data.episode);
  const details = data.series || data.title;
  const descriptors = data.series ? [label, data.title] : [label];
  let state = descriptors.filter(Boolean).join(SEPARATOR) || 'Enjoying the show';

  const activity = { details: `Watching ${details}`, state };
  const video = data.video;

  if (video && video.duration) {
    if (video.paused) {
      activity.state = `Paused${SEPARATOR}${state}`;
    } else {
      const now = Date.now();
      const remaining = Math.max(0, video.duration - video.position);
      const end = now + Math.round(remaining * 1000);
      if (end < MAX_TIMESTAMP) {
        activity.startTimestamp = now - Math.round(video.position * 1000);
        activity.endTimestamp = end;
      }
    }
  }

  return activity;
}
