import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

export function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="border-b border-pink-200 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Etsy Shop</Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/create-store"><Button variant="outline">Create Store</Button></Link>
              <span>Hello, {user?.name}</span>
              <Button onClick={logout} variant="ghost">Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="outline">Login</Button></Link>
              <Link to="/signup"><Button>Sign Up</Button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
