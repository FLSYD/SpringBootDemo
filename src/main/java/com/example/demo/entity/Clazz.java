package com.example.demo.entity;

import java.util.List;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
@AllArgsConstructor
@NoArgsConstructor
@Data
public class Clazz {
    private Integer cid;
    private String cname;
    private Integer teacherId;
    private List<Student> students;
    private Integer page;
    private Integer pageSize;
}
