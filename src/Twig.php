<?php

namespace App;

use Twig\Environment;
use Twig\Loader\LoaderInterface;

class Twig extends Environment
{
    private App $app;
    public function __construct(LoaderInterface $loader, array $options = [], ?App $app = null)
    {
        $this->app = $app;
        parent::__construct($loader, $options);
        $this->addExtension(new TwigExtension());
    }

    public function render($name, array $context = []): string
    {
        return parent::render($name, [
            'data' => $context,
            'session' => $this->app->getSession(),
        ]);
    }
}