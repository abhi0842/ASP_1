import { useContext, useState } from "react";
import styles from "./leftPanel.module.css";
import { EcgUnfilter } from "../graph/EcgUnfilter.jsx";
import { EcgFilter } from "../graph/EcgFilter.jsx";
import { EcgNoisy } from "../graph/EcgNoisy.jsx";
import { SimulationContext } from "../../context/SimulationContext.jsx";
import { EcgUnfilteredPSD } from "../graph/EcgUnfilteredPSD.jsx";
import { EcgFilteredPSD } from "../graph/EcgFilteredPSD.jsx";
import { AdaptiveWeightEvolution } from "../educational/AdaptiveWeightEvolution.jsx";
import { ConvergenceCurve } from "../educational/ConvergenceCurve.jsx";
import { LMSvsRLSComparison } from "../educational/LMSvsRLSComparison.jsx";

export const LeftPanel = () => {
  const { generateECG, applyNoiseTrigger, filteredECG, applypsdTrigger } =
    useContext(SimulationContext);
  
  const [showEducationalFeatures, setShowEducationalFeatures] = useState(true);
  
  return (
    <div className={styles.leftPanelContainer}>
      <div className={styles.container}>
        <div className={styles.psdContainer}>
        {applypsdTrigger && <EcgUnfilteredPSD />}
        {applypsdTrigger && <EcgFilteredPSD />}
        </div>
        <div>{generateECG && <EcgUnfilter />}</div>
        <div>{applyNoiseTrigger && <EcgNoisy />}</div>
        <div>{filteredECG && <EcgFilter />}</div>
        
        {/* Educational Features */}
        {filteredECG && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "0.5rem"
            }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Educational Features</h3>
              <button
                onClick={() => setShowEducationalFeatures(!showEducationalFeatures)}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                {showEducationalFeatures ? "Hide" : "Show"}
              </button>
            </div>
            
            {showEducationalFeatures && (
              <div>
                <AdaptiveWeightEvolution />
                <ConvergenceCurve />
                <LMSvsRLSComparison />
              </div>
            )}
          </div>
        )}
        
        {/* <div className={styles.psdContainer}>
        {applypsdTrigger && <EcgUnfilteredPSD />}
        {applypsdTrigger && <EcgFilteredPSD />}
        </div> */}
      </div>
    </div>
  );
};
