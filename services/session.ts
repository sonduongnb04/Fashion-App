export type CurrentUser = {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: { url?: string };
} | null;

let currentUser: CurrentUser = null;

export function setCurrentUser(user: CurrentUser) {
    currentUser = user;
}

export function getCurrentUser(): CurrentUser {
    return currentUser;
}

export function clearSession() {
    currentUser = null;
}


