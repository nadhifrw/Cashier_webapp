"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditServices = void 0;
const firebase_1 = require("../config/firebase");
const COLLECTION_NAME = 'audit_logs';
exports.AuditServices = {
    /**
     * Log an audit event
     */
    async logAudit(auditData) {
        try {
            const auditEntry = {
                ...auditData,
                timestamp: new Date(),
            };
            const docRef = await firebase_1.dbCashier.collection(COLLECTION_NAME).add(auditEntry);
            return {
                id: docRef.id,
                ...auditEntry,
            };
        }
        catch (error) {
            console.error('Error logging audit:', error.message);
            throw error;
        }
    },
    /**
     * Log transaction creation
     */
    async logTransactionCreation(transactionId, userId, userName, data) {
        return this.logAudit({
            userId,
            userName,
            action: 'CREATE',
            resource: 'TRANSACTION',
            resourceId: transactionId,
            changes: data,
            status: 'success',
        });
    },
    /**
     * Log transaction update
     */
    async logTransactionUpdate(transactionId, userId, userName, changes) {
        return this.logAudit({
            userId,
            userName,
            action: 'UPDATE',
            resource: 'TRANSACTION',
            resourceId: transactionId,
            changes,
            status: 'success',
        });
    },
    /**
     * Log transaction deletion
     */
    async logTransactionDeletion(transactionId, userId, userName) {
        return this.logAudit({
            userId,
            userName,
            action: 'DELETE',
            resource: 'TRANSACTION',
            resourceId: transactionId,
            status: 'success',
        });
    },
    /**
     * Log product update
     */
    async logProductUpdate(productId, userId, userName, changes) {
        return this.logAudit({
            userId,
            userName,
            action: 'UPDATE',
            resource: 'PRODUCT',
            resourceId: productId,
            changes,
            status: 'success',
        });
    },
    /**
     * Log user action
     */
    async logUserAction(userId, userName, action, details = {}) {
        return this.logAudit({
            userId,
            userName,
            action,
            resource: 'USER',
            resourceId: userId,
            changes: details,
            status: 'success',
        });
    },
    /**
     * Log login
     */
    async logLogin(userId, userName, ipAddress) {
        const auditData = {
            userId,
            userName,
            action: 'LOGIN',
            resource: 'AUTH',
            resourceId: userId,
            status: 'success',
        };
        if (ipAddress)
            auditData.ipAddress = ipAddress;
        return this.logAudit(auditData);
    },
    /**
     * Log logout
     */
    async logLogout(userId, userName, ipAddress) {
        const auditData = {
            userId,
            userName,
            action: 'LOGOUT',
            resource: 'AUTH',
            resourceId: userId,
            status: 'success',
        };
        if (ipAddress)
            auditData.ipAddress = ipAddress;
        return this.logAudit(auditData);
    },
    /**
     * Log failed action
     */
    async logFailedAction(userId, userName, action, resource, resourceId, errorMessage, statusCode) {
        const auditData = {
            userId,
            userName,
            action,
            resource,
            resourceId,
            status: 'failure',
            errorMessage,
        };
        if (statusCode)
            auditData.statusCode = statusCode;
        return this.logAudit(auditData);
    },
    /**
     * Get audit logs for a user
     */
    async getUserAuditLogs(userId, limit = 50) {
        try {
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            }));
        }
        catch (error) {
            console.error('Error getting user audit logs:', error.message);
            throw error;
        }
    },
    /**
     * Get audit logs for a resource
     */
    async getResourceAuditLogs(resource, resourceId, limit = 100) {
        try {
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('resource', '==', resource)
                .where('resourceId', '==', resourceId)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            }));
        }
        catch (error) {
            console.error('Error getting resource audit logs:', error.message);
            throw error;
        }
    },
    /**
     * Get audit logs by action
     */
    async getAuditLogsByAction(action, limit = 50) {
        try {
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('action', '==', action)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            }));
        }
        catch (error) {
            console.error('Error getting audit logs by action:', error.message);
            throw error;
        }
    },
    /**
     * Get failed audit logs
     */
    async getFailedAuditLogs(limit = 50) {
        try {
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('status', '==', 'failure')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            }));
        }
        catch (error) {
            console.error('Error getting failed audit logs:', error.message);
            throw error;
        }
    },
    /**
     * Get audit logs within date range
     */
    async getAuditLogsByDateRange(startDate, endDate, limit = 100) {
        try {
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            }));
        }
        catch (error) {
            console.error('Error getting audit logs by date range:', error.message);
            throw error;
        }
    },
    /**
     * Get audit summary
     */
    async getAuditSummary(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('timestamp', '>=', startDate)
                .get();
            const logs = snapshot.docs.map(doc => doc.data());
            const summary = {
                totalEvents: logs.length,
                successfulEvents: logs.filter(l => l.status === 'success').length,
                failedEvents: logs.filter(l => l.status === 'failure').length,
                actionBreakdown: {},
                resourceBreakdown: {},
                userBreakdown: {},
            };
            for (const log of logs) {
                summary.actionBreakdown[log.action] = (summary.actionBreakdown[log.action] || 0) + 1;
                summary.resourceBreakdown[log.resource] = (summary.resourceBreakdown[log.resource] || 0) + 1;
                summary.userBreakdown[log.userName] = (summary.userBreakdown[log.userName] || 0) + 1;
            }
            return summary;
        }
        catch (error) {
            console.error('Error getting audit summary:', error.message);
            throw error;
        }
    },
    /**
     * Delete old audit logs (cleanup)
     */
    async deleteOldAuditLogs(daysToKeep = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('timestamp', '<', cutoffDate)
                .get();
            let deletedCount = 0;
            const batch = firebase_1.dbCashier.batch();
            for (const doc of snapshot.docs) {
                batch.delete(doc.ref);
                deletedCount++;
            }
            await batch.commit();
            return {
                deletedCount,
                cutoffDate,
            };
        }
        catch (error) {
            console.error('Error deleting old audit logs:', error.message);
            throw error;
        }
    },
};
//# sourceMappingURL=auditServices.js.map