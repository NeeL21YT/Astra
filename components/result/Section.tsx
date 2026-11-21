import type { ReactNode } from "react";

export function Section({
  id,
  title,
  children,
  className = "",
}: {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={`card ${className}`}>
      <h3 id={id} className="text-h2">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}
