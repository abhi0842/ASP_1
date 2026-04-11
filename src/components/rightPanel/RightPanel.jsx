import { useContext, useState, useEffect } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import styles from "./rightPanel.module.css";
import Swal from "sweetalert2";

export const RightPanel = () => {
  const {
    time,
    setTime,
    originalFs,
    // setUserFs,
    setGenerateECG,
    setApplyNoiseTrigger,
    config,
    setConfig,
    setFilteredECG,
    noise,
    setNoise,
    csvFilePath,
    prevPathRef,
    setCsvFilePath,
    generateECG,
    setApplypsdTrigger,
    setFilteredSamples,
  } = useContext(SimulationContext);

  const [adaptiveAlgo, setAdaptiveAlgo] = useState(config.filterType ?? "NLMS");
  const [filterOrder, setFilterOrder] = useState(config.filterOrder ?? 32);
  const [stepSize, setStepSize] = useState(config.stepSize ?? 0.1);
  const [forgettingFactor, setForgettingFactor] = useState(config.forgettingFactor ?? 0.99);
  const [regularization, setRegularization] = useState(config.regularization ?? 0.01);

  const runPsd = () => {
    if (!generateECG) {
      Swal.fire({
        icon: "info",
        title: "Oops...",
        text: "Please generate ECG signal first!",
      });
      return;
    }
    setApplypsdTrigger(true);
  };
  const runFilter = () => {
    if (!generateECG) {
      Swal.fire({
        icon: "info",
        title: "Oops...",
        text: "Please generate ECG signal first!",
      });
      return;
    }

    const newConfig = {
      ...config,
      filterType: adaptiveAlgo,
      filterOrder: Number(filterOrder),
      stepSize: Number(stepSize),
      forgettingFactor: Number(forgettingFactor),
      regularization: Number(regularization),
    };
    setConfig(newConfig);
    setFilteredECG(true);
  };
  const noiseTrigger = () => {
    //console.log(noise);
    if (!generateECG) {
      Swal.fire({
        icon: "info",
        title: "Oops...",
        text: "Please generate ECG signal first!",
      });
      return;
    } else if (!noise.baseline && !noise.powerline && !noise.emg) {
      Swal.fire({
        icon: "info",

        title: "Oops...",
        text: "Please select at least one noise type!",
      });
      return;
    } else {
      setApplyNoiseTrigger(true);
    }
  };
  useEffect(() => {
    if (prevPathRef.current !== csvFilePath) {
      setApplyNoiseTrigger(false);
      setFilteredECG(false);
      setApplypsdTrigger(false);
      setFilteredSamples([]);
      prevPathRef.current = csvFilePath;
    }
  }, [csvFilePath, prevPathRef, setApplyNoiseTrigger, setFilteredECG, setApplypsdTrigger, setFilteredSamples]); 

  return (
    <div className={styles.rightPanelContainer}>
      <div className={styles.right}>
        <h2>ECG Signal & Filter Controls</h2>

        <div className={styles.box}>
          <h3>Signal Setup</h3>
          <label>Select ECG Dataset</label>
          <select
            value={csvFilePath}
            onChange={(e) => setCsvFilePath(e.target.value)}
          >
            <option value={"/ecg200.csv"}>ECG Dataset 1</option>
            <option value={"/ecg300.csv"}>ECG Dataset 2</option>
            <option value={"/ecg100.csv"}>ECG Dataset 3</option>
          </select>

          <label>Duration (seconds)           <p className={styles.rangeValue}>
            : <span id="demo">{time} seconds</span>
          </p> </label>
          <input
            type="range"
            min="1"
            max="50"
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
          />

          <label>
            Sampling Rate : <span id="demo">{originalFs} Hz</span>
          </label>
          {/* <input
            type="range"
            min="1"
            max="1000"
            value={originalFs}
            onChange={(e) => setUserFs(Number(e.target.value))}
          /> */}
          <p className={styles.rangeValue}>
            
          </p>

          <button onClick={() => setGenerateECG(true)}>
            Generate ECG Signal
          </button>
        </div>

        <div className={styles.box}>
          <h3>Add Noise</h3>

          <label>
            <input
              type="checkbox"
              checked={noise.baseline}
              onChange={(e) =>
                setNoise({ ...noise, baseline: e.target.checked })
              }
            />
            Baseline Wander
          </label>

          <label>
            <input
              type="checkbox"
              checked={noise.powerline}
              onChange={(e) =>
                setNoise({ ...noise, powerline: e.target.checked })
              }
            />
            Powerline (50 Hz)
          </label>

          <label>
            <input
              type="checkbox"
              checked={noise.emg}
              onChange={(e) => setNoise({ ...noise, emg: e.target.checked })}
            />
            EMG Noise
          </label>
          <div className={styles.buttonContainer}>
            <button onClick={() => noiseTrigger()}>Add Noise to Signal</button>
          </div>
        </div>
        {/* adaptive filter input */}
        <div className={styles.box}>
          <h3>Adaptive Filter (NLMS / RLS)</h3>

          <label>Algorithm</label>
          <select value={adaptiveAlgo} onChange={(e) => setAdaptiveAlgo(e.target.value)}>
            <option value="NLMS">NLMS</option>
            <option value="RLS">RLS</option>
          </select>

          <label>Filter Order (M)</label>
          <input
            type="number"
            min="1"
            max="256"
            step="1"
            value={filterOrder}
            onChange={(e) => setFilterOrder(Number(e.target.value))}
          />

          {adaptiveAlgo === "NLMS" && (
            <>
              <label>Step size μ</label>
              <input
                type="number"
                step="0.01"
                value={stepSize}
                onChange={(e) => setStepSize(Number(e.target.value))}
              />
            </>
          )}

          {adaptiveAlgo === "RLS" && (
            <>
              <label>Forgetting factor λ</label>
              <input
                type="number"
                step="0.001"
                value={forgettingFactor}
                onChange={(e) => setForgettingFactor(Number(e.target.value))}
              />

              <label>Regularization δ</label>
              <input
                type="number"
                step="0.001"
                value={regularization}
                onChange={(e) => setRegularization(Number(e.target.value))}
              />
            </>
          )}

          <div className={styles.psdContainer}>
            <button onClick={runFilter}>Apply Filter</button>
            <button onClick={runPsd}>Compute PSD</button>
          </div>
        </div>
      </div>
    </div>
  );
};
