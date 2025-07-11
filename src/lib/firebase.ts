
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getDatabase, ref, get, set, remove, update } from "firebase/database";
import type { DietPlan, Profiles, ShoppingItem } from "@/types";

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

const DIET_PLANS_ROOT = "dietPlans";

// --- Diet Plan Functions ---

export const getProfileIds = async (): Promise<string[]> => {
    const db = getDb();
    const profilesRef = ref(db, DIET_PLANS_ROOT);
    const snapshot = await get(profilesRef);
    if (snapshot.exists()) {
        return Object.keys(snapshot.val());
    }
    return [];
};

export const getDietPlan = async (profileId: string): Promise<DietPlan> => {
    const db = getDb();
    const dietPlanRef = ref(db, `${DIET_PLANS_ROOT}/${profileId}`);
    const snapshot = await get(dietPlanRef);

    if (snapshot.exists()) {
        const plan = snapshot.val() as DietPlan;
        // Ensure meal arrays exist to prevent runtime errors
        if (plan.dayTypes) {
            plan.dayTypes.forEach(dt => {
                dt.breakfast = dt.breakfast || [];
                dt.lunch = dt.lunch || [];
                dt.dinner = dt.dinner || [];
            });
        }
        return plan;
    } else {
        const defaultPlan: DietPlan = {
            dayTypes: [],
            week: {
                monday: null, tuesday: null, wednesday: null, thursday: null, 
                friday: null, saturday: null, sunday: null
            },
        };
        await updateDietPlan(profileId, defaultPlan);
        return defaultPlan;
    }
};

export const getAllDietPlans = async (): Promise<Profiles> => {
    const db = getDb();
    const profilesRef = ref(db, DIET_PLANS_ROOT);
    const snapshot = await get(profilesRef);
    if (snapshot.exists()) {
        return snapshot.val() as Profiles;
    }
    return {};
}

export const updateDietPlan = async (profileId: string, dietPlan: DietPlan): Promise<void> => {
    const db = getDb();
    const dietPlanRef = ref(db, `${DIET_PLANS_ROOT}/${profileId}`);
    await set(dietPlanRef, dietPlan);
};

export const deleteProfile = async (profileId: string): Promise<void> => {
    const db = getDb();
    const profileRef = ref(db, `${DIET_PLANS_ROOT}/${profileId}`);
    await remove(profileRef);
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
    const sanitizedId = item.id.replace(/[.#$[\]]/g, '_').toLowerCase();
    const itemRef = ref(db, `${SHOPPING_LIST_PATH}/${sanitizedId}`);
    await set(itemRef, { ...item, id: sanitizedId });
};

export const deleteShoppingItem = async (itemId: string): Promise<void> => {
    const db = getDb();
    const sanitizedId = itemId.replace(/[.#$[\]]/g, '_').toLowerCase();
    const itemRef = ref(db, `${SHOPPING_LIST_PATH}/${sanitizedId}`);
    await remove(itemRef);
}

export const batchUpdateShoppingList = async (items: ShoppingItem[]): Promise<void> => {
    const db = getDb();
    const dbRef = ref(db);
    
    // 1. Get current shopping list from DB
    const existingListSnapshot = await get(ref(db, SHOPPING_LIST_PATH));
    const existingList: Record<string, ShoppingItem> = existingListSnapshot.val() || {};
    
    // 2. Prepare the new list and track IDs
    const newItemsMap: Record<string, ShoppingItem> = {};
    items.forEach(item => {
        const sanitizedId = item.id.replace(/[.#$[\]]/g, '_').toLowerCase();
        newItemsMap[sanitizedId] = { ...item, id: sanitizedId };
    });

    const existingIds = Object.keys(existingList);
    const newIds = Object.keys(newItemsMap);

    // 3. Prepare batch updates
    const updates: { [key: string]: ShoppingItem | null } = {};

    // 3a. Add/update items
    for (const id of newIds) {
        // Add or update if the item is new or different from the existing one
        // This avoids unnecessary writes for items that haven't changed (e.g., prices, freshness)
        updates[`${SHOPPING_LIST_PATH}/${id}`] = {
            ...(existingList[id] || {}), // Preserve existing data like prices/freshness
            ...newItemsMap[id],          // Overwrite with new data like quantity/unit
        };
    }

    // 3b. Remove items that are no longer in the diet plans
    for (const id of existingIds) {
        if (!newItemsMap[id]) {
            updates[`${SHOPPING_LIST_PATH}/${id}`] = null; // Mark for deletion
        }
    }

    // 4. Execute the atomic batch update
    if (Object.keys(updates).length > 0) {
        await update(dbRef, updates);
    }
};
