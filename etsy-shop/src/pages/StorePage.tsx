import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function StorePage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (id) api.getStore(id, page).then(setData);
  }, [id, page]);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{data.store.name}</h1>
        <p className="text-gray-600">{data.store.description}</p>
        <Link to={`/store/${id}/create-product`}>
          <Button className="mt-4">Add Product</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.products.map((product: any) => (
          <Link key={product.id} to={`/product/${product.id}`}>
            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <img src={`http://localhost:3000${product.mainImage}`} alt={product.name} className="w-full h-48 object-cover rounded" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>${product.price}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {data.pagination && (
        <div className="mt-8 flex justify-center gap-2">
          <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="py-2 px-4">Page {page} of {data.pagination.totalPages}</span>
          <Button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}
