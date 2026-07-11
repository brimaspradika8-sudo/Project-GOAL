import { useState, useEffect, useRef, useCallback } from "react";

// ─── Data ───────────────────────────────────────────────────────────────────

const PROVINCES: { id: string; name: string }[] = [
  { id: "11", name: "Aceh" },
  { id: "12", name: "Sumatera Utara" },
  { id: "13", name: "Sumatera Barat" },
  { id: "14", name: "Riau" },
  { id: "15", name: "Jambi" },
  { id: "16", name: "Sumatera Selatan" },
  { id: "17", name: "Bengkulu" },
  { id: "18", name: "Lampung" },
  { id: "19", name: "Kep. Bangka Belitung" },
  { id: "21", name: "Kep. Riau" },
  { id: "31", name: "DKI Jakarta" },
  { id: "32", name: "Jawa Barat" },
  { id: "33", name: "Jawa Tengah" },
  { id: "34", name: "DI Yogyakarta" },
  { id: "35", name: "Jawa Timur" },
  { id: "36", name: "Banten" },
  { id: "51", name: "Bali" },
  { id: "52", name: "Nusa Tenggara Barat" },
  { id: "53", name: "Nusa Tenggara Timur" },
  { id: "61", name: "Kalimantan Barat" },
  { id: "62", name: "Kalimantan Tengah" },
  { id: "63", name: "Kalimantan Selatan" },
  { id: "64", name: "Kalimantan Timur" },
  { id: "65", name: "Kalimantan Utara" },
  { id: "71", name: "Sulawesi Utara" },
  { id: "72", name: "Sulawesi Tengah" },
  { id: "73", name: "Sulawesi Selatan" },
  { id: "74", name: "Sulawesi Tenggara" },
  { id: "75", name: "Gorontalo" },
  { id: "76", name: "Sulawesi Barat" },
  { id: "81", name: "Maluku" },
  { id: "82", name: "Maluku Utara" },
  { id: "91", name: "Papua Barat" },
  { id: "94", name: "Papua" },
];

const REGENCIES: Record<string, { id: string; name: string }[]> = {
  "31": [
    { id: "3171", name: "Kota Jakarta Pusat" },
    { id: "3172", name: "Kota Jakarta Utara" },
    { id: "3173", name: "Kota Jakarta Barat" },
    { id: "3174", name: "Kota Jakarta Selatan" },
    { id: "3175", name: "Kota Jakarta Timur" },
    { id: "3101", name: "Kab. Kepulauan Seribu" },
  ],
  "32": [
    { id: "3201", name: "Kab. Bogor" },
    { id: "3202", name: "Kab. Sukabumi" },
    { id: "3203", name: "Kab. Cianjur" },
    { id: "3204", name: "Kab. Bandung" },
    { id: "3205", name: "Kab. Garut" },
    { id: "3271", name: "Kota Bogor" },
    { id: "3273", name: "Kota Bandung" },
    { id: "3275", name: "Kota Bekasi" },
    { id: "3276", name: "Kota Depok" },
    { id: "3277", name: "Kota Cimahi" },
  ],
  "33": [
    { id: "3301", name: "Kab. Cilacap" },
    { id: "3302", name: "Kab. Banyumas" },
    { id: "3372", name: "Kota Surakarta" },
    { id: "3374", name: "Kota Semarang" },
  ],
  "34": [
    { id: "3401", name: "Kab. Kulon Progo" },
    { id: "3402", name: "Kab. Bantul" },
    { id: "3403", name: "Kab. Gunung Kidul" },
    { id: "3404", name: "Kab. Sleman" },
    { id: "3471", name: "Kota Yogyakarta" },
  ],
  "35": [
    { id: "3501", name: "Kab. Pacitan" },
    { id: "3502", name: "Kab. Ponorogo" },
    { id: "3578", name: "Kota Surabaya" },
    { id: "3573", name: "Kota Malang" },
  ],
  "36": [
    { id: "3601", name: "Kab. Pandeglang" },
    { id: "3602", name: "Kab. Lebak" },
    { id: "3603", name: "Kab. Tangerang" },
    { id: "3671", name: "Kota Tangerang" },
    { id: "3674", name: "Kota Tangerang Selatan" },
  ],
  "51": [
    { id: "5101", name: "Kab. Jembrana" },
    { id: "5102", name: "Kab. Tabanan" },
    { id: "5103", name: "Kab. Badung" },
    { id: "5104", name: "Kab. Gianyar" },
    { id: "5171", name: "Kota Denpasar" },
  ],
  "73": [
    { id: "7301", name: "Kab. Selayar" },
    { id: "7371", name: "Kota Makassar" },
    { id: "7372", name: "Kota Pare-pare" },
  ],
};

function getRegencies(provinceId: string) {
  if (REGENCIES[provinceId]) return REGENCIES[provinceId];
  const prov = PROVINCES.find((p) => p.id === provinceId);
  if (!prov) return [];
  const base = prov.name.replace("Kep. ", "");
  return [
    { id: `${provinceId}71`, name: `Kota ${base}` },
    { id: `${provinceId}01`, name: `Kab. ${base} Utara` },
    { id: `${provinceId}02`, name: `Kab. ${base} Selatan` },
    { id: `${provinceId}03`, name: `Kab. ${base} Timur` },
    { id: `${provinceId}04`, name: `Kab. ${base} Barat` },
  ];
}

// ─── Sports with icons ───────────────────────────────────────────────────────

const SPORTS: { id: string; label: string; icon: React.ReactNode }[] = [
  {
    id: "futsal",
    label: "Futsal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
        <path d="M12 7l2.5 2-1 3h-3l-1-3L12 7z" fill="currentColor" fillOpacity="0.6" />
        <path d="M12 17l2.5-2-1-3h-3l-1 3L12 17z" fill="currentColor" fillOpacity="0.3" />
      </svg>
    ),
  },
  {
    id: "basket",
    label: "Basket",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 9h17M3.5 15h17" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M12 3c-2.5 2.5-3.5 5.5-3.5 9s1 6.5 3.5 9" stroke="currentColor" strokeWidth="1.2" />
        <path d="M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: "badminton",
    label: "Badminton",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <path d="M5 19l8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="14.5" cy="9.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11.5 6.5l6 6M10.5 9.5l3-3M13.5 12.5l3-3" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
        <circle cx="14.5" cy="9.5" r="1.2" fill="currentColor" fillOpacity="0.5" />
      </svg>
    ),
  },
  {
    id: "voli",
    label: "Voli",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 12h18" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
        <path d="M12 3c3 3 4.5 6 4.5 9" stroke="currentColor" strokeWidth="1.2" />
        <path d="M12 3c-2 3-3 6.5-3 9" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7.5 21c1-3 2.5-5.5 4.5-9" stroke="currentColor" strokeWidth="1.2" />
        <path d="M16.5 21c-1-3-3-6-4.5-9" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: "mini-soccer",
    label: "Mini Soccer",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="12,6 14.5,9.5 12,13 9.5,9.5" fill="currentColor" fillOpacity="0.7" />
        <polygon points="6,10.5 9.5,9.5 9.5,13.5 6,14.5" fill="currentColor" fillOpacity="0.4" />
        <polygon points="18,10.5 14.5,9.5 14.5,13.5 18,14.5" fill="currentColor" fillOpacity="0.4" />
        <polygon points="9.5,13.5 14.5,13.5 13,17 11,17" fill="currentColor" fillOpacity="0.3" />
      </svg>
    ),
  },
  {
    id: "tenis",
    label: "Tenis",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 8.5C6 10 8 12 8.5 15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M20.5 8.5C18 10 16 12 15.5 15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "tenis-meja",
    label: "Tenis Meja",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <path d="M4 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 16V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="8.5" cy="13" rx="5" ry="5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8.5" y1="8" x2="8.5" y2="16" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="16" y1="9.5" x2="12" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "lainnya",
    label: "Lainnya",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="8" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

// ─── Username helpers ────────────────────────────────────────────────────────

const ADJECTIVES = ["Tangguh", "Cepat", "Elite", "Legend", "Juara", "Handal", "Gesit", "Solid"];
const NOUNS = ["Striker", "Kiper", "Playmaker", "Pivot", "Smash", "Ace", "Sniper", "Pemain"];
const TAKEN_USERNAMES = new Set(["andrasaputra", "juaraelite88", "kickersolid44"]);

function suggestUsername(registerName: string): string {
  const base = registerName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15);
  let candidate = base;
  let i = 0;
  while (TAKEN_USERNAMES.has(candidate)) {
    i++;
    candidate = base + i;
  }
  return candidate;
}

