"use client";

import type { CSSProperties } from "react";
import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui";
import { Glyph } from "@/components/Glyph";
import type { Locale } from "@/i18n/routing";

type FieldErrors = Record<string, string[] | undefined>;

const HONEYPOT_FIELD = "company_website";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAPER_CARD_VARS: CSSProperties = {
  "--paper": "#f9f5ef",
  "--surface": "#ece6dd",
  "--card": "#fffbf5",
  "--ink": "#11091e",
  "--muted": "#5b5170",
  "--muted-2": "#8a8198",
  "--line": "#dcd3c4",
  "--black": "#08000f",
} as CSSProperties;

const CARD_CLASS =
  "relative mx-auto w-full max-w-2xl border-[3px] border-[var(--muted-canonical)] bg-card p-5 md:p-7";

/**
 * ContactForm — the single lead-capture island on /enterprise (T6).
 *
 * Convex-first: submissions go directly to `clubApp.submitLead`. Backend/API
 * route handlers and relational storage can come back later only if the product
 * needs them.
 *
 * Spam defense is the HONEYPOT (`company_website`): a visually hidden, non-tab-
 * focusable field real users never fill. Convex pretends success if it's set.
 */
export function ContactForm({
  source = "enterprise",
}: {
  source?: "enterprise" | "landing";
}) {
  const t = useTranslations("enterprise.contact");
  const locale = useLocale() as Locale;
  const submitLead = useMutation(api.clubApp.submitLead);

  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return; // double-submit guard (button is also disabled)
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: ((form.get("name") as string | null) ?? "").trim(),
      email: ((form.get("email") as string | null) ?? "").trim(),
      org: ((form.get("org") as string | null) ?? "").trim(),
      message: ((form.get("message") as string | null) ?? "").trim(),
      // Honeypot — sent as-is. Real users leave it empty.
      companyWebsite: (form.get(HONEYPOT_FIELD) as string | null) ?? "",
      source,
      locale,
    };

    const nextFieldErrors: FieldErrors = {};
    if (!payload.name) nextFieldErrors.name = [t("errors.nameRequired")];
    else if (payload.name.length > 120) {
      nextFieldErrors.name = [t("errors.nameTooLong")];
    }

    if (!payload.email) nextFieldErrors.email = [t("errors.emailRequired")];
    else if (payload.email.length > 254 || !EMAIL_RE.test(payload.email)) {
      nextFieldErrors.email = [t("errors.emailInvalid")];
    }

    if (payload.org.length > 160) {
      nextFieldErrors.org = [t("errors.orgTooLong")];
    }

    if (!payload.message) {
      nextFieldErrors.message = [t("errors.messageRequired")];
    } else if (payload.message.length > 2000) {
      nextFieldErrors.message = [t("errors.messageTooLong")];
    }

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      setFormError(t("errors.validation"));
      setSubmitting(false);
      return;
    }

    try {
      await submitLead({
        name: payload.name,
        email: payload.email,
        org: payload.org || undefined,
        message: payload.message,
        source: payload.source,
        locale: payload.locale,
        companyWebsite: payload.companyWebsite,
      });
      setSucceeded(true);
    } catch {
      setFormError(t("errors.generic"));
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <article className={CARD_CLASS} style={PAPER_CARD_VARS}>
        <div role="status">
          <div className="mb-2 flex items-center gap-2 font-display text-xl font-semibold text-ink">
            <Glyph name="star" size={18} style={{ color: "var(--green)" }} />
            {t("success.title")}
          </div>
          <p className="font-sans text-sm text-muted">{t("success.body")}</p>
        </div>
      </article>
    );
  }

  return (
    <article className={CARD_CLASS} style={PAPER_CARD_VARS}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid w-full gap-6"
        aria-describedby={formError ? "contact-form-error" : undefined}
      >
        {formError ? (
          <p
            id="contact-form-error"
            role="alert"
            className="border-2 border-black bg-card px-4 py-3 font-mono text-xs"
            style={{ color: "var(--red)" }}
          >
            {formError}
          </p>
        ) : null}

        <Field
          name="name"
          label={t("fields.name")}
          defaultValue=""
          errors={fieldErrors.name}
          required
          autoComplete="name"
        />
        <Field
          name="email"
          type="email"
          label={t("fields.email")}
          defaultValue=""
          errors={fieldErrors.email}
          required
          autoComplete="email"
        />
        <Field
          name="org"
          label={t("fields.org")}
          placeholder={t("fields.orgPlaceholder")}
          defaultValue=""
          errors={fieldErrors.org}
          autoComplete="organization"
        />

        <div className="grid gap-1.5">
          <label
            htmlFor="message"
            className="font-mono text-xs uppercase tracking-[0.1em] text-muted-2"
          >
            {t("fields.message")}
            <span className="ml-1 text-magenta">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            maxLength={2000}
            required
            placeholder={t("fields.messagePlaceholder")}
            aria-invalid={
              fieldErrors.message && fieldErrors.message.length > 0
                ? true
                : undefined
            }
            className="border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta aria-[invalid=true]:border-red"
          />
          <FieldError errors={fieldErrors.message} />
        </div>

        {/* Honeypot — visually hidden, off the tab order, ignored by real users.
            NOT display:none so naive bots that skip hidden inputs still fill it. */}
        <div
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor={HONEYPOT_FIELD}>Company website</label>
          <input
            id={HONEYPOT_FIELD}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        {/* Form action → bottom-right (GUI/dialog convention, see DESIGN.md). */}
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            <Glyph name="bolt" size={14} />
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      </form>
    </article>
  );
}

function Field({
  name,
  label,
  type = "text",
  hint,
  placeholder,
  defaultValue,
  errors,
  required,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  hint?: string;
  placeholder?: string;
  defaultValue?: string;
  errors?: string[];
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={name}
        className="font-mono text-xs uppercase tracking-[0.1em] text-muted-2"
      >
        {label}
        {required ? <span className="ml-1 text-magenta">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={errors && errors.length > 0 ? true : undefined}
        className="border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta aria-[invalid=true]:border-red"
      />
      {hint ? (
        <span className="font-mono text-xs text-muted-2">{hint}</span>
      ) : null}
      <FieldError errors={errors} />
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return (
    <span
      role="alert"
      className="font-mono text-xs"
      style={{ color: "var(--red)" }}
    >
      {errors[0]}
    </span>
  );
}
