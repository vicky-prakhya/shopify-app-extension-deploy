import { authenticate } from "../shopify.server";
import { Text, Button, Card, Thumbnail, Badge } from '@shopify/polaris';
import React, { useState } from 'react';
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// Loader
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query GetProducts {
      products(first: 50) {
        nodes {
          id
          title
          handle
          featuredImage {
            url
          }
        }
      }
    }`,
  );

  const data = await response.json();
  return json(data.data.products.nodes);
};

// Component
export default function GetProducts() {
  const products = useLoaderData();
  const [selectedMainProduct, setSelectedMainProduct] = useState(null);
  const [selectedAddonProducts, setSelectedAddonProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleCheckboxChange = (product, isSelected) => {
    if (isSelected) {
      setSelectedProducts(prev => [...prev, product]);
    } else {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    }
  };

  const setAsMainProduct = () => {
    if (selectedProducts.length > 0) {
      setSelectedMainProduct(selectedProducts[0]);
      setSelectedProducts([]);
    }
  };

  const addAsAddonProduct = () => {
    if (selectedProducts.length > 0) {
      // Add selected products to addon products, avoiding duplicates
      const newAddons = selectedProducts.filter(
        product => !selectedAddonProducts.some(addon => addon.id === product.id)
      );
      setSelectedAddonProducts(prev => [...prev, ...newAddons]);
      setSelectedProducts([]);
    }
  };

  const removeAddonProduct = (productId) => {
    setSelectedAddonProducts(prev => prev.filter(product => product.id !== productId));
  };

  const clearAllAddons = () => {
    setSelectedAddonProducts([]);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Text variant="headingLg" as="h1">Bundle Product Select</Text>
      
      {/* Selected Products Display */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <Text variant="headingMd" as="h3">Selected Products</Text>
        
        {selectedMainProduct && (
          <div style={{ marginTop: '1rem' }}>
            <Text variant="bodyMd" fontWeight="bold">Main Product:</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              {selectedMainProduct.featuredImage && (
                <Thumbnail
                  source={selectedMainProduct.featuredImage.url}
                  alt={selectedMainProduct.title}
                  size="small"
                />
              )}
              <Text as="p">{selectedMainProduct.title}</Text>
            </div>
          </div>
        )}

        {selectedAddonProducts.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <Text variant="bodyMd" fontWeight="bold">Addon Products ({selectedAddonProducts.length}):</Text>
              <Button size="slim" onClick={clearAllAddons}>Clear All</Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedAddonProducts.map((product) => (
                <Badge
                  key={product.id}
                  onRemove={() => removeAddonProduct(product.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {product.featuredImage && (
                      <img 
                        src={product.featuredImage.url} 
                        alt={product.title}
                        style={{ width: '20px', height: '20px', borderRadius: '3px', objectFit: 'cover' }}
                      />
                    )}
                    {product.title}
                  </div>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button 
          onClick={setAsMainProduct} 
          disabled={selectedProducts.length === 0}
          variant="primary"
        >
          Set as Main Product
        </Button>
        <Button 
          onClick={addAsAddonProduct} 
          disabled={selectedProducts.length === 0}
        >
          Add as Addon Product(s)
        </Button>
      </div>

      {/* Products List with Checkboxes */}
      <div style={{ marginTop: '2rem' }}>
        <Text variant="headingSm" as="h4">Available Products:</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {products.map((product) => {
            const isMainProduct = selectedMainProduct?.id === product.id;
            const isAddonProduct = selectedAddonProducts.some(addon => addon.id === product.id);
            
            return (
              <Card 
                key={product.id} 
                style={{ 
                  border: isMainProduct ? '2px solid #008060' : 
                          isAddonProduct ? '2px solid #5c6ac4' : 
                          '1px solid #e1e3e5'
                }}
              >
                <div style={{ padding: '1rem', position: 'relative' }}>
                  {/* Status badges */}
                  {isMainProduct && (
                    <Badge status="success" size="small" style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      Main
                    </Badge>
                  )}
                  {isAddonProduct && (
                    <Badge status="info" size="small" style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      Addon
                    </Badge>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      className="product_checkbox"
                      checked={selectedProducts.some(p => p.id === product.id)}
                      onChange={(e) => handleCheckboxChange(product, e.target.checked)}
                      disabled={isMainProduct || isAddonProduct}
                      style={{ width: '18px', height: '18px' }}
                    />
                    {product.featuredImage && (
                      <Thumbnail
                        source={product.featuredImage.url}
                        alt={product.title}
                        size="small"
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <Text variant="bodySm" as="p" fontWeight="medium">
                        {product.title}
                      </Text>
                    </div>
                  </label>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Selection Info */}
      {selectedProducts.length > 0 && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <Text variant="bodySm">
            {selectedProducts.length} product(s) selected. Choose an action above.
          </Text>
        </div>
      )}
    </div>
  );
}