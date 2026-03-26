import { dbCashier } from '../config/firebase';

const COLLECTION_NAME = 'audit_logs';

export interface AuditLog {
  id?: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  status: 'success' | 'failure';
  statusCode?: number;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export const AuditServices = {
    /**
     * Log an audit event
     */
    async logAudit(auditData: Omit<AuditLog, 'id' | 'timestamp'>) {
        try {
            const auditEntry: AuditLog = {
                ...auditData,
                timestamp: new Date(),
            };

            const docRef = await dbCashier.collection(COLLECTION_NAME).add(auditEntry);

            return {
                id: docRef.id,
                ...auditEntry,
            };
        } catch (error) {
            console.error('Error logging audit:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Log transaction creation
     */
    async logTransactionCreation(transactionId: string, userId: string, userName: string, data: any) {
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
    async logTransactionUpdate(transactionId: string, userId: string, userName: string, changes: any) {
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
    async logTransactionDeletion(transactionId: string, userId: string, userName: string) {
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
    async logProductUpdate(productId: string, userId: string, userName: string, changes: any) {
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
    async logUserAction(userId: string, userName: string, action: string, details: any = {}) {
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
    async logLogin(userId: string, userName: string, ipAddress?: string) {
        const auditData: any = {
            userId,
            userName,
            action: 'LOGIN',
            resource: 'AUTH',
            resourceId: userId,
            status: 'success' as const,
        };
        if (ipAddress) auditData.ipAddress = ipAddress;
        return this.logAudit(auditData);
    },

    /**
     * Log logout
     */
    async logLogout(userId: string, userName: string, ipAddress?: string) {
        const auditData: any = {
            userId,
            userName,
            action: 'LOGOUT',
            resource: 'AUTH',
            resourceId: userId,
            status: 'success' as const,
        };
        if (ipAddress) auditData.ipAddress = ipAddress;
        return this.logAudit(auditData);
    },

    /**
     * Log failed action
     */
    async logFailedAction(
        userId: string,
        userName: string,
        action: string,
        resource: string,
        resourceId: string,
        errorMessage: string,
        statusCode?: number
    ) {
        const auditData: any = {
            userId,
            userName,
            action,
            resource,
            resourceId,
            status: 'failure' as const,
            errorMessage,
        };
        if (statusCode) auditData.statusCode = statusCode;
        return this.logAudit(auditData);
    },

    /**
     * Get audit logs for a user
     */
    async getUserAuditLogs(userId: string, limit: number = 50) {
        try {
            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            })) as AuditLog[];
        } catch (error) {
            console.error('Error getting user audit logs:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Get audit logs for a resource
     */
    async getResourceAuditLogs(resource: string, resourceId: string, limit: number = 100) {
        try {
            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('resource', '==', resource)
                .where('resourceId', '==', resourceId)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            })) as AuditLog[];
        } catch (error) {
            console.error('Error getting resource audit logs:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Get audit logs by action
     */
    async getAuditLogsByAction(action: string, limit: number = 50) {
        try {
            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('action', '==', action)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            })) as AuditLog[];
        } catch (error) {
            console.error('Error getting audit logs by action:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Get failed audit logs
     */
    async getFailedAuditLogs(limit: number = 50) {
        try {
            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('status', '==', 'failure')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            })) as AuditLog[];
        } catch (error) {
            console.error('Error getting failed audit logs:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Get audit logs within date range
     */
    async getAuditLogsByDateRange(startDate: Date, endDate: Date, limit: number = 100) {
        try {
            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            })) as AuditLog[];
        } catch (error) {
            console.error('Error getting audit logs by date range:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Get audit summary
     */
    async getAuditSummary(days: number = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('timestamp', '>=', startDate)
                .get();

            const logs = snapshot.docs.map(doc => doc.data()) as AuditLog[];

            const summary = {
                totalEvents: logs.length,
                successfulEvents: logs.filter(l => l.status === 'success').length,
                failedEvents: logs.filter(l => l.status === 'failure').length,
                actionBreakdown: {} as Record<string, number>,
                resourceBreakdown: {} as Record<string, number>,
                userBreakdown: {} as Record<string, number>,
            };

            for (const log of logs) {
                summary.actionBreakdown[log.action] = (summary.actionBreakdown[log.action] || 0) + 1;
                summary.resourceBreakdown[log.resource] = (summary.resourceBreakdown[log.resource] || 0) + 1;
                summary.userBreakdown[log.userName] = (summary.userBreakdown[log.userName] || 0) + 1;
            }

            return summary;
        } catch (error) {
            console.error('Error getting audit summary:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Delete old audit logs (cleanup)
     */
    async deleteOldAuditLogs(daysToKeep: number = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('timestamp', '<', cutoffDate)
                .get();

            let deletedCount = 0;
            const batch = dbCashier.batch();

            for (const doc of snapshot.docs) {
                batch.delete(doc.ref);
                deletedCount++;
            }

            await batch.commit();

            return {
                deletedCount,
                cutoffDate,
            };
        } catch (error) {
            console.error('Error deleting old audit logs:', (error as Error).message);
            throw error;
        }
    },
};
