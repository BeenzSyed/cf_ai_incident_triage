const storageKey = "triage-incident-id";
const form = document.querySelector("form");
const input = document.querySelector("#message");
const messages = document.querySelector("#messages");
const status = document.querySelector("#status");
const newIncident = document.querySelector("#new");
const send = form.querySelector("button");

function createIncident() {
  const id = crypto.randomUUID().replaceAll("-", "");
  localStorage.setItem(storageKey, id);
  return id;
}

let incident = localStorage.getItem(storageKey);
if (!/^[a-f0-9]{32}$/.test(incident ?? "")) incident = createIncident();

function render(history) {
  messages.replaceChildren();
  for (const message of history) {
    const article = document.createElement("article");
    article.className = message.role;
    const label = document.createElement("strong");
    label.textContent = message.role === "user" ? "You" : "Triage assistant";
    const content = document.createElement("p");
    content.textContent = message.content;
    article.append(label, content);
    messages.append(article);
  }
}

async function sync(message) {
  send.disabled = newIncident.disabled = true;
  status.textContent = message ? "Preparing triage guidance…" : "Loading incident…";
  try {
    const headers = { "X-Incident-ID": incident };
    const options = { headers };
    if (message) {
      headers["Content-Type"] = "application/json";
      options.method = "POST";
      options.body = JSON.stringify({ message });
    }

    const response = await fetch("/api/chat", options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Could not reach the incident.");
    render(data.messages);
    status.textContent = "";
    if (message && input.value.trim() === message) input.value = "";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    send.disabled = newIncident.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (message && !send.disabled) void sync(message);
});

newIncident.addEventListener("click", () => {
  incident = createIncident();
  render([]);
  input.value = "";
  status.textContent = "New incident started.";
  input.focus();
});

void sync();
