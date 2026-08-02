import React from "react";
import DotSlider from "./DotSlider";
import { Specialty } from "@/types/character";

interface SkillGroupProps {
  title: string;
  skillKeys: readonly string[];
  skills: Record<string, any>;
  technicalNames: Record<string, string>;
  specialties: Specialty[];
  skillsBase?: Record<string, any>;
  dicePool?: Array<{ id: string; label: string; value: number }>;
  onSkillChange: (skillKey: any, value: number) => void;
  onTraitClick?: (trait: { id: string; label: string; value: number }) => void;
  showXpDistinction?: boolean;
  disabled?: boolean;
}

export const SkillGroup: React.FC<SkillGroupProps> = React.memo(({
  title,
  skillKeys,
  skills,
  technicalNames,
  specialties,
  skillsBase = {},
  dicePool = [],
  onSkillChange,
  onTraitClick,
  showXpDistinction = true,
  disabled = false,
}) => {
  return (
    <div className="space-y-1 bg-bg-main/40 p-4 border border-white/5 rounded-sm">
      <h4 className="text-xs font-data uppercase tracking-wider text-blood-red font-bold mb-2">
        {title}
      </h4>
      {skillKeys.map((skill) => {
        const label = technicalNames[skill] || skill;
        const value = skills[skill] || 0;
        const isSelected = dicePool.some((p) => p.id === skill);
        const skillSpecialties = specialties.filter((s) => s.skill === skill);

        return (
          <DotSlider
            key={skill}
            label={label}
            value={value}
            onChange={(newVal) => onSkillChange(skill, newVal)}
            specialties={skillSpecialties}
            allowZero
            isSelected={isSelected}
            onLabelClick={
              onTraitClick
                ? () => onTraitClick({ id: skill, label, value })
                : undefined
            }
            baseValue={skillsBase[skill]}
            showXpDistinction={showXpDistinction}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
});

SkillGroup.displayName = "SkillGroup";

export default SkillGroup;
