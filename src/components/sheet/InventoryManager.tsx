"use client";

import { useState, useEffect, useRef } from "react";

interface InventoryItem {
  id: string;
  name: string;
  effect: string;
  description: string;
}

interface InventoryManagerProps {
  items?: InventoryItem[];
  onChange: (newItems: InventoryItem[]) => void;
  disabled?: boolean;
}

export default function InventoryManager({ items = [], onChange, disabled = false }: InventoryManagerProps) {
  // Flag para rastrear se acabamos de adicionar um item, para focar no input dele
  const [newItemId, setNewItemId] = useState<string | null>(null);

  const handleAddItem = () => {
    if (disabled) return;
    
    // Gerar um UUID real seguro
    const newId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newItem: InventoryItem = {
      id: newId,
      name: "",
      effect: "",
      description: ""
    };

    setNewItemId(newId);
    onChange([...items, newItem]);
  };

  const handleRowChange = (updatedItem: InventoryItem) => {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="font-gothic text-base uppercase tracking-wider text-gold-accent font-bold">
            Inventário & Equipamento (Pertences Físicos)
          </h3>
        </div>
        {!disabled && (
          <button
            onClick={handleAddItem}
            className="text-xs uppercase tracking-wider font-bold text-gold-accent bg-burgundy/40 hover:bg-burgundy px-3 py-1.5 border border-blood-red/30 hover:border-blood-red rounded-sm transition-all duration-150 cursor-pointer shadow-none flex items-center gap-1.5"
          >
            <span>+ Adicionar Item</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-white/10 rounded-sm bg-bg-main/20">
        <table className="w-full text-left border-collapse font-data text-xs uppercase tracking-wider">
          <thead>
            <tr className="border-b border-white/10 bg-bg-card-dark text-text-muted select-none">
              <th className="p-3 font-bold w-[30%]">Nome do Item</th>
              <th className="p-3 font-bold w-[25%]">Efeito Mecânico</th>
              <th className="p-3 font-bold w-[38%]">Anotações / Descrição</th>
              {!disabled && <th className="p-3 font-bold text-center w-[7%]">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <InventoryRow
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
                  Nenhum item ou equipamento carregado no momento. Clicando em "+ Adicionar Item", você pode gerenciar armas, coldres, chaves ou pertences físicos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface InventoryRowProps {
  item: InventoryItem;
  onChange: (updatedItem: InventoryItem) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
  autoFocus: boolean;
  onFocused: () => void;
}

function InventoryRow({
  item,
  onChange,
  onDelete,
  disabled,
  autoFocus,
  onFocused
}: InventoryRowProps) {
  // Estados locais para controlar a digitação rápida sem perder o foco devido ao autosave global
  const [localName, setLocalName] = useState(item.name);
  const [localEffect, setLocalEffect] = useState(item.effect);
  const [localDescription, setLocalDescription] = useState(item.description);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focar no campo de nome caso tenhamos acabado de criar o item
  useEffect(() => {
    if (autoFocus && nameInputRef.current) {
      nameInputRef.current.focus();
      onFocused();
    }
  }, [autoFocus, onFocused]);

  // Sincronizar o estado local com eventuais alterações do estado pai externo
  useEffect(() => {
    setLocalName(item.name);
  }, [item.name]);

  useEffect(() => {
    setLocalEffect(item.effect);
  }, [item.effect]);

  useEffect(() => {
    setLocalDescription(item.description);
  }, [item.description]);

  // Função auxiliar para consolidar as alterações apenas no onBlur
  const handleBlur = () => {
    if (
      localName !== item.name ||
      localEffect !== item.effect ||
      localDescription !== item.description
    ) {
      onChange({
        id: item.id,
        name: localName,
        effect: localEffect,
        description: localDescription
      });
    }
  };

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-all duration-150">
      {/* Coluna Nome do Item */}
      <td className="p-1.5">
        <input
          ref={nameInputRef}
          type="text"
          value={localName}
          disabled={disabled}
          placeholder={disabled ? "Sem nome" : "Ex: Pistola Pesada..."}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-transparent outline-none border-b border-transparent focus:border-gold-accent/40 focus:bg-white/5 hover:border-white/10 rounded-xs h-9 px-2 text-text-primary font-reading normal-case transition-all placeholder:text-text-dim/30 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </td>

      {/* Coluna Efeito Mecânico */}
      <td className="p-1.5">
        <input
          type="text"
          value={localEffect}
          disabled={disabled}
          placeholder={disabled ? "-" : "Ex: +2 Dano (Letal)"}
          onChange={(e) => setLocalEffect(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-transparent outline-none border-b border-transparent focus:border-gold-accent/40 focus:bg-white/5 hover:border-white/10 rounded-xs h-9 px-2 text-text-primary font-reading normal-case transition-all placeholder:text-text-dim/30 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </td>

      {/* Coluna Anotações / Descrição */}
      <td className="p-1.5">
        <input
          type="text"
          value={localDescription}
          disabled={disabled}
          placeholder={disabled ? "Sem anotações" : "Ex: Guardada no porta-malas..."}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-transparent outline-none border-b border-transparent focus:border-gold-accent/40 focus:bg-white/5 hover:border-white/10 rounded-xs h-9 px-2 text-text-primary font-reading normal-case transition-all placeholder:text-text-dim/30 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </td>

      {/* Coluna Ações (Excluir) */}
      {!disabled && (
        <td className="p-1.5 text-center">
          <button
            onClick={() => onDelete(item.id)}
            className="text-text-muted hover:text-hunger-red transition-colors duration-150 p-1.5 inline-flex items-center justify-center cursor-pointer rounded-sm hover:bg-hunger-red/10"
            title="Excluir Item"
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
