// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCB1ElbvJf-ak4y5g48Z5mWlYql3dFF6Rs",
    authDomain: "f-i-x-e-r.firebaseapp.com",
    databaseURL: "https://f-i-x-e-r-default-rtdb.firebaseio.com",
    projectId: "f-i-x-e-r",
    storageBucket: "gs://f-i-x-e-r.firebasestorage.app",
    messagingSenderId: "452985305062",
    appId: "1:452985305062:android:3405f9d12528df98854827"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Global variables
let allReports = [];
let charts = {};
let currentFilters = {
    status: 'all',
    priority: 'all',
    location: 'all',
    search: ''
};