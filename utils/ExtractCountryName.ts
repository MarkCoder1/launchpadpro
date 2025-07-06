import {getNames} from "country-list"

const countries = getNames();

export function extractCountryName(text: string): string | null {
  const lowerText = text.toLowerCase();
  const found = countries.find((country) =>
    lowerText.includes(country.toLowerCase())
  );
  
  console.log("country ", found);
  return found || null;
}
