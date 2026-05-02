import { Provider, Product, SearchParams } from "./base-provider";
import { ViatorProvider } from "./viator-provider";

const providers: Provider[] = [
  new ViatorProvider(),
];

export async function searchAllProviders(params: SearchParams): Promise<Product[]> {
  const promises = providers.map(async (provider) => {
    try {
      const products = await provider.search(params);
      return products;
    } catch (e) {
      console.error(`Provider ${provider.name} failed:`, e);
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat();
}
