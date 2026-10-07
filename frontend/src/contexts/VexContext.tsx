import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type VexContextValue = {
  isOpen: boolean;
  /** A question the chat should send as soon as it is open and hydrated. */
  pendingQuestion: string | null;
  /** Open the chat, optionally with a question to send straight away. */
  askVex: (question?: string) => void;
  closeVex: () => void;
  /** Called by the chat once it has taken the pending question. */
  consumeQuestion: () => void;
};

const VexContext = createContext<VexContextValue | null>(null);

/**
 * Vex is the one thing on this site a visitor can talk to, and it should be
 * reachable from anywhere content is: a project, a role, the hero. This holds
 * the open state and the question that opened it, so any component can hand a
 * visitor over to the chat mid-sentence rather than sending them to a corner
 * button first.
 */
export const VexProvider = ({ children }: PropsWithChildren) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  const askVex = useCallback((question?: string) => {
    setPendingQuestion(question?.trim() ? question.trim() : null);
    setIsOpen(true);
  }, []);
  const closeVex = useCallback(() => setIsOpen(false), []);
  const consumeQuestion = useCallback(() => setPendingQuestion(null), []);

  const value = useMemo(
    () => ({ isOpen, pendingQuestion, askVex, closeVex, consumeQuestion }),
    [isOpen, pendingQuestion, askVex, closeVex, consumeQuestion],
  );

  return <VexContext.Provider value={value}>{children}</VexContext.Provider>;
};

export function useVex() {
  const context = useContext(VexContext);
  if (!context) throw new Error("useVex must be used within a VexProvider");
  return context;
}
