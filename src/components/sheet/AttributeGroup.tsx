import React from "react";
import DotSlider from "./DotSlider";

interface AttributeGroupProps {
  title: string;
  attributes: Record<string, any>;
  technicalNames: Record<string, string>;
  attributesBase?: Record<string, any>;
  dicePool?: Array<{ id: string; label: string; value: number }>;
  onAttributeChange: (category: "physical" | "social" | "mental", key: string, value: number) => void;
  category: "physical" | "social" | "mental";
  onTraitClick?: (trait: { id: string; label: string; value: number }) => void;
  showXpDistinction?: boolean;
  disabled?: boolean;
}

export const AttributeGroup: React.FC<AttributeGroupProps> = React.memo(({
  title,
  attributes,
  technicalNames,
  attributesBase = {},
  dicePool = [],
  onAttributeChange,
  category,
  onTraitClick,
  showXpDistinction = true,
  disabled = false,
}) => {
  return (
    <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
      <h4 className="text-xs font-data uppercase tracking-wider text-gold-accent font-bold mb-2">
        {title}
      </h4>
      {Object.entries(attributes).map(([key, val]) => {
        const label = technicalNames[key] || key;
        const isSelected = dicePool.some((p) => p.id === key);

        return (
          <DotSlider
            key={key}
            label={label}
            value={val}
            onChange={(newVal) => onAttributeChange(category, key, newVal)}
            isSelected={isSelected}
            onLabelClick={
              onTraitClick
                ? () => onTraitClick({ id: key, label, value: val })
                : undefined
            }
            baseValue={attributesBase[key]}
            showXpDistinction={showXpDistinction}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
});

AttributeGroup.displayName = "AttributeGroup";

export default AttributeGroup;
