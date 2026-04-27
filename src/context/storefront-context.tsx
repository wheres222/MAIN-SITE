"use client";

import { createContext, useContext } from "react";
import type { StorefrontData } from "@/types/sellauth";

const StorefrontContext = createContext<StorefrontData | null>(null);

export function StorefrontProvider({
  data,
  children,
}: {
  data: StorefrontData | null;
  children: React.ReactNode;
}) {
  return (
    <StorefrontContext.Provider value={data}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefrontContext(): StorefrontData | null {
  return useContext(StorefrontContext);
}
