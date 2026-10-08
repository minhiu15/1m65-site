(function (global) {
  "use strict";

  const SALON = Object.freeze([106.824314, 10.7308045]); // [longitude, latitude]
  const MAPLIBRE_CSS = "maplibre-gl.css?v=5.24.0";
  const MAPLIBRE_JS = "maplibre-gl.js?v=5.24.0";
  // OpenFreeMap: free vector tiles drawn from OpenStreetMap, no key. Vector maps stay crisp on phone screens
  // (raster tiles were stretched 3x and looked blurry), and its CDN is reachable from Vietnamese networks that
  // block openstreetmap.org.
  const STYLE = "https://tiles.openfreemap.org/styles/liberty";
  const LOCALE = {
    "CooperativeGesturesHandler.WindowsHelpText": "Giữ Ctrl và lăn chuột để phóng to bản đồ",
    "CooperativeGesturesHandler.MacHelpText": "Giữ ⌘ và lăn chuột để phóng to bản đồ",
    "CooperativeGesturesHandler.MobileHelpText": "Dùng hai ngón tay để di chuyển bản đồ",
  };
  let libraryRequested = false;

  // MapLibre (~280 KB gzip) loads only when the footer map nears the viewport.
  function loadLibraryNear(host) {
    const load = function () {
      if (libraryRequested) return;
      libraryRequested = true;
      let pending = 2;
      const done = function () { if (--pending === 0) init1m65FooterMap(host); };
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = MAPLIBRE_CSS;
      css.onload = css.onerror = done;
      const script = document.createElement("script");
      script.src = MAPLIBRE_JS;
      script.onload = done;
      script.onerror = function () { showStatus(host); };
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

  function showStatus(host) {
    const status = host.parentElement && host.parentElement.querySelector("[data-footer-map-status]");
    if (status) status.hidden = false;
  }

  // The style names places in English first; the salon's customers read the Vietnamese names. Its land and water
  // also take the classic OpenStreetMap colours the footer map has always worn.
  function salonStyle(previous, next) {
    next.layers.forEach(function (layer) {
      const field = layer.layout && layer.layout["text-field"];
      if (field && JSON.stringify(field).indexOf("name_en") !== -1) {
        layer.layout["text-field"] = ["coalesce", ["get", "name"], ["get", "name_en"]];
      }
      if (layer.type === "background") layer.paint = Object.assign({}, layer.paint, { "background-color": "#f2efe9" });
      if (layer.id === "water") layer.paint = Object.assign({}, layer.paint, { "fill-color": "#aad3df" });
      if (/^waterway_/.test(layer.id) && layer.type === "line") layer.paint = Object.assign({}, layer.paint, { "line-color": "#aad3df" });
    });
    return next;
  }

  // +/- in the "Mở trong Google Maps" pill's paper, as a MapLibre control so it sits in the map's corner.
  function zoomControl() {
    let bar = null;
    return {
      onAdd: function (map) {
        bar = document.createElement("div");
        bar.className = "maplibregl-ctrl footer-map__zoom";
        const buttons = [["+", "Phóng to", function () { map.zoomIn(); }], ["−", "Thu nhỏ", function () { map.zoomOut(); }]]
          .map(function (spec) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = spec[0];
            button.title = spec[1];
            button.setAttribute("aria-label", spec[1]);
            button.addEventListener("click", spec[2]);
            bar.append(button);
            return button;
          });
        const update = function () {
          buttons[0].disabled = map.getZoom() >= map.getMaxZoom();
          buttons[1].disabled = map.getZoom() <= map.getMinZoom();
        };
        map.on("zoom", update);
        update();
        return bar;
      },
      onRemove: function () { if (bar) bar.remove(); },
    };
  }

  function init1m65FooterMap(host) {
    if (!host) return null;
    if (!global.maplibregl) {
      loadLibraryNear(host);
      return null;
    }
    if (host.__1m65FooterMap) return host.__1m65FooterMap;

    let map;
    try {
      map = new global.maplibregl.Map({
        container: host,
        center: SALON,
        zoom: 15,
        minZoom: 12,
        maxZoom: 19,
        attributionControl: false,
        // One finger scrolls the page past the map; two fingers (or Ctrl + wheel) move it.
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        maxPitch: 0,
        locale: LOCALE,
      });
    } catch (error) {
      showStatus(host); // no WebGL: the directions link still works
      return null;
    }
    map.setStyle(STYLE, { transformStyle: salonStyle });
    map.touchZoomRotate.disableRotation();

    let loaded = false;
    map.once("load", function () {
      loaded = true;
      const status = host.parentElement && host.parentElement.querySelector("[data-footer-map-status]");
      if (status) status.hidden = true;
    });
    map.on("error", function () { if (!loaded) showStatus(host); });

    map.addControl(zoomControl(), "top-right");

    const pin = document.createElement("div");
    pin.className = "footer-map__geo-marker";
    pin.innerHTML = '<span class="footer-map__pin" aria-hidden="true"></span>';
    new global.maplibregl.Marker({ element: pin, anchor: "bottom" }).setLngLat(SALON).addTo(map);

    host.__1m65FooterMap = map;

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(function () { map.resize(); }).observe(host);
    }

    return map;
  }

  global.init1m65FooterMap = init1m65FooterMap;
})(window);
