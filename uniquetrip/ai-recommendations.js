// AI Recommendation System
// This system uses a scoring algorithm to match destinations with user preferences

class AIRecommendationEngine {
    constructor() {
        this.destinations = [
            {
                name: "Bali, Indonesia",
                image: "https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg",
                basePrice: 75000,
                duration: 5,
                style: ["relaxation", "culture", "romantic"],
                activities: ["beaches", "culture", "food", "adventure"],
                climate: "tropical",
                budget: "medium",
                description: "Tropical paradise with stunning beaches and rich culture"
            },
            {
                name: "Swiss Alps, Switzerland",
                image: "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg",
                basePrice: 150000,
                duration: 7,
                style: ["adventure", "luxury", "romantic"],
                activities: ["mountains", "adventure", "culture"],
                climate: "cold",
                budget: "high",
                description: "Majestic mountains perfect for skiing and adventure"
            },
            {
                name: "Dubai, UAE",
                image: "https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg",
                basePrice: 95000,
                duration: 4,
                style: ["luxury", "adventure", "family"],
                activities: ["shopping", "culture", "food", "nightlife"],
                climate: "tropical",
                budget: "high",
                description: "Luxurious city experience with world-class attractions"
            },
            {
                name: "Kyoto, Japan",
                image: "https://images.pexels.com/photos/402028/pexels-photo-402028.jpeg",
                basePrice: 120000,
                duration: 6,
                style: ["culture", "relaxation", "romantic"],
                activities: ["culture", "food", "shopping"],
                climate: "moderate",
                budget: "high",
                description: "Ancient temples and serene gardens in cultural heartland"
            },
            {
                name: "Maldives",
                image: "https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg",
                basePrice: 180000,
                duration: 5,
                style: ["luxury", "romantic", "relaxation"],
                activities: ["beaches", "adventure", "food"],
                climate: "tropical",
                budget: "luxury",
                description: "Ultimate luxury island resort experience"
            },
            {
                name: "Paris, France",
                image: "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg",
                basePrice: 140000,
                duration: 6,
                style: ["romantic", "culture", "luxury"],
                activities: ["culture", "food", "shopping", "nightlife"],
                climate: "moderate",
                budget: "high",
                description: "City of love with art, fashion, and cuisine"
            },
            {
                name: "Goa, India",
                image: "https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg",
                basePrice: 35000,
                duration: 4,
                style: ["relaxation", "budget", "adventure"],
                activities: ["beaches", "food", "nightlife", "culture"],
                climate: "tropical",
                budget: "low",
                description: "Beach paradise with vibrant nightlife and culture"
            },
            {
                name: "Iceland",
                image: "https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg",
                basePrice: 160000,
                duration: 7,
                style: ["adventure", "culture"],
                activities: ["mountains", "adventure", "wildlife", "culture"],
                climate: "cold",
                budget: "high",
                description: "Land of fire and ice with stunning natural wonders"
            },
            {
                name: "Thailand (Bangkok & Phuket)",
                image: "https://images.pexels.com/photos/1007426/pexels-photo-1007426.jpeg",
                basePrice: 55000,
                duration: 6,
                style: ["budget", "adventure", "culture"],
                activities: ["beaches", "food", "culture", "shopping", "nightlife"],
                climate: "tropical",
                budget: "medium",
                description: "Exotic beaches and vibrant city life"
            },
            {
                name: "Santorini, Greece",
                image: "https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg",
                basePrice: 125000,
                duration: 5,
                style: ["romantic", "luxury", "relaxation"],
                activities: ["beaches", "culture", "food"],
                climate: "moderate",
                budget: "high",
                description: "Iconic white-washed buildings overlooking azure seas"
            },
            {
                name: "New Zealand",
                image: "https://images.pexels.com/photos/325807/pexels-photo-325807.jpeg",
                basePrice: 175000,
                duration: 10,
                style: ["adventure", "family"],
                activities: ["mountains", "adventure", "wildlife", "beaches"],
                climate: "moderate",
                budget: "high",
                description: "Adventure capital with stunning landscapes"
            },
            {
                name: "Rajasthan, India",
                image: "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg",
                basePrice: 45000,
                duration: 7,
                style: ["culture", "budget", "family"],
                activities: ["culture", "food", "shopping"],
                climate: "moderate",
                budget: "low",
                description: "Royal heritage with magnificent palaces and forts"
            },
            {
                name: "Safari - Kenya",
                image: "https://images.pexels.com/photos/631317/pexels-photo-631317.jpeg",
                basePrice: 190000,
                duration: 8,
                style: ["adventure", "family", "luxury"],
                activities: ["wildlife", "adventure", "culture"],
                climate: "tropical",
                budget: "luxury",
                description: "Witness the great migration and African wildlife"
            },
            {
                name: "Barcelona, Spain",
                image: "https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg",
                basePrice: 110000,
                duration: 5,
                style: ["culture", "adventure", "family"],
                activities: ["beaches", "culture", "food", "shopping", "nightlife"],
                climate: "moderate",
                budget: "medium",
                description: "Vibrant city with stunning architecture and beaches"
            },
            {
                name: "Bhutan",
                image: "https://images.pexels.com/photos/1ever551/pexels-photo-1680551.jpeg",
                basePrice: 135000,
                duration: 6,
                style: ["culture", "adventure", "relaxation"],
                activities: ["mountains", "culture", "adventure"],
                climate: "moderate",
                budget: "high",
                description: "Hidden kingdom in the Himalayas with pristine nature"
            }
        ];

        this.preferences = this.loadPreferences();
    }

