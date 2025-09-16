const API_BASE = 'http://localhost:3001/api/groq';

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

function showResult(elementId, data, isError = false, debugInfo = null) {
    const element = document.getElementById(elementId);
    element.style.display = 'block';
    element.className = `result ${isError ? 'error' : ''}`;
    
    let html = data;
    
    // Add debug information if provided
    if (debugInfo) {
        html += `
            <div class="debug-info">
                <h4>🔍 Debug Information</h4>
                <div class="debug-tabs">
                    <button class="debug-tab active" onclick="showDebugTab('${elementId}', 'formatted')">📄 Formatted Response</button>
                    <button class="debug-tab" onclick="showDebugTab('${elementId}', 'debug')">🔧 Debug Data</button>
                    <button class="debug-tab" onclick="showDebugTab('${elementId}', 'raw')">📋 Raw Response</button>
                </div>
                <div id="${elementId}-formatted" class="debug-content active">
                    ${data}
                </div>
                <div id="${elementId}-debug" class="debug-content">
                    <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
                <div id="${elementId}-raw" class="debug-content">
                    <pre>${JSON.stringify(debugInfo.response?.fullResponse || debugInfo, null, 2)}</pre>
                </div>
            </div>
        `;
    }
    
    element.innerHTML = html;
}

function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span>Loading...';
}

