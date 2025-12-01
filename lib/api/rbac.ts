import { apiClient } from './client';

export interface Role {
    id: string;
    name: string;
    description?: string;
    builtIn: boolean;
    category?: string;
    permissions: RolePermission[];
    _count?: {
        userRoles: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Permission {
    id: string;
    code: string;
    name: string;
    description?: string;
    category: string;
    resource?: string;
}

export interface RolePermission {
    roleId: string;
    permissionId: string;
    permission: Permission;
}

export interface UserRole {
    id: string;
    userId: string;
    roleId: string;
    storeId?: string;
    role: Role;
    store?: {
        id: string;
        name: string;
    };
    assignedAt: string;
    assignedBy?: string;
}

export interface CreateRoleData {
    name: string;
    description?: string;
    category?: string;
    permissionIds?: string[];
}

export interface UpdateRoleData {
    name?: string;
    description?: string;
    category?: string;
}

export interface AssignRoleData {
    roleId: string;
    storeId?: string;
}

export const rbacApi = {
    // Role Management
    getRoles: () => apiClient.get('/rbac/roles'),

    getRole: (id: string) => apiClient.get(`/rbac/roles/${id}`),

    createRole: (data: CreateRoleData) => apiClient.post('/rbac/roles', data),

    updateRole: (id: string, data: UpdateRoleData) => apiClient.put(`/rbac/roles/${id}`, data),

    deleteRole: (id: string) => apiClient.delete(`/rbac/roles/${id}`),

    addPermissionsToRole: (roleId: string, permissionIds: string[]) =>
        apiClient.post(`/rbac/roles/${roleId}/permissions`, { permissionIds }),

    removePermissionFromRole: (roleId: string, permissionId: string) =>
        apiClient.delete(`/rbac/roles/${roleId}/permissions/${permissionId}`),

    cloneRole: (roleId: string, name: string) =>
        apiClient.post(`/rbac/roles/${roleId}/clone`, { name }),

    getRoleSummary: () => apiClient.get('/rbac/roles/summary'),

    // Permission Management
    getPermissions: () => apiClient.get('/rbac/permissions'),

    getPermission: (id: string) => apiClient.get(`/rbac/permissions/${id}`),

    getMyPermissions: (storeId?: string) =>
        apiClient.get(`/rbac/me/permissions${storeId ? `?storeId=${storeId}` : ''}`),

    getUserPermissions: (userId: string, storeId?: string) =>
        apiClient.get(`/rbac/users/${userId}/permissions${storeId ? `?storeId=${storeId}` : ''}`),

    // User Role Assignment
    getUserRoles: (userId: string) => apiClient.get(`/rbac/users/${userId}/roles`),

    assignRole: (userId: string, data: AssignRoleData) =>
        apiClient.post(`/rbac/users/${userId}/roles`, data),

    removeRole: (userId: string, roleId: string, storeId?: string) =>
        apiClient.delete(`/rbac/users/${userId}/roles/${roleId}${storeId ? `?storeId=${storeId}` : ''}`),

    getUsersWithRole: (roleId: string, storeId?: string) =>
        apiClient.get(`/rbac/roles/${roleId}/users${storeId ? `?storeId=${storeId}` : ''}`),

    bulkAssignRole: (roleId: string, userIds: string[], storeId?: string) =>
        apiClient.post(`/rbac/roles/${roleId}/users/bulk`, { userIds, storeId }),

    // Admin PIN
    setupAdminPin: (pin: string) => apiClient.post('/rbac/admin/pin/setup', { pin }),

    verifyAdminPin: (pin: string) => apiClient.post('/rbac/admin/pin/verify', { pin }),

    changeAdminPin: (oldPin: string, newPin: string) =>
        apiClient.put('/rbac/admin/pin/change', { oldPin, newPin }),

    getAdminPinStatus: () => apiClient.get('/rbac/admin/pin/status'),
};
