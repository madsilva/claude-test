import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export function CartPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);

  useEffect(() => {
    if (storeId) api.getCart(storeId).then(setCart);
  }, [storeId]);

  const handleCheckout = async () => {
    if (!cart?.cart) return;
    try {
      await api.checkout(cart.cart.id);
      alert('Order placed successfully!');
      navigate('/');
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (!cart) return <div>Loading...</div>;
  if (!cart.items || cart.items.length === 0) return <div>Cart is empty</div>;

  const total = cart.items.reduce((sum: number, item: any) => sum + parseFloat(item.product.price) * item.quantity, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
      {cart.items.map((item: any) => (
        <Card key={item.id} className="mb-4">
          <CardContent className="flex justify-between items-center p-4">
            <div className="flex items-center gap-4">
              <img src={`http://localhost:3000${item.product.mainImage}`} alt={item.product.name} className="w-20 h-20 object-cover rounded" />
              <div>
                <h3 className="font-semibold">{item.product.name}</h3>
                <p className="text-sm text-gray-600">
                  {item.variant.size && `Size: ${item.variant.size}`} {item.variant.color && `Color: ${item.variant.color}`}
                </p>
                <p>Quantity: {item.quantity}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
              <Button variant="destructive" size="sm" onClick={() => api.removeFromCart(item.id).then(() => api.getCart(storeId!).then(setCart))}>
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="mt-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Total: ${total.toFixed(2)}</h2>
        <Button onClick={handleCheckout} size="lg">Checkout</Button>
      </div>
    </div>
  );
}
