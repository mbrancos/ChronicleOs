"use server";

import { joinCampaignWithCharacterAction } from "./characterActions";
import { revalidatePath } from "next/cache";

export async function importCharacterAction(characterId: string, campaignId: string) {
  const result = await joinCampaignWithCharacterAction(characterId, campaignId);
  
  if (result.success) {
    revalidatePath("/hub");
    revalidatePath(`/campanhas/${campaignId}/jogador`);
    revalidatePath(`/campanhas/${campaignId}/narrador`);
  }
  
  return result;
}
