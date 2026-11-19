<?php

return [
    'enabled' => env('AI_ENABLED', false),
    'key' => env('COHERE_API_KEY'),
    // Versioned pretrained models; no training or fine-tuning is performed here.
    'embedding_model' => 'embed-multilingual-v3.0',
    'language_model' => 'command-a-03-2025',
    'timeout' => 25,
    'notice_version' => 'cohere-employment-v1',
];
