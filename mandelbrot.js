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

  const width = 2 * (canvas.width / canvas.height); // -2 to 2

  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(canvas.width, 1);

  const x_interval = width * 2 / canvas.width; // -2 to 2
  const y_interval = 4 / canvas.height; // -2 to 2

  const m = {
    ctx,
    imgData,

    square(value) {
      return Math.pow(value, 2);
    },

    absValue(complexNumber) {
      return Math.sqrt(m.square(complexNumber.real) + m.square(complexNumber.imaginary));
    },

    complexNumber(real, imaginary) {
      return {
        real,
        imaginary
      };
    },

    getAlpha(iterations) {
      return iterations / 80 * 255;
    },

    // z^2 + c
    // (zR^2 - zI^2, 2 * zR * zI) + (cR, cI)
    getZ(z, c) {
      // console.time("z");
      const ret = m.complexNumber(m.square(z.real) - m.square(z.imaginary) + c.real, 2 * z.real * z.imaginary + c.imaginary);
      // console.timeEnd("z");
      return ret;
    },

    getIterations(c, escapeRadius, maxIterations) {
      let Zr = 0;
      let Zi = 0;
      let Tr = 0;
      let Ti = 0;
      let n  = 0;

      for ( ; n < maxIterations && (Tr + Ti) <= escapeRadius; ++n) {
        Zi = 2 * Zr * Zi + c.imaginary;
        Zr = Tr - Ti + c.real;
        Tr = Zr * Zr;
        Ti = Zi * Zi;
      }

      return n;
    },

    draw() {
      let yPixel = 0
      for (let y = 2; y >= -2; y -= y_interval) {
        let offset = 0;
        yPixel++;

        // build line of pixel data to render
        // console.time("oneline");
        for(let x = -width; x <= width; x += x_interval) {
          // console.time("iterations");
          const iterations = m.getIterations(m.complexNumber(x, y), 10, 80);
          // console.timeEnd("iterations");

          m.imgData.data[offset++] = 0;
          m.imgData.data[offset++] = 0;
          m.imgData.data[offset++] = 0;
          m.imgData.data[offset++] = m.getAlpha(iterations);
        }
        // console.timeEnd("oneline");
        // render it
        // setTimeout(() => ctx.putImageData(imgData, 0, y), 0);
        m.ctx.putImageData(imgData, 0, yPixel);
        // console.log(imgData);
      }
    }
  };

  // const getIterations = (c, maxIterations) => {
  //   const escapeValue = 2; // 2 is our outer range
  //   let iterations = 0;
  //   let z = getZ(complexNumber(0, 0), c);
  //
  //   while(absValue(z) <= escapeValue && iterations < maxIterations) {
  //     // console.log(z, absValue(z));
  //     z = getZ(z, c);
  //     iterations++;
  //   }
  //
  //   // console.log(iterations);
  //   return iterations;
  // }

  return m;
});
