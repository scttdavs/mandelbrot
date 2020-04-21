// This exports an add function.
// It takes in two 32-bit integer values
// And returns a 32-bit integer value.
export function add(a: i32, b: i32): i32 {
    return a + b;
}

export function myExportedFunctionThatTakesAString(value: string): string {
    return "AsBind: " + value;
}

export function getColor(
    iterations: i32,
    absoluteValue: i32,
    maxIterations: i32,
    color: i8): Float64Array {
    // smooth color by adjusting iteration count
    const n = iterations - Math.log2(Math.log2(absoluteValue));
    const data: Float64Array = new Float64Array(3);

    // grayscale
    if (color !== 1) {
        const value: f64 = 255 - (n / maxIterations * 255);
        data[0] = value; data[1] = value; data[2] = value;
        return data;
    }

    // // color
    const value: f64 = n / maxIterations;

    // // adjusting hue and value to make colors look better (blue only)
    const colors: Float64Array = hsvToRgb(Math.abs(value), 1, 1 - value);

    data[0] = colors[0];
    data[1] = colors[1];
    data[2] = colors[2];

    return data;
}

// https://gist.github.com/mjackson/5311256#file-color-conversion-algorithms-js-L119
export function hsvToRgb(h: f64, s: f64, v: f64): Float64Array {
    const data = new Float64Array(3);
    let r: f64, g: f64, b: f64;

    const i: f64 = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (<u32>i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
        default: r = v, g = p, b = q; // need some sore of default
    }

    data[0] = r * 255;
    data[1] = g * 255;
    data[2] = b * 255;

    return data;
}