function hideLoading(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
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
            <p><strong>Model:</strong> ${result.model}</p>
            ${result.testResponse ? `<div class="response-content">${result.testResponse}</div>` : ''}
            ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
        `;

        showResult('healthResult', html);
    } catch (error) {
        showResult('healthResult', `<h3>❌ Service Unhealthy</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

async function generateText() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const prompt = document.getElementById('textPrompt').value;
        const systemPrompt = document.getElementById('textSystemPrompt').value;
        const temperature = document.getElementById('textTemperature').value;
        const maxTokens = document.getElementById('textMaxTokens').value;

        if (!prompt.trim()) {
            throw new Error('Please enter a prompt');
        }

        const result = await makeRequest('/generate-text', 'POST', {
            prompt,
            systemPrompt: systemPrompt || null,
            temperature: parseFloat(temperature),
            max_tokens: parseInt(maxTokens)
        });

        // Parse markdown to HTML
        const parsedResponse = marked.parse(result.response);
        
        const html = `
            <h3>✅ Text Generated Successfully</h3>
            <p><strong>Prompt:</strong> ${result.prompt}</p>
            <p><strong>Temperature:</strong> ${result.options.temperature}</p>
            <p><strong>Max Tokens:</strong> ${result.options.max_tokens}</p>
            ${result.options.systemPrompt ? `<p><strong>System Prompt:</strong> ${result.options.systemPrompt}</p>` : ''}
            <div class="response-content">${parsedResponse}</div>
        `;

        showResult('textResult', html);
    } catch (error) {
        showResult('textResult', `<h3>❌ Error</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

async function generateSummary() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const category = document.getElementById('summaryCategory').value;
        const emissions = document.getElementById('summaryEmissions').value;
        const userDataText = document.getElementById('summaryUserData').value;

        if (!category || !emissions || !userDataText.trim()) {
            throw new Error('Please fill in all fields');
        }

        let userData;
        try {
            userData = JSON.parse(userDataText);
        } catch (e) {
            throw new Error('Invalid JSON in user data field');
        }

        const result = await makeRequest('/generate-summary', 'POST', {
            category,
            emissions: parseFloat(emissions),
            userData
        });

        // Parse markdown to HTML
        const parsedSummary = marked.parse(result.summary);
        
        const html = `
            <h3>✅ Summary Generated Successfully</h3>
            <p><strong>Category:</strong> ${result.category}</p>
            <p><strong>Emissions:</strong> ${result.emissions} kg CO2</p>
            <p><strong>Summary Length:</strong> ${result.summary.length} characters</p>
            <div class="response-content">${parsedSummary}</div>
        `;

        // Create debug information
        const debugInfo = {
            request: {
                category,
                emissions: parseFloat(emissions),
                userData
            },
            response: {
                success: result.success,
                category: result.category,
                emissions: result.emissions,
                summaryLength: result.summary.length,
                summaryPreview: result.summary.substring(0, 100) + (result.summary.length > 100 ? '...' : ''),
                fullResponse: result
            }
        };

        showResult('summaryResult', html, false, debugInfo);
    } catch (error) {
        showResult('summaryResult', `<h3>❌ Error</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

async function generateRecommendations() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const category = document.getElementById('recCategory').value;
        const emissions = document.getElementById('recEmissions').value;
        const userDataText = document.getElementById('recUserData').value;
        const similarText = document.getElementById('recSimilar').value;

        if (!category || !emissions || !userDataText.trim()) {
            throw new Error('Please fill in category, emissions, and user data');
        }

        let userData;
        try {
            userData = JSON.parse(userDataText);
        } catch (e) {
            throw new Error('Invalid JSON in user data field');
        }

        let similarRecommendations = [];
        if (similarText.trim()) {
            try {
                similarRecommendations = JSON.parse(similarText);
            } catch (e) {
                throw new Error('Invalid JSON in similar recommendations field');
            }
        }

        const result = await makeRequest('/generate-recommendations', 'POST', {
            category,
            userEmissions: parseFloat(emissions),
            userData,
            similarRecommendations
        });

        // Parse markdown to HTML
        const parsedRecommendations = marked.parse(result.recommendations);
        
        const html = `
            <h3>✅ Recommendations Generated Successfully</h3>
            <p><strong>Category:</strong> ${result.context.category}</p>
            <p><strong>User Emissions:</strong> ${result.context.userEmissions} kg CO2</p>
            <p><strong>Similar Recommendations:</strong> ${result.context.similarRecommendations.length} found</p>
            <p><strong>Recommendations Length:</strong> ${result.recommendations.length} characters</p>
            <div class="response-content">${parsedRecommendations}</div>
        `;

        // Create debug information
        const debugInfo = {
            request: {
                category,
                userEmissions: parseFloat(emissions),
                userData,
                similarRecommendations
            },
            response: {
                success: result.success,
                context: result.context,
                recommendationsLength: result.recommendations.length,
                recommendationsPreview: result.recommendations.substring(0, 200) + (result.recommendations.length > 200 ? '...' : ''),
                fullResponse: result
            }
        };

        showResult('recResult', html, false, debugInfo);
    } catch (error) {
        showResult('recResult', `<h3>❌ Error</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

async function updateModels() {
    const button = event.target;
    const originalText = button.innerHTML;
    showLoading(button);

    try {
        const primaryModel = document.getElementById('newPrimaryModel').value;
        const backupModel = document.getElementById('newBackupModel').value;

        if (!primaryModel.trim() || !backupModel.trim()) {
            throw new Error('Please enter both primary and backup models');
        }

        const result = await makeRequest('/update-models', 'POST', {
            primaryModel,
            backupModel
        });

        // Update the model info display
        document.getElementById('primaryModel').textContent = result.models.primary;
        document.getElementById('backupModel').textContent = result.models.backup;

        const html = `
            <h3>✅ Models Updated Successfully</h3>
            <p><strong>Primary Model:</strong> ${result.models.primary}</p>
            <p><strong>Backup Model:</strong> ${result.models.backup}</p>
        `;

        showResult('modelsResult', html);
    } catch (error) {
        showResult('modelsResult', `<h3>❌ Error</h3><p>${error.message}</p>`, true);
    } finally {
        hideLoading(button, originalText);
    }
}

async function loadModelInfo() {
    try {
        const result = await makeRequest('/models');
        document.getElementById('primaryModel').textContent = result.models.primary;
        document.getElementById('backupModel').textContent = result.models.backup;
    } catch (error) {
        console.error('Failed to load model info:', error);
        document.getElementById('primaryModel').textContent = 'Error loading';
        document.getElementById('backupModel').textContent = 'Error loading';
    }
}

// Function to add server logs to debug info
function addServerLogs(debugInfo, response) {
    if (response.serverLogs) {
        debugInfo.serverLogs = response.serverLogs;
    }
    return debugInfo;
}

// Function to switch between debug tabs
function showDebugTab(elementId, tabType) {
    // Hide all debug content for this element
    const contents = document.querySelectorAll(`#${elementId}-formatted, #${elementId}-debug, #${elementId}-raw`);
    contents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs for this element
    const tabs = document.querySelectorAll(`#${elementId}-formatted, #${elementId}-debug, #${elementId}-raw`);
    tabs.forEach(tab => {
        const button = tab.previousElementSibling?.querySelector('.debug-tab');
        if (button) button.classList.remove('active');
    });
    
    // Show selected content
    const selectedContent = document.getElementById(`${elementId}-${tabType}`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Add active class to clicked tab
    const clickedTab = event.target;
    clickedTab.classList.add('active');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenPulse Groq Test Interface loaded');
    
    // Load current model configuration
    loadModelInfo();
    
    // Add event listeners to buttons
    document.getElementById('healthBtn').addEventListener('click', checkHealth);
    document.getElementById('textGenBtn').addEventListener('click', generateText);
    document.getElementById('summaryBtn').addEventListener('click', generateSummary);
    document.getElementById('recBtn').addEventListener('click', generateRecommendations);
    document.getElementById('updateModelsBtn').addEventListener('click', updateModels);
});
