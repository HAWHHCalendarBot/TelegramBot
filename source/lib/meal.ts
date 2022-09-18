// See: https://github.com/HAWHHCalendarBot/mensa-crawler/blob/master/source/meal.ts
type PriceInEuro = number

export type MealPrices = {
	readonly PriceAttendant: PriceInEuro;
	readonly PriceGuest: PriceInEuro;
	readonly PriceStudent: PriceInEuro;
}

export type MealContents = {
	readonly Alcohol: boolean;
	readonly Beef: boolean;
	readonly Fish: boolean;
	readonly LactoseFree: boolean;
	readonly Pig: boolean;
	readonly Poultry: boolean;
	readonly Vegan: boolean;
	readonly Vegetarian: boolean;
}

export type Meal = MealContents & MealPrices & {
	readonly Name: string;
	readonly Category: string;
	readonly Date: string;
	readonly Additives: Readonly<Record<string, string>>;
}
