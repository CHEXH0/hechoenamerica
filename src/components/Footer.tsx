import React from "react";
import { Link } from "react-router-dom";

const Footer = React.memo(() => {
  return (
    <footer className="bg-black border-t border-white/10 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold heading-gradient mb-2">Hecho En America Studio</h3>
            <p className="text-gray-400 text-sm max-w-md">
              A secure production portal for producers to deliver high-quality media to artists.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <Link 
              to="/privacy-policy" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms-of-service" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Terms of Service
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/10 text-center pb-16 md:pb-0">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Hecho En America. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
