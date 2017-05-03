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
    imgData,

    getColor(iterations) {
      // if (iterations[0] === 80) return 255;
      return 255 - (iterations / m.maxIterations * 255);
    },

    getIterations(real, imaginary) {
      let Zr = 0,
          Zi = 0,
          Tr = 0,
          Ti = 0,
          n  = 0;

      for ( ; n < m.maxIterations && (Tr + Ti) <= m.escapeRadius; ++n) {
        Zi = 2 * Zr * Zi + imaginary;
        Zr = Tr - Ti + real;
        Tr = Zr * Zr;
        Ti = Zi * Zi;
      }

      return n;
    },

    draw() {
      let yPixel = 0
      for (let y = m.boundaries.top; y >= m.boundaries.bottom; y -= m.y_interval) {
        let offset = 0;
        yPixel++;

        // build line of pixel data to render
        for(let x = m.boundaries.left; x <= m.boundaries.right; x += m.x_interval) {
          const iterations = m.getIterations(x, y);
          const color = m.getColor(iterations);

          m.imgData.data[offset++] = color;
          m.imgData.data[offset++] = color;
          m.imgData.data[offset++] = color;
          m.imgData.data[offset++] = 255;
        }

        // render it
        m.ctx.putImageData(imgData, 0, yPixel);
      }
    },

    bindListeners() {
      // INPUT CONTROLS
      document.getElementById("maxIterations").addEventListener("change", (e) => {
        m.maxIterations = e.target.value;
        m.draw();
      });

      document.getElementById("escapeRadius").addEventListener("change", (e) => {
        m.escapeRadius = e.target.value;
        m.draw();
      });

      // DRAG ZOOMING
      let zoomBox = null;
      const canvasOverlayCtx = canvasOverlay.getContext("2d");

      canvasOverlay.addEventListener("mousedown", (e) => {
        zoomBox = [e.clientX, e.clientY, 0, 0];
      });

      canvasOverlay.addEventListener("mousemove", (e) => {
        if (zoomBox) {
          canvasOverlayCtx.lineWidth = 1;
          canvasOverlayCtx.strokeStyle = '#FF00FF';

          // clear out old box first
          canvasOverlayCtx.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);

          // draw new box keeping aspect ratio
          zoomBox[2] = e.clientX;
          zoomBox[3] = zoomBox[1] + ((e.clientX - zoomBox[0]) / ratio);

          canvasOverlayCtx.strokeRect(zoomBox[0], zoomBox[1], zoomBox[2] - zoomBox[0], zoomBox[3] - zoomBox[1]);
        }
      });

      canvasOverlay.addEventListener("mouseup", (e) => {
        m.boundaries = {
          left: m.boundaries.left + m.x_interval * zoomBox[0],
          right: m.boundaries.left + m.x_interval * zoomBox[2],
          top: m.boundaries.top - m.y_interval * zoomBox[1],
          bottom: m.boundaries.top - m.y_interval * zoomBox[3]
        };
        m.x_interval = Math.abs(m.boundaries.left - m.boundaries.right) / canvas.width;
        m.y_interval = Math.abs(m.boundaries.top - m.boundaries.bottom) / canvas.height;

        zoomBox = null;
        canvasOverlayCtx.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
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
