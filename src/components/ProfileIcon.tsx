import React from 'react';
import { User, LogIn, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const ProfileIcon = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-700/50 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link to="/auth">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-black/90 backdrop-blur-md border-gray-700">
        <DropdownMenuItem disabled className="text-gray-300 text-sm">
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem 
          onClick={() => navigate('/admin')}
          className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
        >
          <Settings className="h-4 w-4 mr-2" />
          My Purchases
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileIcon;