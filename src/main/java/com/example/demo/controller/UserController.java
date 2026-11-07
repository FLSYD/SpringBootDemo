package com.example.demo.controller;

import com.example.demo.service.UserService;
import com.example.demo.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public Result login(
            @RequestParam("username") String username,
            @RequestParam("password") String password) {

        return userService.login(username, password);
    }
    
    @GetMapping("/me")
    public Result me(
            @RequestAttribute("loginUserId") Long userId) {

        return userService.getById(userId);
    }
    
    @PostMapping("/logout")
    public Result logout(
            @RequestAttribute("loginToken") String token) {

        return userService.logout(token);
    }
}
