"use server";

import { suggestSavings, SuggestSavingsInput, SuggestSavingsOutput } from '@/ai/flows/suggest-savings';

export async function getAiSuggestions(item: SuggestSavingsInput): Promise<SuggestSavingsOutput> {
  try {
    const result = await suggestSavings(item);
    return result;
  } catch (error) {
    console.error("AI suggestion failed:", error);
    throw new Error("Failed to get suggestions from AI. Please try again.");
  }
}
