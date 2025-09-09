# Product Requirements Document (PRD)  
**Application Name:** AI Image Genie  
**Version:** 1.4  
**Author:** Zeeshan Altaf  
**Date:** 2025-09-09  

---

## 1. Overview  
The **AI Image Genie** is a web-based application that leverages a custom **n8n Webhook backend** to generate and edit images. Users can provide text prompts to generate new images, download results, and perform iterative edits by describing desired changes.  

---

## 2. Objectives  
- Provide a seamless workflow for AI-powered image generation and editing.  
- Use **n8n workflow** as the backend processor.  
- Deliver a modern, responsive, and user-friendly UI using **TailwindCSS** and **shadcn/ui**.  

---

## 3. Target Users  
- Designers & creative professionals  
- Content creators  
- General users experimenting with AI-generated art  

---

## 4. Core Features  

### 4.1 Image Generation  
- User enters a text prompt in an input field.  
- On clicking **“Generate”**, the app sends the prompt to the n8n webhook.  
- Generated image(s) are displayed.  

### 4.2 Image Download  
- Each generated/edited image includes a **Download** button.  
- Images are downloaded in `.png` format.  

### 4.3 Image Editing  
- Users can click **“Edit”** on any generated image.  
- An input field appears where users describe changes (e.g., *“Make the sky darker”*).  
- The app sends the edit description to the webhook.  
- The edited image is displayed and can be downloaded.  

### 4.4 Iterative Editing  
- Users can perform multiple edits sequentially.  
- Each edit uses the **latest generated/edited image** as the base.  

---

## 5. User Flow  

1. **Home Screen**  
   - Input field for text prompt  
   - “Generate Image” button  

2. **Generated Result Screen**  
   - Display generated image(s)  
   - Actions: [Download] [Edit]  

3. **Edit Mode**  
   - Edit description input field  
   - “Apply Edit” button  
   - Display new image result  
   - Actions: [Download] [Edit Again]  

---

## 6. Technical Requirements  

### 6.1 Frontend  
- **Framework:** React (Next.js recommended)  
- **Styling:** TailwindCSS + shadcn/ui  
- **Libraries:**  
  - Axios or Fetch (API requests)  
  - FileSaver.js (for downloads, optional)  

### 6.2 Backend / API  
- **API Provider:** n8n Webhook  
- **Endpoint:**  
  - `POST http://n8n-insuragi.732486.xyz:5678/webhook/ef3f705f-82aa-4c38-b4d9-f81e4a1e46f6`  
- **Authentication:** Not required (unless added later in n8n).  

---

## 7. API Payload Examples  

### 7.1 Image Generation  
```javascript
fetch("http://n8n-insuragi.732486.xyz:5678/webhook/ef3f705f-82aa-4c38-b4d9-f81e4a1e46f6", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    type: "image_generation",
    data: "Generate an image of a futuristic cityscape at sunset in cyberpunk style"
  })
});
```
### 7.2 Image Editing
```javascript
  fetch("http://n8n-insuragi.732486.xyz:5678/webhook/ef3f705f-82aa-4c38-b4d9-f81e4a1e46f6", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    type: "image_editing",
    data: "Add flying cars in the sky"
  })
});
```
### 8 API Response Structure
 The webhook returns the generated/edited image in base64 format.
 ```javascript
{
  "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAHgCAYAA..."
}
```

