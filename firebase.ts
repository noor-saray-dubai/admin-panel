// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLkCEdxQJpe75QOTXqBScY9_lNywhQGlA",
  authDomain: "noorsaray-admin.firebaseapp.com",
  projectId: "noorsaray-admin",
  storageBucket: "noorsaray-admin.firebasestorage.app",
  messagingSenderId: "458766620470",
  appId: "1:458766620470:web:9be02603dc1844b7770597"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };