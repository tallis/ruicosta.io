/* Cloudflare Web Analytics — custom events as synthetic pageviews.
   Fires a pageview to /__event/{name} on key interactions. View counts
   under "Top Pages" filtered by /__event/ in the CF Web Analytics dashboard.
   Requires the beacon to be in SPA mode (data-cf-beacon: { spa: true }). */
(function () {
  if (typeof window === 'undefined') return;

  function track(name) {
    if (!name) return;
    var orig = location.pathname + location.search + location.hash;
    var path = '/__event/' + String(name).toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      .slice(0, 80);
    try {
      history.pushState({ __cfEvent: true }, '', path);
      setTimeout(function () { history.replaceState({}, '', orig); }, 1);
    } catch (_) { /* ignore — pushState can fail in iframes / privacy modes */ }
  }
  // expose for manual calls if needed
  window.track = window.track || track;

  function hostnameSlug(h) {
    return (h || '').replace(/^www\./, '').replace(/[^a-z0-9.-]/gi, '');
  }

  // Click delegation: mailto, tel, outbound, in-page nav.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href) return;

    if (href.indexOf('mailto:') === 0) {
      var local = href.slice(7).split('@')[0];
      track('email-' + local);
      return;
    }
    if (href.indexOf('tel:') === 0) {
      track('tel-clicked');
      return;
    }
    if (href.charAt(0) === '#' && href.length > 1) {
      track('nav-' + href.slice(1));
      return;
    }
    try {
      var url = new URL(a.href, location.origin);
      if (url.hostname && url.hostname !== location.hostname) {
        track('outbound-' + hostnameSlug(url.hostname));
      }
    } catch (_) { /* relative or javascript: link, ignore */ }
  }, true);

  // Section visibility — fires once per id per page-load.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.isIntersecting && e.target.id && !e.target.dataset.cfSeen) {
          e.target.dataset.cfSeen = '1';
          track('section-' + e.target.id);
        }
      }
    }, { threshold: 0.5, rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('article[id], section[id]').forEach(function (el) {
      io.observe(el);
    });
  }

  // Scroll depth: fires at 50% and 90%.
  var milestones = [50, 90];
  var fired = {};
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var doc = document.documentElement;
      var pct = Math.round((window.scrollY + window.innerHeight) / doc.scrollHeight * 100);
      for (var i = 0; i < milestones.length; i++) {
        var m = milestones[i];
        if (pct >= m && !fired[m]) {
          fired[m] = 1;
          track('scroll-' + m);
        }
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
