import axios from 'axios';
import { Platform } from 'react-native';

// Chỉnh BASE_URL theo backend và platform của bạn
function getBaseURL() {
    // Nếu có env variable, dùng nó
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    
    // Auto-detect dựa trên platform
    switch (Platform.OS) {
        case 'android':
            return 'http://10.0.2.2:4000/api'; // Android emulator
        case 'ios':
            return 'http://localhost:4000/api'; // iOS simulator
        case 'web':
            return 'http://localhost:4000/api'; // Web browser
        default:
            return 'http://localhost:4000/api';
    }
}

export const BASE_URL = getBaseURL();

// Log base URL một lần để xác minh cấu hình
if (__DEV__) console.log('🌐 API_BASE_URL:', BASE_URL, 'Platform:', Platform.OS);

const api = axios.create({ baseURL: BASE_URL, timeout: 20000 });

// Helper function to fix image URLs based on platform
export function getImageURL(url: string | undefined): string {
    if (!url) {
        if (__DEV__) console.warn('⚠️ getImageURL: URL is empty');
        return '';
    }
    
    // Nếu URL đã đúng format (http://localhost hoặc https), return as is
    if (url.startsWith('http://localhost') || url.startsWith('https://')) {
        return url;
    }
    
    // Nếu URL dùng Android emulator format, replace với platform-specific URL
    if (url.includes('10.0.2.2:4000')) {
        const baseUrlWithoutApi = BASE_URL.replace('/api', '');
        const transformedUrl = url.replace('http://10.0.2.2:4000', baseUrlWithoutApi);
        if (__DEV__) {
            console.log('🖼️ Image URL transformed:', {
                original: url,
                baseUrlWithoutApi,
                transformed: transformedUrl
            });
        }
        return transformedUrl;
    }
    
    // Nếu là relative URL, prepend base URL
    if (url.startsWith('/assets') || url.startsWith('assets')) {
        const baseUrlWithoutApi = BASE_URL.replace('/api', '');
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        const fullUrl = `${baseUrlWithoutApi}${cleanUrl}`;
        if (__DEV__) console.log('🖼️ Image URL from relative:', fullUrl);
        return fullUrl;
    }
    
    if (__DEV__) console.warn('⚠️ getImageURL: Unhandled URL format:', url);
    return url;
}

export default api;

// Quản lý token xác thực cho toàn app (tạm thời trên bộ nhớ)
let AUTH_TOKEN: string | null = null;

export function setAuthToken(token: string | null) {
    AUTH_TOKEN = token;
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        if (__DEV__) console.log('Auth token set');
    } else {
        delete api.defaults.headers.common['Authorization'];
        if (__DEV__) console.log('Auth token cleared');
    }
}

export function getAuthToken() {
    return AUTH_TOKEN;
}


// Products & Categories simple helpers
export type Category = { 
    _id: string; 
    name: string; 
    slug?: string;
    image?: { url?: string; alt?: string } 
};

export type Product = {
    _id: string;
    name: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    discountPrice?: number;
    images?: { url: string; alt?: string; isMain?: boolean }[];
    mainImage?: { url?: string; alt?: string } | null;
    category?: Category;
    colors?: string[];
    sizes?: string[];
    variants?: any[];
    stock?: { quantity?: number };
    rating?: { average?: number; count?: number };
    tags?: string[];
    sku?: string;
    views?: number;
    sales?: number;
    isInStock?: boolean;
    isLowStock?: boolean;
    isFeatured?: boolean;
    isActive?: boolean;
};

// Admin endpoints
export const adminApi = {
    async createProduct(body: any) {
        const res = await api.post('/manage/products', body);
        return res.data?.data || res.data;
    },
    async updateProduct(id: string, body: any) {
        const res = await api.put(`/manage/products/${id}`, body);
        return res.data?.data || res.data;
    },
    async deleteProduct(id: string) {
        const res = await api.delete(`/manage/products/${id}`);
        return res.data?.data || res.data;
    },
    async updateStock(id: string, payload: { quantity: number; operation?: 'set' | 'add' | 'subtract'; lowStockThreshold?: number; trackStock?: boolean }) {
        const res = await api.patch(`/manage/products/${id}/stock`, payload);
        return res.data?.data || res.data;
    },
    async toggleProductStatus(id: string) {
        const res = await api.patch(`/manage/products/${id}/toggle`);
        return res.data?.data || res.data;
    },
    async getRevenue(params?: { startDate?: string; endDate?: string; groupBy?: 'day'|'month' }) {
        const res = await api.get('/reports/revenue', { params });
        return res.data?.data || res.data;
    },
};

export async function fetchCategories(): Promise<Category[]> {
    try {
        const res = await api.get('/categories');
        if (__DEV__) {
            console.log('📂 Categories API Response:', {
                success: res.data?.success,
                count: res.data?.data?.length || 0,
                categories: res.data?.data?.map((c: any) => ({ id: c._id, name: c.name }))
            });
        }
        return res.data?.data || res.data || [];
    } catch (error: any) {
        console.error('❌ Error fetching categories:', error.message);
        if (error.response) {
            console.error('Response error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Network error - no response received');
        }
        return [];
    }
}

export async function fetchProducts(params?: Record<string, any>): Promise<Product[]> {
    try {
        const res = await api.get('/products', { params });
        if (__DEV__) {
            console.log('📦 Products API Response:', {
                success: res.data?.success,
                count: res.data?.data?.length || 0,
                params,
                total: res.data?.pagination?.total
            });
        }
        // Backend trả về { success, message, data: [...], pagination }
        if (Array.isArray(res.data?.data)) {
            return res.data.data;
        }
        return res.data?.data || [];
    } catch (error: any) {
        console.error('❌ Error fetching products:', error.message, 'params:', params);
        if (error.response) {
            console.error('Response error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Network error - no response received');
        }
        return [];
    }
}

export async function fetchProductDetail(identifier: string): Promise<Product> {
    const res = await api.get(`/products/${identifier}`);
    console.log('Product detail API response:', JSON.stringify(res.data));
    return res.data?.data;
}


