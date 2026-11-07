package com.example.demo.service;

import com.example.demo.common.Result;
import com.example.demo.entity.Clazz;

public interface ClazzService   {
    Result queryById(Integer cid);
    Result queryByIdWithStudents(Integer cid);
    Result add(Clazz clazz);
    Result update(Clazz clazz);
    Result delete(Integer cid);
    Result queryByCondition(Clazz clazz);
}