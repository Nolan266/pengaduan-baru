import { Stack } from "expo-router";
import AuthGate from "../AuthGate";

export default function Layout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
