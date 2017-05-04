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
  overlayCtx.lineWidth = 2;
  overlayCtx.strokeStyle = '#FF00FF';
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(canvas.width, 1);

  const x_interval = width * 2 / canvas.width; // -2 to 2
  const y_interval = yMax * 2 / canvas.height; // -2 to 2

  const m = {
    maxIterations: 50,
    escapeRadius: 5,
    y_interval,
    x_interval,
    boundaries: {
      top: yMax,
      right: width,
      bottom: -yMax,
      left: -width
    },
    ctx,
    overlayCtx,
    imgData,
    yPixel: 0,
    y: yMax,
    color: false,
    lastUpdatedAt: 0,
    progressBar: document.getElementById("progressBar"),
    totalTime: document.getElementById("totalTime"),

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
      // grayscale
      if (!m.color) {
        const value = 255 - (iterations / m.maxIterations * 255)
        return [value, value, value];
      }

      // color
      if (iterations === 1) return [255, 255, 255];
      if (iterations === m.maxIterations) return [0, 0, 0];

      const value = iterations / m.maxIterations;

      return m.hsvToRgb(.5 + value / 2, 1, 1 - value);
    },

    getIterations(real, imaginary) {
      let Zr = 0,
          Zi = 0,
          Tr = 0,
          Ti = 0,
          n  = 0,
          max = m.maxIterations,
          escape = m.escapeRadius;

      for ( ; n < max && (Tr + Ti) <= escape; n++) {
        Zi = 2 * Zr * Zi + imaginary;
        Zr = Tr - Ti + real;
        Tr = Zr * Zr;
        Ti = Zi * Zi;
      }

      return n;
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
      // build line of pixel data to render
      for(; x <= m.boundaries.right; x += m.x_interval) {
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

      m.drawSingleLine(m.boundaries.left);
      m.ctx.putImageData(imgData, 0, m.yPixel);
      m.y -= m.y_interval

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
        m.y = m.boundaries.top;
        m.lastUpdatedAt = 0;
        m.yPixel = 0;
        m.updateProgressLine();
        m.totalTime.textContent = `${(Date.now() - m.startTime) / 1000}s`;
        m.startTime = null;
      }
    },

    bindListeners() {
      // INPUT CONTROLS
      document.getElementById("maxIterations").addEventListener("change", (e) => {
        m.maxIterations = parseInt(e.target.value);
        m.draw();
      });

      document.getElementById("escapeRadius").addEventListener("change", (e) => {
        m.escapeRadius = parseInt(e.target.value);
        m.draw();
      });

      document.getElementById("color").addEventListener("change", (e) => {
        m.color = e.target.checked;
        m.draw();
      });

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
        m.boundaries = {
          left: m.boundaries.left + m.x_interval * zoomBox[0],
          right: m.boundaries.left + m.x_interval * zoomBox[2],
          top: m.boundaries.top - m.y_interval * zoomBox[1],
          bottom: m.boundaries.top - m.y_interval * zoomBox[3]
        };
        m.y = m.boundaries.top;
        m.x_interval = Math.abs(m.boundaries.left - m.boundaries.right) / canvasOverlay.width;
        m.y_interval = Math.abs(m.boundaries.top - m.boundaries.bottom) / canvasOverlay.height;

        zoomBox = null;
        m.overlayCtx.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
        m.draw();
      });
    },

    init() {
      m.bindListeners();
      m.draw();
    }
  };

  return m;
});
