import api from './api';

export type UserProfile = {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: { url?: string };
};

export async function getMe(): Promise<UserProfile> {
    try {
        const res = await api.get('/auth/me');
        if (__DEV__) console.log('✅ getMe response:', res.data);
        const user = res.data?.data || res.data?.user || res.data;
        if (__DEV__) console.log('👤 User profile:', user);
        return user;
    } catch (error: any) {
        console.error('❌ getMe error:', error?.response?.data || error.message);
        throw error;
    }
}

export async function updateProfile(data: {
    username?: string;
    firstName?: string;
    lastName?: string;
}): Promise<UserProfile> {
    try {
        if (__DEV__) console.log('📝 Updating profile:', data);
        const res = await api.put('/auth/me', data);
        if (__DEV__) console.log('✅ Update profile response:', res.data);
        return res.data?.data || res.data;
    } catch (error: any) {
        console.error('❌ Update profile error:', error?.response?.data || error.message);
        throw error;
    }
}

export async function changePassword(data: {
    currentPassword: string;
    newPassword: string;
}): Promise<void> {
    try {
        if (__DEV__) console.log('🔐 Changing password');
        const res = await api.put('/auth/change-password', data);
        if (__DEV__) console.log('✅ Change password response:', res.data);
    } catch (error: any) {
        console.error('❌ Change password error:', error?.response?.data || error.message);
        throw error;
    }
}

// ===== CART API =====
export type CartItem = { 
    _id?: string;
    product: any; 
    quantity: number; 
    selectedColor?: string; 
    selectedSize?: string 
};

// Get cart from API
export async function getCart(): Promise<CartItem[]> {
    try {
        console.log('📦 Fetching cart from API');
        const res = await api.get('/cart');
        const cart = res.data?.data;
        console.log('✅ Cart fetched:', cart?.items?.length || 0, 'items');
        return cart?.items || [];
    } catch (error: any) {
        console.error('❌ Get cart error:', error?.response?.data || error.message);
        return [];
    }
}

// Add to cart via API
export async function addToCart(
    product: any, 
    qty: number = 1, 
    options?: { color?: string; size?: string }
): Promise<CartItem[]> {
    try {
        console.log('➕ Adding to cart via API:', product.name, 'qty:', qty);
        const res = await api.post('/cart', {
            productId: product._id,
            quantity: qty,
            selectedColor: options?.color,
            selectedSize: options?.size
        });
        console.log('✅ Added to cart');
        return res.data?.data?.items || [];
    } catch (error: any) {
        console.error('❌ Add to cart error:', error?.response?.data || error.message);
        throw error;
    }
}

// Remove from cart via API
export async function removeFromCart(cartItemId: string): Promise<CartItem[]> {
    try {
        console.log('➖ Removing from cart via API:', cartItemId);
        const res = await api.delete(`/cart/${cartItemId}`);
        console.log('✅ Removed from cart');
        return res.data?.data?.items || [];
    } catch (error: any) {
        console.error('❌ Remove from cart error:', error?.response?.data || error.message);
        throw error;
    }
}

// Update cart item quantity via API
export async function updateCartItem(cartItemId: string, quantity: number): Promise<CartItem[]> {
    try {
        console.log('🔄 Updating cart item:', cartItemId, 'qty:', quantity);
        const res = await api.put(`/cart/${cartItemId}`, { quantity });
        console.log('✅ Updated cart item');
        return res.data?.data?.items || [];
    } catch (error: any) {
        console.error('❌ Update cart error:', error?.response?.data || error.message);
        throw error;
    }
}

// Clear cart via API
export async function clearCart(): Promise<void> {
    try {
        console.log('🧹 Clearing cart via API');
        await api.delete('/cart');
        console.log('✅ Cart cleared');
    } catch (error: any) {
        console.error('❌ Clear cart error:', error?.response?.data || error.message);
        throw error;
    }
}

// ===== FAVORITES API =====

// Get favorites from API
export async function getFavorites(): Promise<any[]> {
    try {
        console.log('❤️ Fetching favorites from API');
        const res = await api.get('/favorites');
        const favorites = res.data?.data || [];
        console.log('✅ Favorites fetched:', favorites.length, 'items');
        return favorites;
    } catch (error: any) {
        console.error('❌ Get favorites error:', error?.response?.data || error.message);
        return [];
    }
}

