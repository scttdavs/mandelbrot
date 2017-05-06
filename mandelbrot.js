"use strict";

!function (name, context, definition) {
  if (typeof define == 'function') define(definition);
  else if (typeof module != 'undefined') module.exports = definition();
  else context[name] = definition();
}('mandlebrot', this, () => {
  // INIT CANVAS
  const canvas = document.getElementById("canvas");
  const canvasOverlay = document.getElementById("canvasOverlay");

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvasOverlay.width  = window.innerWidth;
  canvasOverlay.height = window.innerHeight;

  const ratio = canvas.width / canvas.height;

  const yMax = 1.2;
  const width = yMax * (canvas.width / canvas.height); // -2 to 2

  const overlayCtx = canvasOverlay.getContext('2d');
  overlayCtx.lineWidth = 3;
  overlayCtx.strokeStyle = '#FF00FF';
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(canvas.width, 1);

  const helpers = {
    getEl(id) {
      return document.getElementById(id);
    },

    getParams() {
      let params = window.location.search;
      const f = {};
      params.replace("?", "")
            .split("&")
            .map((p) => p.split("="))
            .forEach((p) => f[p[0]] = p[1]);
      return f;
    },

    getValue(param, value, fallback) {
      const params = helpers.getParams();
      return params[param] || value || fallback;
    },

    getBoolean(value) {
      if (typeof value === "string") return value == "true";
      return value;
    }
  };

  const paramMap = {
    maxIterations: "mi",
    escapeRadius: "er",
    color: "co",
    julia: "j",
    c: "c",
    left: "l",
    top: "t",
    right: "r",
    bottom: "b"
  }

  const m = {
    escapeRadius: parseInt(helpers.getValue("er", helpers.getEl("escapeRadius").value, 5)),
    y_interval() {
      return Math.abs(m.state.top - m.state.bottom) / canvasOverlay.height;
    },
    x_interval() {
      return Math.abs(m.state.left - m.state.right) / canvasOverlay.width;
    },
    state: {
      maxIterations: parseInt(helpers.getValue("mi", helpers.getEl("maxIterations").value, 50)),
      escapeRadius: parseInt(helpers.getValue("er", helpers.getEl("escapeRadius").value, 5)),
      color: helpers.getBoolean(helpers.getValue("co", helpers.getEl("color").checked, false)),
      julia: helpers.getBoolean(helpers.getValue("j", helpers.getEl("julia").checked, false)),
      c: [-0.123, 0.745], // TODO update this
      left: parseFloat(helpers.getValue("l", -width)),
      top: parseFloat(helpers.getValue("t", yMax)),
      right: parseFloat(helpers.getValue("r", width)),
      bottom: parseFloat(helpers.getValue("b", -yMax))
    },
    ctx,
    overlayCtx,
    imgData,
    yPixel: 0,
    y: parseFloat(helpers.getValue("t", yMax)),
    lastUpdatedAt: 0,
    totalTime: document.getElementById("totalTime"),

    // https://gist.github.com/mjackson/5311256#file-color-conversion-algorithms-js-L119
    hsvToRgb(h, s, v) {
      let r, g, b;

      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);

      switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
      }

      return [ r * 255, g * 255, b * 255 ];
    },

    getColor(iterations) {
      // smooth color by adjusting iteration count
      const n = iterations.number - Math.log2(Math.log2(iterations.absoluteValue));

      // grayscale
      if (!m.state.color) {
        const value = 255 - (n / m.state.maxIterations * 255)
        return [value, value, value];
      }

      // color
      if (n <= 1) return [255, 255, 255];
      if (n >= m.state.maxIterations - 1) return [0, 0, 0];

      const value = n / m.state.maxIterations;

      // adjusting hue and value to make colors look better (blue only)
      return m.hsvToRgb(.5 + value / 2, 1, 1 - value);
    },

    getIterations(real, imaginary) {
      let Zr = m.state.julia ? real : 0,
          Zi = m.state.julia ? imaginary : 0,
          tempR,
          tempI,
          n  = 0,
          abs = 0,
          max = m.state.maxIterations,
          escape = m.state.escapeRadius,
          Cr = m.state.julia ? m.state.c[0] : real,
          Ci = m.state.julia ? m.state.c[1] : imaginary;

      for ( ; n < max && abs <= escape; n++) {
        tempR = Math.pow(Zr, 2) - Math.pow(Zi, 2) + Cr;
        tempI = 2 * Zr * Zi + Ci;

        Zr = tempR;
        Zi = tempI;
        abs = Math.sqrt(Math.pow(Zr, 2) + Math.pow(Zi, 2));
      }

      return {number: n, absoluteValue: abs};
    },

    updateProgressLine(yPixel) {
      m.overlayCtx.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);

      if (yPixel) {
        m.overlayCtx.beginPath();
        m.overlayCtx.moveTo(0, yPixel);
        m.overlayCtx.lineTo(canvasOverlay.width, yPixel);
        m.overlayCtx.stroke();
      }

    },

    drawSingleLine(x) {
      let offset = 0;
      const x_interval = m.x_interval();
      // build line of pixel data to render
      for(; x <= m.state.right; x += x_interval) {
        const iterations = m.getIterations(x, m.y);
        const color = m.getColor(iterations);

        m.imgData.data[offset++] = color[0];
        m.imgData.data[offset++] = color[1];
        m.imgData.data[offset++] = color[2];
        m.imgData.data[offset++] = 255;
      }
    },

    draw() {
      if (!m.startTime) m.startTime = Date.now();
      m.yPixel++;

      m.drawSingleLine(m.state.left);
      m.ctx.putImageData(imgData, 0, m.yPixel);
      const y_interval = m.y_interval();
      m.y -= y_interval;

      if (m.yPixel <= window.innerHeight) {
        // not done, keep drawing
        if (Date.now() - m.lastUpdatedAt > 200) {
          // throttle updating DOM
          m.lastUpdatedAt = Date.now();
          m.updateProgressLine(m.yPixel);
          // go to next tick so DOM can update
          setTimeout(m.draw, 0);
        } else {
          m.draw();
        }
      } else {
        // done drawing, reset
        m.y = m.state.top;
        m.lastUpdatedAt = 0;
        m.yPixel = 0;
        m.updateProgressLine();
        m.totalTime.textContent = `${(Date.now() - m.startTime) / 1000}s`;
        m.startTime = null;
      }
    },

    getC(value) {
      let values = value.trim().match(/-?(?:\d*\.)?\d+/g);
      return [parseFloat(values[0]), parseFloat(values[1])];
    },

    getParams() {
      const params = [];
      for (let key in m.state) {
        params.push(`${paramMap[key]}=${m.state[key]}`);
      }

      return `?${params.join("&")}`
    },

    pushState(replace) {
      if (replace) {
        history.replaceState(m.state, "Mandelbrot",  m.getParams());
      } else {
        history.pushState(m.state, "Mandelbrot", m.getParams());
      }
    },

    onPopState(e) {
      m.updateState(e.state);
    },

    setState(id, value) {
      m.state[id] = value;
      const el = helpers.getEl(id);
      if (typeof value === "boolean") {
        el.checked = value;
      } else {
        el.value = value;
      }

      m.draw();
      m.pushState();
    },

    bindListeners() {
      window.addEventListener('popstate', m.onPopState);

      // INPUT CONTROLS
      helpers.getEl("maxIterations").addEventListener("change", (e) => m.setState("maxIterations", parseInt(e.target.value)));
      helpers.getEl("escapeRadius").addEventListener("change", (e) => m.setState("escapeRadius", parseInt(e.target.value)));
      helpers.getEl("color").addEventListener("change", (e) => m.setState("color", e.target.checked));
      helpers.getEl("julia").addEventListener("change", (e) => m.setState("julia", e.target.checked));
      helpers.getEl("c").addEventListener("change", (e) => m.setState("c", m.getC(e.target.value)));

      // DRAG ZOOMING
      let zoomBox = null;

      canvasOverlay.addEventListener("mousedown", (e) => {
        zoomBox = [e.clientX, e.clientY, 0, 0];
      });

      canvasOverlay.addEventListener("mousemove", (e) => {
        if (zoomBox) {
          // clear out old box first
          m.overlayCtx.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);

          // draw new box keeping aspect ratio
          zoomBox[2] = e.clientX;
          zoomBox[3] = zoomBox[1] + ((e.clientX - zoomBox[0]) / ratio);

          m.overlayCtx.strokeRect(zoomBox[0], zoomBox[1], zoomBox[2] - zoomBox[0], zoomBox[3] - zoomBox[1]);
        }
      });

      canvasOverlay.addEventListener("mouseup", (e) => {
        // TODO this needs state change logic
        // order is significant here
        const x_interval = m.x_interval();
        const y_interval = m.y_interval();

        m.state.right = m.state.left + x_interval * zoomBox[2];
        m.state.left = m.state.left + x_interval * zoomBox[0];
        m.state.bottom = m.state.top - y_interval * zoomBox[3];
        m.state.top = m.state.top - y_interval * zoomBox[1];

        m.y = m.state.top;

        zoomBox = null;
        m.overlayCtx.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
        m.draw();
        m.pushState();
      });
    },

    updateState(obj = {}) {
      // TODO use setState with dirty logic so it only draws once
      helpers.getEl("color").checked = m.state.color = obj.color;
      helpers.getEl("julia").checked = m.state.julia = obj.julia;
      helpers.getEl("maxIterations").value = m.state.maxIterations = obj.maxIterations;
      helpers.getEl("escapeRadius").value = m.state.escapeRadius = obj.escapeRadius;

      // TODO make function for this?
      m.state.left = obj.left;
      m.state.top = obj.top;
      m.state.right = obj.right;
      m.state.bottom = obj.bottom;
      m.y = m.state.top;

      helpers.getEl("c").value = obj.c; // need to format this first
      m.state.c = obj.c;

      m.draw();
    },

    init() {
      m.bindListeners();
      m.draw();
      m.pushState(true);
    }
  };

  return {
    helpers,
    m
  };
});
