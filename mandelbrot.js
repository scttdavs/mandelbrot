"use strict";

!function (name, context, definition) {
  if (typeof define == 'function') define(definition);
  else if (typeof module != 'undefined') module.exports = definition();
  else context[name] = definition();
}('mandlebrot', this, () => {
  /*
   * Initialize canvas
   */
  const canvas = document.getElementById("canvas");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const yMax = 1.2;

  const width = yMax * (canvas.width / canvas.height); // -2 to 2

  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(canvas.width, 1);

  const x_interval = width * 2 / canvas.width; // -2 to 2
  const y_interval = yMax * 2 / canvas.height; // -2 to 2

  const m = {
    maxIterations: 50,
    escapeRadius: 5,
    ctx,
    imgData,

    complexNumber(real, imaginary) {
      return {
        real,
        imaginary
      };
    },

    getColor(iterations) {
      // if (iterations[0] === 80) return 255;
      return 255 - (iterations / m.maxIterations * 255);
    },

    getIterations(c) {
      let Zr = 0,
          Zi = 0,
          Tr = 0,
          Ti = 0,
          n  = 0;

      for ( ; n < m.maxIterations && (Tr + Ti) <= m.escapeRadius; ++n) {
        Zi = 2 * Zr * Zi + c.imaginary;
        Zr = Tr - Ti + c.real;
        Tr = Zr * Zr;
        Ti = Zi * Zi;
      }

      return n;
    },

    draw() {
      let yPixel = 0
      for (let y = yMax; y >= -yMax; y -= y_interval) {
        let offset = 0;
        yPixel++;

        // build line of pixel data to render
        for(let x = -width; x <= width; x += x_interval) {
          const iterations = m.getIterations(m.complexNumber(x, y));

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
      document.getElementById("maxIterations").addEventListener("change", (e) => {
        m.maxIterations = e.target.value;
        m.draw();
      });

      document.getElementById("escapeRadius").addEventListener("change", (e) => {
        m.escapeRadius = e.target.value;
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
