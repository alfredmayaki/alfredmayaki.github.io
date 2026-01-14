# 📊 Search Tag Cloud Documentation

## Overview

The Search Tag Cloud feature tracks and visualizes keywords from Claude Haiku 3.5 searches, creating a beautiful, interactive word cloud that shows what topics users are searching for most frequently.

---

## 🎯 Features

### 1. **Automatic Search Tracking**
- Captures every search query from the homepage
- Extracts and counts individual keywords
- Filters out common stop words (the, a, and, etc.)
- Stores data persistently in browser localStorage

### 2. **Beautiful Tag Cloud Visualization**
- **Size-based frequency**: Most searched words appear larger
- **Color-coded tags**: 5 gradient color schemes rotate through tags
- **Interactive**: Click any tag to search for that word
- **Animated**: Tags appear with smooth fade-in animations
- **Responsive**: Adapts to mobile, tablet, and desktop screens

### 3. **Real-time Statistics**
- **Total Searches**: Count of all searches performed
- **Unique Keywords**: Number of distinct words tracked
- **Most Searched**: The top keyword across all searches

### 4. **Recent Searches Timeline**
- Shows last 10 searches with timestamps
- Displays full query text
- Formatted with date and time

### 5. **Data Management**
- **Refresh**: Reload the cloud with latest data
- **Export**: Download all search data as JSON
- **Clear All**: Reset and start fresh

---

## 🚀 How It Works

### Architecture

```
┌─────────────────┐
│   index.html    │
│  (Search Bar)   │
└────────┬────────┘
         │ User types & presses Enter/clicks Search
         ▼
┌─────────────────┐
│ trackSearch()   │
│   Function      │
└────────┬────────┘
         │ Extracts keywords & counts frequency
         ▼
┌─────────────────┐
│  localStorage   │
│ claudeSearches  │
│ timestamps      │
└────────┬────────┘
         │ Persists across sessions
         ▼
┌─────────────────┐
│ tagcloud.html   │
│ Visualization   │
└─────────────────┘
```

### Data Storage

**localStorage keys:**

1. **`claudeSearches`** (Object)
   ```json
   {
     "economics": 15,
     "labour": 12,
     "policy": 8,
     "research": 7,
     "_query_what is labour economics": 2
   }
   ```

2. **`claudeSearchTimestamps`** (Array)
   ```json
   [
     {
       "query": "labour economics",
       "timestamp": 1705012345678
     }
   ]
   ```

### Keyword Extraction Algorithm

```javascript
// Stop words filtered out
const stopWords = [
  'the', 'a', 'an', 'and', 'or', 'but', 
  'in', 'on', 'at', 'to', 'for', 'of', 
  'with', 'is', 'was', 'are', 'be', 
  'have', 'has', 'what', 'when', 'where', 
  'why', 'how', 'can', 'could', 'would', 
  'should', 'will'
];

// Process:
1. Convert to lowercase
2. Remove punctuation
3. Split by spaces
4. Filter words > 2 characters
5. Remove stop words
6. Count each occurrence
```

### Size Classification

Tags are classified into 10 size categories based on frequency:

| Size Class | Font Size | Opacity | Usage |
|------------|-----------|---------|-------|
| size-1 | 0.8em | 70% | Rarely searched |
| size-2 | 0.9em | 75% | |
| size-3 | 1.0em | 80% | Average |
| size-4 | 1.2em | 85% | |
| size-5 | 1.4em | 90% | Common |
| size-6 | 1.6em | 95% | |
| size-7 | 1.8em | 100% | Very common |
| size-8 | 2.0em | 100% | |
| size-9 | 2.3em | 100% | Popular |
| size-10 | 2.6em | 100% | Most popular |

---

## 📱 User Interface

### Homepage Integration

**Search bar enhancements:**
- Link below search: "📊 View Search Tag Cloud"
- Added to navigation dropdown
- Automatic tracking on Enter key or Search button click

### Tag Cloud Page Sections

1. **Header**
   - Back to Home button
   - Title and subtitle
   - Particles.js background animation

2. **Statistics Bar**
   - Three key metrics displayed prominently
   - Color-coded with brand colors

3. **Controls**
   - Refresh, Export, Clear buttons
   - Icon + text labels
   - Danger styling for destructive actions

4. **Tag Cloud**
   - Center-aligned, responsive grid
   - Smooth hover effects
   - Click interaction
   - Badge showing frequency count

5. **Recent Searches**
   - Chronological list
   - Full query text preserved
   - Timestamp formatting

---

## 🎨 Visual Design

### Color Palette

```css
--brand: #3d4ee9       /* Primary blue */
--accent-1: #10b981    /* Green (growth) */
--accent-2: #f59e0b    /* Orange (energy) */
--accent-3: #ef4444    /* Red (danger) */
--accent-4: #8b5cf6    /* Purple (creativity) */
Pink: #ec4899           /* Pink (passion) */
```

### Tag Gradients

