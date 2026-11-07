"use strict";

// 登录页和班级页共用请求方法，统一携带 token、处理登录过期。
window.Auth = (() => {
    const TOKEN_KEY = "springboot-demo-token";

    function getToken() {
        return sessionStorage.getItem(TOKEN_KEY);
    }

    function saveToken(token) {
        if (typeof token !== "string" || !token) {
            throw new Error("登录接口未返回有效凭证，请重试。");
        }
        sessionStorage.setItem(TOKEN_KEY, token);
    }

    function clearToken() {
        sessionStorage.removeItem(TOKEN_KEY);
    }

    function toLogin(reason = "required") {
        window.location.replace(`login.html?reason=${encodeURIComponent(reason)}`);
    }

    async function request(path, options = {}) {
        const { authenticated = true, ...fetchOptions } = options;
        const token = authenticated ? getToken() : null;
        if (authenticated && !token) {
            toLogin();
            throw new Error("请先登录。");
        }

        const headers = new Headers(fetchOptions.headers);
        headers.set("Accept", "application/json");
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        let response;
        try {
            response = await fetch(path, {
                ...fetchOptions,
                headers,
                cache: "no-store",
                signal: AbortSignal.timeout(10000)
            });
        } catch (error) {
            throw new Error(error.name === "TimeoutError"
                ? "请求超时，请稍后重试。"
                : "暂时无法连接服务，请检查连接后重试。");
        }

        let payload;
        try {
            payload = await response.json();
        } catch {
            throw new Error(`服务返回异常（HTTP ${response.status}），请稍后重试。`);
        }

        if (response.status === 401 || payload?.code === 401) {
            if (authenticated && token === getToken()) {
                clearToken();
                toLogin("expired");
            }
            throw new Error("登录已过期，请重新登录。");
        }
        if (!response.ok || payload?.code !== 200) {
            throw new Error(payload?.msg || `请求失败（HTTP ${response.status}）`);
        }
        return payload.data;
    }

    return { getToken, saveToken, clearToken, toLogin, request };
})();
