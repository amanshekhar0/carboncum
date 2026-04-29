import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MOCK_USER } from '../../services/mockData';
export function EcoScoreGauge() {
  const score = MOCK_USER.ecoScore;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - score / 100 * circumference;
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-center">Your Eco-Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pb-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-secondary" />
            
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-emerald-500 transition-all duration-1000 ease-out"
              strokeLinecap="round" />
            
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{score}</span>
          </div>
        </div>
        <p className="text-sm text-center text-muted-foreground mt-4">
          {score >= 90 ?
          "Outstanding! You're an Eco-Warrior." :
          score >= 70 ?
          'Good job, but room for improvement.' :
          'Your footprint is high. Check the AI Coach.'}
        </p>
      </CardContent>
    </Card>);

}