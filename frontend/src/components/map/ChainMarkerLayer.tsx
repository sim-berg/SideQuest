import { Marker } from 'react-map-gl/maplibre';
import { motion } from 'motion/react';
import { useChainStore } from '../../stores/useChainStore';

/**
 * The current station of an active detective journey: a single pulsing 🔍
 * marker. Future stations stay hidden — the mystery reveals itself station
 * by station.
 */
export default function ChainMarkerLayer() {
  const chain = useChainStore((s) => s.chain);
  const openSheet = useChainStore((s) => s.openSheet);

  if (!chain || chain.status !== 'active' || chain.currentStep == null) {
    return null;
  }
  const step = chain.steps[chain.currentStep];
  if (!step || step.lat == null || step.lng == null) return null;

  return (
    <Marker longitude={step.lng} latitude={step.lat}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          openSheet();
        }}
        className="relative flex cursor-pointer items-center justify-center"
        aria-label={`Detektiv-Station: ${step.title}`}
      >
        <motion.span
          className="absolute inset-0 rounded-full bg-indigo-500"
          animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-indigo-500 text-lg shadow-lg">
          🔍
        </span>
      </button>
    </Marker>
  );
}
