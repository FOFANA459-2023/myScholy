import React from "react";
import { Link } from "react-router-dom";

import cn from "../../lib/cn.js";

const VARIANTS = {
  primary:
    "bg-brand-900 text-white hover:bg-brand-800 active:bg-brand-950 disabled:hover:bg-brand-900",
  gold: "bg-gold-600 text-white hover:bg-gold-700 active:bg-gold-800",
  outline:
    "border border-brand-200 bg-white text-brand-900 hover:border-brand-400 hover:bg-brand-50",
  ghost: "text-brand-900 hover:bg-brand-50",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  subtle: "bg-ink-100 text-ink-800 hover:bg-ink-200",
  // For use on top of the navy/gold gradient.
  onBrand:
    "border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20",
};

const SIZES = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2",
};

const BASE =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-60 select-none";

/**
 * One button. Renders an <a>, a react-router <Link>, or a <button> depending on
 * the props - which removes the `<Link><button/></Link>` nesting that silently
 * broke form submission on the Post Scholarship page.
 */
const Button = React.forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    to,
    href,
    className,
    children,
    loading = false,
    disabled,
    fullWidth = false,
    type = "button",
    ...props
  },
  ref,
) {
  const classes = cn(
    BASE,
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
});

export default Button;
