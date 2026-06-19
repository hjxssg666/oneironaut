/**
 * 3D FBM (分形布朗运动) 噪声函数
 * 用于生成自然有机的粒子分布、漩涡泡沫结构
 */

// 简易 3D 值噪声
function noise3D(x: number, y: number, z: number): number {
  const ix = Math.floor(x) & 255;
  const iy = Math.floor(y) & 255;
  const iz = Math.floor(z) & 255;
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const fz = z - Math.floor(z);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  // 哈希排列
  const perm = new Uint8Array(512);
  const p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  for (let i = 0; i < 256; i++) perm[i] = perm[i + 256] = p[i];

  const a = perm[ix] + iy;
  const aa = perm[a] + iz;
  const ab = perm[a + 1] + iz;
  const b = perm[ix + 1] + iy;
  const ba = perm[b] + iz;
  const bb = perm[b + 1] + iz;

  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const grad = (h: number, x: number, y: number, z: number) => {
    const hh = h & 15;
    const u = hh < 8 ? x : y;
    const v = hh < 4 ? y : hh === 12 || hh === 14 ? x : z;
    return ((hh & 1) === 0 ? u : -u) + ((hh & 2) === 0 ? v : -v);
  };

  return lerp(
    lerp(lerp(grad(perm[aa], fx, fy, fz), grad(perm[ba], fx - 1, fy, fz), ux),
         lerp(grad(perm[ab], fx, fy - 1, fz), grad(perm[bb], fx - 1, fy - 1, fz), ux), uy),
    lerp(lerp(grad(perm[aa + 1], fx, fy, fz - 1), grad(perm[ba + 1], fx - 1, fy, fz - 1), ux),
         lerp(grad(perm[ab + 1], fx, fy - 1, fz - 1), grad(perm[bb + 1], fx - 1, fy - 1, fz - 1), ux), uy),
    uz,
  );
}

/**
 * 3D FBM 噪声:多层噪声叠加产生自然结构
 * @param octaves 八度数(推荐 6-8)
 * @param lacunarity 空隙度(推荐 2.0-2.5)
 * @param gain 增益(推荐 0.5-0.6)
 * @returns 归一化值 [0, 1]
 */
export function fbm3D(
  x: number, y: number, z: number,
  octaves = 6,
  lacunarity = 2.3,
  gain = 0.55,
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return (value / maxValue) * 0.5 + 0.5; // 归一化到 [0, 1]
}
