// routes/app.page-list.js
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { LegacyCard, Button, Text, ButtonGroup } from '@shopify/polaris';
import { json } from "@remix-run/node";



// Loader
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const query = await admin.graphql(`
    query PageList {
      pages(first: 10) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `);

  const page = await query.json();
  return { pages: page };
};

// Action
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const pageId = formData.get("pageId");

  if (!pageId) {
    return json({ error: "Page ID is required." }, { status: 400 });
  }

  const response = await admin.graphql(
    `mutation pageDelete($id: ID!) {
      pageDelete(id: $id) {
        deletedPageId
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: { id: pageId },
    }
  );

  const responseData = await response.json();

  if (responseData.data?.pageDelete?.userErrors.length > 0) {
    return json({ errors: responseData.data.pageDelete.userErrors }, { status: 400 });
  }

  return json({ success: true, deletedPageId: responseData.data.pageDelete.deletedPageId });
};

// Component
export default function PageList() {
  const { pages } = useLoaderData();
  const fetcher = useFetcher();
  const pageEdges = pages?.data?.pages?.edges || [];

  const handleAction = (title) => {
    console.log(`Add Step clicked for ${title}`);
  };

  const handleDelete = (pageId, title) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${title}"?`);
    if (confirmDelete) {
      const formData = new FormData();
      formData.append("pageId", pageId);
      fetcher.submit(formData, { method: "post" });
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Text variant="headingLg" as="h1">Page List</Text>

      {pageEdges.length > 0 ? (
        pageEdges.map((edge) => {
          const page = edge.node;
          const pageUrl = `https://vicky-demo.myshopify.com/pages/${page.handle}`;

          return (
            <div key={page.id} style={{ marginTop: '1rem' }}>
              <LegacyCard sectioned>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text variant="bodyLg" fontWeight="medium">
                      {page.title}
                    </Text>
                  </div>
                  <ButtonGroup>
                    <Button onClick={() => window.open(pageUrl, '_blank')} variant="primary">
                      View
                    </Button>
                    <Button url={`/app/page-Step/${page.id.split('/').pop()}`} onClick={() => handleAction(page.title, page.id)}>Add Step</Button>
                    <Button tone="critical" onClick={() => handleDelete(page.id, page.title)}>
                      Delete
                    </Button>
                  </ButtonGroup>
                </div>
              </LegacyCard>
            </div>
          );
        })
      ) : (
        <Text>No pages found.</Text>
      )}
    </div>
  );
}
