// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAts6Y-V0gEhbpG3oYH6BcHZTgDDwXiq3s",
  authDomain: "inventorysystem-cc10f.firebaseapp.com",
  projectId: "inventorysystem-cc10f",
  storageBucket: "inventorysystem-cc10f.firebasestorage.app",
  messagingSenderId: "447177896856",
  appId: "1:447177896856:web:0247fe4a972b32982bf1ed",
  measurementId: "G-3F2FN6325M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Analytics
const auth = getAuth(app);
// Analytics only works in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { auth, analytics };
export default app; 