    // Load saved preferences from localStorage
    loadPreferences() {
        const saved = localStorage.getItem('aiTravelPreferences');
        return saved ? JSON.parse(saved) : null;
    }

    // Save preferences to localStorage
    savePreferences(preferences) {
        localStorage.setItem('aiTravelPreferences', JSON.stringify(preferences));
        this.preferences = preferences;
    }

    // Calculate match score between destination and user preferences
    calculateMatchScore(destination, preferences) {
        let score = 0;
        let maxScore = 0;

        // Style matching (30 points)
        maxScore += 30;
        if (destination.style.includes(preferences.travelStyle)) {
            score += 30;
        } else if (destination.style.some(s => this.getRelatedStyles(preferences.travelStyle).includes(s))) {
            score += 15;
        }

        // Activities matching (40 points)
        maxScore += 40;
        const matchedActivities = preferences.activities.filter(a => 
            destination.activities.includes(a)
        );
        score += (matchedActivities.length / Math.max(preferences.activities.length, 1)) * 40;

        // Climate matching (15 points)
        maxScore += 15;
        if (preferences.climate === 'any' || destination.climate === preferences.climate) {
            score += 15;
        }

        // Budget matching (15 points)
        maxScore += 15;
        if (destination.budget === preferences.budget) {
            score += 15;
        } else if (this.isAdjacentBudget(destination.budget, preferences.budget)) {
            score += 8;
        }

        return Math.round((score / maxScore) * 100);
    }

    // Get related travel styles for partial matching
    getRelatedStyles(style) {
        const relations = {
            'adventure': ['culture', 'family'],
            'relaxation': ['romantic', 'luxury', 'beach'],
            'culture': ['adventure', 'family'],
            'luxury': ['romantic', 'relaxation'],
            'budget': ['family', 'adventure'],
            'family': ['adventure', 'culture'],
            'romantic': ['luxury', 'relaxation']
        };
        return relations[style] || [];
    }

    // Check if budgets are adjacent
    isAdjacentBudget(budget1, budget2) {
        const order = ['low', 'medium', 'high', 'luxury'];
        const idx1 = order.indexOf(budget1);
        const idx2 = order.indexOf(budget2);
        return Math.abs(idx1 - idx2) === 1;
    }

    // Get personalized label based on style
    getPersonalizedLabel(style) {
        const labels = {
            'adventure': 'Adventure Seeker',
            'relaxation': 'Beach Lover',
            'culture': 'Culture Enthusiast',
            'luxury': 'Luxury Traveler',
            'budget': 'Smart Explorer',
            'family': 'Family Traveler',
            'romantic': 'Romance Seeker'
        };
        return labels[style] || 'Traveler';
    }

