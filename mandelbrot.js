"use strict";

!function (name, context, definition) {
  if (typeof define == 'function') define(definition);
  else if (typeof module != 'undefined') module.exports = definition();
  else context[name] = definition();
}('mandlebrot', this, () => {
  const mandelbrot = {};

  const getEl = (id) => document.getElementById(id);

  /*
   * Initialize canvas
   */
  const canvas = getEl("canvas");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const width = 2 * (canvas.width / canvas.height); // -2 to 2

  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(canvas.width, 1);

  const x_interval = width * 2 / canvas.width; // -2 to 2
  const y_interval = 4 / canvas.height; // -2 to 2

  const square = (value) => Math.pow(value, 2);

  const absValue = (complexNumber) => {
    return Math.sqrt(square(complexNumber.real) + square(complexNumber.imaginary));
  }

  const complexNumber = (real, imaginary) => ({
    real,
    imaginary
  });

  // z^2 + c
  // (zR^2 - zI^2, 2 * zR * zI) + (cR, cI)
  const getZ = (z, c) => {
    console.time("z");
    const ret = complexNumber(square(z.real) - square(z.imaginary) + c.real, 2 * z.real * z.imaginary + c.imaginary);
    console.timeEnd("z");
    return ret;
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

  function getIterations(c, escapeRadius, maxIterations)
  {
    var Zr = 0;
    var Zi = 0;
    var Tr = 0;
    var Ti = 0;
    var n  = 0;

    for ( ; n<maxIterations && (Tr+Ti)<=escapeRadius; ++n ) {
      Zi = 2 * Zr * Zi + c.imaginary;
      Zr = Tr - Ti + c.real;
      Tr = Zr * Zr;
      Ti = Zi * Zi;
    }

    return n;
  }

  const getAlpha = (iterations) => {
    // if (iterations == 80) return 0;
    return iterations / 80 * 255;
  }

  let yPixel = 0
  for (let y = 2; y >= -2; y -= y_interval) {
    let offset = 0;
    yPixel++;

    // build line of pixel data to render
    console.time("oneline");
    for(let x = -width; x <= width; x += x_interval) {
      // console.time("iterations");
      const iterations = getIterations(complexNumber(x, y), 10, 80);
      // console.timeEnd("iterations");

      imgData.data[offset++] = 0;
      imgData.data[offset++] = 0;
      imgData.data[offset++] = 0;
      imgData.data[offset++] = getAlpha(iterations);
    }
    console.timeEnd("oneline");
    // render it
    // setTimeout(() => ctx.putImageData(imgData, 0, y), 0);
    ctx.putImageData(imgData, 0, yPixel);
    console.log(imgData);
  }

  return mandelbrot;
});
