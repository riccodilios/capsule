import type { ComponentProps } from "react";
import type { ClerkProvider } from "@clerk/nextjs";

/** Shared Capsule + Clerk glass styling (light medical UI). */
export const capsuleClerkAppearance: NonNullable<
  ComponentProps<typeof ClerkProvider>["appearance"]
> = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    colorPrimary: "#5D99A6",
    colorText: "#3d4f54",
    colorTextSecondary: "#6e878d",
    colorBackground: "#f8fafb",
    colorInputBackground: "#ffffff",
    borderRadius: "0.75rem",
  },
  elements: {
    card: [
      "border border-[color:rgba(110,135,141,0.28)]",
      "bg-white/75 shadow-[var(--capsule-glass-shadow-lg)] backdrop-blur-xl",
    ].join(" "),
    rootBox: "mx-auto w-full max-w-[420px]",
    headerTitle: "text-capsule-text font-semibold",
    headerSubtitle: "text-capsule-text-muted",
    socialButtonsBlockButton: [
      "border-[color:rgba(110,135,141,0.35)]",
      "bg-white/85 text-capsule-text hover:bg-white",
    ].join(" "),
    formFieldLabel: "text-capsule-text font-medium",
    formFieldInput: [
      "border-[color:rgba(110,135,141,0.32)]",
      "bg-white text-capsule-text placeholder:text-capsule-text-muted/70",
    ].join(" "),
    footerActionLink: "text-[#5D99A6] hover:text-[#6faab7]",
    formButtonPrimary:
      "bg-[#5D99A6] text-white shadow-sm hover:bg-[#6faab7] hover:shadow-md",
    dividerLine: "bg-[color:rgba(110,135,141,0.2)]",
    formFieldInputShowPasswordButton: "text-capsule-text-muted",
    modalContent: [
      "border border-[color:rgba(110,135,141,0.28)]",
      "bg-white/95 backdrop-blur-xl",
    ].join(" "),
    modalBackdrop: "bg-[rgba(61,79,84,0.25)] backdrop-blur-sm",
  },
};
