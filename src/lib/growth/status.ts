export function getStatusLabel(scored: { growthScore: number; riskSignals: number }) {
  if (scored.growthScore >= 75 && scored.riskSignals <= 1) return "High expansion potential";
  if (scored.growthScore >= 55) return "Needs follow-up";
  if (scored.riskSignals >= 3) return "At risk";
  return "Low activity";
}

