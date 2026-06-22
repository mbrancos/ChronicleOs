"use client";

import { useState, useEffect, useRef } from "react";

interface ConvictionItem {
  id: string;
  conviction: string;
  touchstone: string;
  isAlive: boolean;
}

interface ConvictionsPanelProps {
  items?: ConvictionItem[];
  onChange: (newItems: ConvictionItem[]) => void;
  disabled?: boolean;
}

export default function ConvictionsPanel({
  items = [],
  onChange,
  disabled = false
}: ConvictionsPanelProps) {
  const [newItemId, setNewItemId] = useState<string | null>(null);

  const handleAddItem = () => {
    if (disabled) return;

    const newId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newItem: ConvictionItem = {
      id: newId,
      conviction: "",
      touchstone: "",
      isAlive: true
    };

    setNewItemId(newId);
    onChange([...items, newItem]);
  };

  const handleRowChange = (updatedItem: ConvictionItem) => {
    const updatedItems = items.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    onChange(updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    if (disabled) return;
    const updatedItems = items.filter((item) => item.id !== id);
    onChange(updatedItems);
  };

  return (
    <div className="bg-bg-main/30 border border-white/5 rounded-sm p-5 space-y-4 shadow-none">
      <div className="flex justify-between items-center border-b border-white/10 pb-2 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gold-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h3 className="font-gothic text-base uppercase tracking-wider text-gold-accent font-bold">
            Convicções & Pilares (Âncoras de Humanidade)
          </h3>
        </div>
        {!disabled && (
          <button
            onClick={handleAddItem}
            className="text-xs uppercase tracking-wider font-bold text-gold-accent bg-burgundy/40 hover:bg-burgundy px-3 py-1.5 border border-blood-red/30 hover:border-blood-red rounded-sm transition-all duration-150 cursor-pointer shadow-none flex items-center gap-1.5"
          >
            <span>+ Adicionar Convicção</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-white/10 rounded-sm bg-bg-main/20">
        <table className="w-full text-left border-collapse font-data text-xs uppercase tracking-wider">
          <thead>
            <tr className="border-b border-white/10 bg-bg-card-dark text-text-muted select-none">
              <th className="p-3 font-bold w-[45%]">Convicção (Regra Moral)</th>
              <th className="p-3 font-bold w-[35%]">Pilar (Touchstone Humano)</th>
              <th className="p-3 font-bold text-center w-[12%]">Estado do Pilar</th>
              {!disabled && <th className="p-3 font-bold text-center w-[8%]">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <ConvictionRow
                key={item.id}
                item={item}
                onChange={handleRowChange}
                onDelete={handleDeleteItem}
                disabled={disabled}
                autoFocus={item.id === newItemId}
                onFocused={() => setNewItemId(null)}
              />
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={disabled ? 3 : 4}
                  className="p-8 text-center text-text-dim/60 italic font-reading normal-case"
                >
                  Nenhuma convicção moral ou pilar registrado. Adicione convicções para ancorar a Humanidade do seu vampiro contra a Besta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ConvictionRowProps {
  item: ConvictionItem;
  onChange: (updatedItem: ConvictionItem) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
  autoFocus: boolean;
  onFocused: () => void;
}

function ConvictionRow({
  item,
  onChange,
  onDelete,
  disabled,
  autoFocus,
  onFocused
}: ConvictionRowProps) {
  const [localConviction, setLocalConviction] = useState(item.conviction);
  const [localTouchstone, setLocalTouchstone] = useState(item.touchstone);

  const convictionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && convictionInputRef.current) {
      convictionInputRef.current.focus();
      onFocused();
    }
  }, [autoFocus, onFocused]);

  useEffect(() => {
    setLocalConviction(item.conviction);
  }, [item.conviction]);

  useEffect(() => {
    setLocalTouchstone(item.touchstone);
  }, [item.touchstone]);

  const handleBlur = () => {
    if (localConviction !== item.conviction || localTouchstone !== item.touchstone) {
      onChange({
        id: item.id,
        conviction: localConviction,
        touchstone: localTouchstone,
        isAlive: item.isAlive
      });
    }
  };

  const handleToggleAlive = () => {
    if (disabled) return;
    onChange({
      id: item.id,
      conviction: localConviction,
      touchstone: localTouchstone,
      isAlive: !item.isAlive
    });
  };

  const rowStyle = !item.isAlive ? "line-through opacity-45 select-none transition-all duration-200" : "transition-all duration-200";

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-all duration-150">
      {/* Coluna Convicção */}
      <td className="p-1.5">
        <input
          ref={convictionInputRef}
          type="text"
          value={localConviction}
          disabled={disabled}
          placeholder={disabled ? "Sem convicção" : "Ex: Nunca mentir para quem confia em mim..."}
          onChange={(e) => setLocalConviction(e.target.value)}
          onBlur={handleBlur}
          className={`w-full bg-transparent outline-none border-b border-transparent focus:border-gold-accent/40 focus:bg-white/5 hover:border-white/10 rounded-xs h-9 px-2 text-text-primary font-reading normal-case transition-all placeholder:text-text-dim/30 disabled:opacity-60 disabled:cursor-not-allowed ${rowStyle}`}
        />
      </td>

      {/* Coluna Touchstone */}
      <td className="p-1.5">
        <input
          type="text"
          value={localTouchstone}
          disabled={disabled}
          placeholder={disabled ? "Sem pilar" : "Ex: Minha filha Clara..."}
          onChange={(e) => setLocalTouchstone(e.target.value)}
          onBlur={handleBlur}
          className={`w-full bg-transparent outline-none border-b border-transparent focus:border-gold-accent/40 focus:bg-white/5 hover:border-white/10 rounded-xs h-9 px-2 text-text-primary font-reading normal-case transition-all placeholder:text-text-dim/30 disabled:opacity-60 disabled:cursor-not-allowed ${rowStyle}`}
        />
      </td>

      {/* Coluna Estado (Vivo/Destruído) */}
      <td className="p-1.5 text-center">
        <button
          type="button"
          onClick={handleToggleAlive}
          disabled={disabled}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-xs font-data transition-all duration-150 cursor-pointer ${
            item.isAlive
              ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40"
              : "bg-hunger-red/10 border border-hunger-red/35 text-hunger-red shadow-[0_0_8px_rgba(200,36,52,0.2)]"
          } disabled:opacity-55 disabled:cursor-not-allowed`}
          title={item.isAlive ? "Marcar Pilar como Destruído (Tragédia)" : "Restaurar Pilar"}
        >
          {item.isAlive ? "VIVO ✝" : "DESTRUÍDO 💀"}
        </button>
      </td>

      {/* Coluna Ações (Excluir) */}
      {!disabled && (
        <td className="p-1.5 text-center">
          <button
            onClick={() => onDelete(item.id)}
            className="text-text-muted hover:text-hunger-red transition-colors duration-150 p-1.5 inline-flex items-center justify-center cursor-pointer rounded-sm hover:bg-hunger-red/10"
            title="Excluir Convicção"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </td>
      )}
    </tr>
  );
}
