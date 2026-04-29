import React from 'react';
import { MetricsCards } from './MetricsCards';
import { ImpactChart } from './ImpactChart';
import { WhatIfSimulator } from './WhatIfSimulator';
import { ActionCenter } from './ActionCenter';
import { Leaderboard } from './Leaderboard';
import { EcoScoreGauge } from './EcoScoreGauge';

export function Overview() {
  return (
    <div className="space-y-6">
      <MetricsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ImpactChart />
        <EcoScoreGauge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WhatIfSimulator />
          <ActionCenter />
        </div>
        <div className="lg:col-span-1">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
