package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.User;

@RestController
public class HelloController {

    @GetMapping("/")
    public String index() {
        return "Spring Boot is running!";
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello, World!";
    }

    @PostMapping("/user")
    public String createUser(@RequestBody User user) {
        System.out.println(user.getName()+user.getAge()+user.getSex()+user.getPhone()+user.getAddress());
        return "User created successfully";
    }

}
