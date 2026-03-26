"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../config/firebase");
const COLLECTION_NAME = 'users';
exports.authService = {
    // Register new user
    async register(input) {
        // Create auth account using firebase-admin
        const userRecord = await firebase_1.authCashier.createUser({
            email: input.email,
            password: input.password,
            displayName: input.name,
        });
        // Create user profile in Firestore
        const userData = {
            email: input.email,
            username: input.username,
            name: input.name,
            role: input.role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(userRecord.uid).set({
            ...userData,
            createdAt: firestore_1.Timestamp.now(),
            updatedAt: firestore_1.Timestamp.now()
        });
        return {
            id: userRecord.uid,
            ...userData
        };
    },
    // Verify user token (backend version - client sends ID token)
    async verifyToken(idToken) {
        const decodedToken = await firebase_1.authCashier.verifyIdToken(idToken);
        // Get user profile from Firestore
        const userDoc = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(decodedToken.uid).get();
        if (!userDoc.exists) {
            throw new Error('User profile not found');
        }
        const userData = userDoc.data();
        if (!userData.isActive) {
            throw new Error('Account is deactivated');
        }
        // Update last login
        await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(decodedToken.uid).update({
            lastLoginAt: firestore_1.Timestamp.now()
        });
        return {
            id: userDoc.id,
            ...userData,
            createdAt: userData.createdAt?.toDate(),
            updatedAt: userData.updatedAt?.toDate(),
            lastLoginAt: new Date()
        };
    },
    // Get user profile by ID
    async getUserById(id) {
        const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).get();
        if (!snapshot.exists)
            return null;
        const data = snapshot.data();
        return {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastLoginAt: data.lastLoginAt?.toDate()
        };
    },
    // Get all users (admin only)
    async getAllUsers() {
        const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME).get();
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                lastLoginAt: data.lastLoginAt?.toDate()
            };
        });
    },
    // Get users by role
    async getUsersByRole(role) {
        const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
            .where('role', '==', role)
            .get();
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                lastLoginAt: data.lastLoginAt?.toDate()
            };
        });
    },
    // Update user profile
    async updateUser(id, input) {
        const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).get();
        if (!snapshot.exists)
            return null;
        await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).update({
            ...input,
            updatedAt: firestore_1.Timestamp.now()
        });
        return this.getUserById(id);
    },
    // Deactivate user
    async deactivateUser(id) {
        const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).get();
        if (!snapshot.exists)
            return false;
        await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).update({
            isActive: false,
            updatedAt: firestore_1.Timestamp.now()
        });
        return true;
    },
    // Login user with email and password
    async login(input) {
        try {
            const apiKey = process.env.FIREBASE_API_KEY;
            if (!apiKey) {
                throw new Error('Firebase API key not configured');
            }
            const usernameSnap = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('username', '==', input.username)
                .limit(1)
                .get();
            if (usernameSnap.empty) {
                throw new Error('Invalid username or password');
            }
            const usernameDoc = usernameSnap.docs[0];
            const profile = usernameDoc?.data();
            if (!profile.isActive) {
                throw new Error('Account is deactivated');
            }
            const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile.email,
                    password: input.password,
                    returnSecureToken: true,
                }),
            });
            if (!response.ok) {
                throw new Error('Invalid username or password');
            }
            const data = await response.json();
            // Get user profile
            const user = await this.getUserById(data.localId);
            if (!user)
                throw new Error('User profile not found');
            return {
                idToken: data.idToken,
                refreshToken: data.refreshToken,
                user,
            };
        }
        catch (error) {
            throw new Error(error.message);
        }
    },
    // Refresh Firebase ID token using refresh token
    async refreshIdToken(refreshToken) {
        const apiKey = process.env.FIREBASE_API_KEY;
        if (!apiKey) {
            throw new Error('Firebase API key not configured');
        }
        const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
        });
        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }
        const data = await response.json();
        return {
            idToken: data.id_token,
            refreshToken: data.refresh_token || refreshToken,
        };
    },
    // Logout user
    async logout() {
        // Logout is primarily handled client-side by clearing the token
        // Backend can optionally revoke tokens, but Firebase doesn't require it
        return;
    },
    // Get current user from request context
    getCurrentUser(user) {
        // This method should be called with the user object from req.user (set by isAuthenticated middleware)
        return user || null;
    }
};
//# sourceMappingURL=authServices.js.map