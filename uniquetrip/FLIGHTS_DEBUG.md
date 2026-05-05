# Flights Page Search Debugging 🔍

## Issue
Search works on **index_new.html** but NOT on **flights_new.html**

## Added Debug Logging

### In flights.js:
```javascript
console.log('✅ Flights page scripts loaded successfully');
console.log('🔍 Search form found:', document.querySelector('.search-form') ? 'YES' : 'NO');
console.log('📍 Results section found:', document.getElementById('search-results') ? 'YES' : 'NO');
console.log('📦 Results content found:', document.getElementById('results-content') ? 'YES' : 'NO');
```

### In script.js:
```javascript
console.log('✅ Hero search form handler attached to:', searchForm);
console.log('🔍 Hero search triggered:', { from, to, date });
```

## How to Debug

1. **Open Flights Page**
   ```
   http://localhost:3000/flights_new.html
   ```

2. **Open Browser Console** (F12 → Console tab)

3. **Check Initial Logs**
   You should see:
   ```
   ✅ Flights page scripts loaded successfully
   🔍 Search form found: YES
   📍 Results section found: YES
   📦 Results content found: YES
   ✅ Hero search form handler attached to: <form>
   ```

4. **Fill Search Form**
   - From: Mumbai
   - To: Delhi
   - Date: Tomorrow

5. **Submit Search**
   
6. **Check Console for:**
   ```
   🔍 Hero search triggered: {from: "Mumbai", to: "Delhi", date: "2025-10-20"}
   ```

## Expected Results

### If Working:
- ✅ Console shows search triggered
- ✅ Button shows "🔍 Searching..."
- ✅ API call to `/api/flights/search`
- ✅ Results render in `#results-content`
- ✅ Results section becomes visible
- ✅ Page scrolls to results

### If NOT Working:
- ❌ No "search triggered" log → Handler not attached
- ❌ No API call → displaySearchResults not called
- ❌ API error → Backend issue
- ❌ Results don't show → DOM issue

## Possible Issues

### Issue 1: Script Load Order
- `flights.js` loads before `script.js`
- Both have `defer` attribute
- Should work, but timing might be off

**Solution:** Check if hero search handler runs before DOM is ready

### Issue 2: Conflicting Event Listeners
- Both `flights.js` and `script.js` might interfere
- Theme toggle might prevent form submission

**Solution:** Remove duplicate code from `flights.js`

### Issue 3: Form Element Issues
- Form might have different structure on flights page
- IDs might be missing or different

**Solution:** Verify HTML structure matches index page

## Next Steps

1. **Refresh browser** (Ctrl+R or F5)
2. **Open console** (F12)
3. **Check logs** when page loads
4. **Try search** and report what you see in console
5. **Copy console output** and share it

---

**Status:** Debugging in progress
**Test URL:** http://localhost:3000/flights_new.html