function randomUsername(): string {
  let candidate = "";
  do {
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const num = Math.floor(Math.random() * 90) + 10;
    candidate = `${noun}${adj}${num}`;
  } while (TAKEN_USERNAMES.has(candidate.toLowerCase()));
  return candidate;
}

function checkUsername(username: string): boolean {
  return !TAKEN_USERNAMES.has(username.toLowerCase());
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-7">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-0.5 flex-1 rounded-full transition-all duration-500"
          style={{ backgroundColor: i < step ? "var(--floodlight)" : "var(--line)" }}
        />
      ))}
    </div>
  );
}

function Eyebrow({ label }: { label: string }) {
  return (
    <p
      className="text-xs tracking-widest mb-2 uppercase"
      style={{ color: "var(--floodlight)", fontFamily: "'JetBrains Mono', monospace" }}
    >
      {label}
    </p>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-3xl mb-1.5 leading-none"
      style={{
        fontFamily: "'Bebas Neue', cursive",
        color: "var(--chalk)",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </h2>
  );
}

function SubText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted)" }}>
      {children}
    </p>
  );
}

function StampButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full font-semibold tracking-widest transition-all duration-200"
      style={{
        padding: "14px 24px",
        borderRadius: "10px",
        fontFamily: "'Bebas Neue', cursive",
        fontSize: "18px",
        letterSpacing: "0.08em",
        backgroundColor: disabled ? "var(--floodlight-dim)" : "var(--floodlight)",
        color: disabled ? "rgba(237,235,227,0.35)" : "var(--stadium-night)",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 0 20px rgba(242,183,5,0.25)",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 32px rgba(242,183,5,0.45)";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 20px rgba(242,183,5,0.25)";
          (e.currentTarget as HTMLButtonElement).style.transform = "none";
        }
      }}
    >
      {label}
    </button>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  suffix,
  error,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <div
        className="flex items-center gap-2 px-4 transition-all duration-200"
        style={{
          borderRadius: "10px",
          border: `1.5px solid ${error ? "var(--error)" : "var(--line)"}`,
          backgroundColor: "rgba(255,255,255,0.03)",
        }}
        onFocusCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = error
            ? "var(--error)"
            : "var(--floodlight)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 3px ${
            error ? "rgba(229,72,77,0.15)" : "rgba(242,183,5,0.12)"
          }`;
        }}
        onBlurCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = error
            ? "var(--error)"
            : "var(--line)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        {prefix && (
          <span className="text-sm flex-shrink-0" style={{ color: "var(--muted)" }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm py-3.5"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: "var(--chalk)",
            caretColor: "var(--floodlight)",
          }}
        />
        {suffix && <span className="flex-shrink-0 flex items-center">{suffix}</span>}
      </div>
      {hint && !error && (
        <p className="text-xs mt-1.5 ml-1" style={{ color: "var(--pitch-green)" }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs mt-1.5 ml-1" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selectedName = options.find((o) => o.id === value)?.name ?? "";
  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative mb-4">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-left transition-all duration-200"
        style={{
          borderRadius: "10px",
          border: "1.5px solid var(--line)",
          backgroundColor: disabled ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)",
          color: selectedName ? "var(--chalk)" : "var(--muted)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          fontFamily: "'Inter', sans-serif",
        }}
        onMouseEnter={(e) => {
          if (!disabled)
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--floodlight)";
        }}
        onMouseLeave={(e) => {
          if (!disabled)
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)";
        }}
      >
        <span>{selectedName || placeholder}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            color: "var(--muted)",
            flexShrink: 0,
          }}
        >
          <path
            d="M2 5l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <div
          className="absolute z-50 w-full mt-1.5 overflow-hidden"
          style={{
            borderRadius: "10px",
            border: "1.5px solid var(--line)",
            backgroundColor: "#1A3038",
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div className="p-2" style={{ borderBottom: "1px solid var(--line)" }}>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari..."
              className="w-full bg-transparent outline-none text-sm px-2 py-1.5"
              style={{
                color: "var(--chalk)",
                fontFamily: "'Inter', sans-serif",
                caretColor: "var(--floodlight)",
              }}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                Tidak ditemukan
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors duration-150"
                  style={{
                    color: opt.id === value ? "var(--floodlight)" : "var(--chalk)",
                    backgroundColor:
                      opt.id === value ? "rgba(242,183,5,0.08)" : "transparent",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      opt.id === value ? "rgba(242,183,5,0.08)" : "transparent";
                  }}
                >
                  {opt.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Foto + Username ─────────────────────────────────────────────────

function StepPhotoUsername({
  username,
  onUsernameChange,
  avatarUrl,
  onAvatarChange,
  onNext,
}: {
  username: string;
  onUsernameChange: (v: string) => void;
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
  onNext: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [rolling, setRolling] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkAvailability = useCallback((v: string) => {
    if (v.length < 3) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setStatus(checkUsername(v) ? "available" : "taken");
    }, 500);
  }, []);

  useEffect(() => {
    checkAvailability(username);
  }, [username, checkAvailability]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onAvatarChange(url);
  }

  function handleRandomize() {
    if (rolling) return;
    setRolling(true);
    setTimeout(() => {
      onUsernameChange(randomUsername());
      setRolling(false);
    }, 600);
  }

  const usernameFormatError =
    username.length > 0 && !/^[a-zA-Z0-9_]+$/.test(username)
      ? "Hanya huruf, angka, dan underscore"
      : undefined;

  const canProceed =
    username.length >= 3 &&
    !usernameFormatError &&
    status === "available";

  const statusIcon =
    status === "checking" ? (
      <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="var(--muted)"
          strokeWidth="2"
          strokeDasharray="25"
          strokeDashoffset="10"
        />
      </svg>
    ) : status === "available" ? (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="rgba(46,125,91,0.2)" />
        <path
          d="M4.5 8l2.5 2.5 4.5-4.5"
          stroke="var(--pitch-green)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ) : status === "taken" ? (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="rgba(229,72,77,0.15)" />
        <path
          d="M5.5 5.5l5 5M10.5 5.5l-5 5"
          stroke="var(--error)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ) : null;

  return (
    <div>
      <Eyebrow label="LANGKAH 1/3" />
      <Headline>SIAPA KAMU DI ARENA?</Headline>
      <SubText>Pilih foto dan nama arena yang akan dilihat pemain lain.</SubText>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative overflow-hidden transition-all duration-200"
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              border: "2px solid var(--line)",
              backgroundColor: "rgba(255,255,255,0.04)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--floodlight)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)";
            }}
          >
            {preview ? (
              <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: "var(--muted)" }}
                >
                  <path
                    d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            )}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 flex items-center justify-center"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "var(--floodlight)",
              color: "var(--stadium-night)",
              border: "2px solid var(--stadium-panel)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              lineHeight: 1,
            }}
          >
            +
          </button>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-2 text-xs tracking-wide"
          style={{
            color: "var(--floodlight)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            opacity: 0.85,
          }}
        >
          Ubah Foto
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Username */}
      <label
        className="block text-xs mb-1.5 tracking-wider uppercase"
        style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        Nama Arena
      </label>
      <div className="flex gap-2">
        <div className="flex-1">
          <InputField
            value={username}
            onChange={onUsernameChange}
            placeholder="username"
            prefix="@"
            suffix={statusIcon}
            error={
              usernameFormatError ??
              (status === "taken" ? "Username sudah dipakai" : undefined)
            }
            hint={status === "available" ? "Username tersedia" : undefined}
          />
        </div>
        <button
          onClick={handleRandomize}
          title="Acak nama"
          className="flex-shrink-0 flex items-center justify-center mb-4 transition-all duration-300"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "10px",
            border: "1.5px solid var(--line)",
            backgroundColor: "rgba(255,255,255,0.03)",
            cursor: "pointer",
            transform: rolling ? "rotate(360deg)" : "none",
            transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s, background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--floodlight)";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(242,183,5,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(255,255,255,0.03)";
          }}
        >
          <span style={{ fontSize: "20px", lineHeight: 1 }}>🎲</span>
        </button>
      </div>

      <StampButton label="LANJUT" disabled={!canProceed} onClick={onNext} />
    </div>
  );
}

// ─── Step 2: Wilayah ─────────────────────────────────────────────────────────

function StepRegion({
  provinceId,
  regencyId,
  onProvinceChange,
  onRegencyChange,
  onNext,
}: {
  provinceId: string;
  regencyId: string;
  onProvinceChange: (id: string) => void;
  onRegencyChange: (id: string) => void;
  onNext: () => void;
}) {
  const regencies = provinceId ? getRegencies(provinceId) : [];

  return (
    <div>
      <Eyebrow label="LANGKAH 2/3" />
      <Headline>DI MANA ARENAMU?</Headline>
      <SubText>Pilih kabupaten/kota tempat kamu biasa main.</SubText>

      <label
        className="block text-xs mb-1.5 tracking-wider uppercase"
        style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        Provinsi
      </label>
      <SearchableDropdown
        options={PROVINCES}
        value={provinceId}
        onChange={(id) => {
          onProvinceChange(id);
          onRegencyChange("");
        }}
        placeholder="Pilih provinsi..."
      />

      <label
        className="block text-xs mb-1.5 tracking-wider uppercase"
        style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        Kabupaten/Kota
      </label>
      <SearchableDropdown
        options={regencies}
        value={regencyId}
        onChange={onRegencyChange}
        placeholder={
          provinceId ? "Pilih kabupaten/kota..." : "Pilih provinsi terlebih dahulu"
        }
        disabled={!provinceId}
      />

      <StampButton label="LANJUT" disabled={!regencyId} onClick={onNext} />
    </div>
  );
}

// ─── Step 3: Olahraga ────────────────────────────────────────────────────────

function StepSports({
  selected,
  onToggle,
  onSubmit,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <Eyebrow label="LANGKAH 3/3" />
      <Headline>OLAHRAGA FAVORITMU</Headline>
      <SubText>Pilih minimal 1, boleh lebih.</SubText>

      <div
        className="grid gap-2 mb-7"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {SPORTS.map((sport) => {
          const active = selected.includes(sport.id);
          return (
            <button
              key={sport.id}
              onClick={() => onToggle(sport.id)}
              className="flex flex-col items-center gap-1.5 py-3 px-1 transition-all duration-200"
              style={{
                borderRadius: "12px",
                border: `1.5px solid ${active ? "var(--floodlight)" : "var(--line)"}`,
                backgroundColor: active
                  ? "rgba(242,183,5,0.10)"
                  : "rgba(255,255,255,0.02)",
                color: active ? "var(--floodlight)" : "var(--muted)",
                cursor: "pointer",
                boxShadow: active ? "0 0 14px rgba(242,183,5,0.18)" : "none",
                transform: active ? "scale(1.04)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(242,183,5,0.35)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--chalk)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "rgba(255,255,255,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "rgba(255,255,255,0.02)";
                }
              }}
            >
              <span
                style={{
                  opacity: active ? 1 : 0.55,
                  transition: "opacity 0.2s",
                }}
              >
                {sport.icon}
              </span>
              <span
                className="text-center leading-tight"
                style={{
                  fontSize: "10px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                }}
              >
                {sport.label}
              </span>
              {active && (
                <span
                  className="absolute"
                  style={{
                    top: "6px",
                    right: "6px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--floodlight)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <StampButton
        label="AKTIFKAN KARTU"
        disabled={selected.length === 0}
        onClick={onSubmit}
      />
    </div>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <div
        className="flex items-center justify-center mb-6"
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          backgroundColor: "rgba(46,125,91,0.15)",
          border: "1.5px solid var(--pitch-green)",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M6 16l7 7 13-13"
            stroke="var(--pitch-green)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2
        className="text-4xl mb-2"
        style={{
          fontFamily: "'Bebas Neue', cursive",
          color: "var(--floodlight)",
          letterSpacing: "0.06em",
        }}
      >
        KARTU AKTIF
      </h2>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Identitasmu sudah lengkap. Selamat datang di arena!
      </p>
    </div>
  );
}

// ─── PlayerPassCard ───────────────────────────────────────────────────────────

function PlayerPassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm mx-auto relative" style={{ borderRadius: "20px", overflow: "hidden" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "20px",
          boxShadow: "0 0 0 1.5px rgba(242,183,5,0.18), 0 24px 64px rgba(0,0,0,0.6)",
        }}
      />

      {/* Kop kartu */}
      <div className="relative px-6 pt-6 pb-4" style={{ backgroundColor: "var(--stadium-night)" }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(242,183,5,0.35) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                backgroundColor: "var(--floodlight)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: "18px",
                  color: "var(--stadium-night)",
                  lineHeight: 1,
                }}
              >
                G
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: "22px",
                color: "var(--chalk)",
                letterSpacing: "0.12em",
              }}
            >
              G.O.A.L
            </span>
          </div>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            KARTU PEMAIN
          </span>
        </div>
        <p
          className="relative text-xs"
          style={{ color: "var(--floodlight-dim)", fontFamily: "'JetBrains Mono', monospace" }}
        >
          AKTIFKAN KARTU PEMAIN
        </p>
      </div>

      {/* Perforasi */}
      <div className="relative flex items-center" style={{ backgroundColor: "var(--stadium-night)" }}>
        <div
          className="absolute -left-3 w-6 h-6 rounded-full z-10"
          style={{ backgroundColor: "#0A1518" }}
        />
        <div className="flex-1 mx-4" style={{ borderTop: "1.5px dashed var(--line)" }} />
        <div
          className="absolute -right-3 w-6 h-6 rounded-full z-10"
          style={{ backgroundColor: "#0A1518" }}
        />
      </div>

      {/* Body */}
      <div className="px-6 pt-6 pb-7" style={{ backgroundColor: "var(--stadium-panel)" }}>
        {children}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

const REGISTER_NAME = "Andra Saputra";

export default function App() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    username: suggestUsername(REGISTER_NAME),
    avatarUrl: "",
    provinceId: "",
    regencyId: "",
    sports: [] as string[],
  });

  function next() {
    setStep((s) => Math.min(s + 1, 3));
  }

  function toggleSport(id: string) {
    setForm((f) => ({
      ...f,
      sports: f.sports.includes(id)
        ? f.sports.filter((s) => s !== id)
        : [...f.sports, id],
    }));
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        backgroundColor: "#0A1518",
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(242,183,5,0.06) 0%, transparent 70%)",
      }}
    >
      <PlayerPassCard>
        {done ? (
          <SuccessScreen />
        ) : (
          <>
            <ProgressBar step={step} total={3} />

            {step === 1 && (
              <StepPhotoUsername
                username={form.username}
                onUsernameChange={(v) => setForm((f) => ({ ...f, username: v }))}
                avatarUrl={form.avatarUrl}
                onAvatarChange={(url) => setForm((f) => ({ ...f, avatarUrl: url }))}
                onNext={next}
              />
            )}
            {step === 2 && (
              <StepRegion
                provinceId={form.provinceId}
                regencyId={form.regencyId}
                onProvinceChange={(id) => setForm((f) => ({ ...f, provinceId: id }))}
                onRegencyChange={(id) => setForm((f) => ({ ...f, regencyId: id }))}
                onNext={next}
              />
            )}
            {step === 3 && (
              <StepSports
                selected={form.sports}
                onToggle={toggleSport}
                onSubmit={() => setDone(true)}
              />
            )}
          </>
        )}
      </PlayerPassCard>

      {!done && (
        <p
          className="mt-5 text-xs text-center"
          style={{
            color: "var(--muted)",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
          }}
        >
          Lengkapi identitasmu sebelum masuk arena.
        </p>
      )}
    </div>
  );
}
