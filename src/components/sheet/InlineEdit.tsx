"use client";

import React, { useState, useEffect, useRef } from "react";

interface InlineEditProps {
  value: string;
  onChange: (newValue: string) => void;
  type?: "text" | "select" | "number";
  options?: string[];
  className?: string;
  placeholder?: string;
}

export default function InlineEdit({
  value,
  onChange,
  type = "text",
  options = [],
  className = "",
  placeholder = "Editar..."
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  // Sincronizar com mudanças de valor externas
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue.trim() !== value.trim()) {
      onChange(currentValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      if (currentValue.trim() !== value.trim()) {
        onChange(currentValue.trim());
      }
    } else if (e.key === "Escape") {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (type === "select") {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          className={`bg-bg-input border border-gold-accent/40 rounded-sm px-1 py-0.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold-accent text-sm ${className}`}
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-bg-card text-text-primary">
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === "number" ? "number" : "text"}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        placeholder={placeholder}
        className={`bg-bg-input border border-gold-accent/40 rounded-sm px-2 py-0.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-gold-accent focus:border-gold-accent w-full text-sm ${className}`}
      />
    );
  }

  const displayValue = value.trim() || placeholder;

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`hover:bg-white/5 hover:text-white px-1.5 py-0.5 rounded-sm transition-colors duration-150 cursor-pointer inline-block max-w-full truncate min-w-[60px] min-h-5 ${
        !value.trim() ? "text-text-muted/40 italic" : ""
      } ${className}`}
      title="Clique para editar"
    >
      {displayValue}
    </span>
  );
}
