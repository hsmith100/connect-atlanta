import { fetchAPI } from './client';

export async function submitForm(
  formType: string,
  data: Record<string, string | number | boolean | null | string[]>,
): Promise<{ message?: string }> {
  return fetchAPI<{ message?: string }>(`/api/forms/${formType}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