// Add to favorites via API
export async function addToFavorites(product: any): Promise<boolean> {
    try {
        console.log('💓 Adding to favorites via API:', product.name);
        await api.post('/favorites', { productId: product._id });
        console.log('❤️ Added to favorites');
        return true;
    } catch (error: any) {
        console.error('❌ Add to favorites error:', error?.response?.data || error.message);
        return false;
    }
}

// Remove from favorites via API
export async function removeFromFavorites(productId: string): Promise<boolean> {
    try {
        console.log('💔 Removing from favorites via API:', productId);
        await api.delete('/favorites', { data: { productId } });
        console.log('💔 Removed from favorites');
        return true;
    } catch (error: any) {
        console.error('❌ Remove from favorites error:', error?.response?.data || error.message);
        return false;
    }
}

// Toggle favorite
export async function toggleFavorite(product: any): Promise<boolean> {
    try {
        // First check if product is in favorites
        const favorites = await getFavorites();
        const isFav = favorites.some(f => f._id === product._id);
        
        if (isFav) {
            await removeFromFavorites(product._id);
            return false; // Removed
        } else {
            await addToFavorites(product);
            return true; // Added
        }
    } catch (error: any) {
        console.error('❌ Toggle favorite error:', error);
        throw error;
    }
}

// ===== ORDER & PAYMENT API =====

