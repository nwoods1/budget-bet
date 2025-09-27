// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB7Fbsct6oF8cZeoH0xDYYkk3vsmTfipM0",
  authDomain: "hackathon-app-61b50.firebaseapp.com",
  projectId: "hackathon-app-61b50",
  storageBucket: "hackathon-app-61b50.firebasestorage.app",
  messagingSenderId: "480291192457",
  appId: "1:480291192457:web:238e267694f0c4243c9058",
  measurementId: "G-HNCJ6HVVE7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };