import WelcomeScreen from "@/components/welcome-screen";
import { SignedIn, SignedOut } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";

export default function WelcomeRoute() {
  return (
    <>
      <SignedIn>
        <RedirectToTabs />
      </SignedIn>
      <SignedOut>
        <WelcomeScreen />
      </SignedOut>
    </>
  );
}

function RedirectToTabs() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/(home)/(tabs)");
  }, [router]);
  return null;
}
