"use client";

import { useState, useRef, useEffect } from "react";

export interface LgSelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

interface LgSelectProps {
  id: string;
  options: LgSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: string;
  compact?: boolean;
  className?: string;
}

export function LgSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  icon,
  compact = false,
  className = "",
}: LgSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : placeholder;
  const isPlaceholder = !value;

  return (
    <div ref={ref} className={`lg-select relative ${compact ? "lg-select-sm" : ""} ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="lg-select-trigger"
      >
        {icon && (
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{icon}</span>
        )}
        <span className={`flex-1 text-left ${isPlaceholder ? "text-on-surface-variant/60" : ""}`}>
          {displayLabel}
        </span>
        <span className={`material-symbols-outlined text-[16px] transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      <div className={`lg-select-panel ${open ? "open" : ""}`}>
        {options.map((opt) => (
          <div
            key={opt.value}
            className={`lg-select-option ${value === opt.value ? "selected" : ""}`}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
          >
            {opt.icon && (
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${opt.color ? `bg-${opt.color}/10` : "bg-surface-container-low"}`}>
                <span className={`material-symbols-outlined text-[16px] ${opt.color ? `text-${opt.color}` : "text-on-surface-variant"}`}>
                  {opt.icon}
                </span>
              </div>
            )}
            <span>{opt.label}</span>
            <span className="material-symbols-outlined text-[16px] text-primary ml-auto opacity-0 transition-opacity"
              style={{ opacity: value === opt.value ? 1 : 0 }}
            >
              check
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface LgDatepickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LgDatepicker({
  id,
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className = "",
}: LgDatepickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + "T00:00:00");
    return new Date();
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const formatDate = (d: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  return (
    <div ref={ref} className={`lg-datepicker relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="lg-select-trigger w-full"
      >
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">calendar_today</span>
        <span className={`flex-1 text-left ${!value ? "text-on-surface-variant/60" : ""}`}>
          {value
            ? new Date(value + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
            : placeholder
          }
        </span>
        <span className={`material-symbols-outlined text-[16px] transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="lg-calendar">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewDate(new Date(year, month - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="text-sm font-semibold text-on-surface">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={() => setViewDate(new Date(year, month + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-on-surface-variant py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0">
            {days.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const dateStr = formatDate(day);
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = dateStr === value;

              return (
                <button
                  key={day}
                  onClick={() => {
                    onChange(dateStr);
                    setOpen(false);
                  }}
                  className={`w-full aspect-square flex items-center justify-center text-xs rounded-lg transition-all ${
                    isSelected
                      ? "text-white font-bold"
                      : isToday
                      ? "text-primary font-semibold bg-primary/10"
                      : "text-on-surface hover:bg-surface-container-low"
                  }`}
                  style={isSelected ? { background: "var(--color-primary)" } : {}}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/30">
            <button
              onClick={() => {
                const t = new Date();
                const ts = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
                onChange(ts);
                setOpen(false);
              }}
              className="text-xs text-primary hover:underline"
            >
              Hari Ini
            </button>
            {value && (
              <button
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PaginationProps {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  showPerPage?: boolean;
}

export function Pagination({
  page,
  lastPage,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  showPerPage = true,
}: PaginationProps) {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-3 gap-2 border-t border-outline-variant/30 overflow-visible">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs sm:text-sm text-on-surface-variant whitespace-nowrap">
          {start}-{end} dari {total}
        </span>
        {showPerPage && onPerPageChange && (
          <div className="relative">
            <LgSelect
              id={`perPage-${Math.random()}`}
              compact
              value={String(perPage)}
              onChange={(v) => onPerPageChange(Number(v))}
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
                { value: "100", label: "100" },
              ]}
              placeholder="Baris"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg text-xs sm:text-sm hover:bg-surface-container-low disabled:opacity-40"
        >
          &laquo;
        </button>
        {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
          const p = page <= 3 ? i + 1 : page + i - 2;
          if (p < 1 || p > lastPage) return null;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs sm:text-sm ${
                p === page ? "text-white" : "hover:bg-surface-container-low"
              }`}
              style={p === page ? { background: "var(--color-primary)" } : {}}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(Math.min(lastPage, page + 1))}
          disabled={page === lastPage}
          className="w-8 h-8 rounded-lg text-xs sm:text-sm hover:bg-surface-container-low disabled:opacity-40"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}
