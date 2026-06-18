import { useContext, useState, useCallback } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { filterSignalLMS, filterSignalRLS } from "../../utils/filters";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

export const LMSvsRLSComparison = () => {
  const {
    config,
    cleanSignal,
    rawSamples,
    noisySamples,
    originalFs,
    comparisonData,
    setComparisonData,
  } = useContext(SimulationContext);

  const [isRunning, setIsRunning] = useState(false);

  const runComparison = useCallback(async () => {
    const inputSamples = noisySamples.length > 0 ? noisySamples : rawSamples;
    if (!inputSamples.length || !cleanSignal.length) return;

    setIsRunning(true);

    try {
      const fsOriginal = inferFs(inputSamples);
      const display = resampleForDisplay(inputSamples, fsOriginal, originalFs);
      const noisyECG = display.map((p) => p.y);
      const cleanGroundTruth = cleanSignal.slice(0, noisyECG.length);
      const noiseReference = noisyECG.map((v, i) => v - (cleanGroundTruth[i] || 0));

      // Run LMS
      const lmsStart = performance.now();
      const lmsResult = filterSignalLMS(noiseReference, noisyECG, {
        filterOrder: config.filterOrder,
        stepSize: config.stepSize,
        returnDiagnostics: true,
      });
      const lmsTime = performance.now() - lmsStart;

      const lmsMSEHistory = computeMSEHistory(lmsResult.Yfiltered, cleanGroundTruth);
      const lmsConvergenceIter = findConvergenceIteration(lmsMSEHistory, 0.01);

      // Run RLS
      const rlsStart = performance.now();
      const rlsResult = filterSignalRLS(noiseReference, noisyECG, {
        filterOrder: config.filterOrder,
        forgettingFactor: config.forgettingFactor,
        regularization: config.regularization,
        returnDiagnostics: true,
      });
      const rlsTime = performance.now() - rlsStart;

      const rlsMSEHistory = computeMSEHistory(rlsResult.Yfiltered, cleanGroundTruth);
      const rlsConvergenceIter = findConvergenceIteration(rlsMSEHistory, 0.01);

      setComparisonData({
        lms: {
          mseHistory: lmsMSEHistory,
          finalMSE: lmsMSEHistory[lmsMSEHistory.length - 1],
          convergenceIter: lmsConvergenceIter,
          time: lmsTime,
        },
        rls: {
          mseHistory: rlsMSEHistory,
          finalMSE: rlsMSEHistory[rlsMSEHistory.length - 1],
          convergenceIter: rlsConvergenceIter,
          time: rlsTime,
        },
        filterOrder: config.filterOrder,
        iterations: lmsMSEHistory.length,
      });
    } finally {
      setIsRunning(false);
    }
  }, [
    noisySamples,
    rawSamples,
    cleanSignal,
    originalFs,
    config.filterOrder,
    config.stepSize,
    config.forgettingFactor,
    config.regularization,
    setComparisonData,
  ]);

  const chartData = useCallback(() => {
    if (!comparisonData) return null;

    const { lms, rls, iterations } = comparisonData;
    const labels = Array.from({ length: iterations }, (_, i) => i);

    return {
      labels,
      datasets: [
        {
          label: "LMS MSE",
          data: lms.mseHistory,
          borderColor: "#e74c3c",
          backgroundColor: "#e74c3c20",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
        },
        {
          label: "RLS MSE",
          data: rls.mseHistory,
          borderColor: "#3498db",
          backgroundColor: "#3498db20",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
        },
      ],
    };
  }, [comparisonData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: { mode: "index", intersect: false },
      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: "Iteration" },
        ticks: { maxTicksLimit: 10 },
      },
      y: {
        type: "linear",
        title: { display: true, text: "MSE" },
      },
    },
  };

  if (!noisySamples.length && !rawSamples.length) return null;

  return (
    <div style={{ padding: "1rem", backgroundColor: "#fff", borderRadius: "8px", marginBottom: "1rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
      <h3 style={{ margin: 0, marginBottom: "0.5rem", fontSize: "1.1rem" }}>
        LMS vs RLS Comparison
      </h3>
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={runComparison}
          disabled={isRunning}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isRunning ? "not-allowed" : "pointer",
            opacity: isRunning ? 0.7 : 1,
          }}
        >
          {isRunning ? "Running Comparison..." : "Run Comparison"}
        </button>
      </div>

      {comparisonData && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left",color:"black" }}>Metric</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", color: "#110706" }}>LMS</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", color: "#050b0f" }}>RLS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #ddd", padding: "8px", color: "black" }}>Final MSE</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" , color: "black" }}>{comparisonData.lms.finalMSE.toExponential(4)}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", color: "black"  }}>{comparisonData.rls.finalMSE.toExponential(4)}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #ddd", padding: "8px", color: "black"  }}>Convergence Iteration</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" , color: "black" }}>{comparisonData.lms.convergenceIter || "-"}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", color: "black" }}>{comparisonData.rls.convergenceIter || "-"}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #ddd", padding: "8px", color: "black" }}>Execution Time (ms)</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", color: "black" }}>{comparisonData.lms.time.toFixed(2)}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", color: "black" }}>{comparisonData.rls.time.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #ddd", padding: "8px" , color: "black" }}>Filter Order</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", color: "black" }}>{comparisonData.filterOrder}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", color: "black" }}>{comparisonData.filterOrder}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ height: "300px" }}>
            <Line data={chartData()} options={options} />
          </div>
        </>
      )}
    </div>
  );
};

function resampleForDisplay(data, fsOriginal, fsUser) {
  const step = fsOriginal / fsUser;
  if (step <= 1) return data;
  const out = [];
  for (let i = 0; i < data.length; i += step) out.push(data[Math.floor(i)]);
  return out;
}

function inferFs(dataAll) {
  if (!dataAll || dataAll.length < 2) return 500;
  const dt = dataAll[1].x - dataAll[0].x;
  if (dt > 0) return 1 / dt;
  return 500;
}

function computeMSEHistory(cleanedSignal, groundTruth) {
  const N = cleanedSignal.length;
  const mseHistory = new Array(N);
  let sumSq = 0;
  for (let n = 0; n < N; n++) {
    const e = cleanedSignal[n] - groundTruth[n];
    sumSq += e * e;
    mseHistory[n] = sumSq / (n + 1);
  }
  return mseHistory;
}

function findConvergenceIteration(mseHistory, threshold) {
  if (!mseHistory || mseHistory.length === 0) return null;
  const targetMSE = mseHistory[mseHistory.length - 1] * (1 + threshold);
  for (let i = 0; i < mseHistory.length; i++) {
    if (mseHistory[i] <= targetMSE) return i;
  }
  return mseHistory.length - 1;
}
