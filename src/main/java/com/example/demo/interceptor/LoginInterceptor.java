package com.example.demo.interceptor;

import com.example.demo.vo.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@Component
public class LoginInterceptor implements HandlerInterceptor {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws Exception {

        // 1. 读取请求头中的登录凭证。
        String authorization = request.getHeader("Authorization");

        if (authorization == null
                || !authorization.regionMatches(
                        true, 0, "Bearer ", 0, 7)) {
            return reject(response);
        }

        // 2. 去掉 Bearer 前缀，得到 token。
        String token = authorization.substring(7).trim();

        if (token.isEmpty()) {
            return reject(response);
        }

        // 3. 根据 token 查询 Redis 中的登录状态。
        String userId = stringRedisTemplate.opsForValue()
                .get("login:token:" + token);

        if (userId == null) {
            return reject(response);
        }

        // 4. 将当前登录用户 ID 放入本次请求。
        try {
            request.setAttribute(
                    "loginUserId", Long.valueOf(userId));
        } catch (NumberFormatException exception) {
            return reject(response);
        }

        // 5. 保存本次 token，供后续接口使用。
        request.setAttribute("loginToken", token);

        // 6. 校验通过，继续执行 Controller。
        return true;
    }

    private boolean reject(
            HttpServletResponse response) throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");

        Result result =
                new Result(401, "未登录或登录已过期", null);

        response.getWriter()
                .write(objectMapper.writeValueAsString(result));

        return false;
    }
}