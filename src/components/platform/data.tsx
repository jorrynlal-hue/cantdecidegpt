'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection } from '@/lib/core/client';

export interface CollectionState<T> {
  rows: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useCollection<T>(name: string, params: Record<string, string> = {}): CollectionState<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    collection
      .list(name, params)
      .then((data) => {
        if (alive) {
          setRows((data as T[]) ?? []);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, JSON.stringify(params), tick]);

  return { rows, loading, error, reload };
}