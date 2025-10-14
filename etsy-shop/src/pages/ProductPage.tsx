import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      api.getProduct(id).then(data => {
        setProduct(data);
        if (data.variants?.length > 0) setSelectedVariant(data.variants[0]);
      });
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return alert('Please select a variant');
    try {
      await api.addToCart(product.storeId, selectedVariant.id, quantity);
      alert('Added to cart!');
      navigate(`/cart/${product.storeId}`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
      <div>
        <img src={`http://localhost:3000${product.mainImage}`} alt={product.name} className="w-full rounded-lg" />
        {product.images?.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {product.images.map((img: string, i: number) => (
              <img key={i} src={`http://localhost:3000${img}`} alt="" className="w-full h-20 object-cover rounded" />
            ))}
          </div>
        )}
      </div>
      <div>
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <p className="text-2xl font-bold mb-4">${product.price}</p>
        <p className="text-gray-600 mb-6">{product.description}</p>
        {product.variants?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Variants:</h3>
            {product.variants.map((v: any) => (
              <Button
                key={v.id}
                variant={selectedVariant?.id === v.id ? 'default' : 'outline'}
                onClick={() => setSelectedVariant(v)}
                className="mr-2 mb-2"
              >
                {v.size} {v.color} - Stock: {v.stockQuantity}
              </Button>
            ))}
          </div>
        )}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Quantity:</label>
          <Input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} />
        </div>
        <Button onClick={handleAddToCart} className="w-full" size="lg">Add to Cart</Button>
      </div>
    </div>
  );
}
