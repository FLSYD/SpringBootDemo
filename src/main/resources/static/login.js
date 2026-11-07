"use strict";

const loginForm = document.querySelector("#login-form");
const usernameInput = document.querySelector("#login-username");
const passwordInput = document.querySelector("#login-password");
const submitButton = document.querySelector("#login-submit");
const passwordToggle = document.querySelector("#password-toggle");
const loginError = document.querySelector("#login-error");
const loginNotice = document.querySelector("#login-notice");
let submitting = false;

const reason = new URLSearchParams(window.location.search).get("reason");
const notices = {
    required: "请先登录后访问班级管理。",
    expired: "登录已过期，请重新登录。",
    logout: "你已安全退出登录。"
};
if (notices[reason]) {
    loginNotice.textContent = notices[reason];
    loginNotice.hidden = false;
}

function setLoginBusy(busy, label = "登录中…") {
    submitting = busy;
    submitButton.disabled = busy;
    usernameInput.disabled = busy;
    passwordInput.disabled = busy;
    passwordToggle.disabled = busy;
    submitButton.textContent = busy ? label : "登录并进入";
    loginForm.setAttribute("aria-busy", String(busy));
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
}

passwordToggle.addEventListener("click", () => {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    passwordToggle.textContent = show ? "隐藏" : "显示";
    passwordToggle.setAttribute("aria-label", show ? "隐藏密码" : "显示密码");
    passwordToggle.setAttribute("aria-pressed", String(show));
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) {
        return;
    }
    loginError.hidden = true;
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password.trim()) {
        showLoginError("请输入用户名和密码。");
        (!username ? usernameInput : passwordInput).focus();
        return;
    }

    setLoginBusy(true);
    try {
        // 与已有 Controller 一致，提交表单参数而非 JSON。
        const token = await Auth.request("user/login", {
            method: "POST",
            authenticated: false,
            body: new URLSearchParams({ username, password })
        });
        Auth.saveToken(token);
        passwordInput.value = "";
        window.location.replace("index.html");
    } catch (error) {
        showLoginError(error.message);
    } finally {
        setLoginBusy(false);
    }
});

async function resumeSession() {
    try {
        if (!Auth.getToken()) {
            return;
        }
        setLoginBusy(true, "正在验证登录状态…");
        await Auth.request("user/me");
        window.location.replace("index.html");
    } catch (error) {
        showLoginError(error.message);
    } finally {
        setLoginBusy(false);
    }
}

window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        resumeSession();
    }
});
resumeSession();
