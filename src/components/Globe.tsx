import { useEffect, useRef, useState } from 'react';
import GlobeGL from 'react-globe.gl';

type AltitudeAccessor = number | ((feat: any) => number);

export function Globe() {
  const globeEl = useRef<any>();
  const [countries, setCountries] = useState<any>({ features: [] });
  const [altitude, setAltitude] = useState<AltitudeAccessor>(0.1);
  const [transitionDuration, setTransitionDuration] = useState(1000);

  useEffect(() => {
    // Fetch country data for polygons
    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => {
        setCountries(data);

        // After a delay, animate the spikes rising SLOWLY
        setTimeout(() => {
          setTransitionDuration(8000);
          setAltitude(() => (feat: any) =>
            Math.max(0.04, Math.sqrt(+feat.properties.POP_EST) * 4e-5)
          );
        }, 1500);
      })
      .catch(err => console.error('Error loading globe data:', err));
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      // Auto-rotate setup
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = true;
      controls.enablePan = true;
      
      // Pull back camera for centered view
      globeEl.current.pointOfView({ lat: 20, lng: 10, altitude: 2.8 });
    }
  }, []);

  const TEAL_PRIMARY = 'rgba(5, 122, 85, 0.9)';
  const TEAL_DARK = 'rgba(2, 44, 34, 0.7)';

  return (
    <div className="w-full h-full relative group">
      <GlobeGL
        ref={globeEl}
        backgroundColor="rgba(0,0,0,0)" // Transparent background
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
        
        // Polygons (Countries)
        polygonsData={countries.features.filter(
          (d: any) => d.properties.ISO_A2 !== 'AQ' // exclude Antarctica
        )}
        polygonAltitude={altitude}
        polygonCapColor={() => TEAL_PRIMARY}
        polygonSideColor={() => TEAL_DARK}
        polygonStrokeColor={() => 'rgba(255, 255, 255, 0.1)'}
        polygonsTransitionDuration={transitionDuration}
        
        // Label styling
        polygonLabel={({ properties: d }: any) => `
          <div class="bg-zinc-950/90 border border-emerald-500/30 p-3 rounded-xl shadow-2xl backdrop-blur-md">
            <p class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">${d.ADMIN}</p>
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <p class="text-sm text-white font-medium">Efficiency Score: <span class="text-emerald-400">${Math.round(Math.random() * 40 + 60)}%</span></p>
            </div>
            <p class="text-[10px] text-zinc-500 mt-1">Real-time Carbon Ingestion Active</p>
          </div>
        `}
      />
      
      {/* Visual Overlay to blend into background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-background/50" />
    </div>
  );
}