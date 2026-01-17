package com.oauth2lab.resourceserver.controller;

import com.oauth2lab.resourceserver.model.Message;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ResourceController {

    @GetMapping("/public/status")
    public Map<String, Object> publicStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "ok");
        status.put("message", "Public endpoint - no authentication required");
        status.put("timestamp", System.currentTimeMillis());
        return status;
    }

    @GetMapping("/user/info")
    public Map<String, Object> userInfo(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        
        Map<String, Object> info = new HashMap<>();
        info.put("username", authentication.getName());
        info.put("authorities", authentication.getAuthorities());
        info.put("scopes", jwt.getClaim("scope"));
        info.put("claims", jwt.getClaims());
        
        return info;
    }

    @GetMapping("/messages")
    @PreAuthorize("hasAuthority('SCOPE_read')")
    public Message[] getMessages(Authentication authentication) {
        String username = authentication.getName();
        
        return new Message[] {
            new Message("Hello from OAuth2.0 Resource Server!", "read", username),
            new Message("This endpoint requires 'read' scope", "read", username),
            new Message("Access granted with valid JWT token", "read", username)
        };
    }

    @GetMapping("/messages/write")
    @PreAuthorize("hasAuthority('SCOPE_write')")
    public Message createMessage(Authentication authentication) {
        String username = authentication.getName();
        return new Message("Message created successfully", "write", username);
    }

    @GetMapping("/admin/data")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    public Map<String, Object> adminData(Authentication authentication) {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "This is admin-only data");
        data.put("user", authentication.getName());
        data.put("scope", "admin");
        return data;
    }
}
