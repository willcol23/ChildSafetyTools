/**
 * Shared Interface for Identity Vault persistence.
 * Implemented by IndexedDB on Web and Room on Android.
 */
export interface IIdentityVault<T> {
  saveProfile(profile: T): Promise<T>;
  getProfile(id: string): Promise<T | null>;
  listProfiles(): Promise<T[]>;
  deleteProfile(id: string): Promise<void>;
}

/**
 * Shared Interface for Location Tracking.
 */
export interface ILocationTracker<E> {
  reportEvent(event: E): Promise<void>;
  getLocationHistory(profileId: string): Promise<E[]>;
}

/**
 * Shared Interface for Secure Messaging.
 */
export interface ISecureMessenger<M> {
  sendMessage(message: M): Promise<void>;
  receiveMessages(): Promise<M[]>;
}
