import { clearAll } from "@/lib/cache";
import { safeLogError } from "@/lib/safe-log";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, "primary");
  const color = useThemeColor({}, "primaryForeground");

  const handleSignOut = async () => {
    try {
      clearAll();
      await signOut();
      router.replace("/");
    } catch (err) {
      safeLogError("Sign out error", err);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && styles.buttonPressed,
      ]}
      onPress={handleSignOut}
    >
      <ThemedText style={[styles.buttonText, { color }]}>Sign out</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: "600",
  },
});
