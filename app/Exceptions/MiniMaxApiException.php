<?php

namespace App\Exceptions;

use Exception;

class MiniMaxApiException extends Exception
{
    public function __construct(
        string $message,
        public readonly int $statusCode,
        public readonly int $httpStatus = 200,
    ) {
        parent::__construct($message, $httpStatus);
    }
}
