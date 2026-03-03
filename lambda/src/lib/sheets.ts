import { JWT } from 'google-auth-library';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const sm = new SecretsManagerClient({ region: 'us-east-1' });

// Cached after first cold start — warm invocations skip Secrets Manager + re-auth
let jwtClient: JWT | null = null;

async function getJwt(): Promise<JWT> {
  if (jwtClient) return jwtClient;

  const resp = await sm.send(new GetSecretValueCommand({
    SecretId: process.env.GOOGLE_SA_SECRET_ARN!,
  }));

  const creds = JSON.parse(resp.SecretString!);

  jwtClient = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return jwtClient;
}

export async function appendToSheet(spreadsheetId: string, row: (string | number | boolean | null)[]): Promise<void> {
  const jwt = await getJwt();
  const { token } = await jwt.getAccessToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });

  if (!resp.ok) {
    throw new Error(`Sheets API ${resp.status}: ${await resp.text()}`);
  }
}
