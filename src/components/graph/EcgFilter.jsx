import { useMemo, useContext, useEffect } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import styles from "./ecgFilter.module.css";
import { Line } from "react-chartjs-2";
import { filterSignalNLMS,filterSignalLMS, filterSignalRLS, calculateMSE } from "../../utils/filters";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

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

export const EcgFilter = () => {
  const {
    time,
    originalFs,
    config,
    cleanSignal,
    rawSamples,
    noisySamples,
    setFilteredSamples,
    setMetrics,
    setDiagnostics,
  } = useContext(SimulationContext);

  const filteredData = useMemo(() => {
    const inputSamples = noisySamples.length > 0 ? noisySamples : rawSamples;
    if (!inputSamples.length || !cleanSignal.length) return [];

    const fsOriginal = inferFs(inputSamples);
    const display = resampleForDisplay(inputSamples, fsOriginal, originalFs);
    const noisyECG = display.map((p) => p.y);
    const cleanGroundTruth = cleanSignal.slice(0, noisyECG.length);
    
    // In Adaptive Noise Cancellation (ANC):
    // - d[n] (desired) is the noisy signal
    // - x[n] (input) is a noise reference
    // - y[n] is the filter output (estimated noise)
    // - e[n] = d[n] - y[n] is the cleaned signal
    const noiseReference = noisyECG.map((v, i) => v - (cleanGroundTruth[i] || 0));

    let cleanedSignal = [];
    let diagnosticsResult = null;
    
    if (config.filterType === "NLMS") {
      const result = filterSignalNLMS(noiseReference, noisyECG, {
        filterOrder: config.filterOrder,
        stepSize: config.stepSize,
        returnDiagnostics: true,
      });
      cleanedSignal = result.Yfiltered;
      diagnosticsResult = {
        ...result.diagnostics,
        algorithm: "NLMS",
        yNoise: result.yNoise,
        noisyECG,
        cleanGroundTruth,
      };
    } else if (config.filterType === "LMS") {
      const result = filterSignalLMS(noiseReference, noisyECG, {
        filterOrder: config.filterOrder,
        stepSize: config.stepSize,
        returnDiagnostics: true,
      });
      cleanedSignal = result.Yfiltered;
      diagnosticsResult = {
        ...result.diagnostics,
        algorithm: "LMS",
        yNoise: result.yNoise,
        noisyECG,
        cleanGroundTruth,
      };
    } else {
      const result = filterSignalRLS(noiseReference, noisyECG, {
        filterOrder: config.filterOrder,
        forgettingFactor: config.forgettingFactor,
        regularization: config.regularization,
        returnDiagnostics: true,
      });
      cleanedSignal = result.Yfiltered;
      diagnosticsResult = {
        ...result.diagnostics,
        algorithm: "RLS",
        yNoise: result.yNoise,
        noisyECG,
        cleanGroundTruth,
      };
    }

    // Compute error history and MSE for convergence curve
    if (diagnosticsResult) {
      const N = cleanedSignal.length;
      const errorHistory = new Array(N);
      const squaredErrorHistory = new Array(N);
      const mseHistory = new Array(N);
      let sumSq = 0;
      
      for (let n = 0; n < N; n++) {
        const e = cleanedSignal[n] - cleanGroundTruth[n];
        errorHistory[n] = e;
        const sqErr = e * e;
        squaredErrorHistory[n] = sqErr;
        sumSq += sqErr;
        mseHistory[n] = sumSq / (n + 1);
      }
      
      diagnosticsResult.errorHistory = errorHistory;
      diagnosticsResult.squaredErrorHistory = squaredErrorHistory;
      diagnosticsResult.mseHistory = mseHistory;
    }

    setDiagnostics(diagnosticsResult);

    const mse = calculateMSE(cleanGroundTruth, cleanedSignal);
    setMetrics({ algorithm: config.filterType, order: config.filterOrder, mse: mse.toFixed(6) });

    const mapped = display.map((p, i) => ({ x: p.x, y: cleanedSignal[i] ?? 0 }));
    return mapped.filter((p) => p.x <= time);
  }, [time, originalFs, config, cleanSignal, rawSamples, noisySamples, setMetrics, setDiagnostics]);

  useEffect(() => {
    setFilteredSamples(filteredData);
  }, [filteredData, setFilteredSamples]);

  const chartData = {
    datasets: [
      {
        label: "Filtered ECG",
        data: filteredData,
        borderColor: "#2ecc71",
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    animation: false,
    parsing: false,
    plugins: { legend: { display: true } },
    scales: {
      x: { type: "linear", title: { display: true, text: "Time (s)" } },
      y: { title: { display: true, text: "Amplitude (mV)" } },
    },
  };

 return (
  <div className={styles.signalContainer}>
    <h3>
      ECG Signal (Filtered) <span>Algorithm: </span>
      <span>
        {config.filterType === "LMS"
          ? `LMS — μ=${config.stepSize} — M=${config.filterOrder}`
          : config.filterType === "RLS"
          ? `RLS — λ=${config.forgettingFactor} — M=${config.filterOrder}`
          : `NLMS — μ=${config.stepSize} — M=${config.filterOrder}`}
      </span>
    </h3>
    <Line data={chartData} options={options} />
  </div>
);
};
