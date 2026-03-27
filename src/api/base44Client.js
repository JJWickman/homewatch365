import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId: paramAppId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
const appId = paramAppId || '696806e88e744d6cc803e3bb';

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});