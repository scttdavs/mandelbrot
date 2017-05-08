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
    ci: "ci",
    cr: "cr",
    left: "l",
    top: "t",
    right: "r",
    bottom: "b"
  }

  const m = {
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
      ci: parseFloat(helpers.getValue("ci", 0.745)),
      cr: parseFloat(helpers.getValue("cr", -0.123)),
      left: parseFloat(helpers.getValue("l", -width)),
      top: parseFloat(helpers.getValue("t", yMax)),
      right: parseFloat(helpers.getValue("r", width)),
      bottom: parseFloat(helpers.getValue("b", -yMax))
    },
    ctx,
    overlayCtx,
    imgData,
    yPixel: 0, // the Y value of the canvas row we are on, used to track how close we are to being done
    numUpdates: 0, // used for batch updating to only update DOM once per tick
    y: parseFloat(helpers.getValue("t", yMax)), // the max y value of the complex plane
    lastUpdatedAt: 0, // for tracking render time
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
      if (n >= m.state.maxIterations - 1) return [0, 0, 0]; // return black if in fractal

      const value = n / m.state.maxIterations;

      // adjusting hue and value to make colors look better (blue only)
      return m.hsvToRgb(.5 + value / 2, 1, 1 - value);
    },

    getIterations(real, imaginary) {
      let Zr = m.state.julia ? real : 0,
          Zi = m.state.julia ? imaginary : 0,
          tempR,
          tempI,
          n = 0,
          abs = 0,
          Cr = m.state.julia ? m.state.cr : real,
          Ci = m.state.julia ? m.state.ci : imaginary;

      for ( ; n < m.state.maxIterations && abs <= m.state.escapeRadius; n++) {
        tempR = Math.pow(Zr, 2) - Math.pow(Zi, 2) + Cr;
        tempI = 2 * Zr * Zi + Ci;

        Zr = tempR;
        Zi = tempI;
        abs = Math.sqrt(Math.pow(Zr, 2) + Math.pow(Zi, 2));
      }

      return { number: n, absoluteValue: abs };
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
      m.yPixel++; // update canvas row we are on for this iteration

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
        m.totalTime.textContent = `${(Date.now() - m.startTime) / 1000}s`; // TODO make this state change?
        m.startTime = null;
      }
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
      // TODO do I really need this as separate method?
      m.setState(e.state, null, true);
      m.y = e.state.top;
    },

    render(noPushState) {
      if (m.numUpdates !== 0) m.numUpdates--; // only reduce if we've qeued up some updates

      if (m.numUpdates === 0) { // wait till all updates are made
        // update DOM
        for (let prop in m.state) {
          const el = helpers.getEl(prop);
          if (el) {
            const value = m.state[prop];
            if (typeof value === "boolean") {
              el.checked = value;
            } else {
              el.value = value;
            }
          }
        }
        m.draw();
        if (!noPushState) m.pushState();
      }
    },

    setState(id, value, noPushState) {
      if (typeof id === "string") {
        m.numUpdates++;
        m.state[id] = value;

        setTimeout(m.render.bind(this, noPushState), 0);
      } else {
        // object
        for (let prop in id) {
          m.setState(prop, id[prop], noPushState);
        }
      }
    },

    bindListeners() {
      window.addEventListener('popstate', m.onPopState);

      // INPUT CONTROLS
      helpers.getEl("maxIterations").addEventListener("change", (e) => m.setState("maxIterations", parseInt(e.target.value)));
      helpers.getEl("escapeRadius").addEventListener("change", (e) => m.setState("escapeRadius", parseInt(e.target.value)));
      helpers.getEl("color").addEventListener("change", (e) => m.setState("color", e.target.checked));
      helpers.getEl("julia").addEventListener("change", (e) => m.setState("julia", e.target.checked));
      helpers.getEl("ci").addEventListener("change", (e) => m.setState("ci", parseFloat(e.target.value)));
      helpers.getEl("cr").addEventListener("change", (e) => m.setState("cr", parseFloat(e.target.value)));

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
        m.overlayCtx.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
        const x_interval = m.x_interval();
        const y_interval = m.y_interval();
        const top = m.state.top - y_interval * zoomBox[1];

        m.y = top;

        m.setState({
          right: m.state.left + x_interval * zoomBox[2],
          left: m.state.left + x_interval * zoomBox[0],
          bottom: m.state.top - y_interval * zoomBox[3],
          top
        });

        zoomBox = null;
      });
    },

    init() {
      m.bindListeners();
      m.render(true);
      m.pushState(true);
    }
  };

  return {
    helpers,
    m
  };
});
