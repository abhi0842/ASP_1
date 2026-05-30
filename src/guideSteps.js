export const guideSteps = [
  {
    title: "Welcome to the Lab",
    content:
      "Would you like a guided tour of the Application and Usage of Filters on ECG Signal simulation?",
    type: "choice",
    targetId: "guideButton",
  },
  {
    title: "Instructions",
    content:
      "Open the instruction panel to review lab objectives, adaptive filter theory, and recommended parameter ranges for NLMS, LMS, and RLS.",
    highlight: "instructionPanel",
    preferredPlacement: "left",
  },
  {
    title: "1. Signal Setup",
    content:
      "Choose an ECG dataset (Dataset 1–3) and adjust the duration slider to set how many seconds of the waveform are shown in the plots.",
    highlight: "signalSetup",
    preferredPlacement: "left",
  },
  {
    title: "2. Generate ECG Signal",
    content:
      "Click Generate ECG Signal to load the selected dataset. The clean ECG waveform appears in the chart area on the left.",
    highlight: "generateButton",
    requiredAction: "GENERATE_SIGNAL",
    preferredPlacement: "left",
  },
  {
    title: "3. Add Noise",
    content:
      "Enable one or more noise types (Baseline Wander, Powerline at 50 Hz, or EMG), then click Add Noise to Signal to view the corrupted ECG.",
    highlight: "noisePanel",
    requiredAction: "ADD_NOISE",
    preferredPlacement: "left",
  },
  {
    title: "4. Select Algorithm",
    content:
      "Pick an adaptive filter: NLMS (default), LMS, or RLS. Change the selection if you want to compare algorithms.",
    highlight: "algorithmSelector",
    preferredPlacement: "left",
    isDropdown: true,
  },
  {
    title: "5. Filter Parameters",
    content:
      "Set filter order (M). For NLMS or LMS, adjust step size μ. For RLS, set forgetting factor λ and regularization δ using the fields shown for your chosen algorithm.",
    highlight: "algoSetup",
    preferredPlacement: "left",
  },
  {
    title: "6. Apply Filter",
    content:
      "Click Apply Filter to run the selected adaptive algorithm. The filtered ECG trace appears alongside the noisy signal in the chart area.",
    highlight: "applyFilterBtn",
    requiredAction: "APPLY_FILTER",
    preferredPlacement: "left",
  },
  {
    title: "7. Compute PSD",
    content:
      "After applying the filter, click Compute PSD to view the unfiltered (noisy) and filtered power spectral density plots side by side.",
    highlight: "computePsdBtn",
    requiredAction: "COMPUTE_PSD",
    preferredPlacement: "left",
  },
  {
    title: "Lab Completed",
    content:
      "You have completed the guided workflow. Experiment with different datasets, noise combinations, and NLMS, LMS, or RLS settings to compare performance.",
    preferredPlacement: "center",
  },
];
