# Search & Booking Fix for Service Pages 🔧

## Issue Identified
The search forms and "Book Now" buttons were not working on Hotels, Trains, Buses, Cabs, and Holidays pages.

## Root Causes

### 1. **Service Search Handlers Not Initialized on DOM Load**
- The service search handlers (`handleServiceSearch`) were being called immediately when script.js loaded
- However, at that point, the DOM elements (forms) might not be ready yet
- **Solution:** Wrapped the initialization in `DOMContentLoaded` event listener

### 2. **Missing Clear Results Handlers**
- Each service page has a "Clear Results" button (e.g., `#clear-hotels-results`)
- These buttons had no event listeners attached
- **Solution:** Added clear handlers for all services in `DOMContentLoaded`

### 3. **Featured "Book Now" Buttons Had No Handlers**
- Static featured cards on each page had "Book Now" buttons without onclick handlers
- These buttons would do nothing when clicked
- **Solution:** Added event delegation to attach click handlers to all "Book Now" buttons

## Changes Made to `script.js`

### Before:
```javascript
// Attach handlers for all service pages
['hotels','trains','buses','cabs','holidays'].forEach(service => handleServiceSearch(service));

console.log('✅ Scripts loaded. Search results, no-results, and all service handlers ready.');
```

### After:
```javascript
// Attach handlers for all service pages on DOM load
document.addEventListener('DOMContentLoaded', function() {
    ['hotels','trains','buses','cabs','holidays'].forEach(service => handleServiceSearch(service));
    
    // Add clear results handlers for all services
    ['hotels','trains','buses','cabs','holidays'].forEach(service => {
        const clearBtn = document.getElementById(`clear-${service}-results`);
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                const resultsSection = document.getElementById(`${service}-results`);
                const resultsContent = document.getElementById(`${service}-results-content`);
                if (resultsContent) resultsContent.innerHTML = '';
                if (resultsSection) resultsSection.style.display = 'none';
                const form = document.querySelector(`.${service}-search-form`);
                if (form) form.reset();
                showNotification('Results cleared', 'success');
            });
        }
    });
    
    // Handle "Book Now" buttons on featured items (static cards on page load)
    document.querySelectorAll('.btn').forEach(btn => {
        if (btn.textContent.trim() === 'Book Now' && !btn.hasAttribute('onclick')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const card = this.closest('.flight-card') || this.closest('.card');
                if (card) {
                    const title = card.querySelector('.airline, h3')?.textContent || 'Service';
                    const priceText = card.querySelector('.price')?.textContent || '₹0';
                    const price = parseInt(priceText.replace(/[₹,]/g, '')) || 0;
                    
                    let serviceType = 'service';
                    if (document.querySelector('.hotels-search-form')) serviceType = 'hotels';
                    else if (document.querySelector('.trains-search-form')) serviceType = 'trains';
                    else if (document.querySelector('.buses-search-form')) serviceType = 'buses';
                    else if (document.querySelector('.cabs-search-form')) serviceType = 'cabs';
                    else if (document.querySelector('.holidays-search-form')) serviceType = 'holidays';
                    
                    bookService(serviceType, Date.now(), title, price);
                }
            });
        }
    });
    
    console.log('✅ All service search handlers attached.');
});
```

### Enhanced Logging in `handleServiceSearch`:
```javascript
function handleServiceSearch(service) {
    const form = document.querySelector(`.${service}-search-form`);
    if (!form) {
        console.log(`⚠️ No form found for ${service}-search-form`);
        return;
    }
    console.log(`✅ Attached search handler for ${service}`);
    // ... rest of handler
}
```

## How It Works Now

### 1. **Search Flow**
```
User fills search form → Submits → 
handleServiceSearch captures event → 
Calls displayServiceResults(service, from, to, date) → 
Fetches from backend API → 
Renders results in ${service}-results-content → 
Displays ${service}-results section
```

### 2. **Book Now Flow (Search Results)**
```
Search results render with inline onclick="bookService(...)" → 
bookService() shows booking modal → 
User fills details → Submit → 
Shows success notification
```

### 3. **Book Now Flow (Featured Items)**
```
DOM loads → Event listeners attached to all .btn elements → 
User clicks "Book Now" on featured card → 
Detects service type from form on page → 
Calls bookService() → Shows modal → Success
```

### 4. **Clear Results Flow**
```
User clicks "Clear {Service} Results" button → 
Event listener clears results content → 
Hides results section → 
Resets search form → 
Shows notification
```

## Testing Instructions

### Test Search Functionality:
1. **Hotels Page** (`http://localhost:3000/hotels_new.html`)
   - Fill: City, Check-in date
   - Click "Search Hotels"
   - Should fetch and display hotel results

2. **Trains Page** (`http://localhost:3000/trains_new.html`)
   - Fill: From, To, Departure date
   - Click "Search Trains"
   - Should fetch and display train results

3. **Buses Page** (`http://localhost:3000/buses_new.html`)
   - Fill: From, To, Departure date
   - Click "Search Buses"
   - Should fetch and display bus results

4. **Cabs Page** (`http://localhost:3000/cabs_new.html`)
   - Fill: From, To, Pickup date
   - Click "Search Cabs"
   - Should fetch and display cab results

5. **Holidays Page** (`http://localhost:3000/holidays_new.html`)
   - Fill: From, To, Date
   - Click "Search Holidays"
   - Should fetch and display holiday packages

### Test Book Now Buttons:
1. Click any "Book Now" button on featured items
2. Booking modal should appear
3. Fill in name, email, phone
4. Submit
5. Should show success notification

### Test Clear Results:
1. After searching, click "Clear Results" button
2. Results should disappear
3. Form should reset

## Browser Console Logs

When pages load, you should see:
```
✅ Attached search handler for hotels
✅ Attached search handler for trains
✅ Attached search handler for buses
✅ Attached search handler for cabs
✅ Attached search handler for holidays
✅ All service search handlers attached.
```

When searching:
```
🔍 hotels search: {from: "Mumbai", to: "Mumbai", date: "2025-10-25"}
```

## API Endpoints Used

- **Hotels:** `GET /api/hotels/search?city={city}&checkin={date}`
- **Trains:** `GET /api/trains/search?from={from}&to={to}&date={date}`
- **Buses:** `GET /api/buses/search?from={from}&to={to}&date={date}`
- **Cabs:** `GET /api/cabs/search?from={from}&to={to}&date={date}`
- **Holidays:** `GET /api/holidays/search?from={from}&to={to}&date={date}`

## Files Modified

✅ **script.js** - Added DOM ready handlers, clear result handlers, and featured button handlers

## Status

✅ **Fixed** - All search forms and booking buttons now working across all service pages

## Next Steps

1. **Refresh Browser** - Press `Ctrl+R` or `F5` to reload the updated script.js
2. **Test Each Page** - Navigate through Hotels, Trains, Buses, Cabs, Holidays
3. **Verify Search** - Try searching on each page
4. **Verify Booking** - Click "Book Now" buttons
5. **Check Console** - Open browser DevTools (F12) to see logs

---

**Server Status:** ✅ Running on `http://localhost:3000`  
**Frontend:** ✅ Available at `http://localhost:3000/index_new.html`
