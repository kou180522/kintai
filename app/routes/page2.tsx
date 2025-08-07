import type { Route } from "./+types/page2";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "履歴" },
    { name: "description", content: "履歴ページ" },
  ];
}

export default function Page2() {
  return (
    <div>
    </div>
  );
}