// components/ui/StarRating.tsx
"use client";

import { useMemo, useState } from "react";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      className={filled ? "text-black" : "text-neutral-300"}
    >
      <path
        d="M12 17.3l-6.18 3.73 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.76 1.64 7.03L12 17.3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StarRating({
  name,
  label,
  defaultValue = 0,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: number;
  required?: boolean;
}) {
  const [value, setValue] = useState<number>(defaultValue);
  const [hover, setHover] = useState<number>(0);

  const shown = useMemo(() => (hover ? hover : value), [hover, value]);

  return (
    <div>
      <div className="text-sm font-medium">{label}</div>
      <input type="hidden" name={name} value={value} required={required} />
      <div className="mt-2 flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setValue(n)}
            className="rounded p-1 hover:bg-neutral-100"
            aria-label={`${label}: ${n}`}
          >
            <Star filled={n <= shown} />
          </button>
        ))}
        <div className="ml-2 text-sm text-neutral-600">{value ? `${value}/5` : "—"}</div>
      </div>
    </div>
  );
}
