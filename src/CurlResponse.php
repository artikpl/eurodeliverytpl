<?php

namespace App;

readonly class CurlResponse
{
    public function __construct(
        public ?int $code = null,
        public string|int|float|array|\stdClass|null $json = null,
        public ?string $body = null,
        public ?string $type = null,
    )
    {

    }
}