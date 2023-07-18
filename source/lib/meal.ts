// See: https://github.com/HAWHHCalendarBot/mensa-crawler/blob/main/src/meal.rs
type PriceInEuro = number

export type MealPrices = {
	readonly PriceAttendant: PriceInEuro;
	readonly PriceGuest: PriceInEuro;
	readonly PriceStudent: PriceInEuro;
}

export type MealContents = {
	readonly Alcohol?: boolean;
	readonly Beef?: boolean;
	readonly Fish?: boolean;
	readonly Game?: boolean;
	readonly Gelatine?: boolean;
	readonly LactoseFree?: boolean;
	readonly Lamb?: boolean;
	readonly Pig?: boolean;
	readonly Poultry?: boolean;
	readonly Vegan?: boolean;
	readonly Vegetarian?: boolean;
}

export type Meal = MealContents & MealPrices & {
	readonly Name: string;
	readonly Category: string;
	readonly Date: `${number}-${number}-${number}`;
	readonly Additives: Readonly<Record<string, string>>;
}
