import { useState, useCallback } from 'react';

// A custom hook to manage state history (e.g., for undo/redo functionality).
export const useHistoryState = <T>(initialState: T[] = [], initialIndex: number = -1) => {
  const [history, setHistory] = useState<T[]>(initialState);
  const [index, setIndex] = useState<number>(initialIndex);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;
  const current = index >= 0 ? history[index] : null;

  /**
   * Sets a new state, updating the history.
   * @param newState The new state to add.
   * @param overwrite If true, the entire history is replaced with the new state.
   */
  const setState = useCallback((newState: T, overwrite = false) => {
    if (overwrite) {
      const newHistory = [newState];
      setHistory(newHistory);
      setIndex(newHistory.length - 1);
    } else {
      // Truncate future history if we've undone, then create a new edit branch
      const newHistory = history.slice(0, index + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setIndex(newHistory.length - 1);
    }
  }, [history, index]);

  // Moves to the previous state in history.
  const undo = useCallback(() => {
    if (canUndo) {
      setIndex(index - 1);
    }
  }, [canUndo, index]);

  // Moves to the next state in history.
  const redo = useCallback(() => {
    if (canRedo) {
      setIndex(index + 1);
    }
  }, [canRedo, index]);

  // Resets the history to its initial state.
  const reset = useCallback(() => {
    setHistory(initialState);
    setIndex(initialIndex);
  }, [initialState, initialIndex]);


  return {
    current,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
};
