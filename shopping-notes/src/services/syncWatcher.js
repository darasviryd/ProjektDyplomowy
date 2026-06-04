import NetInfo from '@react-native-community/netinfo';
import { syncService } from './sync';

let unsubscribe = null;

export function startSyncWatcher(onSynced) {
  if (unsubscribe) return;

  unsubscribe = NetInfo.addEventListener(state => {
    const online = !!state.isConnected && state.isInternetReachable !== false;

    if (online) {
      syncService()
        .then(() => {
          if (typeof onSynced === 'function') onSynced();
        })
        .catch(() => {});
    }
  });
}

export function stopSyncWatcher() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}