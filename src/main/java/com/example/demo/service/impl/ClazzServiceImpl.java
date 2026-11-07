package com.example.demo.service.impl;

import com.example.demo.common.Result;
import com.example.demo.dao.ClazzDao;
import com.example.demo.entity.Clazz;
import com.example.demo.service.ClazzService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

@Service
@Transactional
public class ClazzServiceImpl implements ClazzService {

    private final ClazzDao clazzDao;

    public ClazzServiceImpl(ClazzDao clazzDao) {
        this.clazzDao = clazzDao;
    }

    @Override
    public Result queryById(Integer cid) {
        Clazz clazz = clazzDao.getById(cid);
        return Result.ok(clazz);
    }
    @Override
    public Result queryByIdWithStudents(Integer cid) {
        Clazz clazz = clazzDao.getByIdWithStudents(cid);
        return Result.ok(clazz);
    }
    @Override
    public Result add(Clazz clazz) {
        int result = clazzDao.add(clazz);
        return result > 0 ? Result.ok() : Result.error();
    }
    @Override
    public Result update(Clazz clazz) {
        int result = clazzDao.update(clazz);
        return result > 0 ? Result.ok() : Result.error();
    }
    @Override
    public Result delete(Integer cid) {
        int result = clazzDao.delete(cid);
        return result > 0 ? Result.ok() : Result.error("班级不存在或仍有关联学生，无法删除");
    }
    @Override
    public Result queryByCondition(Clazz clazz) {
        Page<Clazz> page = new Page<>(clazz.getPage(), clazz.getPageSize());
        Page<Clazz> result = clazzDao.queryByCondition(page, clazz);
        return Result.ok(result);
    }
}
