/// <reference types="vite/client" />

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { IngredientItem, UserProfile, MealPlan, InventoryTransaction } from '../types';

// Use environment variables with fallbacks for development
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'AIzaSyAXRRVnX5YUwsTGGllsXXbB8si1BQlHXBU',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'amplified-bit-d5xj8.firebaseapp.com',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'amplified-bit-d5xj8',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'amplified-bit-d5xj8.firebasestorage.app',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '183626167815',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || '1:183626167815:web:21d40fb22d82656f67dca2'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, 'ai-studio-6744b13e-ea7a-441f-92bb-7b364958a3a9');
export const auth = getAuth(app);

// Simple anonymous sign-in to ensure security rules pass if auth is enforced
export async function ensureAuth() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    return auth.currentUser?.uid || getLocalUserId();
  } catch (error) {
    console.warn('Firebase anonymous auth is disabled, using local user:', error);
    return getLocalUserId();
  }
}

function getLocalUserId(): string {
  if (typeof window !== 'undefined') {
    let localUid = localStorage.getItem('fridgechef_anonymous_uid');
    if (!localUid) {
      localUid = `local_user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('fridgechef_anonymous_uid', localUid);
    }
    return localUid;
  }
  return 'default-user';
}

// ----------------------------------------------------
// DB Services
// ----------------------------------------------------

// User Profile — Western default preferences
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const profileDoc = doc(db, 'users', userId);
  const snap = await getDoc(profileDoc);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  // Default Profile — optimized for Western (US/EU) users
  const defaultProfile: UserProfile = {
    userId,
    householdSize: 2,
    servingsMultiplier: 1.0,
    cuisinesPreferred: ['American', 'Italian', 'Mediterranean'],
    allergens: [],
    dietaryGoals: ['Balanced Nutrition'],
    cookingSkill: 'intermediate',
    kitchenTools: ['Frying Pan', 'Oven', 'Microwave']
  };
  await setDoc(profileDoc, defaultProfile);
  return defaultProfile;
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const profileDoc = doc(db, 'users', userId);
  await setDoc(profileDoc, profile, { merge: true });
}

// Ingredients / Inventory
export async function getIngredients(userId: string): Promise<IngredientItem[]> {
  const colRef = collection(db, 'ingredients');
  const q = query(colRef, where('userId', '==', userId));
  const snap = await getDocs(q);
  const list: IngredientItem[] = [];
  snap.forEach(docSnap => {
    list.push({ id: docSnap.id, ...docSnap.data() } as IngredientItem);
  });
  return list;
}

export async function saveIngredient(ingredient: IngredientItem): Promise<void> {
  const docRef = doc(db, 'ingredients', ingredient.id);
  await setDoc(docRef, ingredient);
}

export async function deleteIngredient(id: string): Promise<void> {
  const docRef = doc(db, 'ingredients', id);
  await deleteDoc(docRef);
}

// Meal Plans
export async function getMealPlans(userId: string): Promise<MealPlan[]> {
  const colRef = collection(db, 'meal_plans');
  const q = query(colRef, where('userId', '==', userId));
  const snap = await getDocs(q);
  const list: MealPlan[] = [];
  snap.forEach(docSnap => {
    list.push({ id: docSnap.id, ...docSnap.data() } as MealPlan);
  });
  return list;
}

export async function saveMealPlan(plan: MealPlan): Promise<void> {
  const docRef = doc(db, 'meal_plans', plan.id);
  await setDoc(docRef, plan);
}

// Inventory Transactions
export async function getTransactions(userId: string): Promise<InventoryTransaction[]> {
  const colRef = collection(db, 'transactions');
  const q = query(colRef, where('userId', '==', userId));
  const snap = await getDocs(q);
  const list: InventoryTransaction[] = [];
  snap.forEach(docSnap => {
    list.push({ id: docSnap.id, ...docSnap.data() } as InventoryTransaction);
  });
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function logTransaction(tx: Omit<InventoryTransaction, 'id'>): Promise<void> {
  const colRef = collection(db, 'transactions');
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await setDoc(doc(db, 'transactions', id), { id, ...tx });
}
