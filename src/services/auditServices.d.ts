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
export declare const AuditServices: {
    /**
     * Log an audit event
     */
    logAudit(auditData: Omit<AuditLog, "id" | "timestamp">): Promise<{
        id: string;
        userId: string;
        userName: string;
        action: string;
        resource: string;
        resourceId: string;
        changes?: Record<string, any>;
        status: "success" | "failure";
        statusCode?: number;
        errorMessage?: string;
        ipAddress?: string;
        userAgent?: string;
        timestamp: Date;
    }>;
    /**
     * Log transaction creation
     */
    logTransactionCreation(transactionId: string, userId: string, userName: string, data: any): Promise<{
        id: string;
        userId: string;
        userName: string;
        action: string;
        resource: string;
        resourceId: string;
        changes?: Record<string, any>;
        status: "success" | "failure";
        statusCode?: number;
        errorMessage?: string;
        ipAddress?: string;
        userAgent?: string;
        timestamp: Date;
    }>;
    /**
     * Log transaction update
     */
    logTransactionUpdate(transactionId: string, userId: string, userName: string, changes: any): Promise<{
        id: string;
        userId: string;
        userName: string;
        action: string;
        resource: string;
        resourceId: string;
        changes?: Record<string, any>;
        status: "success" | "failure";
        statusCode?: number;
        errorMessage?: string;
        ipAddress?: string;
        userAgent?: string;
        timestamp: Date;
    }>;
    /**
     * Log transaction deletion
     */
    logTransactionDeletion(transactionId: string, userId: string, userName: string): Promise<{
        id: string;
        userId: string;
        userName: string;
        action: string;
        resource: string;
        resourceId: string;
        changes?: Record<string, any>;
        status: "success" | "failure";
        statusCode?: number;
        errorMessage?: string;
        ipAddress?: string;
        userAgent?: string;
        timestamp: Date;
    }>;
    /**
     * Log product update
     */
    logProductUpdate(productId: string, userId: string, userName: string, changes: any): Promise<{
        id: string;
        userId: string;
        userName: string;
        action: string;
        resource: string;
        resourceId: string;
        changes?: Record<string, any>;
        status: "success" | "failure";
        statusCode?: number;
        errorMessage?: string;
        ipAddress?: string;
        userAgent?: string;
        timestamp: Date;
    }>;
    /**
     * Log user action
     */
    logUserAction(userId: string, userName: string, action: string, details?: any): Promise<{
        id: string;
        userId: string;
        userName: string;
        action: string;
        resource: string;
        resourceId: string;
        changes?: Record<string, any>;
        status: "success" | "failure";
        statusCode?: number;
        errorMessage?: string;
        ipAddress?: string;
        userAgent?: string;
        timestamp: Date;
    }>;
    /**
     * Log login
     */
    logLogin(userId: string, userName: string, ipAddress?: string): Promise<{
        id: string;
        userId: string;
        userName: string;
        action: string;
        resource: string;
        resourceId: string;
        changes?: Record<string, any>;
        status: "success" | "failure";
        statusCode?: number;
        errorMessage?: string;
        ipAddress?: string;
        userAgent?: string;
        timestamp: Date;
    }>;
    /**
     * Log logout
     */
    logLogout(userId: string, userName: string, ipAddress?: string): Promise<{
        id: string;
        userId: string;
        userName: string;
        action: string;
        resource: string;
        resourceId: string;
        changes?: Record<string, any>;
        status: "success" | "failure";
        statusCode?: number;
        errorMessage?: string;
        ipAddress?: string;
        userAgent?: string;
        timestamp: Date;
    }>;
    /**
     * Log failed action
     */
    logFailedAction(userId: string, userName: string, action: string, resource: string, resourceId: string, errorMessage: string, statusCode?: number): Promise<{
        id: string;
        userId: string;
        userName: string;
        action: string;
        resource: string;
        resourceId: string;
        changes?: Record<string, any>;
        status: "success" | "failure";
        statusCode?: number;
        errorMessage?: string;
        ipAddress?: string;
        userAgent?: string;
        timestamp: Date;
    }>;
    /**
     * Get audit logs for a user
     */
    getUserAuditLogs(userId: string, limit?: number): Promise<AuditLog[]>;
    /**
     * Get audit logs for a resource
     */
    getResourceAuditLogs(resource: string, resourceId: string, limit?: number): Promise<AuditLog[]>;
    /**
     * Get audit logs by action
     */
    getAuditLogsByAction(action: string, limit?: number): Promise<AuditLog[]>;
    /**
     * Get failed audit logs
     */
    getFailedAuditLogs(limit?: number): Promise<AuditLog[]>;
    /**
     * Get audit logs within date range
     */
    getAuditLogsByDateRange(startDate: Date, endDate: Date, limit?: number): Promise<AuditLog[]>;
    /**
     * Get audit summary
     */
    getAuditSummary(days?: number): Promise<{
        totalEvents: number;
        successfulEvents: number;
        failedEvents: number;
        actionBreakdown: Record<string, number>;
        resourceBreakdown: Record<string, number>;
        userBreakdown: Record<string, number>;
    }>;
    /**
     * Delete old audit logs (cleanup)
     */
    deleteOldAuditLogs(daysToKeep?: number): Promise<{
        deletedCount: number;
        cutoffDate: Date;
    }>;
};
//# sourceMappingURL=auditServices.d.ts.map