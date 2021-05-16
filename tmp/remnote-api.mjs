import fetch, {FetchError} from 'node-fetch';

export default class RemNoteAPI {
  userId;
  apiKey;

  constructor(userId, apiKey) {
    this.userId = userId;
    this.apiKey = apiKey;
  }

  remContent(rem) {
    return [...rem.key, ...(rem.value || [])];
  }

  async getRem(remId) {
    const args = JSON.stringify({
      remId,
      userId: this.userId,
      apiKey: this.apiKey,
    });

    const response = await fetch('https://api.remnote.io/api/v0/get', {
      method: 'post',
      body: args,
    }).catch((reason) => {
      console.error('API get failed with:', reason);
    });

    if (!response.ok) {
      console.error('API response:', response);
      throw new FetchError(response, await response.text());
    }
    const data = await response.json();

    return data;
  }

  async getOrCreateRem(name, userId, apiKey) {}
}
