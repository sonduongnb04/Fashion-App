import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken } from './api';
import { setCurrentUser } from './session';

export type LoginPayload = { email?: string; username?: string; password: string };
export type RegisterPayload = { name: string; email: string; password: string };

// Lưu token vào AsyncStorage
async function saveToken(token: string) {
  try {
    await AsyncStorage.setItem('auth_token', token);
    setAuthToken(token);
    if (__DEV__) console.log('✅ Token saved to AsyncStorage');
  } catch (error) {
    console.error('Error saving token:', error);
  }
}

async function saveUserRole(role?: string) {
  try {
    if (role) await AsyncStorage.setItem('user_role', role);
  } catch {}
}

export async function loadUserRole() {
  try {
    return await AsyncStorage.getItem('user_role');
  } catch { return null; }
}

// Load token từ AsyncStorage khi app khởi động
export async function loadToken() {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      setAuthToken(token);
      if (__DEV__) console.log('✅ Token loaded from AsyncStorage');
      return token;
    }
  } catch (error) {
    console.error('Error loading token:', error);
  }
  return null;
}

export async function login(payload: LoginPayload) {
  // Backend chấp nhận email hoặc username + password
  if (__DEV__) console.log('🔐 AUTH.login payload:', payload);
  const res = await api.post('/auth/login', payload);
  // API trả { success, message, data: { token, user } }
  if (__DEV__) console.log('✅ AUTH.login response:', res.data);
  const data = res.data?.data;
  if (data?.token) {
    await saveToken(data.token);
  }
  if (data?.user) setCurrentUser(data.user);
  if (data?.user?.role) await saveUserRole(data.user.role);
  return data;
}

export async function register(payload: RegisterPayload) {
    try {
        // ✅ Backend sẽ parse 'name' thành username, firstName, lastName
        const body = {
            name: payload.name,
            email: payload.email,
            password: payload.password,
        };
        
        console.log('📝 AUTH.register body:', JSON.stringify(body, null, 2));
        const res = await api.post('/auth/register', body);
        console.log('✅ AUTH.register response:', JSON.stringify(res.data, null, 2));
        
        const data = res.data?.data;
        if (data?.token) {
            await saveToken(data.token);
            console.log('💾 Token saved successfully');
        }
        if (data?.user) {
            setCurrentUser(data.user);
            console.log('👤 User set in session:', data.user.email);
        }
        return data;
    } catch (error: any) {
        console.error('❌ Register error full:', error);
        console.error('❌ Register error response:', error?.response?.data);
        console.error('❌ Register error message:', error?.message);
        throw error;
    }
}


