import { createContext, useContext } from "react";

/**
 * What the home page's wire (see Circuit) tells the hub it ends at: whether it
 * is drawn and moving at all, and whether the current has reached the hub.
 * Outside a Circuit, or where it is not drawn, both are false.
 */
export type CircuitState = { wired: boolean; closed: boolean };

export const CircuitContext = createContext<CircuitState>({ wired: false, closed: false });

export const useCircuit = () => useContext(CircuitContext);
