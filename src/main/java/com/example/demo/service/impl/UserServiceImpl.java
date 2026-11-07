package com.example.demo.service.impl;

import com.example.demo.dao.UserDao;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import com.example.demo.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserDao userDao;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    @Override
    public Result login(String username, String password) {

        // 1. 检查参数。
        if (username == null || username.isBlank()
                || password == null || password.isBlank()) {
            return Result.error("用户名和密码不能为空");
        }

        // 2. 根据用户名查询数据库。
        User user = userDao.getByUsername(username);

        // 3. 检查用户是否存在，并校验密码。
        if (user == null || user.getPasswordHash() == null
                || !passwordEncoder.matches(
                        password, user.getPasswordHash())) {
            return Result.error("用户名或密码错误");
        }

        // 4. 登录成功，生成随机 token。
        String token = UUID.randomUUID()
                .toString()
                .replace("-", "");

        // 5. 保存登录状态，有效期为 30 分钟。
        stringRedisTemplate.opsForValue().set(
                "login:token:" + token,
                user.getId().toString(),
                Duration.ofMinutes(30)
        );

        // 6. 将 token 返回给客户端。
        return Result.ok(token);
    }
    
    @Override
    public Result getById(Long id) {
        User user = userDao.selectById(id);

        if (user == null) {
            return Result.error("用户不存在");
        }

        return Result.ok(user);
    }
    @Override
    public Result logout(String token) {
        // 删除本次登录对应的 Redis 记录。
        stringRedisTemplate.delete("login:token:" + token);

        return Result.ok();
    }
}