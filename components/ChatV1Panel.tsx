"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { ColorScheme } from "@/hooks/useColorScheme";
import { IntakeFormModal } from "./IntakeFormModal";
import { ErrorOverlay } from "./ErrorOverlay";
import type { IntakeData } from "@/lib/types/intake";
import { INTAKE_STORAGE_KEY } from "@/lib/types/intake";
import { selectIframeUrl, getIframeContentName } from "./IframeContentSelector";

type ChatV1PanelProps = {
  theme: ColorScheme;
};

type ErrorState = {
  iframe: string | null;
  retryable: boolean;
};

const createInitialErrors = (): ErrorState => ({
  iframe: null,
  retryable: false,
});

export function ChatV1Panel({ theme }: ChatV1PanelProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeCompleted, setIntakeCompleted] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [isCheckingIntake, setIsCheckingIntake] = useState(true);
  const [isMigratingIntake, setIsMigratingIntake] = useState(false);
  const [errors, setErrors] = useState<ErrorState>(createInitialErrors());
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  // Migrate localStorage intake data to Supabase when user signs in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || isMigratingIntake) return;

    const migrateIntakeData = async () => {
      if (typeof window === "undefined") return;

      const stored = localStorage.getItem(INTAKE_STORAGE_KEY);
      if (!stored) return;

      try {
        setIsMigratingIntake(true);
        const data = JSON.parse(stored) as IntakeData;

        console.log("[ChatV1Panel] Migrating intake data to Supabase...");

        const response = await fetch("/api/migrate-intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: data.role,
            response_style: data.response_style,
            intent: data.intent,
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log("[ChatV1Panel] Intake data migrated successfully");
          localStorage.removeItem(INTAKE_STORAGE_KEY);
        } else {
          console.error("[ChatV1Panel] Failed to migrate intake data:", result.error);
        }
      } catch (error) {
        console.error("[ChatV1Panel] Error migrating intake data:", error);
      } finally {
        setIsMigratingIntake(false);
      }
    };

    migrateIntakeData();
  }, [isLoaded, isSignedIn, isMigratingIntake]);

  // Check if intake is needed for all users (guest and signed in)
  useEffect(() => {
    if (!isLoaded || isMigratingIntake) return;

    const checkIntakeStatus = async () => {
      if (typeof window === "undefined") return;

      // First check localStorage (for guest users or recent data)
      const stored = localStorage.getItem(INTAKE_STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored) as IntakeData;
          setIntakeData(data);
          setIframeUrl(selectIframeUrl(data));
          setIntakeCompleted(true);
          setShowIntakeModal(false);
          setIsCheckingIntake(false);
          console.log("[ChatV1Panel] Loaded intake data from localStorage");
          return;
        } catch (error) {
          console.error("[ChatV1Panel] Failed to parse localStorage intake data:", error);
        }
      }

      // For signed in users, check Supabase
      if (isSignedIn) {
        try {
          console.log("[ChatV1Panel] Checking Supabase for intake data...");
          const response = await fetch("/api/tools", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toolName: "get_user_profile",
              params: {},
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log("[ChatV1Panel] Supabase check result:", result);

            if (result.success && result.data?.intake_completed_at) {
              console.log("[ChatV1Panel] User has completed intake in Supabase");

              const intakeData: IntakeData = {
                role: result.data.intake_role,
                response_style: result.data.intake_response_style,
                intent: result.data.intake_intent,
                completed_at: result.data.intake_completed_at,
              };
              localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(intakeData));
              console.log("[ChatV1Panel] Synced Supabase intake data to localStorage");

              setIntakeData(intakeData);
              setIframeUrl(selectIframeUrl(intakeData));
              setIntakeCompleted(true);
              setShowIntakeModal(false);
              setIsCheckingIntake(false);
              return;
            }
          }
        } catch (error) {
          console.error("[ChatV1Panel] Error checking intake status:", error);
        }
      }

      // Show intake modal if no data found
      setShowIntakeModal(true);
      setIntakeCompleted(false);
      setIsCheckingIntake(false);
    };

    checkIntakeStatus();
  }, [isLoaded, isSignedIn, isMigratingIntake]);

  const handleIntakeComplete = useCallback(async (data: IntakeData) => {
    console.log("[ChatV1Panel] Intake completed:", data);

    // Reset editing flag and restore localStorage if needed
    if (isEditingPreferences) {
      setIsEditingPreferences(false);
      // Restore localStorage since we temporarily removed it
      if (typeof window !== "undefined") {
        localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(data));
      }
    }

    // Update state
    setIntakeData(data);
    setIframeUrl(selectIframeUrl(data));

    // For signed in users, save directly to Supabase
    if (isSignedIn) {
      try {
        console.log("[ChatV1Panel] Saving intake data to Supabase...");
        const response = await fetch("/api/migrate-intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: data.role,
            response_style: data.response_style,
            intent: data.intent,
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log("[ChatV1Panel] Intake data saved to Supabase successfully");
        } else {
          console.error("[ChatV1Panel] Failed to save intake data to Supabase:", result.error);
          if (typeof window !== "undefined") {
            localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(data));
          }
        }
      } catch (error) {
        console.error("[ChatV1Panel] Error saving intake data to Supabase:", error);
        if (typeof window !== "undefined") {
          localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(data));
        }
      }
    } else {
      console.log("[ChatV1Panel] Guest user - data saved to localStorage");
    }

    setIntakeCompleted(true);
    setShowIntakeModal(false);
  }, [isSignedIn]);

  const handleIntakeSkip = useCallback(() => {
    console.log("[ChatV1Panel] Intake skipped");
    setIntakeCompleted(true);
    setShowIntakeModal(false);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIsIframeLoading(false);
    setErrors((prev) => ({ ...prev, iframe: null }));
  }, []);

  const handleIframeError = useCallback(() => {
    setIsIframeLoading(false);
    setErrors({
      iframe: "Failed to load content. Please check your connection and try again.",
      retryable: true,
    });
  }, []);

  const handleRetry = useCallback(() => {
    setErrors(createInitialErrors());
    setIsIframeLoading(true);
    // Force iframe reload by updating key
    setIframeUrl((prev) => prev + '');
  }, []);

  // Show loading state while checking auth or intake
  if (!isLoaded || isCheckingIntake) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400">
          {!isLoaded ? 'Loading...' : 'Checking your preferences...'}
        </div>
      </div>
    );
  }

  const shouldShowChat = isSignedIn || intakeCompleted;

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white shadow-sm dark:bg-slate-900 overflow-hidden">
      {/* Intake Modal */}
      {showIntakeModal && (
        <IntakeFormModal
          onComplete={handleIntakeComplete}
          onSkip={handleIntakeSkip}
        />
      )}

      {/* Error Overlay */}
      {errors.iframe && (
        <ErrorOverlay
          error={errors.iframe}
          onRetry={errors.retryable ? handleRetry : undefined}
          retryLabel="Retry"
        />
      )}

      {/* Main Content */}
      {shouldShowChat ? (
        <>
          {/* Header - Optional: Shows what content is being displayed */}
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {intakeData ? getIframeContentName(intakeData) : 'Chat'}
              </h2>
              {intakeData && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Response style: {intakeData.response_style}
                </p>
              )}
            </div>
            
            {/* Settings Button */}
            <button
              onClick={() => {
                // Temporarily remove localStorage to prevent auto-close
                if (typeof window !== "undefined") {
                  const stored = localStorage.getItem(INTAKE_STORAGE_KEY);
                  if (stored) {
                    // Store it temporarily in component state
                    setIntakeData(JSON.parse(stored));
                    // Remove from localStorage temporarily
                    localStorage.removeItem(INTAKE_STORAGE_KEY);
                  }
                }
                setIsEditingPreferences(true);
                setShowIntakeModal(true);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Update preferences"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>

          {/* Iframe Container */}
          <div className="relative flex-1">
            {/* Loading Indicator */}
            {isIframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-500 dark:border-slate-600 dark:border-t-blue-400" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Loading content...
                  </p>
                </div>
              </div>
            )}

            {/* Iframe */}
            {iframeUrl && (
              <iframe
                src={iframeUrl}
                className="h-full w-full border-0"
                title={intakeData ? getIframeContentName(intakeData) : 'Chat Content'}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                loading="lazy"
                allow="microphone; clipboard-read; clipboard-write"
              />
            )}

            {/* No URL fallback */}
            {!iframeUrl && !isIframeLoading && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-slate-500 dark:text-slate-400">
                  No content URL configured. Please complete the intake form.
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-slate-500 dark:text-slate-400">
            Complete the intake form to start chatting
          </div>
        </div>
      )}
    </div>
  );
}
