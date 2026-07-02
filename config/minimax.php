<?php

return [
    'api_key' => env('MINIMAX_API_KEY'),
    'base_url' => env('MINIMAX_BASE_URL', 'https://api.minimax.io'),
    'default_model' => env('MINIMAX_DEFAULT_MODEL', 'image-01'),
    'timeout' => env('MINIMAX_TIMEOUT', 120),
];
