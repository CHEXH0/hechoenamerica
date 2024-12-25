import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

const Shop = () => {
  // This is a placeholder for Shopify products
  const products = [
    {
      id: 1,
      name: "Studio Time",
      price: "$100/hr",
      description: "Book studio time for your next project",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Mixing & Mastering",
      price: "$500",
      description: "Professional mixing and mastering services",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Beat Production",
      price: "$300",
      description: "Custom beat production for your tracks",
      image: "/placeholder.svg"
    }
  ];

  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-studio-gold mb-8 text-center">Shop</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="bg-black/50 border-studio-gold hover:border-studio-red transition-colors">
              <CardHeader>
                <CardTitle className="text-white">{product.name}</CardTitle>
                <CardDescription className="text-gray-400">{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-md"
                />
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-studio-gold font-bold">{product.price}</span>
                <Button
                  onClick={() => window.open('https://your-shopify-store.myshopify.com', '_blank')}
                  className="bg-studio-red hover:bg-red-700 text-white"
                >
                  Buy Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Shop;