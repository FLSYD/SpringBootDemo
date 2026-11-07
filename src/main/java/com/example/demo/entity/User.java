package com.example.demo.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("users")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private Integer age;

    private String username;

    @JsonIgnore
    @TableField("password_hash")
    private String passwordHash;

    // 以下字段用于原有接口演示，不参与数据库读写。
    @TableField(exist = false)
    private String sex;

    @TableField(exist = false)
    private String phone;

    @TableField(exist = false)
    private String address;

    @TableField(exist = false)
    private String email;
}