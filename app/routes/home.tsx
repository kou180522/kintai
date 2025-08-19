import type { Route } from "./+types/home";
import { Dashboard } from "../components/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "勤怠Pro - ホーム" },
    { name: "description", content: "勤怠管理ダッシュボード" },
  ];
}

export default function Home() {
  return <Dashboard />;
}
