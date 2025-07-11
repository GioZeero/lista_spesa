import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getDatabase, ref, get, set, remove, update } from "firebase/database";
import type { DietPlan, ShoppingItem } from "@/types";

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

function getFirebaseApp() {
    // Basic validation for the databaseURL
    if (!firebaseConfig.databaseURL || !firebaseConfig.databaseURL.startsWith('https')) {
        throw new Error("FIREBASE FATAL ERROR: Invalid or missing NEXT_PUBLIC_FIREBASE_DATABASE_URL in .env file. Please provide the full URL of your Realtime Database (e.g., https://<your-project>.firebaseio.com).");
    }

    if (getApps().length > 0) {
        return getApp();
    }
    
    return initializeApp(firebaseConfig);
}

const getDb = () => {
    const app = getFirebaseApp();
    return getDatabase(app);
}

const DIET_PLAN_PATH = "dietPlans/main-diet-plan";

// --- Diet Plan Functions ---

export const getDietPlan = async (): Promise<DietPlan> => {
    const db = getDb();
    const dietPlanRef = ref(db, DIET_PLAN_PATH);
    const snapshot = await get(dietPlanRef);

    if (snapshot.exists()) {
        return snapshot.val() as DietPlan;
    } else {
        // Return a default empty structure if it doesn't exist
        const defaultPlan: DietPlan = {
            dayTypes: [],
            week: {
                monday: null,
                tuesday: null,
                wednesday: null,
                thursday: null,
                friday: null,
                saturday: null,
                sunday: null,
            },
        };
        await updateDietPlan(defaultPlan);
        return defaultPlan;
    }
};

export const updateDietPlan = async (dietPlan: DietPlan): Promise<void> => {
    const db = getDb();
    const dietPlanRef = ref(db, DIET_PLAN_PATH);
    await set(dietPlanRef, dietPlan);
};


// --- Shopping List Functions ---

const SHOPPING_LIST_PATH = "shoppingList";

export const getShoppingList = async (): Promise<ShoppingItem[]> => {
    const db = getDb();
    const listRef = ref(db, SHOPPING_LIST_PATH);
    const snapshot = await get(listRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert object of items back to an array
        return Object.values(data) as ShoppingItem[];
    }
    return [];
};

export const updateShoppingItem = async (item: ShoppingItem): Promise<void> => {
    const db = getDb();
    // Using item id as the key in the JSON tree. Sanitize the ID to be Firebase-key-friendly.
    const sanitizedId = item.id.replace(/[.#$[\]]/g, '_');
    const itemRef = ref(db, `${SHOPPING_LIST_PATH}/${sanitizedId}`);
    await set(itemRef, { ...item, id: sanitizedId });
};

export const deleteShoppingItem = async (itemId: string): Promise<void> => {
    const db = getDb();
    const sanitizedId = itemId.replace(/[.#$[\]]/g, '_');
    const itemRef = ref(db, `${SHOPPING_LIST_PATH}/${sanitizedId}`);
    await remove(itemRef);
}

export const batchUpdateShoppingList = async (items: ShoppingItem[]): Promise<void> => {
    const db = getDb();
    const updates: { [key: string]: ShoppingItem | null } = {};
    const sanitizedItems = items.map(item => {
        const sanitizedId = item.id.replace(/[.#$[\]]/g, '_');
        return { ...item, id: sanitizedId };
    });

    // First, clear the existing list
    const listRef = ref(db, SHOPPING_LIST_PATH);
    await set(listRef, null);

    // Then, add the new items
    sanitizedItems.forEach(item => {
        updates[`${SHOPPING_LIST_PATH}/${item.id}`] = item;
    });
    
    await update(ref(db), updates);
};
