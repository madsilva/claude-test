import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function CreateProductPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [images, setImages] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainImage || !storeId) return;

    const formData = new FormData();
    formData.append('storeId', storeId);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stockQuantity', stockQuantity);
    formData.append('mainImage', mainImage);
    if (images) {
      Array.from(images).forEach(img => formData.append('images', img));
    }

    try {
      await api.createProduct(formData);
      navigate(`/store/${storeId}`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader><CardTitle>Create Product</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input id="stockQuantity" type="number" min="0" value={stockQuantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockQuantity(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="mainImage">Main Image</Label>
              <Input id="mainImage" type="file" accept="image/*" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMainImage(e.target.files?.[0] || null)} required />
            </div>
            <div>
              <Label htmlFor="images">Additional Images</Label>
              <Input id="images" type="file" accept="image/*" multiple onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImages(e.target.files)} />
            </div>
            <Button type="submit">Create Product</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