    // Generate recommendations
    generateRecommendations(limit = 6) {
        if (!this.preferences) {
            return this.getDefaultRecommendations(limit);
        }

        // Score all destinations
        const scored = this.destinations.map(dest => ({
            ...dest,
            matchScore: this.calculateMatchScore(dest, this.preferences)
        }));

        // Sort by score and return top recommendations
        return scored
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit);
    }

    // Get default recommendations when no preferences are set
    getDefaultRecommendations(limit = 3) {
        return this.destinations
            .slice(0, limit)
            .map(dest => ({
                ...dest,
                matchScore: Math.floor(Math.random() * 20) + 80 // 80-99 range
            }));
    }

    // Render recommendations to DOM
    renderRecommendations(containerId = 'ai-recommendations-grid') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const recommendations = this.generateRecommendations(6);
        
        if (recommendations.length === 0) {
            container.innerHTML = '<p class="no-recommendations">No recommendations available. Please set your preferences.</p>';
            return;
        }

        container.innerHTML = recommendations.map(dest => `
            <div class="card ai-card" data-match="${dest.matchScore}">
                <div class="ai-badge">AI Picked</div>
                <div class="ai-score">${dest.matchScore}% Match</div>
                <img src="${dest.image}" alt="${dest.name}" loading="lazy">
                <div class="card-content">
                    <h3>${dest.name}</h3>
                    <p class="ai-match">${dest.matchScore}% Match • ${this.getPersonalizedLabel(this.preferences?.travelStyle || 'adventure')}</p>
                    <p class="price">${dest.duration} Nights | ₹${dest.basePrice.toLocaleString('en-IN')}</p>
                    <p class="destination-desc">${dest.description}</p>
                    <div class="ai-features">
                        ${dest.activities.slice(0, 3).map(act => this.getActivityIcon(act)).join('')}
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-ai" onclick="exploreDestination('${dest.name}')">Explore Now</button>
                        <button class="btn-icon" onclick="toggleFavorite('${dest.name}')" aria-label="Add to favorites">
                            ❤️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Get emoji icon for activity
    getActivityIcon(activity) {
        const icons = {
            'beaches': '🏖️ Beaches',
            'mountains': '🏔️ Mountains',
            'culture': '🛕 Culture',
            'food': '🍜 Food',
            'shopping': '🛍️ Shopping',
            'adventure': '🪂 Adventure',
            'wildlife': '🦁 Wildlife',
            'nightlife': '🌃 Nightlife'
        };
        return `<span>${icons[activity] || activity}</span>`;
    }
}

// Global instance
const aiEngine = new AIRecommendationEngine();

// Initialize AI Recommendations System
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('ai-preferences-modal');
    const setPreferencesBtn = document.getElementById('set-preferences-btn');
    const refreshBtn = document.getElementById('refresh-recommendations-btn');
    const modalClose = modal?.querySelector('.modal-close');
    const preferencesForm = document.getElementById('preferences-form');

    // Check if user has preferences, if not show modal on first load
    if (!aiEngine.preferences) {
        setTimeout(() => {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
        }, 1500);
    } else {
        aiEngine.renderRecommendations();
    }

    // Open preferences modal
    setPreferencesBtn?.addEventListener('click', () => {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    });

    // Close modal
    modalClose?.addEventListener('click', () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    });

    // Close on background click
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }
    });

    // Handle form submission
    preferencesForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(preferencesForm);
        const activities = formData.getAll('activities');
        
        const preferences = {
            travelStyle: formData.get('travel-style'),
            activities: activities,
            budget: formData.get('budget'),
            climate: formData.get('climate'),
            duration: formData.get('duration'),
            timestamp: new Date().toISOString()
        };

        // Save preferences
        aiEngine.savePreferences(preferences);
        
        // Show loading animation
        const container = document.getElementById('ai-recommendations-grid');
        container.innerHTML = `
            <div class="card ai-card ai-loading">
                <div class="loading-animation">
                    <div class="spinner"></div>
                    <p>🤖 AI is generating personalized recommendations...</p>
                </div>
            </div>
        `;

        // Generate recommendations after delay (simulating AI processing)
        setTimeout(() => {
            aiEngine.renderRecommendations();
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            
            // Scroll to recommendations
            document.querySelector('.ai-recommendations').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 1500);
    });

    // Refresh recommendations
    refreshBtn?.addEventListener('click', () => {
        const container = document.getElementById('ai-recommendations-grid');
        container.innerHTML = `
            <div class="card ai-card ai-loading">
                <div class="loading-animation">
                    <div class="spinner"></div>
                    <p>🤖 Refreshing recommendations...</p>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            aiEngine.renderRecommendations();
        }, 1000);
    });
});

// Global functions for card interactions
function exploreDestination(name) {
    if (typeof showNotification === 'function') {
        showNotification(`Exploring ${name}! Redirecting to details...`, 'info');
    } else {
        alert(`Exploring ${name}! This would navigate to the detailed booking page.`);
    }
    // In real implementation: window.location.href = `destination.html?name=${encodeURIComponent(name)}`;
}

function toggleFavorite(name) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(name);
    
    if (index > -1) {
        favorites.splice(index, 1);
        if (typeof showNotification === 'function') {
            showNotification(`${name} removed from favorites`, 'warning');
        } else {
            alert(`${name} removed from favorites`);
        }
    } else {
        favorites.push(name);
        if (typeof showNotification === 'function') {
            showNotification(`${name} added to favorites ❤️`, 'success');
        } else {
            alert(`${name} added to favorites ❤️`);
        }
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}
