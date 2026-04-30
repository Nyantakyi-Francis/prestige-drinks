"use client";

import { useId, useState } from "react";

export function PasswordField(props: {
  id?: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
}) {
  const reactId = useId();
  const id = props.id ?? `password-${reactId}`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className={props.className}
        id={id}
        name={props.name}
        type={visible ? "text" : "password"}
        autoComplete={props.autoComplete}
        required={props.required}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

