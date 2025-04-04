import { createContext } from "react";

export const ExpenseUpdateContext = createContext({
  triggerUpdate: () => {},
  lastUpdate: 0,
});