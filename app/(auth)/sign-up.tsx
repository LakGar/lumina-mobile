import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSignInWithApple, useSignUp, useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Page() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);
  const codeInputRef = useRef<TextInput>(null);

  const CODE_LENGTH = 6;
  const codeDigits = code
    .split("")
    .concat(Array(CODE_LENGTH - code.length).fill(""));
  const handleCodeChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
  }, []);
  const handleCodeSlotPress = useCallback(() => {
    codeInputRef.current?.focus();
  }, []);

  const themedStyles = useMemo(
    () => ({
      container: {
        backgroundColor: colors.background,
        flex: 1,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        padding: 20,
        paddingTop: 70,
        width: "100%" as const,
      },
      input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: 12,
        fontSize: 16,
        backgroundColor: colors.background,
        color: colors.foreground,
      },
      button: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: radius.md,
        width: "100%" as const,
        alignItems: "center" as const,
      },
      buttonText: {
        color: colors.primaryForeground,
        fontWeight: "600" as const,
      },
      altButtonText: {
        color: colors.foreground,
        fontWeight: "600" as const,
      },
      liquidGlassButton: {
        paddingVertical: 20,
        paddingHorizontal: 12,
        borderRadius: 14,
        flex: 1,
        maxWidth: "47%" as const,
        alignItems: "center" as const,
        flexDirection: "row" as const,
        justifyContent: "center" as const,
        gap: 6,
        overflow: "hidden" as const,
        backgroundColor:
          colorScheme === "dark"
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(255, 255, 255, 0.58)",
        borderWidth: 1,
        borderColor:
          colorScheme === "dark"
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(255, 255, 255, 0.7)",
      },
      socialButtonOuter: {
        flex: 1,
        maxWidth: "47%" as const,
      },
    }),
    [colors, colorScheme],
  );

  const useNativeGlass = Platform.OS === "ios" && isLiquidGlassAvailable();

  const onSignUpPress = useCallback(async () => {
    if (!isLoaded) return;
    try {
      await signUp.create({
        emailAddress,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error", "Sign up failed. Please try again.");
    }
  }, [isLoaded, signUp, emailAddress, password]);

  const onVerifyPress = useCallback(async () => {
    if (!isLoaded) return;
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (signUpAttempt.status === "complete") {
        await setActive({
          session: signUpAttempt.createdSessionId,
          navigate: async () => router.replace("/"),
        });
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error", "Verification failed.");
    }
  }, [isLoaded, signUp, setActive, router, code]);

  const onGooglePress = useCallback(async () => {
    if (!isLoaded) return;
    setLoading("google");
    try {
      const { createdSessionId, setActive: setActiveSession } =
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: "luminamobile://sso-callback",
        });
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
      }
    } catch (err: unknown) {
      const errCode = (err as { code?: string })?.code;
      if (errCode === "ERR_REQUEST_CANCELED") return;
      console.error("Google sign-up error:", err);
      Alert.alert(
        "Error",
        (err as { message?: string })?.message ?? "Google sign-up failed",
      );
    } finally {
      setLoading(null);
    }
  }, [isLoaded, startSSOFlow, router]);

  const onApplePress = useCallback(async () => {
    if (!isLoaded) return;
    setLoading("apple");
    try {
      const { createdSessionId, setActive: setActiveSession } =
        await startAppleAuthenticationFlow();
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
      }
    } catch (err: unknown) {
      const errCode = (err as { code?: string })?.code;
      if (errCode === "ERR_REQUEST_CANCELED") return;
      console.error("Apple sign-up error:", err);
      Alert.alert(
        "Error",
        (err as { message?: string })?.message ?? "Apple sign-up failed",
      );
    } finally {
      setLoading(null);
    }
  }, [isLoaded, startAppleAuthenticationFlow, router]);

  if (pendingVerification) {
    return (
      <ThemedView style={[themedStyles.container, styles.codeContainer]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.verifyBlock}>
              <ThemedText type="title" style={styles.verifyTitle}>
                Check your email
              </ThemedText>
              <ThemedText style={styles.verifyDescription}>
                We sent a 6-digit code to your email. Enter it below.
              </ThemedText>

              <Pressable
                style={styles.codeSlotsRow}
                onPress={handleCodeSlotPress}
              >
                <TextInput
                  ref={codeInputRef}
                  value={code}
                  onChangeText={handleCodeChange}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  autoFocus
                  autoComplete="one-time-code"
                  style={styles.codeInputHidden}
                  accessibilityLabel="Verification code"
                />
                {codeDigits.map((digit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.codeSlot,
                      {
                        borderColor:
                          index === code.length
                            ? colors.primary
                            : colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.codeSlotText,
                        { color: colors.foreground },
                      ]}
                    >
                      {digit}
                    </Text>
                  </View>
                ))}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  themedStyles.button,
                  pressed && styles.pressed,
                  code.length !== CODE_LENGTH && styles.buttonDisabled,
                ]}
                onPress={onVerifyPress}
                disabled={code.length !== CODE_LENGTH}
              >
                <ThemedText style={themedStyles.buttonText}>Verify</ThemedText>
              </Pressable>

              <ThemedText style={styles.verifyHint}>
                Didn’t receive the code? Check spam or try signing up again.
              </ThemedText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    );
  }

  const canSubmit = Boolean(emailAddress && password);
  const isOAuthLoading = loading !== null;

  return (
    <ThemedView style={themedStyles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={styles.title}>Lumina</ThemedText>

          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.welcomeTextMain, { color: colors.primary }]}>
              Create account
            </Text>
            <ThemedText style={styles.welcomeTextSub}>
              Sign up with Google, Apple, or your email.
            </ThemedText>
          </View>

          <View style={styles.formBlock}>
            <View style={styles.socialButtonsContainer}>
              <Pressable
                style={({ pressed }) => [
                  useNativeGlass
                    ? themedStyles.socialButtonOuter
                    : themedStyles.liquidGlassButton,
                  !useNativeGlass && pressed && styles.pressed,
                ]}
                onPress={onGooglePress}
                disabled={isOAuthLoading}
              >
                {useNativeGlass ? (
                  <View style={styles.glassViewInner}>
                    <GlassView
                      style={StyleSheet.absoluteFill}
                      glassEffectStyle="regular"
                      tintColor={
                        colorScheme === "dark"
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(255,255,255,0.6)"
                      }
                    />
                    <View
                      style={styles.glassContentOverlay}
                      pointerEvents="box-none"
                    >
                      {loading === "google" ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.foreground}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="logo-google"
                            size={20}
                            color={colors.foreground}
                          />
                          <Text
                            style={[
                              styles.glassButtonLabel,
                              { color: colors.foreground },
                            ]}
                            numberOfLines={1}
                          >
                            Google
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                ) : (
                  <>
                    {loading === "google" ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.foreground}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="logo-google"
                          size={20}
                          color={colors.foreground}
                        />
                        <ThemedText
                          style={themedStyles.altButtonText}
                          numberOfLines={1}
                        >
                          Google
                        </ThemedText>
                      </>
                    )}
                  </>
                )}
              </Pressable>

              {Platform.OS === "ios" && (
                <Pressable
                  style={({ pressed }) => [
                    useNativeGlass
                      ? themedStyles.socialButtonOuter
                      : themedStyles.liquidGlassButton,
                    !useNativeGlass && pressed && styles.pressed,
                  ]}
                  onPress={onApplePress}
                  disabled={isOAuthLoading}
                >
                  {useNativeGlass ? (
                    <View style={styles.glassViewInner}>
                      <GlassView
                        style={StyleSheet.absoluteFill}
                        glassEffectStyle="regular"
                        tintColor={
                          colorScheme === "dark"
                            ? "rgba(255,255,255,0.15)"
                            : "rgba(255,255,255,0.6)"
                        }
                      />
                      <View
                        style={styles.glassContentOverlay}
                        pointerEvents="box-none"
                      >
                        {loading === "apple" ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.foreground}
                          />
                        ) : (
                          <>
                            <MaterialIcons
                              name="apple"
                              size={20}
                              color={colors.foreground}
                            />
                            <Text
                              style={[
                                styles.glassButtonLabel,
                                { color: colors.foreground },
                              ]}
                              numberOfLines={1}
                            >
                              Apple
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  ) : (
                    <>
                      {loading === "apple" ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.foreground}
                        />
                      ) : (
                        <>
                          <MaterialIcons
                            name="apple"
                            size={20}
                            color={colors.foreground}
                          />
                          <ThemedText
                            style={[
                              styles.appleButtonText,
                              themedStyles.altButtonText,
                            ]}
                            numberOfLines={1}
                          >
                            Apple
                          </ThemedText>
                        </>
                      )}
                    </>
                  )}
                </Pressable>
              )}
            </View>

            <View style={[styles.divider, { borderColor: colors.border }]}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
              <ThemedText style={styles.dividerText}>or</ThemedText>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
            </View>

            <ThemedText style={[styles.label, { color: colors.foreground }]}>
              Email address
            </ThemedText>
            <TextInput
              style={themedStyles.input}
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter email"
              placeholderTextColor={colors.mutedForeground}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
            />
            <ThemedText style={[styles.label, { color: colors.foreground }]}>
              Password
            </ThemedText>
            <TextInput
              style={themedStyles.input}
              value={password}
              placeholder="Create a password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              onChangeText={setPassword}
            />
            <Pressable
              style={({ pressed }) => [
                themedStyles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
              onPress={onSignUpPress}
              disabled={!canSubmit}
            >
              <ThemedText style={themedStyles.buttonText}>
                Create account
              </ThemedText>
            </Pressable>

            <View style={styles.linkContainer}>
              <ThemedText>Already have an account? </ThemedText>
              <Link href="/sign-in" asChild>
                <Pressable hitSlop={8}>
                  <ThemedText type="link">Sign in</ThemedText>
                </Pressable>
              </Link>
            </View>
          </View>

          <View style={styles.footerContainer}>
            <ThemedText style={styles.footerText}>
              <Pressable>
                <ThemedText type="link" style={{ fontSize: 10 }}>
                  Terms of Service {" | "}
                </ThemedText>
              </Pressable>
              <Pressable>
                <ThemedText type="link" style={{ fontSize: 10 }}>
                  {" "}
                  Privacy Policy
                </ThemedText>
              </Pressable>
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    width: "100%",
  },
  welcomeTextContainer: {
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    height: 200,
  },
  welcomeTextMain: {
    fontSize: 30,
    fontWeight: "bold",
  },
  welcomeTextSub: {
    fontSize: 16,
    opacity: 0.8,
  },
  formBlock: {
    width: "100%",
    maxWidth: "100%",
    gap: 12,
    flex: 1,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    width: "100%",
    maxWidth: "100%",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  glassViewInner: {
    flex: 1,
    paddingVertical: 25,
    paddingHorizontal: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  glassContentOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  glassButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    opacity: 0.8,
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    alignItems: "center",
    paddingBottom: 20,
  },
  footerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    opacity: 0.8,
  },
  appleButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  codeContainer: {
    justifyContent: "flex-start",
    paddingTop: 80,
  },
  verifyBlock: {
    width: "100%",
    gap: 24,
    paddingTop: 8,
  },
  verifyTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  verifyDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.85,
    paddingHorizontal: 8,
  },
  codeSlotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    position: "relative",
    minHeight: 56,
  },
  codeInputHidden: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    zIndex: -1,
  },
  codeSlot: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  codeSlotText: {
    fontSize: 24,
    fontWeight: "700",
  },
  verifyHint: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.75,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
