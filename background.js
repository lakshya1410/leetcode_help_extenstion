// Background service worker for LeetCode Helper Extension

// Groq API Configuration
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE'; // Get free key from https://console.groq.com

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'chat') {
    handleChat(request.data)
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('Error in chat:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

async function handleChat(data) {
  const { problemData, userMessage, chatHistory } = data;
  
  // Build system message with problem context and user's code
  let systemContent = `You are a helpful LeetCode problem-solving assistant. Answer in a mix of Hindi and English (Hinglish) naturally.

Current Problem: ${problemData.title}
Difficulty: ${problemData.difficulty}
Problem: ${problemData.description.substring(0, 1500)}`;

  // Add user's code if available
  if (problemData.userCode) {
    systemContent += `\n\nUser's Current Code:\n\`\`\`\n${problemData.userCode}\n\`\`\``;
  }

  systemContent += `\n\nCRITICAL RULES:
- Be concise and clear
- Use Hinglish (Hindi + English mix)
- If user has written code, analyze it and give specific feedback on their code
- NEVER give complete solution or full code UNLESS user explicitly asks for "solution", "code", "complete code", "full solution", "answer", or "solve it"
- By default, only give SHORT HINTS in 2-3 sentences maximum
- Guide them with approach hints, not complete answers
- If they ask "how to solve", "approach", "hint" - give brief hints only (max 3-4 lines)
- Only provide complete code when they specifically request: "give me the code", "show solution", "write the code", "complete solution", etc.
- Keep responses SHORT and to the point - avoid long explanations unless asked
- Be friendly and encouraging but BRIEF`;

  const systemMessage = {
    role: 'system',
    content: systemContent
  };

  // Build message array for Groq
  let messages = [systemMessage];
  
  // Add chat history
  if (chatHistory && chatHistory.length > 0) {
    chatHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }
  
  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage
  });
  
  return await callGroqAPI(messages);
}

async function callGroqAPI(messages) {
  // Groq models - Fast and free!
  const models = [
    'llama-3.3-70b-versatile',      // Best quality
    'llama-3.1-70b-versatile',      // Very fast
    'mixtral-8x7b-32768',           // Long context
    'llama-3.1-8b-instant'          // Fastest
  ];
  
  let lastError = '';

  // Try each model
  for (const model of models) {
    try {
      console.log(`🔄 Trying Groq model: ${model}`);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 0.9,
          stream: false
        })
      });

      const data = await response.json();
      console.log(`📦 Response from ${model}:`, data);

      if (!response.ok) {
        lastError = data.error?.message || `HTTP ${response.status}`;
        console.warn(`❌ Model ${model} failed: ${lastError}`);
        continue;
      }
      
      // Extract response
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        console.log(`✅ Success with model: ${model}`);
        return data.choices[0].message.content;
      }
      
      lastError = 'Invalid response structure';
      console.warn(`⚠️ Model ${model} returned invalid structure`);
      
    } catch (error) {
      lastError = error.message;
      console.warn(`❌ Model ${model} exception:`, error.message);
      continue;
    }
  }
  
  // If all models failed
  throw new Error(`All Groq models failed. Error: ${lastError}. Get free API key at https://console.groq.com/keys`);
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LeetCode Helper Extension installed successfully!');
});