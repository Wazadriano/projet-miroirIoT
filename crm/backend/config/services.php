<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],


    'n8n' => [
        'token' => env('N8N_TOKEN'),
        'webhook_seance_fin' => env('N8N_WEBHOOK_SEANCE_FIN'),
    ],

    'nocodeur' => [
        'webhook_url' => env('NOCODEUR_WEBHOOK_URL'),
    ],

    'shopify' => [
        'domain' => env('SHOPIFY_DOMAIN'),
        'access_token' => env('SHOPIFY_ACCESS_TOKEN'),
    ],

    'test' => [
        // Development only: email of the test client used by POST /api/seances/test
        'client_email' => env('TEST_CLIENT_EMAIL', 'thomas.mazeau@icloud.com'),
    ],

];
