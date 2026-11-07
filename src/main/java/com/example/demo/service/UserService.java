package com.example.demo.service;

import com.example.demo.vo.Result;

public interface UserService {

    Result login(String username, String password);

    Result getById(Long id);

    Result logout(String token);
}