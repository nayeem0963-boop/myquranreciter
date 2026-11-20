import { useCallback, useEffect, useState } from "react";

interface InstallPromptChoice {
  outcome: "accepted" | "dismissed";
  platform: string;
}

interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptChoice>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installError, setInstallError] = useState("");

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isAppleMobile);
    setIsSafari(isAppleMobile && /Safari/.test(userAgent) && !/(CriOS|FxiOS|EdgiOS|OPiOS)/.test(userAgent));

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const updateStandalone = () => {
      const navigatorStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(standaloneQuery.matches || navigatorStandalone);
    };
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPrompt);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    updateStandalone();
    standaloneQuery.addEventListener("change", updateStandalone);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      standaloneQuery.removeEventListener("change", updateStandalone);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setIsStandalone(true);
      setDeferredPrompt(null);
      setInstallError("");
    } catch (error) {
      console.error("Unable to start the PWA installation prompt.", error);
      setDeferredPrompt(null);
      setInstallError("Installation could not be started. Try your browser’s install option instead.");
    }
  }, [deferredPrompt]);

  return {
    isInstallable: Boolean(deferredPrompt) && !isStandalone,
    isIOSSafari: isIOS && isSafari && !isStandalone,
    isStandalone,
    install,
    installError,
  };
}
