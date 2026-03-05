export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    category?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateProduct {
    id: string;
    name: string;
    price: number;
    stock: number;
    category?: string;
}
    
export interface UpdateProduct {
    name?: string;
    price?: number;
    stock?: number;
    category?: string;
}