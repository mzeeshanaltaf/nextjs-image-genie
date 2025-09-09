'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Download, Edit, Loader2, Sparkles } from 'lucide-react';
import { saveAs } from 'file-saver';
import axios from 'axios';

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError('');

    try {
      // Using n8n webhook for image generation
      const response = await axios.post('/api/generate', { prompt });
      
      if (response.data.imageUrl) {
        const newImage: GeneratedImage = {
          url: response.data.imageUrl,
          prompt: prompt,
          timestamp: Date.now(),
        };
        setImages([newImage, ...images]);
        setPrompt('');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      const errorMessage = error.response?.data?.error || 'Failed to generate image. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const editImage = async () => {
    if (!editPrompt.trim() || !selectedImage) return;

    setIsEditing(true);
    setError('');

    try {
      // Using n8n webhook for image editing
      const response = await axios.post('/api/edit', {
        imageUrl: selectedImage.url,
        editPrompt: editPrompt,
      });
      
      if (response.data.imageUrl) {
        const newImage: GeneratedImage = {
          url: response.data.imageUrl,
          prompt: `Edited: ${editPrompt}`,
          timestamp: Date.now(),
        };
        setImages([newImage, ...images]);
        setEditPrompt('');
        setEditMode(false);
        setSelectedImage(null);
      }
    } catch (error: any) {
      console.error('Error editing image:', error);
      const errorMessage = error.response?.data?.error || 'Failed to edit image. Please try again.';
      setError(errorMessage);
    } finally {
      setIsEditing(false);
    }
  };

  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      if (imageUrl.startsWith('data:')) {
        const arr = imageUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        saveAs(blob, `${fileName}.png`);
      } else {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        saveAs(blob, `${fileName}.png`);
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      setError('Failed to download image.');
    }
  };

  const startEdit = (image: GeneratedImage) => {
    setSelectedImage(image);
    setEditMode(true);
    setEditPrompt('');
  };

  const cancelEdit = () => {
    setEditMode(false);
    setSelectedImage(null);
    setEditPrompt('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI Image Genie
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Generate and edit images with the power of AI
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editMode ? 'Edit Your Image' : 'Generate New Image'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editMode && selectedImage && (
              <div className="mb-4">
                <img
                  src={selectedImage.url}
                  alt="Selected for editing"
                  className="w-full max-w-md mx-auto rounded-lg shadow-md mb-4"
                />
              </div>
            )}

            <div className="space-y-4">
              {editMode ? (
                <Textarea
                  placeholder="Describe the changes you want to make..."
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full"
                  rows={3}
                />
              ) : (
                <Textarea
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full"
                  rows={3}
                />
              )}

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <Button
                      onClick={editImage}
                      disabled={isEditing || !editPrompt.trim()}
                      className="flex-1"
                    >
                      {isEditing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Editing...
                        </>
                      ) : (
                        'Apply Edit'
                      )}
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      disabled={isEditing}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={generateImage}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Image
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <Card key={image.timestamp} className="overflow-hidden">
                <CardContent className="p-0">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-auto object-contain"
                  />
                  <div className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 max-h-20 overflow-y-auto">
                      {image.prompt}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => downloadImage(image.url, `image-${image.timestamp}`)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        onClick={() => startEdit(image)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={editMode}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}