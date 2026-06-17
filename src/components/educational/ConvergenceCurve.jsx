import { useContext, useState, useMemo } from "react";
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

const movingAverage = (data, windowSize) => {
  if (!data || windowSize <= 1) return data;
  const result = [];
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
      sum += data[j];
      count++;
    }
    result.push(sum / count);
  }
  return result;
};

export const ConvergenceCurve = () => {
  const { diagnostics } = useContext(SimulationContext);
  const [showMSE, setShowMSE] = useState(true);
  const [showError, setShowError] = useState(false);
  const [smoothingWindow, setSmoothingWindow] = useState(10);
  const [useSmoothing, setUseSmoothing] = useState(true);

  const chartData = useMemo(() => {
    if (!diagnostics) return null;

    const { errorHistory, mseHistory } = diagnostics;
    const iterations = errorHistory?.length || 0;
    if (iterations === 0) return null;

    const datasets = [];
    const labels = Array.from({ length: iterations }, (_, i) => i);

    if (showError && errorHistory) {
      const data = useSmoothing
        ? movingAverage(errorHistory, smoothingWindow)
        : errorHistory;
      datasets.push({
        label: "Error e(n)",
        data,
        borderColor: "#e74c3c",
        backgroundColor: "#e74c3c20",
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
        yAxisID: "y",
      });
    }

    if (showMSE && mseHistory) {
      const data = useSmoothing
        ? movingAverage(mseHistory, smoothingWindow)
        : mseHistory;
      datasets.push({
        label: "MSE",
        data,
        borderColor: "#3498db",
        backgroundColor: "#3498db20",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        yAxisID: "y1",
      });
    }

    return { labels, datasets };
  }, [diagnostics, showMSE, showError, smoothingWindow, useSmoothing]);

  const options = useMemo(
    () => ({
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
          display: showError,
          position: "left",
          title: { display: true, text: "Error e(n)" },
        },
        y1: {
          type: "linear",
          display: showMSE,
          position: "right",
          title: { display: true, text: "MSE" },
          grid: { drawOnChartArea: false },
        },
      },
    }),
    [showError, showMSE]
  );

  if (!diagnostics) {
    return null;
  }

  return (
    <div style={{ padding: "1rem", backgroundColor: "#fff", borderRadius: "8px", marginBottom: "1rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
      <h3 style={{ margin: 0, marginBottom: "0.5rem", fontSize: "1.1rem" }}>
        Convergence Curve ({diagnostics.algorithm})
      </h3>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <input type="checkbox" checked={showMSE} onChange={(e) => setShowMSE(e.target.checked)} />
          Show MSE
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <input type="checkbox" checked={showError} onChange={(e) => setShowError(e.target.checked)} />
          Show Error
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <input type="checkbox" checked={useSmoothing} onChange={(e) => setUseSmoothing(e.target.checked)} />
          Smooth
        </label>
        {useSmoothing && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.9rem" }}>Window:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={smoothingWindow}
              onChange={(e) => setSmoothingWindow(Number(e.target.value))}
              style={{ width: "60px", padding: "0.25rem", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
        )}
      </div>
      <div style={{ height: "300px" }}>
        {chartData && <Line data={chartData} options={options} />}
      </div>
    </div>
  );
};
