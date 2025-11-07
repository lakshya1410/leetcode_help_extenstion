// LeetCode Helper Chatbot - Groq Powered
console.log('🚀 LeetCode Helper Chatbot Loaded (Groq API)');

let chatHistory = [];
let currentProblemData = null;

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  setTimeout(addHelpButton, 2000);
}

function addHelpButton() {
  if (document.getElementById('lc-helper-btn')) return;

  // Try multiple container locations
  const container = document.querySelector('[data-track-load="description_content"]') || 
                     document.querySelector('.elfjS') || 
                     document.querySelector('[class*="_16yfq"]') ||
                     document.querySelector('.question-content') ||
                     document.querySelector('[class*="description"]') ||
                     document.querySelector('#qd-content');
  
  if (!container) {
    console.log('Container not found, retrying...');
    setTimeout(addHelpButton, 1000);
    return;
  }

  const btn = document.createElement('button');
  btn.id = 'lc-helper-btn';
  btn.innerHTML = '💬 Ask AI Helper';
  btn.className = 'lc-helper-btn';
  
  // Insert at the beginning
  if (container.firstChild) {
    container.insertBefore(btn, container.firstChild);
  } else {
    container.appendChild(btn);
  }
  
  btn.addEventListener('click', openChat);
  console.log('✅ Help button added successfully!');
}

function openChat() {
  currentProblemData = getProblemData();
  if (!currentProblemData.title) {
    alert('Please wait for problem to load');
    return;
  }
  
  chatHistory = [];
  showChatUI();
}

