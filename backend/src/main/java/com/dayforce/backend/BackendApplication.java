package com.dayforce.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        // Pin the JVM to UTC so that @Future validation and LocalDateTime.now() are
        // evaluated against a known, consistent timezone regardless of the host OS setting.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(BackendApplication.class, args);
    }

}
