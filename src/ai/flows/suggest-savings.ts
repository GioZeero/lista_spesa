'use server';

/**
 * @fileOverview AI tool that suggests alternative items from other stores based on the lowest price per unit.
 *
 * - suggestSavings - A function that handles the suggestion process.
 * - SuggestSavingsInput - The input type for the suggestSavings function.
 * - SuggestSavingsOutput - The return type for the suggestSavings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSavingsInputSchema = z.object({
  item: z.string().describe('The name of the item.'),
  quantity: z.number().describe('The quantity of the item.'),
  unit: z.string().describe('The unit of the item (e.g., kg, lbs, piece).'),
  familaPrice: z.number().optional().describe('The price of the item at Famila.'),
  lidlPrice: z.number().optional().describe('The price of the item at Lidl.'),
  primoprezzoPrice: z.number().optional().describe('The price of the item at Primoprezzo.'),
});
export type SuggestSavingsInput = z.infer<typeof SuggestSavingsInputSchema>;

const SuggestSavingsOutputSchema = z.object({
  suggestedAlternatives: z.array(
    z.object({
      store: z.string().describe('The store where the alternative item is available.'),
      alternativeItem: z.string().describe('The name of the alternative item.'),
      price: z.number().describe('The price of the alternative item.'),
      pricePerUnit: z.number().describe('The price per unit of the alternative item.'),
      reason: z.string().describe('The reason why this item is suggested as an alternative.'),
    })
  ).describe('A list of suggested alternative items from other stores.'),
});
export type SuggestSavingsOutput = z.infer<typeof SuggestSavingsOutputSchema>;

export async function suggestSavings(input: SuggestSavingsInput): Promise<SuggestSavingsOutput> {
  return suggestSavingsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSavingsPrompt',
  input: {schema: SuggestSavingsInputSchema},
  output: {schema: SuggestSavingsOutputSchema},
  prompt: `Based on the item, quantity, unit, and prices at different stores, suggest alternative items from other stores that have a lower price per unit.

Item: {{item}}
Quantity: {{quantity}}
Unit: {{unit}}
Famila Price: {{familaPrice}}
Lidl Price: {{lidlPrice}}
Primoprezzo Price: {{primoprezzoPrice}}

Consider these factors when suggesting alternatives:
- Price per unit compared to other stores.
- Similarity of the alternative item to the original item.
- Availability of the item at the suggested store.

Suggest at least one alternative if possible.
`,
});

const suggestSavingsFlow = ai.defineFlow(
  {
    name: 'suggestSavingsFlow',
    inputSchema: SuggestSavingsInputSchema,
    outputSchema: SuggestSavingsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
