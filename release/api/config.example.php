<?php
return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'cpaneluser_event_manager',
        'user' => 'cpaneluser_event_user',
        'password' => 'replace_with_mysql_password',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'admin_name' => 'Administrator',
        'admin_email' => 'owner@example.com',
        'admin_password' => 'replace_with_strong_initial_password',
        'session_name' => 'em_session',
        'cookie_secure' => true,
        'cookie_samesite' => 'Lax',
        'session_lifetime_seconds' => 28800,
    ],
];