export type Order = {
    _id: string;
    code: string;
    user?: string;
    items: Array<{
        product?: any;
        productId?: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    amounts: {
        subtotal: number;
        tax: number;
        shipping: number;
        total: number;
    };
    status: 'created' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';
    notes?: string;
    meta?: {
        addressId?: string;
        addressDetails?: {
            fullName: string;
            phone: string;
            address: string;
            ward: string;
            district: string;
            province: string;
        };
    };
    createdAt?: string;
    updatedAt?: string;
};

export type Address = {
    _id?: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    ward?: string;
    district?: string;
    province?: string;
    country?: string;
    postalCode?: string;
    isDefault?: boolean;
};

export type Payment = {
    _id: string;
    order: string;
    user?: string;
    provider: 'cod' | 'stripe' | 'paypal' | 'vnpay' | 'momo';
    amount: number;
    currency: string;
    status: 'initiated' | 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled' | 'refunded';
    providerRef?: string;
    meta?: any;
    createdAt?: string;
    updatedAt?: string;
};

// Create order from cart items
export async function createOrder(orderData: {
    items: Array<{ product?: any; productId?: string; name: string; price: number; quantity: number }>;
    amounts: { subtotal: number; tax: number; shipping: number; total: number };
    notes?: string;
    meta?: {
        addressId?: string;
        addressDetails?: {
            fullName: string;
            phone: string;
            address: string;
            ward: string;
            district: string;
            province: string;
        };
    };
}): Promise<Order> {
    try {
        if (__DEV__) console.log('📝 Creating order:', orderData);
        const res = await api.post('/orders', orderData);
        const order = res.data?.data || res.data;
        if (__DEV__) console.log('✅ Order created:', order.code);
        return order;
    } catch (error: any) {
        console.error('❌ Create order error:', error?.response?.data || error.message);
        throw error;
    }
}

// Update order status
export async function updateOrderStatus(
    orderId: string,
    status: 'created' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled'
): Promise<Order> {
    try {
        if (__DEV__) console.log('🔄 Updating order status:', orderId, '=>', status);
        const res = await api.patch(`/orders/${orderId}/status`, { status });
        const order = res.data?.data || res.data;
        if (__DEV__) console.log('✅ Order status updated:', order.status);
        return order;
    } catch (error: any) {
        console.error('❌ Update order status error:', error?.response?.data || error.message);
        throw error;
    }
}

// Get user's orders
export async function getUserOrders() {
    const res = await api.get('/orders')
    return res.data.data.orders || []
  }
  

// Get user's orders by status
export async function getUserOrdersByStatus(status: string) {
    const res = await api.get(`/orders?status=${status}`)
    return res.data.data.orders || []
  }
  

// Get order by ID
export async function getOrderById(orderId: string): Promise<Order> {
    try {
        if (__DEV__) console.log('📋 Fetching order:', orderId);
        const res = await api.get(`/orders/${orderId}`);
        const order = res.data?.data || res.data;
        if (__DEV__) console.log('✅ Order fetched:', order.code);
        return order;
    } catch (error: any) {
        console.error('❌ Get order error:', error?.response?.data || error.message);
        throw error;
    }
}

// ===== ADDRESS API =====

// Get all addresses
export async function getAddresses(): Promise<Address[]> {
    try {
        if (__DEV__) console.log('📍 Fetching addresses');
        const res = await api.get('/addresses');
        const addresses = res.data?.data || [];
        if (__DEV__) console.log('✅ Addresses fetched:', addresses.length);
        return addresses;
    } catch (error: any) {
        console.error('❌ Get addresses error:', error?.response?.data || error.message);
        return [];
    }
}

// Create new address
export async function createAddress(addressData: Address): Promise<Address> {
    try {
        if (__DEV__) console.log('📝 Creating address:', addressData);
        const res = await api.post('/addresses', addressData);
        const address = res.data?.data || res.data;
        if (__DEV__) console.log('✅ Address created');
        return address;
    } catch (error: any) {
        console.error('❌ Create address error:', error?.response?.data || error.message);
        throw error;
    }
}

// Update address
export async function updateAddress(addressId: string, addressData: Partial<Address>): Promise<Address> {
    try {
        if (__DEV__) console.log('✏️ Updating address:', addressId);
        const res = await api.put(`/addresses/${addressId}`, addressData);
        const address = res.data?.data || res.data;
        if (__DEV__) console.log('✅ Address updated');
        return address;
    } catch (error: any) {
        console.error('❌ Update address error:', error?.response?.data || error.message);
        throw error;
    }
}

// Delete address
export async function deleteAddress(addressId: string): Promise<void> {
    try {
        if (__DEV__) console.log('🗑️ Deleting address:', addressId);
        await api.delete(`/addresses/${addressId}`);
        if (__DEV__) console.log('✅ Address deleted');
    } catch (error: any) {
        console.error('❌ Delete address error:', error?.response?.data || error.message);
        throw error;
    }
}

// Set default address
export async function setDefaultAddress(addressId: string): Promise<Address> {
    try {
        if (__DEV__) console.log('⭐ Setting default address:', addressId);
        const res = await api.post(`/addresses/${addressId}/set-default`);
        const address = res.data?.data || res.data;
        if (__DEV__) console.log('✅ Default address set');
        return address;
    } catch (error: any) {
        console.error('❌ Set default address error:', error?.response?.data || error.message);
        throw error;
    }
}

// ===== PAYMENT API =====

// Initiate payment
export async function initiatePayment(orderId: string, provider: string = 'cod'): Promise<Payment> {
    try {
        if (__DEV__) console.log('💳 Initiating payment for order:', orderId, 'provider:', provider);
        const res = await api.post('/payments/initiate', { orderId, provider });
        const payment = res.data?.data || res.data;
        if (__DEV__) console.log('✅ Payment initiated:', payment._id);
        return payment;
    } catch (error: any) {
        console.error('❌ Initiate payment error:', error?.response?.data || error.message);
        throw error;
    }
}

// Confirm payment
export async function confirmPayment(
    paymentId: string,
    status: string = 'paid',
    providerRef?: string,
    meta?: any
): Promise<Payment> {
    try {
        if (__DEV__) console.log('✅ Confirming payment:', paymentId);
        const res = await api.post('/payments/confirm', { paymentId, status, providerRef, meta });
        const payment = res.data?.data || res.data;
        if (__DEV__) console.log('✅ Payment confirmed');
        return payment;
    } catch (error: any) {
        console.error('❌ Confirm payment error:', error?.response?.data || error.message);
        throw error;
    }
}

// Get payment status
export async function getPaymentStatus(paymentId: string): Promise<Payment> {
    try {
        if (__DEV__) console.log('❓ Fetching payment status:', paymentId);
        const res = await api.get(`/payments/${paymentId}/status`);
        const payment = res.data?.data || res.data;
        if (__DEV__) console.log('✅ Payment status:', payment.status);
        return payment;
    } catch (error: any) {
        console.error('❌ Get payment status error:', error?.response?.data || error.message);
        throw error;
    }
}


