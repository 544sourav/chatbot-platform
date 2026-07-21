(function () {
  const scriptTag = document.currentScript;
  const botId = scriptTag.getAttribute("data-bot-id");

  const apiBase = "http://localhost:4000";

  if (!botId) {
    console.error("Chat widget: missing data-bot-id attribute");
    return;
  }

  // ---------------- Visitor ID ----------------

  function getVisitorId() {
    const storageKey = "chatwidget_visitor_id";

    let visitorId = localStorage.getItem(storageKey);

    if (!visitorId) {
      visitorId = crypto.randomUUID();

      localStorage.setItem(storageKey, visitorId);
    }

    return visitorId;
  }

  let conversationId = null;

  // ---------------- API ----------------

  async function fetchBotConfig() {
    const res = await fetch(`${apiBase}/bots/${botId}/public-config`);

    const json = await res.json();

    return json.data;
  }

  async function sendMessage(question) {
    const res = await fetch(`${apiBase}/bots/${botId}/chat`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        question,

        visitorId: getVisitorId(),

        conversationId: conversationId || undefined,
      }),
    });

    const json = await res.json();

    conversationId = json.data.conversationId;

    return json.data.answer;
  }

  // ---------------- Message Bubble ----------------

  function addMessageToWindow(container, text, sender) {
    const bubble = document.createElement("div");

    bubble.textContent = text;

    Object.assign(bubble.style, {
      margin: "6px 0",

      padding: "10px 12px",

      borderRadius: "10px",

      maxWidth: "80%",

      wordWrap: "break-word",

      whiteSpace: "pre-wrap",

      lineHeight: "1.4",

      fontSize: "14px",
    });

    if (sender === "user") {
      bubble.style.background = "#e5e7eb";

      bubble.style.marginLeft = "auto";
    } else {
      bubble.style.background = "#f3f4f6";

      bubble.style.marginRight = "auto";
    }

    container.appendChild(bubble);

    container.scrollTop = container.scrollHeight;

    return bubble;
  }

  // ---------------- Typing Loader ----------------

  function createTypingIndicator(container) {
    const bubble = document.createElement("div");

    Object.assign(bubble.style, {
      margin: "6px 0",

      padding: "10px 14px",

      borderRadius: "10px",

      background: "#f3f4f6",

      width: "50px",

      display: "flex",

      gap: "5px",

      alignItems: "center",
    });

    bubble.innerHTML = `

      <span></span>
      <span></span>
      <span></span>

    `;

    const dots = bubble.querySelectorAll("span");

    dots.forEach((dot) => {
      Object.assign(dot.style, {
        width: "8px",

        height: "8px",

        borderRadius: "50%",

        background: "#555",

        opacity: "0.3",
      });
    });

    let active = 0;

    const interval = setInterval(() => {
      dots.forEach((dot, index) => {
        dot.style.opacity = index === active ? "1" : "0.3";
      });

      active = (active + 1) % 3;
    }, 300);

    container.appendChild(bubble);

    container.scrollTop = container.scrollHeight;

    return {
      remove() {
        clearInterval(interval);

        bubble.remove();
      },
    };
  }

  // ---------------- Type Writer ----------------

  function typeMessage(element, text, speed = 30) {
    return new Promise((resolve) => {
      let index = 0;

      element.textContent = "";

      const interval = setInterval(() => {
        element.textContent += text.charAt(index);

        index++;

        element.parentElement.scrollTop = element.parentElement.scrollHeight;

        if (index >= text.length) {
          clearInterval(interval);

          resolve();
        }
      }, speed);
    });
  }

  // ---------------- Chat Window ----------------

  function createChatWindow(bot) {
    const chatWindow = document.createElement("div");

    Object.assign(chatWindow.style, {
      position: "fixed",

      bottom: "90px",

      right: "20px",

      width: "320px",

      height: "420px",

      background: "white",

      border: "1px solid #ddd",

      borderRadius: "12px",

      boxShadow: "0 4px 12px rgba(0,0,0,.15)",

      display: "none",

      flexDirection: "column",

      zIndex: "999999",

      fontFamily: "Arial",
    });

    chatWindow.innerHTML = `


      <div style="
        background:${bot.theme};
        color:white;
        padding:12px;
        border-radius:12px 12px 0 0;
      ">

        <b>${bot.name}</b>

      </div>



      <div class="messages"
        style="
          flex:1;
          padding:12px;
          overflow-y:auto;
        ">

      </div>



      <div style="
        display:flex;
        border-top:1px solid #eee;
      ">


        <input
          class="chat-input"
          placeholder="Type a message..."

          style="
            flex:1;
            padding:10px;
            border:none;
            outline:none;
          "
        />



        <button
          class="chat-send"

          style="
            background:${bot.theme};
            color:white;
            border:none;
            padding:0 16px;
            cursor:pointer;
          "
        >

        Send

        </button>



      </div>

    `;

    document.body.appendChild(chatWindow);

    const messages = chatWindow.querySelector(".messages");

    const input = chatWindow.querySelector(".chat-input");

    const button = chatWindow.querySelector(".chat-send");

    addMessageToWindow(messages, bot.greetingMessage, "bot");

    let sending = false;

    async function handleSend() {
      if (sending) return;

      const question = input.value.trim();

      if (!question) return;

      sending = true;

      button.disabled = true;

      addMessageToWindow(messages, question, "user");

      input.value = "";

      const loader = createTypingIndicator(messages);

      try {
        const answer = await sendMessage(question);

        loader.remove();

        const botBubble = addMessageToWindow(messages, "", "bot");

        await typeMessage(botBubble, answer, 25);
      } catch (err) {
        loader.remove();

        addMessageToWindow(messages, "Something went wrong.", "bot");
      }

      sending = false;

      button.disabled = false;
    }

    button.onclick = handleSend;

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSend();
    });

    return chatWindow;
  }

  // ---------------- Bubble ----------------

  function createBubble(bot, chatWindow) {
    const bubble = document.createElement("button");

    bubble.textContent = "💬";

    Object.assign(bubble.style, {
      position: "fixed",

      right: "20px",

      bottom: "20px",

      width: "60px",

      height: "60px",

      borderRadius: "50%",

      border: "none",

      background: bot.theme,

      color: "white",

      fontSize: "24px",

      cursor: "pointer",

      zIndex: "999999",
    });

    bubble.onclick = () => {
      chatWindow.style.display =
        chatWindow.style.display === "none" ? "flex" : "none";
    };

    document.body.appendChild(bubble);
  }

  // ---------------- Start ----------------

  fetchBotConfig().then((bot) => {
    const chatWindow = createChatWindow(bot);

    createBubble(bot, chatWindow);
  });
})();
