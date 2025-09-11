const API_BASE = 'http://localhost:3001/api/recommendations';

async function makeRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}`);
        }

        return result;
    } catch (error) {
        throw new Error(`Request failed: ${error.message}`);
    }
}

function showResult(elementId, data, isError = false) {
    const element = document.getElementById(elementId);
    element.style.display = 'block';
    element.className = `result ${isError ? 'error' : ''}`;
    element.innerHTML = data;
}

function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span>Loading...';
}

function hideLoading(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
}

async function testRAGRecommendations() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const category = document.getElementById('ragCategory').value;
        const emissions = document.getElementById('ragEmissions').value;
        const userData = document.getElementById('ragUserData').value;
        const debugMode = document.getElementById('ragDebugMode').checked;

        if (!emissions || !userData) {
            throw new Error('Please enter emissions and user data');
        }

        let parsedUserData;
        try {
            parsedUserData = JSON.parse(userData);
        } catch (e) {
            throw new Error('Invalid JSON in user data');
        }

        const result = await makeRequest('/generate', 'POST', {
            category,
            totalEmissions: parseFloat(emissions),
            calculationData: parsedUserData,
            debugMode
        });

        // Parse markdown to HTML
        const parsedRecommendations = marked.parse(result.data.recommendations);
        const parsedSummary = marked.parse(result.data.summary);

        let html = `
            <h3>✅ RAG Recommendations Generated Successfully</h3>
            <p><strong>Category:</strong> ${result.data.category}</p>
            <p><strong>Total Emissions:</strong> ${result.data.totalEmissions} kg CO2</p>
            <p><strong>Session ID:</strong> ${result.data.sessionId}</p>
            <p><strong>Similar Recommendations Found:</strong> ${result.data.similarRecommendations.length}</p>
            
            <h4>📊 Summary</h4>
            <div class="response-content">${parsedSummary}</div>
            
            <h4>🤖 AI Recommendations</h4>
            <div class="response-content">${parsedRecommendations}</div>
        `;

        if (result.data.debug) {
            html += `
                <div class="debug-info">
                    <h4>🔍 Debug Information</h4>
                    <p><strong>User Context:</strong> ${result.data.debug.userContext}</p>
                    <p><strong>Processing Time:</strong> ${result.data.debug.processingTime}ms</p>
                    <p><strong>Vector Search Results:</strong> ${result.data.debug.vectorSearchResults.length} found</p>
                    <pre>${JSON.stringify(result.data.debug, null, 2)}</pre>
                </div>
            `;
        }

        showResult('ragResult', html);
    } catch (error) {
        showResult('ragResult', `<h3>❌ Error</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

async function testVectorSearch() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const query = document.getElementById('searchQuery').value;
        const category = document.getElementById('searchCategory').value;
        const limit = document.getElementById('searchLimit').value;

        if (!query.trim()) {
            throw new Error('Please enter a search query');
        }

        const result = await makeRequest('/search', 'POST', {
            query,
            category,
            limit: parseInt(limit)
        });

        let html = `
            <h3>✅ Vector Search Results</h3>
            <p><strong>Query:</strong> "${query}"</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Results Found:</strong> ${result.data.length}</p>
        `;

        if (result.data.length > 0) {
            html += '<div class="response-content">';
            result.data.forEach((rec, index) => {
                html += `
                    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <h4>${index + 1}. ${rec.title}</h4>
                        <p><strong>Similarity:</strong> ${(rec.similarity * 100).toFixed(1)}%</p>
                        <p><strong>Impact:</strong> ${rec.impact_level} | <strong>Difficulty:</strong> ${rec.difficulty} | <strong>Cost:</strong> ${rec.cost_impact}</p>
                        <p><strong>Content:</strong> ${rec.content}</p>
                        ${rec.context ? `<p><strong>Context:</strong> ${rec.context}</p>` : ''}
                        <p><strong>Tags:</strong> ${rec.tags.join(', ')}</p>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<p>No similar recommendations found.</p>';
        }

        showResult('searchResult', html);
    } catch (error) {
        showResult('searchResult', `<h3>❌ Error</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

async function testPopularRecommendations() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const category = document.getElementById('popularCategory').value;
        const limit = document.getElementById('popularLimit').value;

        const result = await makeRequest(`/popular/${category}?limit=${limit}`);

        let html = `
            <h3>✅ Popular Recommendations</h3>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Results Found:</strong> ${result.data.length}</p>
        `;

        if (result.data.length > 0) {
            html += '<div class="response-content">';
            result.data.forEach((rec, index) => {
                html += `
                    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <h4>${index + 1}. ${rec.title}</h4>
                        <p><strong>Impact:</strong> ${rec.impact_level} | <strong>Difficulty:</strong> ${rec.difficulty} | <strong>Cost:</strong> ${rec.cost_impact}</p>
                        <p><strong>Content:</strong> ${rec.content}</p>
                        ${rec.context ? `<p><strong>Context:</strong> ${rec.context}</p>` : ''}
                        <p><strong>Tags:</strong> ${rec.tags.join(', ')}</p>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<p>No popular recommendations found.</p>';
        }

        showResult('popularResult', html);
    } catch (error) {
        showResult('popularResult', `<h3>❌ Error</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

async function checkHealth() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const result = await makeRequest('/health');

        const html = `
            <h3>✅ Service is Healthy</h3>
            <p><strong>Status:</strong> ${result.status}</p>
            <p><strong>Test Results:</strong> ${result.testResults} recommendations found</p>
        `;

        showResult('healthResult', html);
    } catch (error) {
        showResult('healthResult', `<h3>❌ Service Unhealthy</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenPulse RAG Test Interface loaded');
    
    // Add event listeners to buttons
    document.getElementById('ragTestBtn').addEventListener('click', testRAGRecommendations);
    document.getElementById('searchTestBtn').addEventListener('click', testVectorSearch);
    document.getElementById('popularTestBtn').addEventListener('click', testPopularRecommendations);
    document.getElementById('healthBtn').addEventListener('click', checkHealth);
});
