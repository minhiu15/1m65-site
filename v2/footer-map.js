(function (global) {
  "use strict";

  const SALON_LOCATION = Object.freeze({ lat: 10.7308045, lng: 106.824314 });

  function init1m65FooterMap(host) {
    if (!host || !global.L) return null;
    if (host.__1m65FooterMap) return host.__1m65FooterMap;

    const map = global.L.map(host, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 12,
      maxZoom: 19,
      scrollWheelZoom: true,
    }).setView([SALON_LOCATION.lat, SALON_LOCATION.lng], 15);

    global.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 12,
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const markerIcon = global.L.divIcon({
      className: "footer-map__geo-marker",
      html: '<span class="footer-map__pin" aria-hidden="true"><img src="assets/footer/footer_map_pin_label.webp" alt="" width="149" height="68" decoding="async"></span>',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
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
