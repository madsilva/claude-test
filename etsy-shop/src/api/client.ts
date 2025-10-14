const API_BASE_URL = 'http://localhost:3000/api';

export class APIClient {
  private getAuthHeader() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getAuthHeader(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async signup(name: string, email: string, password: string) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  logout() {
    localStorage.removeItem('auth_token');
  }

  // Stores
  async getAllStores() {
    return this.request('/store/all');
  }

  async getStore(id: string, page?: number) {
    const query = page ? `?page=${page}` : '';
    return this.request(`/store/${id}${query}`);
  }

  async createStore(name: string, description: string) {
    return this.request('/store/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteStore(storeId: string) {
    return this.request(`/store/${storeId}`, {
      method: 'DELETE',
    });
  }

  // Products
  async createProduct(formData: FormData) {
    return this.request('/product/create', {
      method: 'POST',
      body: formData,
    });
  }

  async getProduct(productId: string) {
    return this.request(`/product/${productId}`);
  }

  async updateProduct(productId: string, data: any) {
    return this.request(`/product/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(productId: string) {
    return this.request(`/product/${productId}`, {
      method: 'DELETE',
    });
  }

  async createVariant(productId: string, data: any) {
    return this.request(`/product/${productId}/variant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async updateVariant(variantId: string, data: any) {
    return this.request(`/product/variant/${variantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  // Cart
  async addToCart(storeId: string, productVariantId: string, quantity: number) {
    return this.request('/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, productVariantId, quantity }),
    });
  }

  async getCart(storeId: string) {
    return this.request(`/cart/${storeId}`);
  }

  async getAllCarts() {
    return this.request('/cart/all');
  }

  async updateCartEntry(entryId: string, quantity: number) {
    return this.request(`/cart/entry/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(entryId: string) {
    return this.request(`/cart/entry/${entryId}`, {
      method: 'DELETE',
    });
  }

  async checkout(cartId: string) {
    return this.request(`/cart/${cartId}/checkout`, {
      method: 'POST',
    });
  }
}

export const api = new APIClient();
