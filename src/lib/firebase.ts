
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

const defaultWeek = {
    monday: null, tuesday: null, wednesday: null, thursday: null,
    friday: null, saturday: null, sunday: null
};

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
        
        // Ensure plan structure is complete to avoid runtime errors
        const validatedPlan: DietPlan = {
            dayTypes: plan.dayTypes || [],
            week: plan.week || { ...defaultWeek },
        };

        // Ensure meal arrays exist inside dayTypes
        validatedPlan.dayTypes.forEach(dt => {
            dt.breakfast = dt.breakfast || [];
            dt.lunch = dt.lunch || [];
            dt.dinner = dt.dinner || [];
        });

        return validatedPlan;
    } else {
        // For a new profile, create a default plan structure
        const defaultPlan: DietPlan = {
            dayTypes: [],
            week: { ...defaultWeek },
        };
        // No need to save it here, it will be saved when the user clicks "Save Diet"
        return defaultPlan;
    }
};

export const getAllDietPlans = async (): Promise<Profiles> => {
    const db = getDb();
    const profilesRef = ref(db, DIET_PLANS_ROOT);
    const snapshot = await get(profilesRef);
    if (snapshot.exists()) {
        const profiles = snapshot.val() as Profiles;
        // Ensure every profile has a valid structure
        Object.keys(profiles).forEach(profileId => {
            const plan = profiles[profileId];
            profiles[profileId] = {
                dayTypes: plan.dayTypes || [],
                week: plan.week || { ...defaultWeek }
            };
            profiles[profileId].dayTypes.forEach(dt => {
                dt.breakfast = dt.breakfast || [];
                dt.lunch = dt.lunch || [];
                dt.dinner = dt.dinner || [];
            });
        });
        return profiles;
    }
    return {};
}

export const updateDietPlan = async (profileId: string, dietPlan: DietPlan): Promise<void> => {
    const db = getDb();
    const dietPlanRef = ref(db, `${DIET_PLANS_ROOT}/${profileId}`);
    // Sanitize diet plan before saving to remove any undefined values from JSON
    const sanitizedPlan = JSON.parse(JSON.stringify(dietPlan));
    await set(dietPlanRef, sanitizedPlan);
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
    // Using item id as the key in the JSON tree.
    const itemRef = ref(db, `${SHOPPING_LIST_PATH}/${item.id}`);
    await set(itemRef, item);
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
    
    const existingListSnapshot = await get(ref(db, SHOPPING_LIST_PATH));
    const existingList: Record<string, ShoppingItem> = existingListSnapshot.val() || {};
    
    const newItemsMap: Record<string, ShoppingItem> = {};
    items.forEach(item => {
        newItemsMap[item.id] = item;
    });

    const existingIds = Object.keys(existingList);
    const newIds = Object.keys(newItemsMap);

    const updates: { [key: string]: ShoppingItem | null } = {};

    for (const id of newIds) {
        updates[`${SHOPPING_LIST_PATH}/${id}`] = {
            ...(existingList[id] || {}),
            ...newItemsMap[id],          
        };
    }

    for (const id of existingIds) {
        if (!newItemsMap[id]) {
            updates[`${SHOPPING_LIST_PATH}/${id}`] = null;
        }
    }

    if (Object.keys(updates).length > 0) {
        await update(dbRef, updates);
    }
};
