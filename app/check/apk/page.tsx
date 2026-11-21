import { redirect } from "next/navigation";

// The file checker used to be APK-only. Keep old links working.
export default function Page() {
  redirect("/check/file");
}
