package com.example.demo.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.example.demo.entity.Clazz;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

@Mapper
public interface ClazzDao { 
    Clazz getById(Integer cid);
    Clazz getByIdWithStudents(Integer cid);

    int add(Clazz clazz);
    int update(Clazz clazz);
    int delete(Integer cid);
    Page<Clazz> queryByCondition(@Param("page") Page<Clazz> page, @Param("clazz") Clazz clazz);
}
