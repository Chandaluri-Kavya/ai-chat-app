let conversationHistory = [];
let isLoading = false;

const messagesEl = document.getElementById("messages");
const inputEl    = document.getElementById("input");
const sendBtn    = document.getElementById("send-btn");
const suggestEl  = document.getElementById("suggestions");

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

function handleKey(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function useChip(btn) {
  inputEl.value = btn.textContent;
  autoResize(inputEl);
  suggestEl.style.display = "none";
  sendMessage();
}

function addMessage(role, text, isError = false) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "msg " + (role === "user" ? "user" : "bot");
  const avatarDiv = document.createElement("div");
  avatarDiv.className = "msg-avatar";
  avatarDiv.innerHTML = role === "user"
    ? '<i class="ti ti-user"></i>'
    : '<i class="ti ti-sparkles"></i>';
  const bubble = document.createElement("div");
  bubble.className = "bubble" + (isError ? " error-bubble" : "");
  bubble.textContent = text;
  msgDiv.appendChild(avatarDiv);
  msgDiv.appendChild(bubble);
  messagesEl.appendChild(msgDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  const msgDiv = document.createElement("div");
  msgDiv.className = "msg bot";
  msgDiv.id = "typing-indicator";
  const avatarDiv = document.createElement("div");
  avatarDiv.className = "msg-avatar";
  avatarDiv.innerHTML = '<i class="ti ti-sparkles"></i>';
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `<div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
  msgDiv.appendChild(avatarDiv);
  msgDiv.appendChild(bubble);
  messagesEl.appendChild(msgDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

async function sendMessage() {
  const userText = inputEl.value.trim();
  if (!userText || isLoading) return;
  suggestEl.style.display = "none";
  isLoading = true;
  sendBtn.disabled = true;
  inputEl.value = "";
  autoResize(inputEl);
  addMessage("user", userText);
  conversationHistory.push({ role: "user", content: userText });
  showTyping();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory })
    });
    const data = await response.json();
    removeTyping();
    if (data.reply) {
      addMessage("bot", data.reply);
      conversationHistory.push({ role: "assistant", content: data.reply });
    } else if (data.error) {
      addMessage("bot", "⚠️ " + data.error, true);
    } else {
      addMessage("bot", "⚠️ Something went wrong. Please try again.", true);
    }
  } catch (err) {
    removeTyping();
    addMessage("bot", "⚠️ Connection error. Please try again.", true);
  }

  isLoading = false;
  sendBtn.disabled = false;
  inputEl.focus();
}
