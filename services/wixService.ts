import axios from 'axios';

export class WixService {
  private readonly baseUrl = 'https://www.wixapis.com/stores/v1';
  private readonly siteId: string;
  private readonly apiKey: string;

  constructor() {
    this.siteId = process.env.VITE_WIX_SITE_ID || '94397af6-2765-4927-babb-c2478755f45a';
    this.apiKey = process.env.VITE_WIX_API_KEY || '';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'wix-site-id': this.siteId,
      'Content-Type': 'application/json'
    };
  }

  async createProduct(product: {
    name: string;
    description: string;
    price: number;
    sku?: string;
  }) {
    try {
      const response = await axios.post(`${this.baseUrl}/products`, {
        product: {
          name: product.name,
          description: product.description,
          priceData: { price: product.price },
          sku: product.sku || '',
          productType: 'physical',
          visible: true
        }
      }, { headers: this.getHeaders() });
      return response.data.product;
    } catch (error: any) {
      console.error('Wix Error:', error.response?.data || error.message);
      throw new Error(`Wix API Failure: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }

  async addMedia(productId: string, imageUrl: string) {
    try {
      await axios.post(`${this.baseUrl}/products/${productId}/media`, {
        media: [{ url: imageUrl }]
      }, { headers: this.getHeaders() });
    } catch (error: any) {
      console.error('Wix Media Error:', error.response?.data || error.message);
    }
  }
}

export const wixService = new WixService();
