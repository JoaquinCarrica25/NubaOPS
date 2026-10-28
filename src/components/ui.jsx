// ============================================================
// Nuba Ops — Piezas de interfaz reutilizables
// ============================================================
// Botones, tarjetas, etiquetas, barras de progreso, modales y
// estados vacíos. Todo se cambia desde aquí.
// ============================================================

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export const cx = (...c) => c.filter(Boolean).join(" ");

const VARIANTES = {
  primary:
    "bg-brand text-white hover:bg-brand-2 active:scale-[0.985] shadow-sm disabled:bg-brand/50",
  accent:
    "bg-accent text-ink font-semibold hover:brightness-95 active:scale-[0.985] shadow-sm disabled:opacity-50",
  soft: "bg-accent-soft text-accent-ink hover:bg-[#d6f2f6] active:scale-[0.985]",
  outline:
    "border border-line bg-white text-ink hover:border-ink-3/40 hover:bg-canvas active:scale-[0.985]",
  ghost: "text-ink-2 hover:bg-canvas hover:text-ink",
  danger: "bg-bad text-white hover:brightness-95 active:scale-[0.985]",
};

const TAMANOS = {
  xs: "h-8 px-2.5 text-[12px] gap-1.5 rounded-lg",
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-xl",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl2",
  icon: "h-9 w-9 rounded-xl justify-center",
};

export function Button({ variant = "primary", size = "md", className, children, ...props }) {
  return (
    <button
      className={cx(
        "inline-flex select-none items-center justify-center font-medium transition-all duration-150 disabled:cursor-not-allowed",
        VARIANTES[variant],
        TAMANOS[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-2 transition hover:bg-canvas hover:text-ink",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, as: Tag = "div", ...props }) {
  return (
    <Tag className={cx("rounded-xl2 border border-line bg-surface shadow-card", className)} {...props}>
      {children}
    </Tag>
  );
}

const TONOS = {
  neutral: "bg-canvas text-ink-2 border-line",
  ok: "bg-ok-soft text-ok border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  bad: "bg-bad-soft text-bad border-transparent",
  accent: "bg-accent-soft text-accent-ink border-transparent",
  navy: "bg-brand/5 text-brand border-transparent",
};

export function Pill({ tone = "neutral", className, children, dot, ...props }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11.5px] font-semibold leading-5",
        TONOS[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cx(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            tone === "ok" && "bg-ok",
            tone === "warn" && "bg-warn",
            tone === "bad" && "bg-bad animate-pulse",
            tone === "accent" && "bg-accent",
            tone === "neutral" && "bg-ink-3",
            tone === "navy" && "bg-brand"
          )}
        />
      )}
      {children}
    </span>
  );
}

export function Progress({ value = 0, tone = "accent", className }) {
  const v = Math.max(0, Math.min(100, value));
  const color =
    tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : tone === "bad" ? "bg-bad" : "bg-accent";
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full bg-line/80", className)}>
      <div
        className={cx("h-full rounded-full transition-[width] duration-500 ease-out", color)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Ring({ value = 0, size = 46, stroke = 5, tone = "accent" }) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = tone === "ok" ? "#0EA57A" : tone === "warn" ? "#D97706" : "#00BCD4";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E3E8EF" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 100}
          style={{ transition: "stroke-dashoffset .6s ease-out" }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums text-ink">{v}%</span>
    </div>
  );
}

export function Segmented({ options, value, onChange, className, compact }) {
  return (
    <div
      className={cx("inline-flex items-center gap-0.5 rounded-xl bg-canvas p-1", className)}
      role="tablist"
    >
      {options.map((o) => {
        const activo = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={activo}
            onClick={() => onChange(o.value)}
            className={cx(
              "rounded-lg font-semibold transition-all duration-150",
              compact ? "px-2.5 py-1.5 text-[12px]" : "px-3.5 py-1.5 text-[13px]",
              activo ? "bg-white text-ink shadow-sm" : "text-ink-3 hover:text-ink-2"
            )}
          >
            {o.label}
            {o.count != null && (
              <span
                className={cx(
                  "ml-1.5 rounded-md px-1.5 py-px text-[10.5px] font-bold tabular-nums",
                  activo ? "bg-canvas text-ink-2" : "bg-line/60 text-ink-3"
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ className }) {
  return (
    <div className={cx("relative overflow-hidden rounded-xl bg-line/60", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

export function EmptyState({ icon: Icono, title, text, action, className }) {
  return (
    <div className={cx("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {Icono && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas text-ink-3">
          <Icono size={24} />
        </div>
      )}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-ink-3">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx("block", className)}>
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-ink-3">{hint}</span>}
    </label>
  );
}

export function Sheet({ open, onClose, title, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-brand/35 backdrop-blur-[2px] animate-pop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-float animate-rise sm:rounded-3xl",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-bold tracking-tight text-ink">{title}</h2>
          <IconButton label="Cerrar" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="scroll-slim flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line bg-canvas/60 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function Stat({ label, value, sub, icon: Icono, tone = "ink" }) {
  const color =
    tone === "bad" ? "text-bad" : tone === "ok" ? "text-ok" : tone === "accent" ? "text-accent-ink" : "text-ink";
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</p>
        {Icono && <Icono size={15} className="shrink-0 text-ink-3" />}
      </div>
      <p className={cx("mt-2 text-[26px] font-bold leading-none tracking-tight tabular-nums", color)}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[12px] text-ink-3">{sub}</p>}
    </Card>
  );
}
