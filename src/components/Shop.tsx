import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "./ui/use-toast";

const SHOPIFY_STORE_URL = "hechoenamerica-8edf7bf7df135b934de8.o2.myshopify.dev";
const STOREFRONT_ACCESS_TOKEN = "477952feb4228f59925d6c822422100c";

const Shop = () => {
  const { toast } = useToast();

  const fetchProducts = async () => {
    const response = await fetch(`https://${SHOPIFY_STORE_URL}/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: `
          {
            products(first: 6) {
              edges {
                node {
                  id
                  title
                  description
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  images(first: 1) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await response.json();
    return data.data.products.edges;
  };

  const { data: products, isLoading, error } = useQuery({
    queryKey: ["shopifyProducts"],
    queryFn: fetchProducts,
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-studio-gold mb-8 text-center">Shop</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-black/50 border-studio-gold animate-pulse">
                <div className="h-64"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load products. Please try again later.",
    });
    return null;
  }

  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-studio-gold mb-8 text-center">Shop</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products?.map(({ node: product }) => (
            <Card key={product.id} className="bg-black/50 border-studio-gold hover:border-studio-red transition-colors">
              <CardHeader>
                <CardTitle className="text-white">{product.title}</CardTitle>
                <CardDescription className="text-gray-400 line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <img
                  src={product.images.edges[0]?.node.url || "/placeholder.svg"}
                  alt={product.images.edges[0]?.node.altText || product.title}
                  className="w-full h-48 object-cover rounded-md"
                />
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-studio-gold font-bold">
                  ${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)} {product.priceRange.minVariantPrice.currencyCode}
                </span>
                <Button
                  onClick={() => window.open(`https://${SHOPIFY_STORE_URL}/products/${product.handle}`, '_blank')}
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