import type { Route } from "./+types/home";
import { Dashboard } from "../components/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Dashboard with charts and analytics" },
  ];
}

export default function Home() {
  return <Dashboard />;
}
