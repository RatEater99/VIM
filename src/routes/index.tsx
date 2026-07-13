import { createFileRoute } from "@tanstack/react-router";
import CampusMap from "@/components/CampusMap";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Map — University Events" },
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
        <CampusMap />
      </main>
    </div>
  );
}
