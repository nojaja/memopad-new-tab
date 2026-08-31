import chromeWebstoreUpload from 'chrome-webstore-upload';

const requiredEnvironmentVariables = [
    'CHROME_WEB_STORE_CLIENT_ID',
    'CHROME_WEB_STORE_CLIENT_SECRET',
    'CHROME_WEB_STORE_EXTENSION_ID',
    'CHROME_WEB_STORE_PUBLISHER_ID',
    'CHROME_WEB_STORE_REFRESH_TOKEN'
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter((name) => !process.env[name]);

if (missingEnvironmentVariables.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`);
}

const store = chromeWebstoreUpload({
    clientId: process.env.CHROME_WEB_STORE_CLIENT_ID,
    clientSecret: process.env.CHROME_WEB_STORE_CLIENT_SECRET,
    extensionId: process.env.CHROME_WEB_STORE_EXTENSION_ID,
    publisherId: process.env.CHROME_WEB_STORE_PUBLISHER_ID,
    refreshToken: process.env.CHROME_WEB_STORE_REFRESH_TOKEN
});
const accessToken = await store.fetchToken();

await store.uploadExisting('extension.zip', accessToken, 60);
await store.publish('default', accessToken);