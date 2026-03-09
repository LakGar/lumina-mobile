import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      // In dev only: log for debugging. Don't log full errorInfo in production.
      console.warn("ErrorBoundary caught:", error?.message ?? error);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback
          onTryAgain={this.handleReset}
          message={this.state.error?.message}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({
  onTryAgain,
  message,
}: {
  onTryAgain: () => void;
  message?: string;
}) {
  const colors = useThemeColors();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          Something went wrong
        </ThemedText>
        <ThemedText
          style={[styles.message, { color: colors.mutedForeground }]}
          numberOfLines={3}
        >
          {message && message.length < 200 ? message : "An unexpected error occurred."}
        </ThemedText>
        <Pressable
          onPress={onTryAgain}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
            Try again
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    maxWidth: 320,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
