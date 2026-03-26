"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbCashier = exports.authCashier = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cashierApp = (0, app_1.initializeApp)({
    credential: (0, app_1.cert)({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
});
exports.authCashier = (0, auth_1.getAuth)(cashierApp);
exports.dbCashier = (0, firestore_1.getFirestore)(cashierApp);
exports.default = cashierApp;
//# sourceMappingURL=firebase.js.map