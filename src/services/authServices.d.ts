import { User, CreateUserInput, LoginInput, UpdateUserInput } from '../models/user';
export declare const authService: {
    register(input: CreateUserInput): Promise<User>;
    verifyToken(idToken: string): Promise<User | null>;
    getUserById(id: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    getUsersByRole(role: string): Promise<User[]>;
    updateUser(id: string, input: UpdateUserInput): Promise<User | null>;
    deactivateUser(id: string): Promise<boolean>;
    login(input: LoginInput): Promise<{
        idToken: string;
        refreshToken: string;
        user: User;
    }>;
    refreshIdToken(refreshToken: string): Promise<{
        idToken: string;
        refreshToken: string;
    }>;
    logout(): Promise<void>;
    getCurrentUser(user?: {
        uid: string;
        email?: string;
        role?: string;
    }): typeof user | null;
};
//# sourceMappingURL=authServices.d.ts.map