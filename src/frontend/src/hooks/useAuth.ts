import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type SectionKey =
  | "dashboard"
  | "leads"
  | "compose"
  | "templates"
  | "sent";

export interface AppUser {
  id: string;
  username: string;
  passwordHash: string;
  role: "admin" | "user";
  permissions: SectionKey[];
  createdAt: number;
}

const STORAGE_KEY = "mahara_users";
const SESSION_KEY = "mahara_session";

export function hashPassword(password: string): string {
  let hash = 0;
  const str = `${password}mahara_salt_2024`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${Math.abs(hash).toString(36)}${str.length.toString(36)}`;
}

const DEFAULT_ADMIN: AppUser = {
  id: "admin",
  username: "admin",
  passwordHash: hashPassword("Mahara2024!"),
  role: "admin",
  permissions: ["dashboard", "leads", "compose", "templates", "sent"],
  createdAt: Date.now(),
};

export function getUsers(): AppUser[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as AppUser[];
  } catch {}
  return [DEFAULT_ADMIN];
}

export function saveUsers(users: AppUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function initUsers() {
  const users = getUsers();
  if (!users.find((u) => u.id === "admin")) {
    users.unshift(DEFAULT_ADMIN);
  }
  saveUsers(users);
}

export interface AuthContextType {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  changePassword: (userId: string, newPassword: string) => void;
  createUser: (
    username: string,
    password: string,
    permissions: SectionKey[],
  ) => AppUser;
  updateUserPermissions: (userId: string, permissions: SectionKey[]) => void;
  deleteUser: (userId: string) => void;
  getAllUsers: () => AppUser[];
  hasPermission: (section: SectionKey) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function useAuthState(): AuthContextType {
  initUsers();

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const { userId } = JSON.parse(session) as { userId: string };
        const users = getUsers();
        return users.find((u) => u.id === userId) ?? null;
      }
    } catch {}
    return null;
  });

  const login = useCallback((username: string, password: string): boolean => {
    const users = getUsers();
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.passwordHash === hashPassword(password),
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const changePassword = useCallback(
    (userId: string, newPassword: string) => {
      const users = getUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx === -1) throw new Error("User not found");
      users[idx] = { ...users[idx], passwordHash: hashPassword(newPassword) };
      saveUsers(users);
      if (currentUser?.id === userId) {
        setCurrentUser(users[idx]);
      }
    },
    [currentUser],
  );

  const createUser = useCallback(
    (
      username: string,
      password: string,
      permissions: SectionKey[],
    ): AppUser => {
      const users = getUsers();
      if (
        users.find((u) => u.username.toLowerCase() === username.toLowerCase())
      ) {
        throw new Error("Username already exists");
      }
      const newUser: AppUser = {
        id: Date.now().toString(),
        username,
        passwordHash: hashPassword(password),
        role: "user",
        permissions,
        createdAt: Date.now(),
      };
      users.push(newUser);
      saveUsers(users);
      return newUser;
    },
    [],
  );

  const updateUserPermissions = useCallback(
    (userId: string, permissions: SectionKey[]) => {
      const users = getUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx === -1) throw new Error("User not found");
      users[idx] = { ...users[idx], permissions };
      saveUsers(users);
      if (currentUser?.id === userId) {
        setCurrentUser(users[idx]);
      }
    },
    [currentUser],
  );

  const deleteUser = useCallback((userId: string) => {
    if (userId === "admin") throw new Error("Cannot delete admin");
    const users = getUsers().filter((u) => u.id !== userId);
    saveUsers(users);
  }, []);

  const getAllUsers = useCallback((): AppUser[] => {
    return getUsers();
  }, []);

  const hasPermission = useCallback(
    (section: SectionKey): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === "admin") return true;
      return currentUser.permissions.includes(section);
    },
    [currentUser],
  );

  return useMemo(
    () => ({
      currentUser,
      isAuthenticated: currentUser !== null,
      login,
      logout,
      changePassword,
      createUser,
      updateUserPermissions,
      deleteUser,
      getAllUsers,
      hasPermission,
    }),
    [
      currentUser,
      login,
      logout,
      changePassword,
      createUser,
      updateUserPermissions,
      deleteUser,
      getAllUsers,
      hasPermission,
    ],
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
