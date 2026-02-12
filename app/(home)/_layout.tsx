import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="customize-dashboard"
        options={{
          headerShown: true,
          title: "Customize dashboard",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen name="create-journal" />
      <Stack.Screen name="journal/[id]" />
      <Stack.Screen name="entry/[entryId]" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="gift-membership" />
      <Stack.Screen name="my-account" />
      <Stack.Screen name="app-settings" />
      <Stack.Screen name="privacy-settings" />
      <Stack.Screen
        name="subscription"
        options={{ title: "Upgrade membership" }}
      />
      <Stack.Screen name="tutorial" options={{ title: "Tutorial" }} />
      <Stack.Screen name="about" options={{ title: "About" }} />
      <Stack.Screen
        name="membership-services"
        options={{ title: "Membership & support" }}
      />
      <Stack.Screen name="mood" options={{ title: "Mood" }} />
    </Stack>
  );
}
