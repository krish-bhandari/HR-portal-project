// app/page.tsx — Root redirect (handled by middleware)
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
