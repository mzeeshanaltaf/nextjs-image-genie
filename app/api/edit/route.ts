import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, editPrompt } = await request.json();

    if (!imageUrl || !editPrompt) {
      return NextResponse.json(
        { error: 'Image URL and edit prompt are required' },
        { status: 400 }
      );
    }

    console.log('Editing image with prompt:', editPrompt);

    // Prepare FormData for sending image file
    const formData = new FormData();
    
    // If imageUrl is a data URL, convert to blob
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1];
      const mimeType = imageUrl.match(/data:(image\/[^;]+)/)?.[1] || 'image/png';
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: mimeType });
      formData.append('image', blob, 'image.png');
    } else {
      // If it's a URL, fetch the image first
      try {
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        formData.append('image', imageBlob, 'image.png');
      } catch (error) {
        console.error('Error fetching image:', error);
        // Fallback: send the URL as is
        formData.append('image', imageUrl);
      }
    }
    
    formData.append('type', 'image_editing');
    formData.append('data', editPrompt);

    // Using n8n webhook for image editing
    const response = await fetch('http://n8n-insuragi.732486.xyz:5678/webhook/ef3f705f-82aa-4c38-b4d9-f81e4a1e46f6', {
      method: 'POST',
      body: formData,
    });

    const responseText = await response.text();
    console.log('Webhook Response status:', response.status);

    if (!response.ok) {
      console.error('n8n webhook error:', responseText);
      
      // Try to parse error message
      try {
        const errorData = JSON.parse(responseText);
        return NextResponse.json(
          { error: errorData.error?.message || 'Failed to edit image' },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: 'Failed to edit image' },
          { status: response.status }
        );
      }
    }

    // Check if response is empty
    if (!responseText || responseText.trim() === '') {
      console.error('Empty response from webhook');
      return NextResponse.json(
        { error: 'Empty response from webhook. Please check your n8n workflow configuration.' },
        { status: 500 }
      );
    }

    // First, try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log('Webhook Response data:', JSON.stringify(data, null, 2));
      
      // Check for various possible response formats
      if (data.imageUrl) {
        return NextResponse.json({ imageUrl: data.imageUrl });
      }
      
      if (data.data) {
        // If data contains the base64 string directly
        if (typeof data.data === 'string') {
          const base64String = data.data;
          // Check if it's already a data URL
          if (base64String.startsWith('data:image')) {
            return NextResponse.json({ imageUrl: base64String });
          }
          // Otherwise, convert to data URL
          return NextResponse.json({ imageUrl: `data:image/png;base64,${base64String}` });
        }
        
        // If data contains imageUrl
        if (data.data.imageUrl) {
          return NextResponse.json({ imageUrl: data.data.imageUrl });
        }
      }
      
      if (data.url) {
        return NextResponse.json({ imageUrl: data.url });
      }
      
      if (data.image) {
        // If it's already a data URL
        if (data.image.startsWith('data:image')) {
          return NextResponse.json({ imageUrl: data.image });
        }
        // If it's raw base64, convert to data URL
        return NextResponse.json({ imageUrl: `data:image/png;base64,${data.image}` });
      }
      
      // If the entire response is just a string in an object, check if it's base64
      const keys = Object.keys(data);
      if (keys.length === 1 && typeof data[keys[0]] === 'string') {
        const possibleBase64 = data[keys[0]];
        // Simple check if it might be base64
        if (possibleBase64.length > 100 && /^[A-Za-z0-9+/]+=*$/.test(possibleBase64)) {
          return NextResponse.json({ imageUrl: `data:image/png;base64,${possibleBase64}` });
        }
      }
      
    } catch (jsonError) {
      // If JSON parsing fails, check if the response is raw base64
      console.log('Response is not JSON, checking if it\'s raw base64...');
      
      // Remove any whitespace
      const trimmedResponse = responseText.trim();
      
      // Check if it looks like base64 (basic validation)
      if (trimmedResponse.length > 100 && /^[A-Za-z0-9+/]+=*$/.test(trimmedResponse)) {
        console.log('Response appears to be raw base64, converting to data URL...');
        return NextResponse.json({ imageUrl: `data:image/png;base64,${trimmedResponse}` });
      }
      
      console.error('Failed to parse webhook response:', responseText.substring(0, 200));
      return NextResponse.json(
        { error: 'Invalid response format from webhook. Expected base64 image data.' },
        { status: 500 }
      );
    }

    console.error('No image found in response');
    return NextResponse.json(
      { error: 'No edited image generated. Please check the webhook response format.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Edit error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}