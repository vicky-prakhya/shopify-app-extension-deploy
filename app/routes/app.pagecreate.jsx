// app/routes/app.additional.jsx
import {
  Layout,
  Page,
  TextField,
  LegacyCard,
  Button,
  Banner
} from "@shopify/polaris";
import { useState, useCallback } from 'react';
import { authenticate } from "../shopify.server";
// import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);


  const formData = await request.formData();
  const title = formData.get('title');
  const body_html = formData.get('body_html');


  // GraphQL mutation se page create karna
  const response = await admin.graphql(
    `#graphql
              mutation CreatePage($page: PageCreateInput!) {
      pageCreate(page: $page) {
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
        page: {
          title: title,
          body: body_html,
          isPublished: true,
          templateSuffix: "custom"
        },
      },
    },

  );


  const responseData = await response.json();
  return { responseData: responseData }


}

export default function AdditionalPage() {
  const fetcher = useFetcher();
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = useCallback((newValue) => setTitle(newValue), []);

  const savaData =  () => {
  
      // FormData create karna
      const formData = new FormData();
      formData.append('title', title);
      formData.append('body_html', `<h1>${title}</h1><p>This is your new page content.</p>`);
      formData.append('author', 'Shopify App');

      // FormData values console par check karna
      console.log("FormData values:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

       fetcher.submit(formData, { method: "POST" });
       console.log(formData)

   
  };

  return (
    <Page fullWidth>
      <Layout>
        <Layout.Section>
          {message.text && (
            <Banner
              status={message.type === 'error' ? 'critical' : 'success'}
              onDismiss={() => setMessage({ type: '', text: '' })}
            >
              {message.text}
            </Banner>
          )}

          <LegacyCard title="Create Page" sectioned>
            <TextField
              label="Page Title"
              value={title}
              onChange={handleChange}
              autoComplete="off"
              placeholder="Enter page title"
            />

            <div style={{ marginTop: '10px' }}>
              <Button
                variant="primary"
                onClick={savaData}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Page...' : 'Save'}
              </Button>
            </div>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
