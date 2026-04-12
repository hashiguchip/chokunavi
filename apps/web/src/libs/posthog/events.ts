import { posthog } from "./client";

export function phSetAuthSource(source: string): void {
  posthog.register({ auth_source: source });
}

export function phAuthSuccess(source: string): void {
  posthog.capture("auth_success", { auth_source: source });
}

export function phSectionView(sectionId: string): void {
  posthog.capture("section_view", { section_id: sectionId });
}

export function phInterestClick(): void {
  posthog.capture("interest_click");
}

export function phApplyClick(location: "header" | "footer"): void {
  posthog.capture("apply_click", { location });
}

export function phContactConfirm(): void {
  posthog.capture("contact_confirm");
}

export function phContactComplete(): void {
  posthog.capture("contact_complete");
}

export function phContactSubmitError(message: string): void {
  posthog.capture("contact_submit_error", { error_message: message });
}
