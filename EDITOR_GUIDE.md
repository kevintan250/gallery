# Gallery Editor Mode

## Overview
The gallery now includes an editing mode that allows you to rearrange and resize photos in the set view. Changes are stored temporarily and can be exported via browser console commands.

## How to Use

### 1. Enable Edit Mode
Open the browser console (F12 or Cmd+Option+I) and type:
```javascript
galleryEditMode(true)
```

All photos in the current set will now have:
- Blue borders indicating they are editable
- A blue resize handle in the bottom-right corner
- An info overlay showing position and size

### 2. Edit Photos

**To Move a Photo:**
- Click and drag anywhere on the photo
- The photo will follow your cursor
- Release to drop it in the new position

**To Resize a Photo:**
- Click and drag the blue circular handle in the bottom-right corner
- The photo will resize while maintaining its aspect ratio
- Release when you reach the desired size

### 3. Save Your Edits

When you're done editing, save the changes:
```javascript
gallerySaveEdits()
```

This will output formatted JSON data in the console showing the updated `photos` array. Copy this and paste it into your `photoSets.ts` file to make the changes permanent.

### 4. Export Complete Set Data (Optional)

To export the entire set including your edits:
```javascript
galleryExportData()
```

### 5. Disable Edit Mode

When you're done editing:
```javascript
galleryEditMode(false)
```

## Console Commands Reference

| Command | Description |
|---------|-------------|
| `galleryEditMode(true)` | Enable editing mode |
| `galleryEditMode(false)` | Disable editing mode |
| `gallerySaveEdits()` | Export edited photos array |
| `galleryExportData()` | Export complete set data |

## Tips

- Edits are stored in memory - make sure to save before closing the browser
- You can enable/disable edit mode at any time without losing changes
- The info overlay shows real-time x, y, width, and height values
- Minimum photo width is 100px to prevent making photos too small
- Photos maintain their aspect ratio when resizing

## Technical Details

- Position values (x, y) are in pixels relative to the container
- Size values (width, height) are in pixels
- All values are rounded to whole numbers for cleaner data
- The resize handle maintains the original aspect ratio of each photo
