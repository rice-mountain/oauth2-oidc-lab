package com.oauth2lab.resourceserver.model;

public class Message {
    private String content;
    private String scope;
    private String user;
    private long timestamp;

    public Message() {
    }

    public Message(String content, String scope, String user) {
        this.content = content;
        this.scope = scope;
        this.user = user;
        this.timestamp = System.currentTimeMillis();
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
