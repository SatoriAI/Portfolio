import type { ComponentType } from "react";

import GeneralisationThread from "@/components/research/threads/GeneralisationThread";
import HeatKernelsThread from "@/components/research/threads/HeatKernelsThread";
import NeuralOperatorsThread from "@/components/research/threads/NeuralOperatorsThread";
import QuantumAlgorithmThread from "@/components/research/threads/QuantumAlgorithmThread";
import type { ResearchSlug } from "@/lib/researchThreads";

/** Each thread's story, drawn on its own page under the thread's heading. */
export const THREAD_BODIES: Record<ResearchSlug, ComponentType> = {
  "heat-kernels": HeatKernelsThread,
  generalisation: GeneralisationThread,
  "neural-operators": NeuralOperatorsThread,
  "quantum-algorithm": QuantumAlgorithmThread,
};
