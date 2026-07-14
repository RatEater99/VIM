import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Header } from "@/components/Header";

const CampusMap = lazy(() => import("@/components/CampusMap"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "VIM - VIT Interactive Map" },
      { name: "description", content: "Discover and share campus events on an interactive map." },
      { property: "og:title", content: "Campus Map — University Events" },
      { property: "og:description", content: "Discover and share campus events on an interactive map." },
    ],
  }),
  component: Index,
});


function Index() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 min-h-0">
        <Suspense fallback={<div className="p-6 text-muted-foreground">Loading map…</div>}>
          <CampusMap />
        </Suspense>
      </main>
    </div>
  );
}

