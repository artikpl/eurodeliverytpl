<?php

namespace App;

use Attribute;

#[Attribute(Attribute::IS_REPEATABLE|Attribute::TARGET_CLASS)]
class Route
{
    public function __construct(
        public readonly string $path,
        public readonly string $method,
    )
    {

    }
}