import { DefaultApi } from '../../packages/contracts/src/generated/apis/DefaultApi';
import { Configuration } from '../../packages/contracts/src/generated/runtime';
import { IndexedDbVault } from './IndexedDbVault';

export class SyncService {
  constructor(apiBaseUrl = '/api') {
    const config = new Configuration({ basePath: apiBaseUrl });
    this.api = new DefaultApi(config);
    this.localVault = new IndexedDbVault();
  }

  async syncAll() {
    await this.localVault.init();
    const localProfiles = await this.localVault.listProfiles();

    // 1. Push local changes to remote
    for (const profile of localProfiles) {
      if (profile.syncStatus === 'dirty') {
        try {
          const remoteProfile = await this.api.createProfile({ childProfile: profile });
          // Update local with remote ID and clear dirty flag
          await this.localVault.saveProfile({ ...remoteProfile, syncStatus: 'synced' });
        } catch (error) {
          console.error(`Failed to sync profile ${profile.id}:`, error);
        }
      }
    }

    // 2. Pull remote changes to local
    try {
      const remoteProfiles = await this.api.listProfiles();
      for (const remote of remoteProfiles) {
        await this.localVault.saveProfile({ ...remote, syncStatus: 'synced' });
      }
    } catch (error) {
      console.error('Failed to pull remote profiles:', error);
    }
  }

  async saveProfile(profile) {
    // Save locally first with dirty flag
    const localProfile = { ...profile, syncStatus: 'dirty' };
    await this.localVault.saveProfile(localProfile);

    // Try to sync immediately
    try {
      const remoteProfile = await this.api.createProfile({ childProfile: profile });
      await this.localVault.saveProfile({ ...remoteProfile, syncStatus: 'synced' });
      return remoteProfile;
    } catch (error) {
      console.warn('Sync failed, saved locally only:', error);
      return localProfile;
    }
  }
}
