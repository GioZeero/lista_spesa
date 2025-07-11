import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc } from "firebase/firestore";
import type { DietPlan, ShoppingItem } from "@/types";

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DIET_PLAN_DOC_ID = "main-diet-plan";

// --- Diet Plan Functions ---

export const getDietPlan = async (): Promise<DietPlan> => {
    const docRef = doc(db, "dietPlans", DIET_PLAN_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as DietPlan;
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
    const docRef = doc(db, "dietPlans", DIET_PLAN_DOC_ID);
    await setDoc(docRef, dietPlan, { merge: true });
};


// --- Shopping List Functions ---

const SHOPPING_LIST_COLLECTION = "shoppingList";

export const getShoppingList = async (): Promise<ShoppingItem[]> => {
    const querySnapshot = await getDocs(collection(db, SHOPPING_LIST_COLLECTION));
    return querySnapshot.docs.map(doc => doc.data() as ShoppingItem);
};

export const updateShoppingItem = async (item: ShoppingItem): Promise<void> => {
    // Using item name as the document ID for simplicity and persistence
    const docRef = doc(db, SHOPPING_LIST_COLLECTION, item.id); 
    await setDoc(docRef, item, { merge: true });
};

export const deleteShoppingItem = async (itemId: string): Promise<void> => {
    const docRef = doc(db, SHOPPING_LIST_COLLECTION, itemId);
    await deleteDoc(docRef);
}

export const batchUpdateShoppingList = async (items: ShoppingItem[]): Promise<void> => {
    const batch = writeBatch(db);
    items.forEach(item => {
        const docRef = doc(db, SHOPPING_LIST_COLLECTION, item.id);
        batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
};