export interface Ingredient {
    name: string;
    quantity: number | null;
    unit: string;
    measure: string
}

export interface RecipeModel {
    id: number;
    name: string;
    description: string;
    price: number;
    videoUrl?: string;
    imgUrl: string;
    isFavorite: boolean
    ingredients: Ingredient[] | ApiIngridinent[];
    authorEmail?: string
}


export interface ApiMeal {
    idMeal: string,
    strMeal: string,
    strMealThumb: string,
    strInstructions: string,
    [key: string]: string | null,
}

export interface MealsResponse {
    meals: ApiMeal[] | null;
}

export interface ApiIngridinent {
    name: string;
    quantity: string;
    unit: string
}





