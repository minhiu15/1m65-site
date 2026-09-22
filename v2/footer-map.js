(function (global) {
  "use strict";

  const SALON_LOCATION = Object.freeze({ lat: 10.7308045, lng: 106.824314 });
  const LEAFLET_CSS = "../leaflet.css?v=1.9.4";
  const LEAFLET_JS = "../leaflet.js?v=1.9.4";
  let leafletRequested = false;

  // Leaflet (~42 KB gzip plus OSM tiles) loads only when the footer map nears the viewport.
  function loadLeafletNear(host) {
    const load = function () {
      if (leafletRequested) return;
      leafletRequested = true;
      let pending = 2;
      const done = function () { if (--pending === 0) init1m65FooterMap(host); };
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = LEAFLET_CSS;
      css.onload = css.onerror = done;
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.onload = done;
      document.head.append(css, script);
    };
    if (typeof IntersectionObserver !== "function") return load();
    const observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      observer.disconnect();
      load();
    }, { rootMargin: "800px 0px" });
    observer.observe(host);
  }

  function init1m65FooterMap(host) {
    if (!host) return null;
    if (!global.L) {
      loadLeafletNear(host);
      return null;
    }
    if (host.__1m65FooterMap) return host.__1m65FooterMap;

    const map = global.L.map(host, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 12,
      maxZoom: 19,
      scrollWheelZoom: true,
    }).setView([SALON_LOCATION.lat, SALON_LOCATION.lng], 15);

    // On mobile Leaflet only loads tiles once a drag ends, so the view shows grey gaps mid-drag.
    // Load while dragging and keep a wider ring of tiles around the view.
    global.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 12,
      maxZoom: 19,
      updateWhenIdle: false,
      keepBuffer: 4,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const markerIcon = global.L.divIcon({
      className: "footer-map__geo-marker",
      html: '<span class="footer-map__pin" aria-hidden="true"></span>',
      iconSize: [58, 65],
      iconAnchor: [29, 65],
    });

    global.L.marker([SALON_LOCATION.lat, SALON_LOCATION.lng], {
      icon: markerIcon,
      interactive: false,
      keyboard: false,
    }).addTo(map);

    host.__1m65FooterMap = map;

    if (typeof ResizeObserver === "function") {
      const resizeObserver = new ResizeObserver(function () {
        map.invalidateSize({ pan: false });
      });
      resizeObserver.observe(host);
    }

    return map;
  }

  global.init1m65FooterMap = init1m65FooterMap;
})(window);
