// Only public, non-secret configuration belongs in EXPO_PUBLIC_* variables.
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
export type Capabilities = {
  demo: boolean;
  ai: boolean;
  imageRecognition: boolean;
  subscriptions: boolean;
  recordStorage: string;
};
export async function getCapabilities(): Promise<Capabilities> {
  if (!API_URL) throw new Error("未配置后端地址；本地演示功能可正常使用。");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_URL}/v1/capabilities`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`后端返回 ${response.status}`);
    return (await response.json()) as Capabilities;
  } finally {
    clearTimeout(timer);
  }
}
// Future adapters must implement server-side authorization and consent.
export interface AIProvider {
  diagnose(
    description: string,
  ): Promise<{ suggestions: string[]; source: string; demo: boolean }>;
}
export interface ImageRecognitionProvider {
  analyze(imageUri: string): Promise<{ observations: string[]; demo: boolean }>;
}
export interface SubscriptionProvider {
  getEntitlements(): Promise<{ active: boolean; features: string[] }>;
}
