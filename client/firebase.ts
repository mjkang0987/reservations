// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBr74x3iLZqtM_nxEm8GMU71Vm68j16oIE",
    authDomain: "toyproject-acf44.firebaseapp.com",
    projectId: "toyproject-acf44",
    storageBucket: "toyproject-acf44.appspot.com",
    messagingSenderId: "920611020850",
    appId: "1:920611020850:web:62a2944b7f56b336911c2b",
    measurementId: "G-DZJHTKNE6P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = app.name && typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);

export {
    app,
    analytics,
    db
}
