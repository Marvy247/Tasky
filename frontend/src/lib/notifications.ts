// notifications
export type Notification = { id: string; type: string; message: string; read: boolean; createdAt: number; };
export function createNotification(type: string, message: string): Notification { return { id: crypto.randomUUID(), type, message, read: false, createdAt: Date.now() }; }
export function markAsRead(n: Notification): Notification { return { ...n, read: true }; }
export function markAllAsRead(ns: Notification[]) { return ns.map(markAsRead); }
export function clearNotification(ns: Notification[], id: string) { return ns.filter(n => n.id !== id); }
export function clearAllNotifications() { return []; }
export function getUnreadCount(ns: Notification[]) { return ns.filter(n => !n.read).length; }
export const NOTIF_TYPES = { PURCHASE: 'purchase', ESCROW: 'escrow', DISPUTE: 'dispute', LISTING: 'listing' } as const;
// localStorage
export function loadNotifications(): Notification[] { try { return JSON.parse(localStorage.getItem('notifications') || '[]'); } catch { return []; } }
export function saveNotifications(ns: Notification[]) { localStorage.setItem('notifications', JSON.stringify(ns)); }
// unit tests
