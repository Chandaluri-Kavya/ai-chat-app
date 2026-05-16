// ===========================
//   AI Chat App — script.js
// ===========================

// ── State ──
let conversationHistory = [];
let isLoading = false;
let API_KEY = localStorage.getItem("groq_api_key") || "";

// ── DOM References ──
const messagesEl  = document.getElementById("messages");
const inputEl     = document.getElementById("input");
const sendBtn     = document.getElementById("send-btn");
const suggestEl   = document.getElementById("suggestions");
const apiBanner   = document.getElementById("api-banner");
const apiKeyInput = document.getElementById("api-key-input");

// ── On Load ──
if (API_KEY) {
  apiBanner.classList.add("hidden");
}

// ── Save API Key ──
function saveApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    alert("Please enter your Groq API key.");
    return;
  }
  if (!key.startsWith("gsk_")) {
    alert("That doesn't look like a Groq API key. It should start with gsk_");
    return;
  }
  API_KEY = key;
  localStorage.setItem("groq_api_key", key);
  apiBanner.classList.add("hidden");
  addMessage("bot", "API key saved! You're all set. Ask me anything 🎉");
}

// ── Auto Resize Textarea ──
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

// ── Handle Enter Key ──
function handleKey(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// ── Use Suggestion Chip ──
function useChip(btn) {
  inputEl.value = btn.textContent;
  autoResize(inputEl);
  suggestEl.style.display = "none";
  sendMessage();
}

// ── Add Message to Chat ──
function addMessage(role, text, isError = false) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "msg " + (role === "user" ? "user" : "bot");

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "msg-avatar";
  avatarDiv.innerHTML =
    role === "user"
      ? '<i class="ti ti-user"></i>'
      : '<i class="ti ti-sparkles"></i>';

  const bubble = document.createElement("div");
  bubble.className = "bubble" + (isError ? " error-bubble" : "");
  bubble.textContent = text;

  msgDiv.appendChild(avatarDiv);
  msgDiv.appendChild(bubble);
  messagesEl.appendChild(msgDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  return bubble;
}

// ── Show Typing Indicator ──
function showTyping() {
  const msgDiv = document.createElement("div");
  msgDiv.className = "msg bot";
  msgDiv.id = "typing-indicator";

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "msg-avatar";
  avatarDiv.innerHTML = '<i class="ti ti-sparkles"></i>';

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `
    <div class="typing">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>`;

  msgDiv.appendChild(avatarDiv);
  msgDiv.appendChild(bubble);
  messagesEl.appendChild(msgDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── Remove Typing Indicator ──
function removeTyping() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

// ── Send Message ──
async function sendMessage() {
  const userText = inputEl.value.trim();
  if (!userText || isLoading) return;

  if (!API_KEY) {
    alert("Please enter your Groq API key in the bar at the top first.");
    return;
  }

  // Hide chips after first message
  suggestEl.style.display = "none";

  // Update UI state
  isLoading = true;
  sendBtn.disabled = true;
  inputEl.value = "";
  autoResize(inputEl);

  // Show user message
  addMessage("user", userText);

  // Add to conversation history
  conversationHistory.push({
    role: "user",
    content: userText
  });

  // Show typing indicator
  showTyping();

  try {
    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a friendly and helpful AI assistant. Keep responses concise and conversational — 1 to 3 short paragraphs. Be warm and engaging."
          },
          ...conversationHistory
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    removeTyping();

    if (data.choices && data.choices[0]) {
      const reply = data.choices[0].message.content;
      addMessage("bot", reply);
      // Add assistant reply to history
      conversationHistory.push({
        role: "assistant",
        content: reply
      });
    } else if (data.error) {
      addMessage("bot", "⚠️ Error: " + data.error.message, true);
    } else {
      addMessage("bot", "⚠️ Something went wrong. Please try again.", true);
    }

  } catch (err) {
    removeTyping();
    addMessage("bot", "⚠️ Connection error. Check your internet and API key.", true);
    console.error("Groq API error:", err);
  }

  // Reset UI state
  isLoading = false;
  sendBtn.disabled = false;
  inputEl.focus();
}