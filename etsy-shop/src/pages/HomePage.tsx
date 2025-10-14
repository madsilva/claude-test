import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function HomePage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllStores().then(setStores).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Browse Stores</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(store => (
          <Link key={store.id} to={`/store/${store.id}`}>
            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle>{store.name}</CardTitle>
                <CardDescription>{store.description}</CardDescription>
              </CardHeader>
              {store.previewImages && store.previewImages.length > 0 && (
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {store.previewImages.slice(0, 4).map((img: string, i: number) => (
                      <img key={i} src={`http://localhost:3000${img}`} alt="" className="w-full h-24 object-cover rounded" />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
