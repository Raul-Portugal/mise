export type ConversionMode = 'original' | 'metric' | 'imperial';

export type UnitType = 'dry_volume' | 'liquid_volume' | 'weight' | 'count' | 'pinch';

export interface UnitDefinition {
  canonical: string;
  aliases: string[];
  type: UnitType;
  toBaseFactor: number; // For volume: ml. For weight: grams.
}

export interface ConvertedQuantity {
  displayQuantity: string;
  rawQuantity: number;
  displayUnit: string;
  exactGrams?: number;
  exactMl?: number;
  isApproximate?: boolean;
  subValue?: string; // e.g. "+ 2 tbsp"
}
