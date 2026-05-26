import { useCallback, useEffect, useState } from "react";
import {
  defaultIdentityVerificationState,
  fetchIdentityVerificationState,
  getRequiredIdentityStep,
  type IdentityVerificationState,
} from "../utils/identityVerification";

function useIdentityVerificationState(enabled: boolean) {
  const [identityState, setIdentityState] = useState<IdentityVerificationState>(
    defaultIdentityVerificationState,
  );
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState("");

  const refreshIdentityState = useCallback(async () => {
    if (!enabled) {
      setIdentityState(defaultIdentityVerificationState);
      setIsLoading(false);
      setError("");
      return defaultIdentityVerificationState;
    }

    setIsLoading(true);

    try {
      const nextState = await fetchIdentityVerificationState();
      setIdentityState(nextState);
      setError("");
      return nextState;
    } catch (refreshError) {
      const nextError =
        refreshError instanceof Error
          ? refreshError.message
          : "Không thể tải trạng thái xác thực danh tính.";
      setIdentityState(defaultIdentityVerificationState);
      setError(nextError);
      return defaultIdentityVerificationState;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshIdentityState();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshIdentityState]);

  return {
    error,
    identityState,
    isLoading,
    refreshIdentityState,
    requiredIdentityStep: getRequiredIdentityStep(identityState),
  };
}

export default useIdentityVerificationState;
