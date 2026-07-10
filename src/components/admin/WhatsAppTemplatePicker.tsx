"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnchorButton, Button } from "./Button";
import {
  getDefaultTemplate,
  getLastPickedTemplateId,
  getTemplatesByCategory,
  getTemplateById,
  renderAssignCustomerMessage,
  renderBookingMessage,
  renderDriverMessage,
  setLastPickedTemplateId,
  subscribeWhatsappTemplateCache,
  type WhatsappTemplateCategory,
} from "@/lib/whatsappTemplates";
import {
  buildWhatsAppShareUrl,
  type AssignBooking,
} from "@/lib/services";

type BookingLike = Parameters<typeof renderBookingMessage>[0];

interface WhatsAppTemplatePickerProps {
  category: WhatsappTemplateCategory;
  booking: BookingLike | AssignBooking;
  mobile?: string | null;
  lineIndex?: number;
  mode?: "link" | "copy";
  buttonLabel?: string;
  buttonVariant?: "primary" | "outline" | "success";
  size?: "sm" | "md";
  onCopied?: () => void;
}

export function WhatsAppTemplatePicker({
  category,
  booking,
  mobile,
  lineIndex = 0,
  mode = "link",
  buttonLabel = "WhatsApp",
  buttonVariant = "success",
  size = "sm",
  onCopied,
}: WhatsAppTemplatePickerProps) {
  const [cacheTick, setCacheTick] = useState(0);
  const templates = useMemo(
    () => getTemplatesByCategory(category),
    [category, cacheTick],
  );

  useEffect(() => {
    return subscribeWhatsappTemplateCache(() => setCacheTick((n) => n + 1));
  }, []);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
    minWidth: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function updateMenuPosition() {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
      minWidth: Math.max(rect.width, 192),
    });
  }

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }
    updateMenuPosition();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function handleReposition() {
      updateMenuPosition();
    }

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  useEffect(() => {
    const last = getLastPickedTemplateId(category);
    const fallback = getDefaultTemplate(category)?.id ?? templates[0]?.id ?? null;
    setSelectedId(last ?? fallback);
  }, [category, templates]);

  const selected = selectedId ? getTemplateById(selectedId) : null;

  function buildMessage(template = selected) {
    if (!template) return "";
    if (category === "booking_confirm") {
      return renderBookingMessage(booking as BookingLike, template);
    }
    if (category === "assign_customer") {
      return renderAssignCustomerMessage(booking as AssignBooking, template);
    }
    return renderDriverMessage(booking as AssignBooking, lineIndex, template);
  }

  function handlePick(id: number) {
    setSelectedId(id);
    setLastPickedTemplateId(category, id);
    setOpen(false);

    const template = getTemplateById(id);
    const message = buildMessage(template ?? undefined);
    if (!message) return;

    if (mode === "copy") {
      void navigator.clipboard.writeText(message).then(() => onCopied?.());
      return;
    }

    if (mobile) {
      window.open(buildWhatsAppShareUrl(mobile, message), "_blank", "noopener,noreferrer");
    }
  }

  if (templates.length === 0) {
    if (mode === "copy") {
      return (
        <Button
          type="button"
          size={size}
          variant="outline"
          className="w-full sm:w-auto"
          disabled
        >
          No templates
        </Button>
      );
    }
    return null;
  }

  if (templates.length === 1) {
    const message = buildMessage(templates[0]);
    if (mode === "copy") {
      return (
        <Button
          type="button"
          size={size}
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => {
            void navigator.clipboard.writeText(message).then(() => onCopied?.());
          }}
        >
          {buttonLabel}
        </Button>
      );
    }
    if (!mobile) return null;
    return (
      <AnchorButton
        href={buildWhatsAppShareUrl(mobile, message)}
        target="_blank"
        rel="noopener noreferrer"
        size={size}
        variant={buttonVariant}
      >
        {buttonLabel}
      </AnchorButton>
    );
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        size={size}
        variant={buttonVariant}
        className="gap-1"
        onClick={toggleMenu}
      >
        {buttonLabel}
        <span className="text-xs opacity-80">▾</span>
      </Button>
      {open &&
        menuPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-40"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-50 rounded-lg border border-border bg-card-bg py-1 shadow-lg"
              style={{
                top: menuPosition.top,
                right: menuPosition.right,
                minWidth: menuPosition.minWidth,
              }}
            >
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-border-light ${
                    template.id === selectedId
                      ? "font-medium text-primary"
                      : "text-text-primary"
                  }`}
                  onClick={() => handlePick(template.id)}
                >
                  {template.name}
                  {template.is_default ? (
                    <span className="ml-2 text-xs text-text-muted">(Default)</span>
                  ) : null}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
