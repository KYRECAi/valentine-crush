import { createFileRoute } from "@tanstack/react-router";
import { DemoView } from "@/components/demo-view";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DemoView />;
}
