import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9E6Hrkbfnex1YvxJVplbf49RdEa8dcMc",
  authDomain: "deadbb-2d5a8.firebaseapp.com",
  databaseURL: "https://deadbb-2d5a8-default-rtdb.firebaseio.com",
  projectId: "deadbb-2d5a8",
  storageBucket: "deadbb-2d5a8.firebasestorage.app",
  messagingSenderId: "1056561339291",
  appId: "1:1056561339291:web:dead2698f85ad9875bdf3e",
  measurementId: "G-ZDKPF5W6D4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
