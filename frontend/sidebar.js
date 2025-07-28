let currentJobDescription = "";
let resumeContent = "";

function addMessageToChat(content, sender = "ai") {
  const chatBox = document.getElementById("chat-box");
  const bubble = document.createElement("div");
  bubble.className = `bubble ${sender}`; // user 或 ai
  bubble.innerText = content;
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight; // 滚动到底部
}

// 恢复之前保存的简历内容
window.addEventListener("DOMContentLoaded", () => {
  const savedResume = localStorage.getItem("resumeText");
  const statusEl = document.getElementById("resume-status");

  if (savedResume) {
    resumeContent = savedResume;
    if (statusEl) {
      statusEl.innerText = "📄 Resume restored from last session.";
    }
    console.log("✅ Resume restored from localStorage");
  }
});

// ✅ 修改这里：接收来自 content.js 的消息
window.addEventListener("message", (event) => {
  // 1️⃣ 处理 JD 信息
  if (event.data.type === "JOB_DESCRIPTION") {
    currentJobDescription = event.data.data;

    const jdBox = document.getElementById("jd-preview");
    if (jdBox) {
      jdBox.innerText = currentJobDescription.slice(0, 1000) + '...'; 
    }
  }

  // 2️⃣ ✅ 处理 收件人信息
  if (event.data.type === "RECIPIENT_INFO") {
    const rBox = document.getElementById("recipient-box");
    const { jobPosterName, jobPosterTitle, companyName, companyLink } = event.data.data;

    if (rBox) {
    // 处理职位发布者名字显示（如果没有，就显示 "No job poster info"）
      let posterInfo = jobPosterName
        ? `<strong>${jobPosterName}</strong> ${jobPosterTitle ? `(${jobPosterTitle})` : ""}`
        : `<em>No job poster info available</em>`;

    // 处理公司信息（如果有公司名则显示链接）
      let companyInfo = companyName
        ? `🏢 <a href="${companyLink}" target="_blank" rel="noopener noreferrer">${companyName}</a>`
        : `<em>No company info found</em>`;

      rBox.innerHTML = `
        ${posterInfo}<br>
        ${companyInfo}
      `;
    }
    console.log("✅ Recipient info received in sidebar");
  }
});

document.getElementById("generate-btn").addEventListener("click", async () => {
  const userInput = document.getElementById("user-input").value;
  const responseBox = document.getElementById("response-box");

  responseBox.innerText = "⏳ Generating email... Please wait.";

  try {
    const payload = {
      job_description: currentJobDescription,     // JD：从页面抓取的
      resume: resumeContent,
      user_prompt: userInput                      // 用户提问
    };

    const res = await fetch("http://localhost:5000/generate_email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const result = await res.json();

    responseBox.innerText = `📧 Generated Email:\n\n${result.generated_email || "(No content returned)"}`;

  } catch (err) {
    console.error("[ERROR] Failed to fetch email:", err);
    responseBox.innerText = "❌ Failed to generate email. Please try again.";
  }
});

document.getElementById("resume-upload").addEventListener("change", function (event) {
  const file = event.target.files[0];
  const statusEl = document.getElementById("resume-status");

  if (!file) {
    statusEl.innerText = "📎 No resume uploaded";
    return;
  }

  const fileType = file.type;

  // === PDF 文件处理 ===
  if (fileType === "application/pdf") {
    resumeContent = "[Resume content from PDF file goes here]";
    localStorage.setItem("resumeText", resumeContent);
    statusEl.innerText = `📄 Uploaded PDF: ${file.name}`;

  // === TXT 文件处理 ===
  } else if (fileType === "text/plain") {
    const reader = new FileReader();
    reader.onload = function (e) {
      resumeContent = e.target.result;
      localStorage.setItem("resumeText", resumeContent);
      statusEl.innerText = `📄 Uploaded TXT: ${file.name}`;
    };
    reader.onerror = function () {
      statusEl.innerText = "❌ Failed to read txt file";
    };
    reader.readAsText(file);

  // === 不支持的文件类型 ===
  } else {
    statusEl.innerText = "❌ Unsupported file type. Only PDF or TXT allowed.";
  }
});

let chatHistory = [];

function addMessage(content, sender) {
  chatHistory.push({ sender, content });
  addMessageToChat(content, sender);
}