function getProblemData() {
  // Try multiple selectors for title
  let titleEl = document.querySelector('[data-cy="question-title"]') || 
                document.querySelector('div[class*="text-title"]') ||
                document.querySelector('a[href*="/problems/"]') ||
                document.querySelector('.text-title-large');
  
  // Get title from URL if element not found
  let title = 'LeetCode Problem';
  if (titleEl) {
    title = titleEl.textContent.trim();
  } else {
    // Extract from URL: /problems/add-two-numbers/ -> Add Two Numbers
    const urlMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    if (urlMatch) {
      title = urlMatch[1].split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  // Try multiple selectors for description
  const descEl = document.querySelector('[data-track-load="description_content"]') || 
                 document.querySelector('[class*="elfjS"]') ||
                 document.querySelector('[class*="_16yfq"]') ||
                 document.querySelector('.question-content') ||
                 document.querySelector('[class*="description"]');
  
  // Try multiple selectors for difficulty
  const diffEl = document.querySelector('[diff]') || 
                 document.querySelector('[class*="text-difficulty"]') ||
                 document.querySelector('.text-difficulty-medium') ||
                 document.querySelector('.text-difficulty-easy') ||
                 document.querySelector('.text-difficulty-hard');
  
  // Get all visible text as fallback description
  let description = '';
  if (descEl) {
    description = descEl.textContent.trim().substring(0, 2000);
  } else {
    // Fallback: get problem description from page title
    description = document.title || 'LeetCode Problem';
  }
  
  // Get user's code from the editor
  const userCode = getUserCode();
  
  return {
    title: title,
    description: description,
    difficulty: diffEl ? diffEl.textContent.trim() : 'Medium',
    userCode: userCode
  };
}

function getUserCode() {
  // Try to get code from Monaco Editor (LeetCode's primary editor)
  try {
    // Method 1: Monaco editor instance
    if (window.monaco && window.monaco.editor) {
      const editors = window.monaco.editor.getModels();
      if (editors && editors.length > 0) {
        // Get the first model (usually the code editor)
        const code = editors[0].getValue();
        if (code && code.trim().length > 0) {
          return code;
        }
      }
    }
  } catch (e) {
    console.log('Monaco method failed:', e);
  }
  
  // Method 2: Try to find textarea or contenteditable
  try {
    const codeArea = document.querySelector('.monaco-editor textarea') ||
                     document.querySelector('[class*="code"] textarea') ||
                     document.querySelector('[contenteditable="true"]');
    if (codeArea && codeArea.value) {
      return codeArea.value;
    }
  } catch (e) {
    console.log('Textarea method failed:', e);
  }
  
  // Method 3: Try CodeMirror (older LeetCode)
  try {
    const cmElement = document.querySelector('.CodeMirror');
    if (cmElement && cmElement.CodeMirror) {
      return cmElement.CodeMirror.getValue();
    }
  } catch (e) {
    console.log('CodeMirror method failed:', e);
  }
  
  // Method 4: Try to extract from visible code lines
  try {
    const codeLines = document.querySelectorAll('.view-line');
    if (codeLines.length > 0) {
      const code = Array.from(codeLines).map(line => line.textContent).join('\n');
      if (code.trim().length > 0) {
        return code;
      }
    }
  } catch (e) {
    console.log('View-line method failed:', e);
  }
  
  return null; // No code found
}

function showChatUI() {
  const existing = document.getElementById('lc-chat-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'lc-chat-modal';
  modal.innerHTML = `
    <div class="lc-chat-container">
      <div class="lc-chat-header">
        <div class="lc-header-content">
          <h3>💬 ${currentProblemData.title}</h3>
          <span class="lc-badge lc-badge-${currentProblemData.difficulty.toLowerCase()}">${currentProblemData.difficulty}</span>
        </div>
        <button class="lc-close-btn" onclick="document.getElementById('lc-chat-modal').remove()">×</button>
      </div>
      
      <div class="lc-chat-body" id="lc-chat-body">
        <div class="lc-msg lc-msg-bot">
          <div class="lc-msg-avatar">🤖</div>
          <div class="lc-msg-text">
            <p><strong>Hey! 👋 Main tumhari help karunga.</strong></p>
            <p>Ask me about approach, code, complexity, or interview tips!</p>
          </div>
        </div>
      </div>
      
      <div class="lc-chat-footer">
        <div class="lc-input-row">
          <textarea id="lc-chat-input" placeholder="Type your question..." rows="1"></textarea>
          <button id="lc-send-btn" class="lc-send-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const input = document.getElementById('lc-chat-input');
  const sendBtn = document.getElementById('lc-send-btn');
  
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
  
  sendBtn.addEventListener('click', sendChatMessage);
  input.focus();
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

function sendChatMessage() {
  const input = document.getElementById('lc-chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  input.value = '';
  input.style.height = 'auto';
  
  addChatMessage('user', msg);
  chatHistory.push({ role: 'user', content: msg });
  
  showTyping();
  
  chrome.runtime.sendMessage({
    action: 'chat',
    data: {
      problemData: currentProblemData,
      userMessage: msg,
      chatHistory: chatHistory.slice(0, -1)
    }
  }, (res) => {
    hideTyping();
    if (res && res.success) {
      addChatMessage('bot', res.data);
      chatHistory.push({ role: 'bot', content: res.data });
    } else {
      addChatMessage('bot', '❌ Error: ' + (res?.error || 'Failed to get response'));
    }
  });
}

function addChatMessage(role, text) {
  const body = document.getElementById('lc-chat-body');
  const msg = document.createElement('div');
  msg.className = `lc-msg lc-msg-${role}`;
  msg.innerHTML = `
    <div class="lc-msg-avatar">${role === 'user' ? '👤' : '🤖'}</div>
    <div class="lc-msg-text">${formatMessage(text)}</div>
  `;
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}

function showTyping() {
  const body = document.getElementById('lc-chat-body');
  const typing = document.createElement('div');
  typing.id = 'lc-typing';
  typing.className = 'lc-msg lc-msg-bot';
  typing.innerHTML = `
    <div class="lc-msg-avatar">🤖</div>
    <div class="lc-msg-text">
      <div class="lc-typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  body.appendChild(typing);
  body.scrollTop = body.scrollHeight;
}

function hideTyping() {
  const typing = document.getElementById('lc-typing');
  if (typing) typing.remove();
}

function formatMessage(text) {
  // Handle code blocks first
  text = text.replace(/```(\w+)?\n?([\s\S]+?)```/g, (match, lang, code) => {
    return `<pre class="lc-code"><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Handle inline code
  text = text.replace(/`([^`]+)`/g, '<code class="lc-inline-code">$1</code>');
  
  // Handle bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Handle lists
  text = text.replace(/^- (.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Handle line breaks
  text = text.replace(/\n\n/g, '</p><p>');
  text = text.replace(/\n/g, '<br>');
  
  return `<p>${text}</p>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