Tags cycle through 5 gradient combinations:
1. Blue → Light Blue
2. Green → Dark Green
3. Orange → Dark Orange
4. Purple → Dark Purple
5. Pink → Dark Pink

### Animations

**Tag Appear:**
```css
@keyframes tagAppear {
  from: opacity 0, scale 0.5, rotate -10deg
  to: opacity 1, scale 1, rotate 0
}
Duration: 0.5s
Easing: ease-out
```

**Hover Effect:**
- Scale: 1.1
- Rotation: 2deg
- Shadow: 0 8px 20px with brand color
- Z-index lift

---

## 📊 Use Cases

### 1. **Personal Insights**
- Track your own research interests over time
- Identify patterns in your queries
- Discover recurring themes

### 2. **Content Creation**
- Understand what topics interest you most
- Generate ideas for blog posts or research
- Find related keywords to explore

### 3. **Research Analytics**
- Analyze search behavior
- Export data for further analysis
- Compare trends over time

### 4. **Portfolio Showcase**
- Demonstrate your areas of expertise
- Visual representation of research interests
- Interactive element for visitors

---

## 🔧 Technical Implementation

### Files Modified/Created

1. **`index.html`** - Added:
   - Search tracking script
   - Link to tag cloud
   - Navigation dropdown item
   - localStorage integration

2. **`tagcloud.html`** - New file:
   - Complete tag cloud visualization
   - Statistics dashboard
   - Data management tools
   - Recent searches display

### Browser Compatibility

✅ **Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance

- **Data Limit**: Top 50 tags displayed
- **Search History**: Last 100 searches retained
- **localStorage**: ~5KB typical usage
- **No server**: All data stored locally

---

## 🛠️ Customization Options

### Adjust Tag Limits

In `tagcloud.html`, line ~275:
```javascript
.slice(0, 50) // Change 50 to your desired limit
```

### Modify Stop Words

In `index.html`, search tracking script:
```javascript
const stopWords = ['your', 'custom', 'stop', 'words'];
```

### Change Color Scheme

In `tagcloud.html` CSS:
```css
:root {
  --brand: #yourcolor;
  --accent-1: #yourcolor;
  /* etc. */
}
```

### Adjust Size Range

In `tagcloud.html` CSS, modify `.tag.size-*` classes

---

## 📈 Future Enhancements

Potential features to add:

1. **Time-based Filtering**
   - Last 7 days, 30 days, all time
   - Date range picker

2. **Category Grouping**
   - Auto-categorize by topic
   - Color-code by category

3. **Search Insights**
   - Most active hours/days
   - Search frequency charts
   - Trending topics

4. **Social Sharing**
   - Share tag cloud as image
   - Export as PNG/SVG

5. **Cloud Layouts**
   - Spiral layout
   - Circular layout
   - Random scatter

6. **Advanced Analytics**
   - Word associations
   - Related terms
   - Search patterns

---

## 🐛 Troubleshooting

### Tag cloud is empty
**Solution**: Perform some searches on the homepage first

### Tags not updating
**Solution**: Click the Refresh button or reload the page

### localStorage quota exceeded
**Solution**: Clear old data using the "Clear All Data" button

### Tags too small/large
**Solution**: Adjust the size classes in CSS

---

## 💡 Tips & Best Practices

1. **Regular Exports**: Download your search data periodically for backup

2. **Clean Data**: Clear irrelevant searches to keep the cloud focused

3. **Mobile Usage**: Works great on mobile - try it!

4. **Privacy**: All data stays in your browser - nothing sent to servers

5. **Share Insights**: Export and analyze search patterns for research

---

## 📝 Data Privacy

### What's Tracked
- ✅ Search query text
- ✅ Timestamp of search
- ✅ Word frequency counts

### What's NOT Tracked
- ❌ Personal information
- ❌ IP addresses
- ❌ Session data beyond searches
- ❌ Nothing sent to external servers

### Data Storage
- Stored locally in browser's localStorage
- Never leaves your device
- Can be cleared at any time
- Survives page refreshes

---

## 🎓 Example Use Case

**Scenario**: PhD student researching labour economics

**Searches over a month:**
- "labour market trends" (5 times)
- "employment statistics UK" (3 times)
- "wage inequality research" (4 times)
- "economic policy analysis" (2 times)

**Resulting Tag Cloud:**
- **labour** (size-9, blue)
- **market** (size-7, green)
- **employment** (size-6, orange)
- **wage** (size-6, purple)
- **statistics** (size-5, pink)
- **inequality** (size-6, blue)
- **policy** (size-4, green)
- **analysis** (size-4, orange)

**Insights:**
- Primary focus: Labour markets
- Secondary interests: Inequality, policy
- Data needs: Statistics, UK-specific

---

## ✨ Summary

The Search Tag Cloud is a powerful visualization tool that:
- 📊 Tracks your search behavior automatically
- 🎨 Presents data in a beautiful, interactive format
- 📱 Works seamlessly across all devices
- 🔒 Keeps your data private and local
- 📈 Helps identify research patterns and interests

Start searching to see your personal research tag cloud come to life!
