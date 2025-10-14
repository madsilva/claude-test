import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function CreateStorePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const store = await api.createStore(name, description);
      navigate(`/store/${store.id}`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader><CardTitle>Create a New Store</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Store Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <Button type="submit">Create Store</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
