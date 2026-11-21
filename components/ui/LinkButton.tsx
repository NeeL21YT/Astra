import Link from "next/link";
import type { ComponentProps } from "react";
import { cx } from "./cx";

type Variant = "primary" | "secondary" | "danger" | "quiet";

const VARIANT: Record<Variant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  danger: "btn btn-danger",
  quiet: "btn btn-quiet",
};

/** Internal navigation styled as a button (a real link, so it works without scripts). */
export function LinkButton({
  variant = "primary",
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(VARIANT[variant], className)} {...rest} />;
}

/** External link styled as a button. Always opens in a new tab safely. */
export function ExternalButton({
  variant = "secondary",
  className,
  children,
  ...rest
}: ComponentProps<"a"> & { variant?: Variant }) {
  return (
    <a className={cx(VARIANT[variant], className)} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}
