import { useEffect, useState, type ComponentType } from "react";

export function ClientOnly<P extends object>({ load, fallback }: { load: () => Promise<{ default: ComponentType<P> }>; fallback?: React.ReactNode } & P) {
  const [Comp, setComp] = useState<ComponentType<P> | null>(null);
  useEffect(() => {
    let mounted = true;
    load().then((m) => { if (mounted) setComp(() => m.default); });
    return () => { mounted = false; };
  }, [load]);
  if (!Comp) return <>{fallback ?? null}</>;
  return <Comp {...({} as P)} />;
}
