function clampNumber(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function calculateMSE(reference, filtered) {
  if (!Array.isArray(reference) || !Array.isArray(filtered)) return 0;
  const n = Math.min(reference.length, filtered.length);
  if (n === 0) return 0;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const e = reference[i] - filtered[i];
    acc += e * e;
  }
  return acc / n;
}

/**
 * Normalized LMS adaptive FIR.
 *
 * In this app:
 * - `noisy` is treated as the filter input x[n]
 * - `reference` is treated as the desired signal d[n]
 * - output is y[n] = w^T xVec, which should approximate `reference`
 */
export function filterSignalNLMS(noisy, reference, { filterOrder, stepSize, epsilon = 1e-8 }) {
  if (!Array.isArray(noisy) || noisy.length === 0) return [];
  if (!Array.isArray(reference) || reference.length === 0) return [];

  const N = Math.min(noisy.length, reference.length);
  const M = Math.max(1, Math.floor(filterOrder ?? 1));
  const mu = clampNumber(stepSize ?? 0.1, 0, 10);
  const eps = Math.max(1e-12, epsilon);

  const w = new Array(M).fill(0);
  const yFiltered = new Array(N).fill(0);

  for (let n = 0; n < N; n++) {
    // xVec = [x[n], x[n-1], ..., x[n-M+1]]
    let power = eps;
    const xVec = new Array(M);
    for (let k = 0; k < M; k++) {
      const idx = n - k;
      const v = idx >= 0 ? noisy[idx] : 0;
      xVec[k] = v;
      power += v * v;
    }

    // y[n] = w^T xVec
    let y = 0;
    for (let k = 0; k < M; k++) y += w[k] * xVec[k];
    yFiltered[n] = y;

    const d = reference[n];
    const e = d - y;

    // w = w + (mu * e / power) * xVec
    const gain = (mu * e) / power;
    for (let k = 0; k < M; k++) w[k] += gain * xVec[k];
  }

  return yFiltered;
}

/**
 * RLS adaptive FIR (FIR system identification / supervised learning form).
 *
 * In this app:
 * - `noisy` is treated as the filter input x[n]
 * - `reference` is treated as the desired signal d[n]
 * - output is y[n] = w^T xVec, which should approximate `reference`
 */
export function filterSignalRLS(noisy, reference, { filterOrder, forgettingFactor, regularization }) {
  if (!Array.isArray(noisy) || noisy.length === 0) return [];
  if (!Array.isArray(reference) || reference.length === 0) return [];

  const N = Math.min(noisy.length, reference.length);
  const M = Math.max(1, Math.floor(filterOrder ?? 1));
  const lambda = clampNumber(forgettingFactor ?? 0.99, 0.01, 0.999999);
  const delta = Math.max(1e-12, regularization ?? 0.01);

  // P initial covariance: (1/delta) * I
  const P = new Array(M);
  for (let i = 0; i < M; i++) {
    P[i] = new Array(M).fill(0);
    P[i][i] = 1 / delta;
  }

  const w = new Array(M).fill(0);
  const yFiltered = new Array(N).fill(0);

  for (let n = 0; n < N; n++) {
    const xVec = new Array(M);
    for (let k = 0; k < M; k++) {
      const idx = n - k;
      xVec[k] = idx >= 0 ? noisy[idx] : 0;
    }

    // z = P * xVec
    const z = new Array(M).fill(0);
    for (let i = 0; i < M; i++) {
      let acc = 0;
      for (let j = 0; j < M; j++) acc += P[i][j] * xVec[j];
      z[i] = acc;
    }

    // denom = lambda + xVec^T z
    let xTz = 0;
    for (let k = 0; k < M; k++) xTz += xVec[k] * z[k];
    const denom = lambda + xTz;

    // y = w^T xVec
    let y = 0;
    for (let k = 0; k < M; k++) y += w[k] * xVec[k];
    yFiltered[n] = y;

    const d = reference[n];
    const e = d - y;

    // gain vector k = z / denom
    const kVec = new Array(M);
    for (let i = 0; i < M; i++) kVec[i] = z[i] / denom;

    // w = w + kVec * e
    for (let i = 0; i < M; i++) w[i] += kVec[i] * e;

    // P = (1/lambda) * (P - kVec * xVec^T * P)
    // Since z = P*xVec, xVec^T*P = z^T, so (kVec * z^T) is kVec[i]*z[j].
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < M; j++) {
        P[i][j] = (P[i][j] - kVec[i] * z[j]) / lambda;
      }
    }
  }

  return yFiltered;
}
