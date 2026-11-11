/** The 14 allergens UK food businesses must declare. */
export const ALLERGENS = [
    { id: "celery", label: "Celery", foundIn: "Stocks, soups, salad, spice blends" },
    { id: "gluten", label: "Cereals containing gluten", short: "Gluten", foundIn: "Bread, pastry, pasta, batter, sauces" },
    { id: "crustaceans", label: "Crustaceans", foundIn: "Prawns, crab, lobster, shrimp paste" },
    { id: "eggs", label: "Eggs", foundIn: "Cakes, mayonnaise, pasta, glazes" },
    { id: "fish", label: "Fish", foundIn: "Stews, stocks, sauces, dressings" },
    { id: "lupin", label: "Lupin", foundIn: "Some flours, breads and pastries" },
    { id: "milk", label: "Milk", foundIn: "Butter, cheese, cream, yoghurt" },
    { id: "molluscs", label: "Molluscs", foundIn: "Mussels, squid, oyster sauce" },
    { id: "mustard", label: "Mustard", foundIn: "Dressings, marinades, curries, sauces" },
    { id: "peanuts", label: "Peanuts", foundIn: "Suya spice, satay, sauces, oils" },
    { id: "sesame", label: "Sesame", foundIn: "Breads, hummus, tahini, oils" },
    { id: "soya", label: "Soya", foundIn: "Soy sauce, tofu, oils, marinades" },
    { id: "sulphites", label: "Sulphur dioxide and sulphites", short: "Sulphites", foundIn: "Dried fruit, wine, vinegar, stock" },
    { id: "tree_nuts", label: "Tree nuts", foundIn: "Almonds, cashews, walnuts, desserts" },
];

const byId = new Map(ALLERGENS.map((a) => [a.id, a]));

export const allergenLabel = (id: string) => byId.get(id)?.short ?? byId.get(id)?.label ?? id;
export const allergenList = (ids?: string[] | null) => (ids ?? []).map(allergenLabel).join(", ");
/** What a customer reads next to a dish. */
export const allergenSummary = (ids?: string[] | null) => (ids?.length ? `Contains ${allergenList(ids)}` : "No listed allergens");
