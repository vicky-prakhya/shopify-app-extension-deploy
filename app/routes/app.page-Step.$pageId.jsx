import { useState } from "react";
import {
  Button,
  ButtonGroup,
  Text,
  TextField,
  LegacyCard,
  Banner,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";


// Remix Action — handles form submission
export const action = async ({ request , params }) => {
  const { admin } = await authenticate.admin(request);
  const pageids = `gid://shopify/Page${params.pageId}`;

  const formData = await request.formData();

  const raw = formData.get("step");
  if (!raw) return json({ error: "Missing data" }, { status: 400 });

  const { fields, products } = JSON.parse(raw);

  // Construct new page title or content based on fields/products
  const titleField = fields.find(f => f.name.toLowerCase() === "title");
  const title = titleField?.value || "Default Title";

  const handle = title.toLowerCase().replace(/\s+/g, "-");

  const response = await admin.graphql(
    `#graphql
    mutation UpdatePage($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page {
          id
          title
          handle
        }
        userErrors {
          code
          field
          message
        }
      }
    }`,
    {
      variables: {
        id: pageids,
        page: {
          title,
          handle,
        },
      },
    }
  );

  const result = await response.json();

  if (result.data?.pageUpdate?.userErrors?.length) {
    return json({ error: result.data.pageUpdate.userErrors }, { status: 400 });
  }

  return json({
    success: true,
    page: result.data.pageUpdate.page,
  });
};

// Main component
export default function PageList() {
  const fetcher = useFetcher();
  const [fields, setFields] = useState([]);
  const [products, setProducts] = useState([]);

  const handleAddField = () => setFields(prev => [...prev, { name: "", value: "" }]);
  const handleAddProduct = () => setProducts(prev => [...prev, { productId: "" }]);

  const handleFieldChange = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const handleProductChange = (index, value) => {
    const updated = [...products];
    updated[index].productId = value;
    setProducts(updated);
  };

  const handleSubmit = () => {
    const payload = { fields, products };
    const formData = new FormData();
    formData.append("step", JSON.stringify(payload));

    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <Text variant="headingLg" as="h1">Create Step</Text>

      {/* Success/Error Banner */}
      {fetcher.data?.success && (
        <Banner status="success" title="Page updated successfully!" />
      )}
      {fetcher.data?.error && (
        <Banner status="critical" title="Update failed">
          <ul>
            {Array.isArray(fetcher.data.error)
              ? fetcher.data.error.map((err, i) => <li key={i}>{err.message}</li>)
              : <li>{fetcher.data.error}</li>}
          </ul>
        </Banner>
      )}

      <div style={{ margin: "1rem 0" }}>
        <ButtonGroup>
          <Button onClick={handleAddField}>Add Field</Button>
          <Button onClick={handleAddProduct}>Add Product</Button>
        </ButtonGroup>
      </div>

      {/* Fields */}
      {fields.map((field, index) => (
        <LegacyCard key={index} sectioned>
          <Text variant="headingSm" as="h3">Field {index + 1}</Text>
          <TextField
            label="Name"
            value={field.name}
            onChange={(value) => handleFieldChange(index, "name", value)}
            autoComplete="off"
          />
          <TextField
            label="Value"
            value={field.value}
            onChange={(value) => handleFieldChange(index, "value", value)}
            autoComplete="off"
          />
        </LegacyCard>
      ))}

      {/* Products */}
      {products.map((product, index) => (
        <LegacyCard key={index} sectioned>
          <Text variant="headingSm" as="h3">Product {index + 1}</Text>
          <TextField
            label="Product ID"
            value={product.productId}
            onChange={(value) => handleProductChange(index, value)}
            autoComplete="off"
          />
        </LegacyCard>
      ))}

      {/* Submit Button */}
      {(fields.length > 0 || products.length > 0) && (
        <div style={{ marginTop: "2rem" }}>
          <Button variant="primary" onClick={handleSubmit}>
            Submit Step
          </Button>
        </div>
      )}
    </div>
  );
}
