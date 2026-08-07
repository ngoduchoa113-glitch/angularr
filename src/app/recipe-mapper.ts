import { ApiMeal, Ingredient, RecipeModel } from './models';

// Splits a measure string into quantity and unit, e.g. "1 1/2 cups" -> ["1 1/2", "cups"]
const MEASURE_RE = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*)\s+(.*)$/;

function parseQuantity(quantityStr: string): number | null {
    if (!quantityStr) {
        return null;
    }

    // check if the quantity is a fraction (e.g., "1/2", or a mixed number like "1 1/2")
    if (quantityStr.includes('/')) {
        const parts = quantityStr.trim().split(' ');
        const fractionPart = parts.pop()!;
        const wholePart = parts.length ? Number(parts.join(' ')) : 0;

        const [numerator, denominator] = fractionPart.split('/').map(Number);
        const value = wholePart + numerator / denominator;

        return Number.isNaN(value) ? null : value;
    }

    const value = parseFloat(quantityStr);
    return Number.isNaN(value) ? null : value;
}

function extractIngredients(meal: ApiMeal): Ingredient[] {
    const apiIngredients: Ingredient[] = [];

    for (let i = 1; i <= 20; i++) {
        const ingredientName = meal[`strIngredient${i}`];
        const ingredientMeasure = meal[`strMeasure${i}`];

        if (ingredientName && ingredientName.trim() !== '') {
            // Extract quantity and unit from the measure string using regex
            // slice(1) to get the matched groups (quantity and unit)
            // RegExpMatchArray --> [full match, group 1, group 2]
            const [quantityStr, unit] = (ingredientMeasure || '').match(MEASURE_RE)?.slice(1) || ['', ''];

            apiIngredients.push({
                name: ingredientName.trim(),
                quantity: parseQuantity(quantityStr),
                measure: ingredientMeasure || '',
                unit: unit || '',
            });
        }
    }

    return apiIngredients;
}

// Hình dạng của TheMealDB -> hình dạng của app.
export function toRecipeModel(meal: ApiMeal): RecipeModel {
    return {
        id: Number(meal.idMeal),
        name: meal.strMeal,
        description: meal.strInstructions,
        price: 100000,
        videoUrl: meal.strMealThumb,
        imgUrl: meal.strMealThumb,
        isFavorite: false,
        ingredients: extractIngredients(meal),
        authorEmail: '',
    };
}
