import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "@/hooks/use-toast";

//Hardcoded Shopify store URL and access token
const SHOPIFY_STORE_URL = "";
const STOREFRONT_ACCESS_TOKEN = "477952feb4228f59925d6c822422100c";

const defaultProducts = [
  {
    id: "1",
    title: "Studio Time",
    description: "Book studio time for your next project.",
    handle: "default-product-1",
    priceRange: {
      minVariantPrice: {
        amount: "100/hr",
        currencyCode: "USD",
      },
    },
    images: {
      edges: [
        {
          node: {
            url: "/laptop-uploads/recording.jpg", // Ensure this file is in the public directory
            altText: "Default Product 1",
          },
        },
      ],
    },
  },
  {
    id: "2",
    title: "Mixing & Mastering",
    description: "Professional mixing and mastering services.",
    handle: "default-product-2",
    priceRange: {
      minVariantPrice: {
        amount: "500",
        currencyCode: "USD",
      },
    },
    images: {
      edges: [
        {
          node: {
            url: "/laptop-uploads/mixing-mastering.jpg", // Ensure this file is in the public/laptop-uploads directory
            altText: "Default Product 2",
          },
        },
      ],
    },
  },
  {
    id: "3",
    title: "VSTs & Audio Software",
    description: "Inlcudes a selection of VSTs and tools.",
    handle: "default-product-3",
    priceRange: {
      minVariantPrice: {
        amount: "25",
        currencyCode: "USD",
      },
    },
    images: {
      edges: [
        {
          node: {
            url: "/laptop-uploads/BlackJ.png", // Ensure this file is in the public/laptop-uploads directory
            altText: "Default Product 3",
          },
        },
      ],
    },
  },
  // Add more default products as needed
];

const Shop = () => {
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const response = await fetch(`https://${SHOPIFY_STORE_URL}/api/2024-01/graphql`, {
        method: "POST",
        mode: 'cors',
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
          "Accept": "application/json",
        },
        body: JSON.stringify({
          query: `
            {
              products(first: 3) {
                edges {
                  node {
                    id
                    title
                    description
                    handle
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
    } catch (error) {
      console.error("Error fetching products:", error);
      return defaultProducts;
    }
  };

  const { data: products, isLoading } = useQuery({
    queryKey: ["shopifyProducts"],
    queryFn: fetchProducts,
  });

  const displayedProducts = products || defaultProducts;

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

  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-studio-gold mb-8 text-center">Shop</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProducts.map((product) => (
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
                  onClick={() => window.open(`https://${SHOPIFY_STORE_URL}`, '_blank')}
                  className="bg-studio-red hover:bg-red-700 text-white"
                >
                  Visit Now
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
