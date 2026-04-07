# 3D Asset Generation Guide

This guide explains how to generate and optimize the optional 3D model assets for tree listings in the Charleston Bonsai Gallery.

## Overview

The gallery uses **Three.js** to display interactive 3D models of bonsai trees. These models must be in **GLB** (Binary GLTF) format to ensure compatibility and performance.

Since each bonsai is a unique living specimen, we recommend using **Photogrammetry** to create realistic 3D replicas from standard photographs.

---

## Step 1: Capture (Photography)

To create a high-quality 3D model, you need a series of photos from every angle.

### Equipment

- **Camera:** A modern smartphone or DSLR.
- **Lighting:** Soft, even lighting (overcast days are best for outdoor shots; avoid harsh shadows).
- **Turntable (Optional but Recommended):** Place the bonsai on a manual or automatic turntable against a plain, matte background.

### Technique

1. **Consistency:** Keep the focus and exposure locked.
2. **Coverage:** Take 50–100 photos.
3. **Angles:**
    - 36 images in a full 360° circle at eye level.
    - 36 images in a full 360° circle from a higher "45-degree" angle.
    - A few top-down shots.
4. **Overlap:** Ensure each photo overlaps with the previous one by about 60–80%.

---

## Step 2: Processing (Photogrammetry)

Process your photos into a 3D mesh using one of these tools:

### Recommended Apps (Mobile)

- **[Polycam](https://polycam.ai/):** Best for quick, high-quality results directly from an iPhone/Android. Use "Photo Mode."
- **[Luma AI](https://lumalabs.ai/):** Excellent for realistic textures and Gaussian Splatting (though we require GLB export for the viewer).

### Advanced Software (Desktop)

- **[Meshroom](https://alicevision.org/#meshroom):** Open-source and powerful (Windows/Linux).
- **[RealityCapture](https://www.capturingreality.com/):** Industry standard for highest detail.

**Export Format:** Choose **GLB** or **GLTF**.

---

## Step 3: Optimization

Raw photogrammetry models are often too large for the web (50MB+). They must be optimized to under **10MB** (ideally 2–5MB).

### 1. Manual Optimization (Blender)

- **Decimate:** Use the *Decimate Modifier* to reduce polygon count (aim for 50k–100k faces).
- **Resize Textures:** Ensure textures are no larger than 2048x2048.
- **Cleanup:** Remove any "floating" artifacts from the background.

### 2. Automatic Optimization (Command Line)

If you have Node.js installed, use `gltf-pipeline` or `gltf-transform`:

```bash
# Compress with Draco (reduces file size significantly)
npx @gltf-transform/cli optimize input.glb output.glb --compress draco
```

---

## Step 4: Listing Integration

Once you have your `.glb` file:

1. Log in to the **Admin Dashboard** (`/admin/login`).
2. Create or Edit a listing.
3. Scroll to the **3D Model URL** field.
4. Click **Browse** next to the 3D Model field to upload your `.glb` file.
5. Save the listing.

The 3D viewer will now automatically appear on the public tree detail page.

---

## Troubleshooting

- **Model is black:** Check that you exported with "Embed Textures" enabled in Blender.
- **Model is sideways:** In the `TreeViewer3D.vue` component, we center the model automatically, but ensure your "up" axis is set to **Y-Up** during export.
- **Loading is slow:** Reduce your texture size. A 1024x1024 JPG is usually sufficient for mobile devices.
