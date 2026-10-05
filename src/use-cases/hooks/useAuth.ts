"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import * as authRepo from "@/infrastructure/repositories/auth.repo";
import type {
  LoginCredentials,
  RegisterPayload,
  AcceptInvitePayload,
  User,
  ApiErrorResponse,
} from "@/core/entities";
import { AxiosError } from "axios";

/**
 * Hook: useAuth
 * Mengelola state autentikasi pengguna.
 */

const AUTH_QUERY_KEY = ["auth", "user"] as const;

/** Ambil pesan error dari AxiosError API */
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message || "Terjadi kesalahan. Silakan coba lagi.";
  }
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan. Silakan coba lagi.";
}

/** Ambil user dari localStorage */
function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // ── Mutation: login ──────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authRepo.login(credentials),
    onSuccess: (data: any) => {
      // Handle both camelCase (accessToken) and snake_case (access_token) from API
      const token = data.accessToken ?? data.access_token ?? "";
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(data.user));
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
      if (data.user?.role === "ADMIN") {
        router.push("/master-tim");
      } else {
        router.push("/proyek");
      }
    },
  });


  // ── Logout (client-side only — no endpoint) ──────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    queryClient.clear();
    router.push("/login");
  }, [queryClient, router]);

  return {
    user: getStoredUser(),
    isAuthenticated:
      typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error
      ? getErrorMessage(loginMutation.error)
      : null,
    isLoggingIn: loginMutation.isPending,
    logout,
  };
}

/**
 * Hook: useRegister
 * Mengelola pendaftaran mandiri (ADMIN / PM).
 */
export function useRegister() {
  const router = useRouter();

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authRepo.register(payload),
    onSuccess: () => {
      router.push("/login?registered=true");
    },
  });

  return {
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error
      ? getErrorMessage(registerMutation.error)
      : null,
    isRegistering: registerMutation.isPending,
    isSuccess: registerMutation.isSuccess,
  };
}

/**
 * Hook: useAcceptInvite
 * Mengelola penerimaan undangan.
 */
export function useAcceptInvite() {
  const router = useRouter();

  const acceptMutation = useMutation({
    mutationFn: (payload: AcceptInvitePayload) =>
      authRepo.acceptInvite(payload),
    onSuccess: () => {
      setTimeout(() => router.push("/login?activated=true"), 2000);
    },
  });

  return {
    acceptInvite: acceptMutation.mutateAsync,
    acceptError: acceptMutation.error
      ? getErrorMessage(acceptMutation.error)
      : null,
    isAccepting: acceptMutation.isPending,
    isSuccess: acceptMutation.isSuccess,
    data: acceptMutation.data,
  };
}
