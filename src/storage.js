import { useEffect, useState } from "react";

const isPromiseLike = (value) => value && typeof value.then === "function";

export function useRepositoryStore(repository) {
  const [hydrated, setHydrated] = useState(false);
  const [value, setValue] = useState(() => {
    const loaded = repository.load();
    if (isPromiseLike(loaded)) return repository.fallbackValue;
    return loaded;
  });

  useEffect(() => {
    let alive = true;
    const loaded = repository.load();

    if (isPromiseLike(loaded)) {
      loaded.then((nextValue) => {
        if (!alive) return;
        setValue(nextValue);
        setHydrated(true);
      }).catch(() => {
        if (alive) setHydrated(true);
      });
    } else {
      setValue(loaded);
      setHydrated(true);
    }

    return () => {
      alive = false;
    };
  }, [repository]);

  useEffect(() => {
    if (hydrated) repository.save(value);
  }, [hydrated, repository, value]);

  return [value, setValue];
}
