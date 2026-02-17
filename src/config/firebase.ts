import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

const cashierApp = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID as string,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string)?.replace(/\\n/g, '\n'),
    }),
});

// const cashierApp = {
//     // projectId: process.env.FIREBASE_PROJECT_ID,
//     // clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//     // privateKey: (process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
//     apiKey: process.env.FIREBASE_API_KEY || 'your-api-key',
//     authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
//     projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
//     storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
//     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'your-sender-id',
//     appId: process.env.FIREBASE_APP_ID || 'your-app-id'
// };

export const dbCashier = getFirestore(cashierApp);
export const authCashier = getAuth(cashierApp);

export default cashierApp;