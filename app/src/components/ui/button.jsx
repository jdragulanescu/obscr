import React from "react";

export const Button = ({
  children,
  variant = "default",
  type = "button",
  disabled = false,
  onClick,
  className = "",
  ...props
}) => {
  const getButtonStyle = () => {
    const base = {
      fontFamily: "Fira Code, monospace",
      padding: "8px 16px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "500",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s ease",
      border: "1px solid",
      opacity: disabled ? 0.5 : 1,
    };

    const variants = {
      default: {
        background: "hsl(var(--muted))",
        color: "hsl(var(--foreground))",
        borderColor: "hsl(var(--border))",
      },
      primary: {
        background: "hsl(var(--primary))",
        color: "hsl(var(--background))",
        borderColor: "hsl(var(--primary))",
      },
      outline: {
        background: "transparent",
        color: "hsl(var(--foreground))",
        borderColor: "hsl(var(--border))",
      },
      secondary: {
        background: "hsl(var(--muted))",
        color: "hsl(var(--foreground))",
        borderColor: "hsl(var(--border))",
      },
    };

    return { ...base, ...variants[variant] };
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={getButtonStyle()}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};
