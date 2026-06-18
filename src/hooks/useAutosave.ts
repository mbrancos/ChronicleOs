"use client";

import { useEffect, useRef } from "react";

export function useAutosave<T>(value: T, delay: number, onSave: (val: T) => void) {
  const isFirstRender = useRef(true);
  const latestValue = useRef(value);
  const latestOnSave = useRef(onSave); // Guarda a referência da função

  // Mantém os refs sempre atualizados com a última versão sem causar re-renders
  useEffect(() => {
    latestValue.current = value;
    latestOnSave.current = onSave;
  }, [value, onSave]);

  useEffect(() => {
    // Pular a montagem inicial para não sobrescrever o banco à toa
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      // Usa a referência salva da função para evitar dependências cíclicas
      latestOnSave.current(latestValue.current);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // onSave removido das dependências ativas
}
