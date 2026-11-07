package com.example.demo.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result {
    private int code;//状态码
    private String msg;//消息

    private Object data;//数据

    public static Result ok(){
        return new Result(200,"success",null);
    }
    public static Result ok(Object data){
        return new Result(200,"success",data);
    }
    public static Result error(){
        return new Result(500,"error",null);
    }
    public static Result error(String msg){
        return new Result(500,msg,null);
    }
}
