const API_BASE = 'http://localhost:3001/api/cohere';

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

async function testBasicEmbedding() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const text = document.getElementById('basicText').value;
        const type = document.getElementById('basicType').value;

        if (!text.trim()) {
            throw new Error('Please enter some text');
        }

        const result = await makeRequest('/test-embedding', 'POST', { text, type });

        const html = `
            <h3>✅ Embedding Generated Successfully</h3>
            <p><strong>Text:</strong> ${result.text}</p>
            <p><strong>Type:</strong> ${result.type}</p>
            <p><strong>Dimensions:</strong> ${result.embedding.dimensions}</p>
            <div class="embedding-preview">
                <strong>First 5 values:</strong> [${result.embedding.firstFiveValues.join(', ')}]
            </div>
        `;

        showResult('basicResult', html);
    } catch (error) {
        showResult('basicResult', `<h3>❌ Error</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

async function testDebugEmbedding() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const text = document.getElementById('debugText').value;
        const type = document.getElementById('debugType').value;

        if (!text.trim()) {
            throw new Error('Please enter some text');
        }

        const result = await makeRequest('/test-embedding-debug', 'POST', { text, type });

        const html = `
            <h3>✅ Debug Embedding Generated</h3>
            <p><strong>Text:</strong> ${result.text}</p>
            <p><strong>Type:</strong> ${result.type}</p>
            <p><strong>Dimensions:</strong> ${result.embedding.dimensions}</p>
            <div class="embedding-preview">
                <strong>First 5 values:</strong> [${result.embedding.firstFiveValues.join(', ')}]
            </div>
            <div class="debug-info">
                <h4>🔍 Debug Information</h4>
                <pre>${JSON.stringify(result.debug, null, 2)}</pre>
            </div>
        `;

        showResult('debugResult', html);
    } catch (error) {
        showResult('debugResult', `<h3>❌ Error</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

async function testRecommendationEmbedding() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const title = document.getElementById('recTitle').value;
        const content = document.getElementById('recContent').value;
        const category = document.getElementById('recCategory').value;
        const context = document.getElementById('recContext').value;
        const tags = document.getElementById('recTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);

        if (!title.trim() || !content.trim()) {
            throw new Error('Please enter title and content');
        }

        const result = await makeRequest('/test-recommendation-embedding', 'POST', {
            title, content, category, context, tags
        });

        const html = `
            <h3>✅ Recommendation Embedding Generated</h3>
            <p><strong>Title:</strong> ${result.recommendation.title}</p>
            <p><strong>Category:</strong> ${result.recommendation.category}</p>
            <p><strong>Context:</strong> ${result.recommendation.context}</p>
            <p><strong>Tags:</strong> ${result.recommendation.tags.join(', ')}</p>
            <p><strong>Dimensions:</strong> ${result.embedding.dimensions}</p>
            <div class="embedding-preview">
                <strong>First 5 values:</strong> [${result.embedding.firstFiveValues.join(', ')}]
            </div>
        `;

        showResult('recResult', html);
    } catch (error) {
        showResult('recResult', `<h3>❌ Error</h3><p>${error.message}</p>`, true);
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
            <p><strong>Test Embedding Dimensions:</strong> ${result.testEmbedding.dimensions}</p>
            <div class="embedding-preview">
                <strong>First 5 values:</strong> [${result.testEmbedding.firstFiveValues.join(', ')}]
            </div>
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
    console.log('GreenPulse Cohere Test Interface loaded');
    
    // Add event listeners to buttons
    document.getElementById('basicTestBtn').addEventListener('click', testBasicEmbedding);
    document.getElementById('debugTestBtn').addEventListener('click', testDebugEmbedding);
    document.getElementById('recTestBtn').addEventListener('click', testRecommendationEmbedding);
    document.getElementById('healthBtn').addEventListener('click', checkHealth);
});
