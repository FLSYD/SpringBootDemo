package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.entity.Clazz;
import com.example.demo.service.ClazzService;
import org.springframework.dao.DataAccessException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/clazz")
public class ClazzController {
    private final ClazzService clazzService;

    public ClazzController(ClazzService clazzService) {
        this.clazzService = clazzService;
    }

    @GetMapping("getById")
    public Result getById(Integer cid){
        return clazzService.queryById(cid);
    }

    @GetMapping("getByIdWithStudents")
    public Result getByIdWithStudents(Integer cid){
        return clazzService.queryByIdWithStudents(cid);
    }

    @GetMapping("list")
    public Result list(String cname, Integer teacherId, @RequestParam(defaultValue = "1") Integer page, @RequestParam(defaultValue = "10") Integer pageSize) {
        if (teacherId != null && teacherId <= 0) {
            return Result.error("教师编号必须是正整数");
        }
        if (page == null || page < 1) {
            return Result.error("页码必须为正整数");
        }
        if (pageSize == null || pageSize < 1 || pageSize > 100) {
            return Result.error("每页条数必须在1到100之间");
        }

        Clazz condition = new Clazz();
        condition.setCname(cname == null ? null : cname.trim());
        condition.setTeacherId(teacherId);
        condition.setPage(page);
        condition.setPageSize(pageSize);
        return clazzService.queryByCondition(condition);
    }

    @PostMapping("add")
    public Result add(@RequestBody Clazz request) {
        String error = validateClazz(request, false);
        if (error != null) {
            return Result.error(error);
        }

        Clazz clazz = new Clazz();
        clazz.setCname(request.getCname().trim());
        clazz.setTeacherId(request.getTeacherId());
        clazz.setPage(request.getPage());
        clazz.setPageSize(request.getPageSize());
        return clazzService.add(clazz);
    }

    @PutMapping("update")
    public Result update(@RequestBody Clazz request) {
        String error = validateClazz(request, true);
        if (error != null) {
            return Result.error(error);
        }

        Clazz clazz = new Clazz();
        clazz.setCid(request.getCid());
        clazz.setCname(request.getCname().trim());
        clazz.setTeacherId(request.getTeacherId());
        clazz.setPage(request.getPage());
        clazz.setPageSize(request.getPageSize());
        return clazzService.update(clazz);
    }

    @DeleteMapping("delete")
    public Result delete(Integer cid) {
        if (cid == null || cid <= 0) {
            return Result.error("班级编号必须是正整数");
        }
        return clazzService.delete(cid);
    }

    @ExceptionHandler(DataAccessException.class)
    public Result handleDataAccessException() {
        return Result.error("班级数据操作失败，请确认教师编号存在且关联数据无冲突");
    }

    private String validateClazz(Clazz clazz, boolean requireCid) {
        if (clazz == null) {
            return "班级参数不能为空";
        }
        if (requireCid && (clazz.getCid() == null || clazz.getCid() <= 0)) {
            return "班级编号必须是正整数";
        }
        if (clazz.getCname() == null || clazz.getCname().trim().isEmpty()) {
            return "班级名称不能为空";
        }
        if (clazz.getCname().trim().length() > 20) {
            return "班级名称不能超过20个字符";
        }
        if (clazz.getTeacherId() != null && clazz.getTeacherId() <= 0) {
            return "教师编号必须是正整数";
        }
        return null;
    }
}
